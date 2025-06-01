-- Create function for startup conversion funnel
CREATE OR REPLACE FUNCTION get_startup_conversion_funnel(startup_id UUID)
RETURNS TABLE(name TEXT, value INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'Profile Views'::TEXT as name,
    COALESCE((SELECT COUNT(*)::INTEGER FROM analytics WHERE type = 'profile-view' AND target_id = startup_id), 0) as value
  UNION ALL
  SELECT 
    'Matches Created'::TEXT as name,
    COALESCE((SELECT COUNT(*)::INTEGER FROM matches WHERE startup_id = get_startup_conversion_funnel.startup_id), 0) as value
  UNION ALL
  SELECT 
    'Interested Investors'::TEXT as name,
    COALESCE((SELECT COUNT(*)::INTEGER FROM matches WHERE startup_id = get_startup_conversion_funnel.startup_id AND status = 'interested'), 0) as value
  UNION ALL
  SELECT 
    'Meetings Scheduled'::TEXT as name,
    COALESCE((SELECT COUNT(*)::INTEGER FROM meetings m JOIN matches ma ON m.match_id = ma.id WHERE ma.startup_id = get_startup_conversion_funnel.startup_id), 0) as value
  UNION ALL
  SELECT 
    'Deals Closed'::TEXT as name,
    COALESCE((SELECT COUNT(*)::INTEGER FROM matches WHERE startup_id = get_startup_conversion_funnel.startup_id AND status = 'deal-closed'), 0) as value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function for investor conversion funnel
CREATE OR REPLACE FUNCTION get_investor_conversion_funnel(investor_id UUID)
RETURNS TABLE(name TEXT, value INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'Startups Viewed'::TEXT as name,
    COALESCE((SELECT COUNT(DISTINCT target_id)::INTEGER FROM analytics WHERE type = 'profile-view' AND user_id = (SELECT user_id FROM investors WHERE id = investor_id)), 0) as value
  UNION ALL
  SELECT 
    'Matches Created'::TEXT as name,
    COALESCE((SELECT COUNT(*)::INTEGER FROM matches WHERE investor_id = get_investor_conversion_funnel.investor_id), 0) as value
  UNION ALL
  SELECT 
    'Expressed Interest'::TEXT as name,
    COALESCE((SELECT COUNT(*)::INTEGER FROM matches WHERE investor_id = get_investor_conversion_funnel.investor_id AND status = 'interested'), 0) as value
  UNION ALL
  SELECT 
    'Meetings Scheduled'::TEXT as name,
    COALESCE((SELECT COUNT(*)::INTEGER FROM meetings m JOIN matches ma ON m.match_id = ma.id WHERE ma.investor_id = get_investor_conversion_funnel.investor_id), 0) as value
  UNION ALL
  SELECT 
    'Deals Closed'::TEXT as name,
    COALESCE((SELECT COUNT(*)::INTEGER FROM matches WHERE investor_id = get_investor_conversion_funnel.investor_id AND status = 'deal-closed'), 0) as value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_startup_conversion_funnel(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_investor_conversion_funnel(UUID) TO authenticated;
