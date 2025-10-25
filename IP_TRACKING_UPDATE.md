# 🔄 AKTUALIZÁCIA - Zber IP Adries

## 📋 Čo sa zmenilo

Chatbot teraz zbiera aj **IP adresu** každého používateľa, ktorý píše správu.

---

## ✅ Vykonané zmeny

### 1. **Aktualizovaná databázová schéma**

Tabuľka sa teraz volá `chat_logs` (namiesto `chats`) a obsahuje aj IP adresu:

```sql
CREATE TABLE IF NOT EXISTS chat_logs (
  id BIGSERIAL PRIMARY KEY,
  user_message TEXT NOT NULL,
  bot_response TEXT NOT NULL,
  website VARCHAR(255),
  ip_address VARCHAR(45),  -- NOVÉ: IP adresa používateľa
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. **Upravený API endpoint** (`api/saveChat.js`)

- Teraz prijíma pole `ipAddress` v requeste
- Automaticky deteguje IP adresu z request headers ako fallback
- Ukladá IP do Supabase tabuľky `chat_logs`

### 3. **Upravený frontend** (`index.html`)

Funkcia `saveChatToAPI()` teraz:
- Získava IP adresu používateľa cez verejné API (ipify.org)
- Posiela IP adresu spolu s ostatnými údajmi na Vercel API
- Funguje aj keď sa IP nepodarí získať (použije 'unknown')

---

## 🚀 Ako to funguje

### Tok dát:

```
1. Používateľ napíše správu
   ↓
2. Bot odpovedá
   ↓
3. Frontend získa IP adresu (ipify.org API)
   ↓
4. Pošle data na Vercel API:
   - userMessage
   - botResponse
   - website (hostname)
   - ipAddress ← NOVÉ
   ↓
5. Vercel API uloží do Supabase table 'chat_logs'
```

### Získanie IP adresy - Dvojitá stratégia:

**Frontend pokus:**
```javascript
// Pokúsi sa získať IP z verejného API
const ipResponse = await fetch('https://api.ipify.org?format=json');
const ipData = await ipResponse.json();
ipAddress = ipData.ip; // napr. "192.168.1.1"
```

**Backend fallback:**
```javascript
// Ak frontend nepošle IP, API ju vezme z headers
const userIp = ipAddress || 
               req.headers['x-forwarded-for'] ||
               req.headers['x-real-ip'] ||
               'unknown';
```

---

## 📊 Nová databázová schéma

### Spustite v Supabase SQL Editor:

```sql
CREATE TABLE IF NOT EXISTS chat_logs (
  id BIGSERIAL PRIMARY KEY,
  user_message TEXT NOT NULL,
  bot_response TEXT NOT NULL,
  website VARCHAR(255),
  user_ip VARCHAR(45),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_chat_logs_created_at ON chat_logs(created_at DESC);
CREATE INDEX idx_chat_logs_website ON chat_logs(website);
CREATE INDEX idx_chat_logs_user_ip ON chat_logs(user_ip);
```

---

## 🔍 Užitočné SQL queries

### Zobraziť všetky chaty s IP adresami:
```sql
SELECT 
  user_message, 
  bot_response, 
  website, 
  ip_address,
  created_at 
FROM chat_logs 
ORDER BY created_at DESC 
LIMIT 50;
```

### Počet správ od konkrétnej IP:
```sql
SELECT 
  user_ip,
  COUNT(*) as message_count
FROM chat_logs
WHERE user_ip = '123.456.789.0'
GROUP BY user_ip;
```

### Top 10 najaktívnejších IP adries:
```sql
SELECT 
  user_ip,
  COUNT(*) as message_count,
  MIN(created_at) as first_seen,
  MAX(created_at) as last_seen
FROM chat_logs
GROUP BY user_ip
ORDER BY message_count DESC
LIMIT 10;
```

### Počet unikátnych návštevníkov:
```sql
SELECT COUNT(DISTINCT user_ip) as unique_visitors 
FROM chat_logs
WHERE user_ip != 'unknown';
```

### Aktivita podľa krajiny (ak používate IP geolokáciu):
```sql
-- Najprv potrebujete pridať stĺpec 'country'
-- ALTER TABLE chat_logs ADD COLUMN country VARCHAR(2);

SELECT 
  country,
  COUNT(*) as chat_count
FROM chat_logs
WHERE country IS NOT NULL
GROUP BY country
ORDER BY chat_count DESC;
```

---

## 🧪 Testovanie

### 1. Otvorte `test-autosave.html`

### 2. Upravte test, aby zahŕňal IP:

V browseri otvorte Console (F12) a spustite:

```javascript
fetch('https://ragnetiq-bot.vercel.app/api/saveChat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userMessage: "Test s IP adresou",
    botResponse: "Testovacia odpoveď",
    website: "localhost",
    ipAddress: "127.0.0.1"
  })
})
.then(res => res.json())
.then(data => console.log('✅ Výsledok:', data))
.catch(err => console.error('❌ Chyba:', err));
```

### 3. Skontrolujte Supabase

V Table Editor → `chat_logs` by ste mali vidieť:
- ✅ `user_message`
- ✅ `bot_response`
- ✅ `website`
- ✅ `ip_address` ← **NOVÉ**
- ✅ `created_at`

---

## 🔐 Ochrana súkromia

⚠️ **DÔLEŽITÉ:** Zbieranie IP adries podlieha GDPR a iným zákonom o ochrane súkromia.

### Odporúčania:

1. **Privacy Policy:** Informujte používateľov, že zbierajú IP adresy
2. **Právny základ:** Majte legitimný dôvod na zbieranie IP
3. **Anonymizácia:** Zvážte anonymizáciu IP po určitom čase
4. **Bezpečnosť:** Používajte RLS (Row Level Security) v Supabase

### Príklad anonymizácie IP po 30 dňoch:

```sql
-- Automaticky anonymizuje staré IP adresy
UPDATE chat_logs 
SET user_ip = 'anonymized'
WHERE created_at < NOW() - INTERVAL '30 days'
  AND user_ip != 'anonymized';
```

---

## 📝 Príklad uložených dát

```json
{
  "id": 1,
  "user_message": "Koľko to stojí?",
  "bot_response": "Naše ceny začínajú na €99/mesiac pre BASIC balík.",
  "website": "ragnetiq.com",
  "user_ip": "185.123.45.67",
  "created_at": "2025-10-25T14:30:00+00:00"
}
```

---

## 🛠️ Deployment

### 1. Vytvorte novú tabuľku v Supabase:
```bash
# Spustite SQL z UPDATED_DATABASE_SCHEMA.sql
```

### 2. Deploy na Vercel:
```bash
vercel --prod
```

### 3. Testujte:
```bash
# Otvorte stránku s chatbotom
# Napíšte správu
# Skontrolujte console: "✅ Chat saved successfully"
# Overte v Supabase že IP adresa je uložená
```

---

## 🎯 Výhody zberu IP adries

✅ **Anti-spam:** Identifikácia a blokovanie spam botov  
✅ **Analytika:** Sledovanie unikátnych návštevníkov  
✅ **Geolokácia:** Určenie krajiny pôvodu používateľa  
✅ **Rate limiting:** Obmedzenie počtu správ z jednej IP  
✅ **Bezpečnosť:** Detekcia podozrivej aktivity  
✅ **Personalizácia:** Možnosť prispôsobiť odpovede podľa regiónu  

---

## 📌 Zhrnutie zmien

| Súbor | Zmena |
|-------|-------|
| `api/saveChat.js` | ✅ Prijíma `ipAddress`, ukladá do `chat_logs` table |
| `index.html` | ✅ Získava IP cez ipify.org, posiela na API |
| `UPDATED_DATABASE_SCHEMA.sql` | ✅ Nový SQL schema s `ip_address` poľom |

---

**Posledná aktualizácia:** 25. október 2025  
**Status:** ✅ PRIPRAVENÉ NA DEPLOYMENT
