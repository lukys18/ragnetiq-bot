export default async function handler(req, res) {
  const API_KEY = process.env.API_KEY;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages, useRAG = false, ragContext = '', sources = [] } = req.body;

  try {
    let enhancedMessages = [...messages];
    
    // Ak je povolený RAG, vlož relevantný kontext ako samostatnú system správu
    // pred poslednou používateľskou správou (robustné - nájde poslednú user správu).
    if (useRAG && ragContext) {
      let lastUserIndex = -1;
      for (let i = enhancedMessages.length - 1; i >= 0; i--) {
        if (enhancedMessages[i] && enhancedMessages[i].role === 'user') {
          lastUserIndex = i;
          break;
        }
      }

      if (lastUserIndex !== -1) {
        enhancedMessages.splice(lastUserIndex, 0, {
          role: 'system',
          content: `Relevantný kontext z databázy:\n${ragContext}\n\nPoužite tento kontext na zodpovedanie nadchádzajúcej otázky používateľa.`
        });
        console.log(`RAG kontext vložený pred správu na indexe ${lastUserIndex}. Zdroje:`, sources);
      }
    }

    console.log(`Posielam ${enhancedMessages.length} správ do API (vrátane ${useRAG ? 'RAG kontextu' : 'bez RAG'})`);

    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: enhancedMessages,
        temperature: 0.4,
        max_tokens: 500,
        stream: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API responded with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    res.status(200).json(data);
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ 
      error: "Internal Server Error",
      details: error.message 
    });
  }
}
