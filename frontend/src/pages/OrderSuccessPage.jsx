import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2, Package, Truck, Clock, Phone, MessageSquare } from "lucide-react";
import StoreMap from "../components/common/StoreMap";
import LocationCard from "../components/common/LocationCard";

function OrderSuccessPage({ paymentInfo }) {
  const location = useLocation();
  const navigate = useNavigate();
  const stateOrder = location?.state?.order;
  const order = stateOrder || paymentInfo;
  const orderId = order?.razorpayOrderId || order?.razorpay_order_id || order?.orderId || order?._id;
  const itemCount = Array.isArray(paymentInfo?.items)
    ? paymentInfo.items.reduce((sum, item) => sum + (item?.quantity || item?.qty || 1), 0)
    : 0;

  return (
    <main className="min-h-screen bg-[#fff8f0] font-['Inter',system-ui,sans-serif]">
      {/* ── Success Header ── */}
      <div className="relative overflow-hidden border-b border-[rgba(83,44,22,0.10)] bg-[#fffaf3]">
        <div className="pointer-events-none absolute -right-16 -top-16 h-[360px] w-[360px]
                        rounded-full bg-[rgba(232,136,58,0.07)] blur-[70px]" />
        <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full
                            bg-[#22c55e] shadow-lg shadow-[rgba(34,197,94,0.30)]">
              <CheckCircle2 className="h-6 w-6 text-white" />
            </div>
            <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-[#22c55e]">
              Order Confirmed
            </p>
          </div>
          <h1 className="mb-3 text-3xl font-medium tracking-tight text-[#24140f] sm:text-4xl">
            Order Placed Successfully!
          </h1>
          <p className="max-w-xl text-[13px] font-medium leading-relaxed text-[#6e5443] sm:text-sm">
            Your sweets are being prepared with care. We'll keep you updated every step of the way.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        
        {/* ── Order Summary ── */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16 mb-12">
          {/* Order Details Card */}
          <div className="rounded-2xl border border-[rgba(83,44,22,0.10)] bg-white p-8 shadow-sm">
            <h2 className="mb-6 text-lg font-medium tracking-tight text-[#24140f]">Order Details</h2>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4 pb-4 border-b border-[rgba(83,44,22,0.07)]">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg
                                bg-[rgba(212,160,23,0.10)] ring-1 ring-[rgba(212,160,23,0.18)]">
                  <Package className="h-4 w-4 text-[#b76a1f]" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[rgba(83,44,22,0.40)]">
                    Order ID
                  </p>
                  <p className="mt-1 text-sm font-medium text-[#24140f]">{orderId || "N/A"}</p>
                </div>
              </div>

              <div className="flex items-start gap-4 pb-4 border-b border-[rgba(83,44,22,0.07)]">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg
                                bg-[rgba(212,160,23,0.10)] ring-1 ring-[rgba(212,160,23,0.18)]">
                  <Clock className="h-4 w-4 text-[#b76a1f]" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[rgba(83,44,22,0.40)]">
                    Items Count
                  </p>
                  <p className="mt-1 text-sm font-medium text-[#24140f]">{itemCount || "N/A"} items</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg
                                bg-[rgba(212,160,23,0.10)] ring-1 ring-[rgba(212,160,23,0.18)]">
                  <Truck className="h-4 w-4 text-[#b76a1f]" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[rgba(83,44,22,0.40)]">
                    Next Step
                  </p>
                  <p className="mt-1 text-sm font-medium text-[#24140f]">View Payment & Delivery Details</p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3">
              <button 
                onClick={() => navigate("/payment-success", { state: { order } })}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#7a2828]
                           py-3.5 text-sm font-medium text-white shadow-md shadow-[rgba(122,40,40,0.20)]
                           transition-all hover:-translate-y-0.5 hover:bg-[#6b2020]">
                <Truck className="h-4 w-4" /> View Payment & Delivery
              </button>
              <button 
                onClick={() => navigate("/")}
                className="flex items-center justify-center gap-2 rounded-xl border
                           border-[rgba(83,44,22,0.15)] bg-white py-3.5 text-sm font-medium
                           text-[#3b2417] shadow-sm transition-all hover:bg-[#fffaf3]">
                Continue Shopping
              </button>
            </div>
          </div>

          {/* Support Section */}
          <div className="flex flex-col gap-4">
            {/* Quick Support Notice */}
            <div className="rounded-2xl border border-[rgba(212,160,23,0.25)]
                            bg-[rgba(212,160,23,0.07)] p-5">
              <h3 className="mb-3 text-sm font-medium text-[#24140f]">Need Help?</h3>
              <p className="mb-4 text-[13px] leading-relaxed text-[#6e5443]">
                Have questions about your order? Our team is here to help!
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <a href="tel:+919511289914"
                   className="flex items-center justify-center gap-2 rounded-lg bg-[#1e0f0a]
                              py-2.5 text-sm font-medium text-white shadow-sm transition-all
                              hover:-translate-y-0.5 hover:shadow-md">
                  <Phone className="h-4 w-4" /> Call Now
                </a>
                <a href="https://wa.me/919511289914" target="_blank" rel="noopener noreferrer"
                   className="flex items-center justify-center gap-2 rounded-lg bg-[#22c55e]
                              py-2.5 text-sm font-medium text-white shadow-sm transition-all
                              hover:-translate-y-0.5 hover:bg-[#16a34a] hover:shadow-md">
                  <MessageSquare className="h-4 w-4" /> WhatsApp
                </a>
              </div>
            </div>

            {/* Store Location Card */}
            <LocationCard compact={true} />
          </div>
        </div>

        {/* ── Map Section ── */}
        <div className="mb-12">
          <h2 className="mb-6 text-xl font-medium tracking-tight text-[#24140f]">
            Visit Our Store
          </h2>
          <p className="mb-6 text-[13px] text-[#6e5443]">
            Pick up your order in person or visit us for more variety. Open Mon–Sun, 9:00 AM – 10:00 PM
          </p>
          <StoreMap size="medium" showTitle={false} />
        </div>

        {/* ── Next Steps ── */}
        <div className="rounded-2xl border border-[rgba(83,44,22,0.10)] bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-lg font-medium tracking-tight text-[#24140f]">What Happens Next?</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              {
                step: "1",
                title: "Preparation",
                desc: "Your sweets are being prepared fresh with our premium ingredients."
              },
              {
                step: "2",
                title: "Quality Check",
                desc: "We perform a quality inspection to ensure perfection before dispatch."
              },
              {
                step: "3",
                title: "Delivery",
                desc: "Your order is on its way! We'll send updates to track your delivery."
              },
            ].map(({ step, title, desc }) => (
              <div key={step} className="relative">
                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full
                                bg-[#7a2828] text-sm font-bold text-white">
                  {step}
                </div>
                <h3 className="mb-1 text-sm font-medium text-[#24140f]">{title}</h3>
                <p className="text-[13px] text-[#6e5443]">{desc}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}

export default OrderSuccessPage;
