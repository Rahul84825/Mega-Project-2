import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { getHeroSlides } from "../services/api";

const HERO_CONTENT = {
  subtitle: "Estd. 2020 — Pure Tradition",
  title: "Mithai World",
  highlight: "Real Taste Of Pune",
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
    <section className="relative h-[520px] md:h-[700px] w-full overflow-hidden flex items-center justify-center bg-[var(--charcoal)]">
      {/* ── BACKGROUND SLIDES ── */}
      {slides.map((slide, i) => (
        <div
          key={slide._id || i}
          className={`absolute inset-0 transition-all duration-1000 ease-in-out ${i === activeIndex ? 'opacity-100' : 'opacity-0'}`}
        >
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-[8000ms] ease-linear"
            style={{
              backgroundImage: `url(${slide.image})`,
              transform: i === activeIndex ? 'scale(1.1) rotate(1deg)' : 'scale(1) rotate(0deg)'
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--charcoal)]/95 via-[var(--charcoal)]/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--charcoal)]/40 via-transparent to-transparent md:hidden" />
        </div>
      ))}

      {/* ── CONTENT ── */}
      <div className="relative z-10 w-full max-w-[1440px] mx-auto px-6 md:px-12 lg:px-20 text-center md:text-left">
        <div className="max-w-3xl">
          <div className="animate-in slide-in-from-bottom-4 fade-in duration-700 delay-100">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-[var(--gold)] text-[9px] md:text-[11px] font-black uppercase tracking-[0.4em] mb-8 shadow-2xl">
              <Sparkles size={16} className="animate-pulse" /> {HERO_CONTENT.subtitle}
            </div>
          </div>

          <h1 className="serif text-4xl md:text-7xl lg:text-8xl font-medium text-white leading-[1.05] mb-8 tracking-tighter animate-in slide-in-from-bottom-6 fade-in duration-700 delay-300">
            {HERO_CONTENT.title} <br />
            <span className="block mt-2 text-[var(--gold)] bg-clip-text text-transparent bg-gradient-to-r from-[var(--gold)] via-[var(--saffron)] to-[var(--gold)] text-[0.85em] lg:text-[0.8em]">
              {HERO_CONTENT.highlight}
            </span>
          </h1>

          {/* ── PROMOTIONAL LINE ── */}
          <div className="animate-in slide-in-from-bottom-5 fade-in duration-700 delay-400 mb-8 flex items-center justify-center md:justify-start gap-3">
            <span className="h-px w-8 bg-[var(--gold)]/50" />
            <span className="text-[var(--saffron)] font-black text-sm md:text-lg tracking-[0.12em] uppercase drop-shadow-lg">
              🎉 20% OFF ON YOUR FIRST ORDER
            </span>
            <span className="h-px w-8 bg-[var(--gold)]/50" />
          </div>

          <p className="text-white/80 text-sm md:text-xl font-medium leading-relaxed mb-12 max-w-xl mx-auto md:mx-0 animate-in slide-in-from-bottom-8 fade-in duration-700 delay-500">
            {HERO_CONTENT.description}
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-5 animate-in slide-in-from-bottom-10 fade-in duration-700 delay-700">
            <button
              onClick={() => navigate("/sweets")}
              className="btn-primary h-16 px-12 text-sm w-full sm:w-auto shadow-[0_20px_50px_-10px_rgba(139,30,63,0.5)] active:scale-95 group overflow-hidden relative"
            >
              <span className="relative z-10 flex items-center gap-2">{HERO_CONTENT.ctaPrimary} <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" /></span>
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
            </button>
            <button
              onClick={() => navigate("/about")}
              className="h-16 px-12 rounded-2xl border-2 border-white/20 text-white text-xs font-black uppercase tracking-[0.2em] hover:bg-white hover:text-[var(--charcoal)] transition-all w-full sm:w-auto backdrop-blur-md active:scale-95 shadow-xl"
            >
              {HERO_CONTENT.ctaSecondary}
            </button>
          </div>
        </div>
      </div>
      {/* ── OFFER BADGE ── */}
      <div className="hidden lg:flex absolute top-24 right-16 z-20">
        <div className="w-36 h-36 rounded-full bg-gradient-to-br from-[var(--gold)] via-[var(--saffron)] to-[#ff9f1c] shadow-[0_20px_50px_rgba(0,0,0,0.35)] flex flex-col items-center justify-center text-center border-4 border-white/20">
          <span className="text-4xl font-black text-white leading-none">
            20%
          </span>
          <span className="text-xs font-black uppercase tracking-wider text-white">
            OFF
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-white/90 mt-1">
            First Order
          </span>
        </div>
      </div>

      {/* ── PROGRESS BAR ── */}
      <div className="absolute bottom-0 left-0 h-1 bg-[var(--gold)]/30 w-full">
        <div
          key={activeIndex}
          className="h-full bg-[var(--gold)] animate-progress"
          style={{ animationDuration: '6000ms' }}
        />
      </div>

      {/* ── DOTS ── */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 md:left-20 md:translate-x-0 flex items-center gap-3">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            className={`transition-all duration-500 rounded-full ${i === activeIndex ? 'w-12 h-1.5 bg-[var(--gold)] shadow-[0_0_15px_var(--gold)]' : 'w-2 h-2 bg-white/20 hover:bg-white/40'}`}
          />
        ))}
      </div>
    </section>
  );
}

export default HeroSection;
