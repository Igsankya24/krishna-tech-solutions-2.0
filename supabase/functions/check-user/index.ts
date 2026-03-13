import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { login_id } = await req.json();

    if (!login_id || login_id.trim().length === 0) {
      return new Response(JSON.stringify({ exists: false }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const trimmed = login_id.trim();
    const isEmail = trimmed.includes("@");

    // Look up user
    let userId: string | null = null;

    if (isEmail) {
      const { data } = await supabaseAdmin
        .from("profiles")
        .select("user_id")
        .eq("email", trimmed)
        .maybeSingle();
      userId = data?.user_id || null;
    } else {
      const { data } = await supabaseAdmin
        .from("profiles")
        .select("user_id")
        .ilike("username", trimmed)
        .maybeSingle();
      userId = data?.user_id || null;
    }

    if (!userId) {
      return new Response(JSON.stringify({ exists: false, auth_method: "password", totp_enabled: false }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check global auth method setting
    const { data: authMethodSetting } = await supabaseAdmin
      .from("site_settings")
      .select("value")
      .eq("key", "auth_method")
      .maybeSingle();

    const authMethod = authMethodSetting?.value || "password";

    // Check if TOTP is set up for this user
    let totpEnabled = false;
    if (authMethod === "authenticator") {
      const { data: totp } = await supabaseAdmin
        .from("totp_secrets")
        .select("is_enabled")
        .eq("user_id", userId)
        .maybeSingle();
      totpEnabled = totp?.is_enabled || false;
    }

    return new Response(
      JSON.stringify({ exists: true, auth_method: authMethod, totp_enabled: totpEnabled }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in check-user:", error);
    return new Response(JSON.stringify({ exists: false }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
