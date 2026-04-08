import { useEffect, useMemo, useState } from "react";
import { verifyDeliveryOTP } from "../services/api";
import { socket } from "../services/socket";

const normalizeOrder = (order) => {
  if (!order || typeof order !== "object") {
    return null;
  }

  return order;
};

export default function PaymentSuccessPage({ setPage, paymentInfo, setPaymentInfo, onReturnHome }) {
  const [order, setOrder] = useState(() => normalizeOrder(paymentInfo));
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setOrder(normalizeOrder(paymentInfo));
  }, [paymentInfo]);

  const orderId = useMemo(
    () => order?.razorpayOrderId || order?.razorpay_order_id || order?.orderId || order?._id,
    [order]
  );

  const amount = order?.amount ? (order.amount / 100).toFixed(2) : null;
  const deliveryStatus = order?.deliveryStatus || "pending";

  useEffect(() => {
    if (!orderId) {
      return undefined;
    }

    socket.auth = { role: "user" };

    if (!socket.connected) {
      socket.connect();
    }

    const handleOrderUpdated = (updatedOrder) => {
      const updatedOrderId = updatedOrder?.razorpayOrderId || updatedOrder?.razorpay_order_id || updatedOrder?.orderId || updatedOrder?._id;

      if (!updatedOrderId || String(updatedOrderId) !== String(orderId)) {
        return;
      }

      setOrder(updatedOrder);
      if (setPaymentInfo) {
        setPaymentInfo(updatedOrder);
      }
    };

    socket.off("orderUpdated", handleOrderUpdated);
    socket.on("orderUpdated", handleOrderUpdated);

    return () => {
      socket.off("orderUpdated", handleOrderUpdated);
      socket.disconnect();
    };
  }, [orderId, setPaymentInfo]);

  const handleVerifyDeliveryOTP = async () => {
    if (!orderId || !otp.trim()) {
      setErrorMessage("Enter the OTP shared by the delivery person.");
      return;
    }

    setSubmitting(true);
    setMessage("");
    setErrorMessage("");

    try {
      const response = await verifyDeliveryOTP({ orderId: order._id || orderId, otp: otp.trim() });

      if (!response?.success) {
        throw new Error(response?.message || "OTP verification failed");
      }

      setOrder(response.order);
      setOtp("");
      setMessage("Delivery verified successfully.");
      if (setPaymentInfo) {
        setPaymentInfo(response.order);
      }
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || error.message || "Failed to verify OTP.");
    } finally {
      setSubmitting(false);
    }
  };

  const statusText = {
    pending: "Pending",
    out_for_delivery: "Out for Delivery",
    delivered: "Delivered"
  }[deliveryStatus] || "Pending";

  const statusColor = {
    pending: "#B7950B",
    out_for_delivery: "#1A5276",
    delivered: "#2C6E49"
  }[deliveryStatus] || "#B7950B";

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

        <div style={{ textAlign: "left", background: "rgba(244,160,36,0.06)", border: "1px solid rgba(244,160,36,0.18)", padding: 20, marginBottom: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 12 }}>
            <strong className="serif" style={{ fontSize: 20 }}>Delivery Status</strong>
            <span className="badge" style={{ background: `${statusColor}20`, color: statusColor, textTransform: "capitalize" }}>
              {statusText}
            </span>
          </div>

          {deliveryStatus === "pending" && (
            <p style={{ margin: 0, color: "var(--muted)", fontSize: 14 }}>Your order is being prepared. You will see OTP verification when it is dispatched.</p>
          )}

          {deliveryStatus === "out_for_delivery" && (
            <div style={{ display: "grid", gap: 12 }}>
              <p style={{ margin: 0, color: "var(--muted)", fontSize: 14 }}>Your order is on the way. Enter the OTP shared by the delivery person to confirm delivery.</p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <input
                  className="input-field"
                  inputMode="numeric"
                  placeholder="Enter delivery OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  style={{ maxWidth: 220 }}
                />
                <button className="btn-primary" onClick={handleVerifyDeliveryOTP} disabled={submitting} style={{ padding: "13px 20px" }}>
                  {submitting ? "Verifying..." : "Verify OTP"}
                </button>
              </div>
            </div>
          )}

          {deliveryStatus === "delivered" && (
            <p style={{ margin: 0, color: "#2C6E49", fontSize: 14, fontWeight: 600 }}>Delivery confirmed. Thank you for ordering from Mithai World.</p>
          )}

          {message && <div style={{ marginTop: 12, color: "#2C6E49", fontSize: 13 }}>{message}</div>}
          {errorMessage && <div style={{ marginTop: 12, color: "#B00020", fontSize: 13 }}>{errorMessage}</div>}
        </div>

        <button className="btn-primary" onClick={() => (onReturnHome ? onReturnHome() : setPage("home"))} style={{ padding: "14px 28px" }}>
          Continue Shopping
        </button>
      </div>
    </div>
  );
}