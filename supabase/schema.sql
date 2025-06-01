-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

-- Analytics table
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

CREATE INDEX idx_analytics_type ON public.analytics(type);
CREATE INDEX idx_analytics_user_id ON public.analytics(user_id);
CREATE INDEX idx_analytics_timestamp ON public.analytics(timestamp DESC);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.startups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Startups are viewable by everyone" ON public.startups
  FOR SELECT USING (status = 'published');

CREATE POLICY "Users can manage their own startup" ON public.startups
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Investors are viewable by everyone" ON public.investors
  FOR SELECT USING (status = 'active');

CREATE POLICY "Users can manage their own investor profile" ON public.investors
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Matches are viewable by participants" ON public.matches
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.startups WHERE id = startup_id
      UNION
      SELECT user_id FROM public.investors WHERE id = investor_id
    )
  );

CREATE POLICY "Messages are viewable by participants" ON public.messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);
