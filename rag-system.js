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
  }

  // Hlavná metóda pre vyhľadávanie relevantného obsahu
  searchRelevantContent(query, maxResults = 3) {
    const normalizedQuery = this.normalizeText(query);
    const queryWords = this.extractKeywords(normalizedQuery);
    
    if (queryWords.length === 0) {
      return [];
    }

    const results = this.knowledgeBase.map(item => {
      const score = this.calculateRelevanceScore(item, queryWords, normalizedQuery);
      return { ...item, relevanceScore: score };
    })
    .filter(item => item.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, maxResults);

    console.log('RAG Search Results:', results.map(r => ({ title: r.title, score: r.relevanceScore })));
    return results;
  }

  // Výpočet skóre relevancie
  calculateRelevanceScore(item, queryWords, fullQuery) {
    let score = 0;
    const normalizedTitle = this.normalizeText(item.title);
    const normalizedContent = this.normalizeText(item.content);
    
    queryWords.forEach(word => {
      // Skóre pre kľúčové slová (najvyššia priorita)
      if (item.keywords.some(keyword => 
        this.normalizeText(keyword).includes(word) || word.includes(this.normalizeText(keyword))
      )) {
        score += 5;
      }
      
      // Skóre pre výskyt v názve
      if (normalizedTitle.includes(word)) {
        score += 4;
      }
      
      // Skóre pre výskyt v obsahu
      if (normalizedContent.includes(word)) {
        score += 2;
      }
      
      // Bonus za presný match celej frázy
      if (normalizedContent.includes(fullQuery) || normalizedTitle.includes(fullQuery)) {
        score += 3;
      }
    });

    // Bonus za kategóriu matching
    if (this.getCategoryFromQuery(fullQuery) === item.category) {
      score += 2;
    }

    return score;
  }

  // Extrakcia kľúčových slov z dotazu
  extractKeywords(normalizedText) {
    return normalizedText
      .split(/\s+/)
      .filter(word => 
        word.length > 2 && 
        !this.stopWords.has(word) &&
        !/^\d+$/.test(word)
      )
      .slice(0, 10); // Obmedzenie na 10 najdôležitejších slov
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
      'pricing': ['cena', 'kolko', 'stoji', 'price', 'balik', 'mesacne'],
      'benefits': ['vyhody', 'preco', 'dovody', 'benefits', 'uzitocny'],
      'process': ['proces', 'ako', 'postup', 'kroky', 'implementacia'],
      'technical': ['integracia', 'technicke', 'crm', 'google sheets'],
      'support': ['podpora', 'pomoc', 'udrzba', 'problem'],
      'customization': ['na mieru', 'prisposobenie', 'vlastny', 'dizajn'],
      'booking': ['rezervacia', 'stretnutie', 'konzultacia', 'calendly'],
      'contact': ['adresa', 'lokacia', 'kde', 'kontakt', 'telefon', 'email', 'nachadza', 'sidli']
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
      .map(item => `**${item.title}:**\n${item.content}`)
      .join('\n\n');
    
    // Kontrola či je relevant booking/consultation kontext
    const isBookingRelated = relevantContent.some(item => 
      item.category === 'booking' || 
      item.keywords.some(kw => ['rezervácia', 'stretnutie', 'konzultácia', 'calendly', 'meeting'].includes(kw.toLowerCase()))
    );
    
    const bookingInstruction = isBookingRelated 
      ? ' DÔLEŽITÉ: Calendly link formátuj ako klikateľný hyperlink: <a href="https://calendly.com/aipoweragency/new-meeting?month=2025-08" target="_blank">Rezervovať konzultáciu</a>.'
      : '';
    
    return `PRESNÉ INFORMÁCIE O AI POWER (používaj LEN tieto fakty):\n\n${context}\n\nINŠTRUKCIE: Odpovedaj presne podľa týchto informácií. NEPRÍDÁVAJ žiadne vlastné detaily.${bookingInstruction} PRESNÉ CENY: ROČNÉ €69/mesiac (ušetríte 20%) alebo MESAČNÉ €79/mesiac - NIKDY iné sumy!`;
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

  // Debug metóda pre testovanie
  debugSearch(query) {
    console.log('=== RAG DEBUG ===');
    console.log('Query:', query);
    console.log('Normalized:', this.normalizeText(query));
    console.log('Keywords:', this.extractKeywords(this.normalizeText(query)));
    console.log('Category:', this.getCategoryFromQuery(this.normalizeText(query)));
    
    const results = this.searchRelevantContent(query, 5);
    console.log('Results:', results);
    console.log('Context:', this.buildContext(results.slice(0, 2)));
    console.log('=================');
    
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

