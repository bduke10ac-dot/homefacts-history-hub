// Shared helper for rate-limiting AI edge functions on a per-user, per-day basis.
// Backed by public.claim_ai_credit RPC + ai_usage_quota table.
import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";

const DEFAULT_DAILY_LIMIT = 50;

export interface AiQuotaResult {
  allowed: boolean;
  remaining: number;
  used: number;
  limit: number;
}

let _admin: SupabaseClient | null = null;
function admin(): SupabaseClient {
  if (!_admin) {
    _admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
  }
  return _admin;
}

/**
 * Resolve the calling user's id from the Authorization header.
 * Returns null if anonymous or invalid.
 */
export async function getUserIdFromRequest(req: Request): Promise<string | null> {
  const auth = req.headers.get("Authorization");
  if (!auth) return null;
  const anonKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;
  const client = createClient(Deno.env.get("SUPABASE_URL")!, anonKey, {
    global: { headers: { Authorization: auth } },
  });
  const { data } = await client.auth.getUser();
  return data.user?.id ?? null;
}

/**
 * Atomically increment the daily AI counter for a user and return whether
 * the request is within the daily limit.
 */
export async function claimAiCredit(
  userId: string,
  functionName: string,
  limit: number = DEFAULT_DAILY_LIMIT,
): Promise<AiQuotaResult> {
  const { data, error } = await admin().rpc("claim_ai_credit", {
    _user_id: userId, _function_name: functionName, _limit: limit,
  });
  if (error) {
    console.error("claim_ai_credit error", error);
    // Fail open so a quota bug doesn't break the product, but log it.
    return { allowed: true, remaining: limit, used: 0, limit };
  }
  const row = Array.isArray(data) ? data[0] : data;
  return {
    allowed: Boolean(row?.allowed),
    remaining: Number(row?.remaining ?? 0),
    used: Number(row?.used ?? 0),
    limit,
  };
}

export function quotaExceededResponse(
  result: AiQuotaResult,
  corsHeaders: Record<string, string>,
): Response {
  return new Response(
    JSON.stringify({
      error: "ai_daily_limit_reached",
      message: `Daily AI limit reached (${result.limit} calls/day). Resets at midnight.`,
      limit: result.limit,
      used: result.used,
    }),
    {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
}

/**
 * Enforces the quota and short-circuits with a 429 if exceeded.
 * If the request is anonymous, returns null (the caller decides how to handle).
 *
 * Usage:
 *   const block = await enforceAiQuota(req, "ask-property-ai", corsHeaders);
 *   if (block) return block;
 */
export async function enforceAiQuota(
  req: Request,
  functionName: string,
  corsHeaders: Record<string, string>,
  limit: number = DEFAULT_DAILY_LIMIT,
): Promise<Response | null> {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return null; // anonymous — let the caller decide
  const result = await claimAiCredit(userId, functionName, limit);
  if (!result.allowed) return quotaExceededResponse(result, corsHeaders);
  return null;
}
