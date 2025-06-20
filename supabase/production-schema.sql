-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE startups ENABLE ROW LEVEL SECURITY;
ALTER TABLE investors ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_pitches ENABLE ROW LEVEL SECURITY;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_startups_user_id ON startups(user_id);
CREATE INDEX IF NOT EXISTS idx_investors_user_id ON investors(user_id);
CREATE INDEX IF NOT EXISTS idx_matches_startup_id ON matches(startup_id);
CREATE INDEX IF NOT EXISTS idx_matches_investor_id ON matches(investor_id);
CREATE INDEX IF NOT EXISTS idx_messages_match_id ON messages(match_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_startups_industry ON startups USING GIN (industry);
CREATE INDEX IF NOT EXISTS idx_investors_industries ON investors USING GIN (industries);

-- Add Row Level Security policies

-- Users table policies
CREATE POLICY "Users can view their own profile"
ON users FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON users FOR UPDATE
USING (auth.uid() = id);

-- Startups table policies
CREATE POLICY "Anyone can view published startups"
ON startups FOR SELECT
USING (status = 'published');

CREATE POLICY "Startup owners can view their own startups"
ON startups FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Startup owners can update their own startups"
ON startups FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Startup owners can delete their own startups"
ON startups FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create startups"
ON startups FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Investors table policies
CREATE POLICY "Anyone can view active investors"
ON investors FOR SELECT
USING (status = 'active');

CREATE POLICY "Investor owners can view their own investor profiles"
ON investors FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Investor owners can update their own investor profiles"
ON investors FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Investor owners can delete their own investor profiles"
ON investors FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create investor profiles"
ON investors FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Matches table policies
CREATE POLICY "Users can view their own matches"
ON matches FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM startups WHERE startups.id = startup_id AND startups.user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM investors WHERE investors.id = investor_id AND investors.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create matches for their own profiles"
ON matches FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM startups WHERE startups.id = startup_id AND startups.user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM investors WHERE investors.id = investor_id AND investors.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own matches"
ON matches FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM startups WHERE startups.id = startup_id AND startups.user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM investors WHERE investors.id = investor_id AND investors.user_id = auth.uid()
  )
);

-- Messages table policies
CREATE POLICY "Users can view messages in their matches"
ON messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM matches
    JOIN startups ON startups.id = matches.startup_id
    WHERE matches.id = match_id AND startups.user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM matches
    JOIN investors ON investors.id = matches.investor_id
    WHERE matches.id = match_id AND investors.user_id = auth.uid()
  )
);

CREATE POLICY "Users can send messages in their matches"
ON messages FOR INSERT
WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM matches
    WHERE matches.id = match_id AND (
      EXISTS (
        SELECT 1 FROM startups WHERE startups.id = matches.startup_id AND startups.user_id = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM investors WHERE investors.id = matches.investor_id AND investors.user_id = auth.uid()
      )
    )
  )
);

-- Notifications table policies
CREATE POLICY "Users can view their own notifications"
ON notifications FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can mark their own notifications as read"
ON notifications FOR UPDATE
USING (user_id = auth.uid());

-- Add database functions for real-time features

-- Function to create a notification when a match is created
CREATE OR REPLACE FUNCTION create_match_notification()
RETURNS TRIGGER AS $$
DECLARE
  startup_user_id UUID;
  investor_user_id UUID;
  startup_name TEXT;
  investor_name TEXT;
BEGIN
  -- Get user IDs and names
  SELECT user_id, company_name INTO startup_user_id, startup_name
  FROM startups
  WHERE id = NEW.startup_id;
  
  SELECT user_id, COALESCE(firm_name, u.first_name || ' ' || u.last_name) INTO investor_user_id, investor_name
  FROM investors
  JOIN users u ON u.id = investors.user_id
  WHERE investors.id = NEW.investor_id;
  
  -- Create notification for startup user
  INSERT INTO notifications (
    user_id,
    type,
    title,
    content,
    link,
    data
  ) VALUES (
    startup_user_id,
    'match',
    'New Match',
    'You have a new match with ' || investor_name,
    '/matches',
    jsonb_build_object(
      'match_id', NEW.id,
      'investor_id', NEW.investor_id,
      'investor_name', investor_name
    )
  );
  
  -- Create notification for investor user
  INSERT INTO notifications (
    user_id,
    type,
    title,
    content,
    link,
    data
  ) VALUES (
    investor_user_id,
    'match',
    'New Match',
    'You have a new match with ' || startup_name,
    '/matches',
    jsonb_build_object(
      'match_id', NEW.id,
      'startup_id', NEW.startup_id,
      'startup_name', startup_name
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for match notifications
DROP TRIGGER IF EXISTS match_notification_trigger ON matches;
CREATE TRIGGER match_notification_trigger
AFTER INSERT ON matches
FOR EACH ROW
EXECUTE FUNCTION create_match_notification();

-- Function to create a notification when a message is received
CREATE OR REPLACE FUNCTION create_message_notification()
RETURNS TRIGGER AS $$
DECLARE
  match_data RECORD;
  sender_name TEXT;
BEGIN
  -- Skip if sender and receiver are the same (shouldn't happen)
  IF NEW.sender_id = NEW.receiver_id THEN
    RETURN NEW;
  END IF;
  
  -- Get match data
  SELECT m.*, s.company_name, i.firm_name, u.first_name, u.last_name
  INTO match_data
  FROM matches m
  LEFT JOIN startups s ON s.id = m.startup_id
  LEFT JOIN investors i ON i.id = m.investor_id
  LEFT JOIN users u ON u.id = NEW.sender_id
  WHERE m.id = NEW.match_id;
  
  -- Determine sender name
  IF NEW.sender_id = (SELECT user_id FROM startups WHERE id = match_data.startup_id) THEN
    sender_name := match_data.company_name;
  ELSE
    sender_name := COALESCE(match_data.firm_name, match_data.first_name || ' ' || match_data.last_name);
  END IF;
  
  -- Create notification
  INSERT INTO notifications (
    user_id,
    type,
    title,
    content,
    link,
    data
  ) VALUES (
    NEW.receiver_id,
    'message',
    'New Message',
    'You have a new message from ' || sender_name,
    '/messages?conversation=' || NEW.match_id,
    jsonb_build_object(
      'match_id', NEW.match_id,
      'message_id', NEW.id,
      'sender_name', sender_name
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for message notifications
DROP TRIGGER IF EXISTS message_notification_trigger ON messages;
CREATE TRIGGER message_notification_trigger
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION create_message_notification();

-- Add database functions for analytics

-- Function to increment startup views
CREATE OR REPLACE FUNCTION increment_startup_views()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE startups
  SET views = views + 1
  WHERE id = NEW.startup_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for startup views
DROP TRIGGER IF EXISTS startup_views_trigger ON startup_views;
CREATE TRIGGER startup_views_trigger
AFTER INSERT ON startup_views
FOR EACH ROW
EXECUTE FUNCTION increment_startup_views();

-- Add database functions for subscription management

-- Function to handle subscription expiration
CREATE OR REPLACE FUNCTION check_subscription_expiry()
RETURNS TRIGGER AS $$
BEGIN
  -- If subscription is expired, downgrade to free plan
  IF NEW.expires_at < NOW() AND NEW.status = 'active' THEN
    NEW.status := 'expired';
    
    -- Update user or profile with free plan features
    IF NEW.subscriber_type = 'startup' THEN
      UPDATE startups
      SET is_featured = false
      WHERE id = NEW.subscriber_id;
    ELSIF NEW.subscriber_type = 'investor' THEN
      UPDATE investors
      SET is_featured = false
      WHERE id = NEW.subscriber_id;
    END IF;
    
    -- Create notification about expiration
    INSERT INTO notifications (
      user_id,
      type,
      title,
      content,
      link
    ) VALUES (
      NEW.user_id,
      'subscription',
      'Subscription Expired',
      'Your premium subscription has expired. Upgrade to continue enjoying premium features.',
      '/settings/subscription'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for subscription expiry
DROP TRIGGER IF EXISTS subscription_expiry_trigger ON subscriptions;
CREATE TRIGGER subscription_expiry_trigger
BEFORE UPDATE ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION check_subscription_expiry();

-- Add scheduled job to check expired subscriptions
SELECT cron.schedule(
  'check-expired-subscriptions',
  '0 0 * * *', -- Run daily at midnight
  $$
    UPDATE subscriptions
    SET status = 'expired'
    WHERE expires_at < NOW() AND status = 'active';
  $$
);
