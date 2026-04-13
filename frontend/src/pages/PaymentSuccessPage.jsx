import { useEffect, useMemo, useState } from "react";
import { getApiErrorMessage, resendDeliveryOTP, verifyDeliveryOTP } from "../services/api";
import { socket } from "../services/socket";

const OTP_RESEND_COOLDOWN_SECONDS = 30;
const OTP_RESEND_MAX_ATTEMPTS = 3;

const getResendCooldownFromOrder = (order) => {
  if (!order?.otpLastSentAt) {
    return 0;
  }

  const elapsedSeconds = Math.floor((Date.now() - new Date(order.otpLastSentAt).getTime()) / 1000);
  return Math.max(0, OTP_RESEND_COOLDOWN_SECONDS - elapsedSeconds);
};

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
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [maxResendReached, setMaxResendReached] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    setOrder(normalizeOrder(paymentInfo));
  }, [paymentInfo]);

  useEffect(() => {
    setResendCooldown(getResendCooldownFromOrder(order));
    setMaxResendReached((order?.otpResendCount || 0) >= OTP_RESEND_MAX_ATTEMPTS);
  }, [order]);

  useEffect(() => {
    if (resendCooldown <= 0) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [resendCooldown]);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setToast("");
    }, 2500);

    return () => {
      window.clearTimeout(timer);
    };
  }, [toast]);

  const orderId = useMemo(
    () => order?.razorpayOrderId || order?.razorpay_order_id || order?.orderId || order?._id,
    [order]
  );

  const amount = order?.amount ? String(Math.round(order.amount / 100)) : null;
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
      setErrorMessage(getApiErrorMessage(error, "Failed to verify OTP."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (!orderId || resendCooldown > 0 || maxResendReached) {
      return;
    }

    setResending(true);
    setMessage("");
    setErrorMessage("");

    try {
      const response = await resendDeliveryOTP({ orderId: order._id || orderId });

      if (!response?.success) {
        throw new Error(response?.message || "Failed to resend OTP");
      }

      if (response?.order) {
        setOrder(response.order);
        if (setPaymentInfo) {
          setPaymentInfo(response.order);
        }
      }

      setResendCooldown(OTP_RESEND_COOLDOWN_SECONDS);
      const reachedLimit = (response?.order?.otpResendCount || 0) >= OTP_RESEND_MAX_ATTEMPTS;
      setMaxResendReached(reachedLimit);
      setToast("OTP resent successfully");
      setMessage("OTP resent successfully");
    } catch (error) {
      const nextError = getApiErrorMessage(error, "Failed to resend OTP.");
      setErrorMessage(nextError);
      setToast(nextError);

      if (nextError === "Maximum resend attempts reached") {
        setMaxResendReached(true);
      }

      if (nextError === "Please wait before requesting OTP again") {
        setResendCooldown((prev) => Math.max(prev, OTP_RESEND_COOLDOWN_SECONDS));
      }
    } finally {
      setResending(false);
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

  if (!orderId) {
    return (
      <div className="page-enter pattern-bg" style={{ minHeight: "100vh", padding: "64px 32px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", background: "white", border: "1px solid rgba(212,160,23,0.15)", padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>📦</div>
          <h1 className="serif" style={{ fontSize: 34, marginBottom: 12 }}>Order Not Found</h1>
          <p style={{ color: "var(--muted)", marginBottom: 24 }}>We could not load your payment details. Please return to the shop and try again.</p>
          <button className="btn-primary" onClick={() => setPage("home")} style={{ padding: "14px 28px" }}>
            Back to Shop
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter pattern-bg" style={{ minHeight: "100vh", padding: "64px 32px" }}>
      {toast && (
        <div
          style={{
            position: "fixed",
            right: 20,
            top: 20,
            zIndex: 60,
            background: "#1A0F0A",
            color: "white",
            padding: "10px 14px",
            border: "1px solid rgba(244,160,36,0.3)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
            fontSize: 12
          }}
        >
          {toast}
        </div>
      )}

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
                <button
                  className="btn-outline"
                  onClick={handleResendOtp}
                  disabled={resending || resendCooldown > 0 || maxResendReached}
                  style={{
                    padding: "13px 20px",
                    opacity: resending || resendCooldown > 0 || maxResendReached ? 0.7 : 1,
                    cursor: resending || resendCooldown > 0 || maxResendReached ? "not-allowed" : "pointer"
                  }}
                >
                  {resending
                    ? "Resending..."
                    : resendCooldown > 0
                      ? `Resend in ${resendCooldown}s`
                      : maxResendReached
                        ? "Max resend reached"
                        : "Resend OTP"}
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

        <button className="btn-primary" disabled={submitting} onClick={() => (onReturnHome ? onReturnHome() : setPage("home"))} style={{ padding: "14px 28px", opacity: submitting ? 0.7 : 1, cursor: submitting ? "not-allowed" : "pointer" }}>
          Continue Shopping
        </button>
      </div>
    </div>
  );
}