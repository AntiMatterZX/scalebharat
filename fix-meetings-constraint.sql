-- Fix meetings table to allow NULL attendee_id for external attendees
-- Run this in your Supabase SQL editor

-- First, drop the existing constraint if it exists
ALTER TABLE public.meetings DROP CONSTRAINT IF EXISTS valid_organizer_attendee;

-- Alter the attendee_id column to allow NULL values
ALTER TABLE public.meetings ALTER COLUMN attendee_id DROP NOT NULL;

-- Add back the constraint but allow NULL attendee_id
ALTER TABLE public.meetings ADD CONSTRAINT valid_organizer_attendee 
CHECK (organizer_id != attendee_id OR attendee_id IS NULL);

-- Update RLS policy for meetings to handle NULL attendee_id
DROP POLICY IF EXISTS "Users can view their meetings" ON public.meetings;
CREATE POLICY "Users can view their meetings" ON public.meetings FOR SELECT USING (
  auth.uid()::text = organizer_id::text OR 
  (attendee_id IS NOT NULL AND auth.uid()::text = attendee_id::text)
);

DROP POLICY IF EXISTS "Users can update their meetings" ON public.meetings;
CREATE POLICY "Users can update their meetings" ON public.meetings FOR UPDATE USING (
  auth.uid()::text = organizer_id::text OR 
  (attendee_id IS NOT NULL AND auth.uid()::text = attendee_id::text)
);

DROP POLICY IF EXISTS "Users can insert meetings" ON public.meetings;
CREATE POLICY "Users can insert meetings" ON public.meetings FOR INSERT WITH CHECK (
  auth.uid()::text = organizer_id::text
); 