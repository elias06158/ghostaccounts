ALTER TABLE public.scan_results
  ADD COLUMN IF NOT EXISTS evidence_count integer NOT NULL DEFAULT 1 CHECK (evidence_count >= 1),
  ADD COLUMN IF NOT EXISTS evidence_types text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS sender_domains text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS detection_confidence text NOT NULL DEFAULT 'medium' CHECK (detection_confidence IN ('low', 'medium', 'high')),
  ADD COLUMN IF NOT EXISTS detection_source text NOT NULL DEFAULT 'gmail' CHECK (detection_source IN ('gmail', 'imap', 'mixed'));

UPDATE public.scan_results
SET
  evidence_types = CASE
    WHEN cardinality(evidence_types) = 0 THEN ARRAY['sender-domain']::text[]
    ELSE evidence_types
  END,
  sender_domains = CASE
    WHEN cardinality(sender_domains) = 0 AND service_domain IS NOT NULL AND service_domain <> ''
      THEN ARRAY[service_domain]::text[]
    ELSE sender_domains
  END
WHERE TRUE;