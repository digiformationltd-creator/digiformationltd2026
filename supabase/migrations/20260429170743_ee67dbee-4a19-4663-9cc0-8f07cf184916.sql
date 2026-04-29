-- Create pricing table for US LLC formation per state
CREATE TABLE public.us_llc_state_pricing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  state_code TEXT NOT NULL UNIQUE,
  state_name TEXT NOT NULL,
  starter_price_usd NUMERIC(10,2) NOT NULL DEFAULT 0,
  silver_price_usd NUMERIC(10,2) NOT NULL DEFAULT 0,
  gold_price_usd NUMERIC(10,2) NOT NULL DEFAULT 0,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_popular BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.us_llc_state_pricing ENABLE ROW LEVEL SECURITY;

-- Public read access (pricing must be visible to all visitors)
CREATE POLICY "Pricing is publicly readable"
ON public.us_llc_state_pricing
FOR SELECT
USING (true);

-- Reuse existing timestamp trigger function if exists, otherwise create
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_us_llc_state_pricing_updated_at
BEFORE UPDATE ON public.us_llc_state_pricing
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Seed all 50 states with placeholder prices (you'll provide real rates later)
INSERT INTO public.us_llc_state_pricing (state_code, state_name, starter_price_usd, silver_price_usd, gold_price_usd, display_order, is_popular) VALUES
('WY', 'Wyoming',        199, 349, 599, 1, true),
('DE', 'Delaware',       249, 399, 649, 2, true),
('FL', 'Florida',        229, 379, 629, 3, true),
('TX', 'Texas',          249, 399, 649, 4, true),
('NM', 'New Mexico',     179, 329, 579, 5, true),
('MT', 'Montana',        199, 349, 599, 6, true),
('AL', 'Alabama',        229, 379, 629, 10, false),
('AK', 'Alaska',         269, 419, 669, 11, false),
('AZ', 'Arizona',        219, 369, 619, 12, false),
('AR', 'Arkansas',       209, 359, 609, 13, false),
('CA', 'California',     299, 449, 699, 14, false),
('CO', 'Colorado',       209, 359, 609, 15, false),
('CT', 'Connecticut',    259, 409, 659, 16, false),
('GA', 'Georgia',        219, 369, 619, 17, false),
('HI', 'Hawaii',         259, 409, 659, 18, false),
('ID', 'Idaho',          209, 359, 609, 19, false),
('IL', 'Illinois',       259, 409, 659, 20, false),
('IN', 'Indiana',        219, 369, 619, 21, false),
('IA', 'Iowa',           209, 359, 609, 22, false),
('KS', 'Kansas',         219, 369, 619, 23, false),
('KY', 'Kentucky',       209, 359, 609, 24, false),
('LA', 'Louisiana',      229, 379, 629, 25, false),
('ME', 'Maine',          229, 379, 629, 26, false),
('MD', 'Maryland',       239, 389, 639, 27, false),
('MA', 'Massachusetts',  269, 419, 669, 28, false),
('MI', 'Michigan',       219, 369, 619, 29, false),
('MN', 'Minnesota',      229, 379, 629, 30, false),
('MS', 'Mississippi',    209, 359, 609, 31, false),
('MO', 'Missouri',       209, 359, 609, 32, false),
('NE', 'Nebraska',       219, 369, 619, 33, false),
('NV', 'Nevada',         279, 429, 679, 34, false),
('NH', 'New Hampshire',  229, 379, 629, 35, false),
('NJ', 'New Jersey',     249, 399, 649, 36, false),
('NY', 'New York',       289, 439, 689, 37, false),
('NC', 'North Carolina', 229, 379, 629, 38, false),
('ND', 'North Dakota',   209, 359, 609, 39, false),
('OH', 'Ohio',           219, 369, 619, 40, false),
('OK', 'Oklahoma',       209, 359, 609, 41, false),
('OR', 'Oregon',         229, 379, 629, 42, false),
('PA', 'Pennsylvania',   239, 389, 639, 43, false),
('RI', 'Rhode Island',   239, 389, 639, 44, false),
('SC', 'South Carolina', 219, 369, 619, 45, false),
('SD', 'South Dakota',   209, 359, 609, 46, false),
('TN', 'Tennessee',      229, 379, 629, 47, false),
('UT', 'Utah',           209, 359, 609, 48, false),
('VT', 'Vermont',        229, 379, 629, 49, false),
('VA', 'Virginia',       229, 379, 629, 50, false),
('WA', 'Washington',     249, 399, 649, 51, false),
('WV', 'West Virginia',  209, 359, 609, 52, false),
('WI', 'Wisconsin',      219, 369, 619, 53, false);