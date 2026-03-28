-- Add courier/tracking columns to orders table
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS tracking_number text,
  ADD COLUMN IF NOT EXISTS courier_name text,
  ADD COLUMN IF NOT EXISTS courier_tracking_url text,
  ADD COLUMN IF NOT EXISTS estimated_delivery_at timestamptz,
  ADD COLUMN IF NOT EXISTS shipped_at timestamptz,
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz,
  ADD COLUMN IF NOT EXISTS shiprocket_order_id text,
  ADD COLUMN IF NOT EXISTS shiprocket_shipment_id text,
  ADD COLUMN IF NOT EXISTS awb_code text;

-- Shipment events table — granular tracking history from courier webhooks
CREATE TABLE IF NOT EXISTS public.shipment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status text NOT NULL,
  location text,
  description text NOT NULL,
  event_time timestamptz NOT NULL,
  raw_data jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_shipment_events_order ON public.shipment_events(order_id);
CREATE INDEX IF NOT EXISTS idx_shipment_events_time ON public.shipment_events(order_id, event_time DESC);
CREATE INDEX IF NOT EXISTS idx_orders_awb ON public.orders(awb_code) WHERE awb_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_shiprocket ON public.orders(shiprocket_order_id) WHERE shiprocket_order_id IS NOT NULL;

-- RLS on shipment_events
ALTER TABLE public.shipment_events ENABLE ROW LEVEL SECURITY;

-- Customers see their own shipment events
CREATE POLICY "Users see own shipment events"
  ON public.shipment_events FOR SELECT
  USING (
    order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid())
  );

-- Admins can manage all shipment events
CREATE POLICY "Admins can manage shipment events"
  ON public.shipment_events FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Enable Realtime on shipment_events so mobile gets live tracking updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.shipment_events;

-- Add new WhatsApp templates for courier tracking
INSERT INTO public.whatsapp_templates (slug, name, category, template_body, variables) VALUES
  ('order_shipped_tracked', 'Order Shipped (with tracking)', 'order_update',
   'Hi {{customer_name}}! 📦 Your order #{{order_id}} has been shipped via {{courier_name}}. Track your shipment: {{tracking_url}} Estimated delivery: {{estimated_delivery}}',
   ARRAY['customer_name', 'order_id', 'courier_name', 'tracking_url', 'estimated_delivery']),
  ('out_for_delivery_tracked', 'Out for Delivery (with tracking)', 'order_update',
   'Hi {{customer_name}}! 🚚 Your order #{{order_id}} is out for delivery! Courier: {{courier_name}}, AWB: {{awb_code}}. Keep your phone handy at {{phone}}.',
   ARRAY['customer_name', 'order_id', 'courier_name', 'awb_code', 'phone'])
ON CONFLICT (slug) DO NOTHING;
