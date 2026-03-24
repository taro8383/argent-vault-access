// approve-society-member
// Called by admin action with { application_id } in the request body.
// 1. Reads the society application.
// 2. Creates a Supabase auth user (invite).
// 3. Inserts user_profiles row with role='society', status='approved'.
// 4. Inserts society_members row.
// 5. Triggers Stripe subscription creation via create-stripe-subscription.
// 6. Updates society_applications.status = 'approved'.
// 7. Sends welcome email.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const SITE_URL       = Deno.env.get("SITE_URL") ?? "https://gcwines.com";

const TIER_FEES: Record<string, number> = {
  founding:  2500,
  private:   3500,
  collector: 10500,
};

serve(async (req) => {
  try {
    const { application_id } = await req.json();
    if (!application_id) throw new Error("application_id required");

    // 1. Fetch application
    const { data: app, error: appErr } = await supabaseAdmin
      .from("society_applications")
      .select("*")
      .eq("id", application_id)
      .single();
    if (appErr || !app) throw new Error(`Application not found: ${appErr?.message}`);

    // 2. Create auth user
    const { data: inviteData, error: inviteErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      app.email,
      {
        data: { role: "society", full_name: app.full_name },
        redirectTo: `${SITE_URL}/society/dashboard`,
      }
    );
    if (inviteErr) throw new Error(`Auth user creation failed: ${inviteErr.message}`);
    const userId = inviteData.user.id;

    // 3. Insert user_profiles
    await supabaseAdmin.from("user_profiles").insert({
      id:        userId,
      role:      "society",
      status:    "approved",
      full_name: app.full_name,
    });

    // 4. Initiate Stripe subscription via sibling function
    const stripeRes = await supabaseAdmin.functions.invoke("create-stripe-subscription", {
      body: {
        user_id:  userId,
        email:    app.email,
        name:     app.full_name,
        tier:     app.selected_tier,
      },
    });
    const stripeData = stripeRes.data ?? {};

    // 5. Insert society_members
    await supabaseAdmin.from("society_members").insert({
      id:                 userId,
      tier:               app.selected_tier,
      member_since:       new Date().toISOString().slice(0, 10),
      delivery_address:   app.delivery_address,
      alt_address:        app.alt_address ?? null,
      preferred_window:   app.preferred_window ?? "any",
      building_access:    app.building_access ?? null,
      storage_type:       app.storage_type,
      birth_date:         app.birth_date,
      stripe_customer_id: stripeData.customer_id ?? "",
      stripe_sub_id:      stripeData.subscription_id ?? "",
      annual_fee_aud:     TIER_FEES[app.selected_tier] ?? 2500,
      next_billing_date:  stripeData.next_billing_date ?? null,
    });

    // 6. Update application
    await supabaseAdmin.from("society_applications")
      .update({ status: "approved" })
      .eq("id", application_id);

    // 7. Welcome email
    if (RESEND_API_KEY) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from:    "GC Wines Private Allocation Society <society@gcwines.com>",
          to:      [app.email],
          subject: "Welcome to the Private Allocation Society",
          html: `
            <h2>Welcome, ${app.full_name}</h2>
            <p>It is our pleasure to confirm your membership in the GC Wines Private Allocation Society.</p>
            <p>Your membership: <strong>${app.selected_tier.charAt(0).toUpperCase() + app.selected_tier.slice(1)} Member</strong></p>
            <p>An invitation has been sent to this address. Please follow the link to access your member portal.</p>
            <p>Your first allocation will be communicated separately by your account manager.</p>
            <br>
            <p>We look forward to sharing exceptional wine with you.</p>
            <p>GC Wines Private Allocation Society</p>
          `,
        }),
      });
    }

    return new Response(JSON.stringify({ ok: true, user_id: userId }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("approve-society-member error:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
