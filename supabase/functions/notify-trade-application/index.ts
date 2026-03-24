// notify-trade-application
// Triggered via Supabase Database Webhook on INSERT to trade_applications.
// Sends an admin notification email via Supabase Auth Admin email API.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") ?? "admin@gcwines.com";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";

serve(async (req) => {
  try {
    const body = await req.json();
    const record = body.record ?? body; // Supabase webhook wraps in { type, record }

    const {
      full_name,
      professional_title,
      property_name,
      property_type,
      market_country,
      annual_spend,
      requirements,
      created_at,
    } = record;

    const subject = `New Trade Application — ${full_name}, ${property_name}`;
    const html = `
      <h2>New Trade Portal Application</h2>
      <table cellpadding="6" style="font-family: Arial, sans-serif; font-size: 14px;">
        <tr><td><strong>Name</strong></td><td>${full_name}</td></tr>
        <tr><td><strong>Title</strong></td><td>${professional_title}</td></tr>
        <tr><td><strong>Property</strong></td><td>${property_name} (${property_type})</td></tr>
        <tr><td><strong>Market</strong></td><td>${market_country}</td></tr>
        <tr><td><strong>Annual Spend</strong></td><td>${annual_spend}</td></tr>
        <tr><td><strong>Submitted</strong></td><td>${new Date(created_at).toLocaleString("en-AU")}</td></tr>
      </table>
      <p><strong>Requirements:</strong><br>${requirements}</p>
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
    console.error("notify-trade-application error:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
