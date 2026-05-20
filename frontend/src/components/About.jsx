import { NavLink } from "react-router-dom";
import {
  MapPin, Phone, Mail, Clock,
  Shield, Truck, RefreshCw, Headphones,
  Heart, Star, Users, Award,
  ArrowRight, CheckCircle,
} from "lucide-react";

// ── Data ──────────────────────────────────────────────────────────────────────
const STATS = [
  { value: "5+",   label: "Years in Business",  icon: Award  },
  { value: "5000+", label: "Happy Customers",     icon: Users  },
  { value: "100+", label: "Sweet Varieties",  icon: Star   },
  { value: "4.9★", label: "Average Rating",      icon: Heart  },
];

const VALUES = [
  {
    icon: Shield,
    title: "Quality First",
    desc: "Every sweet we make is prepared with the finest ingredients. We never compromise on the authentic taste your family loves.",
  },
  {
    icon: Heart,
    title: "Customer is Family",
    desc: "We treat every customer like a guest at our home. Your satisfaction is our highest commitment.",
  },
  {
    icon: CheckCircle,
    title: "Fresh Daily",
    desc: "No preservatives, no old stock. We prepare our sweets fresh every single day to ensure the highest quality.",
  },
];

const WHY_US = [
  { icon: Shield,     label: "100% Authentic Recipes"    },
  { icon: Truck,      label: "Free Delivery above ₹999" },
  { icon: RefreshCw,  label: "Freshness Guaranteed"       },
  { icon: Headphones, label: "Friendly Local Support"   },
  { icon: Star,       label: "Premium Ingredients" },
  { icon: Heart,      label: "Trusted by 5000+ Families" },
];

const TIMELINE = [
  {
    year: "2022",
    title: "The Beginning",
    desc: "Sakharam Choudhary founded Mithai World in Viman Nagar, Pune with a passion for authentic Indian sweets and traditional recipes.",
  },
  {
    year: "2023",
    title: "Growing Family",
    desc: "Within our first year, over 2000 families in Pune trusted us for their celebrations. We expanded our range to include dry fruit mithais.",
  },
  {
    year: "2024",
    title: "5000+ Happy Homes",
    desc: "Today we proudly serve 5000+ happy customers across Pune, becoming a household name for premium quality sweets.",
  },
];

// ── About Page ────────────────────────────────────────────────────────────────
const About = () => {
  return (
    <main className="min-h-[60vh] bg-[#fff8f0] font-['Inter',system-ui,sans-serif]">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden text-white"
               style={{ background: "linear-gradient(135deg, #7a2828 0%, #5a1a1a 100%)" }}>
        <div className="pointer-events-none absolute -right-24 -top-24 h-[400px] w-[400px]
                        rounded-full bg-white/5 blur-[80px]" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-[280px] w-[280px]
                        rounded-full bg-[#e8883a]/10 blur-[60px]" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 sm:py-18">
          <div className="max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-1.5 rounded-full
                            border border-white/20 bg-white/10 px-3 py-1
                            text-[10px] font-medium uppercase tracking-[0.24em] text-white/80">
              <Star className="h-3 w-3 fill-current" /> Our Story
            </div>
            <h1 className="mb-4 text-3xl font-medium leading-[1.15] tracking-tight sm:text-4xl lg:text-5xl">
              Spreading Sweetness with{" "}
              <span className="text-[#e8a852]">Trust & Tradition</span>
            </h1>
            <p className="mb-8 max-w-lg text-sm leading-relaxed text-white/80 sm:text-base">
              From a local shop in Viman Nagar, Pune to 5000+ happy homes —
              Mithai World is more than a store. It's a promise
              to every family we serve in the Pune community.
            </p>
            <NavLink
              to="/sweets"
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5
                         text-sm font-medium text-[#7a2828] shadow-lg transition-all duration-300
                         hover:-translate-y-0.5 hover:shadow-xl hover:bg-[#fff8f0]"
            >
              Shop Our Collection <ArrowRight className="h-4 w-4" />
            </NavLink>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="border-b border-[rgba(83,44,22,0.10)] bg-[#1e0f0a] py-8 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-6 lg:grid-cols-4 lg:divide-x lg:divide-white/10">
            {STATS.map(({ value, label, icon: Icon }) => (
              <div key={label} className="text-center">
                <div className="mb-2 flex justify-center">
                  <Icon className="h-4 w-4 text-[#e8883a] opacity-80" />
                </div>
                <p className="mb-0.5 text-2xl font-medium tracking-tight text-white">{value}</p>
                <p className="text-[11px] font-medium uppercase tracking-wider text-white/45">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Our Story ── */}
      <section className="bg-[#fffaf3] py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-2 lg:gap-16">

            {/* Story text */}
            <div className="max-w-lg">
              <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.28em] text-[#9c6a18]">
                How We Started
              </p>
              <h2 className="mb-5 text-2xl font-medium tracking-tight text-[#24140f] sm:text-3xl">
                Born from a love for authentic sweets
              </h2>
              <div className="space-y-4 text-[13px] leading-relaxed text-[#6e5443]">
                <p>
                  Mithai World was started by{" "}
                  <strong className="text-[#24140f]">Sakharam Choudhary</strong> with a simple
                  dream — to bring premium quality, authentic Indian sweets to families of Pune
                  at honest, affordable prices.
                </p>
                <p>
                  Located in the heart of{" "}
                  <strong className="text-[#24140f]">Viman Nagar</strong>,
                  we started small, but our commitment to freshness and taste quickly earned the trust of the
                  community. Today, over{" "}
                  <strong className="text-[#24140f]">5000+ families</strong> rely on us for their
                  celebrations and daily treats.
                </p>
                <p>
                  Every sweet we make is prepared with care — using traditional methods and the 
                  finest ingredients to ensure that every bite is a journey back to your roots.
                </p>
              </div>
            </div>

            {/* Timeline */}
            <div className="relative pt-2">
              <div className="absolute left-[15px] bottom-4 top-4 w-px bg-[rgba(212,160,23,0.20)]" />
              <div className="space-y-5">
                {TIMELINE.map((item, i) => (
                  <div key={i} className="relative flex gap-5 pl-0.5">
                    <div className="z-10 flex h-7 w-7 shrink-0 items-center justify-center
                                    rounded-full bg-[#7a2828]
                                    shadow-[0_0_0_4px_#fffaf3]">
                      <div className="h-2 w-2 rounded-full bg-white" />
                    </div>
                    <div className="group flex-1 rounded-2xl border border-[rgba(83,44,22,0.10)]
                                    bg-white p-4 shadow-sm transition-all duration-300
                                    hover:-translate-y-0.5 hover:border-[rgba(212,160,23,0.30)]
                                    hover:shadow-[0_8px_24px_rgba(83,44,22,0.08)]">
                      <span className="mb-2 inline-block rounded-md bg-[rgba(212,160,23,0.12)]
                                       px-2 py-0.5 text-[10px] font-medium text-[#8a5a15]">
                        {item.year}
                      </span>
                      <h3 className="mb-1 text-sm font-medium text-[#24140f]
                                     transition-colors group-hover:text-[#7a2828]">
                        {item.title}
                      </h3>
                      <p className="text-[13px] leading-relaxed text-[#6e5443]">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Meet the owner ── */}
      <section className="border-y border-[rgba(83,44,22,0.08)] bg-[#fff8f0] py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <div className="group flex flex-col overflow-hidden rounded-3xl
                            border border-[rgba(83,44,22,0.12)] bg-[#fffaf3]
                            shadow-sm transition-shadow duration-300 hover:shadow-lg sm:flex-row">
              {/* Avatar */}
              <div className="relative flex shrink-0 flex-col items-center justify-center
                              border-b border-[rgba(83,44,22,0.08)] bg-[rgba(212,160,23,0.06)]
                              p-6 sm:w-48 sm:border-b-0 sm:border-r">
                <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-full
                                border border-[rgba(83,44,22,0.12)] bg-white shadow-sm
                                transition-transform duration-500 group-hover:scale-105">
                  <span className="text-3xl">👨‍💼</span>
                </div>
                <p className="text-sm font-medium text-[#24140f]">Sakharam Choudhary</p>
                <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-[#9c6a18]">
                  Founder & Owner
                </p>
              </div>
              {/* Quote */}
              <div className="flex flex-1 flex-col justify-center p-6 sm:p-8">
                <p className="mb-3 flex items-center gap-1.5 text-[10px] font-medium
                               uppercase tracking-[0.24em] text-[#9c6a18]">
                  <span className="h-px w-4 bg-[#d4a017]" /> Behind the Brand
                </p>
                <blockquote className="relative text-sm leading-relaxed text-[#6e5443] italic">
                  <span className="absolute -left-1 -top-2 font-serif text-4xl leading-none
                                   text-[rgba(212,160,23,0.25)] select-none">"</span>
                  <span className="relative z-10">
                    I started Mithai World because I believe every family in Pune deserves 
                    authentic, high-quality sweets prepared with traditional love.
                    Our customers are not just buyers — they are part of the Mithai World family.
                  </span>
                </blockquote>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Values ── */}
      <section className="bg-[#fffaf3] py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.28em] text-[#9c6a18]">
              What Drives Us
            </p>
            <h2 className="mb-3 text-2xl font-medium tracking-tight text-[#24140f] sm:text-3xl">
              Our Mission & Values
            </h2>
            <p className="mx-auto max-w-xl text-[13px] leading-relaxed text-[#6e5443]">
              Everything we do is rooted in three core beliefs that have guided us since day one.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {VALUES.map(({ icon: Icon, title, desc }) => (
              <div key={title}
                   className="group rounded-2xl border border-[rgba(83,44,22,0.10)] bg-white
                              p-5 shadow-sm transition-all duration-300
                              hover:-translate-y-1 hover:border-[rgba(212,160,23,0.30)]
                              hover:shadow-[0_12px_32px_rgba(83,44,22,0.09)]">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl
                                bg-[rgba(212,160,23,0.10)] ring-1 ring-[rgba(212,160,23,0.20)]
                                transition-transform duration-300 group-hover:scale-110">
                  <Icon className="h-4.5 w-4.5 text-[#b76a1f]" />
                </div>
                <h3 className="mb-2 text-sm font-medium text-[#24140f]">{title}</h3>
                <p className="text-[13px] leading-relaxed text-[#6e5443]">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why us ── */}
      <section className="border-t border-[rgba(83,44,22,0.08)] bg-[#fff8f0] py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col items-end justify-between gap-4 sm:flex-row">
            <div>
              <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.28em] text-[#9c6a18]">
                Our Promise
              </p>
              <h2 className="text-2xl font-medium tracking-tight text-[#24140f] sm:text-3xl">
                Why Families Choose Us
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {WHY_US.map(({ icon: Icon, label }) => (
              <div key={label}
                   className="group flex flex-col items-center rounded-2xl border
                              border-[rgba(83,44,22,0.10)] bg-white p-4 text-center
                              shadow-sm transition-all duration-300
                              hover:border-[rgba(212,160,23,0.30)]
                              hover:shadow-[0_6px_20px_rgba(83,44,22,0.08)]">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl
                                bg-[rgba(212,160,23,0.10)]
                                transition-transform duration-300 group-hover:scale-110">
                  <Icon className="h-4 w-4 text-[#b76a1f]" />
                </div>
                <p className="text-[11px] font-medium leading-snug text-[#3b2417]">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Location ── */}
      <section className="border-t border-[rgba(83,44,22,0.08)] bg-[#fffaf3] py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.28em] text-[#9c6a18]">
              Find Us
            </p>
            <h2 className="mb-3 text-2xl font-medium tracking-tight text-[#24140f] sm:text-3xl">
              Visit Our Shop
            </h2>
            <p className="text-[13px] text-[#6e5443]">
              Come visit us in person — we'd love to serve you the freshest sweets.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_2fr]">
            {/* Contact cards */}
            <div className="flex flex-col gap-3">
              {[
                { icon: MapPin, label: "Address", value: "Shop no. 04, Roshma Residency, Konark Nagar, Viman Nagar, Pune 411014", href: "https://maps.app.goo.gl/i7VqYRV4YFvNRdTc8" },
                { icon: Phone, label: "Phone",   value: "+91 95112 89914", href: "tel:+919511289914" },
                { icon: Mail,  label: "Email",   value: "mithaiworld08@gmail.com", href: "mailto:mithaiworld08@gmail.com" },
                { icon: Clock, label: "Hours",   value: "Mon – Sun: 9:00 AM – 10:00 PM", href: null },
              ].map(({ icon: Icon, label, value, href }) => (
                <div key={label}
                     className="flex items-start gap-3 rounded-xl border border-[rgba(83,44,22,0.10)]
                                bg-white p-4 shadow-sm transition-colors
                                hover:border-[rgba(212,160,23,0.28)]">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center
                                  rounded-lg bg-[rgba(212,160,23,0.10)] ring-1
                                  ring-[rgba(212,160,23,0.18)]">
                    <Icon className="h-3.5 w-3.5 text-[#b76a1f]" />
                  </div>
                  <div>
                    <p className="mb-0.5 text-[10px] font-medium uppercase tracking-[0.18em]
                                  text-[rgba(83,44,22,0.45)]">
                      {label}
                    </p>
                    {href ? (
                      <a href={href}
                         className="text-sm font-medium text-[#3b2417] transition-colors
                                    hover:text-[#7a2828]">
                        {value}
                      </a>
                    ) : (
                      <p className="text-sm font-medium text-[#3b2417]">{value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {/* Map */}
            <div className="group relative flex min-h-[320px] items-center justify-center
                            overflow-hidden rounded-2xl border border-[rgba(83,44,22,0.12)]
                            bg-[rgba(212,160,23,0.06)] shadow-sm">
              <p className="absolute z-0 flex items-center gap-2 text-sm text-[rgba(83,44,22,0.35)]">
                <MapPin className="h-4 w-4" /> Map Embed Area
              </p>
              <iframe
                title="Mithai World Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3782.3686866164283!2d73.9114251!3d18.5574347!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bc2c147b8b2135d%3A0xbb16399ba14a7e9e!2sViman%20Nagar%2C%20Pune%2C%20Maharashtra!5e0!3m2!1sen!2sin!4v1716130000000!5m2!1sen!2sin"
                width="100%" height="100%"
                className="absolute inset-0 z-10 h-full w-full opacity-60
                           transition-opacity duration-500 group-hover:opacity-100"
                style={{ border: 0 }} allowFullScreen="" loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="border-t border-[rgba(83,44,22,0.10)] bg-[#1e0f0a] py-12 text-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 text-center sm:flex-row sm:text-left">
            <div>
              <h2 className="mb-1.5 text-xl font-medium tracking-tight sm:text-2xl">
                Ready to taste the tradition?
              </h2>
              <p className="text-sm text-white/50">Browse our full collection of premium Indian sweets.</p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <NavLink to="/contact"
                       className="rounded-full border border-white/20 bg-white/10 px-5 py-2.5
                                  text-sm font-medium text-white transition-colors hover:bg-white/15">
                Contact Us
              </NavLink>
              <NavLink to="/sweets"
                       className="inline-flex items-center gap-2 rounded-full bg-[#e8883a]
                                  px-5 py-2.5 text-sm font-medium text-[#1e0f0a] shadow-sm
                                  transition-all hover:bg-[#d4793a] hover:-translate-y-0.5">
                Order Now <ArrowRight className="h-4 w-4" />
              </NavLink>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
};

export default About;
