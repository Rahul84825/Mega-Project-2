import { useEffect } from "react";

export default function GlobalStyle() {
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@300;400;500&display=swap');
      :root {
        --saffron: #E8883A;
        --burgundy: #6A350F;
        --cream: #FFF3E0;
        --gold: #C9A84C;
        --charcoal: #3B2417;
        --muted: #7A634A;
        --surface: #FFF8EE;
        --surface-strong: #FFF1D9;
        --surface-border: rgba(83, 44, 22, 0.14);
      }
      *, *::before, *::after { box-sizing: border-box; }
      html { background: var(--cream); }
      body { margin: 0; font-family: 'DM Sans', sans-serif; background: linear-gradient(180deg, #fff6e9 0%, #fff3e0 100%); color: var(--charcoal); }
      #root { min-height: 100vh; background: linear-gradient(180deg, #fff6e9 0%, #fff3e0 100%); }
      h1,h2,h3,.serif { font-family: 'Cormorant Garamond', serif; }
      .card-hover { transition: transform 0.3s ease, box-shadow 0.3s ease; }
      .card-hover:hover { transform: translateY(-6px); box-shadow: 0 20px 40px rgba(83,44,22,0.12); }
      .btn-primary {
        background: var(--burgundy);
        color: white;
        border: none;
        cursor: pointer;
        font-family: 'DM Sans', sans-serif;
        font-size: 13px;
        font-weight: 500;
        letter-spacing: 1.5px;
        text-transform: uppercase;
        padding: 12px 24px;
        transition: all 0.25s ease;
      }
      .btn-primary:hover { background: #4f280c; }
      .btn-outline {
        background: transparent;
        border: 1.5px solid var(--burgundy);
        color: var(--burgundy);
        cursor: pointer;
        font-family: 'DM Sans', sans-serif;
        font-size: 13px;
        font-weight: 500;
        letter-spacing: 1px;
        text-transform: uppercase;
        padding: 10px 20px;
        transition: all 0.25s ease;
      }
      .btn-outline:hover { background: var(--burgundy); color: white; }
      .input-field {
        width: 100%;
        border: 1.5px solid var(--surface-border);
        background: var(--surface);
        padding: 12px 16px;
        font-family: 'DM Sans', sans-serif;
        font-size: 14px;
        color: var(--charcoal);
        outline: none;
        transition: border-color 0.2s;
      }
      .input-field:focus { border-color: var(--saffron); }
      .badge {
        display: inline-block;
        padding: 3px 10px;
        font-size: 11px;
        font-weight: 500;
        letter-spacing: 0.5px;
        border-radius: 20px;
      }
      .page-enter { animation: fadeUp 0.4s ease forwards; }
      @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
      .ornament { color: var(--saffron); font-size: 20px; }
      .pattern-bg {
        background-color: var(--cream);
        background-image: radial-gradient(circle, rgba(201,168,76,0.09) 1px, transparent 1px);
        background-size: 24px 24px;
      }
      ::-webkit-scrollbar { width: 5px; }
      ::-webkit-scrollbar-track { background: var(--cream); }
      ::-webkit-scrollbar-thumb { background: var(--saffron); border-radius: 10px; }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return null;
}
