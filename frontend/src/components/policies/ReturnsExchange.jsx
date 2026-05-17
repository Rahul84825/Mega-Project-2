import { NavLink } from "react-router-dom";
import { RefreshCw, ArrowLeft, Phone, Mail, AlertCircle, CheckCircle, XCircle, Clock } from "lucide-react";

const ELIGIBLE = [
  "The product arrived damaged, broken, or defective.",
  "You received the wrong item or a different variant than ordered.",
  "The product has a manufacturing defect that affects its use.",
];

const NOT_ELIGIBLE = [
  "The product has been used, washed, or altered in any way.",
  "The original packaging, tags, or labels are missing or damaged.",
  "The return request is made after the 2-day window.",
  "The product was damaged due to misuse after delivery.",
];

const STEPS = [
  { step: "1", title: "Contact Us",         desc: "Reach out via phone (+91 95618 78293) or email within 2 days of receiving your order." },
  { step: "2", title: "Share Details",      desc: "Provide your order details and photos of the damaged or defective product for quick verification." },
  { step: "3", title: "Return the Product", desc: "Once approved, bring the product back to our store in its original packaging, or we'll arrange a pickup for local orders." },
  { step: "4", title: "Get Replacement",    desc: "After inspection, we will provide a replacement product. If the same product is unavailable, a store credit or refund will be offered." },
];

const ReturnsExchange = () => (
  <main className="min-h-screen bg-[#fff8f0] font-['Inter',system-ui,sans-serif]">

    {/* Header */}
    <div className="relative overflow-hidden border-b border-[rgba(83,44,22,0.10)] bg-[#fffaf3]">
      <div className="pointer-events-none absolute -right-16 -top-16 h-[360px] w-[360px]
                      rounded-full bg-[rgba(232,136,58,0.06)] blur-[70px]" />
      <div className="relative mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <NavLink to="/"
                 className="mb-4 inline-flex items-center gap-2 text-sm font-bold
                            text-[rgba(83,44,22,0.50)] transition-colors hover:text-[#7a2828]">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </NavLink>
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl
                          bg-[rgba(212,160,23,0.12)] ring-1 ring-[rgba(212,160,23,0.22)]">
            <RefreshCw className="h-5 w-5 text-[#b76a1f]" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#24140f] sm:text-4xl">
            Returns & Exchanges
          </h1>
        </div>
        <p className="max-w-xl text-[13px] leading-relaxed text-[#6e5443] sm:text-sm">
          We want you to be fully satisfied with your purchase. Here's how we handle returns and replacements.
        </p>
      </div>
    </div>

    {/* Content */}
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="space-y-10 rounded-2xl border border-[rgba(83,44,22,0.10)]
                      bg-[#fffaf3] p-6 shadow-sm sm:p-10">

        {/* Intro */}
        <p className="text-[13px] leading-relaxed text-[#6e5443]">
          At <strong className="text-[#24140f]">Mahalaxmi Steels and Home Appliance</strong>,
          owned by <strong className="text-[#24140f]">Sakharam Choudhary</strong>, we stand
          behind the quality of every product we sell. If you receive a damaged or defective item,
          we offer a hassle-free replacement within 2 days of delivery.
        </p>

        {/* 2-day window banner */}
        <div className="flex items-start gap-3 rounded-xl border border-[rgba(212,160,23,0.28)]
                        bg-[rgba(212,160,23,0.08)] p-5">
          <Clock className="mt-0.5 h-5 w-5 shrink-0 text-[#b76a1f]" />
          <div>
            <h3 className="mb-1 text-sm font-bold text-[#24140f]">2-Day Return Window</h3>
            <p className="text-[13px] leading-relaxed text-[#6e5443]">
              All return or exchange requests must be made within{" "}
              <strong className="text-[#24140f]">2 days</strong> of receiving the product.
              Requests made after this window will not be accepted.
            </p>
          </div>
        </div>

        {/* Eligible */}
        <div>
          <h2 className="mb-4 flex items-center gap-2 text-[15px] font-bold text-[#24140f]">
            <CheckCircle className="h-4 w-4 text-[#22c55e]" /> Eligible for Return / Exchange
          </h2>
          <ul className="space-y-2">
            {ELIGIBLE.map((item) => (
              <li key={item} className="flex items-start gap-3 text-[13px] leading-relaxed text-[#6e5443]">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#22c55e]" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Not eligible */}
        <div>
          <h2 className="mb-4 flex items-center gap-2 text-[15px] font-bold text-[#24140f]">
            <XCircle className="h-4 w-4 text-red-500" /> Not Eligible for Return / Exchange
          </h2>
          <ul className="space-y-2">
            {NOT_ELIGIBLE.map((item) => (
              <li key={item} className="flex items-start gap-3 text-[13px] leading-relaxed text-[#6e5443]">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Steps */}
        <div>
          <h2 className="mb-5 text-[15px] font-bold text-[#24140f]">
            How to Request a Return
          </h2>
          <div className="space-y-4">
            {STEPS.map(({ step, title, desc }) => (
              <div key={step}
                   className="flex gap-4 rounded-xl border border-[rgba(83,44,22,0.10)]
                              bg-white p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg
                                bg-[#7a2828] text-sm font-bold text-white">
                  {step}
                </div>
                <div>
                  <h3 className="mb-1 text-sm font-bold text-[#24140f]">{title}</h3>
                  <p className="text-[13px] leading-relaxed text-[#6e5443]">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact box */}
        <div className="rounded-xl border border-[rgba(212,160,23,0.25)]
                        bg-[rgba(212,160,23,0.07)] p-5">
          <h3 className="mb-2 text-sm font-bold text-[#24140f]">Need help with a return?</h3>
          <p className="mb-2 text-[13px] leading-relaxed text-[#6e5443]">
            Visit our store or contact us for quick resolution:
          </p>
          <p className="mb-3 text-[13px] text-[#6e5443]">
            <strong className="text-[#24140f]">Store:</strong> Ekta Nagar, Akurdi Gaothan,
            Dattawadi, Akurdi, Pune, Maharashtra 411035
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a href="tel:+919561878293"
               className="inline-flex items-center gap-2 text-sm font-bold
                          text-[#7a2828] hover:underline">
              <Phone className="h-4 w-4" /> +91 95618 78293
            </a>
            <a href="mailto:mahalaxmisteels08@gmail.com"
               className="inline-flex items-center gap-2 text-sm font-bold
                          text-[#7a2828] hover:underline">
              <Mail className="h-4 w-4" /> mahalaxmisteels08@gmail.com
            </a>
          </div>
        </div>

        <p className="border-t border-[rgba(83,44,22,0.08)] pt-4 text-center
                      text-xs text-[rgba(83,44,22,0.35)]">
          Last updated: March 2026 · Mahalaxmi Steels and Home Appliance
        </p>
      </div>
    </div>
  </main>
);

export default ReturnsExchange;