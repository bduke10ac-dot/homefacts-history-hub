import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface SubscriptionState {
  plan: string | null;
  status: string | null;
  renews_at: string | null;
  priceId: string | null;
  cancelAtPeriodEnd: boolean;
  isPro: boolean;
  isAdmin: boolean;
  loading: boolean;
  startTrial: () => Promise<void>;
  openCustomerPortal: () => Promise<void>;
  refresh: () => Promise<void>;
}

const PRO_PLANS = new Set(["pro", "trial", "homeowner_pro", "realtor_pro"]);
const PRO_PRICE_IDS = new Set(["pro_monthly", "pro_yearly"]);

export function useSubscription(): SubscriptionState {
  const { user } = useAuth();
  const [plan, setPlan] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [renewsAt, setRenewsAt] = useState<string | null>(null);
  const [priceId, setPriceId] = useState<string | null>(null);
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setPlan(null); setStatus(null); setRenewsAt(null); setPriceId(null);
      setCancelAtPeriodEnd(false); setIsAdmin(false); setLoading(false);
      return;
    }
    setLoading(true);
    const [{ data: sub }, { data: roles }] = await Promise.all([
      supabase
        .from("subscriptions")
        .select("plan,status,renews_at,price_id,cancel_at_period_end,current_period_end")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", user.id),
    ]);
    setPlan(sub?.plan ?? null);
    setStatus(sub?.status ?? null);
    setRenewsAt(sub?.renews_at ?? sub?.current_period_end ?? null);
    setPriceId(sub?.price_id ?? null);
    setCancelAtPeriodEnd(!!sub?.cancel_at_period_end);
    setIsAdmin(!!roles?.some((r: any) => r.role === "admin"));
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const startTrial = useCallback(async () => {
    if (!user) return;
    const renews = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
    const { error } = await supabase.from("subscriptions").insert({
      user_id: user.id, plan: "trial", status: "active", renews_at: renews,
    });
    if (error) throw error;
    await load();
  }, [user, load]);

  const openCustomerPortal = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke("create-portal-session", {
      body: { returnUrl: window.location.origin + "/dashboard" },
    });
    if (error || !data?.url) throw new Error(error?.message || "Could not open billing portal");
    window.open(data.url as string, "_blank", "noopener,noreferrer");
  }, []);

  const stripeActive =
    (status === "active" || status === "trialing") && !!priceId && PRO_PRICE_IDS.has(priceId);
  const legacyActive = status === "active" && PRO_PLANS.has(plan ?? "");
  const isPro = isAdmin || stripeActive || legacyActive;

  return {
    plan, status, renews_at: renewsAt, priceId, cancelAtPeriodEnd,
    isPro, isAdmin, loading, startTrial, openCustomerPortal, refresh: load,
  };
}
