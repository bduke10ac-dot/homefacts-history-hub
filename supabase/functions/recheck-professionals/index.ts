// Daily recheck job — scaffold with pluggable connectors.
// v1 ships with MOCK connectors that touch updated_at and log to data_source_log.
// Real state-board adapters (CSLB, NMLS, BBB, etc.) drop into the registry later.

import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

type RecheckResult = {
  source_name: string;
  source_url: string | null;
  patch: Record<string, unknown>;
};

type Connector = (pro: any) => Promise<RecheckResult | null>;

// ---- MOCK CONNECTOR REGISTRY ---------------------------------------------
// Each connector returns either a `patch` to apply to the professional row,
// or null to skip. Real adapters replace these mocks one at a time.

const mockLicenseBoard: Connector = async (pro) => {
  if (!pro.license_number || !pro.issuing_state_agency) return null;
  return {
    source_name: `mock:${pro.issuing_state_agency}`,
    source_url: pro.source_link ?? null,
    patch: {
      verified_date: new Date().toISOString().slice(0, 10),
    },
  };
};

const mockNmlsBoard: Connector = async (pro) => {
  if (!pro.nmls_id) return null;
  return {
    source_name: "mock:nmls",
    source_url: "https://www.nmlsconsumeraccess.org/",
    patch: { verified_date: new Date().toISOString().slice(0, 10) },
  };
};

const mockBbb: Connector = async (pro) => {
  if (!pro.company_name) return null;
  return {
    source_name: "mock:bbb",
    source_url: "https://www.bbb.org/",
    patch: {}, // no-op for now
  };
};

const CONNECTORS: Connector[] = [mockLicenseBoard, mockNmlsBoard, mockBbb];

// --------------------------------------------------------------------------

async function recheckOne(pro: any) {
  let touched = false;
  const aggregatePatch: Record<string, unknown> = {};
  for (const connector of CONNECTORS) {
    try {
      const result = await connector(pro);
      if (!result) continue;
      Object.assign(aggregatePatch, result.patch);
      await supabase.from("data_source_log").insert({
        table_name: "professionals",
        record_id: pro.id,
        source_name: result.source_name,
        source_url: result.source_url,
        fetched_at: new Date().toISOString(),
        data_license_status: "ok",
      });
      touched = true;
    } catch (e) {
      console.error("connector error", pro.id, e);
    }
  }
  if (touched) {
    // Touch updated_at via the badge-compute trigger to keep status fresh.
    await supabase
      .from("professionals")
      .update({ ...aggregatePatch, updated_at: new Date().toISOString() })
      .eq("id", pro.id);
  }
  return touched;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 100), 500);
  const proId = url.searchParams.get("professional_id");

  try {
    let query = supabase
      .from("professionals")
      .select("id, license_number, issuing_state_agency, nmls_id, company_name, source_link, verified_date")
      .order("updated_at", { ascending: true, nullsFirst: true })
      .limit(limit);

    if (proId) query = query.eq("id", proId);

    const { data: pros, error } = await query;
    if (error) throw error;

    let processed = 0;
    let touched = 0;
    for (const pro of pros ?? []) {
      processed++;
      if (await recheckOne(pro)) touched++;
    }

    return new Response(
      JSON.stringify({ ok: true, processed, touched, mode: "mock" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("recheck-professionals error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
