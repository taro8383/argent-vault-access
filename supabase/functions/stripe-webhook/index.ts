// stripe-webhook
// Receives Stripe webhook events and updates Supabase accordingly.
// Handles: invoice.paid, invoice.payment_failed, customer.subscription.deleted,
//          customer.subscription.updated

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.5.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

const WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const body      = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature ?? "", WEBHOOK_SECRET);
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 400 });
  }

  try {
    switch (event.type) {
      case "invoice.paid": {
        const invoice    = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const periodEnd  = invoice.period_end
          ? new Date(invoice.period_end * 1000).toISOString().slice(0, 10)
          : null;

        await supabaseAdmin
          .from("society_members")
          .update({ next_billing_date: periodEnd })
          .eq("stripe_customer_id", customerId);
        break;
      }

      case "invoice.payment_failed": {
        const invoice    = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        // Optionally set a flag — here we update user_profiles status to 'suspended'
        const { data: member } = await supabaseAdmin
          .from("society_members")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single();
        if (member) {
          await supabaseAdmin
            .from("user_profiles")
            .update({ status: "suspended" })
            .eq("id", member.id);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub        = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const { data: member } = await supabaseAdmin
          .from("society_members")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single();
        if (member) {
          await supabaseAdmin
            .from("user_profiles")
            .update({ status: "suspended" })
            .eq("id", member.id);
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub        = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const nextDate   = sub.current_period_end
          ? new Date(sub.current_period_end * 1000).toISOString().slice(0, 10)
          : null;
        await supabaseAdmin
          .from("society_members")
          .update({ next_billing_date: nextDate })
          .eq("stripe_customer_id", customerId);
        break;
      }

      default:
        break;
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("stripe-webhook handler error:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
