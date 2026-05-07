-- Digital Will / Testament Mode
-- Allows users to define what happens to their accounts on inactivity/death

-- ============================================================
-- 1. digital_will table (global user settings)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.digital_will (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  is_active           boolean NOT NULL DEFAULT false,
  inactivity_months   integer NOT NULL DEFAULT 6 CHECK (inactivity_months BETWEEN 1 AND 60),
  global_action       text NOT NULL DEFAULT 'archive' CHECK (global_action IN ('delete', 'transfer', 'archive')),
  transfer_email      text,
  transfer_name       text,
  personal_message    text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.digital_will ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own will"
  ON public.digital_will
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 2. digital_will_items table (per-account overrides)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.digital_will_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  scan_result_id  uuid NOT NULL REFERENCES public.scan_results(id) ON DELETE CASCADE,
  action          text NOT NULL DEFAULT 'inherit' CHECK (action IN ('inherit', 'delete', 'transfer', 'archive', 'keep')),
  transfer_email  text,
  note            text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, scan_result_id)
);

ALTER TABLE public.digital_will_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own will items"
  ON public.digital_will_items
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
