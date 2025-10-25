-- ============================================================
-- RAGNETIQ CHATBOT - SUPABASE DATABASE SCHEMA
-- ============================================================
-- Table: chat_logs
-- Purpose: Store all chat interactions with IP tracking
-- ============================================================

-- Create the chat_logs table
CREATE TABLE IF NOT EXISTS chat_logs (
  id BIGSERIAL PRIMARY KEY,
  user_message TEXT NOT NULL,
  bot_response TEXT NOT NULL,
  website VARCHAR(255),
  user_ip VARCHAR(45),  -- Supports both IPv4 and IPv6 addresses
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_chat_logs_created_at ON chat_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_logs_website ON chat_logs(website);
CREATE INDEX IF NOT EXISTS idx_chat_logs_user_ip ON chat_logs(user_ip);

-- Optional: Create composite index for website and date queries
CREATE INDEX IF NOT EXISTS idx_chat_logs_website_date ON chat_logs(website, created_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY (OPTIONAL)
-- ============================================================
-- Enable Row Level Security
ALTER TABLE chat_logs ENABLE ROW LEVEL SECURITY;

-- Policy to allow inserts from API
CREATE POLICY "Allow insert for all" ON chat_logs
  FOR INSERT
  WITH CHECK (true);

-- Policy to allow select for authenticated users only
CREATE POLICY "Allow select for authenticated users" ON chat_logs
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- ============================================================
-- USEFUL QUERIES
-- ============================================================

-- View all recent chats
-- SELECT * FROM chat_logs ORDER BY created_at DESC LIMIT 50;

-- Count chats by website
-- SELECT website, COUNT(*) as chat_count 
-- FROM chat_logs 
-- GROUP BY website 
-- ORDER BY chat_count DESC;

-- View chats by IP address
-- SELECT * FROM chat_logs 
-- WHERE user_ip = 'YOUR_IP_HERE' 
-- ORDER BY created_at DESC;

-- Get unique visitors count
-- SELECT COUNT(DISTINCT user_ip) as unique_visitors 
-- FROM chat_logs;

-- Get chat activity by hour
-- SELECT 
--   DATE_TRUNC('hour', created_at) as hour,
--   COUNT(*) as chat_count
-- FROM chat_logs
-- WHERE created_at > NOW() - INTERVAL '24 hours'
-- GROUP BY hour
-- ORDER BY hour DESC;

-- Find most active IP addresses
-- SELECT 
--   user_ip,
--   COUNT(*) as message_count,
--   MIN(created_at) as first_seen,
--   MAX(created_at) as last_seen
-- FROM chat_logs
-- GROUP BY user_ip
-- ORDER BY message_count DESC
-- LIMIT 20;
