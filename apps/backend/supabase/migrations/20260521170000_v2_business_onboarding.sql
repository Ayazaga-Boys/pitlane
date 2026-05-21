CREATE TABLE IF NOT EXISTS public.business_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL CHECK (char_length(business_name) BETWEEN 2 AND 120),
  category TEXT NOT NULL CHECK (category IN ('garage','repair','parts','fuel','cafe','dealer','other')),
  description TEXT CHECK (description IS NULL OR char_length(description) <= 2000),
  h3_cell TEXT NOT NULL CHECK (h3_cell ~ '^[0-9a-fA-F]{15}$'),
  latitude DOUBLE PRECISION NOT NULL CHECK (latitude >= -90 AND latitude <= 90),
  longitude DOUBLE PRECISION NOT NULL CHECK (longitude >= -180 AND longitude <= 180),
  address TEXT NOT NULL CHECK (char_length(address) BETWEEN 3 AND 240),
  phone TEXT CHECK (phone IS NULL OR char_length(phone) <= 24),
  website TEXT,
  photo_url TEXT,
  working_hours JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(working_hours) = 'object'),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','under_review','approved','rejected')),
  rejection_reason TEXT CHECK (rejection_reason IS NULL OR char_length(rejection_reason) <= 500),
  reviewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  location_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_business_applications_active_applicant
  ON public.business_applications(applicant_id)
  WHERE status IN ('pending','under_review');
CREATE INDEX IF NOT EXISTS idx_business_applications_status_created
  ON public.business_applications(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_business_applications_applicant_created
  ON public.business_applications(applicant_id, created_at DESC);

ALTER TABLE public.business_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "business_applications_select_owner_or_admin" ON public.business_applications;
CREATE POLICY "business_applications_select_owner_or_admin" ON public.business_applications
  FOR SELECT USING (
    applicant_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "business_applications_insert_owner" ON public.business_applications;
CREATE POLICY "business_applications_insert_owner" ON public.business_applications
  FOR INSERT WITH CHECK (applicant_id = auth.uid());

DROP POLICY IF EXISTS "business_applications_update_admin" ON public.business_applications;
CREATE POLICY "business_applications_update_admin" ON public.business_applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

DROP TRIGGER IF EXISTS business_applications_updated_at ON public.business_applications;
CREATE TRIGGER business_applications_updated_at
  BEFORE UPDATE ON public.business_applications
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE IF NOT EXISTS public.business_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  source_application_id UUID UNIQUE REFERENCES public.business_applications(id) ON DELETE SET NULL,
  business_name TEXT NOT NULL CHECK (char_length(business_name) BETWEEN 2 AND 120),
  category TEXT NOT NULL CHECK (category IN ('garage','repair','parts','fuel','cafe','dealer','other')),
  description TEXT CHECK (description IS NULL OR char_length(description) <= 2000),
  h3_cell TEXT NOT NULL CHECK (h3_cell ~ '^[0-9a-fA-F]{15}$'),
  latitude DOUBLE PRECISION NOT NULL CHECK (latitude >= -90 AND latitude <= 90),
  longitude DOUBLE PRECISION NOT NULL CHECK (longitude >= -180 AND longitude <= 180),
  address TEXT NOT NULL CHECK (char_length(address) BETWEEN 3 AND 240),
  phone TEXT CHECK (phone IS NULL OR char_length(phone) <= 24),
  website TEXT,
  photo_url TEXT,
  working_hours JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(working_hours) = 'object'),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  featured_rank INTEGER NOT NULL DEFAULT 1000 CHECK (featured_rank >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_business_locations_h3_category
  ON public.business_locations(h3_cell, category)
  WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_business_locations_owner
  ON public.business_locations(owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_business_locations_featured
  ON public.business_locations(featured_rank ASC, created_at DESC)
  WHERE is_active = TRUE;

ALTER TABLE public.business_locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "business_locations_select_active" ON public.business_locations;
CREATE POLICY "business_locations_select_active" ON public.business_locations
  FOR SELECT USING (
    is_active = TRUE
    OR owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "business_locations_write_admin" ON public.business_locations;
CREATE POLICY "business_locations_write_admin" ON public.business_locations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

DROP TRIGGER IF EXISTS business_locations_updated_at ON public.business_locations;
CREATE TRIGGER business_locations_updated_at
  BEFORE UPDATE ON public.business_locations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE IF NOT EXISTS public.business_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.business_applications(id) ON DELETE CASCADE,
  uploader_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('tax_license','business_license','identity','other')),
  storage_key TEXT NOT NULL UNIQUE,
  content_type TEXT NOT NULL CHECK (content_type IN ('application/pdf','image/jpeg','image/png','image/webp')),
  size_bytes INTEGER NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 15728640),
  status TEXT NOT NULL DEFAULT 'pending_upload' CHECK (status IN ('pending_upload','uploaded','rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_business_documents_application
  ON public.business_documents(application_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_business_documents_uploader
  ON public.business_documents(uploader_id, created_at DESC);

ALTER TABLE public.business_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "business_documents_select_owner_or_admin" ON public.business_documents;
CREATE POLICY "business_documents_select_owner_or_admin" ON public.business_documents
  FOR SELECT USING (
    uploader_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "business_documents_insert_owner" ON public.business_documents;
CREATE POLICY "business_documents_insert_owner" ON public.business_documents
  FOR INSERT WITH CHECK (
    uploader_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.business_applications
      WHERE business_applications.id = business_documents.application_id
        AND business_applications.applicant_id = auth.uid()
        AND business_applications.status IN ('pending','under_review')
    )
  );

ALTER TABLE public.business_applications
  DROP CONSTRAINT IF EXISTS business_applications_location_id_fkey;
ALTER TABLE public.business_applications
  ADD CONSTRAINT business_applications_location_id_fkey
  FOREIGN KEY (location_id) REFERENCES public.business_locations(id) ON DELETE SET NULL;

GRANT SELECT, INSERT, UPDATE ON public.business_applications TO authenticated;
GRANT ALL ON public.business_applications TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.business_locations TO authenticated;
GRANT ALL ON public.business_locations TO service_role;

GRANT SELECT, INSERT ON public.business_documents TO authenticated;
GRANT ALL ON public.business_documents TO service_role;
