import { useEffect } from "react";

function GlobalStyle() {
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;700;800&family=Playfair+Display:wght@700;800&display=swap');
      
      :root {
        --burgundy: #8B1E3F;
        --saffron: #f4a024;
        --gold: #d4a017;
        --cream: #fffaf3;
        --surface: #ffffff;
        --surface-strong: #f5e6d3;
        --surface-border: rgba(212,160,23,0.18);
        --charcoal: #2d1b0e;
        --muted: #7a5c3a;
        
        /* Compact Spacing System */
        --section-py: 48px;
        --section-py-mobile: 32px;
        --container-px: 24px;
        --container-px-mobile: 16px;
        --card-gap: 20px;
        --card-gap-mobile: 12px;
      }

      *, *::before, *::after { box-sizing: border-box; }
      
      html { 
        background: var(--cream); 
        scroll-behavior: smooth;
      }
      
      body { 
        margin: 0; 
        font-family: 'DM Sans', sans-serif; 
        background-color: var(--cream);
        color: var(--charcoal); 
        -webkit-font-smoothing: antialiased;
        overflow-x: hidden;
      }

      #root { min-height: 100vh; }
      
      .serif { font-family: 'Playfair Display', serif; }

      /* Standardized Section Titles — ALWAYS Left Aligned */
      .section-title {
        text-align: left !important;
        margin-bottom: 24px;
      }
      
      .section-title h2 {
        font-family: 'Playfair Display', serif;
        font-size: clamp(24px, 4vw, 36px);
        font-weight: 800;
        color: var(--charcoal);
        line-height: 1.2;
        position: relative;
        padding-bottom: 12px;
        margin: 0;
      }
      
      .section-title h2::after {
        content: '';
        position: absolute;
        left: 0;
        bottom: 0;
        width: 48px;
        height: 3px;
        background: var(--saffron);
        border-radius: 10px;
      }

      .section-title p {
        font-size: 14px;
        color: var(--muted);
        margin-top: 12px;
        font-weight: 500;
        max-width: 600px;
      }

      /* Compact Layout Containers */
      .responsive-grid {
        display: grid;
        gap: var(--card-gap);
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      }

      @media (max-width: 640px) {
        .responsive-grid {
          grid-template-columns: repeat(2, 1fr);
          gap: var(--card-gap-mobile);
        }
      }

      /* UI Polishing */
      .card-hover {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .card-hover:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 24px rgba(139, 30, 63, 0.08);
      }

      .btn-primary {
        background: var(--burgundy);
        color: white;
        border: none;
        cursor: pointer;
        font-family: 'DM Sans', sans-serif;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 1px;
        text-transform: uppercase;
        padding: 10px 20px;
        border-radius: 8px;
        transition: all 0.2s;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }
      .btn-primary:hover {
        background: #721835;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(139, 30, 63, 0.25);
      }
      .btn-primary:active { transform: translateY(0); }
      .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

      .btn-outline {
        background: transparent;
        border: 1.5px solid var(--burgundy);
        color: var(--burgundy);
        cursor: pointer;
        font-family: 'DM Sans', sans-serif;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 1px;
        text-transform: uppercase;
        padding: 8px 18px;
        border-radius: 8px;
        transition: all 0.2s;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }
      .btn-outline:hover { background: var(--burgundy); color: white; }

      .input-field {
        width: 100%;
        border: 1.5px solid var(--surface-border);
        background: var(--surface);
        padding: 10px 14px;
        border-radius: 8px;
        font-family: 'DM Sans', sans-serif;
        font-size: 14px;
        color: var(--charcoal);
        outline: none;
        transition: all 0.2s;
      }
      .input-field:focus { 
        border-color: var(--saffron); 
        box-shadow: 0 0 0 3px rgba(244, 160, 36, 0.1);
      }

      .page-enter { animation: fadeUp 0.4s ease forwards; }
      @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }

      .pattern-bg {
        background-color: var(--cream);
        background-image: radial-gradient(circle, rgba(212,160,23,0.06) 1px, transparent 1px);
        background-size: 24px 24px;
      }

      ::-webkit-scrollbar { width: 5px; }
      ::-webkit-scrollbar-track { background: var(--cream); }
      ::-webkit-scrollbar-thumb { background: var(--saffron); border-radius: 10px; }
      
      /* Custom Scrollbar for Containers */
      .custom-scrollbar::-webkit-scrollbar { width: 4px; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--surface-border); border-radius: 10px; }

      /* Marquee Animation */
      @keyframes marquee {
        0% { transform: translateX(0); }
        100% { transform: translateX(-50%); }
      }
      .animate-marquee-slow {
        display: inline-flex;
        animation: marquee 20s linear infinite;
      }
      .animate-marquee-slow:hover {
        animation-play-state: paused;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return null;
}

export default GlobalStyle;
