
CREATE TYPE public.email_prospect_campaign AS ENUM (
  'idv_acsp','uk_formation','banking','compliance','ai_dashboard','website_dev'
);
CREATE TYPE public.email_prospect_status AS ENUM (
  'new','qualified','rejected','enrolled','replied','completed'
);
CREATE TYPE public.email_prospect_size AS ENUM (
  'micro','small','medium','established','unknown'
);

CREATE TABLE public.email_prospects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_name TEXT NOT NULL,
  contact_email TEXT,
  contact_name TEXT,
  website TEXT,
  has_website BOOLEAN GENERATED ALWAYS AS (website IS NOT NULL AND length(trim(website)) > 0) STORED,
  business_type TEXT,
  industry TEXT,
  location TEXT,
  country TEXT,
  size_category public.email_prospect_size NOT NULL DEFAULT 'unknown',
  source TEXT NOT NULL DEFAULT 'csv',
  assigned_campaign public.email_prospect_campaign,
  status public.email_prospect_status NOT NULL DEFAULT 'new',
  is_existing_customer BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  ai_classification JSONB,
  imported_batch UUID,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_email_prospects_status ON public.email_prospects(status);
CREATE INDEX idx_email_prospects_campaign ON public.email_prospects(assigned_campaign);
CREATE INDEX idx_email_prospects_email ON public.email_prospects(contact_email);
CREATE INDEX idx_email_prospects_batch ON public.email_prospects(imported_batch);
CREATE UNIQUE INDEX uq_email_prospects_email_lower
  ON public.email_prospects (lower(contact_email))
  WHERE contact_email IS NOT NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_prospects TO authenticated;
GRANT ALL ON public.email_prospects TO service_role;
ALTER TABLE public.email_prospects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage prospects" ON public.email_prospects
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_email_prospects_updated_at
  BEFORE UPDATE ON public.email_prospects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.email_prospect_imports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  filename TEXT,
  row_count INT NOT NULL DEFAULT 0,
  inserted_count INT NOT NULL DEFAULT 0,
  skipped_count INT NOT NULL DEFAULT 0,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_prospect_imports TO authenticated;
GRANT ALL ON public.email_prospect_imports TO service_role;
ALTER TABLE public.email_prospect_imports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage prospect imports" ON public.email_prospect_imports
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
