-- =====================================================
-- ENHANCED ANALYTICS FUNCTIONS FOR REAL-TIME DATA
-- =====================================================

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS get_startup_analytics_comprehensive(UUID);
DROP FUNCTION IF EXISTS get_investor_analytics_comprehensive(UUID);
DROP FUNCTION IF EXISTS get_real_time_metrics();
DROP FUNCTION IF EXISTS track_user_activity(UUID, TEXT, JSONB);
DROP FUNCTION IF EXISTS get_startup_conversion_funnel_enhanced(UUID);
DROP FUNCTION IF EXISTS get_investor_conversion_funnel_enhanced(UUID);

-- Enhanced startup analytics function with real-time data
CREATE OR REPLACE FUNCTION get_startup_analytics_comprehensive(startup_id_param UUID)
RETURNS TABLE (
  metric_category TEXT,
  metric_name TEXT,
  metric_value BIGINT,
  metric_percentage DECIMAL,
  time_period TEXT,
  comparison_value BIGINT,
  trend_direction TEXT
) AS $$
DECLARE
  previous_period_start DATE := CURRENT_DATE - INTERVAL '60 days';
  current_period_start DATE := CURRENT_DATE - INTERVAL '30 days';
  total_profile_views BIGINT;
  prev_profile_views BIGINT;
  total_matches BIGINT;
  prev_matches BIGINT;
  interested_matches BIGINT;
  prev_interested_matches BIGINT;
  total_meetings BIGINT;
  prev_meetings BIGINT;
  completed_meetings BIGINT;
  prev_completed_meetings BIGINT;
  total_upvotes BIGINT;
  prev_upvotes BIGINT;
  unique_viewers BIGINT;
  prev_unique_viewers BIGINT;
BEGIN
  -- Get current period metrics
  SELECT COUNT(*) INTO total_profile_views
  FROM analytics 
  WHERE type = 'profile-view' 
    AND target_id = startup_id_param
    AND timestamp >= current_period_start;

  SELECT COUNT(DISTINCT user_id) INTO unique_viewers
  FROM analytics 
  WHERE type = 'profile-view' 
    AND target_id = startup_id_param
    AND timestamp >= current_period_start;

  SELECT COUNT(*) INTO total_matches
  FROM matches 
  WHERE startup_id = startup_id_param
    AND created_at >= current_period_start;

  SELECT COUNT(*) INTO interested_matches
  FROM matches 
  WHERE startup_id = startup_id_param
    AND status IN ('interested', 'meeting-scheduled', 'deal-in-progress', 'deal-closed')
    AND updated_at >= current_period_start;

  SELECT COUNT(*) INTO total_meetings
  FROM meetings m
  JOIN matches ma ON m.match_id = ma.id
  WHERE ma.startup_id = startup_id_param
    AND m.created_at >= current_period_start;

  SELECT COUNT(*) INTO completed_meetings
  FROM meetings m
  JOIN matches ma ON m.match_id = ma.id
  WHERE ma.startup_id = startup_id_param
    AND m.status = 'completed'
    AND m.updated_at >= current_period_start;

  SELECT COALESCE(upvote_count, 0) INTO total_upvotes
  FROM startups 
  WHERE id = startup_id_param;

  -- Get previous period metrics for comparison
  SELECT COUNT(*) INTO prev_profile_views
  FROM analytics 
  WHERE type = 'profile-view' 
    AND target_id = startup_id_param
    AND timestamp >= previous_period_start 
    AND timestamp < current_period_start;

  SELECT COUNT(DISTINCT user_id) INTO prev_unique_viewers
  FROM analytics 
  WHERE type = 'profile-view' 
    AND target_id = startup_id_param
    AND timestamp >= previous_period_start 
    AND timestamp < current_period_start;

  SELECT COUNT(*) INTO prev_matches
  FROM matches 
  WHERE startup_id = startup_id_param
    AND created_at >= previous_period_start 
    AND created_at < current_period_start;

  SELECT COUNT(*) INTO prev_interested_matches
  FROM matches 
  WHERE startup_id = startup_id_param
    AND status IN ('interested', 'meeting-scheduled', 'deal-in-progress', 'deal-closed')
    AND updated_at >= previous_period_start 
    AND updated_at < current_period_start;

  SELECT COUNT(*) INTO prev_meetings
  FROM meetings m
  JOIN matches ma ON m.match_id = ma.id
  WHERE ma.startup_id = startup_id_param
    AND m.created_at >= previous_period_start 
    AND m.created_at < current_period_start;

  SELECT COUNT(*) INTO prev_completed_meetings
  FROM meetings m
  JOIN matches ma ON m.match_id = ma.id
  WHERE ma.startup_id = startup_id_param
    AND m.status = 'completed'
    AND m.updated_at >= previous_period_start 
    AND m.updated_at < current_period_start;

  -- Return comprehensive metrics
  RETURN QUERY
  SELECT 
    'engagement'::TEXT,
    'profile_views'::TEXT,
    total_profile_views,
    CASE WHEN prev_profile_views > 0 THEN 
      ROUND(((total_profile_views - prev_profile_views)::DECIMAL / prev_profile_views) * 100, 2)
    ELSE 100.0 END,
    'last_30_days'::TEXT,
    prev_profile_views,
    CASE 
      WHEN total_profile_views > prev_profile_views THEN 'up'
      WHEN total_profile_views < prev_profile_views THEN 'down'
      ELSE 'stable'
    END::TEXT

  UNION ALL

  SELECT 
    'engagement'::TEXT,
    'unique_viewers'::TEXT,
    unique_viewers,
    CASE WHEN prev_unique_viewers > 0 THEN 
      ROUND(((unique_viewers - prev_unique_viewers)::DECIMAL / prev_unique_viewers) * 100, 2)
    ELSE 100.0 END,
    'last_30_days'::TEXT,
    prev_unique_viewers,
    CASE 
      WHEN unique_viewers > prev_unique_viewers THEN 'up'
      WHEN unique_viewers < prev_unique_viewers THEN 'down'
      ELSE 'stable'
    END::TEXT

  UNION ALL

  SELECT 
    'matching'::TEXT,
    'total_matches'::TEXT,
    total_matches,
    CASE WHEN prev_matches > 0 THEN 
      ROUND(((total_matches - prev_matches)::DECIMAL / prev_matches) * 100, 2)
    ELSE 100.0 END,
    'last_30_days'::TEXT,
    prev_matches,
    CASE 
      WHEN total_matches > prev_matches THEN 'up'
      WHEN total_matches < prev_matches THEN 'down'
      ELSE 'stable'
    END::TEXT

  UNION ALL

  SELECT 
    'matching'::TEXT,
    'interested_matches'::TEXT,
    interested_matches,
    CASE WHEN prev_interested_matches > 0 THEN 
      ROUND(((interested_matches - prev_interested_matches)::DECIMAL / prev_interested_matches) * 100, 2)
    ELSE 100.0 END,
    'last_30_days'::TEXT,
    prev_interested_matches,
    CASE 
      WHEN interested_matches > prev_interested_matches THEN 'up'
      WHEN interested_matches < prev_interested_matches THEN 'down'
      ELSE 'stable'
    END::TEXT

  UNION ALL

  SELECT 
    'meetings'::TEXT,
    'total_meetings'::TEXT,
    total_meetings,
    CASE WHEN prev_meetings > 0 THEN 
      ROUND(((total_meetings - prev_meetings)::DECIMAL / prev_meetings) * 100, 2)
    ELSE 100.0 END,
    'last_30_days'::TEXT,
    prev_meetings,
    CASE 
      WHEN total_meetings > prev_meetings THEN 'up'
      WHEN total_meetings < prev_meetings THEN 'down'
      ELSE 'stable'
    END::TEXT

  UNION ALL

  SELECT 
    'meetings'::TEXT,
    'completed_meetings'::TEXT,
    completed_meetings,
    CASE WHEN prev_completed_meetings > 0 THEN 
      ROUND(((completed_meetings - prev_completed_meetings)::DECIMAL / prev_completed_meetings) * 100, 2)
    ELSE 100.0 END,
    'last_30_days'::TEXT,
    prev_completed_meetings,
    CASE 
      WHEN completed_meetings > prev_completed_meetings THEN 'up'
      WHEN completed_meetings < prev_completed_meetings THEN 'down'
      ELSE 'stable'
    END::TEXT

  UNION ALL

  SELECT 
    'social'::TEXT,
    'total_upvotes'::TEXT,
    total_upvotes,
    0.0::DECIMAL,
    'all_time'::TEXT,
    0::BIGINT,
    'stable'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced investor analytics function
CREATE OR REPLACE FUNCTION get_investor_analytics_comprehensive(investor_id_param UUID)
RETURNS TABLE (
  metric_category TEXT,
  metric_name TEXT,
  metric_value BIGINT,
  metric_percentage DECIMAL,
  time_period TEXT,
  comparison_value BIGINT,
  trend_direction TEXT
) AS $$
DECLARE
  previous_period_start DATE := CURRENT_DATE - INTERVAL '60 days';
  current_period_start DATE := CURRENT_DATE - INTERVAL '30 days';
  investor_user_id UUID;
  startups_viewed BIGINT;
  prev_startups_viewed BIGINT;
  total_matches BIGINT;
  prev_matches BIGINT;
  interested_matches BIGINT;
  prev_interested_matches BIGINT;
  total_meetings BIGINT;
  prev_meetings BIGINT;
  completed_meetings BIGINT;
  prev_completed_meetings BIGINT;
  closed_deals BIGINT;
  prev_closed_deals BIGINT;
BEGIN
  -- Get investor user ID
  SELECT user_id INTO investor_user_id
  FROM investors
  WHERE id = investor_id_param;

  -- Get current period metrics
  SELECT COUNT(DISTINCT target_id) INTO startups_viewed
  FROM analytics 
  WHERE type = 'profile-view' 
    AND user_id = investor_user_id
    AND target_id IN (SELECT id FROM startups)
    AND timestamp >= current_period_start;

  SELECT COUNT(*) INTO total_matches
  FROM matches 
  WHERE investor_id = investor_id_param
    AND created_at >= current_period_start;

  SELECT COUNT(*) INTO interested_matches
  FROM matches 
  WHERE investor_id = investor_id_param
    AND status IN ('interested', 'meeting-scheduled', 'deal-in-progress', 'deal-closed')
    AND updated_at >= current_period_start;

  SELECT COUNT(*) INTO total_meetings
  FROM meetings m
  JOIN matches ma ON m.match_id = ma.id
  WHERE ma.investor_id = investor_id_param
    AND m.created_at >= current_period_start;

  SELECT COUNT(*) INTO completed_meetings
  FROM meetings m
  JOIN matches ma ON m.match_id = ma.id
  WHERE ma.investor_id = investor_id_param
    AND m.status = 'completed'
    AND m.updated_at >= current_period_start;

  SELECT COUNT(*) INTO closed_deals
  FROM matches 
  WHERE investor_id = investor_id_param
    AND status = 'deal-closed'
    AND updated_at >= current_period_start;

  -- Get previous period metrics
  SELECT COUNT(DISTINCT target_id) INTO prev_startups_viewed
  FROM analytics 
  WHERE type = 'profile-view' 
    AND user_id = investor_user_id
    AND target_id IN (SELECT id FROM startups)
    AND timestamp >= previous_period_start 
    AND timestamp < current_period_start;

  SELECT COUNT(*) INTO prev_matches
  FROM matches 
  WHERE investor_id = investor_id_param
    AND created_at >= previous_period_start 
    AND created_at < current_period_start;

  SELECT COUNT(*) INTO prev_interested_matches
  FROM matches 
  WHERE investor_id = investor_id_param
    AND status IN ('interested', 'meeting-scheduled', 'deal-in-progress', 'deal-closed')
    AND updated_at >= previous_period_start 
    AND updated_at < current_period_start;

  SELECT COUNT(*) INTO prev_meetings
  FROM meetings m
  JOIN matches ma ON m.match_id = ma.id
  WHERE ma.investor_id = investor_id_param
    AND m.created_at >= previous_period_start 
    AND m.created_at < current_period_start;

  SELECT COUNT(*) INTO prev_completed_meetings
  FROM meetings m
  JOIN matches ma ON m.match_id = ma.id
  WHERE ma.investor_id = investor_id_param
    AND m.status = 'completed'
    AND m.updated_at >= previous_period_start 
    AND m.updated_at < current_period_start;

  SELECT COUNT(*) INTO prev_closed_deals
  FROM matches 
  WHERE investor_id = investor_id_param
    AND status = 'deal-closed'
    AND updated_at >= previous_period_start 
    AND updated_at < current_period_start;

  -- Return comprehensive metrics
  RETURN QUERY
  SELECT 
    'discovery'::TEXT,
    'startups_viewed'::TEXT,
    startups_viewed,
    CASE WHEN prev_startups_viewed > 0 THEN 
      ROUND(((startups_viewed - prev_startups_viewed)::DECIMAL / prev_startups_viewed) * 100, 2)
    ELSE 100.0 END,
    'last_30_days'::TEXT,
    prev_startups_viewed,
    CASE 
      WHEN startups_viewed > prev_startups_viewed THEN 'up'
      WHEN startups_viewed < prev_startups_viewed THEN 'down'
      ELSE 'stable'
    END::TEXT

  UNION ALL

  SELECT 
    'matching'::TEXT,
    'total_matches'::TEXT,
    total_matches,
    CASE WHEN prev_matches > 0 THEN 
      ROUND(((total_matches - prev_matches)::DECIMAL / prev_matches) * 100, 2)
    ELSE 100.0 END,
    'last_30_days'::TEXT,
    prev_matches,
    CASE 
      WHEN total_matches > prev_matches THEN 'up'
      WHEN total_matches < prev_matches THEN 'down'
      ELSE 'stable'
    END::TEXT

  UNION ALL

  SELECT 
    'matching'::TEXT,
    'interested_matches'::TEXT,
    interested_matches,
    CASE WHEN prev_interested_matches > 0 THEN 
      ROUND(((interested_matches - prev_interested_matches)::DECIMAL / prev_interested_matches) * 100, 2)
    ELSE 100.0 END,
    'last_30_days'::TEXT,
    prev_interested_matches,
    CASE 
      WHEN interested_matches > prev_interested_matches THEN 'up'
      WHEN interested_matches < prev_interested_matches THEN 'down'
      ELSE 'stable'
    END::TEXT

  UNION ALL

  SELECT 
    'meetings'::TEXT,
    'total_meetings'::TEXT,
    total_meetings,
    CASE WHEN prev_meetings > 0 THEN 
      ROUND(((total_meetings - prev_meetings)::DECIMAL / prev_meetings) * 100, 2)
    ELSE 100.0 END,
    'last_30_days'::TEXT,
    prev_meetings,
    CASE 
      WHEN total_meetings > prev_meetings THEN 'up'
      WHEN total_meetings < prev_meetings THEN 'down'
      ELSE 'stable'
    END::TEXT

  UNION ALL

  SELECT 
    'meetings'::TEXT,
    'completed_meetings'::TEXT,
    completed_meetings,
    CASE WHEN prev_completed_meetings > 0 THEN 
      ROUND(((completed_meetings - prev_completed_meetings)::DECIMAL / prev_completed_meetings) * 100, 2)
    ELSE 100.0 END,
    'last_30_days'::TEXT,
    prev_completed_meetings,
    CASE 
      WHEN completed_meetings > prev_completed_meetings THEN 'up'
      WHEN completed_meetings < prev_completed_meetings THEN 'down'
      ELSE 'stable'
    END::TEXT

  UNION ALL

  SELECT 
    'deals'::TEXT,
    'closed_deals'::TEXT,
    closed_deals,
    CASE WHEN prev_closed_deals > 0 THEN 
      ROUND(((closed_deals - prev_closed_deals)::DECIMAL / prev_closed_deals) * 100, 2)
    ELSE 100.0 END,
    'last_30_days'::TEXT,
    prev_closed_deals,
    CASE 
      WHEN closed_deals > prev_closed_deals THEN 'up'
      WHEN closed_deals < prev_closed_deals THEN 'down'
      ELSE 'stable'
    END::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get real-time platform metrics
CREATE OR REPLACE FUNCTION get_real_time_metrics()
RETURNS TABLE (
  metric_name TEXT,
  metric_value BIGINT,
  last_updated TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'active_users_5min'::TEXT,
    COUNT(DISTINCT user_id)::BIGINT,
    NOW()
  FROM user_activities
  WHERE created_at > NOW() - INTERVAL '5 minutes'

  UNION ALL

  SELECT 
    'active_users_1hour'::TEXT,
    COUNT(DISTINCT user_id)::BIGINT,
    NOW()
  FROM user_activities
  WHERE created_at > NOW() - INTERVAL '1 hour'

  UNION ALL

  SELECT 
    'profile_views_today'::TEXT,
    COUNT(*)::BIGINT,
    NOW()
  FROM analytics
  WHERE type = 'profile-view' 
    AND timestamp::date = CURRENT_DATE

  UNION ALL

  SELECT 
    'matches_today'::TEXT,
    COUNT(*)::BIGINT,
    NOW()
  FROM matches
  WHERE created_at::date = CURRENT_DATE

  UNION ALL

  SELECT 
    'messages_today'::TEXT,
    COUNT(*)::BIGINT,
    NOW()
  FROM messages
  WHERE created_at::date = CURRENT_DATE

  UNION ALL

  SELECT 
    'meetings_today'::TEXT,
    COUNT(*)::BIGINT,
    NOW()
  FROM meetings
  WHERE created_at::date = CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to track user activity for real-time analytics
CREATE OR REPLACE FUNCTION track_user_activity(
  user_id_param UUID,
  activity_type_param TEXT,
  activity_data_param JSONB DEFAULT '{}'::JSONB
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_activities (user_id, activity_type, activity_data)
  VALUES (user_id_param, activity_type_param, activity_data_param);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced conversion funnel for startups
CREATE OR REPLACE FUNCTION get_startup_conversion_funnel_enhanced(startup_id_param UUID)
RETURNS TABLE (
  step_name TEXT,
  step_order INTEGER,
  count BIGINT,
  conversion_rate DECIMAL,
  drop_off_rate DECIMAL
) AS $$
DECLARE
  profile_views BIGINT;
  matches_created BIGINT;
  interested_matches BIGINT;
  meetings_scheduled BIGINT;
  meetings_completed BIGINT;
  deals_closed BIGINT;
BEGIN
  -- Get funnel data
  SELECT COUNT(*) INTO profile_views
  FROM analytics 
  WHERE type = 'profile-view' 
    AND target_id = startup_id_param
    AND timestamp >= CURRENT_DATE - INTERVAL '90 days';

  SELECT COUNT(*) INTO matches_created
  FROM matches 
  WHERE startup_id = startup_id_param
    AND created_at >= CURRENT_DATE - INTERVAL '90 days';

  SELECT COUNT(*) INTO interested_matches
  FROM matches 
  WHERE startup_id = startup_id_param
    AND status IN ('interested', 'meeting-scheduled', 'deal-in-progress', 'deal-closed')
    AND updated_at >= CURRENT_DATE - INTERVAL '90 days';

  SELECT COUNT(*) INTO meetings_scheduled
  FROM meetings m
  JOIN matches ma ON m.match_id = ma.id
  WHERE ma.startup_id = startup_id_param
    AND m.status IN ('confirmed', 'completed')
    AND m.created_at >= CURRENT_DATE - INTERVAL '90 days';

  SELECT COUNT(*) INTO meetings_completed
  FROM meetings m
  JOIN matches ma ON m.match_id = ma.id
  WHERE ma.startup_id = startup_id_param
    AND m.status = 'completed'
    AND m.updated_at >= CURRENT_DATE - INTERVAL '90 days';

  SELECT COUNT(*) INTO deals_closed
  FROM matches 
  WHERE startup_id = startup_id_param
    AND status = 'deal-closed'
    AND updated_at >= CURRENT_DATE - INTERVAL '90 days';

  -- Return funnel with conversion rates
  RETURN QUERY
  SELECT 
    'Profile Views'::TEXT,
    1::INTEGER,
    profile_views,
    100.0::DECIMAL,
    0.0::DECIMAL

  UNION ALL

  SELECT 
    'Matches Created'::TEXT,
    2::INTEGER,
    matches_created,
    CASE WHEN profile_views > 0 THEN 
      ROUND((matches_created::DECIMAL / profile_views) * 100, 2)
    ELSE 0.0 END,
    CASE WHEN profile_views > 0 THEN 
      ROUND(((profile_views - matches_created)::DECIMAL / profile_views) * 100, 2)
    ELSE 0.0 END

  UNION ALL

  SELECT 
    'Investor Interest'::TEXT,
    3::INTEGER,
    interested_matches,
    CASE WHEN matches_created > 0 THEN 
      ROUND((interested_matches::DECIMAL / matches_created) * 100, 2)
    ELSE 0.0 END,
    CASE WHEN matches_created > 0 THEN 
      ROUND(((matches_created - interested_matches)::DECIMAL / matches_created) * 100, 2)
    ELSE 0.0 END

  UNION ALL

  SELECT 
    'Meetings Scheduled'::TEXT,
    4::INTEGER,
    meetings_scheduled,
    CASE WHEN interested_matches > 0 THEN 
      ROUND((meetings_scheduled::DECIMAL / interested_matches) * 100, 2)
    ELSE 0.0 END,
    CASE WHEN interested_matches > 0 THEN 
      ROUND(((interested_matches - meetings_scheduled)::DECIMAL / interested_matches) * 100, 2)
    ELSE 0.0 END

  UNION ALL

  SELECT 
    'Meetings Completed'::TEXT,
    5::INTEGER,
    meetings_completed,
    CASE WHEN meetings_scheduled > 0 THEN 
      ROUND((meetings_completed::DECIMAL / meetings_scheduled) * 100, 2)
    ELSE 0.0 END,
    CASE WHEN meetings_scheduled > 0 THEN 
      ROUND(((meetings_scheduled - meetings_completed)::DECIMAL / meetings_scheduled) * 100, 2)
    ELSE 0.0 END

  UNION ALL

  SELECT 
    'Deals Closed'::TEXT,
    6::INTEGER,
    deals_closed,
    CASE WHEN meetings_completed > 0 THEN 
      ROUND((deals_closed::DECIMAL / meetings_completed) * 100, 2)
    ELSE 0.0 END,
    CASE WHEN meetings_completed > 0 THEN 
      ROUND(((meetings_completed - deals_closed)::DECIMAL / meetings_completed) * 100, 2)
    ELSE 0.0 END

  ORDER BY step_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced conversion funnel for investors
CREATE OR REPLACE FUNCTION get_investor_conversion_funnel_enhanced(investor_id_param UUID)
RETURNS TABLE (
  step_name TEXT,
  step_order INTEGER,
  count BIGINT,
  conversion_rate DECIMAL,
  drop_off_rate DECIMAL
) AS $$
DECLARE
  investor_user_id UUID;
  startups_viewed BIGINT;
  matches_created BIGINT;
  interested_matches BIGINT;
  meetings_scheduled BIGINT;
  meetings_completed BIGINT;
  deals_closed BIGINT;
BEGIN
  -- Get investor user ID
  SELECT user_id INTO investor_user_id
  FROM investors
  WHERE id = investor_id_param;

  -- Get funnel data
  SELECT COUNT(DISTINCT target_id) INTO startups_viewed
  FROM analytics 
  WHERE type = 'profile-view' 
    AND user_id = investor_user_id
    AND target_id IN (SELECT id FROM startups)
    AND timestamp >= CURRENT_DATE - INTERVAL '90 days';

  SELECT COUNT(*) INTO matches_created
  FROM matches 
  WHERE investor_id = investor_id_param
    AND created_at >= CURRENT_DATE - INTERVAL '90 days';

  SELECT COUNT(*) INTO interested_matches
  FROM matches 
  WHERE investor_id = investor_id_param
    AND status IN ('interested', 'meeting-scheduled', 'deal-in-progress', 'deal-closed')
    AND updated_at >= CURRENT_DATE - INTERVAL '90 days';

  SELECT COUNT(*) INTO meetings_scheduled
  FROM meetings m
  JOIN matches ma ON m.match_id = ma.id
  WHERE ma.investor_id = investor_id_param
    AND m.status IN ('confirmed', 'completed')
    AND m.created_at >= CURRENT_DATE - INTERVAL '90 days';

  SELECT COUNT(*) INTO meetings_completed
  FROM meetings m
  JOIN matches ma ON m.match_id = ma.id
  WHERE ma.investor_id = investor_id_param
    AND m.status = 'completed'
    AND m.updated_at >= CURRENT_DATE - INTERVAL '90 days';

  SELECT COUNT(*) INTO deals_closed
  FROM matches 
  WHERE investor_id = investor_id_param
    AND status = 'deal-closed'
    AND updated_at >= CURRENT_DATE - INTERVAL '90 days';

  -- Return funnel with conversion rates
  RETURN QUERY
  SELECT 
    'Startups Viewed'::TEXT,
    1::INTEGER,
    startups_viewed,
    100.0::DECIMAL,
    0.0::DECIMAL

  UNION ALL

  SELECT 
    'Matches Created'::TEXT,
    2::INTEGER,
    matches_created,
    CASE WHEN startups_viewed > 0 THEN 
      ROUND((matches_created::DECIMAL / startups_viewed) * 100, 2)
    ELSE 0.0 END,
    CASE WHEN startups_viewed > 0 THEN 
      ROUND(((startups_viewed - matches_created)::DECIMAL / startups_viewed) * 100, 2)
    ELSE 0.0 END

  UNION ALL

  SELECT 
    'Expressed Interest'::TEXT,
    3::INTEGER,
    interested_matches,
    CASE WHEN matches_created > 0 THEN 
      ROUND((interested_matches::DECIMAL / matches_created) * 100, 2)
    ELSE 0.0 END,
    CASE WHEN matches_created > 0 THEN 
      ROUND(((matches_created - interested_matches)::DECIMAL / matches_created) * 100, 2)
    ELSE 0.0 END

  UNION ALL

  SELECT 
    'Meetings Scheduled'::TEXT,
    4::INTEGER,
    meetings_scheduled,
    CASE WHEN interested_matches > 0 THEN 
      ROUND((meetings_scheduled::DECIMAL / interested_matches) * 100, 2)
    ELSE 0.0 END,
    CASE WHEN interested_matches > 0 THEN 
      ROUND(((interested_matches - meetings_scheduled)::DECIMAL / interested_matches) * 100, 2)
    ELSE 0.0 END

  UNION ALL

  SELECT 
    'Meetings Completed'::TEXT,
    5::INTEGER,
    meetings_completed,
    CASE WHEN meetings_scheduled > 0 THEN 
      ROUND((meetings_completed::DECIMAL / meetings_scheduled) * 100, 2)
    ELSE 0.0 END,
    CASE WHEN meetings_scheduled > 0 THEN 
      ROUND(((meetings_scheduled - meetings_completed)::DECIMAL / meetings_scheduled) * 100, 2)
    ELSE 0.0 END

  UNION ALL

  SELECT 
    'Deals Closed'::TEXT,
    6::INTEGER,
    deals_closed,
    CASE WHEN meetings_completed > 0 THEN 
      ROUND((deals_closed::DECIMAL / meetings_completed) * 100, 2)
    ELSE 0.0 END,
    CASE WHEN meetings_completed > 0 THEN 
      ROUND(((meetings_completed - deals_closed)::DECIMAL / meetings_completed) * 100, 2)
    ELSE 0.0 END

  ORDER BY step_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get time-series data for analytics charts
CREATE OR REPLACE FUNCTION get_time_series_data(
  entity_type_param TEXT,
  entity_id_param UUID,
  metric_type_param TEXT,
  days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
  date_label TEXT,
  date_value DATE,
  metric_value BIGINT
) AS $$
BEGIN
  IF metric_type_param = 'profile_views' THEN
    RETURN QUERY
    WITH date_series AS (
      SELECT generate_series(
        CURRENT_DATE - (days_back || ' days')::INTERVAL,
        CURRENT_DATE,
        '1 day'::INTERVAL
      )::DATE as date_val
    )
    SELECT 
      TO_CHAR(ds.date_val, 'Mon DD') as date_label,
      ds.date_val as date_value,
      COALESCE(COUNT(a.id), 0)::BIGINT as metric_value
    FROM date_series ds
    LEFT JOIN analytics a ON a.timestamp::DATE = ds.date_val
      AND a.type = 'profile-view'
      AND a.target_id = entity_id_param
    GROUP BY ds.date_val
    ORDER BY ds.date_val;
    
  ELSIF metric_type_param = 'matches' THEN
    RETURN QUERY
    WITH date_series AS (
      SELECT generate_series(
        CURRENT_DATE - (days_back || ' days')::INTERVAL,
        CURRENT_DATE,
        '1 day'::INTERVAL
      )::DATE as date_val
    )
    SELECT 
      TO_CHAR(ds.date_val, 'Mon DD') as date_label,
      ds.date_val as date_value,
      COALESCE(COUNT(m.id), 0)::BIGINT as metric_value
    FROM date_series ds
    LEFT JOIN matches m ON m.created_at::DATE = ds.date_val
      AND (
        (entity_type_param = 'startup' AND m.startup_id = entity_id_param) OR
        (entity_type_param = 'investor' AND m.investor_id = entity_id_param)
      )
    GROUP BY ds.date_val
    ORDER BY ds.date_val;
    
  ELSIF metric_type_param = 'meetings' THEN
    RETURN QUERY
    WITH date_series AS (
      SELECT generate_series(
        CURRENT_DATE - (days_back || ' days')::INTERVAL,
        CURRENT_DATE,
        '1 day'::INTERVAL
      )::DATE as date_val
    )
    SELECT 
      TO_CHAR(ds.date_val, 'Mon DD') as date_label,
      ds.date_val as date_value,
      COALESCE(COUNT(mt.id), 0)::BIGINT as metric_value
    FROM date_series ds
    LEFT JOIN meetings mt ON mt.created_at::DATE = ds.date_val
    LEFT JOIN matches m ON mt.match_id = m.id
    WHERE (
      (entity_type_param = 'startup' AND m.startup_id = entity_id_param) OR
      (entity_type_param = 'investor' AND m.investor_id = entity_id_param)
    )
    GROUP BY ds.date_val
    ORDER BY ds.date_val;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_startup_analytics_comprehensive(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_investor_analytics_comprehensive(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_real_time_metrics() TO authenticated;
GRANT EXECUTE ON FUNCTION track_user_activity(UUID, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION get_startup_conversion_funnel_enhanced(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_investor_conversion_funnel_enhanced(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_time_series_data(TEXT, UUID, TEXT, INTEGER) TO authenticated;

-- Create user_activities table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  activity_data JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id_created_at ON public.user_activities(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activities_type_created_at ON public.user_activities(activity_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_target_type_timestamp ON public.analytics(target_id, type, timestamp DESC);

-- Enable RLS
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_activities
CREATE POLICY "Users can view their own activities" ON public.user_activities
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activities" ON public.user_activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Enhanced Analytics Functions Created Successfully!';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Available functions:';
  RAISE NOTICE '- get_startup_analytics_comprehensive(startup_uuid)';
  RAISE NOTICE '- get_investor_analytics_comprehensive(investor_uuid)';
  RAISE NOTICE '- get_real_time_metrics()';
  RAISE NOTICE '- track_user_activity(user_id, activity_type, data)';
  RAISE NOTICE '- get_startup_conversion_funnel_enhanced(startup_uuid)';
  RAISE NOTICE '- get_investor_conversion_funnel_enhanced(investor_uuid)';
  RAISE NOTICE '- get_time_series_data(entity_type, entity_id, metric_type, days)';
  RAISE NOTICE '==============================================';
END $$; 