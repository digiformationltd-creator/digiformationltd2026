
DO $$ BEGIN
  CREATE TYPE public.whatsapp_opt_in_status AS ENUM ('pending','opted_in','opted_out');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.whatsapp_template_category AS ENUM ('UTILITY','MARKETING','AUTHENTICATION');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.whatsapp_template_status AS ENUM ('pending','approved','rejected','paused','disabled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.whatsapp_broadcast_status AS ENUM ('draft','scheduled','running','completed','cancelled','failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 1. whatsapp_contacts
CREATE TABLE IF NOT EXISTS public.whatsapp_contacts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_e164    TEXT NOT NULL UNIQUE,
  user_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  display_name  TEXT,
  country       TEXT,
  source        TEXT NOT NULL DEFAULT 'manual',
  tags          TEXT[] NOT NULL DEFAULT '{}',
  opt_in_status public.whatsapp_opt_in_status NOT NULL DEFAULT 'pending',
  opt_in_at     TIMESTAMPTZ,
  opt_out_at    TIMESTAMPTZ,
  last_inbound_at   TIMESTAMPTZ,
  last_outbound_at  TIMESTAMPTZ,
  last_broadcast_at TIMESTAMPTZ,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS whatsapp_contacts_user_id_idx ON public.whatsapp_contacts(user_id);
CREATE INDEX IF NOT EXISTS whatsapp_contacts_opt_in_idx  ON public.whatsapp_contacts(opt_in_status);
CREATE INDEX IF NOT EXISTS whatsapp_contacts_last_in_idx ON public.whatsapp_contacts(last_inbound_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_contacts TO authenticated;
GRANT ALL ON public.whatsapp_contacts TO service_role;
ALTER TABLE public.whatsapp_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage whatsapp contacts"
  ON public.whatsapp_contacts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_whatsapp_contacts_updated
  BEFORE UPDATE ON public.whatsapp_contacts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. consent events
CREATE TABLE IF NOT EXISTS public.whatsapp_consent_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id  UUID NOT NULL REFERENCES public.whatsapp_contacts(id) ON DELETE CASCADE,
  event_type  TEXT NOT NULL,
  source      TEXT,
  payload     JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS whatsapp_consent_events_contact_idx ON public.whatsapp_consent_events(contact_id, created_at DESC);

GRANT SELECT, INSERT ON public.whatsapp_consent_events TO authenticated;
GRANT ALL ON public.whatsapp_consent_events TO service_role;
ALTER TABLE public.whatsapp_consent_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read consent events"
  ON public.whatsapp_consent_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins write consent events"
  ON public.whatsapp_consent_events FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- 3. templates
CREATE TABLE IF NOT EXISTS public.whatsapp_templates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  language      TEXT NOT NULL DEFAULT 'en',
  category      public.whatsapp_template_category NOT NULL DEFAULT 'UTILITY',
  status        public.whatsapp_template_status NOT NULL DEFAULT 'pending',
  body_text     TEXT,
  variables     JSONB NOT NULL DEFAULT '[]'::jsonb,
  meta_template_id TEXT,
  last_synced_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(name, language)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_templates TO authenticated;
GRANT ALL ON public.whatsapp_templates TO service_role;
ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage templates"
  ON public.whatsapp_templates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_whatsapp_templates_updated
  BEFORE UPDATE ON public.whatsapp_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.whatsapp_templates (name, language, category, status, body_text, variables) VALUES
  ('order_processing_started','en','UTILITY','pending',
    'Hi {{1}}, your order {{2}} ({{3}}) is now being processed. We''ll update you when complete. — Digiformation',
    '["customer_name","order_ref","service_name"]'::jsonb),
  ('order_completed','en','UTILITY','pending',
    'Hi {{1}}, great news — your order {{2}} is complete. Check your portal for documents. — Digiformation',
    '["customer_name","order_ref"]'::jsonb),
  ('confirmation_statement_reminder','en','UTILITY','pending',
    'Hi {{1}}, your Confirmation Statement for {{2}} is due on {{3}}. Reply YES to file with us. — Digiformation',
    '["customer_name","company_name","due_date"]'::jsonb),
  ('annual_accounts_reminder','en','UTILITY','pending',
    'Hi {{1}}, the Annual Accounts for {{2}} are due on {{3}}. Reply YES if you''d like us to handle it. — Digiformation',
    '["customer_name","company_name","due_date"]'::jsonb),
  ('address_renewal_reminder','en','UTILITY','pending',
    'Hi {{1}}, your UK address service for {{2}} expires on {{3}}. Renew anytime via the portal. — Digiformation',
    '["customer_name","company_name","expiry_date"]'::jsonb)
ON CONFLICT (name, language) DO NOTHING;

-- 4. extend message log
ALTER TABLE public.whatsapp_message_log
  ADD COLUMN IF NOT EXISTS contact_id     UUID REFERENCES public.whatsapp_contacts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS template_name  TEXT,
  ADD COLUMN IF NOT EXISTS category       public.whatsapp_template_category,
  ADD COLUMN IF NOT EXISTS wa_message_id  TEXT,
  ADD COLUMN IF NOT EXISTS direction      TEXT NOT NULL DEFAULT 'out',
  ADD COLUMN IF NOT EXISTS related_type   TEXT,
  ADD COLUMN IF NOT EXISTS related_id     TEXT,
  ADD COLUMN IF NOT EXISTS error_message  TEXT;

CREATE INDEX IF NOT EXISTS whatsapp_message_log_contact_idx ON public.whatsapp_message_log(contact_id, created_at DESC);
CREATE INDEX IF NOT EXISTS whatsapp_message_log_wa_msg_idx  ON public.whatsapp_message_log(wa_message_id);
CREATE UNIQUE INDEX IF NOT EXISTS whatsapp_message_log_dedupe_idx
  ON public.whatsapp_message_log(contact_id, template_name, related_id)
  WHERE template_name IS NOT NULL AND related_id IS NOT NULL AND direction = 'out';

-- 5. broadcasts
CREATE TABLE IF NOT EXISTS public.whatsapp_broadcasts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  template_id   UUID NOT NULL REFERENCES public.whatsapp_templates(id),
  audience_filter JSONB NOT NULL DEFAULT '{}'::jsonb,
  scheduled_at  TIMESTAMPTZ,
  status        public.whatsapp_broadcast_status NOT NULL DEFAULT 'draft',
  total_recipients INT NOT NULL DEFAULT 0,
  sent_count    INT NOT NULL DEFAULT 0,
  failed_count  INT NOT NULL DEFAULT 0,
  blocked_by_cooldown INT NOT NULL DEFAULT 0,
  created_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_broadcasts TO authenticated;
GRANT ALL ON public.whatsapp_broadcasts TO service_role;
ALTER TABLE public.whatsapp_broadcasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage broadcasts"
  ON public.whatsapp_broadcasts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_whatsapp_broadcasts_updated
  BEFORE UPDATE ON public.whatsapp_broadcasts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6. broadcast recipients
CREATE TABLE IF NOT EXISTS public.whatsapp_broadcast_recipients (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id  UUID NOT NULL REFERENCES public.whatsapp_broadcasts(id) ON DELETE CASCADE,
  contact_id    UUID NOT NULL REFERENCES public.whatsapp_contacts(id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'queued',
  wa_message_id TEXT,
  error_message TEXT,
  sent_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(broadcast_id, contact_id)
);
CREATE INDEX IF NOT EXISTS whatsapp_broadcast_recipients_status_idx
  ON public.whatsapp_broadcast_recipients(broadcast_id, status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_broadcast_recipients TO authenticated;
GRANT ALL ON public.whatsapp_broadcast_recipients TO service_role;
ALTER TABLE public.whatsapp_broadcast_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage broadcast recipients"
  ON public.whatsapp_broadcast_recipients FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- 7. upsert helper
CREATE OR REPLACE FUNCTION public.upsert_whatsapp_contact(
  _phone_e164 TEXT,
  _display_name TEXT DEFAULT NULL,
  _country TEXT DEFAULT NULL,
  _source TEXT DEFAULT 'manual',
  _user_id UUID DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE v_id UUID;
BEGIN
  IF _phone_e164 IS NULL OR length(trim(_phone_e164)) < 6 THEN RETURN NULL; END IF;
  INSERT INTO public.whatsapp_contacts (phone_e164, display_name, country, source, user_id)
  VALUES (_phone_e164, _display_name, _country, COALESCE(_source,'manual'), _user_id)
  ON CONFLICT (phone_e164) DO UPDATE SET
    display_name = COALESCE(EXCLUDED.display_name, public.whatsapp_contacts.display_name),
    country      = COALESCE(EXCLUDED.country,      public.whatsapp_contacts.country),
    user_id      = COALESCE(public.whatsapp_contacts.user_id, EXCLUDED.user_id),
    updated_at   = now()
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- 8. auto-capture from orders
CREATE OR REPLACE FUNCTION public.auto_capture_whatsapp_contact_from_order()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp AS $$
BEGIN
  IF NEW.customer_whatsapp IS NOT NULL AND length(trim(NEW.customer_whatsapp)) >= 6 THEN
    PERFORM public.upsert_whatsapp_contact(
      NEW.customer_whatsapp, NEW.customer_name, NEW.country_code,
      COALESCE(NEW.source,'checkout'), NEW.user_id
    );
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'auto_capture_whatsapp_contact_from_order failed: %', SQLERRM;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_capture_whatsapp_from_order ON public.client_orders;
CREATE TRIGGER trg_capture_whatsapp_from_order
  AFTER INSERT ON public.client_orders
  FOR EACH ROW EXECUTE FUNCTION public.auto_capture_whatsapp_contact_from_order();

-- 9. auto-capture from inquiries
CREATE OR REPLACE FUNCTION public.auto_capture_whatsapp_contact_from_inquiry()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp AS $$
BEGIN
  IF NEW.whatsapp IS NOT NULL AND length(trim(NEW.whatsapp)) >= 6 THEN
    PERFORM public.upsert_whatsapp_contact(NEW.whatsapp, NEW.full_name, NEW.country, 'inquiry', NULL);
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'auto_capture_whatsapp_contact_from_inquiry failed: %', SQLERRM;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_capture_whatsapp_from_inquiry ON public.contact_submissions;
CREATE TRIGGER trg_capture_whatsapp_from_inquiry
  AFTER INSERT ON public.contact_submissions
  FOR EACH ROW EXECUTE FUNCTION public.auto_capture_whatsapp_contact_from_inquiry();

-- 10. backfill
INSERT INTO public.whatsapp_contacts (phone_e164, display_name, country, source, user_id)
SELECT DISTINCT ON (customer_whatsapp)
  customer_whatsapp, customer_name, country_code, COALESCE(source,'checkout'), user_id
FROM public.client_orders
WHERE customer_whatsapp IS NOT NULL AND length(trim(customer_whatsapp)) >= 6
ON CONFLICT (phone_e164) DO NOTHING;

INSERT INTO public.whatsapp_contacts (phone_e164, display_name, country, source)
SELECT DISTINCT ON (whatsapp) whatsapp, full_name, country, 'inquiry'
FROM public.contact_submissions
WHERE whatsapp IS NOT NULL AND length(trim(whatsapp)) >= 6
ON CONFLICT (phone_e164) DO NOTHING;
