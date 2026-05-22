ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS presence_status TEXT NOT NULL DEFAULT 'offline'
    CHECK (presence_status IN ('online','dnd','offline')),
  ADD COLUMN IF NOT EXISTS presence_visible BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS presence_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_profiles_presence_status
  ON public.profiles(presence_status, presence_updated_at DESC);

ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS icon_slug TEXT CHECK (
    icon_slug IS NULL
    OR icon_slug IN (
      'motorcycle_standard',
      'motorcycle_chopper',
      'motorcycle_sport',
      'motorcycle_enduro',
      'motorcycle_scooter',
      'car_sedan',
      'car_suv',
      'car_hatchback',
      'car_pickup',
      'car_classic',
      'car_sport'
    )
  );

CREATE INDEX IF NOT EXISTS idx_vehicles_user_primary_icon
  ON public.vehicles(user_id, is_primary, icon_slug);
