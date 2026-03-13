import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decode as base32Decode } from "https://deno.land/std@0.168.0/encoding/base32.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiter
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW = 60000;

function isRateLimited(identifier: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + RATE_WINDOW });
    return false;
  }
  if (entry.count >= RATE_LIMIT) return true;
  entry.count++;
  return false;
}

// TOTP generation using Web Crypto API
async function generateTOTP(secret: string, timeStep: number): Promise<string> {
  const secretBytes = base32Decode(secret);

  const time = Math.floor(timeStep);
  const timeBuffer = new ArrayBuffer(8);
  const timeView = new DataView(timeBuffer);
  timeView.setUint32(4, time, false);

  const key = await crypto.subtle.importKey(
    "raw",
    secretBytes,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, timeBuffer);
  const hmac = new Uint8Array(signature);

  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  return (code % 1000000).toString().padStart(6, "0");
}

async function verifyTOTP(secret: string, token: string): Promise<boolean> {
  const now = Math.floor(Date.now() / 1000);
  // Check current window and ±1 window (30 second tolerance)
  for (let i = -1; i <= 1; i++) {
    const timeStep = Math.floor((now + i * 30) / 30);
    const expected = await generateTOTP(secret, timeStep);
    if (expected === token) return true;
  }
  return false;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { login_id, totp_code } = await req.json();

    if (!login_id || !totp_code) {
      return new Response(JSON.stringify({ error: "Login ID and TOTP code are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Rate limit by login_id
    if (isRateLimited(login_id)) {
      return new Response(JSON.stringify({ error: "Too many attempts. Please wait a minute." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine if login_id is email or username
    const isEmail = login_id.includes("@");
    let userId: string | null = null;
    let userEmail: string | null = null;

    if (isEmail) {
      // Look up by email
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("user_id, email")
        .eq("email", login_id)
        .maybeSingle();

      if (profile) {
        userId = profile.user_id;
        userEmail = profile.email;
      }
    } else {
      // Look up by username (case-insensitive)
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("user_id, email")
        .ilike("username", login_id)
        .maybeSingle();

      if (profile) {
        userId = profile.user_id;
        userEmail = profile.email;
      }
    }

    if (!userId) {
      // Generic error to prevent user enumeration
      return new Response(JSON.stringify({ error: "Invalid credentials" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if account is frozen
    const { data: profileData } = await supabaseAdmin
      .from("profiles")
      .select("is_frozen")
      .eq("user_id", userId)
      .maybeSingle();

    if (profileData?.is_frozen) {
      return new Response(JSON.stringify({ error: "Account is frozen. Contact admin." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get TOTP secret
    const { data: totpData } = await supabaseAdmin
      .from("totp_secrets")
      .select("secret, is_enabled")
      .eq("user_id", userId)
      .maybeSingle();

    if (!totpData || !totpData.is_enabled) {
      return new Response(JSON.stringify({ error: "Authenticator not set up for this account" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify TOTP code
    const isValid = await verifyTOTP(totpData.secret, totp_code.trim());

    if (!isValid) {
      return new Response(JSON.stringify({ error: "Invalid authenticator code" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // TOTP is valid - generate a session for the user
    // We use admin.generateLink to create a magic link, then exchange it
    // Alternative: use a known password stored for the user
    
    // Get the user's actual password hash - we'll use admin API to sign them in
    // Since we can't sign in without password, we'll use a workaround:
    // Generate a temporary password, update the user, sign in, then restore
    
    // Better approach: Use admin.generateLink with type 'magiclink'
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: userEmail!,
    });

    if (linkError || !linkData) {
      console.error("Error generating session:", linkError);
      return new Response(JSON.stringify({ error: "Authentication failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract the token from the link and verify it to get session
    const properties = linkData.properties;
    const hashedToken = properties?.hashed_token;

    if (!hashedToken) {
      return new Response(JSON.stringify({ error: "Authentication failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the OTP to get an actual session
    const { data: sessionData, error: verifyError } = await supabaseAdmin.auth.verifyOtp({
      token_hash: hashedToken,
      type: "magiclink",
    });

    if (verifyError || !sessionData.session) {
      console.error("Error verifying OTP:", verifyError);
      return new Response(JSON.stringify({ error: "Authentication failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        session: sessionData.session,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in verify-totp:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
