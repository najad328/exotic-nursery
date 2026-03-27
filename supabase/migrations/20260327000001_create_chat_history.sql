-- =============================================================
-- Migration: Chat history for AI plant chatbot
-- =============================================================

CREATE TABLE public.chat_history (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role        text NOT NULL CHECK (role IN ('user', 'assistant')),
  content     text NOT NULL,
  plant_id    uuid REFERENCES public.plants(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;

-- Users can read/insert their own chat history
CREATE POLICY "Users manage own chat history"
  ON public.chat_history FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index for fast history lookup
CREATE INDEX chat_history_user_created ON public.chat_history (user_id, created_at DESC);
