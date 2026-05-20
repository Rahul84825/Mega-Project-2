import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CheckCircle2, Package, Truck, MapPin, Phone, Home, ArrowRight, AlertCircle } from "lucide-react";
import { formatCurrency, TAX_MESSAGE } from "../utils/priceCalculator";
import { socket } from "../services/socket";

function PaymentSuccessPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [order, setOrder] = useState(location.state?.order || null);

  const orderId = order?._id || order?.id;

  useEffect(() => {
    if (!orderId) return;

    if (!socket.connected) socket.connect();

    const handleUpdate = (updated) => {
      if (updated._id === orderId) setOrder(updated);
    };

    socket.on("order:updated", handleUpdate);
    return () => { socket.off("order:updated", handleUpdate); };
  }, [orderId]);

  if (!order) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-10 bg-[var(--cream)]">
        <div className="bg-white p-10 rounded-3xl border border-[var(--surface-border)] shadow-xl text-center max-w-md">
          <div className="h-20 w-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6 text-amber-500">
            <AlertCircle size={40} />
          </div>
          <h2 className="serif text-3xl mb-4 text-[var(--charcoal)]">Order Not Found</h2>
          <p className="text-[var(--muted)] mb-8">We couldn't retrieve your order details. If you've just placed an order, it might take a moment to sync.</p>
          <button onClick={() => navigate("/")} className="btn-primary w-full">Return to Shop</button>
        </div>
      </div>
    );
  }

  const status = (order.status || "PLACED").toUpperCase();

  return (
    <div className="page-enter min-h-[60vh] bg-[var(--cream)] pattern-bg px-4 py-12 md:py-20">
      <div className="max-w-3xl mx-auto">
        {/* ── SUCCESS HEADER ── */}
        <div className="bg-white rounded-t-3xl border-x border-t border-[var(--surface-border)] p-8 md:p-12 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-green-500" />
          <div className="h-20 w-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500 shadow-inner">
            <CheckCircle2 size={40} />
          </div>
          <h1 className="serif text-4xl md:text-5xl mb-3 text-[var(--charcoal)]">Order Placed!</h1>
          <p className="text-[var(--muted)] font-medium">Thank you for choosing Mithai World. Your treats are being prepared with love.</p>
          
          <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--surface-strong)] text-[var(--burgundy)] font-medium text-sm uppercase tracking-widest">
            Order #{order.orderNumber || order._id?.slice(-6).toUpperCase()}
          </div>
        </div>

        {/* ── STATUS TRACKER ── */}
        <div className="bg-white border-x border-[var(--surface-border)] p-8 border-t border-dashed">
          <div className="flex justify-between relative">
            <div className="absolute top-5 left-0 w-full h-0.5 bg-[var(--surface-strong)] -z-0" />
            <div className="absolute top-5 left-0 h-0.5 bg-green-500 transition-all duration-1000 -z-0" 
                 style={{ width: status === 'DELIVERED' ? '100%' : status === 'READY' ? '66%' : status === 'PREPARING' ? '33%' : '10%' }} />
            
            {[
              { label: 'Placed', icon: Package, active: true },
              { label: 'Preparing', icon: Home, active: ['PREPARING', 'READY', 'DELIVERED'].includes(status) },
              { label: 'Out for Delivery', icon: Truck, active: ['READY', 'DELIVERED'].includes(status) },
              { label: 'Delivered', icon: CheckCircle2, active: status === 'DELIVERED' }
            ].map((s, i) => (
              <div key={i} className="flex flex-col items-center gap-3 relative z-10">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center border-2 transition-colors duration-500 ${s.active ? 'bg-white border-green-500 text-green-500' : 'bg-white border-[var(--surface-border)] text-[var(--muted)]'}`}>
                  <s.icon size={20} />
                </div>
                <span className={`text-[10px] font-medium uppercase tracking-widest ${s.active ? 'text-green-600' : 'text-[var(--muted)]'}`}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── DETAILS GRID ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 bg-white border-x border-b border-[var(--surface-border)] rounded-b-3xl overflow-hidden shadow-2xl shadow-[var(--burgundy)]/5">
          <div className="p-8 border-r border-[var(--surface-border)] border-t">
            <h3 className="text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--gold)] mb-4">Delivery Details</h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <MapPin size={16} className="text-[var(--muted)] shrink-0" />
                <div className="text-sm font-medium text-[var(--charcoal)]">
                  {order.shippingAddress?.line1}, {order.shippingAddress?.city}, {order.shippingAddress?.postalCode}
                </div>
              </div>
              <div className="flex gap-3 text-sm">
                <Phone size={16} className="text-[var(--muted)] shrink-0" />
                <div className="font-medium text-[var(--charcoal)]">{order.customer?.phone}</div>
              </div>
            </div>
          </div>

          <div className="p-8 border-t bg-[var(--cream)]/30">
            <h3 className="text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--gold)] mb-4">Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium text-[var(--muted)]">
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm font-medium text-[var(--muted)]">
                <span>Delivery</span>
                <span>{order.deliveryFee > 0 ? formatCurrency(order.deliveryFee) : 'FREE'}</span>
              </div>
              <div className="h-px bg-[var(--surface-border)] my-2" />
              <div className="flex justify-between text-lg font-medium text-[var(--charcoal)]">
                <span>Total</span>
                <span className="text-[var(--burgundy)]">{formatCurrency(order.total)}</span>
              </div>
              <p className="text-[9px] text-[var(--muted)] italic mt-2">{TAX_MESSAGE}</p>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button onClick={() => navigate("/")} className="btn-primary px-10 h-14 w-full sm:w-auto shadow-lg">
            Continue Shopping
          </button>
          <button onClick={() => navigate("/sweets")} className="btn-outline px-10 h-14 w-full sm:w-auto">
            Order More Sweets
          </button>
        </div>
      </div>
    </div>
  );
}

export default PaymentSuccessPage;
