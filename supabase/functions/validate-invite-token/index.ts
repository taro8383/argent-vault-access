// validate-invite-token
// Called from SocietyGate.tsx with { token } in the request body.
// Validates the token against society_invite_tokens.
// Does NOT mark used=true here — that only happens after application submission.
// Returns: { valid: boolean, tier?: string, email?: string }

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const corsHeaders = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { token } = await req.json();
    if (!token) {
      return new Response(JSON.stringify({ valid: false, reason: "No token provided" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data, error } = await supabaseAdmin
      .from("society_invite_tokens")
      .select("id, token, email, tier, used, expires_at")
      .eq("token", token)
      .single();

    if (error || !data) {
      return new Response(JSON.stringify({ valid: false, reason: "Token not found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (data.used) {
      return new Response(JSON.stringify({ valid: false, reason: "Token already used" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return new Response(JSON.stringify({ valid: false, reason: "Token expired" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ valid: true, tier: data.tier ?? null, email: data.email ?? null }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("validate-invite-token error:", err);
    return new Response(JSON.stringify({ valid: false, reason: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
