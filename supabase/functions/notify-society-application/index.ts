// notify-society-application
// Triggered via Supabase Database Webhook on INSERT to society_applications.
// Sends an admin notification email via Resend.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ADMIN_EMAIL   = Deno.env.get("ADMIN_EMAIL") ?? "admin@gcwines.com";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";

const TIER_LABELS: Record<string, string> = {
  founding:  "Founding Member (AUD $2,500/yr)",
  private:   "Private Member (AUD $3,500/yr)",
  collector: "Collector Member (AUD $10,500/yr)",
};

serve(async (req) => {
  try {
    const body = await req.json();
    const record = body.record ?? body;

    const {
      full_name,
      email,
      phone,
      selected_tier,
      delivery_address,
      invite_token,
      referral_source,
      created_at,
    } = record;

    const addr = delivery_address
      ? `${delivery_address.line1}, ${delivery_address.city} ${delivery_address.postcode}, ${delivery_address.country}`
      : "Not provided";

    const subject = `New Society Application — ${full_name} (${TIER_LABELS[selected_tier] ?? selected_tier})`;
    const html = `
      <h2>New Private Allocation Society Application</h2>
      <table cellpadding="6" style="font-family: Arial, sans-serif; font-size: 14px;">
        <tr><td><strong>Name</strong></td><td>${full_name}</td></tr>
        <tr><td><strong>Email</strong></td><td>${email}</td></tr>
        <tr><td><strong>Phone</strong></td><td>${phone ?? "—"}</td></tr>
        <tr><td><strong>Selected Tier</strong></td><td>${TIER_LABELS[selected_tier] ?? selected_tier}</td></tr>
        <tr><td><strong>Delivery</strong></td><td>${addr}</td></tr>
        <tr><td><strong>Invite Token</strong></td><td>${invite_token ?? "None (waitlist)"}</td></tr>
        <tr><td><strong>Referral</strong></td><td>${referral_source ?? "—"}</td></tr>
        <tr><td><strong>Submitted</strong></td><td>${new Date(created_at).toLocaleString("en-AU")}</td></tr>
      </table>
      <p><a href="${Deno.env.get("ADMIN_URL") ?? "#"}/admin">Review in Admin Panel →</a></p>
    `;

    if (RESEND_API_KEY) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from:    "GC Wines <noreply@gcwines.com>",
          to:      [ADMIN_EMAIL],
          subject,
          html,
        }),
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("notify-society-application error:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
