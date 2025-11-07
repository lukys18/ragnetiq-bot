// rag-system.js
// RAG (Retrieval-Augmented Generation) systém pre AI chatbot

class RAGSystem {
  constructor(knowledgeBase) {
    this.knowledgeBase = knowledgeBase;
    this.stopWords = new Set([
      'a', 'je', 'to', 'na', 'v', 'sa', 'so', 'pre', 'ako', 'že', 'ma', 'mi', 'me', 'si', 'su', 'som',
      'ale', 'ani', 'az', 'ak', 'bo', 'by', 'co', 'ci', 'do', 'ho', 'im', 'ju', 'ka', 'ku', 'ly',
      'ne', 'ni', 'no', 'od', 'po', 'pri', 'ro', 'ta', 'te', 'ti', 'tu', 'ty', 'uz', 'vo', 'za'
    ]);
    
    // Synonymá pre lepšie vyhľadávanie
    this.synonyms = {
      'cena': ['cenny', 'ceny', 'kolko', 'stoji', 'price', 'peniaze', 'platba', 'cost', 'balik', 'baliky', 'cennik'],
      'basic': ['zakladny', 'jednoduchy', 'lacny', 'najlacnejsi', 'bežne', 'informacne', 'male projekty'],
      'pro': ['profesionalny', 'odporucany', 'odporucane', 'stredny', 'professional', 'pokrocile', 'male e-shopy'],
      'enterprise': ['velky', 'pokrocily', 'najlepsi', 'e-shop', 'e-commerce', 'eshop', 'vacsi', 'znacky'],
      'kontakt': ['spojenie', 'informacie', 'udaje', 'email', 'telefon', 'adresa', '904 603 171', '902 502 402'],
      'pomoc': ['podpora', 'help', 'support', 'asistencia', 'pomoc'],
      'chatbot': ['bot', 'asistent', 'ai', 'robot', 'rag'],
      'stretnutie': ['konzultacia', 'meeting', 'hovor', 'rozhovor', 'call', 'calendly'],
      'rychly': ['okamzite', 'ihned', 'fast', 'quick', 'bezodkladne'],
      'web': ['stranka', 'website', 'webova', 'online'],
      'firma': ['spolocnost', 'company', 'business', 'podnik', 'ragnetiq'],
      'vytvoriť': ['urobit', 'navrhnout', 'postavit', 'implementovat', 'vytvorit'],
      'zakaznik': ['klient', 'customer', 'uzivatel', 'navstevnik'],
      'tim': ['team', 'ludia', 'zakladatelia', 'marcel', 'lukas', 'bako', 'lehocky', 'ceo', 'developer'],
      'bezpecnost': ['gdpr', 'ochrana', 'sukromie', 'sifrovanie', 'rls', 'security', 'privacy'],
      'vodoznak': ['branding', 'brand', 'logo', 'watermark', 'bez vodoznaku'],
      'dashboard': ['admin', 'statistiky', 'metriky', 'reporting', 'analytics', 'prehľad', 'vykon', 'data']
    };
  }

  // Hlavná metóda pre vyhľadávanie relevantného obsahu
  searchRelevantContent(query, maxResults = 3) {
    const normalizedQuery = this.normalizeText(query);
    const queryWords = this.extractKeywords(normalizedQuery);
    const bigrams = this.extractBigrams(normalizedQuery);
    const expandedWords = this.expandWithSynonyms(queryWords);
    
    if (queryWords.length === 0 && bigrams.length === 0) {
      return [];
    }

    const results = this.knowledgeBase.map(item => {
      const score = this.calculateRelevanceScore(item, expandedWords, normalizedQuery, bigrams);
      return { ...item, relevanceScore: score };
    })
    .filter(item => item.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, maxResults);

    console.log('RAG Search Results:', results.map(r => ({ title: r.title, score: r.relevanceScore })));
    return results;
  }

  // Výpočet skóre relevancie (vylepšený)
  calculateRelevanceScore(item, queryWords, fullQuery, bigrams = []) {
    let score = 0;
    const normalizedTitle = this.normalizeText(item.title);
    const normalizedContent = this.normalizeText(item.content);
    const normalizedKeywords = item.keywords.map(k => this.normalizeText(k));
    
    // 1. Scoring pre jednotlivé slová
    queryWords.forEach(word => {
      // Kľúčové slová (najvyššia priorita)
      const keywordMatch = normalizedKeywords.some(keyword => 
        keyword.includes(word) || word.includes(keyword) || this.isSimilar(word, keyword)
      );
      if (keywordMatch) {
        score += 6; // Zvýšené z 5 na 6
      }
      
      // Názov
      if (normalizedTitle.includes(word)) {
        score += 4;
      }
      
      // Obsah (s TF-IDF boost pre zriedkavé slová)
      if (normalizedContent.includes(word)) {
        const frequency = (normalizedContent.match(new RegExp(word, 'g')) || []).length;
        score += Math.min(frequency * 1.5, 4); // Max 4 body za slovo
      }
    });

    // 2. Scoring pre bigramy (2-slovné frázy)
    bigrams.forEach(bigram => {
      if (normalizedContent.includes(bigram) || normalizedTitle.includes(bigram)) {
        score += 5; // Vysoké skóre pre presné frázy
      }
      normalizedKeywords.forEach(keyword => {
        if (keyword.includes(bigram)) {
          score += 6;
        }
      });
    });

    // 3. Bonus za presný match celej frázy
    if (normalizedContent.includes(fullQuery) || normalizedTitle.includes(fullQuery)) {
      score += 8; // Zvýšené z 3 na 8
    }

    // 4. Bonus za kategóriu matching
    if (this.getCategoryFromQuery(fullQuery) === item.category) {
      score += 3; // Zvýšené z 2 na 3
    }

    // 5. Bonus za čísla a ceny (€69, €79, 24/7, atď)
    const numbers = fullQuery.match(/\d+/g);
    if (numbers) {
      numbers.forEach(num => {
        if (normalizedContent.includes(num)) {
          score += 3;
        }
      });
    }

    return score;
  }

  // Extrakcia kľúčových slov z dotazu
  extractKeywords(normalizedText) {
    return normalizedText
      .split(/\s+/)
      .filter(word => 
        word.length > 2 && 
        !this.stopWords.has(word)
        // Zachovať čísla (môžu byť dôležité pre ceny)
      )
      .slice(0, 15); // Zvýšené z 10 na 15
  }

  // Extrakcia bigramov (2-slovné frázy)
  extractBigrams(normalizedText) {
    const words = normalizedText.split(/\s+/).filter(w => w.length > 0);
    const bigrams = [];
    
    for (let i = 0; i < words.length - 1; i++) {
      const bigram = `${words[i]} ${words[i + 1]}`;
      // Preskočiť bigramy so stop words
      if (!this.stopWords.has(words[i]) || !this.stopWords.has(words[i + 1])) {
        bigrams.push(bigram);
      }
    }
    
    return bigrams;
  }

  // Rozšírenie slov o synonymá
  expandWithSynonyms(words) {
    const expanded = new Set(words);
    
    words.forEach(word => {
      // Nájdi synonymá pre toto slovo
      for (const [key, synonymList] of Object.entries(this.synonyms)) {
        if (key === word || synonymList.includes(word)) {
          // Pridaj kľúčové slovo
          expanded.add(key);
          // Pridaj všetky synonymá
          synonymList.forEach(syn => expanded.add(syn));
        }
      }
    });
    
    return Array.from(expanded);
  }

  // Kontrola podobnosti slov (fuzzy matching)
  isSimilar(word1, word2) {
    // Levenshtein distance pre jednoduché preklepy
    if (word1 === word2) return true;
    if (Math.abs(word1.length - word2.length) > 2) return false;
    
    // Skontroluj či jedno slovo obsahuje druhé
    if (word1.includes(word2) || word2.includes(word1)) return true;
    
    // Jednoduchý Levenshtein (max 1-2 zmeny)
    let changes = 0;
    const maxLen = Math.max(word1.length, word2.length);
    
    for (let i = 0; i < maxLen; i++) {
      if (word1[i] !== word2[i]) changes++;
      if (changes > 2) return false;
    }
    
    return changes <= 2;
  }

  // Normalizácia textu
  normalizeText(text) {
    return text.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Odstránenie diakritiky
      .replace(/[^\w\sáäčďéíĺľňóôŕšťúýž]/g, ' ') // Zachovanie slovenských znakov
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Detekcia kategórie z dotazu
  getCategoryFromQuery(query) {
    const categoryKeywords = {
      'pricing': ['cena', 'kolko', 'stoji', 'price', 'balik', 'mesacne', 'basic', 'pro', 'enterprise', '49', '99', 'cennik', 'baliky', 'vodoznak'],
      'benefits': ['vyhody', 'preco', 'dovody', 'benefits', 'uzitocny', '45%', '70%', '90%'],
      'process': ['proces', 'ako', 'postup', 'kroky', 'implementacia'],
      'technical': ['integracia', 'technicke', 'crm', 'google sheets', 'api', 'erp', 'feed', 'dashboard', 'admin', 'statistiky', 'metriky', 'reporting', 'analytics'],
      'support': ['podpora', 'pomoc', 'udrzba', 'problem'],
      'customization': ['na mieru', 'prisposobenie', 'vlastny', 'dizajn'],
      'booking': ['rezervacia', 'stretnutie', 'konzultacia', 'calendly'],
      'contact': ['adresa', 'lokacia', 'kde', 'kontakt', 'telefon', 'email', 'nachadza', 'sidli', '904', '902'],
      'company': ['o nas', 'tim', 'team', 'marcel', 'lukas', 'bako', 'lehocky', 'zakladatelia', 'kto sme', 'ragnetiq'],
      'legal': ['gdpr', 'ochrana', 'sukromie', 'bezpecnost', 'rls', 'sifrovanie', 'osobne udaje']
    };

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => query.includes(keyword))) {
        return category;
      }
    }
    return null;
  }

  // Vytvorenie kontextu pre AI model
  buildContext(relevantContent) {
    if (relevantContent.length === 0) {
      return '';
    }
    
    const context = relevantContent
      .map((item, index) => `**${index + 1}. ${item.title}** (relevancia: ${item.relevanceScore}):\n${item.content}`)
      .join('\n\n');
    
    // Kontrola či je relevant booking/consultation kontext
    const isBookingRelated = relevantContent.some(item => 
      item.category === 'booking' || 
      item.keywords.some(kw => ['rezervácia', 'stretnutie', 'konzultácia', 'calendly', 'meeting'].includes(kw.toLowerCase()))
    );
    
    const bookingInstruction = isBookingRelated 
      ? ' DÔLEŽITÉ: Calendly linky formátuj ako klikateľné hyperlinky: <a href="https://calendly.com/ragnetiq/15-min" target="_blank">Rezervovať konzultáciu</a>.'
      : '';
    
    return `PRESNÉ INFORMÁCIE O RAGNETIQ (používaj LEN tieto fakty):\n\n${context}\n\nINŠTRUKCIE: Odpovedaj presne podľa týchto informácií. NEPRÍDÁVAJ žiadne vlastné detaily.${bookingInstruction} PRESNÉ CENY: BASIC €49/mesiac, PRO €99/mesiac (odporúčané), ENTERPRISE podľa dohody - NIKDY iné sumy!`;
  }

  // Získanie kontextu pre špecifickú kategóriu
  getContextByCategory(category) {
    const categoryItems = this.knowledgeBase.filter(item => item.category === category);
    return this.buildContext(categoryItems);
  }

  // Vyhľadávanie podľa ID
  getById(id) {
    return this.knowledgeBase.find(item => item.id === id);
  }

  // Získanie všetkých kategórií
  getCategories() {
    return [...new Set(this.knowledgeBase.map(item => item.category))];
  }

  // Debug metóda pre testovanie (vylepšená)
  debugSearch(query) {
    console.log('=== RAG DEBUG (Enhanced) ===');
    console.log('Query:', query);
    const normalized = this.normalizeText(query);
    console.log('Normalized:', normalized);
    const keywords = this.extractKeywords(normalized);
    console.log('Keywords:', keywords);
    console.log('Bigrams:', this.extractBigrams(normalized));
    console.log('Expanded (with synonyms):', this.expandWithSynonyms(keywords));
    console.log('Category:', this.getCategoryFromQuery(normalized));
    
    const results = this.searchRelevantContent(query, 5);
    console.log('Results:', results.map(r => ({ 
      title: r.title, 
      score: r.relevanceScore,
      category: r.category 
    })));
    console.log('Context:', this.buildContext(results.slice(0, 2)));
    console.log('============================');
    
    return results;
  }
}

// Export pre použitie v iných súboroch
if (typeof window !== 'undefined') {
  window.RAGSystem = RAGSystem;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = RAGSystem;
}

