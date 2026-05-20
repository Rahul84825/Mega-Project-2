import { NavLink } from "react-router-dom";
import { Truck, Clock, MapPin, Phone, Mail, ArrowLeft, Package, CheckCircle } from "lucide-react";

const SHIPPING_POINTS = [
  {
    icon: MapPin,
    title: "Local Delivery Area",
    desc: "We provide delivery services within Akurdi, Pune, and nearby areas in Pune. For deliveries outside this region, please contact us directly to discuss availability.",
  },
  {
    icon: Clock,
    title: "Processing Time",
    desc: "Orders are processed within 1–2 business days after confirmation. You will receive a call or message once your order is ready for dispatch.",
  },
  {
    icon: Truck,
    title: "Delivery Timeline",
    desc: "Local deliveries are typically completed within 2–4 business days of order processing. Delivery time may vary during festive seasons or high-demand periods.",
  },
  {
    icon: Package,
    title: "Order Tracking",
    desc: "Once your order is dispatched, you will be notified via phone call or WhatsApp with estimated delivery details. For any updates, feel free to contact us.",
  },
  {
    icon: CheckCircle,
    title: "Delivery Charges",
    desc: "Delivery within Akurdi and nearby areas is free for orders above ₹999. For orders below ₹999, a nominal delivery charge of ₹79 may apply. Self-pickup from our store is always free.",
  },
];

const ShippingPolicy = () => (
  <main className="min-h-screen bg-[#fff8f0] font-['Inter',system-ui,sans-serif]">

    {/* Header */}
    <div className="relative overflow-hidden border-b border-[rgba(83,44,22,0.10)] bg-[#fffaf3]">
      <div className="pointer-events-none absolute -right-16 -top-16 h-[360px] w-[360px]
                      rounded-full bg-[rgba(232,136,58,0.06)] blur-[70px]" />
      <div className="relative mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <NavLink to="/"
                 className="mb-4 inline-flex items-center gap-2 text-sm font-medium
                            text-[rgba(83,44,22,0.50)] transition-colors hover:text-[#7a2828]">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </NavLink>
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl
                          bg-[rgba(212,160,23,0.12)] ring-1 ring-[rgba(212,160,23,0.22)]">
            <Truck className="h-5 w-5 text-[#b76a1f]" />
          </div>
          <h1 className="text-3xl font-medium tracking-tight text-[#24140f] sm:text-4xl">
            Shipping Policy
          </h1>
        </div>
        <p className="max-w-xl text-[13px] leading-relaxed text-[#6e5443] sm:text-sm">
          Everything you need to know about how we deliver your orders from our store to your doorstep.
        </p>
      </div>
    </div>

    {/* Content */}
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="space-y-8 rounded-2xl border border-[rgba(83,44,22,0.10)]
                      bg-[#fffaf3] p-6 shadow-sm sm:p-10">

        {/* Intro */}
        <div className="space-y-3">
          <p className="text-[13px] leading-relaxed text-[#6e5443]">
            At{" "}
            <strong className="text-[#24140f]">Mithai World</strong>,
            we are committed to delivering your products safely and on time. We primarily serve
            customers in Akurdi, Pune, and surrounding areas in Pune.
          </p>
          <p className="text-[13px] leading-relaxed text-[#6e5443]">
            Customers can also visit our shop at{" "}
            <strong className="text-[#24140f]">
              Ekta Nagar, Akurdi Gaothan, Dattawadi, Viman Nagar, Pune, Maharashtra 411035
            </strong>{" "}
            for self-pickup.
          </p>
        </div>

        {/* Points */}
        <div className="space-y-4">
          {SHIPPING_POINTS.map(({ icon: Icon, title, desc }) => (
            <div key={title}
                 className="flex gap-4 rounded-xl border border-[rgba(83,44,22,0.10)]
                            bg-white p-4 transition-colors
                            hover:border-[rgba(212,160,23,0.30)]">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center
                              rounded-lg bg-[rgba(212,160,23,0.10)]">
                <Icon className="h-4 w-4 text-[#b76a1f]" />
              </div>
              <div>
                <h3 className="mb-1 text-sm font-medium text-[#24140f]">{title}</h3>
                <p className="text-[13px] leading-relaxed text-[#6e5443]">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Contact box */}
        <div className="rounded-xl border border-[rgba(212,160,23,0.25)]
                        bg-[rgba(212,160,23,0.07)] p-5">
          <h3 className="mb-2 text-sm font-medium text-[#24140f]">Questions about delivery?</h3>
          <p className="mb-3 text-[13px] leading-relaxed text-[#6e5443]">
            Reach out to us anytime for delivery-related queries:
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a href="tel:+919561878293"
               className="inline-flex items-center gap-2 text-sm font-medium
                          text-[#7a2828] hover:underline">
              <Phone className="h-4 w-4" /> +91 95618 78293
            </a>
            <a href="mailto:mithaiworld08@gmail.com"
               className="inline-flex items-center gap-2 text-sm font-medium
                          text-[#7a2828] hover:underline">
              <Mail className="h-4 w-4" /> mithaiworld08@gmail.com
            </a>
          </div>
        </div>

        <p className="border-t border-[rgba(83,44,22,0.08)] pt-4 text-center
                      text-xs text-[rgba(83,44,22,0.35)]">
          Last updated: March 2026 · Mithai World
        </p>
      </div>
    </div>
  </main>
);

export default ShippingPolicy;