ALTER TABLE public.business_pins
  ADD COLUMN IF NOT EXISTS tax_document_key TEXT,
  ADD COLUMN IF NOT EXISTS tax_document_content_type TEXT CHECK (
    tax_document_content_type IS NULL
    OR tax_document_content_type IN ('application/pdf','image/jpeg','image/png','image/webp')
  ),
  ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'not_submitted' CHECK (
    verification_status IN ('not_submitted','pending','verified','rejected')
  ),
  ADD COLUMN IF NOT EXISTS verification_submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_business_pins_verification_status
  ON public.business_pins(verification_status);
