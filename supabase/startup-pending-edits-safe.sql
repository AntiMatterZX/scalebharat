-- Startup Pending Edits System - Safe Installation
-- This system allows startups to submit profile changes for admin review
-- Uses IF NOT EXISTS to safely handle existing tables

-- Main pending edits table
CREATE TABLE IF NOT EXISTS public.startup_pending_edits (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  startup_id UUID REFERENCES public.startups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES public.users(id),
  rejection_reason TEXT,
  changes_summary TEXT,
  admin_notes TEXT,
  
  -- Profile fields that can be edited
  company_name TEXT,
  tagline TEXT,
  description TEXT,
  logo TEXT,
  banner_image TEXT,
  website TEXT,
  founded_year INTEGER,
  stage TEXT,
  industry TEXT[],
  business_model TEXT,
  
  -- Financial fields
  total_raised DECIMAL(15,2),
  current_round TEXT,
  target_amount DECIMAL(15,2),
  valuation DECIMAL(15,2),
  previous_investors TEXT[],
  revenue DECIMAL(15,2),
  users_count INTEGER,
  growth_rate DECIMAL(5,2),
  burn_rate DECIMAL(15,2),
  equity_percentage_offered DECIMAL(5,2),
  planned_use_of_funds TEXT[],
  fundraising_timeline_months INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pending team members changes
CREATE TABLE IF NOT EXISTS public.startup_team_members_pending (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  pending_edit_id UUID REFERENCES public.startup_pending_edits(id) ON DELETE CASCADE NOT NULL,
  startup_id UUID REFERENCES public.startups(id) ON DELETE CASCADE NOT NULL,
  original_member_id UUID, -- Reference to existing team member if editing
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  bio TEXT,
  linkedin_url TEXT,
  profile_picture_url TEXT,
  action TEXT CHECK (action IN ('create', 'update', 'delete')) DEFAULT 'create',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pending documents changes
CREATE TABLE IF NOT EXISTS public.startup_documents_pending (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  pending_edit_id UUID REFERENCES public.startup_pending_edits(id) ON DELETE CASCADE NOT NULL,
  startup_id UUID REFERENCES public.startups(id) ON DELETE CASCADE NOT NULL,
  original_document_id UUID, -- Reference to existing document if editing
  document_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  is_public BOOLEAN DEFAULT FALSE,
  visibility TEXT CHECK (visibility IN ('public', 'private', 'investors_only')) DEFAULT 'private',
  action TEXT CHECK (action IN ('create', 'update', 'delete')) DEFAULT 'create',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced notifications table for better dashboard notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('match', 'message', 'meeting', 'system', 'approval', 'rejection', 'profile_update')) NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  action_url TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance (using IF NOT EXISTS where possible)
DO $$ 
BEGIN
  -- Check and create indexes for startup_pending_edits
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_startup_pending_edits_startup_id') THEN
    CREATE INDEX idx_startup_pending_edits_startup_id ON public.startup_pending_edits(startup_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_startup_pending_edits_user_id') THEN
    CREATE INDEX idx_startup_pending_edits_user_id ON public.startup_pending_edits(user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_startup_pending_edits_status') THEN
    CREATE INDEX idx_startup_pending_edits_status ON public.startup_pending_edits(status);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_startup_pending_edits_submitted_at') THEN
    CREATE INDEX idx_startup_pending_edits_submitted_at ON public.startup_pending_edits(submitted_at DESC);
  END IF;

  -- Check and create indexes for startup_team_members_pending
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_startup_team_members_pending_edit_id') THEN
    CREATE INDEX idx_startup_team_members_pending_edit_id ON public.startup_team_members_pending(pending_edit_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_startup_team_members_pending_startup_id') THEN
    CREATE INDEX idx_startup_team_members_pending_startup_id ON public.startup_team_members_pending(startup_id);
  END IF;

  -- Check and create indexes for startup_documents_pending
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_startup_documents_pending_edit_id') THEN
    CREATE INDEX idx_startup_documents_pending_edit_id ON public.startup_documents_pending(pending_edit_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_startup_documents_pending_startup_id') THEN
    CREATE INDEX idx_startup_documents_pending_startup_id ON public.startup_documents_pending(startup_id);
  END IF;
END $$;

-- Create indexes for notifications table
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

-- Enable Row Level Security (safe to run multiple times)
ALTER TABLE public.startup_pending_edits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.startup_team_members_pending ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.startup_documents_pending ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then recreate them
DO $$ 
BEGIN
  -- Drop existing policies for startup_pending_edits
  DROP POLICY IF EXISTS "Startup owners can view their pending edits" ON public.startup_pending_edits;
  DROP POLICY IF EXISTS "Startup owners can create pending edits" ON public.startup_pending_edits;
  DROP POLICY IF EXISTS "Startup owners can update their pending edits" ON public.startup_pending_edits;
  DROP POLICY IF EXISTS "Startup owners can delete their pending edits" ON public.startup_pending_edits;
  DROP POLICY IF EXISTS "Admins can view all pending edits" ON public.startup_pending_edits;
  DROP POLICY IF EXISTS "Admins can update pending edits" ON public.startup_pending_edits;
  
  -- Drop existing policies for startup_team_members_pending
  DROP POLICY IF EXISTS "Startup owners can view their pending team members" ON public.startup_team_members_pending;
  DROP POLICY IF EXISTS "Startup owners can manage their pending team members" ON public.startup_team_members_pending;
  DROP POLICY IF EXISTS "Admins can view all pending team members" ON public.startup_team_members_pending;
  
  -- Drop existing policies for startup_documents_pending
  DROP POLICY IF EXISTS "Startup owners can view their pending documents" ON public.startup_documents_pending;
  DROP POLICY IF EXISTS "Startup owners can manage their pending documents" ON public.startup_documents_pending;
  DROP POLICY IF EXISTS "Admins can view all pending documents" ON public.startup_documents_pending;
  
  -- Drop existing policies for notifications
  DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
  DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
  DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
  DROP POLICY IF EXISTS "Admins can view all notifications" ON public.notifications;
END $$;

-- RLS Policies for startup_pending_edits
CREATE POLICY "Startup owners can view their pending edits" ON public.startup_pending_edits
  FOR SELECT USING (
    auth.uid() = user_id OR 
    auth.uid() IN (
      SELECT user_id FROM public.startups WHERE id = startup_id
    )
  );

CREATE POLICY "Startup owners can create pending edits" ON public.startup_pending_edits
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    auth.uid() IN (
      SELECT user_id FROM public.startups WHERE id = startup_id
    )
  );

CREATE POLICY "Startup owners can update their pending edits" ON public.startup_pending_edits
  FOR UPDATE USING (
    auth.uid() = user_id AND
    status = 'pending'
  );

CREATE POLICY "Startup owners can delete their pending edits" ON public.startup_pending_edits
  FOR DELETE USING (
    auth.uid() = user_id AND
    status = 'pending'
  );

CREATE POLICY "Admins can view all pending edits" ON public.startup_pending_edits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Admins can update pending edits" ON public.startup_pending_edits
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'superadmin')
    )
  );

-- RLS Policies for startup_team_members_pending
CREATE POLICY "Startup owners can view their pending team members" ON public.startup_team_members_pending
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.startup_pending_edits 
      WHERE id = pending_edit_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Startup owners can manage their pending team members" ON public.startup_team_members_pending
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.startup_pending_edits 
      WHERE id = pending_edit_id 
      AND user_id = auth.uid()
      AND status = 'pending'
    )
  );

CREATE POLICY "Admins can view all pending team members" ON public.startup_team_members_pending
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'superadmin')
    )
  );

-- RLS Policies for startup_documents_pending
CREATE POLICY "Startup owners can view their pending documents" ON public.startup_documents_pending
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.startup_pending_edits 
      WHERE id = pending_edit_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Startup owners can manage their pending documents" ON public.startup_documents_pending
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.startup_pending_edits 
      WHERE id = pending_edit_id 
      AND user_id = auth.uid()
      AND status = 'pending'
    )
  );

CREATE POLICY "Admins can view all pending documents" ON public.startup_documents_pending
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'superadmin')
    )
  );

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all notifications" ON public.notifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'superadmin')
    )
  );

-- Create or replace the updated_at trigger function
CREATE OR REPLACE FUNCTION update_startup_pending_edits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS update_startup_pending_edits_updated_at ON public.startup_pending_edits;
CREATE TRIGGER update_startup_pending_edits_updated_at
  BEFORE UPDATE ON public.startup_pending_edits
  FOR EACH ROW EXECUTE FUNCTION update_startup_pending_edits_updated_at();

-- Create or replace notification function
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_content TEXT,
  p_data JSONB DEFAULT '{}',
  p_priority TEXT DEFAULT 'medium',
  p_action_url TEXT DEFAULT NULL,
  p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (
    user_id, type, title, content, data, priority, action_url, expires_at
  ) VALUES (
    p_user_id, p_type, p_title, p_content, p_data, p_priority, p_action_url, p_expires_at
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace function to apply approved startup changes
CREATE OR REPLACE FUNCTION apply_approved_startup_changes(pending_edit_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  edit_record RECORD;
  startup_record RECORD;
BEGIN
  -- Get the pending edit record
  SELECT * INTO edit_record 
  FROM public.startup_pending_edits 
  WHERE id = pending_edit_id AND status = 'approved';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pending edit not found or not approved';
  END IF;
  
  -- Get the startup record
  SELECT * INTO startup_record 
  FROM public.startups 
  WHERE id = edit_record.startup_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Startup not found';
  END IF;
  
  -- Apply the changes to the startup
  UPDATE public.startups SET
    company_name = COALESCE(edit_record.company_name, company_name),
    tagline = COALESCE(edit_record.tagline, tagline),
    description = COALESCE(edit_record.description, description),
    logo = COALESCE(edit_record.logo, logo),
    banner_image = COALESCE(edit_record.banner_image, banner_image),
    website = COALESCE(edit_record.website, website),
    founded_year = COALESCE(edit_record.founded_year, founded_year),
    stage = COALESCE(edit_record.stage, stage),
    industry = COALESCE(edit_record.industry, industry),
    business_model = COALESCE(edit_record.business_model, business_model),
    total_raised = COALESCE(edit_record.total_raised, total_raised),
    current_round = COALESCE(edit_record.current_round, current_round),
    target_amount = COALESCE(edit_record.target_amount, target_amount),
    valuation = COALESCE(edit_record.valuation, valuation),
    previous_investors = COALESCE(edit_record.previous_investors, previous_investors),
    revenue = COALESCE(edit_record.revenue, revenue),
    users_count = COALESCE(edit_record.users_count, users_count),
    growth_rate = COALESCE(edit_record.growth_rate, growth_rate),
    burn_rate = COALESCE(edit_record.burn_rate, burn_rate),
    equity_percentage_offered = COALESCE(edit_record.equity_percentage_offered, equity_percentage_offered),
    planned_use_of_funds = COALESCE(edit_record.planned_use_of_funds, planned_use_of_funds),
    fundraising_timeline_months = COALESCE(edit_record.fundraising_timeline_months, fundraising_timeline_months),
    updated_at = NOW()
  WHERE id = edit_record.startup_id;
  
  -- TODO: Apply team member changes from startup_team_members_pending
  -- TODO: Apply document changes from startup_documents_pending
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger function for automatic notifications on status changes
CREATE OR REPLACE FUNCTION notify_startup_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger on status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Create notification for status change
    PERFORM create_notification(
      NEW.user_id,
      CASE 
        WHEN NEW.status = 'approved' THEN 'approval'
        WHEN NEW.status = 'rejected' THEN 'rejection'
        ELSE 'profile_update'
      END,
      CASE 
        WHEN NEW.status = 'approved' THEN '🎉 Profile Changes Approved!'
        WHEN NEW.status = 'rejected' THEN '📝 Profile Changes Need Updates'
        ELSE 'Profile Status Updated'
      END,
      CASE 
        WHEN NEW.status = 'approved' THEN 'Your profile changes have been approved and are now live on your startup page.'
        WHEN NEW.status = 'rejected' THEN COALESCE('Your profile changes need some updates: ' || NEW.rejection_reason, 'Your profile changes need some updates. Please review and resubmit.')
        ELSE 'Your profile submission status has been updated.'
      END,
      jsonb_build_object(
        'pending_edit_id', NEW.id,
        'startup_id', NEW.startup_id,
        'old_status', OLD.status,
        'new_status', NEW.status,
        'rejection_reason', NEW.rejection_reason
      ),
      CASE 
        WHEN NEW.status = 'approved' THEN 'high'
        WHEN NEW.status = 'rejected' THEN 'high'
        ELSE 'medium'
      END,
      '/startup/dashboard'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS startup_status_change_notification ON public.startup_pending_edits;
CREATE TRIGGER startup_status_change_notification
  AFTER UPDATE ON public.startup_pending_edits
  FOR EACH ROW EXECUTE FUNCTION notify_startup_status_change();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.startup_pending_edits TO authenticated;
GRANT ALL ON public.startup_team_members_pending TO authenticated;
GRANT ALL ON public.startup_documents_pending TO authenticated;
GRANT ALL ON public.notifications TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION create_notification TO authenticated;
GRANT EXECUTE ON FUNCTION apply_approved_startup_changes TO authenticated;

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE 'Startup pending edits system installed successfully!';
  RAISE NOTICE 'Tables created/verified: startup_pending_edits, startup_team_members_pending, startup_documents_pending, notifications';
  RAISE NOTICE 'Functions created: create_notification, apply_approved_startup_changes, notify_startup_status_change';
  RAISE NOTICE 'Triggers created: automatic notifications on status changes';
END $$; 