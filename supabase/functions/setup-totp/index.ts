import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base32Encode } from "https://deno.land/std@0.168.0/encoding/base32.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function generateSecret(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return base32Encode(bytes);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Verify requesting user is admin/super_admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: requestingUser }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !requestingUser) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", requestingUser.id);

    const isAdmin = roles?.some((r: any) => r.role === "admin" || r.role === "super_admin");
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { user_id } = await req.json();

    if (!user_id) {
      return new Response(JSON.stringify({ error: "user_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate TOTP secret
    const secret = generateSecret();

    // Upsert into totp_secrets
    const { error: upsertError } = await supabaseAdmin
      .from("totp_secrets")
      .upsert(
        { user_id, secret, is_enabled: true, updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      );

    if (upsertError) {
      console.error("Error saving TOTP secret:", upsertError);
      return new Response(JSON.stringify({ error: "Failed to save TOTP secret" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user email for the otpauth URI
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email, username")
      .eq("user_id", user_id)
      .maybeSingle();

    const accountName = profile?.username || profile?.email || user_id;
    const issuer = "KrishnaTech";
    const otpauthUri = `otpauth://totp/${issuer}:${accountName}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;

    return new Response(
      JSON.stringify({ success: true, secret, otpauth_uri: otpauthUri }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in setup-totp:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
