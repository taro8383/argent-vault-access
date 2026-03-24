// create-stripe-subscription
// Called internally by approve-society-member (or admin action).
// Creates a Stripe Customer + Subscription for the approved society member.
// Returns: { customer_id, subscription_id, next_billing_date }

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.5.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

// Stripe Price IDs for each tier — set these in Supabase secrets
const TIER_PRICE_IDS: Record<string, string> = {
  founding:  Deno.env.get("STRIPE_PRICE_FOUNDING")  ?? "",
  private:   Deno.env.get("STRIPE_PRICE_PRIVATE")   ?? "",
  collector: Deno.env.get("STRIPE_PRICE_COLLECTOR")  ?? "",
};

serve(async (req) => {
  try {
    const { user_id, email, name, tier } = await req.json();
    if (!user_id || !email || !tier) throw new Error("user_id, email and tier required");

    const priceId = TIER_PRICE_IDS[tier];
    if (!priceId) throw new Error(`No Stripe price configured for tier: ${tier}`);

    // 1. Create Stripe customer
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: { supabase_user_id: user_id, tier },
    });

    // 2. Create subscription (trial_end: immediate, or use trial_period_days for delayed billing)
    const subscription = await stripe.subscriptions.create({
      customer:          customer.id,
      items:             [{ price: priceId }],
      payment_behavior:  "default_incomplete",
      expand:            ["latest_invoice.payment_intent"],
      metadata:          { supabase_user_id: user_id, tier },
    });

    const nextBilling = subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000).toISOString().slice(0, 10)
      : null;

    return new Response(
      JSON.stringify({
        customer_id:       customer.id,
        subscription_id:   subscription.id,
        next_billing_date: nextBilling,
        status:            subscription.status,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("create-stripe-subscription error:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
