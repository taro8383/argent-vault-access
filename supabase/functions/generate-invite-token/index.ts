// generate-invite-token
// Called from Admin panel to create a new society invite token.
// Request body: { email?: string, tier?: string, expires_in_days?: number }
// Returns: { token, invite_url }

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const SITE_URL = Deno.env.get("SITE_URL") ?? "https://gcwines.com";

const corsHeaders = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify caller is an admin
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authErr } = await supabaseUser.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const { data: profile } = await supabaseAdmin
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role !== "admin") {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const { email, tier, expires_in_days } = body;

    const expiresAt = expires_in_days
      ? new Date(Date.now() + expires_in_days * 86400000).toISOString()
      : null;

    // Insert and let Postgres generate the token via DEFAULT encode(gen_random_bytes(32),'hex')
    const { data: tokenRow, error: insertErr } = await supabaseAdmin
      .from("society_invite_tokens")
      .insert({
        email:      email   ?? null,
        tier:       tier    ?? null,
        expires_at: expiresAt,
        created_by: user.id,
      })
      .select("token")
      .single();

    if (insertErr || !tokenRow) throw new Error(insertErr?.message ?? "Insert failed");

    const inviteUrl = `${SITE_URL}/society?invite=${tokenRow.token}`;

    return new Response(
      JSON.stringify({ token: tokenRow.token, invite_url: inviteUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("generate-invite-token error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
