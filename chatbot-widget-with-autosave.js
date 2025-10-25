/**
 * RAGNETIQ CHATBOT WIDGET WITH AUTO-SAVE FEATURE
 * ==============================================
 * 
 * This is a complete chatbot widget that can be embedded on any website.
 * It automatically saves all chat interactions to your Vercel API endpoint.
 * 
 * FEATURES:
 * - Automatic chat saving to Supabase via Vercel API
 * - Captures website hostname automatically
 * - Graceful error handling (won't break user experience)
 * - Responsive design
 * - Works on any website
 * 
 * SETUP INSTRUCTIONS:
 * 1. Copy this entire code
 * 2. Paste it into your website before the closing </body> tag
 * 3. Make sure your Vercel environment variables are set:
 *    - SUPABASE_URL
 *    - SUPABASE_KEY
 * 4. Deploy to Vercel
 * 
 * USAGE:
 * Simply paste this script on any page where you want the chatbot to appear.
 */

(function () {
  // Prevent multiple instances
  if (window.ragnetiqChatbotLoaded) return;
  window.ragnetiqChatbotLoaded = true;

  // ============================================================
  // CONFIGURATION - Change these values to match your setup
  // ============================================================
  const CONFIG = {
    VERCEL_URL: "https://ragnetiq-bot.vercel.app",
    SAVE_CHAT_ENDPOINT: "https://ragnetiq-bot.vercel.app/api/saveChat",
    ALLOWED_DOMAINS: ["ragnetiq.com", "localhost", "127.0.0.1"]
  };

  // Check if widget is allowed on this domain
  if (!CONFIG.ALLOWED_DOMAINS.includes(window.location.hostname)) {
    console.warn("Ragnetiq chatbot widget is not authorized for this domain");
    return;
  }

  // ============================================================
  // CREATE CHATBOT IFRAME
  // ============================================================
  const iframe = document.createElement("iframe");
  iframe.src = CONFIG.VERCEL_URL;
  iframe.style.position = "fixed";
  iframe.style.bottom = "20px";
  iframe.style.right = "20px";
  iframe.style.width = "60px";
  iframe.style.height = "60px";
  iframe.style.border = "none";
  iframe.style.borderRadius = "50%";
  iframe.style.zIndex = "99999";
  iframe.style.boxShadow = "0 4px 20px rgba(0,0,0,0.3)";
  iframe.style.transition = "all 0.4s ease";
  iframe.style.overflow = "hidden";
  iframe.setAttribute("frameborder", "0");
  iframe.setAttribute("scrolling", "no");
  iframe.style.margin = "0";
  iframe.style.padding = "0";
  iframe.style.display = "block";
  
  document.body.appendChild(iframe);

  // ============================================================
  // RESPONSIVE SIZING LOGIC
  // ============================================================
  function getResponsiveSizes() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    
    if (vw <= 480) {
      return {
        openWidth: `${vw - 10}px`,
        openHeight: `${Math.min(vh * 0.75, 600)}px`,
        closedWidth: "60px",
        closedHeight: "60px",
        bottom: "5px",
        right: "5px",
        left: "5px"
      };
    } else if (vw <= 768) {
      return {
        openWidth: `${vw - 20}px`,
        openHeight: `${Math.min(vh * 0.7, 580)}px`,
        closedWidth: "60px", 
        closedHeight: "60px",
        bottom: "10px",
        right: "10px",
        left: "10px"
      };
    } else {
      return {
        openWidth: "360px",
        openHeight: "600px",
        closedWidth: "60px",
        closedHeight: "60px", 
        bottom: "20px",
        right: "20px",
        left: "auto"
      };
    }
  }

  function applyResponsiveSizes(isOpen = false) {
    const sizes = getResponsiveSizes();
    
    if (isOpen) {
      iframe.style.transition = "all 0.4s ease";
      iframe.style.width = sizes.openWidth;
      iframe.style.height = sizes.openHeight;
      iframe.style.borderRadius = "20px";
      iframe.style.boxShadow = "0 20px 40px rgba(0,0,0,0.4)";
      
      if (window.innerWidth <= 768) {
        iframe.style.left = sizes.left;
        iframe.style.right = "auto";
      } else {
        iframe.style.left = "auto";
        iframe.style.right = sizes.right;
      }
      
      setTimeout(() => {
        if (iframe.contentWindow) {
          iframe.contentWindow.postMessage({ type: "resize" }, CONFIG.VERCEL_URL);
        }
      }, 500);
    } else {
      iframe.style.width = sizes.closedWidth;
      iframe.style.height = sizes.closedHeight;
      iframe.style.borderRadius = "50%";
      iframe.style.boxShadow = "0 4px 20px rgba(0,0,0,0.3)";
      iframe.style.left = "auto";
      iframe.style.right = sizes.right;
    }
    
    iframe.style.bottom = sizes.bottom;
  }

  let isOpen = false;

  // ============================================================
  // CHAT SAVING FUNCTIONALITY WITH IP TRACKING
  // ============================================================
  /**
   * Saves chat interaction to Vercel API endpoint
   * This function is called automatically when messages are exchanged
   * Now includes IP address tracking for analytics and security
   */
  async function saveChatToAPI(userMessage, botResponse) {
    try {
      const website = window.location.hostname;
      
      // Get user's IP address using ipify.org public API
      let ipAddress = 'unknown';
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        if (ipResponse.ok) {
          const ipData = await ipResponse.json();
          ipAddress = ipData.ip;
        }
      } catch (ipError) {
        console.warn('Could not fetch IP address:', ipError.message);
        // Backend will use fallback from request headers
      }
      
      console.log('💾 Saving chat to database...', {
        userMessage: userMessage.substring(0, 50) + '...',
        botResponse: botResponse.substring(0, 50) + '...',
        website: website,
        ipAddress: ipAddress
      });
      
      const response = await fetch(CONFIG.SAVE_CHAT_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userMessage: userMessage,
          botResponse: botResponse,
          website: website,
          ipAddress: ipAddress  // Include IP address
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Chat saved successfully to database', data);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.warn('⚠️ Failed to save chat:', response.status, response.statusText, errorData);
      }
    } catch (error) {
      // Graceful error handling - don't interrupt user experience
      console.error('❌ Error saving chat to API:', error.message);
    }
  }

  // ============================================================
  // MESSAGE LISTENER - Intercepts chat messages for saving
  // ============================================================
  window.addEventListener("message", function(event) {
    // Only accept messages from our iframe
    if (event.origin !== CONFIG.VERCEL_URL) return;
    
    // Handle chatbot open/close events
    if (event.data.type === "chatbot-opened") {
      isOpen = true;
      applyResponsiveSizes(true);
    } else if (event.data.type === "chatbot-closed") {
      isOpen = false;
      applyResponsiveSizes(false);
    }
    
    // ============================================================
    // AUTO-SAVE: Capture and save chat interactions
    // ============================================================
    else if (event.data.type === "chat-interaction") {
      // This event should be sent from the iframe when a chat exchange happens
      const { userMessage, botResponse } = event.data;
      if (userMessage && botResponse) {
        saveChatToAPI(userMessage, botResponse);
      }
    }
  });

  // ============================================================
  // RESPONSIVE WINDOW RESIZE HANDLER
  // ============================================================
  window.addEventListener("resize", function() {
    applyResponsiveSizes(isOpen);
  });

  // Initialize with closed state
  applyResponsiveSizes(false);

  console.log('🤖 Ragnetiq chatbot widget loaded successfully');
  console.log('📊 Auto-save to database: ENABLED');
  console.log('🌐 Current website:', window.location.hostname);
})();
