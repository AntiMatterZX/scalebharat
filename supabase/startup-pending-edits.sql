-- Startup Pending Edits System
-- This system allows startups to submit profile changes for admin review

-- Main pending edits table
CREATE TABLE public.startup_pending_edits (
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
CREATE TABLE public.startup_team_members_pending (
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
CREATE TABLE public.startup_documents_pending (
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

-- Create indexes for better performance
CREATE INDEX idx_startup_pending_edits_startup_id ON public.startup_pending_edits(startup_id);
CREATE INDEX idx_startup_pending_edits_user_id ON public.startup_pending_edits(user_id);
CREATE INDEX idx_startup_pending_edits_status ON public.startup_pending_edits(status);
CREATE INDEX idx_startup_pending_edits_submitted_at ON public.startup_pending_edits(submitted_at DESC);

CREATE INDEX idx_startup_team_members_pending_edit_id ON public.startup_team_members_pending(pending_edit_id);
CREATE INDEX idx_startup_team_members_pending_startup_id ON public.startup_team_members_pending(startup_id);

CREATE INDEX idx_startup_documents_pending_edit_id ON public.startup_documents_pending(pending_edit_id);
CREATE INDEX idx_startup_documents_pending_startup_id ON public.startup_documents_pending(startup_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

-- Enable Row Level Security
ALTER TABLE public.startup_pending_edits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.startup_team_members_pending ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.startup_documents_pending ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

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
CREATE POLICY "Users can view their notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_startup_pending_edits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_startup_pending_edits_updated_at
  BEFORE UPDATE ON public.startup_pending_edits
  FOR EACH ROW EXECUTE FUNCTION update_startup_pending_edits_updated_at();

-- Function to create notification
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

-- Function to apply approved changes to the main startup profile
CREATE OR REPLACE FUNCTION apply_approved_startup_changes(pending_edit_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  pending_edit RECORD;
  startup_record RECORD;
BEGIN
  -- Get the pending edit
  SELECT * INTO pending_edit 
  FROM public.startup_pending_edits 
  WHERE id = pending_edit_id AND status = 'approved';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pending edit not found or not approved';
  END IF;
  
  -- Get the startup record
  SELECT * INTO startup_record 
  FROM public.startups 
  WHERE id = pending_edit.startup_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Startup not found';
  END IF;
  
  -- Update the startup with approved changes (only non-null fields)
  UPDATE public.startups SET
    company_name = COALESCE(pending_edit.company_name, company_name),
    tagline = COALESCE(pending_edit.tagline, tagline),
    description = COALESCE(pending_edit.description, description),
    logo = COALESCE(pending_edit.logo, logo),
    banner_image = COALESCE(pending_edit.banner_image, banner_image),
    website = COALESCE(pending_edit.website, website),
    founded_year = COALESCE(pending_edit.founded_year, founded_year),
    stage = COALESCE(pending_edit.stage, stage),
    industry = COALESCE(pending_edit.industry, industry),
    business_model = COALESCE(pending_edit.business_model, business_model),
    total_raised = COALESCE(pending_edit.total_raised, total_raised),
    current_round = COALESCE(pending_edit.current_round, current_round),
    target_amount = COALESCE(pending_edit.target_amount, target_amount),
    valuation = COALESCE(pending_edit.valuation, valuation),
    previous_investors = COALESCE(pending_edit.previous_investors, previous_investors),
    revenue = COALESCE(pending_edit.revenue, revenue),
    users_count = COALESCE(pending_edit.users_count, users_count),
    growth_rate = COALESCE(pending_edit.growth_rate, growth_rate),
    burn_rate = COALESCE(pending_edit.burn_rate, burn_rate),
    equity_percentage_offered = COALESCE(pending_edit.equity_percentage_offered, equity_percentage_offered),
    planned_use_of_funds = COALESCE(pending_edit.planned_use_of_funds, planned_use_of_funds),
    fundraising_timeline_months = COALESCE(pending_edit.fundraising_timeline_months, fundraising_timeline_months),
    updated_at = NOW()
  WHERE id = pending_edit.startup_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle startup approval notifications
CREATE OR REPLACE FUNCTION handle_startup_approval_notification()
RETURNS TRIGGER AS $$
DECLARE
  startup_record RECORD;
  user_record RECORD;
  notification_title TEXT;
  notification_content TEXT;
  notification_type TEXT;
  notification_priority TEXT;
  action_url TEXT;
BEGIN
  -- Only trigger on status changes
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;
  
  -- Get startup and user information
  SELECT s.*, u.first_name, u.email 
  INTO startup_record
  FROM public.startups s
  JOIN public.users u ON s.user_id = u.id
  WHERE s.id = NEW.startup_id;
  
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;
  
  -- Set notification details based on new status
  CASE NEW.status
    WHEN 'approved' THEN
      notification_type := 'approval';
      notification_title := '🎉 Profile Changes Approved!';
      notification_content := 'Your profile changes have been approved and are now live.';
      notification_priority := 'high';
      action_url := '/startup/dashboard';
      
    WHEN 'rejected' THEN
      notification_type := 'rejection';
      notification_title := '📝 Profile Changes Need Revision';
      notification_content := COALESCE('Your profile changes were rejected: ' || NEW.rejection_reason, 'Your profile changes need revision before approval.');
      notification_priority := 'high';
      action_url := '/startup/profile';
      
    ELSE
      RETURN NEW;
  END CASE;
  
  -- Create notification
  PERFORM create_notification(
    NEW.user_id,
    notification_type,
    notification_title,
    notification_content,
    jsonb_build_object(
      'pending_edit_id', NEW.id,
      'startup_id', NEW.startup_id,
      'company_name', startup_record.company_name,
      'changes_summary', NEW.changes_summary,
      'admin_notes', NEW.admin_notes
    ),
    notification_priority,
    action_url,
    NOW() + INTERVAL '30 days'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for approval notifications
CREATE TRIGGER startup_approval_notification_trigger
  AFTER UPDATE ON public.startup_pending_edits
  FOR EACH ROW EXECUTE FUNCTION handle_startup_approval_notification(); 