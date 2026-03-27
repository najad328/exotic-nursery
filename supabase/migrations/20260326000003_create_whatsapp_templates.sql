-- =============================================================
-- Migration: WhatsApp message templates
-- =============================================================

CREATE TABLE public.whatsapp_templates (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  slug        text NOT NULL UNIQUE,
  category    text NOT NULL DEFAULT 'general' CHECK (category IN ('order_status', 'inquiry', 'promotion', 'general')),
  message     text NOT NULL,
  variables   text[] NOT NULL DEFAULT '{}',
  is_active   boolean NOT NULL DEFAULT true,
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;

-- Anyone can read active templates
CREATE POLICY "Anyone can read active templates"
  ON public.whatsapp_templates FOR SELECT
  USING (is_active = true);

-- Admins can manage all templates
CREATE POLICY "Admins manage templates"
  ON public.whatsapp_templates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE TRIGGER whatsapp_templates_updated_at
  BEFORE UPDATE ON public.whatsapp_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Seed default templates
INSERT INTO public.whatsapp_templates (name, slug, category, message, variables, sort_order) VALUES
(
  'Order Confirmation',
  'order-confirmation',
  'order_status',
  'Hi {{customer_name}}! 🌿 Your order #{{order_id}} has been placed successfully. Total: {{total}}. We''ll update you on the progress. Thank you for choosing Exotic Nursery! 🪴',
  ARRAY['customer_name', 'order_id', 'total'],
  1
),
(
  'Order Confirmed',
  'order-confirmed',
  'order_status',
  'Great news, {{customer_name}}! ✅ Your order #{{order_id}} has been confirmed and is being prepared. We''ll ship it soon!',
  ARRAY['customer_name', 'order_id'],
  2
),
(
  'Order Shipped',
  'order-shipped',
  'order_status',
  'Hey {{customer_name}}! 📦 Your order #{{order_id}} has been shipped! It''s on its way to {{delivery_city}}. You''ll receive it soon. Track it in the app!',
  ARRAY['customer_name', 'order_id', 'delivery_city'],
  3
),
(
  'Out for Delivery',
  'out-for-delivery',
  'order_status',
  '{{customer_name}}, your order #{{order_id}} is out for delivery! 🚚 Please keep your phone handy. The delivery person will contact you at {{delivery_phone}}.',
  ARRAY['customer_name', 'order_id', 'delivery_phone'],
  4
),
(
  'Order Delivered',
  'order-delivered',
  'order_status',
  'Hi {{customer_name}}! 🎉 Your order #{{order_id}} has been delivered. We hope you love your new plants! Need care tips? Ask our AI chatbot in the app. Thank you! 🌿',
  ARRAY['customer_name', 'order_id'],
  5
),
(
  'Plant Inquiry Response',
  'plant-inquiry',
  'inquiry',
  'Hi {{customer_name}}! Thanks for your interest in {{plant_name}}. It''s priced at {{price}} and we currently have {{stock}} in stock. Would you like to place an order? 🌱',
  ARRAY['customer_name', 'plant_name', 'price', 'stock'],
  6
),
(
  'New Arrival Alert',
  'new-arrival',
  'promotion',
  'Hey plant lovers! 🌿 We just added {{plant_name}} to our collection! {{description}} Get yours before it''s gone — only {{stock}} available! Check it out on the Exotic Nursery app.',
  ARRAY['plant_name', 'description', 'stock'],
  7
);
