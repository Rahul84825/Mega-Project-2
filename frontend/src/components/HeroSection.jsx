import { useEffect, useMemo, useState } from "react";
import { getHeroSlides } from "../services/api";

const FALLBACK_SLIDES = [
  {
    _id: "fallback-1",
    image: "/hero-slide-1.svg",
    order: 1
  },
  {
    _id: "fallback-2",
    image: "/hero-slide-2.svg",
    order: 2
  },
  {
    _id: "fallback-3",
    image: "/hero-slide-3.svg",
    order: 3
  }
];

const HERO_CONTENT = {
  title: "India's Finest Mithai",
  subtitle: "Crafted with Love",
  description: "Handcrafted traditional sweets made from premium ingredients, delivered to your doorstep.",
  ctaPrimary: "Shop Now",
  ctaSecondary: "Our Story"
};

function HeroSection() {
  const [slides, setSlides] = useState(FALLBACK_SLIDES);
  const [activeIndex, setActiveIndex] = useState(0);

  const normalizedSlides = useMemo(() => {
    const sourceSlides = Array.isArray(slides) && slides.length > 0 ? slides : FALLBACK_SLIDES;

    return sourceSlides
      .filter((slide) => Boolean(slide?.image))
      .map((slide, index) => ({
        _id: slide._id || `slide-${index + 1}`,
        image: slide.image,
        order: Number.isFinite(Number(slide.order)) ? Number(slide.order) : index + 1
      }));
  }, [slides]);

  useEffect(() => {
    const loadSlides = async () => {
      try {
        const apiSlides = await getHeroSlides();
        const validSlides = Array.isArray(apiSlides)
          ? apiSlides.filter((slide) => Boolean(slide?.image))
          : [];

        if (validSlides.length > 0) {
          setSlides(validSlides);
          setActiveIndex(0);
        }
      } catch (_error) {
        // Keep fallback slides if API fails.
      }
    };

    loadSlides();
  }, []);

  useEffect(() => {
    if (normalizedSlides.length <= 1) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % normalizedSlides.length);
    }, 4000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [normalizedSlides.length]);

  useEffect(() => {
    if (activeIndex < normalizedSlides.length) {
      return;
    }

    setActiveIndex(0);
  }, [activeIndex, normalizedSlides.length]);

  const activeSlide = useMemo(() => {
    return normalizedSlides[activeIndex] || FALLBACK_SLIDES[0];
  }, [normalizedSlides, activeIndex]);

  const titleWords = HERO_CONTENT.title.trim().split(/\s+/).filter(Boolean);
  const firstTitlePart = titleWords.slice(0, -1).join(" ");
  const highlightedTitleWord = titleWords.slice(-1)[0] || "Mithai";

  return (
    <div
      style={{
        padding: "48px 32px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
        minHeight: "480px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      {normalizedSlides.map((slide, index) => (
        <div
          key={slide._id || slide.image || index}
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${slide.image})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: index === activeIndex ? 1 : 0,
            transition: "opacity 0.8s ease"
          }}
        />
      ))}

      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(135deg, rgba(26,12,9,0.74) 0%, rgba(74,16,16,0.60) 60%, rgba(113,20,20,0.62) 100%)"
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle at 20% 50%, rgba(244,160,36,0.12) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(244,160,36,0.08) 0%, transparent 40%)"
        }}
      />

      <div style={{ maxWidth: 700, margin: "0 auto", position: "relative" }}>
        <div
          style={{
            fontSize: 13,
            letterSpacing: 5,
            color: "var(--saffron)",
            textTransform: "uppercase",
            marginBottom: 16
          }}
        >
          ✦ {HERO_CONTENT.subtitle} ✦
        </div>
        <h1
          className="serif"
          style={{
            fontSize: "clamp(40px, 6vw, 68px)",
            fontWeight: 700,
            color: "white",
            lineHeight: 1.1,
            marginBottom: 20
          }}
        >
          {firstTitlePart || HERO_CONTENT.title}
          <br />
          <span style={{ color: "var(--saffron)" }}>
            {highlightedTitleWord}
          </span>
        </h1>
        <p
          style={{
            fontSize: 15,
            color: "rgba(255,255,255,0.75)",
            maxWidth: 470,
            margin: "0 auto 32px",
            lineHeight: 1.8
          }}
        >
          {HERO_CONTENT.description}
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button className="btn-primary" style={{ padding: "14px 36px", fontSize: 12 }}>
            {HERO_CONTENT.ctaPrimary}
          </button>
          <button
            className="btn-outline"
            style={{ borderColor: "rgba(244,160,36,0.5)", color: "var(--saffron)", padding: "14px 36px", fontSize: 12 }}
          >
            {HERO_CONTENT.ctaSecondary}
          </button>
        </div>

        {normalizedSlides.length > 1 && (
          <div style={{ marginTop: 24, display: "flex", gap: 8, justifyContent: "center" }}>
            {normalizedSlides.map((slide, index) => (
              <button
                key={(slide._id || slide.image || index) + "-dot"}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`Go to slide ${index + 1}`}
                style={{
                  width: index === activeIndex ? 22 : 8,
                  height: 8,
                  borderRadius: 8,
                  border: "none",
                  background: index === activeIndex ? "var(--saffron)" : "rgba(255,255,255,0.45)",
                  cursor: "pointer",
                  transition: "all .2s"
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default HeroSection;
