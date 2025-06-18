-- Notifications System - Safe Installation
-- Only creates the notifications table and related functions
-- Does not modify existing startup_pending_edits tables

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

-- Create indexes for notifications table
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for notifications if they exist, then recreate them
DO $$ 
BEGIN
  -- Drop existing policies for notifications
  DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
  DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
  DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
  DROP POLICY IF EXISTS "Admins can view all notifications" ON public.notifications;
END $$;

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

-- Create trigger function for automatic notifications on status changes
-- This will only work if startup_pending_edits table exists
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

-- Try to create the trigger (will fail silently if table doesn't exist)
DO $$
BEGIN
  -- Check if startup_pending_edits table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'startup_pending_edits') THEN
    -- Drop and recreate the trigger
    DROP TRIGGER IF EXISTS startup_status_change_notification ON public.startup_pending_edits;
    CREATE TRIGGER startup_status_change_notification
      AFTER UPDATE ON public.startup_pending_edits
      FOR EACH ROW EXECUTE FUNCTION notify_startup_status_change();
    RAISE NOTICE 'Trigger created on startup_pending_edits table';
  ELSE
    RAISE NOTICE 'startup_pending_edits table not found - trigger not created';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not create trigger: %', SQLERRM;
END $$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.notifications TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION create_notification TO authenticated;

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE 'Notifications system installed successfully!';
  RAISE NOTICE 'Table created/verified: notifications';
  RAISE NOTICE 'Function created: create_notification';
  RAISE NOTICE 'Notification system is ready to use!';
END $$; 