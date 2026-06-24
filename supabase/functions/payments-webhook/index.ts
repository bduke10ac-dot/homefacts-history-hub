import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, verifyWebhook } from "../_shared/stripe.ts";

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  }
  return _supabase;
}

function resolvePriceId(item: any): string | null {
  return item?.price?.lookup_key ?? item?.price?.metadata?.lovable_external_id ?? item?.price?.id ?? null;
}

function planFromPriceId(priceId: string | null): string | null {
  if (!priceId) return null;
  if (priceId === "pro_monthly" || priceId === "pro_yearly") return "pro";
  return priceId;
}

function isPartnerPlan(priceId: string | null) {
  return priceId === "partner_starter_monthly" || priceId === "partner_growth_monthly";
}

function partnerPlanName(priceId: string | null) {
  if (priceId === "partner_starter_monthly") return "starter";
  if (priceId === "partner_growth_monthly") return "growth";
  return null;
}

async function upsertPartnerSubscription(subscription: any, priceId: string | null) {
  const partnerUserId = subscription.metadata?.partnerUserId ?? subscription.metadata?.userId;
  if (!partnerUserId) {
    console.error("No partnerUserId in partner subscription metadata", subscription.id);
    return;
  }
  const item = subscription.items?.data?.[0];
  const periodStart = item?.current_period_start ?? subscription.current_period_start;
  const periodEnd = item?.current_period_end ?? subscription.current_period_end;

  // Find existing row by external id first, then by partner_user_id (to upgrade trial → active)
  const sb = getSupabase();
  const { data: existing } = await sb
    .from("partner_subscriptions")
    .select("id")
    .or(`external_subscription_id.eq.${subscription.id},partner_user_id.eq.${partnerUserId}`)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const row = {
    partner_user_id: partnerUserId,
    external_subscription_id: subscription.id,
    stripe_customer_id: subscription.customer,
    price_id: priceId,
    plan: partnerPlanName(priceId) ?? "custom",
    status: subscription.status,
    current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    cancel_at_period_end: subscription.cancel_at_period_end ?? false,
    updated_at: new Date().toISOString(),
  };
  if (existing?.id) {
    await sb.from("partner_subscriptions").update(row).eq("id", existing.id);
  } else {
    await sb.from("partner_subscriptions").insert(row);
  }
}

async function upsertSubscription(subscription: any, env: StripeEnv) {
  const item = subscription.items?.data?.[0];
  const priceId = resolvePriceId(item);

  // Partner subscriptions live in their own table.
  if (isPartnerPlan(priceId) || subscription.metadata?.partnerUserId) {
    await upsertPartnerSubscription(subscription, priceId);
    return;
  }

  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error("No userId in subscription metadata", subscription.id);
    return;
  }
  const productId = item?.price?.product;
  const periodStart = item?.current_period_start ?? subscription.current_period_start;
  const periodEnd = item?.current_period_end ?? subscription.current_period_end;

  await getSupabase().from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer,
      product_id: typeof productId === "string" ? productId : productId?.id ?? null,
      price_id: priceId,
      plan: planFromPriceId(priceId),
      status: subscription.status,
      current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      renews_at: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      cancel_at_period_end: subscription.cancel_at_period_end ?? false,
      environment: env,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "stripe_subscription_id" },
  );
}

async function markCanceled(subscription: any, env: StripeEnv) {
  // Try partner table first
  const { data: partnerRow } = await getSupabase()
    .from("partner_subscriptions")
    .select("id")
    .eq("external_subscription_id", subscription.id)
    .maybeSingle();
  if (partnerRow?.id) {
    await getSupabase()
      .from("partner_subscriptions")
      .update({ status: "canceled", updated_at: new Date().toISOString() })
      .eq("id", partnerRow.id);
    return;
  }
  await getSupabase()
    .from("subscriptions")
    .update({ status: "canceled", updated_at: new Date().toISOString() })
    .eq("stripe_subscription_id", subscription.id)
    .eq("environment", env);
}


async function recordPaymentEvent(opts: {
  eventId: string;
  eventType: string;
  userId: string | null;
  objectId: string | null;
  amountCents: number | null;
  currency: string | null;
  status: string | null;
  env: StripeEnv;
  metadata: Record<string, unknown>;
}) {
  await getSupabase().from("payment_events").upsert(
    {
      stripe_event_id: opts.eventId,
      event_type: opts.eventType,
      user_id: opts.userId,
      stripe_object_id: opts.objectId,
      amount_cents: opts.amountCents,
      currency: opts.currency,
      status: opts.status,
      environment: opts.env,
      metadata: opts.metadata,
    },
    { onConflict: "stripe_event_id" },
  );
}

async function handleCheckoutCompleted(session: any, env: StripeEnv, eventId: string) {
  // Pull userId from session.metadata first (set by create-checkout for one-time
  // purchases). Subscriptions are handled by customer.subscription.* events.
  const userId = session.metadata?.userId ?? session.client_reference_id ?? null;
  const mode = session.mode as string | undefined;

  await recordPaymentEvent({
    eventId,
    eventType: "checkout.session.completed",
    userId,
    objectId: session.id,
    amountCents: session.amount_total ?? null,
    currency: session.currency ?? null,
    status: session.payment_status ?? null,
    env,
    metadata: {
      mode,
      customer: session.customer,
      payment_intent: session.payment_intent,
      sku: session.metadata?.sku ?? null,
      report_id: session.metadata?.report_id ?? null,
    },
  });

  // One-time purchase fulfillment hook: if the checkout carried a report_id,
  // mark that report as paid so the UI unlocks the gated sections.
  if (mode === "payment" && session.metadata?.report_id) {
    await getSupabase()
      .from("reports")
      .update({
        status: "paid",
        last_refreshed_at: new Date().toISOString(),
      })
      .eq("id", session.metadata.report_id);
  }
}

async function handleInvoicePaid(invoice: any, env: StripeEnv, eventId: string) {
  const userId = invoice.subscription_details?.metadata?.userId
    ?? invoice.metadata?.userId
    ?? null;

  await recordPaymentEvent({
    eventId,
    eventType: "invoice.payment_succeeded",
    userId,
    objectId: invoice.id,
    amountCents: invoice.amount_paid ?? null,
    currency: invoice.currency ?? null,
    status: "paid",
    env,
    metadata: {
      subscription: invoice.subscription,
      customer: invoice.customer,
      hosted_invoice_url: invoice.hosted_invoice_url,
    },
  });

  // Renewals: push period end forward on the subscription row.
  if (invoice.subscription && invoice.lines?.data?.[0]?.period?.end) {
    const periodEnd = new Date(invoice.lines.data[0].period.end * 1000).toISOString();
    await getSupabase()
      .from("subscriptions")
      .update({
        status: "active",
        current_period_end: periodEnd,
        renews_at: periodEnd,
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_subscription_id", invoice.subscription)
      .eq("environment", env);
  }
}

async function handleInvoiceFailed(invoice: any, env: StripeEnv, eventId: string) {
  const userId = invoice.subscription_details?.metadata?.userId
    ?? invoice.metadata?.userId
    ?? null;

  await recordPaymentEvent({
    eventId,
    eventType: "invoice.payment_failed",
    userId,
    objectId: invoice.id,
    amountCents: invoice.amount_due ?? null,
    currency: invoice.currency ?? null,
    status: "failed",
    env,
    metadata: {
      subscription: invoice.subscription,
      attempt_count: invoice.attempt_count,
      next_payment_attempt: invoice.next_payment_attempt,
      hosted_invoice_url: invoice.hosted_invoice_url,
    },
  });

  // Reflect dunning state on the subscription so the UI can show a banner.
  if (invoice.subscription) {
    await getSupabase()
      .from("subscriptions")
      .update({ status: "past_due", updated_at: new Date().toISOString() })
      .eq("stripe_subscription_id", invoice.subscription)
      .eq("environment", env);
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const rawEnv = new URL(req.url).searchParams.get("env");
  if (rawEnv !== "sandbox" && rawEnv !== "live") {
    return new Response(JSON.stringify({ received: true, ignored: "invalid env" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
  const env: StripeEnv = rawEnv;

  try {
    const event = await verifyWebhook(req, env) as any;
    const eventId = event.id ?? crypto.randomUUID();
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await upsertSubscription(event.data.object, env);
        break;
      case "customer.subscription.deleted":
        await markCanceled(event.data.object, env);
        break;
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object, env, eventId);
        break;
      case "invoice.payment_succeeded":
      case "invoice.paid":
        await handleInvoicePaid(event.data.object, env, eventId);
        break;
      case "invoice.payment_failed":
        await handleInvoiceFailed(event.data.object, env, eventId);
        break;
      default:
        console.log("Unhandled event:", event.type);
    }
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Webhook error:", e);
    return new Response("Webhook error", { status: 400 });
  }
});
