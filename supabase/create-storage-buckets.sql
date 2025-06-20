-- Create storage buckets if they don't exist
DO $$
BEGIN
    -- Check if the logos bucket exists
    IF NOT EXISTS (
        SELECT 1 FROM storage.buckets WHERE id = 'logos'
    ) THEN
        -- Create the logos bucket
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('logos', 'logos', true);
    END IF;
    
    -- Check if the documents bucket exists
    IF NOT EXISTS (
        SELECT 1 FROM storage.buckets WHERE id = 'documents'
    ) THEN
        -- Create the documents bucket
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('documents', 'documents', false);
    END IF;
    
    -- Check if the avatars bucket exists
    IF NOT EXISTS (
        SELECT 1 FROM storage.buckets WHERE id = 'avatars'
    ) THEN
        -- Create the avatars bucket
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('avatars', 'avatars', true);
    END IF;
END $$;

-- Create RLS policies for storage buckets
-- Note: These policies apply to the storage.objects table

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can upload logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view their documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view avatars" ON storage.objects;

-- Logos bucket policies (public bucket)
CREATE POLICY "Authenticated users can upload logos" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'logos');

CREATE POLICY "Anyone can view logos" ON storage.objects
    FOR SELECT TO public
    USING (bucket_id = 'logos');

-- Documents bucket policies (private bucket)
CREATE POLICY "Authenticated users can upload documents" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Users can view their own documents" ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Avatars bucket policies (public bucket)
CREATE POLICY "Authenticated users can upload avatars" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Anyone can view avatars" ON storage.objects
    FOR SELECT TO public
    USING (bucket_id = 'avatars');

-- Allow users to update and delete their own files
CREATE POLICY "Users can update their own files" ON storage.objects
    FOR UPDATE TO authenticated
    USING (auth.uid()::text = (storage.foldername(name))[1])
    WITH CHECK (auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own files" ON storage.objects
    FOR DELETE TO authenticated
    USING (auth.uid()::text = (storage.foldername(name))[1]);
