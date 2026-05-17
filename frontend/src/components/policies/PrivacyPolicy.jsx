import { NavLink } from "react-router-dom";
import { Shield, ArrowLeft, Phone, Mail, Eye, Lock, Database, UserCheck, Bell } from "lucide-react";

const SECTIONS = [
  {
    icon: Database,
    title: "Information We Collect",
    content: [
      "When you place an order or contact us, we may collect your name, email address, phone number, and delivery address.",
      "We may also collect basic browsing data such as pages visited and time spent on our website to improve your shopping experience.",
      "We do not collect sensitive financial information. All payment processing is handled by secure third-party payment gateways.",
    ],
  },
  {
    icon: Eye,
    title: "How We Use Your Information",
    content: [
      "To process and fulfill your orders, including delivery and customer support.",
      "To communicate with you about your orders, promotions, or important updates.",
      "To improve our website, product offerings, and customer service based on feedback and browsing patterns.",
    ],
  },
  {
    icon: Lock,
    title: "Data Protection",
    content: [
      "Your personal information is stored securely and is only accessible to authorized personnel at Mahalaxmi Steels and Home Appliance.",
      "We use industry-standard security measures to protect your data from unauthorized access, alteration, or disclosure.",
      "We will never sell, rent, or share your personal information with third parties for their marketing purposes.",
    ],
  },
  {
    icon: UserCheck,
    title: "Third-Party Sharing",
    content: [
      "We may share your information with trusted delivery partners solely for the purpose of fulfilling your order.",
      "We may disclose information if required by law or to protect the rights and safety of our business and customers.",
      "We do not share your data with any third-party advertisers or marketing agencies.",
    ],
  },
  {
    icon: Bell,
    title: "Your Rights",
    content: [
      "You can request to view, update, or delete your personal information at any time by contacting us.",
      "You may opt out of promotional communications by replying 'STOP' or contacting us directly.",
      "If you have concerns about how your data is handled, please reach out and we will address them promptly.",
    ],
  },
];

const PrivacyPolicy = () => (
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
            <Shield className="h-5 w-5 text-[#b76a1f]" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#24140f] sm:text-4xl">
            Privacy Policy
          </h1>
        </div>
        <p className="max-w-xl text-[13px] leading-relaxed text-[#6e5443] sm:text-sm">
          Your privacy matters to us. Here's how we collect, use, and protect your personal information.
        </p>
      </div>
    </div>

    {/* Content */}
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="space-y-10 rounded-2xl border border-[rgba(83,44,22,0.10)]
                      bg-[#fffaf3] p-6 shadow-sm sm:p-10">

        {/* Intro */}
        <div className="space-y-3">
          <p className="text-[13px] leading-relaxed text-[#6e5443]">
            <strong className="text-[#24140f]">Mahalaxmi Steels and Home Appliance</strong>,
            owned by <strong className="text-[#24140f]">Sakharam Choudhary</strong>, is committed
            to protecting the privacy of our customers. This Privacy Policy explains what information
            we collect and how we use it when you visit our website or make a purchase.
          </p>
          <p className="text-[13px] leading-relaxed text-[#6e5443]">
            By using our website, you agree to the practices described in this policy.
          </p>
        </div>

        {/* Sections */}
        {SECTIONS.map(({ icon: Icon, title, content }) => (
          <div key={title}>
            <h2 className="mb-4 flex items-center gap-2 text-[15px] font-bold text-[#24140f]">
              <Icon className="h-4 w-4 text-[#b76a1f]" /> {title}
            </h2>
            <ul className="space-y-2">
              {content.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-[13px] leading-relaxed text-[#6e5443]">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#b76a1f]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* Contact box */}
        <div className="rounded-xl border border-[rgba(212,160,23,0.25)]
                        bg-[rgba(212,160,23,0.07)] p-5">
          <h3 className="mb-2 text-sm font-bold text-[#24140f]">Privacy concerns?</h3>
          <p className="mb-3 text-[13px] leading-relaxed text-[#6e5443]">
            If you have any questions about this Privacy Policy or how we handle your data, contact us:
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

export default PrivacyPolicy;