
CREATE TYPE public.managed_company_status AS ENUM ('available','reserved','sold_out','unavailable');

CREATE TABLE public.managed_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  company_number text,
  incorporation_date date,
  sic_code text,
  registered_address text,
  confirmation_due date,
  accounts_filing_due date,
  address_expire date,
  status public.managed_company_status NOT NULL DEFAULT 'available',
  notes text,
  imported_batch text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX managed_companies_number_unique
  ON public.managed_companies (lower(company_number))
  WHERE company_number IS NOT NULL;

CREATE INDEX managed_companies_status_idx ON public.managed_companies (status);
CREATE INDEX managed_companies_confirmation_due_idx ON public.managed_companies (confirmation_due);
CREATE INDEX managed_companies_accounts_due_idx ON public.managed_companies (accounts_filing_due);
CREATE INDEX managed_companies_address_expire_idx ON public.managed_companies (address_expire);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.managed_companies TO authenticated;
GRANT ALL ON public.managed_companies TO service_role;

ALTER TABLE public.managed_companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read managed_companies"
  ON public.managed_companies FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins insert managed_companies"
  ON public.managed_companies FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update managed_companies"
  ON public.managed_companies FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete managed_companies"
  ON public.managed_companies FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER managed_companies_set_updated_at
  BEFORE UPDATE ON public.managed_companies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
