-- Add user_type field to users table if it doesn't exist
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS user_type TEXT CHECK (user_type IN ('startup', 'investor', 'both', 'admin')) DEFAULT NULL;

-- Create index for faster queries on user_type
CREATE INDEX IF NOT EXISTS idx_users_user_type ON public.users(user_type);

-- Create function to get user type
CREATE OR REPLACE FUNCTION public.get_user_type(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  user_type TEXT;
BEGIN
  -- Get user type from users table
  SELECT u.user_type INTO user_type FROM public.users u WHERE u.id = user_id;
  
  -- If user_type is not set, determine it based on profiles
  IF user_type IS NULL THEN
    -- Check if user has startup profile
    IF EXISTS (SELECT 1 FROM public.startups WHERE user_id = user_id) THEN
      -- Check if user also has investor profile
      IF EXISTS (SELECT 1 FROM public.investors WHERE user_id = user_id) THEN
        user_type := 'both';
      ELSE
        user_type := 'startup';
      END IF;
    -- Check if user has investor profile
    ELSIF EXISTS (SELECT 1 FROM public.investors WHERE user_id = user_id) THEN
      user_type := 'investor';
    ELSE
      user_type := NULL; -- No profile yet
    END IF;
    
    -- Update user_type in users table
    UPDATE public.users SET user_type = user_type WHERE id = user_id;
  END IF;
  
  RETURN user_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger function to update user_type when profiles are created/deleted
CREATE OR REPLACE FUNCTION public.update_user_type()
RETURNS TRIGGER AS $$
DECLARE
  startup_exists BOOLEAN;
  investor_exists BOOLEAN;
  new_user_type TEXT;
BEGIN
  -- Determine which table was affected
  IF TG_TABLE_NAME = 'startups' THEN
    IF TG_OP = 'INSERT' THEN
      -- Startup profile created
      startup_exists := TRUE;
      SELECT EXISTS(SELECT 1 FROM public.investors WHERE user_id = NEW.user_id) INTO investor_exists;
    ELSIF TG_OP = 'DELETE' THEN
      -- Startup profile deleted
      startup_exists := FALSE;
      SELECT EXISTS(SELECT 1 FROM public.investors WHERE user_id = OLD.user_id) INTO investor_exists;
    END IF;
  ELSIF TG_TABLE_NAME = 'investors' THEN
    IF TG_OP = 'INSERT' THEN
      -- Investor profile created
      investor_exists := TRUE;
      SELECT EXISTS(SELECT 1 FROM public.startups WHERE user_id = NEW.user_id) INTO startup_exists;
    ELSIF TG_OP = 'DELETE' THEN
      -- Investor profile deleted
      investor_exists := FALSE;
      SELECT EXISTS(SELECT 1 FROM public.startups WHERE user_id = OLD.user_id) INTO startup_exists;
    END IF;
  END IF;
  
  -- Determine new user_type
  IF startup_exists AND investor_exists THEN
    new_user_type := 'both';
  ELSIF startup_exists THEN
    new_user_type := 'startup';
  ELSIF investor_exists THEN
    new_user_type := 'investor';
  ELSE
    new_user_type := NULL;
  END IF;
  
  -- Update user_type in users table
  IF TG_OP = 'INSERT' THEN
    UPDATE public.users SET user_type = new_user_type WHERE id = NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.users SET user_type = new_user_type WHERE id = OLD.user_id;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for startup and investor tables
DROP TRIGGER IF EXISTS update_user_type_startup_trigger ON public.startups;
CREATE TRIGGER update_user_type_startup_trigger
AFTER INSERT OR DELETE ON public.startups
FOR EACH ROW EXECUTE FUNCTION public.update_user_type();

DROP TRIGGER IF EXISTS update_user_type_investor_trigger ON public.investors;
CREATE TRIGGER update_user_type_investor_trigger
AFTER INSERT OR DELETE ON public.investors
FOR EACH ROW EXECUTE FUNCTION public.update_user_type();

-- Create function to create startup profile
CREATE OR REPLACE FUNCTION public.create_startup_profile(user_id UUID, company_name TEXT)
RETURNS UUID AS $$
DECLARE
  startup_id UUID;
BEGIN
  -- Insert startup profile
  INSERT INTO public.startups (
    user_id,
    company_name,
    stage,
    industry,
    business_model,
    status
  ) VALUES (
    user_id,
    company_name,
    'idea', -- Default stage
    ARRAY['other'], -- Default industry
    'other', -- Default business model
    'draft' -- Default status
  ) RETURNING id INTO startup_id;
  
  RETURN startup_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to create investor profile
CREATE OR REPLACE FUNCTION public.create_investor_profile(user_id UUID, investor_type TEXT, firm_name TEXT DEFAULT NULL)
RETURNS UUID AS $$
DECLARE
  investor_id UUID;
BEGIN
  -- Insert investor profile
  INSERT INTO public.investors (
    user_id,
    type,
    firm_name,
    status
  ) VALUES (
    user_id,
    investor_type,
    firm_name,
    'active' -- Default status
  ) RETURNING id INTO investor_id;
  
  RETURN investor_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to handle user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_metadata JSONB;
  user_type TEXT;
  company_name TEXT;
  investor_type TEXT;
  firm_name TEXT;
BEGIN
  -- Get user metadata
  user_metadata := NEW.raw_user_meta_data;
  
  -- Extract user type from metadata
  user_type := user_metadata->>'user_type';
  
  -- Create user record in public.users table
  INSERT INTO public.users (
    id,
    email,
    first_name,
    last_name,
    user_type
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(user_metadata->>'first_name', 'User'),
    COALESCE(user_metadata->>'last_name', NEW.id::TEXT),
    user_type
  );
  
  -- Create appropriate profile based on user type
  IF user_type = 'startup' THEN
    -- Extract company name from metadata or use default
    company_name := COALESCE(user_metadata->>'company_name', 'My Startup');
    
    -- Create startup profile
    PERFORM public.create_startup_profile(NEW.id, company_name);
  ELSIF user_type = 'investor' THEN
    -- Extract investor type and firm name from metadata or use defaults
    investor_type := COALESCE(user_metadata->>'investor_type', 'angel');
    firm_name := user_metadata->>'firm_name';
    
    -- Create investor profile
    PERFORM public.create_investor_profile(NEW.id, investor_type, firm_name);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace the trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
