import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface SubscriptionState {
  plan: string | null;
  status: string | null;
  renews_at: string | null;
  isPro: boolean;
  isAdmin: boolean;
  loading: boolean;
  startTrial: () => Promise<void>;
  refresh: () => Promise<void>;
}

const PRO_PLANS = new Set(["pro", "trial", "homeowner_pro", "realtor_pro"]);

export function useSubscription(): SubscriptionState {
  const { user } = useAuth();
  const [plan, setPlan] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [renewsAt, setRenewsAt] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setPlan(null); setStatus(null); setRenewsAt(null); setIsAdmin(false); setLoading(false);
      return;
    }
    setLoading(true);
    const [{ data: sub }, { data: roles }] = await Promise.all([
      supabase
        .from("subscriptions")
        .select("plan,status,renews_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", user.id),
    ]);
    setPlan(sub?.plan ?? null);
    setStatus(sub?.status ?? null);
    setRenewsAt(sub?.renews_at ?? null);
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

  const isPro = isAdmin || (status === "active" && PRO_PLANS.has(plan ?? ""));

  return { plan, status, renews_at: renewsAt, isPro, isAdmin, loading, startTrial, refresh: load };
}
