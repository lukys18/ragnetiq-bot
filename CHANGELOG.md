# 📋 CHANGELOG - Ragnetiq Chatbot

## ✅ Najnovšie úpravy (26.10.2025)

### 🆔 **Session ID - Nová relácia pri každom načítaní**
- Session ID sa **vždy** generuje nanovo pri obnovení stránky/browsera
- Odstránené ukladanie do `sessionStorage`
- Každá návšteva = nová session

### 🏷️ **Kategorizácia cez RAG systém**
- Kategória sa **primárne** určuje z najvyššie hodnoteného RAG výsledku
- Analyzuje sa `title` z top RAG result
- **Fallback:** Ak RAG nenájde nič → klasická keyword analýza
- Presnejšie kategorizovanie otázok

**Podporované kategórie:**
- `ceny` - otázky o cenách, balíkoch
- `kontakt` - žiadosti o kontakt, stretnutia
- `produkty` - otázky o funkciách chatbotu
- `proces` - proces implementácie, kroky
- `podpora` - technická podpora, problémy
- `všeobecné` - ostatné

### 📧 **Email Form Tracking**
- Automatické zaznamenávanie že bol odoslaný kontaktný formulár v session
- Pridaný stĺpec v databáze:
  - `email_submitted` (BOOLEAN) - TRUE ak bol v session odoslaný email cez EmailJS
- Jednoduchý flag na tracking konverzií (chat → email)
- Ak používateľ odošle formulár, všetky ďalšie správy v session majú `email_submitted = TRUE`

---

## 📊 Aktuálna štruktúra dát v Supabase

```javascript
// Bežná chat správa (PRED odoslaním emailu)
{
  user_message: "Koľko to stojí?",
  bot_response: "Naše ceny začínajú od €99/mesiac...",
  website: "ragnetiq.com",
  user_ip: "185.xxx.xxx.xxx",
  session_id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
  message_index: 1,
  time_to_respond: 1250,
  category: "ceny",  // ← z RAG analýzy
  geo_location_city: "Bratislava",
  email_submitted: false  // ← ešte nebol odoslaný email
}

// Chat správa (PO odoslaní emailu v session)
{
  user_message: "Ďakujem",
  bot_response: "Rád som pomohol!",
  website: "ragnetiq.com",
  user_ip: "185.xxx.xxx.xxx",
  session_id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",  // ← ten istý session
  message_index: 5,
  time_to_respond: 890,
  category: "všeobecné",
  geo_location_city: "Bratislava",
  email_submitted: true  // ← email bol odoslaný v tejto session
}
```

---

## 🚀 Inštalácia aktualizácií

### 1. Aktualizuj Supabase tabuľku
```sql
-- Spusti v Supabase SQL Editor
ALTER TABLE chat_logs 
ADD COLUMN IF NOT EXISTS email_submitted BOOLEAN DEFAULT FALSE;
```

### 2. Nasaď aktualizovaný kód
```bash
git add .
git commit -m "feat: RAG-based categorization, new session per reload, email tracking"
git push
```

### 3. Vercel automaticky redeployuje
- Environment variables zostávajú rovnaké
- Žiadne ďalšie nastavenia nie sú potrebné

---

## 📈 Výhody nových funkcií

### Session ID reset
✅ Jasné oddelenie jednotlivých návštev  
✅ Lepšia analytika conversion rate  
✅ Identifikácia returning vs new visitors  

### RAG kategorizácia
✅ Presnejšie určenie kategórie otázky  
✅ Lepšie štatistiky o type of queries  
✅ Automatická klasifikácia bez manuálnych pravidiel  

### Email tracking
✅ Vidíš ktoré sessions viedli k odoslaniu emailu  
✅ Jednoduchý boolean flag bez zbytočných detailov  
✅ Conversion rate: chats → email submissions  
✅ Všetky správy v session majú rovnaký flag po odoslaní emailu  

---

## 🔍 Užitočné dopyty

### Sessions s odoslaným emailom
```sql
SELECT DISTINCT session_id, website, created_at 
FROM chat_logs 
WHERE email_submitted = TRUE 
ORDER BY created_at DESC;
```

### Conversion rate (chat → email)
```sql
SELECT 
  COUNT(DISTINCT session_id) as total_sessions,
  COUNT(DISTINCT CASE WHEN email_submitted THEN session_id END) as conversions,
  ROUND(
    100.0 * COUNT(DISTINCT CASE WHEN email_submitted THEN session_id END) / 
    COUNT(DISTINCT session_id), 
    2
  ) as conversion_rate_percent
FROM chat_logs
WHERE created_at >= NOW() - INTERVAL '30 days';
```

### Najčastejšie kategórie otázok
```sql
SELECT 
  category, 
  COUNT(*) as count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as percentage
FROM chat_logs 
WHERE category IS NOT NULL
AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY category
ORDER BY count DESC;
```

---

## ✅ Testovanie

1. Obnoviť stránku chatbotu → nové session ID v konzole
2. Napísať otázku o cenách → kategória by mala byť "ceny" (z RAG)
3. Vyplniť kontaktný formulár → v databáze by mal byť záznam s `email_submitted = TRUE`
4. Skontrolovať Supabase tabuľku → všetky dáta by mali byť uložené

---

**Všetko funguje? Happy coding! 🚀**
