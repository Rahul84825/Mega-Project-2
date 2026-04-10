export default function OrderSuccessPage({ setPage, paymentInfo }) {
  const orderId = paymentInfo?.razorpayOrderId || paymentInfo?.razorpay_order_id || paymentInfo?.orderId || paymentInfo?._id;
  const itemCount = Array.isArray(paymentInfo?.items) ? paymentInfo.items.reduce((sum, item) => sum + (item?.qty || 1), 0) : 0;

  return (
    <div className="page-enter pattern-bg" style={{ minHeight: "100vh", padding: "64px 32px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", background: "white", border: "1px solid rgba(212,160,23,0.15)", padding: 40, textAlign: "center" }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
        <h1 className="serif" style={{ fontSize: 34, marginBottom: 12 }}>Order Placed Successfully</h1>
        <p style={{ color: "var(--muted)", marginBottom: 24 }}>
          Your sweets are being prepared with care. You can track payment and delivery details on the next screen.
        </p>

        <div style={{ display: "grid", gap: 12, marginBottom: 28, textAlign: "left", background: "var(--cream)", padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
            <span style={{ color: "var(--muted)" }}>Order ID</span>
            <strong>{orderId || "N/A"}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
            <span style={{ color: "var(--muted)" }}>Items</span>
            <strong>{itemCount || "N/A"}</strong>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button className="btn-primary" onClick={() => setPage("payment-success")} style={{ padding: "14px 24px" }}>
            View Payment & Delivery
          </button>
          <button className="btn-outline" onClick={() => setPage("home")} style={{ padding: "14px 24px" }}>
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
}
