
-- Roles enum + user_roles table (separate from profiles, prevents privilege escalation)
CREATE TYPE public.app_role AS ENUM ('admin', 'client');

-- Profiles table for user info
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  company_name TEXT,
  avatar_initials TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer role check (prevents recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Profiles RLS
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- user_roles RLS — users can read their own roles only
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Auto-create profile + assign 'client' role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, avatar_initials)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    UPPER(LEFT(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 2))
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'client');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at trigger for profiles
CREATE TRIGGER profiles_set_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Company details (one per user)
CREATE TABLE public.client_company_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT,
  company_number TEXT,
  director_name TEXT,
  company_address TEXT,
  registered_address TEXT,
  address_expire DATE,
  confirmation_due DATE,
  accounts_filing_due DATE,
  auth_code TEXT,
  incorporation_date DATE,
  sic_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.client_company_details ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own company" ON public.client_company_details FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own company" ON public.client_company_details FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own company" ON public.client_company_details FOR UPDATE USING (auth.uid() = user_id);
CREATE TRIGGER client_company_set_updated_at BEFORE UPDATE ON public.client_company_details FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Subscriptions
CREATE TABLE public.client_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL,
  price_gbp NUMERIC(10,2) NOT NULL DEFAULT 0,
  period TEXT NOT NULL DEFAULT 'year',
  start_date DATE,
  renewal_date DATE,
  next_billing DATE,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.client_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own subs" ON public.client_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE TRIGGER client_subs_set_updated_at BEFORE UPDATE ON public.client_subscriptions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Orders
CREATE TABLE public.client_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_ref TEXT NOT NULL,
  service TEXT NOT NULL,
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'Pending',
  amount_gbp NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.client_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own orders" ON public.client_orders FOR SELECT USING (auth.uid() = user_id);

-- Wallet transactions
CREATE TABLE public.client_wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  txn_ref TEXT NOT NULL,
  description TEXT NOT NULL,
  txn_date DATE NOT NULL DEFAULT CURRENT_DATE,
  txn_type TEXT NOT NULL CHECK (txn_type IN ('credit','debit')),
  amount_gbp NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.client_wallet_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own wallet" ON public.client_wallet_transactions FOR SELECT USING (auth.uid() = user_id);

-- Documents
CREATE TABLE public.client_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  doc_date DATE NOT NULL DEFAULT CURRENT_DATE,
  file_type TEXT,
  file_size TEXT,
  file_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.client_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own docs" ON public.client_documents FOR SELECT USING (auth.uid() = user_id);

-- Tickets
CREATE TABLE public.client_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ticket_ref TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Open',
  replies_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.client_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own tickets" ON public.client_tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own tickets" ON public.client_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER client_tickets_set_updated_at BEFORE UPDATE ON public.client_tickets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Indexes
CREATE INDEX idx_orders_user ON public.client_orders(user_id);
CREATE INDEX idx_wallet_user ON public.client_wallet_transactions(user_id);
CREATE INDEX idx_docs_user ON public.client_documents(user_id);
CREATE INDEX idx_tickets_user ON public.client_tickets(user_id);
CREATE INDEX idx_subs_user ON public.client_subscriptions(user_id);
