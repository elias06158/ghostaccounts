-- GhostAccounts - Initial Schema
-- Run this migration on your Supabase project

-- ============================================================
-- 1. profiles table (extends auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id           uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        text,
  full_name    text,
  plan         text NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  language     text NOT NULL DEFAULT 'en',
  notify_breach       boolean NOT NULL DEFAULT true,
  notify_new_account  boolean NOT NULL DEFAULT false,
  last_scan_at        timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- Auto-create profile on new auth user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 2. scan_results table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.scan_results (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  service_name        text NOT NULL,
  service_domain      text NOT NULL,
  first_detected_at   timestamptz NOT NULL DEFAULT now(),
  last_email_date     text,
  breach_status       text NOT NULL DEFAULT 'safe' CHECK (breach_status IN ('safe', 'breached', 'unknown')),
  breach_count        int NOT NULL DEFAULT 0,
  breach_last_checked timestamptz,
  deletion_status     text NOT NULL DEFAULT 'active' CHECK (deletion_status IN ('active', 'deleted', 'ignored')),
  deletion_url        text,
  deletion_difficulty text CHECK (deletion_difficulty IN ('easy', 'medium', 'hard')),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, service_domain)
);

-- Index for fast per-user lookups
CREATE INDEX IF NOT EXISTS idx_scan_results_user_id ON public.scan_results(user_id);

-- ============================================================
-- 3. breach_alerts table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.breach_alerts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  service_name text NOT NULL,
  breach_name  text NOT NULL,
  breach_date  text,
  data_types   text[] DEFAULT '{}',
  is_read      boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_breach_alerts_user_id ON public.breach_alerts(user_id);

-- ============================================================
-- 4. Row Level Security (RLS)
-- ============================================================

-- profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_profile_select" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_own_profile_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "users_own_profile_delete" ON public.profiles FOR DELETE USING (auth.uid() = id);

-- scan_results
ALTER TABLE public.scan_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_scan_results_all" ON public.scan_results
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- breach_alerts
ALTER TABLE public.breach_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_breach_alerts_all" ON public.breach_alerts
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
