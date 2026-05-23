import { useEffect, useRef, useState } from "react";
import SectionContainer from "./home/SectionContainer";
import Mithai from "../assets/Mithai world.jpeg";

const DEFAULT_MILESTONES = [
  {
    year: "2019",
    title: "A Sweet Start",
    description: "We started as a small family-run shop with one goal: bring authentic traditional sweets to Pune.",
  },
  {
    year: "2021",
    title: "Growing With Trust",
    description: "Customer love and word-of-mouth helped us expand our variety while keeping our handmade quality intact.",
  },
  {
    year: "Today",
    title: "A Pune Tradition",
    description: "From classic laddus to premium dry fruit mithais, we continue to spread joy with every bite.",
  },
];

const DEFAULT_IMAGE = {
  src: Mithai,
  alt: "Store legacy products display",
};

const OurJourney = ({
  title       = "Our Journey",
  subtitle    = "From one family store to thousands of happy homes",
  description = "Every chapter of our journey is built on honest pricing, reliable quality, and relationships that last for years.",
  milestones  = DEFAULT_MILESTONES,
  image       = DEFAULT_IMAGE,
}) => {
  const sectionRef = useRef(null);
  const [visible, setVisible]   = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.2 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden py-16 md:py-28 bg-[#fffaf3] pattern-bg"
    >
      {/* Decorative Blur Elements */}
      <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] bg-[var(--gold)]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 h-[500px] w-[500px] bg-[var(--burgundy)]/5 rounded-full blur-3xl pointer-events-none" />

      <SectionContainer className="relative z-10">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">

          {/* ── LEFT — Text + milestones ── */}
          <div className={`transition-all duration-1000 ease-out delay-100
                           ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>

            {/* Eyebrow */}
            <div className="mb-6 flex items-center gap-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--surface-strong)] text-[var(--gold)] text-[10px] font-black tracking-widest uppercase">
                Established 2019
              </div>
            </div>

            {/* Heading */}
            <h2 className="serif mb-4 text-3xl md:text-5xl font-medium leading-[1.1] text-[var(--charcoal)]">
              {title}
            </h2>

            {/* Subtitle */}
            <p className="mb-4 max-w-[500px] text-base md:text-lg font-bold italic leading-relaxed text-[var(--burgundy)] opacity-80">
              {subtitle}
            </p>

            {/* Description */}
            <p className="mb-10 max-w-[480px] text-sm md:text-base font-medium leading-relaxed text-[var(--muted)]">
              {description}
            </p>

            {/* Milestone cards */}
            <div className="flex flex-col gap-4">
              {milestones.map((item, i) => (
                <div
                  key={`${item.year}-${i}`}
                  style={{ transitionDelay: `${300 + (i * 150)}ms` }}
                  className={`group flex gap-5 rounded-[24px] border border-[var(--surface-border)] bg-white/40 p-5 backdrop-blur-sm transition-all duration-500
                             ${visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}
                             hover:bg-white hover:shadow-[0_20px_40px_-10px_rgba(139,30,63,0.1)] hover:-translate-y-1`}
                >
                  {/* Year Circle */}
                  <div className="flex shrink-0 flex-col items-center gap-2">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--burgundy)] text-[10px] font-black text-white shadow-lg shadow-[var(--burgundy)]/20 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12">
                      {item.year.slice(0, 2)}
                    </div>
                    {i < milestones.length - 1 && (
                      <div className="w-0.5 flex-1 bg-gradient-to-b from-[var(--burgundy)]/20 to-transparent rounded-full" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--gold)]">
                      {item.year}
                    </div>
                    <h3 className="serif mb-1 text-lg font-medium text-[var(--charcoal)] group-hover:text-[var(--burgundy)] transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs md:text-sm font-medium leading-relaxed text-[var(--muted)]">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* ── RIGHT — Image Experience ── */}
          <div
            className={`transition-all duration-1000 delay-300 ease-out
                         ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-20"}`}
          >
            <div className="relative p-4 sm:p-8">
              {/* Decorative Frame */}
              <div className="absolute inset-0 border-2 border-[var(--gold)]/20 rounded-[40px] rotate-2 transform translate-x-4 translate-y-4 pointer-events-none" />
              
              <div className="group relative overflow-hidden rounded-[32px] sm:rounded-[48px] border-4 border-white bg-[#fff3e0] shadow-[0_40px_80px_-20px_rgba(45,27,14,0.2)] transition-all duration-700 hover:shadow-2xl">
                {/* Image */}
                <div className="aspect-[4/5] sm:aspect-square overflow-hidden">
                  {image?.src && !imgError ? (
                    <img
                      src={image.src}
                      alt={image.alt || "Our journey"}
                      onError={() => setImgError(true)}
                      className="h-full w-full object-cover transition-all duration-1000 ease-out group-hover:scale-110 group-hover:rotate-2"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-[#fff6e9] via-[#fdebd0] to-[#f5dfc0]" />
                  )}
                </div>

                {/* Shimmer Overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                
                {/* Float Badge */}
                <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-white/90 backdrop-blur-xl border border-white shadow-xl translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 delay-100">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--charcoal)]">Still Preparing Fresh Daily</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SectionContainer>
    </section>
  );
};

export default OurJourney;