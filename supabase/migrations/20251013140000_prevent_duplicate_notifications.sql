-- Migration to prevent duplicate notifications
-- Adds partial unique index to prevent creating duplicate notifications
-- for the same entity within 24 hours

-- First, clean up any existing duplicate notifications within the last 24 hours
-- Keep only the most recent notification for each (user_id, type, related_id) combination
WITH ranked_notifications AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, type, related_id 
      ORDER BY created_at DESC
    ) as rn
  FROM notifications
  WHERE 
    related_id IS NOT NULL
    AND created_at > NOW() - INTERVAL '24 hours'
)
DELETE FROM notifications
WHERE id IN (
  SELECT id 
  FROM ranked_notifications 
  WHERE rn > 1
);

-- Note: We cannot use a partial unique index with NOW() because NOW() is not IMMUTABLE
-- Instead, we use a trigger-based approach to prevent duplicates within 24 hours

-- Create a simple index to speed up the duplicate check in our trigger
CREATE INDEX IF NOT EXISTS idx_notifications_duplicate_check
ON notifications (user_id, type, related_id, created_at)
WHERE related_id IS NOT NULL;

-- Create a function to check for duplicate notifications before insert
CREATE OR REPLACE FUNCTION prevent_duplicate_notifications()
RETURNS TRIGGER AS $$
BEGIN
  -- Only check for duplicates if related_id is not null
  IF NEW.related_id IS NOT NULL THEN
    -- Check if a similar notification exists within the last 24 hours
    IF EXISTS (
      SELECT 1 
      FROM notifications 
      WHERE 
        user_id = NEW.user_id 
        AND type = NEW.type 
        AND related_id = NEW.related_id
        AND created_at > NOW() - INTERVAL '24 hours'
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    ) THEN
      -- Return NULL to prevent the insert
      RETURN NULL;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to prevent duplicate notifications
DROP TRIGGER IF EXISTS trigger_prevent_duplicate_notifications ON notifications;
CREATE TRIGGER trigger_prevent_duplicate_notifications
  BEFORE INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION prevent_duplicate_notifications();

-- Create a function to automatically clean up old notification prevention records
-- This runs daily to remove the index constraint for notifications older than 24 hours
CREATE OR REPLACE FUNCTION cleanup_old_notification_duplicates()
RETURNS void AS $$
BEGIN
  -- The unique index automatically handles this by only considering
  -- notifications from the last 24 hours (WHERE clause in index)
  -- No explicit cleanup needed as the index is partial
  
  -- However, we can optionally delete old read notifications to keep table size manageable
  DELETE FROM notifications
  WHERE 
    is_read = true 
    AND created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;



-- Add comment on cleanup function
COMMENT ON FUNCTION cleanup_old_notification_duplicates() IS
  'Cleans up read notifications older than 30 days to maintain table performance. ' ||
  'Can be scheduled to run periodically via pg_cron or called manually.';

-- Add comment on the duplicate check index
COMMENT ON INDEX idx_notifications_duplicate_check IS
  'Speeds up duplicate notification checks in the prevent_duplicate_notifications trigger. ' ||
  'Covers the query used to check for existing notifications within 24 hours.';
