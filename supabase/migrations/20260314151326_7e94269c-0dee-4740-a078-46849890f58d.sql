-- Create storage bucket for backups
INSERT INTO storage.buckets (id, name, public)
VALUES ('backups', 'backups', false)
ON CONFLICT (id) DO NOTHING;

-- RLS: Only super admins can manage backup files
CREATE POLICY "Super admins can manage backups"
ON storage.objects
FOR ALL
USING (bucket_id = 'backups' AND public.has_role(auth.uid(), 'super_admin'::public.app_role))
WITH CHECK (bucket_id = 'backups' AND public.has_role(auth.uid(), 'super_admin'::public.app_role));