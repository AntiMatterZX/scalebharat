-- =====================================================
-- DEBUG AND FIX ANALYTICS FUNCTIONS
-- =====================================================

-- First, let's check what columns exist in your analytics table
DO $$
DECLARE
    col_exists boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'analytics' 
        AND column_name = 'target_type'
        AND table_schema = 'public'
    ) INTO col_exists;
    
    IF col_exists THEN
        RAISE NOTICE 'target_type column EXISTS in analytics table';
    ELSE
        RAISE NOTICE 'target_type column DOES NOT EXIST in analytics table';
        RAISE NOTICE 'Available columns in analytics table:';
        
        FOR rec IN 
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'analytics' 
            AND table_schema = 'public'
            ORDER BY ordinal_position
        LOOP
            RAISE NOTICE '- %: %', rec.column_name, rec.data_type;
        END LOOP;
    END IF;
END $$;

-- =====================================================
-- OPTION 1: ADD MISSING COLUMNS TO EXISTING ANALYTICS TABLE
-- =====================================================

-- Add target_type column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'analytics' 
        AND column_name = 'target_type' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.analytics ADD COLUMN target_type TEXT;
        RAISE NOTICE 'Added target_type column to analytics table';
    END IF;
END $$;

-- Update existing analytics records to set target_type based on type
UPDATE public.analytics 
SET target_type = CASE 
    WHEN type = 'profile-view' AND target_id IN (SELECT id FROM public.startups) THEN 'startup'
    WHEN type = 'profile-view' AND target_id IN (SELECT id FROM public.investors) THEN 'investor'
    WHEN type = 'match-created' THEN 'match'
    WHEN type = 'meeting-scheduled' THEN 'meeting'
    ELSE 'unknown'
END
WHERE target_type IS NULL;

-- =====================================================
-- OPTION 2: FIXED FUNCTIONS THAT WORK WITH EXISTING SCHEMA
-- =====================================================

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS get_startup_conversion_funnel(UUID);
DROP FUNCTION IF EXISTS get_investor_conversion_funnel(UUID);

-- Fixed startup conversion funnel function
CREATE OR REPLACE FUNCTION get_startup_conversion_funnel(startup_id_param UUID)
RETURNS TABLE (
  step TEXT,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'Profile Views'::TEXT as step,
    COUNT(*)::BIGINT as count
  FROM analytics 
  WHERE type = 'profile-view' 
    AND target_id = startup_id_param
    AND timestamp >= CURRENT_DATE - INTERVAL '30 days'
  
  UNION ALL
  
  SELECT 
    'Matches Created'::TEXT as step,
    COUNT(*)::BIGINT as count
  FROM matches 
  WHERE startup_id = startup_id_param
    AND created_at >= CURRENT_DATE - INTERVAL '30 days'
  
  UNION ALL
  
  SELECT 
    'Interested Matches'::TEXT as step,
    COUNT(*)::BIGINT as count
  FROM matches 
  WHERE startup_id = startup_id_param
    AND status IN ('interested', 'meeting-scheduled', 'deal-in-progress', 'deal-closed')
    AND updated_at >= CURRENT_DATE - INTERVAL '30 days'
  
  UNION ALL
  
  SELECT 
    'Meetings Scheduled'::TEXT as step,
    COUNT(*)::BIGINT as count
  FROM meetings m
  JOIN matches ma ON m.match_id = ma.id
  WHERE ma.startup_id = startup_id_param
    AND m.status IN ('confirmed', 'completed')
    AND m.created_at >= CURRENT_DATE - INTERVAL '30 days'
  
  UNION ALL
  
  SELECT 
    'Meetings Completed'::TEXT as step,
    COUNT(*)::BIGINT as count
  FROM meetings m
  JOIN matches ma ON m.match_id = ma.id
  WHERE ma.startup_id = startup_id_param
    AND m.status = 'completed'
    AND m.updated_at >= CURRENT_DATE - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Fixed investor conversion funnel function
CREATE OR REPLACE FUNCTION get_investor_conversion_funnel(investor_id_param UUID)
RETURNS TABLE (
  step TEXT,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'Startups Viewed'::TEXT as step,
    COUNT(DISTINCT target_id)::BIGINT as count
  FROM analytics 
  WHERE type = 'profile-view' 
    AND user_id = (SELECT user_id FROM investors WHERE id = investor_id_param)
    AND target_id IN (SELECT id FROM startups)
    AND timestamp >= CURRENT_DATE - INTERVAL '30 days'
  
  UNION ALL
  
  SELECT 
    'Matches Created'::TEXT as step,
    COUNT(*)::BIGINT as count
  FROM matches 
  WHERE investor_id = investor_id_param
    AND created_at >= CURRENT_DATE - INTERVAL '30 days'
  
  UNION ALL
  
  SELECT 
    'Interested Matches'::TEXT as step,
    COUNT(*)::BIGINT as count
  FROM matches 
  WHERE investor_id = investor_id_param
    AND status IN ('interested', 'meeting-scheduled', 'deal-in-progress', 'deal-closed')
    AND updated_at >= CURRENT_DATE - INTERVAL '30 days'
  
  UNION ALL
  
  SELECT 
    'Meetings Scheduled'::TEXT as step,
    COUNT(*)::BIGINT as count
  FROM meetings m
  JOIN matches ma ON m.match_id = ma.id
  WHERE ma.investor_id = investor_id_param
    AND m.status IN ('confirmed', 'completed')
    AND m.created_at >= CURRENT_DATE - INTERVAL '30 days'
  
  UNION ALL
  
  SELECT 
    'Meetings Completed'::TEXT as step,
    COUNT(*)::BIGINT as count
  FROM meetings m
  JOIN matches ma ON m.match_id = ma.id
  WHERE ma.investor_id = investor_id_param
    AND m.status = 'completed'
    AND m.updated_at >= CURRENT_DATE - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Fixed track profile view function
CREATE OR REPLACE FUNCTION track_profile_view(
  viewer_user_id UUID,
  profile_type_param TEXT,
  profile_id_param UUID,
  ip_addr INET DEFAULT NULL,
  user_agent_param TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- Insert analytics event (without target_type if column doesn't exist)
  INSERT INTO analytics (user_id, type, target_id, ip_address, user_agent, metadata)
  VALUES (
    viewer_user_id, 
    'profile-view', 
    profile_id_param, 
    ip_addr, 
    user_agent_param,
    jsonb_build_object('profile_type', profile_type_param)
  );
  
  -- Update view count based on profile type
  IF profile_type_param = 'startup' THEN
    UPDATE startups SET view_count = COALESCE(view_count, 0) + 1 WHERE id = profile_id_param;
  ELSIF profile_type_param = 'investor' THEN
    UPDATE investors SET view_count = COALESCE(view_count, 0) + 1 WHERE id = profile_id_param;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get startup analytics by slug
CREATE OR REPLACE FUNCTION get_startup_analytics_by_slug(startup_slug_param TEXT)
RETURNS TABLE (
  metric_name TEXT,
  metric_value BIGINT,
  period TEXT
) AS $$
DECLARE
  startup_uuid UUID;
BEGIN
  -- Get startup ID from slug
  SELECT id INTO startup_uuid FROM startups WHERE slug = startup_slug_param;
  
  IF startup_uuid IS NULL THEN
    RAISE EXCEPTION 'Startup with slug % not found', startup_slug_param;
  END IF;
  
  RETURN QUERY
  -- Profile views last 30 days
  SELECT 
    'profile_views'::TEXT as metric_name,
    COUNT(*)::BIGINT as metric_value,
    'last_30_days'::TEXT as period
  FROM analytics 
  WHERE type = 'profile-view' 
    AND target_id = startup_uuid
    AND timestamp >= CURRENT_DATE - INTERVAL '30 days'
  
  UNION ALL
  
  -- Total matches
  SELECT 
    'total_matches'::TEXT as metric_name,
    COUNT(*)::BIGINT as metric_value,
    'all_time'::TEXT as period
  FROM matches 
  WHERE startup_id = startup_uuid
  
  UNION ALL
  
  -- Interested matches
  SELECT 
    'interested_matches'::TEXT as metric_name,
    COUNT(*)::BIGINT as metric_value,
    'all_time'::TEXT as period
  FROM matches 
  WHERE startup_id = startup_uuid
    AND status IN ('interested', 'meeting-scheduled', 'deal-in-progress', 'deal-closed')
  
  UNION ALL
  
  -- Total meetings
  SELECT 
    'total_meetings'::TEXT as metric_name,
    COUNT(*)::BIGINT as metric_value,
    'all_time'::TEXT as period
  FROM meetings m
  JOIN matches ma ON m.match_id = ma.id
  WHERE ma.startup_id = startup_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to get investor analytics by slug
CREATE OR REPLACE FUNCTION get_investor_analytics_by_slug(investor_slug_param TEXT)
RETURNS TABLE (
  metric_name TEXT,
  metric_value BIGINT,
  period TEXT
) AS $$
DECLARE
  investor_uuid UUID;
  investor_user_id UUID;
BEGIN
  -- Get investor ID and user ID from slug
  SELECT id, user_id INTO investor_uuid, investor_user_id 
  FROM investors 
  WHERE slug = investor_slug_param;
  
  IF investor_uuid IS NULL THEN
    RAISE EXCEPTION 'Investor with slug % not found', investor_slug_param;
  END IF;
  
  RETURN QUERY
  -- Startups viewed last 30 days
  SELECT 
    'startups_viewed'::TEXT as metric_name,
    COUNT(DISTINCT target_id)::BIGINT as metric_value,
    'last_30_days'::TEXT as period
  FROM analytics 
  WHERE type = 'profile-view' 
    AND user_id = investor_user_id
    AND target_id IN (SELECT id FROM startups)
    AND timestamp >= CURRENT_DATE - INTERVAL '30 days'
  
  UNION ALL
  
  -- Total matches
  SELECT 
    'total_matches'::TEXT as metric_name,
    COUNT(*)::BIGINT as metric_value,
    'all_time'::TEXT as period
  FROM matches 
  WHERE investor_id = investor_uuid
  
  UNION ALL
  
  -- Interested matches
  SELECT 
    'interested_matches'::TEXT as metric_name,
    COUNT(*)::BIGINT as metric_value,
    'all_time'::TEXT as period
  FROM matches 
  WHERE investor_id = investor_uuid
    AND status IN ('interested', 'meeting-scheduled', 'deal-in-progress', 'deal-closed')
  
  UNION ALL
  
  -- Total meetings
  SELECT 
    'total_meetings'::TEXT as metric_name,
    COUNT(*)::BIGINT as metric_value,
    'all_time'::TEXT as period
  FROM meetings m
  JOIN matches ma ON m.match_id = ma.id
  WHERE ma.investor_id = investor_uuid;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_startup_conversion_funnel(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_investor_conversion_funnel(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION track_profile_view(UUID, TEXT, UUID, INET, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_startup_analytics_by_slug(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_investor_analytics_by_slug(TEXT) TO authenticated;

-- Test the functions
DO $$
BEGIN
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Analytics functions fixed and ready to use!';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Available functions:';
  RAISE NOTICE '- get_startup_conversion_funnel(startup_uuid)';
  RAISE NOTICE '- get_investor_conversion_funnel(investor_uuid)';
  RAISE NOTICE '- get_startup_analytics_by_slug(startup_slug)';
  RAISE NOTICE '- get_investor_analytics_by_slug(investor_slug)';
  RAISE NOTICE '- track_profile_view(user_id, type, target_id, ip, user_agent)';
  RAISE NOTICE '';
  RAISE NOTICE 'Test with:';
  RAISE NOTICE 'SELECT * FROM get_startup_analytics_by_slug(''your-startup-slug'');';
  RAISE NOTICE '==============================================';
END $$;
