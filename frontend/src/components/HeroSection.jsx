import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { getHeroSlides } from "../services/api";

const HERO_CONTENT = {
  subtitle: "Estd. 2019 — Pure Tradition",
  title: "The Art of Indian",
  highlight: "Mithai",
  description: "Experience the finest collection of authentic Indian sweets, handcrafted using premium ingredients and heritage recipes passed through generations.",
  ctaPrimary: "Order Now",
  ctaSecondary: "Our Story"
};

const DEFAULT_SLIDES = [
  { image: "/hero-slide-1.svg" },
  { image: "/hero-slide-2.svg" }
];

function HeroSection() {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSlides = async () => {
      try {
        setLoading(true);
        const data = await getHeroSlides();
        if (Array.isArray(data) && data.length > 0) {
          setSlides(data);
        } else {
          setSlides(DEFAULT_SLIDES);
        }
      } catch (err) {
        console.error("Failed to fetch hero slides:", err);
        setSlides(DEFAULT_SLIDES);
      } finally {
        setLoading(false);
      }
    };
    fetchSlides();
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <section className="relative h-[480px] md:h-[600px] w-full overflow-hidden flex items-center justify-center bg-[var(--charcoal)]">
      {/* ── BACKGROUND SLIDES ── */}
      {slides.map((slide, i) => (
        <div 
          key={slide._id || i}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${i === activeIndex ? 'opacity-100' : 'opacity-0'}`}
        >
          <div 
            className="absolute inset-0 bg-cover bg-center scale-105 transition-transform duration-[6000ms]"
            style={{ backgroundImage: `url(${slide.image})`, transform: i === activeIndex ? 'scale(1)' : 'scale(1.1)' }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--charcoal)]/90 via-[var(--charcoal)]/40 to-transparent" />
        </div>
      ))}

      {/* ── CONTENT ── */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 text-center md:text-left">
        <div className="max-w-2xl animate-in slide-in-from-left duration-700">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[var(--saffron)] text-[10px] font-medium uppercase tracking-[0.3em] mb-6">
            <Sparkles size={14} /> {HERO_CONTENT.subtitle}
          </div>
          
          <h1 className="serif text-4xl md:text-6xl lg:text-7xl font-medium text-white leading-[1.1] mb-6 tracking-tight">
            {HERO_CONTENT.title} <br />
            <span className="text-[var(--saffron)]">{HERO_CONTENT.highlight}</span>
          </h1>
          
          <p className="text-white/80 text-sm md:text-lg font-medium leading-relaxed mb-10 max-w-lg mx-auto md:mx-0">
            {HERO_CONTENT.description}
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button 
              onClick={() => navigate("/sweets")}
              className="btn-primary h-14 px-10 text-sm w-full sm:w-auto shadow-2xl"
            >
              {HERO_CONTENT.ctaPrimary} <ArrowRight size={18} />
            </button>
            <button 
              onClick={() => navigate("/about")}
              className="h-14 px-10 rounded-xl border border-white/30 text-white text-sm font-medium uppercase tracking-widest hover:bg-white hover:text-[var(--charcoal)] transition-all w-full sm:w-auto backdrop-blur-sm"
            >
              {HERO_CONTENT.ctaSecondary}
            </button>
          </div>
        </div>
      </div>

      {/* ── DOTS ── */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 md:left-12 md:translate-x-0 flex gap-2">
        {slides.map((_, i) => (
          <button 
            key={i} 
            onClick={() => setActiveIndex(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${i === activeIndex ? 'w-10 bg-[var(--saffron)]' : 'w-2 bg-white/30 hover:bg-white/50'}`}
          />
        ))}
      </div>
    </section>
  );
}

export default HeroSection;
