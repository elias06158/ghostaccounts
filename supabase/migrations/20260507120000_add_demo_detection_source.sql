-- Add 'demo' as a valid detection_source value
ALTER TABLE public.scan_results
  DROP CONSTRAINT IF EXISTS scan_results_detection_source_check;

ALTER TABLE public.scan_results
  ADD CONSTRAINT scan_results_detection_source_check
    CHECK (detection_source IN ('gmail', 'imap', 'mixed', 'demo'));
