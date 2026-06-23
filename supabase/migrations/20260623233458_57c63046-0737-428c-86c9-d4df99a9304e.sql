
-- 1. Table
CREATE TABLE IF NOT EXISTS public.property_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  invitee_email text NOT NULL,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','revoked','expired')),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  created_by uuid NOT NULL DEFAULT auth.uid(),
  accepted_by uuid REFERENCES auth.users(id),
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS property_invites_email_idx ON public.property_invites (lower(invitee_email));
CREATE INDEX IF NOT EXISTS property_invites_property_idx ON public.property_invites (property_id);

-- 2. Grants
GRANT SELECT, INSERT, UPDATE ON public.property_invites TO authenticated;
GRANT ALL ON public.property_invites TO service_role;

-- 3. RLS
ALTER TABLE public.property_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Property owners or admins read invites"
  ON public.property_invites FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.is_property_owner(property_id, auth.uid())
    OR lower(invitee_email) = lower(coalesce((auth.jwt() ->> 'email'), ''))
  );

CREATE POLICY "Property owners or admins create invites"
  ON public.property_invites FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.is_property_owner(property_id, auth.uid())
  );

CREATE POLICY "Property owners or admins revoke invites"
  ON public.property_invites FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.is_property_owner(property_id, auth.uid())
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.is_property_owner(property_id, auth.uid())
  );

-- 4. Updated_at trigger
CREATE TRIGGER property_invites_set_updated_at
  BEFORE UPDATE ON public.property_invites
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. Claim function (SECURITY DEFINER so it can write properties.claimed_by)
CREATE OR REPLACE FUNCTION public.claim_property_invite(_token text)
RETURNS TABLE(property_id uuid, address_line text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_email text := lower(coalesce((auth.jwt() ->> 'email'), ''));
  v_invite public.property_invites%ROWTYPE;
  v_property public.properties%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Must be signed in to claim'; END IF;

  SELECT * INTO v_invite FROM public.property_invites WHERE token = _token;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invite not found'; END IF;
  IF v_invite.status <> 'pending' THEN RAISE EXCEPTION 'Invite already %', v_invite.status; END IF;
  IF v_invite.expires_at < now() THEN
    UPDATE public.property_invites SET status='expired' WHERE id = v_invite.id;
    RAISE EXCEPTION 'Invite expired';
  END IF;
  IF lower(v_invite.invitee_email) <> v_email THEN
    RAISE EXCEPTION 'This invite was sent to a different email address';
  END IF;

  SELECT * INTO v_property FROM public.properties WHERE id = v_invite.property_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Property no longer exists'; END IF;

  UPDATE public.properties
    SET claimed_by = v_uid, updated_at = now()
    WHERE id = v_invite.property_id;

  UPDATE public.property_invites
    SET status = 'accepted', accepted_by = v_uid, accepted_at = now()
    WHERE id = v_invite.id;

  INSERT INTO public.timeline_events (property_id, category, title, description, occurred_at, contractor_name)
  VALUES (v_invite.property_id, 'handoff', 'Homeowner handoff completed',
          'Property ownership accepted by ' || v_email, now(), NULL);

  RETURN QUERY SELECT v_property.id, v_property.address_line;
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_property_invite(text) TO authenticated;
