-- =====================================================
-- COMPLETE STARTUP DIRECTORY DATABASE SCHEMA (FIXED)
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
  first_name TEXT,
  last_name TEXT,
  profile_picture TEXT,
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
  tagline TEXT,
  description TEXT,
  industry TEXT[],
  stage TEXT CHECK (stage IN ('idea', 'prototype', 'mvp', 'early-stage', 'growth', 'expansion')),
  business_model TEXT CHECK (business_model IN ('b2b', 'b2c', 'b2b2c', 'marketplace', 'saas')),
  target_amount DECIMAL(15,2),
  total_raised DECIMAL(15,2) DEFAULT 0,
  team_size INTEGER,
  founded_year INTEGER,
  website TEXT,
  logo TEXT,
  banner_image TEXT,
  pitch_deck_url TEXT,
  business_plan_url TEXT,
  financial_projections_url TEXT,
  status TEXT CHECK (status IN ('draft', 'pending', 'published', 'rejected')) DEFAULT 'draft',
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES public.users(id),
  rejection_reason TEXT,
  upvote_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  revenue DECIMAL(15,2),
  users_count INTEGER,
  growth_rate DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Investors table
CREATE TABLE IF NOT EXISTS public.investors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  firm_name TEXT,
  slug TEXT UNIQUE,
  investor_type TEXT CHECK (investor_type IN ('angel', 'vc', 'pe', 'corporate', 'family_office')),
  description TEXT,
  check_size_min DECIMAL(15,2),
  check_size_max DECIMAL(15,2),
  investment_industries TEXT[],
  investment_stages TEXT[],
  investment_geographies TEXT[],
  business_models TEXT[],
  portfolio_companies TEXT[],
  aum DECIMAL(15,2), -- Assets Under Management
  fund_size DECIMAL(15,2),
  investment_count INTEGER DEFAULT 0,
  logo TEXT,
  website TEXT,
  status TEXT CHECK (status IN ('draft', 'pending', 'active', 'inactive')) DEFAULT 'draft',
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES public.users(id),
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Startup team members
CREATE TABLE IF NOT EXISTS public.startup_team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  startup_id UUID REFERENCES public.startups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  bio TEXT,
  linkedin_url TEXT,
  profile_picture_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Startup documents
CREATE TABLE IF NOT EXISTS public.startup_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  startup_id UUID REFERENCES public.startups(id) ON DELETE CASCADE,
  document_type TEXT CHECK (document_type IN ('pitch_deck', 'business_plan', 'financial_model', 'legal_docs', 'other')),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  is_public BOOLEAN DEFAULT FALSE,
  visibility TEXT CHECK (visibility IN ('private', 'investors_only', 'public')) DEFAULT 'private',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for document visibility
CREATE INDEX IF NOT EXISTS idx_startup_documents_visibility ON public.startup_documents(startup_id, visibility);

-- Startup upvotes
CREATE TABLE IF NOT EXISTS public.startup_upvotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  startup_id UUID REFERENCES public.startups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(startup_id, user_id)
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
  initiated_by TEXT CHECK (initiated_by IN ('startup', 'investor', 'system')) DEFAULT 'system',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(startup_id, investor_id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT CHECK (message_type IN ('text', 'file', 'meeting_request')) DEFAULT 'text',
  file_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- MEETINGS SYSTEM
-- =====================================================

-- Meetings table
CREATE TABLE IF NOT EXISTS public.meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE, -- Made nullable for standalone meetings
  organizer_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  attendee_id UUID REFERENCES public.users(id) ON DELETE CASCADE, -- Made nullable for external attendees
  title TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  timezone TEXT DEFAULT 'UTC',
  type TEXT CHECK (type IN ('video', 'phone', 'in_person')) DEFAULT 'video',
  meeting_link TEXT, -- For video meetings
  location TEXT, -- For in-person meetings
  status TEXT CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'rescheduled')) DEFAULT 'pending',
  
  -- Meeting details
  agenda TEXT,
  notes TEXT,
  recording_url TEXT,
  follow_up_required BOOLEAN DEFAULT FALSE,
  follow_up_notes TEXT,
  
  -- Metadata
  cancelled_by UUID REFERENCES public.users(id),
  cancellation_reason TEXT,
  rescheduled_from UUID REFERENCES public.meetings(id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_duration CHECK (duration_minutes > 0 AND duration_minutes <= 480),
  CONSTRAINT valid_organizer_attendee CHECK (organizer_id != attendee_id OR attendee_id IS NULL)
);

-- =====================================================
-- ANALYTICS TABLES
-- =====================================================

-- Analytics events table (unified tracking)
CREATE TABLE IF NOT EXISTS public.analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL, -- 'profile-view', 'upvote', 'match-created', 'meeting-scheduled', etc.
  target_type TEXT CHECK (target_type IN ('startup', 'investor', 'match', 'meeting')),
  target_id UUID NOT NULL,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  session_id TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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

-- Daily metrics aggregation table
CREATE TABLE IF NOT EXISTS public.daily_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_date DATE NOT NULL,
  entity_type TEXT CHECK (entity_type IN ('startup', 'investor', 'platform')) NOT NULL,
  entity_id UUID, -- NULL for platform-wide metrics
  metrics JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(metric_date, entity_type, entity_id)
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
CREATE INDEX IF NOT EXISTS idx_startups_industry ON public.startups USING GIN(industry);
CREATE INDEX IF NOT EXISTS idx_investors_user_id ON public.investors(user_id);
CREATE INDEX IF NOT EXISTS idx_investors_slug ON public.investors(slug);
CREATE INDEX IF NOT EXISTS idx_investors_status ON public.investors(status);
CREATE INDEX IF NOT EXISTS idx_investors_industries ON public.investors USING GIN(investment_industries);

-- Matches indexes
CREATE INDEX IF NOT EXISTS idx_matches_startup_id ON public.matches(startup_id);
CREATE INDEX IF NOT EXISTS idx_matches_investor_id ON public.matches(investor_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON public.matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_score ON public.matches(match_score DESC);

-- Meetings indexes
CREATE INDEX IF NOT EXISTS idx_meetings_match_id ON public.meetings(match_id);
CREATE INDEX IF NOT EXISTS idx_meetings_organizer_id ON public.meetings(organizer_id);
CREATE INDEX IF NOT EXISTS idx_meetings_attendee_id ON public.meetings(attendee_id);
CREATE INDEX IF NOT EXISTS idx_meetings_scheduled_at ON public.meetings(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON public.meetings(status);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_analytics_type_target ON public.analytics(type, target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON public.analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_timestamp ON public.analytics(timestamp);
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON public.user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_type ON public.user_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_date_entity ON public.daily_metrics(metric_date, entity_type, entity_id);

-- =====================================================
-- FUNCTIONS FOR ANALYTICS
-- =====================================================

-- Function to get startup conversion funnel
CREATE OR REPLACE FUNCTION get_startup_conversion_funnel(startup_id_param UUID)
RETURNS TABLE (
  step TEXT,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'Profile Views'::TEXT as step,
    COUNT(*)::BIGINT as count
  FROM analytics 
  WHERE type = 'profile-view' 
    AND target_type = 'startup' 
    AND target_id = startup_id_param
    AND timestamp >= CURRENT_DATE - INTERVAL '30 days'
  
  UNION ALL
  
  SELECT 
    'Matches Created'::TEXT as step,
    COUNT(*)::BIGINT as count
  FROM matches 
  WHERE startup_id = startup_id_param
    AND created_at >= CURRENT_DATE - INTERVAL '30 days'
  
  UNION ALL
  
  SELECT 
    'Interested Matches'::TEXT as step,
    COUNT(*)::BIGINT as count
  FROM matches 
  WHERE startup_id = startup_id_param
    AND (startup_status = 'interested' OR investor_status = 'interested')
    AND updated_at >= CURRENT_DATE - INTERVAL '30 days'
  
  UNION ALL
  
  SELECT 
    'Meetings Scheduled'::TEXT as step,
    COUNT(*)::BIGINT as count
  FROM meetings m
  JOIN matches ma ON m.match_id = ma.id
  WHERE ma.startup_id = startup_id_param
    AND m.status IN ('confirmed', 'completed')
    AND m.created_at >= CURRENT_DATE - INTERVAL '30 days'
  
  UNION ALL
  
  SELECT 
    'Meetings Completed'::TEXT as step,
    COUNT(*)::BIGINT as count
  FROM meetings m
  JOIN matches ma ON m.match_id = ma.id
  WHERE ma.startup_id = startup_id_param
    AND m.status = 'completed'
    AND m.updated_at >= CURRENT_DATE - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Function to get investor conversion funnel
CREATE OR REPLACE FUNCTION get_investor_conversion_funnel(investor_id_param UUID)
RETURNS TABLE (
  step TEXT,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'Profile Views'::TEXT as step,
    COUNT(*)::BIGINT as count
  FROM analytics 
  WHERE type = 'profile-view' 
    AND target_type = 'investor' 
    AND target_id = investor_id_param
    AND timestamp >= CURRENT_DATE - INTERVAL '30 days'
  
  UNION ALL
  
  SELECT 
    'Startups Viewed'::TEXT as step,
    COUNT(DISTINCT target_id)::BIGINT as count
  FROM analytics 
  WHERE type = 'profile-view' 
    AND target_type = 'startup'
    AND user_id = (SELECT user_id FROM investors WHERE id = investor_id_param)
    AND timestamp >= CURRENT_DATE - INTERVAL '30 days'
  
  UNION ALL
  
  SELECT 
    'Matches Created'::TEXT as step,
    COUNT(*)::BIGINT as count
  FROM matches 
  WHERE investor_id = investor_id_param
    AND created_at >= CURRENT_DATE - INTERVAL '30 days'
  
  UNION ALL
  
  SELECT 
    'Interested Matches'::TEXT as step,
    COUNT(*)::BIGINT as count
  FROM matches 
  WHERE investor_id = investor_id_param
    AND (startup_status = 'interested' OR investor_status = 'interested')
    AND updated_at >= CURRENT_DATE - INTERVAL '30 days'
  
  UNION ALL
  
  SELECT 
    'Meetings Scheduled'::TEXT as step,
    COUNT(*)::BIGINT as count
  FROM meetings m
  JOIN matches ma ON m.match_id = ma.id
  WHERE ma.investor_id = investor_id_param
    AND m.status IN ('confirmed', 'completed')
    AND m.created_at >= CURRENT_DATE - INTERVAL '30 days';
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

-- Function to track profile view
CREATE OR REPLACE FUNCTION track_profile_view(
  viewer_user_id UUID,
  profile_type_param TEXT,
  profile_id_param UUID,
  ip_addr INET DEFAULT NULL,
  user_agent_param TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- Insert analytics event
  INSERT INTO analytics (user_id, type, target_type, target_id, ip_address, user_agent)
  VALUES (viewer_user_id, 'profile-view', profile_type_param, profile_id_param, ip_addr, user_agent_param);
  
  -- Update view count
  IF profile_type_param = 'startup' THEN
    UPDATE startups SET view_count = view_count + 1 WHERE id = profile_id_param;
  ELSIF profile_type_param = 'investor' THEN
    UPDATE investors SET view_count = view_count + 1 WHERE id = profile_id_param;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to update daily metrics
CREATE OR REPLACE FUNCTION update_daily_metrics(
  metric_date_param DATE DEFAULT CURRENT_DATE,
  entity_type_param TEXT DEFAULT 'platform',
  entity_id_param UUID DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  metrics_data JSONB := '{}';
BEGIN
  IF entity_type_param = 'startup' AND entity_id_param IS NOT NULL THEN
    -- Calculate startup metrics
    SELECT jsonb_build_object(
      'profile_views', COALESCE((SELECT COUNT(*) FROM analytics WHERE type = 'profile-view' AND target_type = 'startup' AND target_id = entity_id_param AND timestamp::date = metric_date_param), 0),
      'unique_viewers', COALESCE((SELECT COUNT(DISTINCT user_id) FROM analytics WHERE type = 'profile-view' AND target_type = 'startup' AND target_id = entity_id_param AND timestamp::date = metric_date_param), 0),
      'upvotes', COALESCE((SELECT upvote_count FROM startups WHERE id = entity_id_param), 0),
      'matches_generated', COALESCE((SELECT COUNT(*) FROM matches WHERE startup_id = entity_id_param AND created_at::date = metric_date_param), 0),
      'matches_interested', COALESCE((SELECT COUNT(*) FROM matches WHERE startup_id = entity_id_param AND (startup_status = 'interested' OR investor_status = 'interested') AND updated_at::date = metric_date_param), 0),
      'meetings_scheduled', COALESCE((SELECT COUNT(*) FROM meetings m JOIN matches ma ON m.match_id = ma.id WHERE ma.startup_id = entity_id_param AND m.status IN ('confirmed', 'completed') AND m.created_at::date = metric_date_param), 0),
      'meetings_completed', COALESCE((SELECT COUNT(*) FROM meetings m JOIN matches ma ON m.match_id = ma.id WHERE ma.startup_id = entity_id_param AND m.status = 'completed' AND m.updated_at::date = metric_date_param), 0)
    ) INTO metrics_data;
    
  ELSIF entity_type_param = 'investor' AND entity_id_param IS NOT NULL THEN
    -- Calculate investor metrics
    SELECT jsonb_build_object(
      'profile_views', COALESCE((SELECT COUNT(*) FROM analytics WHERE type = 'profile-view' AND target_type = 'investor' AND target_id = entity_id_param AND timestamp::date = metric_date_param), 0),
      'startups_viewed', COALESCE((SELECT COUNT(DISTINCT target_id) FROM analytics WHERE type = 'profile-view' AND target_type = 'startup' AND user_id = (SELECT user_id FROM investors WHERE id = entity_id_param) AND timestamp::date = metric_date_param), 0),
      'matches_generated', COALESCE((SELECT COUNT(*) FROM matches WHERE investor_id = entity_id_param AND created_at::date = metric_date_param), 0),
      'matches_interested', COALESCE((SELECT COUNT(*) FROM matches WHERE investor_id = entity_id_param AND (startup_status = 'interested' OR investor_status = 'interested') AND updated_at::date = metric_date_param), 0),
      'meetings_scheduled', COALESCE((SELECT COUNT(*) FROM meetings m JOIN matches ma ON m.match_id = ma.id WHERE ma.investor_id = entity_id_param AND m.status IN ('confirmed', 'completed') AND m.created_at::date = metric_date_param), 0),
      'meetings_completed', COALESCE((SELECT COUNT(*) FROM meetings m JOIN matches ma ON m.match_id = ma.id WHERE ma.investor_id = entity_id_param AND m.status = 'completed' AND m.updated_at::date = metric_date_param), 0)
    ) INTO metrics_data;
    
  ELSE
    -- Platform-wide metrics
    SELECT jsonb_build_object(
      'total_users', COALESCE((SELECT COUNT(*) FROM users WHERE created_at::date <= metric_date_param), 0),
      'new_users', COALESCE((SELECT COUNT(*) FROM users WHERE created_at::date = metric_date_param), 0),
      'total_startups', COALESCE((SELECT COUNT(*) FROM startups WHERE created_at::date <= metric_date_param), 0),
      'total_investors', COALESCE((SELECT COUNT(*) FROM investors WHERE created_at::date <= metric_date_param), 0),
      'total_matches', COALESCE((SELECT COUNT(*) FROM matches WHERE created_at::date <= metric_date_param), 0),
      'total_meetings', COALESCE((SELECT COUNT(*) FROM meetings WHERE created_at::date <= metric_date_param), 0),
      'active_users', COALESCE((SELECT COUNT(DISTINCT user_id) FROM user_activities WHERE created_at::date = metric_date_param), 0)
    ) INTO metrics_data;
  END IF;
  
  -- Insert or update metrics
  INSERT INTO daily_metrics (metric_date, entity_type, entity_id, metrics)
  VALUES (metric_date_param, entity_type_param, entity_id_param, metrics_data)
  ON CONFLICT (metric_date, entity_type, entity_id)
  DO UPDATE SET 
    metrics = EXCLUDED.metrics,
    updated_at = NOW();
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
CREATE TRIGGER update_daily_metrics_updated_at BEFORE UPDATE ON public.daily_metrics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to generate slugs
CREATE OR REPLACE FUNCTION generate_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 1;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    IF TG_TABLE_NAME = 'startups' THEN
      base_slug = lower(regexp_replace(COALESCE(NEW.company_name, 'startup'), '[^a-zA-Z0-9]+', '-', 'g'));
    ELSIF TG_TABLE_NAME = 'investors' THEN
      base_slug = lower(regexp_replace(COALESCE(NEW.firm_name, 'investor'), '[^a-zA-Z0-9]+', '-', 'g'));
    END IF;
    
    -- Remove leading/trailing hyphens
    base_slug = trim(both '-' from base_slug);
    final_slug = base_slug;
    
    -- Ensure uniqueness
    IF TG_TABLE_NAME = 'startups' THEN
      WHILE EXISTS (SELECT 1 FROM public.startups WHERE slug = final_slug AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)) LOOP
        final_slug = base_slug || '-' || counter;
        counter = counter + 1;
      END LOOP;
    ELSIF TG_TABLE_NAME = 'investors' THEN
      WHILE EXISTS (SELECT 1 FROM public.investors WHERE slug = final_slug AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)) LOOP
        final_slug = base_slug || '-' || counter;
        counter = counter + 1;
      END LOOP;
    END IF;
    
    NEW.slug = final_slug;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_startup_slug BEFORE INSERT OR UPDATE ON public.startups FOR EACH ROW EXECUTE FUNCTION generate_slug();
CREATE TRIGGER generate_investor_slug BEFORE INSERT OR UPDATE ON public.investors FOR EACH ROW EXECUTE FUNCTION generate_slug();

-- Trigger to update upvote count
CREATE OR REPLACE FUNCTION update_upvote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE startups SET upvote_count = upvote_count + 1 WHERE id = NEW.startup_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE startups SET upvote_count = upvote_count - 1 WHERE id = OLD.startup_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_startup_upvote_count 
  AFTER INSERT OR DELETE ON public.startup_upvotes 
  FOR EACH ROW EXECUTE FUNCTION update_upvote_count();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.startups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.startup_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.startup_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.startup_upvotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_metrics ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid()::text = id::text);

-- User profiles policies
CREATE POLICY "Profiles are viewable by everyone" ON public.user_profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.user_profiles FOR UPDATE USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert own profile" ON public.user_profiles FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Startups policies
CREATE POLICY "Published startups are viewable by everyone" ON public.startups FOR SELECT USING (status = 'published' OR auth.uid()::text = user_id::text);
CREATE POLICY "Users can update own startup" ON public.startups FOR UPDATE USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert own startup" ON public.startups FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Investors policies
CREATE POLICY "Active investors are viewable by everyone" ON public.investors FOR SELECT USING (status = 'active' OR auth.uid()::text = user_id::text);
CREATE POLICY "Users can update own investor profile" ON public.investors FOR UPDATE USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert own investor profile" ON public.investors FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Startup team members policies
CREATE POLICY "Team members are viewable by everyone" ON public.startup_team_members FOR SELECT USING (true);
CREATE POLICY "Startup owners can manage team members" ON public.startup_team_members FOR ALL USING (
  auth.uid()::text IN (SELECT user_id::text FROM public.startups WHERE id = startup_id)
);

-- Startup documents policies
CREATE POLICY "Public documents are viewable by everyone" ON public.startup_documents FOR SELECT USING (is_public = true);
CREATE POLICY "Startup owners can view all documents" ON public.startup_documents FOR SELECT USING (
  auth.uid()::text IN (SELECT user_id::text FROM public.startups WHERE id = startup_id)
);
CREATE POLICY "Startup owners can manage documents" ON public.startup_documents FOR ALL USING (
  auth.uid()::text IN (SELECT user_id::text FROM public.startups WHERE id = startup_id)
);

-- Startup upvotes policies
CREATE POLICY "Upvotes are viewable by everyone" ON public.startup_upvotes FOR SELECT USING (true);
CREATE POLICY "Users can manage their own upvotes" ON public.startup_upvotes FOR ALL USING (auth.uid()::text = user_id::text);

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
CREATE POLICY "System can insert matches" ON public.matches FOR INSERT WITH CHECK (true);

-- Messages policies
CREATE POLICY "Users can view their messages" ON public.messages FOR SELECT USING (
  auth.uid()::text = sender_id::text OR auth.uid()::text = receiver_id::text
);
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid()::text = sender_id::text);
CREATE POLICY "Users can update their messages" ON public.messages FOR UPDATE USING (
  auth.uid()::text = sender_id::text OR auth.uid()::text = receiver_id::text
);

-- Meetings policies
CREATE POLICY "Users can view their meetings" ON public.meetings FOR SELECT USING (
  auth.uid()::text = organizer_id::text OR auth.uid()::text = attendee_id::text
);
CREATE POLICY "Users can create meetings" ON public.meetings FOR INSERT WITH CHECK (
  auth.uid()::text = organizer_id::text
);
CREATE POLICY "Users can update their meetings" ON public.meetings FOR UPDATE USING (
  auth.uid()::text = organizer_id::text OR auth.uid()::text = attendee_id::text
);
CREATE POLICY "Users can delete their meetings" ON public.meetings FOR DELETE USING (
  auth.uid()::text = organizer_id::text
);

-- Analytics policies
CREATE POLICY "Analytics are viewable by everyone" ON public.analytics FOR SELECT USING (true);
CREATE POLICY "Anyone can insert analytics" ON public.analytics FOR INSERT WITH CHECK (true);

-- User activities policies
CREATE POLICY "Users can view their activities" ON public.user_activities FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert their activities" ON public.user_activities FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Daily metrics policies
CREATE POLICY "Metrics are viewable by owners" ON public.daily_metrics FOR SELECT USING (
  entity_id IS NULL OR -- Platform metrics
  auth.uid()::text IN (
    SELECT user_id::text FROM public.startups WHERE id = entity_id
    UNION
    SELECT user_id::text FROM public.investors WHERE id = entity_id
  )
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
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Database schema setup completed successfully!';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Tables created:';
  RAISE NOTICE '- Core: users, user_profiles, user_roles';
  RAISE NOTICE '- Business: startups, investors, matches';
  RAISE NOTICE '- Features: meetings, messages, team_members';
  RAISE NOTICE '- Analytics: analytics, user_activities, daily_metrics';
  RAISE NOTICE '';
  RAISE NOTICE 'Functions created:';
  RAISE NOTICE '- get_startup_conversion_funnel()';
  RAISE NOTICE '- get_investor_conversion_funnel()';
  RAISE NOTICE '- get_active_users()';
  RAISE NOTICE '- track_profile_view()';
  RAISE NOTICE '- update_daily_metrics()';
  RAISE NOTICE '';
  RAISE NOTICE 'Triggers created:';
  RAISE NOTICE '- Auto timestamps on all tables';
  RAISE NOTICE '- Auto slug generation for startups/investors';
  RAISE NOTICE '- Auto upvote count updates';
  RAISE NOTICE '';
  RAISE NOTICE 'Security:';
  RAISE NOTICE '- RLS policies enabled for all tables';
  RAISE NOTICE '- Storage buckets configured';
  RAISE NOTICE '';
  RAISE NOTICE 'Ready to use! 🚀';
  RAISE NOTICE '==============================================';
END $$;
