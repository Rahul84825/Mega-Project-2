import { useEffect } from "react";
import { NavLink } from "react-router-dom";
import { ArrowLeft, Code, Github, Linkedin, ExternalLink, MessageCircle, Phone, Mail } from "lucide-react";

const BuiltBy = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Built By Rahul Choudhary | Full Stack Developer";
  }, []);

  return (
    <main className="min-h-[60vh] bg-[#fff8f0] pb-16 font-['Inter',system-ui,sans-serif]">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden text-white"
               style={{ background: "linear-gradient(135deg, #1e0f0a 0%, #2d1a10 100%)" }}>
        <div className="pointer-events-none absolute -right-24 -top-24 h-[400px] w-[400px]
                        rounded-full bg-[rgba(232,136,58,0.08)] blur-[90px]" />
        <div className="relative mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-24 lg:px-8">
          <NavLink to="/"
                   className="group mb-10 inline-flex items-center gap-2 text-sm font-medium
                              text-white/40 transition-colors hover:text-white">
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to Store
          </NavLink>

          <h1 className="mb-4 text-4xl font-medium tracking-tight sm:text-5xl">
            Hi, I'm Rahul Choudhary
          </h1>
          <p className="mb-6 text-[13px] font-medium uppercase tracking-[0.24em] text-[#e8883a]">
            Full Stack Developer
          </p>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-white/65 sm:text-lg">
            I build modern ecommerce and business websites for local shops and startups.
          </p>
        </div>
      </section>

      {/* ── Content grid ── */}
      <div className="relative z-10 mx-auto -mt-10 max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">

          {/* About */}
          <div className="rounded-3xl border border-[rgba(83,44,22,0.10)] bg-[#fffaf3]
                          p-8 shadow-sm transition-shadow hover:shadow-md md:col-span-2">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl
                              bg-[rgba(212,160,23,0.12)]">
                <Code className="h-5 w-5 text-[#b76a1f]" />
              </div>
              <h2 className="text-[15px] font-medium text-[#24140f]">About Me</h2>
            </div>
            <p className="text-[14px] leading-relaxed text-[#6e5443]">
              I specialize in building full-stack applications using React, Node.js, and MongoDB.
              My focus is on creating clean, responsive, and highly functional digital experiences
              that help businesses grow online and scale their sales reliably.
            </p>
          </div>

          {/* Links */}
          <div className="rounded-3xl border border-[rgba(83,44,22,0.10)] bg-[#fffaf3]
                          p-8 shadow-sm transition-shadow hover:shadow-md">
            <h2 className="mb-5 text-[11px] font-medium uppercase tracking-[0.18em]
                           text-[rgba(83,44,22,0.40)]">
              Connect
            </h2>
            <div className="flex flex-col gap-4">
              <a href="https://github.com/Rahul84825" target="_blank" rel="noopener noreferrer"
                 className="group flex items-center gap-3 text-sm font-medium text-[#3b2417]
                            transition-colors hover:text-[#24140f]">
                <Github className="h-5 w-5 transition-transform group-hover:scale-110" />
                GitHub Profile
              </a>
              <a href="https://www.linkedin.com/in/rahul-choudhary-b597b2395/" target="_blank" rel="noopener noreferrer"
                 className="group flex items-center gap-3 text-sm font-medium text-[#3b2417]
                            transition-colors hover:text-[#7a2828]">
                <Linkedin className="h-5 w-5 transition-transform group-hover:scale-110" />
                LinkedIn Profile
              </a>
            </div>
          </div>

          {/* Featured project */}
          <div className="group relative flex flex-col items-center justify-between gap-8
                          overflow-hidden rounded-3xl p-8 text-white shadow-xl
                          transition-shadow hover:shadow-2xl sm:flex-row md:col-span-3"
               style={{ background: "linear-gradient(135deg, #1e0f0a 0%, #3a1f10 100%)" }}>
            <div className="pointer-events-none absolute right-0 top-0 h-64 w-64
                            rounded-full bg-[rgba(232,136,58,0.08)] blur-3xl
                            transition-colors duration-500 group-hover:bg-[rgba(232,136,58,0.14)]" />

            <div className="relative z-10 flex-1 text-center sm:text-left">
              <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border
                              border-white/10 bg-white/8 px-3 py-1 text-[10px] font-medium
                              uppercase tracking-[0.20em] text-[#e8a852]">
                <ExternalLink className="h-3 w-3" /> Featured Project
              </div>
              <h3 className="mb-3 text-2xl font-medium tracking-tight sm:text-3xl">
                Mithai World
              </h3>
              <p className="mx-auto max-w-xl text-sm leading-relaxed text-white/60 sm:mx-0 sm:text-base">
                This website is a live example of my work. It features a custom frontend,
                secure admin dashboard, real-time updates, and a fully integrated backend architecture.
              </p>
            </div>

            <div className="relative z-10 flex h-24 w-24 shrink-0 items-center justify-center
                            rounded-[2rem] border border-white/10 bg-white/5 shadow-inner
                            transition-transform duration-500 group-hover:scale-105
                            sm:h-32 sm:w-32">
              <span className="text-5xl drop-shadow-md sm:text-6xl">💻</span>
            </div>
          </div>

          {/* CTA / hire me */}
          <div className="rounded-3xl border border-[rgba(83,44,22,0.10)] bg-[#fffaf3]
                          p-8 shadow-sm md:col-span-3">
            <div className="flex flex-col items-center justify-between gap-6 text-center sm:flex-row sm:text-left">
              <div>
                <h2 className="mb-2 text-xl font-medium tracking-tight text-[#24140f] sm:text-2xl">
                  Need a website like this?
                </h2>
                <p className="text-[13px] text-[#6e5443]">
                  Let's build it 🚀 Reach out to discuss your project.
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-3 sm:justify-end">
                <a href="https://wa.me/9511289914" target="_blank" rel="noopener noreferrer"
                   className="flex items-center justify-center gap-2 rounded-xl bg-[#22c55e]
                              px-5 py-3 text-sm font-medium text-white shadow-sm transition-all
                              hover:-translate-y-0.5 hover:bg-[#16a34a] hover:shadow-md">
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
                <a href="tel:9511289914"
                   className="flex items-center justify-center gap-2 rounded-xl bg-[#1e0f0a]
                              px-5 py-3 text-sm font-medium text-white shadow-sm transition-all
                              hover:-translate-y-0.5 hover:bg-[#2d1a10] hover:shadow-md">
                  <Phone className="h-4 w-4" /> Call
                </a>
                <a href="mailto:activegamer789@gmail.com"
                   className="flex items-center justify-center gap-2 rounded-xl border
                              border-[rgba(83,44,22,0.15)] bg-white px-5 py-3 text-sm font-medium
                              text-[#3b2417] shadow-sm transition-all hover:-translate-y-0.5
                              hover:bg-[#fffaf3]">
                  <Mail className="h-4 w-4" /> Email
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
};

export default BuiltBy;