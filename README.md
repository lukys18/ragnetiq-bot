# AI Power Chatbot s RAG systémom

## Popis
Inteligentný chatbot s implementovaným RAG (Retrieval-Augmented Generation) systémom pre lepšie odpovede založené na firemnej databáze znalostí.

## Implementované funkcie

### 1. RAG (Retrieval-Augmented Generation)
- **Sémantické vyhľadávanie** v databáze znalostí
- **Kontextové odpovede** na základe relevantných informácií
- **Skórovanie relevancie** pre presnejšie výsledky
- **Automatické pridávanie zdrojov** k odpovediam

### 2. Optimalizovaná databáza znalostí
Kompletne refaktorovaná štruktúra zameraná na RAG:

**Knowledge Base kategórie (19 záznamov):**
- `benefits` - Výhody AI chatbotov (štatistiky 24+h, 100+ leadov, 1k+ konverzií)
- `process` - Proces implementácie (3-5 dní, demo, meeting, integrácia)
- `pricing` - Cenové informácie (€69/mes ročne s 20% zľavou alebo €79/mes mesačne)
- `technical` - Technické integrácie (jednoduchý script, 5 min integrácia)
- `support` - Podpora a údržba
- `customization` - Možnosti prispôsobenia
- `booking` - Rezervácia konzultácií (30 min online, bezplatné)
- `company` - Informácie o firme a poslanie
- `contact` - Kontaktné údaje
- `services` - Prehľad služieb
- `advantages` - Konkurenčné výhody (slovenský trh, kultúra)
- `clients` - Cieľoví klienti
- `portfolio` - Úspešné implementácie (60% menej hovorov)
- `legal` - GDPR a ochrana údajov

**Základné firemné údaje:**
- Kontaktné informácie (telefón, email, web, Calendly)
- Pracovné hodiny
- Lokácia

### 3. Rozšírené funkcie
- **Quick replies** pre časté otázky
- **Normalizácia slovenského textu** (odstránenie diakritiky)
- **Fallback mechanizmy** pre chybové stavy
- **Debug režim** pre testovanie

## Súbory

```
├── index.html          # Hlavný chatbot widget
├── database.js         # Firemná databáza + knowledge base
├── rag-system.js       # RAG algoritmus a vyhľadávanie
├── api/chat.js         # API endpoint s RAG podporou
├── rag-test.html       # Test stránka pre RAG systém
└── chatbot-widget.js   # Widget pre vkladanie na weby
```

## Testovanie RAG systému

1. Otvor `rag-test.html` v prehliadači
2. Skontroluj konzolu pre debug informácie
3. Otestuj rôzne typy otázok:
   - "Koľko stojí chatbot?"
   - "Aké sú výhody AI chatbotov?"
   - "Ako prebieha implementácia?"

## Spustenie v development

```bash
# Lokálny development server
vercel dev

# Alebo jednoducho otvor index.html v prehliadači
```

## Ako RAG funguje

1. **Vstup**: Používateľ zadá otázku
2. **Quick replies**: Kontrola rýchlych odpovedí
3. **RAG search**: Vyhľadávanie v knowledge base
4. **Skórovanie**: Výpočet relevancie každého záznamu
5. **Kontext**: Vytvorenie kontextu pre AI model
6. **API call**: Odoslanie dotazu s kontextom na AI
7. **Odpoveď**: Vrátenie odpovede so zdrojmi

## Štruktúra databázy

### Nová optimalizovaná štruktúra:
```javascript
window.aiPowerData = {
  // Základné firemné informácie
  company: {
    name: "AI Power",
    founded: 2025,
    founder: "Marcel Lehocky",
    location: "Bratislava, Slovensko",
    website: "https://www.aipower.site",
    email: "info@aipower.site", 
    phone: "+421 904 603 171",
    calendly: "https://calendly.com/..."
  },
  
  // Pracovné hodiny pre quick replies
  workingHours: { ... },
  
  // RAG Knowledge Base (13 záznamov)
  knowledgeBase: [ ... ]
}
```

### Pridanie nových informácií:
```javascript
{
  id: "unique-id",
  category: "category-name", 
  title: "Názov informácie",
  content: "Detailný obsah informácie...",
  keywords: ["kľúčové", "slová", "pre", "vyhľadávanie"]
}
```

### Výhody novej štruktúry:
- ✅ **Zjednodušená** - Iba potrebné údaje
- ✅ **RAG-optimalizovaná** - Lepšie vyhľadávanie
- ✅ **Škálovateľná** - Jednoduché pridávanie obsahu
- ✅ **Konzistentná** - Jednotná štruktúra pre všetky informácie

## API Environment variables

V `.env.local`:
```
API_KEY=your_together_ai_api_key
```

## Monitoring a Analytics

RAG systém loguje:
- Vyhľadávacie dotazy a výsledky
- Skóre relevancie
- Použité zdroje
- Performance metriky

Pozri konzolu prehliadača pre debug informácie.
