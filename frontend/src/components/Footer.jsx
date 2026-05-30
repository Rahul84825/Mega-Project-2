import { NavLink, useNavigate } from "react-router-dom";
import {
  MapPin, Phone, Mail, Clock,
  Instagram, MessageCircle,
  Shield, Truck, RefreshCw,
  ChevronRight,
} from "lucide-react";
import brandLogo from "../assets/logo.png"

// ── Data ─────────────────────────────────────────────────────────────────────
const QUICK_LINKS = [
  { label: "Home", to: "/" },
  { label: "All Products", to: "/sweets" },
  { label: "My Orders", to: "/my-orders" },
  { label: "About Us", to: "/about" },
  { label: "Contact Us", to: "/contact" },
];

const SUPPORT_LINKS = [
  { label: "Shipping Policy", to: "/shipping-policy" },
  { label: "Returns & Exchanges", to: "/returns-exchanges" },
  { label: "Terms & Conditions", to: "/terms-conditions" },
  { label: "Privacy Policy", to: "/privacy-policy" },
];

const CONTACT_INFO = [
  {
    icon: MapPin,
    label: "Address",
    value: "Shop no. 04, Roshma Residency, Central Line, near HDFC Bank, Konark Nagar, Viman Nagar, Pune 411014",
    href: null,
  },
  {
    icon: Phone,
    label: "Phone",
    value: "+91 98581 06106",
    href: "tel:+919858106106",
  },
  {
    icon: Mail,
    label: "Email",
    value: "mithaipune@gmail.com",
    href: "mailto:mithaipune@gmail.com",
  },
  {
    icon: Clock,
    label: "Hours",
    value: "Mon – Sun: 9:00 AM – 10:00 PM",
    href: null,
  },
];

const TRUST_BADGES = [
  { icon: Shield, label: "Authentic Products" },
  { icon: Truck, label: "Store Pickup Available" },
  { icon: RefreshCw, label: "GST Billing" },
];

const SOCIAL = [
  {
    icon: MessageCircle,
    label: "WhatsApp",
    href: "https://wa.me/919511289914",
    hover: "hover:bg-green-500 hover:border-green-500 hover:text-white hover:shadow-lg hover:shadow-green-500/20",
  },
  {
    icon: Instagram,
    label: "Instagram",
    href: "https://instagram.com/mithaiworld",
    hover: "hover:bg-pink-600 hover:border-pink-600 hover:text-white hover:shadow-lg hover:shadow-pink-600/20",
  },
];

// ── Footer ────────────────────────────────────────────────────────────────────
const Footer = () => {
  const navigate = useNavigate();
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden bg-[#1e0f0a] font-['Inter',system-ui,sans-serif]">

      {/* Warm ambient glow */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-28 w-4/5 -translate-x-1/2
                      rounded-full bg-[rgba(122,40,40,0.18)] blur-[80px]" />

      {/* ── Main section ── */}
      <div className="relative z-10">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 pt-14 pb-12">

          {/* Brand row + trust badges */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6
                          pb-10 border-b border-white/[0.08]">

            <button
              onClick={() => navigate("/")}
              className="group flex items-center gap-2 sm:gap-4 shrink-0 transition-all duration-500 hover:scale-105 active:scale-95"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-[var(--gold)]/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-700" />
                <img src={brandLogo} alt="Logo" className="relative object-contain transition-all duration-700 ease-out h-16 w-16 sm:h-20 sm:w-20 group-hover:rotate-0" />
              </div>
            </button>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-2">
              {TRUST_BADGES.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10
                                 bg-white/5 px-3.5 py-2 text-xs font-medium text-[rgba(255,248,240,0.70)]
                                 transition-colors duration-150
                                 hover:border-[rgba(232,136,58,0.25)] hover:bg-[rgba(232,136,58,0.10)]
                                 hover:text-[rgba(255,248,240,0.90)]"
                >
                  <Icon className="h-3.5 w-3.5 shrink-0 text-[#e8883a]" />
                  {label}
                </div>
              ))}
            </div>

          </div>

          {/* 4-col grid */}
          <div className="grid grid-cols-1 gap-10 pt-12 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">

            {/* Col 1 — About + Social */}
            <div className="sm:col-span-2 lg:col-span-4 lg:pr-6">
              <p className="mb-6 max-w-[340px] text-[13px] font-normal leading-[1.75]
                                text-[rgba(255,248,240,0.55)]">
                Your trusted destination for authentic Indian sweets, handcrafted daily
                with the finest ingredients. Proudly serving customers across India.
              </p>

              <div className="flex items-center gap-2.5">
                {SOCIAL.map(({ icon: Icon, label, href, hover }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className={`flex h-[38px] w-[38px] items-center justify-center rounded-xl
                                    border border-white/[0.12] bg-white/[0.06]
                                    text-[rgba(255,248,240,0.70)] no-underline
                                    transition-all duration-200 hover:-translate-y-0.5 ${hover}`}
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
                <span className="ml-1 text-[10px] font-medium uppercase tracking-[0.16em]
                                     text-[rgba(255,248,240,0.30)]">
                  Follow us
                </span>
              </div>
            </div>

            {/* Col 2 — Quick Links */}
            <div className="lg:col-span-2">
              <h4 className="mb-5 text-[11px] font-medium uppercase tracking-[0.16em] text-[#fff8f0]">
                Quick Links
              </h4>
              <ul className="flex flex-col gap-2.5 p-0 m-0 list-none">
                {QUICK_LINKS.map(({ label, to }) => (
                  <li key={label}>
                    <NavLink
                      to={to}
                      className="group inline-flex items-center gap-0 text-[13px] font-medium
                                     text-[rgba(255,248,240,0.65)] no-underline
                                     transition-all duration-150 hover:gap-1.5 hover:text-[#e8883a]"
                    >
                      <ChevronRight className="h-3 w-3 shrink-0 text-[#e8883a] opacity-0
                                                   -translate-x-1.5 transition-all duration-150
                                                   group-hover:opacity-100 group-hover:translate-x-0" />
                      {label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 3 — Support */}
            <div className="lg:col-span-3">
              <h4 className="mb-5 text-[11px] font-medium uppercase tracking-[0.16em] text-[#fff8f0]">
                Support
              </h4>
              <ul className="flex flex-col gap-2.5 p-0 m-0 list-none">
                {SUPPORT_LINKS.map(({ label, to }) => (
                  <li key={label}>
                    <NavLink
                      to={to}
                      className="group inline-flex items-center gap-0 text-[13px] font-medium
                                     text-[rgba(255,248,240,0.65)] no-underline
                                     transition-all duration-150 hover:gap-1.5 hover:text-[#e8883a]"
                    >
                      <ChevronRight className="h-3 w-3 shrink-0 text-[#e8883a] opacity-0
                                                   -translate-x-1.5 transition-all duration-150
                                                   group-hover:opacity-100 group-hover:translate-x-0" />
                      {label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 4 — Contact */}
            <div className="lg:col-span-3">
              <h4 className="mb-5 text-[11px] font-medium uppercase tracking-[0.16em] text-[#fff8f0]">
                Contact Us
              </h4>
              <ul className="flex flex-col gap-4 p-0 m-0 list-none">
                {CONTACT_INFO.map(({ icon: Icon, label, value, href }) => (
                  <li key={label} className="group flex items-start gap-3">
                    {/* Icon box */}
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl
                                        border border-white/10 bg-white/[0.06]
                                        transition-colors duration-150
                                        group-hover:border-[rgba(232,136,58,0.35)]
                                        group-hover:bg-[rgba(232,136,58,0.15)]">
                      <Icon className="h-3.5 w-3.5 text-[#e8883a]" />
                    </div>
                    <div>
                      <p className="mb-0.5 text-[9px] font-medium uppercase tracking-[0.18em]
                                       text-[rgba(255,248,240,0.30)]">
                        {label}
                      </p>
                      {href ? (
                        <a
                          href={href}
                          className="text-xs font-medium text-[rgba(255,248,240,0.70)] no-underline
                                         transition-colors duration-150 hover:text-[#e8883a]"
                        >
                          {value}
                        </a>
                      ) : (
                        <p className="m-0 max-w-[200px] text-xs font-medium leading-relaxed
                                          text-[rgba(255,248,240,0.70)]">
                          {value}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="relative z-10 border-t border-white/[0.07] bg-black/25">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">

            <p className="text-xs font-medium text-[rgba(255,248,240,0.35)]">
              © {year}{" "}
              <span className="font-medium text-[rgba(255,248,240,0.60)]">Mithai World</span>
              . All rights reserved.
            </p>

            <div className="flex items-center gap-4">
              <p className="flex items-center gap-1.5 text-xs font-medium
                                text-[rgba(255,248,240,0.30)]">
                Made with{" "}
                <span className="text-[#e8883a]">♥</span>
                {" "}in Maharashtra
              </p>

              <span className="hidden h-1 w-1 rounded-full bg-white/15 sm:block" />

              <NavLink
                to="/built-by"
                className="text-xs font-medium text-[rgba(255,248,240,0.30)] no-underline
                               transition-colors duration-150 hover:text-[#e8883a]"
              >
                Who built this?
              </NavLink>
            </div>

          </div>
        </div>
      </div>

    </footer>
  );
};

export default Footer;
