
-- =========================================================
-- 1. partner_invites
-- =========================================================
CREATE TABLE public.partner_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  invitee_email TEXT NOT NULL,
  company_name TEXT,
  categories TEXT[] NOT NULL DEFAULT '{}',
  service_zips TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending', -- pending|accepted|expired|revoked
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  accepted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  accepted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '14 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_invites TO authenticated;
GRANT ALL ON public.partner_invites TO service_role;
ALTER TABLE public.partner_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all_invites" ON public.partner_invites FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_partner_invites_updated BEFORE UPDATE ON public.partner_invites
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- 2. partner_accounts
-- =========================================================
CREATE TABLE public.partner_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  website TEXT,
  categories TEXT[] NOT NULL DEFAULT '{}',
  service_zips TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending', -- pending|approved|rejected|suspended
  invite_id UUID REFERENCES public.partner_invites(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_partner_accounts_status ON public.partner_accounts(status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_accounts TO authenticated;
GRANT ALL ON public.partner_accounts TO service_role;
ALTER TABLE public.partner_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "self_or_admin_select_partner" ON public.partner_accounts FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin_insert_partner" ON public.partner_accounts FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin'));
-- Partners may update contact-ish fields on their own row; admins can update anything.
-- We rely on a trigger to block partners from changing status/approval columns.
CREATE POLICY "self_or_admin_update_partner" ON public.partner_accounts FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin_delete_partner" ON public.partner_accounts FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.partner_accounts_protect_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN
    IF NEW.status IS DISTINCT FROM OLD.status
       OR NEW.approved_by IS DISTINCT FROM OLD.approved_by
       OR NEW.approved_at IS DISTINCT FROM OLD.approved_at
       OR NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason THEN
      RAISE EXCEPTION 'Only admins may change partner approval fields';
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_partner_accounts_protect_status BEFORE UPDATE ON public.partner_accounts
  FOR EACH ROW EXECUTE FUNCTION public.partner_accounts_protect_status();
CREATE TRIGGER trg_partner_accounts_updated BEFORE UPDATE ON public.partner_accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- 3. partner_subscriptions
-- =========================================================
CREATE TABLE public.partner_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'trial', -- trial|active|canceled|past_due|suspended
  plan TEXT,
  current_period_end TIMESTAMPTZ,
  external_subscription_id TEXT, -- reserved for Phase 3 billing
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_partner_subs_user ON public.partner_subscriptions(partner_user_id, status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_subscriptions TO authenticated;
GRANT ALL ON public.partner_subscriptions TO service_role;
ALTER TABLE public.partner_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "self_or_admin_select_partner_sub" ON public.partner_subscriptions FOR SELECT TO authenticated
  USING (partner_user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin_write_partner_sub" ON public.partner_subscriptions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_partner_subs_updated BEFORE UPDATE ON public.partner_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- 4. Approved-partner check
-- =========================================================
CREATE OR REPLACE FUNCTION public.is_approved_partner(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.partner_accounts a
      WHERE a.user_id = _user_id AND a.status = 'approved'
  ) AND EXISTS (
    SELECT 1 FROM public.partner_subscriptions s
      WHERE s.partner_user_id = _user_id
        AND s.status IN ('trial','active')
        AND (s.current_period_end IS NULL OR s.current_period_end > now())
  );
$$;

-- =========================================================
-- 5. vendor_offers
-- =========================================================
CREATE TABLE public.vendor_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,            -- e.g. 'roof','hvac','water_heater','plumbing','electrical'
  zip TEXT NOT NULL,
  system TEXT,                       -- optional finer scope, matches property_opportunities.system
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  cta_text TEXT NOT NULL DEFAULT 'Request quote',
  estimated_value TEXT,              -- free-text e.g. "$200 off"
  status TEXT NOT NULL DEFAULT 'active', -- active|expired|withdrawn
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_vendor_offers_target ON public.vendor_offers(zip, category, status, expires_at);
CREATE INDEX idx_vendor_offers_partner ON public.vendor_offers(partner_user_id, status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_offers TO authenticated;
GRANT ALL ON public.vendor_offers TO service_role;
ALTER TABLE public.vendor_offers ENABLE ROW LEVEL SECURITY;

-- Partner read/write own; admin all read.
CREATE POLICY "partner_select_own_offers" ON public.vendor_offers FOR SELECT TO authenticated
  USING (partner_user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "partner_insert_own_offers" ON public.vendor_offers FOR INSERT TO authenticated
  WITH CHECK (
    partner_user_id = auth.uid()
    AND public.is_approved_partner(auth.uid())
  );
CREATE POLICY "partner_update_own_offers" ON public.vendor_offers FOR UPDATE TO authenticated
  USING (partner_user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (partner_user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "partner_delete_own_offers" ON public.vendor_offers FOR DELETE TO authenticated
  USING (partner_user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- Homeowners can read offers matching one of their consented properties.
CREATE POLICY "homeowner_matched_offers_select" ON public.vendor_offers FOR SELECT TO authenticated
  USING (
    status = 'active'
    AND expires_at > now()
    AND EXISTS (
      SELECT 1
        FROM public.properties p
        JOIN public.property_data_consent c
          ON c.property_id = p.id AND c.user_id = auth.uid()
       WHERE public.is_property_owner(p.id, auth.uid())
         AND c.allow_offer_matching = true
         AND p.zip = vendor_offers.zip
         AND EXISTS (
           SELECT 1 FROM public.property_opportunities o
             WHERE o.property_id = p.id
               AND o.dismissed_at IS NULL
               AND (vendor_offers.system IS NULL OR o.system = vendor_offers.system)
               AND o.system::text ILIKE '%' || vendor_offers.category || '%'
         )
    )
  );

-- Quota: ≤ 10 active offers per (partner, zip, category)
CREATE OR REPLACE FUNCTION public.vendor_offers_quota_check()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_count int;
BEGIN
  IF NEW.status = 'active' THEN
    SELECT count(*) INTO v_count FROM public.vendor_offers
      WHERE partner_user_id = NEW.partner_user_id
        AND zip = NEW.zip
        AND category = NEW.category
        AND status = 'active'
        AND expires_at > now()
        AND id <> NEW.id;
    IF v_count >= 10 THEN
      RAISE EXCEPTION 'Quota exceeded: max 10 active offers per (zip, category)';
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_vendor_offers_quota
  BEFORE INSERT OR UPDATE ON public.vendor_offers
  FOR EACH ROW EXECUTE FUNCTION public.vendor_offers_quota_check();
CREATE TRIGGER trg_vendor_offers_updated BEFORE UPDATE ON public.vendor_offers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- 6. vendor_offer_responses
-- =========================================================
CREATE TABLE public.vendor_offer_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES public.vendor_offers(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  homeowner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  response TEXT NOT NULL, -- accepted|declined
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  contact_revealed_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (offer_id, property_id, homeowner_user_id)
);
CREATE INDEX idx_vendor_offer_responses_offer ON public.vendor_offer_responses(offer_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_offer_responses TO authenticated;
GRANT ALL ON public.vendor_offer_responses TO service_role;
ALTER TABLE public.vendor_offer_responses ENABLE ROW LEVEL SECURITY;

-- Homeowner reads their own; partner reads ACCEPTED responses to their own offers.
CREATE POLICY "responses_select" ON public.vendor_offer_responses FOR SELECT TO authenticated
  USING (
    homeowner_user_id = auth.uid()
    OR public.has_role(auth.uid(),'admin')
    OR (
      response = 'accepted'
      AND EXISTS (SELECT 1 FROM public.vendor_offers o WHERE o.id = offer_id AND o.partner_user_id = auth.uid())
    )
  );
-- No direct insert/update from clients — must go through respond_to_vendor_offer().
CREATE POLICY "responses_admin_write" ON public.vendor_offer_responses FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- =========================================================
-- 7. Invite claim flow
-- =========================================================
CREATE OR REPLACE FUNCTION public.accept_partner_invite(_token text, _company_name text)
RETURNS TABLE (partner_id uuid, status text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_email text := lower(coalesce(auth.jwt() ->> 'email',''));
  v_invite public.partner_invites%ROWTYPE;
  v_pid uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Must be signed in'; END IF;
  SELECT * INTO v_invite FROM public.partner_invites WHERE token = _token;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invite not found'; END IF;
  IF v_invite.status <> 'pending' THEN RAISE EXCEPTION 'Invite already %', v_invite.status; END IF;
  IF v_invite.expires_at < now() THEN
    UPDATE public.partner_invites SET status='expired' WHERE id = v_invite.id;
    RAISE EXCEPTION 'Invite expired';
  END IF;
  IF lower(v_invite.invitee_email) <> v_email THEN
    RAISE EXCEPTION 'Invite was issued to a different email address';
  END IF;

  -- Grant partner role (idempotent)
  INSERT INTO public.user_roles (user_id, role) VALUES (v_uid, 'partner')
    ON CONFLICT DO NOTHING;

  INSERT INTO public.partner_accounts (
    user_id, company_name, contact_email, categories, service_zips, status, invite_id
  ) VALUES (
    v_uid,
    COALESCE(NULLIF(_company_name,''), v_invite.company_name, v_email),
    v_email,
    v_invite.categories,
    v_invite.service_zips,
    'pending',
    v_invite.id
  )
  ON CONFLICT (user_id) DO UPDATE SET
    company_name = EXCLUDED.company_name,
    contact_email = EXCLUDED.contact_email,
    categories = EXCLUDED.categories,
    service_zips = EXCLUDED.service_zips,
    invite_id = EXCLUDED.invite_id,
    updated_at = now()
  RETURNING id INTO v_pid;

  UPDATE public.partner_invites
    SET status='accepted', accepted_by=v_uid, accepted_at=now()
    WHERE id = v_invite.id;

  RETURN QUERY SELECT v_pid, 'pending'::text;
END $$;

-- =========================================================
-- 8. Marketplace (k-anonymity ≥ 5, AND-gated on anonymized consent)
-- =========================================================
CREATE OR REPLACE FUNCTION public.partner_marketplace_for(_user_id uuid)
RETURNS TABLE (category text, zip text, system text, property_count bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_categories text[];
  v_zips text[];
BEGIN
  IF NOT public.is_approved_partner(_user_id) THEN
    RETURN; -- empty set for non-approved
  END IF;

  SELECT categories, service_zips INTO v_categories, v_zips
    FROM public.partner_accounts WHERE user_id = _user_id;

  IF v_categories IS NULL OR array_length(v_categories,1) IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH eligible_props AS (
    SELECT p.id, p.zip
      FROM public.properties p
     WHERE (v_zips = '{}' OR p.zip = ANY(v_zips))
       AND public.property_consent_all_owners_opted_in(p.id, 'allow_anonymized_data')
  ),
  matched_opps AS (
    SELECT o.system, ep.zip, ep.id AS property_id
      FROM public.property_opportunities o
      JOIN eligible_props ep ON ep.id = o.property_id
     WHERE o.dismissed_at IS NULL
       AND EXISTS (
         SELECT 1 FROM unnest(v_categories) cat
          WHERE o.system::text ILIKE '%' || cat || '%'
       )
  ),
  grouped AS (
    SELECT
      (SELECT cat FROM unnest(v_categories) cat WHERE m.system::text ILIKE '%' || cat || '%' LIMIT 1) AS category,
      m.zip,
      m.system,
      count(DISTINCT m.property_id) AS property_count
    FROM matched_opps m
    GROUP BY 1,2,3
  )
  SELECT g.category, g.zip, g.system, g.property_count
    FROM grouped g
   WHERE g.property_count >= 5;  -- k-anonymity hard hide
END $$;

-- =========================================================
-- 9. Homeowner response handler
-- =========================================================
CREATE OR REPLACE FUNCTION public.respond_to_vendor_offer(
  _offer_id uuid, _property_id uuid, _accepted boolean
) RETURNS public.vendor_offer_responses
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_email text := lower(coalesce(auth.jwt() ->> 'email',''));
  v_offer public.vendor_offers%ROWTYPE;
  v_consent public.property_data_consent%ROWTYPE;
  v_profile public.profiles%ROWTYPE;
  v_row public.vendor_offer_responses%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Must be signed in'; END IF;
  IF NOT public.is_property_owner(_property_id, v_uid) THEN
    RAISE EXCEPTION 'Not a property owner';
  END IF;
  SELECT * INTO v_offer FROM public.vendor_offers WHERE id = _offer_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Offer not found'; END IF;
  IF v_offer.status <> 'active' OR v_offer.expires_at < now() THEN
    RAISE EXCEPTION 'Offer is no longer active';
  END IF;
  SELECT * INTO v_consent FROM public.property_data_consent
    WHERE property_id = _property_id AND user_id = v_uid;
  IF NOT FOUND OR NOT v_consent.allow_offer_matching THEN
    RAISE EXCEPTION 'You have not enabled offer matching for this property';
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = v_uid;

  INSERT INTO public.vendor_offer_responses (
    offer_id, property_id, homeowner_user_id, response,
    contact_name, contact_email, contact_phone, contact_revealed_at
  ) VALUES (
    _offer_id, _property_id, v_uid,
    CASE WHEN _accepted THEN 'accepted' ELSE 'declined' END,
    CASE WHEN _accepted THEN v_profile.full_name ELSE NULL END,
    CASE WHEN _accepted THEN v_email ELSE NULL END,
    CASE WHEN _accepted THEN v_profile.phone ELSE NULL END,
    CASE WHEN _accepted THEN now() ELSE NULL END
  )
  ON CONFLICT (offer_id, property_id, homeowner_user_id) DO UPDATE
    SET response = EXCLUDED.response,
        contact_name = EXCLUDED.contact_name,
        contact_email = EXCLUDED.contact_email,
        contact_phone = EXCLUDED.contact_phone,
        contact_revealed_at = EXCLUDED.contact_revealed_at,
        responded_at = now()
    RETURNING * INTO v_row;

  RETURN v_row;
END $$;
