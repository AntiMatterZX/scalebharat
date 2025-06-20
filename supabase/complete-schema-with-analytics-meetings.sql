-- =====================================================
-- COMPLETE STARTUP DIRECTORY DATABASE SCHEMA
-- Execute this entire file in Supabase SQL Editor
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  user_type TEXT CHECK (user_type IN ('startup', 'investor', 'admin')) NOT NULL,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  bio TEXT,
  location TEXT,
  website TEXT,
  linkedin_url TEXT,
  twitter_url TEXT,
  phone TEXT,
  timezone TEXT DEFAULT 'UTC',
  notification_preferences JSONB DEFAULT '{"email": true, "push": true}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user', 'admin', 'superadmin')) DEFAULT 'user',
  assigned_by UUID REFERENCES public.users(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Startups table
CREATE TABLE IF NOT EXISTS public.startups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  industry TEXT,
  stage TEXT CHECK (stage IN ('idea', 'mvp', 'early', 'growth', 'scale')),
  funding_goal DECIMAL(15,2),
  current_funding DECIMAL(15,2) DEFAULT 0,
  team_size INTEGER,
  founded_year INTEGER,
  website TEXT,
  pitch_deck_url TEXT,
  business_plan_url TEXT,
  financial_projections_url TEXT,
  logo_url TEXT,
  status TEXT CHECK (status IN ('draft', 'pending', 'approved', 'rejected')) DEFAULT 'draft',
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES public.users(id),
  rejection_reason TEXT,
  upvotes INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Investors table
CREATE TABLE IF NOT EXISTS public.investors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  investor_name TEXT NOT NULL,
  slug TEXT UNIQUE,
  investor_type TEXT CHECK (investor_type IN ('angel', 'vc', 'pe', 'corporate', 'family_office')),
  description TEXT,
  investment_range_min DECIMAL(15,2),
  investment_range_max DECIMAL(15,2),
  preferred_industries TEXT[],
  preferred_stages TEXT[],
  portfolio_companies TEXT[],
  aum DECIMAL(15,2), -- Assets Under Management
  fund_size DECIMAL(15,2),
  investment_count INTEGER DEFAULT 0,
  logo_url TEXT,
  website TEXT,
  status TEXT CHECK (status IN ('draft', 'pending', 'approved', 'rejected')) DEFAULT 'draft',
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES public.users(id),
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Matches table
CREATE TABLE IF NOT EXISTS public.matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  startup_id UUID REFERENCES public.startups(id) ON DELETE CASCADE,
  investor_id UUID REFERENCES public.investors(id) ON DELETE CASCADE,
  match_score DECIMAL(5,2) CHECK (match_score >= 0 AND match_score <= 100),
  status TEXT CHECK (status IN ('pending', 'interested', 'not_interested', 'meeting_scheduled', 'deal_in_progress', 'deal_closed', 'deal_rejected')) DEFAULT 'pending',
  startup_status TEXT CHECK (startup_status IN ('pending', 'interested', 'not_interested')) DEFAULT 'pending',
  investor_status TEXT CHECK (investor_status IN ('pending', 'interested', 'not_interested')) DEFAULT 'pending',
  match_reasons TEXT[],
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(startup_id, investor_id)
);

-- =====================================================
-- MEETINGS SYSTEM
-- =====================================================

-- Meetings table
CREATE TABLE IF NOT EXISTS public.meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  timezone TEXT DEFAULT 'UTC',
  meeting_type TEXT CHECK (meeting_type IN ('video', 'phone', 'in_person')) DEFAULT 'video',
  meeting_url TEXT, -- For video meetings
  location TEXT, -- For in-person meetings
  status TEXT CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'rescheduled')) DEFAULT 'pending',
  
  -- Participants
  startup_id UUID REFERENCES public.startups(id) ON DELETE CASCADE,
  investor_id UUID REFERENCES public.investors(id) ON DELETE CASCADE,
  match_id UUID REFERENCES public.matches(id) ON DELETE SET NULL,
  
  -- Meeting details
  agenda TEXT,
  notes TEXT,
  recording_url TEXT,
  follow_up_required BOOLEAN DEFAULT FALSE,
  follow_up_notes TEXT,
  
  -- Metadata
  created_by UUID REFERENCES public.users(id),
  cancelled_by UUID REFERENCES public.users(id),
  cancellation_reason TEXT,
  rescheduled_from UUID REFERENCES public.meetings(id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_time_range CHECK (end_time > start_time),
  CONSTRAINT valid_participants CHECK (startup_id IS NOT NULL AND investor_id IS NOT NULL)
);

-- Meeting participants table (for additional attendees)
CREATE TABLE IF NOT EXISTS public.meeting_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID REFERENCES public.meetings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('organizer', 'attendee', 'optional')) DEFAULT 'attendee',
  response TEXT CHECK (response IN ('pending', 'accepted', 'declined', 'tentative')) DEFAULT 'pending',
  joined_at TIMESTAMP WITH TIME ZONE,
  left_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(meeting_id, user_id)
);

-- =====================================================
-- ANALYTICS TABLES
-- =====================================================

-- Profile views tracking
CREATE TABLE IF NOT EXISTS public.profile_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  viewer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  profile_type TEXT CHECK (profile_type IN ('startup', 'investor')) NOT NULL,
  profile_id UUID NOT NULL,
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  session_id TEXT,
  view_duration INTEGER, -- in seconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User activities tracking
CREATE TABLE IF NOT EXISTS public.user_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  activity_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Startup metrics
CREATE TABLE IF NOT EXISTS public.startup_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  startup_id UUID REFERENCES public.startups(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  
  -- Core metrics
  profile_views INTEGER DEFAULT 0,
  unique_viewers INTEGER DEFAULT 0,
  upvotes INTEGER DEFAULT 0,
  matches_generated INTEGER DEFAULT 0,
  matches_interested INTEGER DEFAULT 0,
  meetings_scheduled INTEGER DEFAULT 0,
  meetings_completed INTEGER DEFAULT 0,
  
  -- Business metrics
  revenue DECIMAL(15,2),
  users INTEGER,
  growth_rate DECIMAL(5,2),
  burn_rate DECIMAL(15,2),
  runway_months INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(startup_id, metric_date)
);

-- Investor metrics
CREATE TABLE IF NOT EXISTS public.investor_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  investor_id UUID REFERENCES public.investors(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  
  -- Activity metrics
  profile_views INTEGER DEFAULT 0,
  startups_viewed INTEGER DEFAULT 0,
  matches_generated INTEGER DEFAULT 0,
  matches_interested INTEGER DEFAULT 0,
  meetings_scheduled INTEGER DEFAULT 0,
  meetings_completed INTEGER DEFAULT 0,
  
  -- Investment metrics
  deals_reviewed INTEGER DEFAULT 0,
  deals_invested INTEGER DEFAULT 0,
  total_invested DECIMAL(15,2) DEFAULT 0,
  portfolio_value DECIMAL(15,2),
  roi_percentage DECIMAL(5,2),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(investor_id, metric_date)
);

-- Conversion events tracking
CREATE TABLE IF NOT EXISTS public.conversion_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'profile_view', 'match_created', 'meeting_scheduled', 'deal_closed'
  entity_type TEXT CHECK (entity_type IN ('startup', 'investor')) NOT NULL,
  entity_id UUID NOT NULL,
  event_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Core table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON public.users(user_type);
CREATE INDEX IF NOT EXISTS idx_startups_user_id ON public.startups(user_id);
CREATE INDEX IF NOT EXISTS idx_startups_slug ON public.startups(slug);
CREATE INDEX IF NOT EXISTS idx_startups_status ON public.startups(status);
CREATE INDEX IF NOT EXISTS idx_startups_industry ON public.startups(industry);
CREATE INDEX IF NOT EXISTS idx_investors_user_id ON public.investors(user_id);
CREATE INDEX IF NOT EXISTS idx_investors_slug ON public.investors(slug);
CREATE INDEX IF NOT EXISTS idx_investors_status ON public.investors(status);

-- Matches indexes
CREATE INDEX IF NOT EXISTS idx_matches_startup_id ON public.matches(startup_id);
CREATE INDEX IF NOT EXISTS idx_matches_investor_id ON public.matches(investor_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON public.matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_score ON public.matches(match_score DESC);

-- Meetings indexes
CREATE INDEX IF NOT EXISTS idx_meetings_startup_id ON public.meetings(startup_id);
CREATE INDEX IF NOT EXISTS idx_meetings_investor_id ON public.meetings(investor_id);
CREATE INDEX IF NOT EXISTS idx_meetings_start_time ON public.meetings(start_time);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON public.meetings(status);
CREATE INDEX IF NOT EXISTS idx_meetings_created_by ON public.meetings(created_by);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_profile_views_profile ON public.profile_views(profile_type, profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewer ON public.profile_views(viewer_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_created_at ON public.profile_views(created_at);
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON public.user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_type ON public.user_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_startup_metrics_startup_date ON public.startup_metrics(startup_id, metric_date);
CREATE INDEX IF NOT EXISTS idx_investor_metrics_investor_date ON public.investor_metrics(investor_id, metric_date);
CREATE INDEX IF NOT EXISTS idx_conversion_events_user ON public.conversion_events(user_id, event_type);

-- =====================================================
-- FUNCTIONS FOR ANALYTICS
-- =====================================================

-- Function to calculate conversion funnel
CREATE OR REPLACE FUNCTION calculate_conversion_funnel(
  entity_type_param TEXT,
  entity_id_param UUID,
  start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  step TEXT,
  count BIGINT,
  conversion_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  WITH funnel_data AS (
    SELECT 
      event_type,
      COUNT(*) as event_count
    FROM conversion_events 
    WHERE entity_type = entity_type_param 
      AND entity_id = entity_id_param
      AND created_at::date BETWEEN start_date AND end_date
    GROUP BY event_type
  ),
  ordered_funnel AS (
    SELECT 
      CASE event_type
        WHEN 'profile_view' THEN 1
        WHEN 'match_created' THEN 2
        WHEN 'meeting_scheduled' THEN 3
        WHEN 'deal_closed' THEN 4
        ELSE 5
      END as step_order,
      event_type as step,
      event_count as count
    FROM funnel_data
  ),
  funnel_with_rates AS (
    SELECT 
      step,
      count,
      CASE 
        WHEN LAG(count) OVER (ORDER BY step_order) IS NULL THEN 100.0
        ELSE ROUND((count::DECIMAL / LAG(count) OVER (ORDER BY step_order)) * 100, 2)
      END as conversion_rate
    FROM ordered_funnel
    ORDER BY step_order
  )
  SELECT f.step, f.count, f.conversion_rate
  FROM funnel_with_rates f;
END;
$$ LANGUAGE plpgsql;

-- Function to get real-time active users
CREATE OR REPLACE FUNCTION get_active_users(minutes_threshold INTEGER DEFAULT 5)
RETURNS BIGINT AS $$
BEGIN
  RETURN (
    SELECT COUNT(DISTINCT user_id)
    FROM user_activities
    WHERE created_at > NOW() - (minutes_threshold || ' minutes')::INTERVAL
  );
END;
$$ LANGUAGE plpgsql;

-- Function to update startup metrics
CREATE OR REPLACE FUNCTION update_startup_metrics(startup_id_param UUID, metric_date_param DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
BEGIN
  INSERT INTO startup_metrics (
    startup_id,
    metric_date,
    profile_views,
    unique_viewers,
    upvotes,
    matches_generated,
    matches_interested,
    meetings_scheduled,
    meetings_completed
  )
  VALUES (
    startup_id_param,
    metric_date_param,
    (SELECT COUNT(*) FROM profile_views WHERE profile_type = 'startup' AND profile_id = startup_id_param AND created_at::date = metric_date_param),
    (SELECT COUNT(DISTINCT viewer_id) FROM profile_views WHERE profile_type = 'startup' AND profile_id = startup_id_param AND created_at::date = metric_date_param),
    (SELECT upvotes FROM startups WHERE id = startup_id_param),
    (SELECT COUNT(*) FROM matches WHERE startup_id = startup_id_param AND created_at::date = metric_date_param),
    (SELECT COUNT(*) FROM matches WHERE startup_id = startup_id_param AND startup_status = 'interested' AND updated_at::date = metric_date_param),
    (SELECT COUNT(*) FROM meetings WHERE startup_id = startup_id_param AND status IN ('confirmed', 'completed') AND created_at::date = metric_date_param),
    (SELECT COUNT(*) FROM meetings WHERE startup_id = startup_id_param AND status = 'completed' AND updated_at::date = metric_date_param)
  )
  ON CONFLICT (startup_id, metric_date) 
  DO UPDATE SET
    profile_views = EXCLUDED.profile_views,
    unique_viewers = EXCLUDED.unique_viewers,
    upvotes = EXCLUDED.upvotes,
    matches_generated = EXCLUDED.matches_generated,
    matches_interested = EXCLUDED.matches_interested,
    meetings_scheduled = EXCLUDED.meetings_scheduled,
    meetings_completed = EXCLUDED.meetings_completed,
    created_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to update investor metrics
CREATE OR REPLACE FUNCTION update_investor_metrics(investor_id_param UUID, metric_date_param DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
BEGIN
  INSERT INTO investor_metrics (
    investor_id,
    metric_date,
    profile_views,
    startups_viewed,
    matches_generated,
    matches_interested,
    meetings_scheduled,
    meetings_completed
  )
  VALUES (
    investor_id_param,
    metric_date_param,
    (SELECT COUNT(*) FROM profile_views WHERE profile_type = 'investor' AND profile_id = investor_id_param AND created_at::date = metric_date_param),
    (SELECT COUNT(DISTINCT profile_id) FROM profile_views WHERE viewer_id = (SELECT user_id FROM investors WHERE id = investor_id_param) AND profile_type = 'startup' AND created_at::date = metric_date_param),
    (SELECT COUNT(*) FROM matches WHERE investor_id = investor_id_param AND created_at::date = metric_date_param),
    (SELECT COUNT(*) FROM matches WHERE investor_id = investor_id_param AND investor_status = 'interested' AND updated_at::date = metric_date_param),
    (SELECT COUNT(*) FROM meetings WHERE investor_id = investor_id_param AND status IN ('confirmed', 'completed') AND created_at::date = metric_date_param),
    (SELECT COUNT(*) FROM meetings WHERE investor_id = investor_id_param AND status = 'completed' AND updated_at::date = metric_date_param)
  )
  ON CONFLICT (investor_id, metric_date) 
  DO UPDATE SET
    profile_views = EXCLUDED.profile_views,
    startups_viewed = EXCLUDED.startups_viewed,
    matches_generated = EXCLUDED.matches_generated,
    matches_interested = EXCLUDED.matches_interested,
    meetings_scheduled = EXCLUDED.meetings_scheduled,
    meetings_completed = EXCLUDED.meetings_completed,
    created_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_startups_updated_at BEFORE UPDATE ON public.startups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_investors_updated_at BEFORE UPDATE ON public.investors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON public.matches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON public.meetings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to generate slugs
CREATE OR REPLACE FUNCTION generate_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    IF TG_TABLE_NAME = 'startups' THEN
      NEW.slug = lower(regexp_replace(NEW.company_name, '[^a-zA-Z0-9]+', '-', 'g'));
    ELSIF TG_TABLE_NAME = 'investors' THEN
      NEW.slug = lower(regexp_replace(NEW.investor_name, '[^a-zA-Z0-9]+', '-', 'g'));
    END IF;
    
    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM pg_tables WHERE tablename = TG_TABLE_NAME AND schemaname = 'public') AND 
          EXISTS (SELECT 1 FROM public.startups WHERE slug = NEW.slug AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)) OR
          EXISTS (SELECT 1 FROM public.investors WHERE slug = NEW.slug AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)) LOOP
      NEW.slug = NEW.slug || '-' || floor(random() * 1000)::text;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_startup_slug BEFORE INSERT OR UPDATE ON public.startups FOR EACH ROW EXECUTE FUNCTION generate_slug();
CREATE TRIGGER generate_investor_slug BEFORE INSERT OR UPDATE ON public.investors FOR EACH ROW EXECUTE FUNCTION generate_slug();

-- Trigger to track profile views
CREATE OR REPLACE FUNCTION track_view_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'startups' THEN
    UPDATE public.startups SET view_count = view_count + 1 WHERE id = NEW.profile_id;
  ELSIF TG_TABLE_NAME = 'investors' THEN
    UPDATE public.investors SET view_count = view_count + 1 WHERE id = NEW.profile_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_startup_views AFTER INSERT ON public.profile_views FOR EACH ROW WHEN (NEW.profile_type = 'startup') EXECUTE FUNCTION track_view_count();
CREATE TRIGGER track_investor_views AFTER INSERT ON public.profile_views FOR EACH ROW WHEN (NEW.profile_type = 'investor') EXECUTE FUNCTION track_view_count();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.startups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.startup_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investor_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversion_events ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid()::text = id::text);

-- User profiles policies
CREATE POLICY "Profiles are viewable by everyone" ON public.user_profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.user_profiles FOR UPDATE USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert own profile" ON public.user_profiles FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Startups policies
CREATE POLICY "Approved startups are viewable by everyone" ON public.startups FOR SELECT USING (status = 'approved' OR auth.uid()::text = user_id::text);
CREATE POLICY "Users can update own startup" ON public.startups FOR UPDATE USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert own startup" ON public.startups FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Investors policies
CREATE POLICY "Approved investors are viewable by everyone" ON public.investors FOR SELECT USING (status = 'approved' OR auth.uid()::text = user_id::text);
CREATE POLICY "Users can update own investor profile" ON public.investors FOR UPDATE USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert own investor profile" ON public.investors FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Matches policies
CREATE POLICY "Users can view their matches" ON public.matches FOR SELECT USING (
  auth.uid()::text IN (
    SELECT user_id::text FROM public.startups WHERE id = startup_id
    UNION
    SELECT user_id::text FROM public.investors WHERE id = investor_id
  )
);
CREATE POLICY "Users can update their matches" ON public.matches FOR UPDATE USING (
  auth.uid()::text IN (
    SELECT user_id::text FROM public.startups WHERE id = startup_id
    UNION
    SELECT user_id::text FROM public.investors WHERE id = investor_id
  )
);

-- Meetings policies
CREATE POLICY "Users can view their meetings" ON public.meetings FOR SELECT USING (
  auth.uid()::text IN (
    SELECT user_id::text FROM public.startups WHERE id = startup_id
    UNION
    SELECT user_id::text FROM public.investors WHERE id = investor_id
    UNION
    SELECT created_by::text
  )
);
CREATE POLICY "Users can insert meetings" ON public.meetings FOR INSERT WITH CHECK (
  auth.uid()::text IN (
    SELECT user_id::text FROM public.startups WHERE id = startup_id
    UNION
    SELECT user_id::text FROM public.investors WHERE id = investor_id
  )
);
CREATE POLICY "Users can update their meetings" ON public.meetings FOR UPDATE USING (
  auth.uid()::text IN (
    SELECT user_id::text FROM public.startups WHERE id = startup_id
    UNION
    SELECT user_id::text FROM public.investors WHERE id = investor_id
    UNION
    SELECT created_by::text
  )
);

-- Analytics policies
CREATE POLICY "Users can view analytics" ON public.profile_views FOR SELECT USING (true);
CREATE POLICY "Users can insert analytics" ON public.profile_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view activities" ON public.user_activities FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert activities" ON public.user_activities FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Metrics policies
CREATE POLICY "Users can view startup metrics" ON public.startup_metrics FOR SELECT USING (
  auth.uid()::text IN (SELECT user_id::text FROM public.startups WHERE id = startup_id)
);
CREATE POLICY "Users can view investor metrics" ON public.investor_metrics FOR SELECT USING (
  auth.uid()::text IN (SELECT user_id::text FROM public.investors WHERE id = investor_id)
);

-- =====================================================
-- STORAGE BUCKETS
-- =====================================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('avatars', 'avatars', true),
  ('startup-logos', 'startup-logos', true),
  ('investor-logos', 'investor-logos', true),
  ('documents', 'documents', false),
  ('pitch-decks', 'pitch-decks', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Anyone can upload an avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "Anyone can update their own avatar" ON storage.objects FOR UPDATE USING (auth.uid()::text = owner::text AND bucket_id = 'avatars');

CREATE POLICY "Startup logos are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'startup-logos');
CREATE POLICY "Anyone can upload startup logos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'startup-logos');

CREATE POLICY "Investor logos are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'investor-logos');
CREATE POLICY "Anyone can upload investor logos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'investor-logos');

CREATE POLICY "Documents are accessible to owners" ON storage.objects FOR SELECT USING (bucket_id = 'documents' AND auth.uid()::text = owner::text);
CREATE POLICY "Anyone can upload documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents');

-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Insert sample admin user (uncomment if needed)
-- INSERT INTO public.users (id, email, full_name, user_type, onboarding_completed) 
-- VALUES ('00000000-0000-0000-0000-000000000001', 'admin@startup-directory.com', 'Admin User', 'admin', true)
-- ON CONFLICT (email) DO NOTHING;

-- INSERT INTO public.user_roles (user_id, role) 
-- VALUES ('00000000-0000-0000-0000-000000000001', 'superadmin')
-- ON CONFLICT (user_id, role) DO NOTHING;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Database schema setup completed successfully!';
  RAISE NOTICE 'Tables created: users, user_profiles, user_roles, startups, investors, matches, meetings, analytics tables';
  RAISE NOTICE 'Functions created: conversion funnel, active users, metrics updates';
  RAISE NOTICE 'Triggers created: timestamps, slugs, view tracking';
  RAISE NOTICE 'RLS policies enabled for all tables';
  RAISE NOTICE 'Storage buckets configured';
END $$;
