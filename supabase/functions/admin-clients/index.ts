import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OWNER_EMAIL = "digiformationltd@gmail.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return json({ error: "Backend is not configured" }, 500);
    }

    const authHeader = req.headers.get("Authorization") || "";
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: authData, error: authError } = await userClient.auth.getUser();
    if (authError || !authData.user) return json({ error: "Login required" }, 401);

    const requesterEmail = authData.user.email?.toLowerCase() || "";
    const { data: role } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", authData.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (requesterEmail !== OWNER_EMAIL && !role) {
      return json({ error: "Admin access required" }, 403);
    }

    let page = 1;
    let totalPages = 1;
    const authUsers: Array<{ id: string; email?: string | null; raw_user_meta_data?: Record<string, unknown> | null; created_at?: string }> = [];

    do {
      const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) return json({ error: error.message }, 500);
      authUsers.push(...data.users);
      totalPages = Math.max(1, Math.ceil((data.total || data.users.length) / 1000));
      page += 1;
    } while (page <= totalPages);

    const profileRows = authUsers
      .filter((user) => !!user.email)
      .map((user) => {
        const meta = user.raw_user_meta_data || {};
        const fullName = String(meta.full_name || meta.name || user.email?.split("@")[0] || "");
        return {
          user_id: user.id,
          full_name: fullName,
          email: user.email,
          avatar_initials: fullName.slice(0, 2).toUpperCase(),
        };
      });

    if (profileRows.length > 0) {
      await adminClient.from("profiles").upsert(profileRows, { onConflict: "user_id", ignoreDuplicates: true });
      await adminClient.from("user_roles").upsert(
        profileRows.map((profile) => ({ user_id: profile.user_id, role: "client" })),
        { onConflict: "user_id,role", ignoreDuplicates: true },
      );
    }

    const { data: profiles, error: profilesError } = await adminClient
      .from("profiles")
      .select("user_id, full_name, email, phone, company_name, created_at")
      .order("created_at", { ascending: false });

    if (profilesError) return json({ error: profilesError.message }, 500);

    const { data: roles, error: rolesError } = await adminClient
      .from("user_roles")
      .select("user_id, role");

    if (rolesError) return json({ error: rolesError.message }, 500);

    const adminIds = new Set((roles || []).filter((r: any) => r.role === "admin").map((r: any) => r.user_id));
    const clients = (profiles || []).filter((p: any) => !adminIds.has(p.user_id));

    return json({ clients, totalAuthUsers: authUsers.length, totalProfiles: profiles?.length || 0 });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}