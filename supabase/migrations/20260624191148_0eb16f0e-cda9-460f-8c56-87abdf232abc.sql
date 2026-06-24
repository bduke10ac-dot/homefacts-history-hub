
-- Defense-in-depth: revoke leftover anon SELECT on Phase 1–4 tables.
-- RLS already blocks anon reads (no policies target anon); this removes the redundant grant.
REVOKE SELECT ON public.estate_vaults FROM anon;
REVOKE SELECT ON public.property_trust_scores FROM anon;
REVOKE SELECT ON public.certification_records FROM anon;
REVOKE SELECT ON public.property_timeline_events FROM anon;
REVOKE SELECT ON public.property_data_consent FROM anon;
REVOKE SELECT ON public.partner_accounts FROM anon;
REVOKE SELECT ON public.partner_invites FROM anon;
REVOKE SELECT ON public.partner_subscriptions FROM anon;
REVOKE SELECT ON public.vendor_offer_responses FROM anon;
REVOKE SELECT ON public.property_intelligence FROM anon;
REVOKE SELECT ON public.property_opportunities FROM anon;
-- vendor_offers stays accessible because the marketplace RPC is the gate; partners read via the SECURITY DEFINER fn.
REVOKE SELECT ON public.vendor_offers FROM anon;
