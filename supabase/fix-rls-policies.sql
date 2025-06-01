-- Fix the circular dependency in user_roles RLS policy
-- Drop the existing problematic policy
DROP POLICY IF EXISTS "Only superadmins can manage user roles" ON public.user_roles;

-- Create a simpler policy that doesn't create circular dependencies
-- Allow users to read their own roles
CREATE POLICY "Users can read their own roles" ON public.user_roles
  FOR SELECT USING (user_id = auth.uid());

-- Allow service role to manage all user roles (for admin operations)
CREATE POLICY "Service role can manage user roles" ON public.user_roles
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Fix meetings table policies to avoid circular dependencies
DROP POLICY IF EXISTS "Messages are viewable by participants" ON public.meetings;
DROP POLICY IF EXISTS "Users can manage their meetings" ON public.meetings;

-- Create simpler meeting policies
CREATE POLICY "Users can view their own meetings" ON public.meetings
  FOR SELECT USING (
    organizer_id = auth.uid() OR attendee_id = auth.uid()
  );

CREATE POLICY "Users can create meetings" ON public.meetings
  FOR INSERT WITH CHECK (
    organizer_id = auth.uid()
  );

CREATE POLICY "Users can update their own meetings" ON public.meetings
  FOR UPDATE USING (
    organizer_id = auth.uid() OR attendee_id = auth.uid()
  );

-- Ensure messages table has proper policies without circular dependencies
DROP POLICY IF EXISTS "Messages are viewable by participants" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;

CREATE POLICY "Users can view their messages" ON public.messages
  FOR SELECT USING (
    sender_id = auth.uid() OR receiver_id = auth.uid()
  );

CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
  );
