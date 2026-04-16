-- =============================================================
-- Push Notification Tables
-- Stores device tokens and notification history
-- =============================================================

-- 1. Push Tokens — one per device per user
CREATE TABLE public.push_tokens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token       text NOT NULL,
  device_name text,
  platform    text NOT NULL DEFAULT 'unknown'
    CHECK (platform IN ('ios', 'android', 'web', 'unknown')),
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, token)
);

ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

-- Users can manage their own tokens
CREATE POLICY "Users manage own push tokens"
  ON public.push_tokens FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can read all tokens (for broadcast notifications)
CREATE POLICY "Admins read all push tokens"
  ON public.push_tokens FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE TRIGGER push_tokens_updated_at
  BEFORE UPDATE ON public.push_tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_push_tokens_user_active ON public.push_tokens(user_id) WHERE is_active = true;
CREATE INDEX idx_push_tokens_token ON public.push_tokens(token);


-- 2. Notification Log — audit trail for all sent notifications
CREATE TABLE public.notification_log (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  order_id      uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  plant_id      uuid REFERENCES public.plants(id) ON DELETE SET NULL,
  type          text NOT NULL
    CHECK (type IN ('order_status', 'new_arrival', 'price_drop', 'promotion', 'custom')),
  title         text NOT NULL,
  body          text NOT NULL,
  data          jsonb,
  sent_at       timestamptz NOT NULL DEFAULT now(),
  is_broadcast  boolean NOT NULL DEFAULT false,
  status        text NOT NULL DEFAULT 'sent'
    CHECK (status IN ('sent', 'failed')),
  recipient_count int NOT NULL DEFAULT 1
);

ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;

-- Users see their own notifications
CREATE POLICY "Users see own notifications"
  ON public.notification_log FOR SELECT
  USING (auth.uid() = user_id OR is_broadcast = true);

-- Admins manage all notifications
CREATE POLICY "Admins manage all notifications"
  ON public.notification_log FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE INDEX idx_notification_log_user ON public.notification_log(user_id);
CREATE INDEX idx_notification_log_order ON public.notification_log(order_id);
CREATE INDEX idx_notification_log_type ON public.notification_log(type);
CREATE INDEX idx_notification_log_sent ON public.notification_log(sent_at DESC);
