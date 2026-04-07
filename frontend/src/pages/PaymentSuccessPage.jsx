export default function PaymentSuccessPage({ setPage, paymentInfo, onReturnHome }) {
  const orderId = paymentInfo?.razorpayOrderId || paymentInfo?.razorpay_order_id || paymentInfo?.orderId || paymentInfo?._id;
  const amount = paymentInfo?.amount ? (paymentInfo.amount / 100).toFixed(2) : null;

  return (
    <div className="page-enter pattern-bg" style={{ minHeight: "100vh", padding: "64px 32px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", background: "white", border: "1px solid rgba(212,160,23,0.15)", padding: 40, textAlign: "center" }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
        <h1 className="serif" style={{ fontSize: 34, marginBottom: 12 }}>Payment Successful</h1>
        <p style={{ color: "var(--muted)", marginBottom: 24 }}>Your order has been verified and sent for processing.</p>

        <div style={{ display: "grid", gap: 12, marginBottom: 28, textAlign: "left", background: "var(--cream)", padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
            <span style={{ color: "var(--muted)" }}>Order ID</span>
            <strong>{orderId || "N/A"}</strong>
          </div>
          {amount !== null && (
            <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
              <span style={{ color: "var(--muted)" }}>Amount</span>
              <strong>₹{amount}</strong>
            </div>
          )}
        </div>

        <button className="btn-primary" onClick={() => (onReturnHome ? onReturnHome() : setPage("home"))} style={{ padding: "14px 28px" }}>
          Continue Shopping
        </button>
      </div>
    </div>
  );
}