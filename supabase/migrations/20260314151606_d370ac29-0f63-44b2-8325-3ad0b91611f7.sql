-- Create backup metadata table
CREATE TABLE public.backup_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name text NOT NULL,
  file_size bigint NOT NULL DEFAULT 0,
  record_count integer NOT NULL DEFAULT 0,
  tables_included text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'completed',
  backup_type text NOT NULL DEFAULT 'manual',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  error_message text
);

-- Enable RLS
ALTER TABLE public.backup_metadata ENABLE ROW LEVEL SECURITY;

-- Only super admins can view backup metadata
CREATE POLICY "Super admins can view backup metadata"
ON public.backup_metadata
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::app_role));

-- Only super admins can insert backup metadata
CREATE POLICY "Super admins can insert backup metadata"
ON public.backup_metadata
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

-- Only super admins can delete backup metadata
CREATE POLICY "Super admins can delete backup metadata"
ON public.backup_metadata
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::app_role));

-- Service role can insert (for scheduled backups via edge function)
CREATE POLICY "Service role can manage backup metadata"
ON public.backup_metadata
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);