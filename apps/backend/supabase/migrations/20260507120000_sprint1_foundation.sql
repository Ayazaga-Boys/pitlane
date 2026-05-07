CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username        TEXT NOT NULL UNIQUE CHECK (username ~ '^[A-Za-z0-9_]{3,20}$'),
  display_name    TEXT CHECK (display_name IS NULL OR char_length(display_name) BETWEEN 2 AND 50),
  avatar_url      TEXT,
  bio             TEXT CHECK (char_length(bio) <= 300),
  ghost_mode      BOOLEAN NOT NULL DEFAULT FALSE,
  is_verified     BOOLEAN NOT NULL DEFAULT FALSE,
  role            TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user','moderator','admin')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_username_trgm ON public.profiles USING gin (username gin_trgm_ops);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_public" ON public.profiles;
CREATE POLICY "profiles_select_public" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  desired_username TEXT;
BEGIN
  desired_username := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'username', ''),
    'user_' || substr(NEW.id::text, 1, 8)
  );

  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    desired_username,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE IF NOT EXISTS public.vehicles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('car','motorcycle','other')),
  make        TEXT NOT NULL CHECK (char_length(make) BETWEEN 1 AND 60),
  model       TEXT NOT NULL CHECK (char_length(model) BETWEEN 1 AND 60),
  year        SMALLINT CHECK (year BETWEEN 1885 AND 2100),
  color       TEXT CHECK (color IS NULL OR char_length(color) <= 40),
  photo_url   TEXT,
  is_primary  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vehicles_user ON public.vehicles(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_vehicles_one_primary_per_user
  ON public.vehicles(user_id)
  WHERE is_primary = TRUE;

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vehicles_crud_own" ON public.vehicles;
CREATE POLICY "vehicles_crud_own" ON public.vehicles
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.invite_codes (
  code        TEXT PRIMARY KEY,
  inviter_id  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  uses_count  INTEGER NOT NULL DEFAULT 0 CHECK (uses_count >= 0),
  max_uses    INTEGER NOT NULL DEFAULT 5 CHECK (max_uses > 0),
  expires_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (uses_count <= max_uses)
);

CREATE INDEX IF NOT EXISTS idx_invite_codes_inviter ON public.invite_codes(inviter_id);

ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "invite_codes_select_own" ON public.invite_codes;
CREATE POLICY "invite_codes_select_own" ON public.invite_codes
  FOR SELECT USING (auth.uid() = inviter_id);

CREATE TABLE IF NOT EXISTS public.waiting_list (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email        TEXT NOT NULL UNIQUE,
  vehicle_type TEXT CHECK (vehicle_type IN ('car','motorcycle','other')),
  city         TEXT CHECK (city IS NULL OR char_length(city) <= 80),
  invited_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.waiting_list ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.remote_configs (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL,
  description TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by  UUID REFERENCES public.profiles(id)
);

ALTER TABLE public.remote_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rc_select_authenticated" ON public.remote_configs;
CREATE POLICY "rc_select_authenticated"
  ON public.remote_configs FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "rc_write_admin" ON public.remote_configs;
CREATE POLICY "rc_write_admin"
  ON public.remote_configs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP TRIGGER IF EXISTS remote_configs_updated_at ON public.remote_configs;
CREATE TRIGGER remote_configs_updated_at
  BEFORE UPDATE ON public.remote_configs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

INSERT INTO public.remote_configs (key, value, description) VALUES
  ('feature_invite_only',       'true',   'Davet kodu zorunlu mu?'),
  ('feature_camera_enabled',    'false',  'Kamera özelliği aktif mi?'),
  ('feature_help_enabled',      'false',  'Acil yardım özelliği aktif mi?'),
  ('feature_business_pins',     'false',  'İşletme pinleri görünür mü?'),
  ('max_flares_per_user_day',   '5',      'Kullanıcı başına günlük max flare'),
  ('max_help_per_user_hour',    '2',      'Kullanıcı başına saatlik max yardım talebi'),
  ('min_supported_app_version', '"1.0.0"', 'Bu sürümün altındaki app force-update bekler')
ON CONFLICT (key) DO NOTHING;
