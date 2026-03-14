
-- Remove the overly permissive insert policy since the SECURITY DEFINER trigger handles inserts
DROP POLICY "Triggers can insert audit logs" ON public.audit_logs;
