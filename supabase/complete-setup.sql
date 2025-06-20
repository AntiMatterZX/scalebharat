-- StartupConnect Database Setup
-- Run this entire script in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS public.files CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.meetings CASCADE;
DROP TABLE IF EXISTS public.analytics CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.matches CASCADE;
DROP TABLE IF EXISTS public.investors CASCADE;
DROP TABLE IF EXISTS public.startups CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  profile_picture TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  razorpay_customer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Startups table
CREATE TABLE public.startups (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) UNIQUE NOT NULL,
  company_name TEXT NOT NULL,
  tagline TEXT,
  description TEXT,
  logo TEXT,
  website TEXT,
  founded_year INTEGER,
  stage TEXT CHECK (stage IN ('idea', 'prototype', 'mvp', 'early-stage', 'growth', 'expansion')) NOT NULL,
  industry TEXT[] NOT NULL,
  business_model TEXT CHECK (business_model IN ('b2b', 'b2c', 'b2b2c', 'marketplace', 'saas', 'other')) NOT NULL,
  total_raised DECIMAL DEFAULT 0,
  current_round TEXT,
  target_amount DECIMAL,
  valuation DECIMAL,
  previous_investors TEXT[],
  revenue DECIMAL,
  users_count INTEGER,
  growth_rate DECIMAL,
  burn_rate DECIMAL,
  is_verified BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  status TEXT CHECK (status IN ('draft', 'published', 'suspended')) DEFAULT 'draft',
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Investors table
CREATE TABLE public.investors (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) UNIQUE NOT NULL,
  type TEXT CHECK (type IN ('angel', 'vc', 'corporate', 'government', 'accelerator')) NOT NULL,
  firm_name TEXT,
  bio TEXT,
  website TEXT,
  aum DECIMAL,
  investment_stages TEXT[],
  investment_industries TEXT[],
  investment_geographies TEXT[],
  check_size_min DECIMAL,
  check_size_max DECIMAL,
  business_models TEXT[],
  linkedin TEXT,
  twitter TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  status TEXT CHECK (status IN ('active', 'inactive', 'suspended')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Matches table
CREATE TABLE public.matches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  startup_id UUID REFERENCES public.startups(id) NOT NULL,
  investor_id UUID REFERENCES public.investors(id) NOT NULL,
  match_score INTEGER CHECK (match_score >= 0 AND match_score <= 100) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'interested', 'not-interested', 'meeting-scheduled', 'deal-closed')) DEFAULT 'pending',
  initiated_by TEXT CHECK (initiated_by IN ('system', 'startup', 'investor')) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(startup_id, investor_id)
);

-- Messages table
CREATE TABLE public.messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sender_id UUID REFERENCES public.users(id) NOT NULL,
  receiver_id UUID REFERENCES public.users(id) NOT NULL,
  match_id UUID REFERENCES public.matches(id) NOT NULL,
  content TEXT NOT NULL,
  type TEXT CHECK (type IN ('text', 'file', 'meeting-request')) DEFAULT 'text',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Meetings table
CREATE TABLE public.meetings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  match_id UUID REFERENCES public.matches(id) NOT NULL,
  organizer_id UUID REFERENCES public.users(id) NOT NULL,
  attendee_id UUID REFERENCES public.users(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  type TEXT CHECK (type IN ('video', 'phone', 'in-person')) DEFAULT 'video',
  status TEXT CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')) DEFAULT 'pending',
  meeting_link TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) NOT NULL,
  type TEXT CHECK (type IN ('match', 'message', 'meeting', 'system')) NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Files table for document uploads
CREATE TABLE public.files (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) NOT NULL,
  startup_id UUID REFERENCES public.startups(id),
  investor_id UUID REFERENCES public.investors(id),
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  category TEXT CHECK (category IN ('pitch_deck', 'financial', 'legal', 'profile_image', 'logo', 'other')) DEFAULT 'other',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics table (updated with correct type values)
CREATE TABLE public.analytics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  type TEXT CHECK (type IN ('page-view', 'profile-view', 'match-created', 'message-sent')) NOT NULL,
  user_id UUID REFERENCES public.users(id),
  target_id UUID,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_startups_user_id ON public.startups(user_id);
CREATE INDEX idx_startups_stage ON public.startups(stage);
CREATE INDEX idx_startups_industry ON public.startups USING GIN(industry);
CREATE INDEX idx_startups_status ON public.startups(status);
CREATE INDEX idx_startups_created_at ON public.startups(created_at DESC);

CREATE INDEX idx_investors_user_id ON public.investors(user_id);
CREATE INDEX idx_investors_type ON public.investors(type);
CREATE INDEX idx_investors_industries ON public.investors USING GIN(investment_industries);
CREATE INDEX idx_investors_status ON public.investors(status);

CREATE INDEX idx_matches_startup_id ON public.matches(startup_id);
CREATE INDEX idx_matches_investor_id ON public.matches(investor_id);
CREATE INDEX idx_matches_status ON public.matches(status);

CREATE INDEX idx_messages_match_id ON public.messages(match_id, created_at DESC);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON public.messages(receiver_id);

CREATE INDEX idx_meetings_match_id ON public.meetings(match_id);
CREATE INDEX idx_meetings_organizer_id ON public.meetings(organizer_id);
CREATE INDEX idx_meetings_attendee_id ON public.meetings(attendee_id);
CREATE INDEX idx_meetings_scheduled_at ON public.meetings(scheduled_at);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_type ON public.notifications(type);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

CREATE INDEX idx_files_user_id ON public.files(user_id);
CREATE INDEX idx_files_startup_id ON public.files(startup_id);
CREATE INDEX idx_files_investor_id ON public.files(investor_id);
CREATE INDEX idx_files_category ON public.files(category);

CREATE INDEX idx_analytics_type ON public.analytics(type);
CREATE INDEX idx_analytics_user_id ON public.analytics(user_id);
CREATE INDEX idx_analytics_timestamp ON public.analytics(timestamp DESC);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.startups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Users
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for Startups
CREATE POLICY "Startups are viewable by everyone" ON public.startups
  FOR SELECT USING (status = 'published');

CREATE POLICY "Users can manage their own startup" ON public.startups
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for Investors
CREATE POLICY "Investors are viewable by everyone" ON public.investors
  FOR SELECT USING (status = 'active');

CREATE POLICY "Users can manage their own investor profile" ON public.investors
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for Matches
CREATE POLICY "Matches are viewable by participants" ON public.matches
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.startups WHERE id = startup_id
      UNION
      SELECT user_id FROM public.investors WHERE id = investor_id
    )
  );

CREATE POLICY "Users can create matches" ON public.matches
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.startups WHERE id = startup_id
      UNION
      SELECT user_id FROM public.investors WHERE id = investor_id
    )
  );

CREATE POLICY "Users can update their matches" ON public.matches
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM public.startups WHERE id = startup_id
      UNION
      SELECT user_id FROM public.investors WHERE id = investor_id
    )
  );

-- RLS Policies for Messages
CREATE POLICY "Messages are viewable by participants" ON public.messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their received messages" ON public.messages
  FOR UPDATE USING (auth.uid() = receiver_id);

-- RLS Policies for Meetings
CREATE POLICY "Users can view their meetings" ON public.meetings
  FOR SELECT USING (auth.uid() = organizer_id OR auth.uid() = attendee_id);

CREATE POLICY "Users can create meetings" ON public.meetings
  FOR INSERT WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Users can update their meetings" ON public.meetings
  FOR UPDATE USING (auth.uid() = organizer_id OR auth.uid() = attendee_id);

-- RLS Policies for Notifications
CREATE POLICY "Users can view their notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for Files
CREATE POLICY "Users can view their files" ON public.files
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their files" ON public.files
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for Analytics (read-only for users, admin can insert)
CREATE POLICY "Users can view analytics" ON public.analytics
  FOR SELECT USING (true);

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER handle_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_startups_updated_at
  BEFORE UPDATE ON public.startups
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_investors_updated_at
  BEFORE UPDATE ON public.investors
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_matches_updated_at
  BEFORE UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_meetings_updated_at
  BEFORE UPDATE ON public.meetings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create a separate table for system configuration (instead of using analytics)
CREATE TABLE public.system_config (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert system configuration data
INSERT INTO public.system_config (key, value) VALUES 
('industries', '["Technology", "Healthcare", "Finance", "Education", "E-commerce", "SaaS", "AI/ML", "Blockchain", "IoT", "Cybersecurity", "Fintech", "Edtech", "Healthtech", "Cleantech", "Foodtech"]'),
('investment_stages', '["Pre-seed", "Seed", "Series A", "Series B", "Series C", "Series D+", "Growth", "Late Stage"]'),
('business_models', '["B2B", "B2C", "B2B2C", "Marketplace", "SaaS", "E-commerce", "Subscription", "Freemium", "Other"]'),
('geographies', '["North America", "Europe", "Asia Pacific", "Latin America", "Middle East", "Africa", "Global"]');

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'StartupConnect database setup completed successfully!';
  RAISE NOTICE 'Tables created: users, startups, investors, matches, messages, meetings, notifications, files, analytics, system_config';
  RAISE NOTICE 'Indexes, RLS policies, and triggers have been set up.';
  RAISE NOTICE 'System configuration data has been inserted.';
  RAISE NOTICE 'You can now start using your StartupConnect application!';
END $$;
