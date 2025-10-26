-- ============================================================
-- AKTUALIZÁCIA TABUĽKY chat_logs - Pridanie email tracking
-- ============================================================
-- Spustite tento príkaz v Supabase SQL Editore
-- ============================================================

-- Pridať nový stĺpec pre email tracking
ALTER TABLE chat_logs 
ADD COLUMN IF NOT EXISTS email_submitted BOOLEAN DEFAULT FALSE;

-- Vytvorenie indexu pre rýchlejšie vyhľadávanie emailov
CREATE INDEX IF NOT EXISTS idx_chat_logs_email_submitted ON chat_logs(email_submitted) WHERE email_submitted = TRUE;

-- Komentár k novému stĺpcu
COMMENT ON COLUMN chat_logs.email_submitted IS 'TRUE ak používateľ odoslal kontaktný formulár cez EmailJS v tejto session';

-- ============================================================
-- KOMPLETNÁ SCHÉMA TABUĽKY (po aktualizácii)
-- ============================================================
/*
CREATE TABLE chat_logs (
    id SERIAL PRIMARY KEY,
    user_message TEXT NOT NULL,
    bot_response TEXT,
    website VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_ip INET,
    session_id UUID NOT NULL,
    message_index INT,
    time_to_respond INTEGER,
    category VARCHAR(100),
    geo_location_city VARCHAR(100),
    email_submitted BOOLEAN DEFAULT FALSE
);
*/

-- ============================================================
-- UŽITOČNÉ DOPYTY
-- ============================================================

-- Počet sessions s odoslaným emailom
-- SELECT COUNT(DISTINCT session_id) as sessions_with_email 
-- FROM chat_logs 
-- WHERE email_submitted = TRUE;

-- Conversion rate (sessions s emailom / celkový počet sessions)
-- SELECT 
--   COUNT(DISTINCT session_id) as total_sessions,
--   COUNT(DISTINCT CASE WHEN email_submitted THEN session_id END) as conversions,
--   ROUND(
--     100.0 * COUNT(DISTINCT CASE WHEN email_submitted THEN session_id END) / 
--     COUNT(DISTINCT session_id), 
--     2
--   ) as conversion_rate_percent
-- FROM chat_logs
-- WHERE created_at >= NOW() - INTERVAL '30 days';

-- Zobraz všetky sessions kde bol odoslaný email
-- SELECT DISTINCT session_id, website, created_at 
-- FROM chat_logs 
-- WHERE email_submitted = TRUE 
-- ORDER BY created_at DESC;
