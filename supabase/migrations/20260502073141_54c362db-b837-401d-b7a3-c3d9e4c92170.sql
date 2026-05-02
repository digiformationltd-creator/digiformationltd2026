-- New addresses table
CREATE TABLE public.client_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  label text NOT NULL,
  service_type text NOT NULL DEFAULT 'registered_office',
  address_line1 text,
  address_line2 text,
  city text,
  county text,
  postcode text,
  country text DEFAULT 'United Kingdom',
  start_date date,
  expire_date date,
  status text NOT NULL DEFAULT 'active',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.client_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own addresses"
  ON public.client_addresses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all addresses"
  ON public.client_addresses FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins insert addresses"
  ON public.client_addresses FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update addresses"
  ON public.client_addresses FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete addresses"
  ON public.client_addresses FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_client_addresses_updated
  BEFORE UPDATE ON public.client_addresses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Admin policies on existing client_* tables so you can populate manually
CREATE POLICY "Admins manage subscriptions" ON public.client_subscriptions
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage orders" ON public.client_orders
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage wallet" ON public.client_wallet_transactions
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage documents" ON public.client_documents
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage company details" ON public.client_company_details
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage tickets" ON public.client_tickets
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));