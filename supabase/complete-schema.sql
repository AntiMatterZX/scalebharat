-- Add missing tables for complete functionality

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

-- Add indexes
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

-- Enable RLS
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their meetings" ON public.meetings
  FOR SELECT USING (auth.uid() = organizer_id OR auth.uid() = attendee_id);

CREATE POLICY "Users can create meetings" ON public.meetings
  FOR INSERT WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Users can update their meetings" ON public.meetings
  FOR UPDATE USING (auth.uid() = organizer_id OR auth.uid() = attendee_id);

CREATE POLICY "Users can view their notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their files" ON public.files
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their files" ON public.files
  FOR ALL USING (auth.uid() = user_id);

-- Create storage buckets (run these in Supabase dashboard)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true);
