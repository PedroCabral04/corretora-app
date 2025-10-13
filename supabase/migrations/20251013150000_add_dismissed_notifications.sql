-- Add dismissed_at column to notifications table
-- This allows "soft delete" - notifications are hidden but not deleted
-- Prevents recreation after user dismisses them

-- Add the dismissed_at column
ALTER TABLE notifications 
  ADD COLUMN dismissed_at TIMESTAMPTZ;

-- Create index for efficient querying of non-dismissed notifications
CREATE INDEX idx_notifications_dismissed_at ON notifications(dismissed_at)
  WHERE dismissed_at IS NULL;

-- Add comment explaining the column
COMMENT ON COLUMN notifications.dismissed_at IS 
  'Timestamp when notification was dismissed by user. NULL means not dismissed. ' ||
  'Dismissed notifications are hidden from UI but prevent recreation for 24h.';

-- Update the cleanup function to only delete dismissed notifications older than 30 days
CREATE OR REPLACE FUNCTION cleanup_old_notification_duplicates()
RETURNS void AS $$
BEGIN
  -- Delete old dismissed notifications (both read and unread)
  DELETE FROM notifications
  WHERE 
    dismissed_at IS NOT NULL 
    AND dismissed_at < NOW() - INTERVAL '30 days';
    
  -- Also delete old read notifications that were never dismissed (fallback cleanup)
  DELETE FROM notifications
  WHERE 
    is_read = true 
    AND dismissed_at IS NULL
    AND created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update comment on cleanup function
COMMENT ON FUNCTION cleanup_old_notification_duplicates() IS
  'Cleans up dismissed notifications older than 30 days and read notifications older than 90 days. ' ||
  'Dismissed notifications are kept longer to prevent recreation. ' ||
  'Can be scheduled to run periodically via pg_cron or called manually.';
