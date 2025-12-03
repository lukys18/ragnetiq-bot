(function () {
  if (window.marcelChatbotLoaded) return;
  window.marcelChatbotLoaded = true;

  // Vercel URL - ZMENIŤ LEN TU
  const VERCEL_URL = "https://ragnetiq-bot.vercel.app";

  // Povolene domény
  const allowed = ["ragnetiq.com", "localhost", "127.0.0.1", "test1-239283829347123859138772.myshopify.com"];
  if (!allowed.includes(window.location.hostname)) {
    console.warn("Tento widget nie je povolený na tejto doméne");
    return; // NEvytvára iframe
  }

  const iframe = document.createElement("iframe");
  iframe.src = VERCEL_URL;
  iframe.style.position = "fixed";
  iframe.style.bottom = "20px";
  iframe.style.right = "20px";
  iframe.style.width = "60px"; // Začína zatvorený
  iframe.style.height = "60px"; // Začína zatvorený
  iframe.style.border = "none";
  iframe.style.borderRadius = "50%"; // Kruhový tvar pre zatvorený stav
  iframe.style.zIndex = "99999";
  iframe.style.boxShadow = "0 4px 20px rgba(0,0,0,0.3)";
  iframe.style.transition = "all 0.4s ease";
  iframe.style.overflow = "hidden";
  
  // Kritické nastavenia pre konzistentný rendering
  iframe.setAttribute("frameborder", "0");
  iframe.setAttribute("scrolling", "no");
  iframe.style.margin = "0";
  iframe.style.padding = "0";
  iframe.style.display = "block";
  
  document.body.appendChild(iframe);

  // Responsive breakpoints
  function getResponsiveSizes() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    
    if (vw <= 480) {
      // Veľmi malé zariadenia
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
      // Mobilné zariadenia
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
      // Desktop - presné rozmery ako má chatbot
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

  // Aplikuje responzívne veľkosti
  function applyResponsiveSizes(isOpen = false) {
    const sizes = getResponsiveSizes();
    
    if (isOpen) {
      iframe.style.transition = "all 0.4s ease";
      iframe.style.width = sizes.openWidth;
      iframe.style.height = sizes.openHeight;
      iframe.style.borderRadius = "20px";
      iframe.style.boxShadow = "0 20px 40px rgba(0,0,0,0.4)";
      
      // Pre mobilné zariadenia nastaví left
      if (window.innerWidth <= 768) {
        iframe.style.left = sizes.left;
        iframe.style.right = "auto";
      } else {
        iframe.style.left = "auto";
        iframe.style.right = sizes.right;
      }
      
      // Pošle resize správu do iframe po animácii, aby sa layout správne prepočítal
      setTimeout(() => {
        if (iframe.contentWindow) {
          iframe.contentWindow.postMessage({ type: "resize" }, VERCEL_URL);
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

  // Počúva správy z iframe
  window.addEventListener("message", function(event) {
    if (event.origin !== VERCEL_URL) return;
    
    if (event.data.type === "chatbot-opened") {
      isOpen = true;
      applyResponsiveSizes(true);
    } else if (event.data.type === "chatbot-closed") {
      isOpen = false;
      applyResponsiveSizes(false);
    }
  });

  // Responzívne zmeny pri zmene veľkosti okna
  window.addEventListener("resize", function() {
    applyResponsiveSizes(isOpen);
  });

  // Nastaví počiatočné responzívne veľkosti
  applyResponsiveSizes(false);
})();
