
CREATE TABLE public.totp_secrets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  secret text NOT NULL,
  is_enabled boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.totp_secrets ENABLE ROW LEVEL SECURITY;

-- Only admins/super_admins can manage TOTP secrets
CREATE POLICY "Admins can manage totp secrets"
  ON public.totp_secrets
  FOR ALL
  TO public
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Users can view their own TOTP secret (for setup)
CREATE POLICY "Users can view own totp secret"
  ON public.totp_secrets
  FOR SELECT
  TO public
  USING (auth.uid() = user_id);
