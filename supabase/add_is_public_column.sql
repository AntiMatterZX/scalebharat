-- Migration script to add 'is_public' column to 'startup_documents' table

ALTER TABLE public.startup_documents
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;

-- Optional: Add policies if needed
-- CREATE POLICY "Public documents are viewable by everyone" ON public.startup_documents FOR SELECT USING (is_public = true);
-- CREATE POLICY "Startup owners can view all documents" ON public.startup_documents FOR SELECT USING (auth.uid() = user_id);
