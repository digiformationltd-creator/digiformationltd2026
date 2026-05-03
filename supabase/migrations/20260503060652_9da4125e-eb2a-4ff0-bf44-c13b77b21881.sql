
CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  order_id uuid,
  invoice_number text NOT NULL UNIQUE,
  service_code text NOT NULL DEFAULT 'O',
  service_description text NOT NULL,
  bill_to_name text,
  bill_to_email text,
  bill_to_address text,
  amount_gbp numeric NOT NULL DEFAULT 0,
  vat_rate numeric NOT NULL DEFAULT 0,
  vat_gbp numeric NOT NULL DEFAULT 0,
  total_gbp numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'GBP',
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date,
  status text NOT NULL DEFAULT 'Unpaid',
  notes text,
  pdf_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage invoices" ON public.invoices
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users view own invoices" ON public.invoices
  FOR SELECT USING (auth.uid() = user_id);

CREATE TRIGGER invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_invoices_user ON public.invoices(user_id);
CREATE INDEX idx_invoices_number ON public.invoices(invoice_number);
