import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const BACKUP_TABLES = [
  "services",
  "appointments",
  "coupons",
  "contact_messages",
  "profiles",
  "user_roles",
  "user_access",
  "admin_permissions",
  "notifications",
  "site_settings",
  "technicians",
  "testimonials",
  "team_members",
  "service_projects",
  "blog_posts",
  "blog_categories",
  "blog_tags",
  "blog_post_tags",
  "blog_ads",
  "invoices",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Determine backup type from request body or default to scheduled
    let backupType = "scheduled";
    let createdBy: string | null = null;

    try {
      const body = await req.json();
      backupType = body.backup_type || "scheduled";
      createdBy = body.created_by || null;
    } catch {
      // No body = scheduled invocation
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // For scheduled invocations, check the backup_schedule setting
    if (backupType === "scheduled") {
      const { data: setting } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "backup_schedule")
        .maybeSingle();

      const schedule = setting?.value || "daily";

      if (schedule === "disabled") {
        return new Response(
          JSON.stringify({ skipped: true, reason: "Automatic backups are disabled" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check last backup time to determine if we should run
      const { data: lastBackup } = await supabase
        .from("backup_metadata")
        .select("created_at")
        .eq("backup_type", "scheduled")
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastBackup) {
        const lastTime = new Date(lastBackup.created_at).getTime();
        const now = Date.now();
        const hoursSinceLast = (now - lastTime) / (1000 * 60 * 60);

        let shouldRun = false;
        if (schedule === "hourly" && hoursSinceLast >= 0.9) shouldRun = true;
        else if (schedule === "daily" && hoursSinceLast >= 23) shouldRun = true;
        else if (schedule === "weekly" && hoursSinceLast >= 167) shouldRun = true;

        if (!shouldRun) {
          return new Response(
            JSON.stringify({ skipped: true, reason: `Schedule is ${schedule}, last backup was ${hoursSinceLast.toFixed(1)}h ago` }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    // If manual, verify the caller is a super admin
    if (backupType === "manual") {
      const authHeader = req.headers.get("Authorization");
      if (authHeader) {
        const token = authHeader.replace("Bearer ", "");
        const { data: { user }, error: userErr } = await supabase.auth.getUser(token);
        if (userErr || !user) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        createdBy = user.id;
      }
    }

    // Export all tables
    const backupData: Record<string, unknown[]> = {};
    let totalRecords = 0;

    for (const table of BACKUP_TABLES) {
      const { data, error } = await supabase.from(table).select("*");
      if (error) {
        console.warn(`Skipping table ${table}: ${error.message}`);
        backupData[table] = [];
      } else {
        backupData[table] = data || [];
        totalRecords += (data || []).length;
      }
    }

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const fileName = `backup-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}-${pad(now.getMinutes())}.json`;

    const backup = {
      meta: {
        version: "1.0.0",
        created_at: now.toISOString(),
        tables: BACKUP_TABLES,
        record_count: totalRecords,
        backup_type: backupType,
      },
      data: backupData,
    };

    const jsonStr = JSON.stringify(backup, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from("backups")
      .upload(fileName, blob, { contentType: "application/json", upsert: false });

    if (uploadError) {
      await supabase.from("backup_metadata").insert({
        file_name: fileName,
        file_size: jsonStr.length,
        record_count: totalRecords,
        tables_included: BACKUP_TABLES,
        status: "failed",
        backup_type: backupType,
        created_by: createdBy,
        error_message: uploadError.message,
      });

      return new Response(
        JSON.stringify({ error: "Upload failed", details: uploadError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await supabase.from("backup_metadata").insert({
      file_name: fileName,
      file_size: jsonStr.length,
      record_count: totalRecords,
      tables_included: BACKUP_TABLES,
      status: "completed",
      backup_type: backupType,
      created_by: createdBy,
    });

    return new Response(
      JSON.stringify({
        success: true,
        file_name: fileName,
        record_count: totalRecords,
        tables: BACKUP_TABLES.length,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
