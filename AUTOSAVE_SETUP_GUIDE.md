# Ragnetiq Chatbot - Auto-Save Feature Setup Guide

## 📋 Overview

Your chatbot now automatically saves every conversation to a Supabase database via a Vercel API endpoint. Every time the bot responds, the user's message and bot's reply are stored along with the website hostname.

---

## 🚀 Setup Instructions

### Step 1: Create Supabase Table

You need to create a table in your Supabase database to store chat interactions.

**SQL Schema:**

```sql
-- Create chats table
CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_message TEXT NOT NULL,
  bot_response TEXT NOT NULL,
  website TEXT DEFAULT 'unknown',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better query performance
CREATE INDEX idx_chats_created_at ON chats(created_at DESC);
CREATE INDEX idx_chats_website ON chats(website);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;

-- Create policy to allow inserts (adjust based on your security needs)
CREATE POLICY "Allow insert for all" ON chats
  FOR INSERT
  WITH CHECK (true);

-- Create policy to allow select for authenticated users only (optional)
CREATE POLICY "Allow select for authenticated users" ON chats
  FOR SELECT
  USING (auth.role() = 'authenticated');
```

### Step 2: Configure Vercel Environment Variables

In your Vercel project dashboard, add these environment variables:

1. Go to: **Your Project → Settings → Environment Variables**
2. Add the following:

| Variable Name | Value | Description |
|--------------|-------|-------------|
| `SUPABASE_URL` | Your Supabase project URL | Found in Supabase Project Settings → API |
| `SUPABASE_KEY` | Your Supabase anon/public key | Found in Supabase Project Settings → API |
| `API_KEY` | Your DeepSeek API key | (Already configured) |

**Example:**
```
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 3: Install Dependencies

Run this command in your project directory:

```bash
npm install @supabase/supabase-js
```

### Step 4: Deploy to Vercel

```bash
vercel --prod
```

---

## 📁 Files Modified/Created

### Modified Files:

1. **`index.html`**
   - Added `saveChatToAPI()` function
   - Integrated automatic saving after every bot response
   - Captures website hostname automatically

2. **`package.json`**
   - Added `@supabase/supabase-js` dependency

### New Files:

1. **`api/saveChat.js`**
   - Vercel serverless function
   - Handles POST requests with chat data
   - Saves to Supabase database
   - Includes error handling and validation

2. **`chatbot-widget-with-autosave.js`**
   - Standalone widget with auto-save capability
   - Can be embedded on any website
   - Includes all necessary functionality

---

## 🔧 How It Works

### Flow Diagram:

```
User sends message
      ↓
Bot generates response
      ↓
Display message to user
      ↓
saveChatToAPI() is called ← AUTOMATIC
      ↓
POST request to /api/saveChat
      ↓
Vercel API validates data
      ↓
Saves to Supabase database
      ↓
Success/Error logged to console
```

### Code Explanation:

**In `index.html` (after bot response):**
```javascript
// After the bot responds and message is displayed
saveChatToAPI(message, reply);
```

**The `saveChatToAPI()` function:**
```javascript
async function saveChatToAPI(userMessage, botResponse) {
  try {
    const website = window.location.hostname; // Auto-capture website
    
    const response = await fetch('https://ragnetiq-bot.vercel.app/api/saveChat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userMessage: userMessage,
        botResponse: botResponse,
        website: website
      })
    });

    if (response.ok) {
      console.log('✅ Chat saved successfully');
    } else {
      console.warn('⚠️ Failed to save chat');
    }
  } catch (error) {
    console.error('❌ Error saving chat:', error.message);
  }
}
```

---

## 🧪 Testing

### Test the API endpoint directly:

```bash
curl -X POST https://ragnetiq-bot.vercel.app/api/saveChat \
  -H "Content-Type: application/json" \
  -d '{
    "userMessage": "Hello, how much does it cost?",
    "botResponse": "Our pricing starts at €99/month for the BASIC plan.",
    "website": "ragnetiq.com"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Chat saved successfully",
  "data": [...]
}
```

### Check your browser console:

When users interact with the chatbot, you should see:
```
✅ Chat saved successfully to database
```

---

## 📊 Query Your Data

### View all chats:
```sql
SELECT * FROM chats ORDER BY created_at DESC LIMIT 100;
```

### Get chats by website:
```sql
SELECT * FROM chats 
WHERE website = 'ragnetiq.com' 
ORDER BY created_at DESC;
```

### Count conversations by website:
```sql
SELECT website, COUNT(*) as chat_count 
FROM chats 
GROUP BY website 
ORDER BY chat_count DESC;
```

### Get recent conversations:
```sql
SELECT 
  user_message,
  bot_response,
  website,
  created_at
FROM chats 
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

---

## 🛡️ Error Handling

The implementation includes graceful error handling:

- ✅ **Validates** required fields (userMessage, botResponse)
- ✅ **Logs errors** to console without breaking user experience
- ✅ **Continues** chatbot functionality even if saving fails
- ✅ **Returns** appropriate HTTP status codes
- ✅ **Captures** website hostname automatically

### Common Issues:

**Issue:** "Supabase credentials not configured"
- **Solution:** Make sure `SUPABASE_URL` and `SUPABASE_KEY` are set in Vercel environment variables

**Issue:** "Database error: relation 'chats' does not exist"
- **Solution:** Run the SQL schema from Step 1 in your Supabase SQL editor

**Issue:** Chat not saving but no errors
- **Solution:** Check Vercel function logs and Supabase Row Level Security policies

---

## 🎯 API Endpoint Specification

### POST /api/saveChat

**Request:**
```json
{
  "userMessage": "string (required)",
  "botResponse": "string (required)",
  "website": "string (optional, defaults to 'unknown')"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Chat saved successfully",
  "data": [{
    "id": "uuid",
    "user_message": "...",
    "bot_response": "...",
    "website": "...",
    "created_at": "timestamp"
  }]
}
```

**Error Response (400):**
```json
{
  "error": "Bad request",
  "message": "userMessage and botResponse are required"
}
```

**Error Response (500):**
```json
{
  "error": "Database error",
  "message": "Error details..."
}
```

---

## 📝 Complete Widget Embedding Code

To embed the chatbot with auto-save on any website:

```html
<!-- Paste this before closing </body> tag -->
<script src="https://ragnetiq-bot.vercel.app/chatbot-widget-with-autosave.js"></script>
```

Or use the inline version from `chatbot-widget-with-autosave.js`

---

## 🔐 Security Considerations

1. **Environment Variables:** Never expose your Supabase keys in client-side code
2. **CORS:** The API endpoint accepts requests from any origin (configured in Vercel)
3. **Rate Limiting:** Consider adding rate limiting to prevent abuse
4. **Data Privacy:** Ensure compliance with GDPR/privacy laws when storing conversations
5. **Row Level Security:** Configure appropriate RLS policies in Supabase

---

## 📈 Next Steps

- ✅ Set up Supabase table
- ✅ Configure environment variables
- ✅ Deploy to Vercel
- 🔄 Monitor chat logs in Supabase dashboard
- 📊 Create analytics dashboard (optional)
- 🔔 Set up notifications for new chats (optional)

---

## 💡 Support

If you encounter any issues:

1. Check Vercel function logs: `vercel logs`
2. Check browser console for error messages
3. Verify Supabase table structure
4. Ensure environment variables are set correctly

---

**Last Updated:** October 25, 2025
**Version:** 1.0.0
