// approve-trade-user
// Called by admin action with { application_id } in the request body.
// 1. Reads the trade application.
// 2. Creates a Supabase auth user (magic link / OTP) with role metadata.
// 3. Inserts a user_profiles row with role='trade', status='approved'.
// 4. Updates trade_applications.status = 'approved'.
// 5. Sends a welcome email with a magic sign-in link.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const SITE_URL       = Deno.env.get("SITE_URL") ?? "https://gcwines.com";

serve(async (req) => {
  try {
    const { application_id } = await req.json();
    if (!application_id) throw new Error("application_id required");

    // 1. Fetch application
    const { data: app, error: appErr } = await supabaseAdmin
      .from("trade_applications")
      .select("*")
      .eq("id", application_id)
      .single();
    if (appErr || !app) throw new Error(`Application not found: ${appErr?.message}`);

    // 2. Create auth user — invite link approach
    const { data: inviteData, error: inviteErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      app.email ?? `${app.full_name.toLowerCase().replace(/\s+/g, ".")}@trade.placeholder`,
      {
        data: {
          role: "trade",
          full_name: app.full_name,
        },
        redirectTo: `${SITE_URL}/trade/dashboard`,
      }
    );
    if (inviteErr) throw new Error(`Auth user creation failed: ${inviteErr.message}`);
    const userId = inviteData.user.id;

    // 3. Insert user_profiles
    await supabaseAdmin.from("user_profiles").insert({
      id:        userId,
      role:      "trade",
      status:    "approved",
      full_name: app.full_name,
    });

    // 4. Update application status
    await supabaseAdmin.from("trade_applications")
      .update({ status: "approved", reviewed_at: new Date().toISOString() })
      .eq("id", application_id);

    // 5. Send welcome email via Resend
    if (RESEND_API_KEY && app.email) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from:    "GC Wines Trade Portal <trade@gcwines.com>",
          to:      [app.email],
          subject: "Your GC Wines Trade Access Has Been Approved",
          html: `
            <h2>Welcome to the GC Wines Trade Portal</h2>
            <p>Dear ${app.full_name},</p>
            <p>Your application for trade access has been approved. You may now access the Trade Portal using the link below.</p>
            <p>An invitation email has been sent to this address. Please follow the link in that email to set up your access.</p>
            <p>Once signed in, you will have access to our full trade portfolio, pricing, event invitations, and market intelligence.</p>
            <p>If you have any questions, please contact your account manager directly.</p>
            <p>With regards,<br>GC Wines Trade Team</p>
          `,
        }),
      });
    }

    return new Response(JSON.stringify({ ok: true, user_id: userId }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("approve-trade-user error:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
