CREATE OR REPLACE FUNCTION public.create_user_roles_if_not_exists()
RETURNS void AS $$
BEGIN
  -- Check if the user_roles table exists
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_roles'
  ) THEN
    -- Create the user_roles table
    CREATE TABLE public.user_roles (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin', 'superadmin')),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(user_id, role)
    );

    -- Add indexes
    CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
    CREATE INDEX idx_user_roles_role ON public.user_roles(role);

    -- Enable Row Level Security
    ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

    -- Create policies
    CREATE POLICY "Admins can view all roles" 
    ON public.user_roles FOR SELECT 
    USING (
      EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin')
      )
    );

    CREATE POLICY "Superadmins can manage all roles" 
    ON public.user_roles FOR ALL 
    USING (
      EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'superadmin'
      )
    );
  END IF;
END;
$$ LANGUAGE plpgsql;
