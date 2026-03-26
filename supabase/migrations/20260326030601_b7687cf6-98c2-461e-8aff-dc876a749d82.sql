
-- Add new permission columns for all features not yet covered
ALTER TABLE public.admin_permissions
  ADD COLUMN IF NOT EXISTS can_view_testimonials boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS can_manage_testimonials boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_view_team_members boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS can_manage_team_members boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_view_customization boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_manage_customization boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_view_backup boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_manage_backup boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_view_payment boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_manage_payment boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_view_crm boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_manage_crm boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_view_traffic boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS can_view_file_manager boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_manage_file_manager boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_view_ai_insights boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_use_smart_search boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS can_use_quick_actions boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS can_use_notes boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS can_view_service_projects boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS can_manage_service_projects boolean DEFAULT false;
