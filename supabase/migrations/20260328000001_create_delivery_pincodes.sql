-- Delivery Pincodes table
CREATE TABLE IF NOT EXISTS public.delivery_pincodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pincode text NOT NULL,
  area_name text,
  city text,
  state text,
  is_active boolean DEFAULT true,
  delivery_days integer DEFAULT 3,
  created_at timestamptz DEFAULT now(),
  UNIQUE(pincode)
);

-- Index for fast lookup
CREATE INDEX idx_delivery_pincodes_pincode ON public.delivery_pincodes (pincode) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.delivery_pincodes ENABLE ROW LEVEL SECURITY;

-- Everyone can check if a pincode is serviceable (read-only)
CREATE POLICY "Anyone can check delivery pincodes"
  ON public.delivery_pincodes FOR SELECT
  USING (true);

-- Only admins can manage pincodes
CREATE POLICY "Admins can manage delivery pincodes"
  ON public.delivery_pincodes FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Seed some sample pincodes
INSERT INTO public.delivery_pincodes (pincode, area_name, city, state, delivery_days) VALUES
  ('560001', 'MG Road', 'Bangalore', 'Karnataka', 2),
  ('560002', 'Shivajinagar', 'Bangalore', 'Karnataka', 2),
  ('560003', 'Ulsoor', 'Bangalore', 'Karnataka', 2),
  ('560004', 'Frazer Town', 'Bangalore', 'Karnataka', 2),
  ('560005', 'Rajajinagar', 'Bangalore', 'Karnataka', 3),
  ('560010', 'Jayanagar', 'Bangalore', 'Karnataka', 2),
  ('560011', 'Basavanagudi', 'Bangalore', 'Karnataka', 2),
  ('560034', 'Koramangala', 'Bangalore', 'Karnataka', 2),
  ('560038', 'Indiranagar', 'Bangalore', 'Karnataka', 2),
  ('560041', 'Whitefield', 'Bangalore', 'Karnataka', 3),
  ('560066', 'Electronic City', 'Bangalore', 'Karnataka', 3),
  ('560076', 'HSR Layout', 'Bangalore', 'Karnataka', 2),
  ('560078', 'Marathahalli', 'Bangalore', 'Karnataka', 3),
  ('560095', 'Sarjapur Road', 'Bangalore', 'Karnataka', 3),
  ('560100', 'Yelahanka', 'Bangalore', 'Karnataka', 3),
  ('110001', 'Connaught Place', 'New Delhi', 'Delhi', 4),
  ('110002', 'Darya Ganj', 'New Delhi', 'Delhi', 4),
  ('110003', 'Civil Lines', 'New Delhi', 'Delhi', 4),
  ('400001', 'Fort', 'Mumbai', 'Maharashtra', 4),
  ('400002', 'Kalbadevi', 'Mumbai', 'Maharashtra', 4)
ON CONFLICT (pincode) DO NOTHING;
