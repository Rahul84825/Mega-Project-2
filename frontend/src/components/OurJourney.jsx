import { useEffect, useRef, useState } from "react";
import SectionContainer from "./home/SectionContainer";
import Mithai from "../assets/Mithai world.jpeg";

const DEFAULT_MILESTONES = [
  {
    year: "2022",
    title: "A Sweet Start",
    description: "We started as a small family-run shop with one goal: bring authentic traditional sweets to Pune.",
  },
  {
    year: "2023",
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
      className="relative overflow-hidden py-16 md:py-24
                 font-['Inter',system-ui,sans-serif]"
      style={{
        background: "linear-gradient(180deg, #fff6e9 0%, #fff3e0 100%)",
      }}
    >
      {/* Subtle radial tints — same as navbar-root palette */}
      <div className="pointer-events-none absolute inset-0
                      bg-[radial-gradient(circle_at_10%_20%,rgba(244,160,36,0.06)_0%,transparent_35%),
                          radial-gradient(circle_at_90%_80%,rgba(122,31,44,0.04)_0%,transparent_30%)]" />

      <SectionContainer className="relative">
        <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16 xl:gap-20">

          {/* ── LEFT — Text + milestones ── */}
          <div className={`transition-all duration-500 ease-out
                           ${visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-6"}`}>

            {/* Eyebrow */}
            <div className="mb-4 flex items-center gap-2.5">
              <span className="block h-px w-7 bg-[#d4a017]" />
              <span className="text-[10px] font-medium uppercase tracking-[0.28em] text-[#9c6a18]">
                Our Story
              </span>
            </div>

            {/* Heading */}
            <h2 className="mb-3.5 text-[clamp(26px,3vw,38px)] font-medium
                           leading-[1.15] tracking-[-0.02em] text-[#24140f]">
              {title}
            </h2>

            {/* Subtitle */}
            <p className="mb-2.5 max-w-[460px] text-[15px] font-medium
                          leading-[1.65] text-[#3b2417]">
              {subtitle}
            </p>

            {/* Description */}
            <p className="mb-8 max-w-[440px] text-[13px] font-normal
                          leading-[1.75] text-[#6e5443]">
              {description}
            </p>

            {/* Milestone cards */}
            <div className="flex flex-col gap-2.5">
              {milestones.map((item, i) => (
                <div
                  key={`${item.year}-${i}`}
                  className="group flex gap-4 rounded-[14px]
                             border border-[rgba(83,44,22,0.12)]
                             bg-white/60 px-[18px] py-4
                             backdrop-blur-sm
                             transition-all duration-200
                             hover:-translate-y-0.5
                             hover:border-[rgba(212,160,23,0.40)]
                             hover:bg-white/80
                             hover:shadow-[0_10px_28px_rgba(83,44,22,0.08)]"
                >
                  {/* Year dot + connector line */}
                  <div className="flex shrink-0 flex-col items-center gap-1.5 pt-0.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center
                                    rounded-full border-[1.5px] border-[rgba(212,160,23,0.40)]
                                    bg-[rgba(212,160,23,0.14)]">
                      <div className="h-2 w-2 rounded-full bg-[#b76a1f]" />
                    </div>
                    {i < milestones.length - 1 && (
                      <div className="min-h-[20px] w-px flex-1
                                      bg-gradient-to-b from-[rgba(212,160,23,0.35)] to-transparent" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <span className="mb-1 inline-block rounded-full
                                     border border-[rgba(212,160,23,0.28)]
                                     bg-[rgba(212,160,23,0.10)]
                                     px-2.5 py-0.5 text-[10px] font-medium
                                     uppercase tracking-[0.22em] text-[#8a5a15]">
                      {item.year}
                    </span>
                    <h3 className="mb-1 text-[14px] font-medium leading-[1.3] text-[#24140f]">
                      {item.title}
                    </h3>
                    <p className="m-0 text-[13px] font-normal leading-[1.65] text-[#6e5443]">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* ── RIGHT — Single image ── */}
          <div
            className={`sticky top-24 transition-all duration-500 delay-100 ease-out
                         ${visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-6"}`}
          >
            {/* Vertical accent line */}
            <div className="absolute -left-4 top-6 hidden h-[calc(100%-3rem)] w-px
                            bg-gradient-to-b from-[#d4a017] via-[rgba(200,138,26,0.15)] to-transparent
                            lg:block" />

            {/* Image card */}
            <div className="group relative overflow-hidden rounded-3xl
                            border border-[rgba(83,44,22,0.16)]
                            bg-[#fff3e0]
                            shadow-[0_20px_48px_rgba(83,44,22,0.10)]
                            transition-all duration-300
                            hover:-translate-y-1
                            hover:shadow-[0_28px_60px_rgba(83,44,22,0.14)]">

              {/* Image */}
              <div className="aspect-square overflow-hidden">
                {image?.src && !imgError ? (
                  <img
                    src={image.src}
                    alt={image.alt || "Our journey"}
                    onError={() => setImgError(true)}
                    className="h-full w-full object-cover transition-transform duration-500
                               group-hover:scale-[1.04]"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br
                                  from-[#fff6e9] via-[#fdebd0] to-[#f5dfc0]" />
                )}
              </div>

              {/* Bottom overlay */}
              <div className="pointer-events-none absolute inset-0
                              bg-gradient-to-b from-transparent via-transparent
                              to-[rgba(83,44,22,0.06)]" />

              {/* Caption pill — matches navbar/filter pill style */}
              <div className="absolute bottom-4 left-4 rounded-full
                              border border-[rgba(83,44,22,0.20)]
                              bg-[rgba(255,246,233,0.92)]
                              px-3.5 py-1.5 text-[11px] font-medium
                              tracking-[0.04em] text-[#7a1f2c]
                              shadow-[0_2px_8px_rgba(83,44,22,0.10)]
                              backdrop-blur-md">
                Est. 2024 · Still going
              </div>
            </div>

          </div>
        </div>
      </SectionContainer>
    </section>
  );
};

export default OurJourney;