import { useEffect, useState } from "react";
import {
  getApiErrorMessage,
  resendDeliveryOTP,
  updateDeliveryStatus,
  verifyDeliveryOTP
} from "../services/api";

const OTP_RESEND_COOLDOWN_SECONDS = 30;
const OTP_RESEND_MAX_ATTEMPTS = 3;

const getResendCooldownFromOrder = (order) => {
  if (!order?.otpLastSentAt) {
    return 0;
  }

  const elapsedSeconds = Math.floor((Date.now() - new Date(order.otpLastSentAt).getTime()) / 1000);
  return Math.max(0, OTP_RESEND_COOLDOWN_SECONDS - elapsedSeconds);
};

export default function OrderManager({
  orders,
  setOrders,
  initialLoading,
  setDashboardError,
  showAdminNotice,
  highlightedOrderId,
  getOrderId,
  upsertOrder
}) {
  const [deliveryOtpByOrder, setDeliveryOtpByOrder] = useState({});
  const [markingOrderId, setMarkingOrderId] = useState(null);
  const [verifyingOrderId, setVerifyingOrderId] = useState(null);
  const [resendingOrderId, setResendingOrderId] = useState(null);
  const [resendCooldownByOrder, setResendCooldownByOrder] = useState({});
  const [maxResendReachedByOrder, setMaxResendReachedByOrder] = useState({});

  useEffect(() => {
    const nextCooldownMap = {};
    const nextMaxReachedMap = {};

    orders.forEach((order) => {
      const orderId = getOrderId(order);
      if (!orderId) {
        return;
      }

      nextCooldownMap[orderId] = getResendCooldownFromOrder(order);
      nextMaxReachedMap[orderId] = (order?.otpResendCount || 0) >= OTP_RESEND_MAX_ATTEMPTS;
    });

    setResendCooldownByOrder(nextCooldownMap);
    setMaxResendReachedByOrder(nextMaxReachedMap);
  }, [orders, getOrderId]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setResendCooldownByOrder((prev) => {
        const next = { ...prev };
        let hasChange = false;

        Object.keys(next).forEach((orderId) => {
          if (next[orderId] > 0) {
            next[orderId] -= 1;
            hasChange = true;
          }
        });

        return hasChange ? next : prev;
      });
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  const markOrderOutForDelivery = async (order) => {
    const orderId = getOrderId(order);

    if (!orderId) {
      return;
    }

    try {
      setMarkingOrderId(orderId);
      setDashboardError("");
      const response = await updateDeliveryStatus({ orderId, deliveryStatus: "out_for_delivery" });

      if (!response?.success) {
        throw new Error(response?.message || "Failed to mark order as out for delivery");
      }

      upsertOrder(response.order || { ...order, deliveryStatus: "out_for_delivery" }, true);
      showAdminNotice("OTP sent to customer");
    } catch (error) {
      setDashboardError(getApiErrorMessage(error, "Failed to update delivery status."));
    } finally {
      setMarkingOrderId(null);
    }
  };

  const handleOtpInputChange = (orderId, value) => {
    setDeliveryOtpByOrder((prev) => ({
      ...prev,
      [orderId]: value.replace(/\D/g, "").slice(0, 4)
    }));
  };

  const verifyDeliveryOtp = async (order) => {
    const orderId = getOrderId(order);
    const otpValue = deliveryOtpByOrder[orderId] || "";

    if (!orderId) {
      return;
    }

    if (!otpValue) {
      showAdminNotice("Enter the OTP first");
      return;
    }

    try {
      setVerifyingOrderId(orderId);
      setDashboardError("");
      const response = await verifyDeliveryOTP({ orderId, otp: otpValue });

      if (!response?.success) {
        throw new Error(response?.message || "Failed to verify OTP");
      }

      upsertOrder(response.order || { ...order, deliveryStatus: "delivered", deliveryVerified: true }, true);
      setDeliveryOtpByOrder((prev) => ({ ...prev, [orderId]: "" }));
      showAdminNotice("OTP verified. Order marked delivered");
    } catch (error) {
      setDashboardError(getApiErrorMessage(error, "Failed to verify OTP."));
    } finally {
      setVerifyingOrderId(null);
    }
  };

  const resendOtp = async (order) => {
    const orderId = getOrderId(order);

    if (!orderId) {
      return;
    }

    if ((maxResendReachedByOrder[orderId] || false) || (resendCooldownByOrder[orderId] || 0) > 0) {
      return;
    }

    try {
      setResendingOrderId(orderId);
      setDashboardError("");
      const response = await resendDeliveryOTP({ orderId });

      if (!response?.success) {
        throw new Error(response?.message || "Failed to resend OTP");
      }

      if (response?.order) {
        upsertOrder(response.order, true);
      }

      setResendCooldownByOrder((prev) => ({
        ...prev,
        [orderId]: OTP_RESEND_COOLDOWN_SECONDS
      }));

      if ((response?.order?.otpResendCount || 0) >= OTP_RESEND_MAX_ATTEMPTS) {
        setMaxResendReachedByOrder((prev) => ({
          ...prev,
          [orderId]: true
        }));
      }

      showAdminNotice("OTP resent successfully");
    } catch (error) {
      const message = getApiErrorMessage(error, "Failed to resend OTP.");
      setDashboardError(message);

      if (message === "Maximum resend attempts reached") {
        setMaxResendReachedByOrder((prev) => ({
          ...prev,
          [orderId]: true
        }));
      }

      if (message === "Please wait before requesting OTP again") {
        setResendCooldownByOrder((prev) => ({
          ...prev,
          [orderId]: Math.max(prev[orderId] || 0, OTP_RESEND_COOLDOWN_SECONDS)
        }));
      }
    } finally {
      setResendingOrderId(null);
    }
  };

  const getDeliveryLabel = (status) => ({
    pending: "Pending",
    out_for_delivery: "Out for Delivery",
    delivered: "Delivered"
  }[status] || "Pending");

  const getDeliveryColor = (status) => ({
    pending: "#B7950B",
    out_for_delivery: "#1A5276",
    delivered: "#2C6E49"
  }[status] || "#888");

  return (
    <div>
      <h2 className="serif" style={{ fontSize: 24, color: "white", marginBottom: 20 }}>Orders</h2>
      {initialLoading && <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, marginBottom: 12 }}>Loading orders...</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {orders.map((o) => {
          const orderId = getOrderId(o);
          const deliveryStatus = o.deliveryStatus || "pending";
          const resendCooldown = resendCooldownByOrder[orderId] || 0;
          const maxResendReached = maxResendReachedByOrder[orderId] || false;
          const resendDisabled =
            deliveryStatus !== "out_for_delivery" ||
            resendingOrderId === orderId ||
            resendCooldown > 0 ||
            maxResendReached;

          return (
            <div
              key={orderId}
              style={{
                background: highlightedOrderId === orderId ? "rgba(244,160,36,0.16)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${highlightedOrderId === orderId ? "rgba(244,160,36,0.55)" : "rgba(244,160,36,0.1)"}`,
                boxShadow: highlightedOrderId === orderId ? "0 0 0 1px rgba(244,160,36,0.25), 0 0 28px rgba(244,160,36,0.25)" : "none",
                padding: 24,
                display: "flex",
                alignItems: "center",
                gap: 24,
                flexWrap: "wrap",
                transition: "background 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease"
              }}
            >
              <div style={{ minWidth: 120 }}>
                <div style={{ fontSize: 11, color: "var(--saffron)", letterSpacing: 1 }}>{orderId}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>{o.items?.length || o.items || 0} items</div>
              </div>

              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ color: "white", fontWeight: 500 }}>{o.customer?.name || o.customer || "Customer"}</div>
                <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                  <span className="badge" style={{ background: `${getDeliveryColor(deliveryStatus)}22`, color: getDeliveryColor(deliveryStatus), textTransform: "capitalize" }}>
                    {getDeliveryLabel(deliveryStatus)}
                  </span>
                  {o.deliveryVerified && (
                    <span className="badge" style={{ background: "rgba(44,110,73,0.16)", color: "#2C6E49" }}>
                      OTP Verified
                    </span>
                  )}
                </div>
              </div>

              <div className="serif" style={{ fontSize: 22, color: "var(--saffron)", fontWeight: 700 }}>
                ₹{o.total || o.amount || 0}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 260 }}>
                <button
                  onClick={() => markOrderOutForDelivery(o)}
                  disabled={markingOrderId === orderId || deliveryStatus === "out_for_delivery" || deliveryStatus === "delivered"}
                  style={{
                    background: markingOrderId === orderId || deliveryStatus === "out_for_delivery" || deliveryStatus === "delivered" ? "rgba(255,255,255,0.08)" : "var(--saffron)",
                    border: "none",
                    color: markingOrderId === orderId || deliveryStatus === "out_for_delivery" || deliveryStatus === "delivered" ? "rgba(255,255,255,0.45)" : "#1A0F0A",
                    padding: "10px 14px",
                    fontSize: 12,
                    cursor: markingOrderId === orderId || deliveryStatus === "out_for_delivery" || deliveryStatus === "delivered" ? "not-allowed" : "pointer",
                    fontFamily: "DM Sans, sans-serif",
                    fontWeight: 700
                  }}
                >
                  {markingOrderId === orderId ? "Sending OTP..." : deliveryStatus === "out_for_delivery" ? "OTP Sent" : deliveryStatus === "delivered" ? "Delivered" : "Mark as Out for Delivery"}
                </button>

                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    value={deliveryOtpByOrder[orderId] || ""}
                    onChange={(e) => handleOtpInputChange(orderId, e.target.value)}
                    placeholder="Enter OTP"
                    inputMode="numeric"
                    style={{
                      flex: 1,
                      minWidth: 0,
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(244,160,36,0.18)",
                      color: "white",
                      padding: "10px 12px",
                      fontSize: 13,
                      outline: "none"
                    }}
                  />

                  <button
                    disabled={verifyingOrderId === orderId || !(deliveryOtpByOrder[orderId] || "")}
                    onClick={() => verifyDeliveryOtp(o)}
                    style={{
                      background: "transparent",
                      border: "1px solid rgba(244,160,36,0.35)",
                      color: "var(--saffron)",
                      padding: "10px 14px",
                      fontSize: 12,
                      cursor: verifyingOrderId === orderId || !(deliveryOtpByOrder[orderId] || "") ? "not-allowed" : "pointer",
                      opacity: verifyingOrderId === orderId || !(deliveryOtpByOrder[orderId] || "") ? 0.65 : 1,
                      fontFamily: "DM Sans, sans-serif",
                      whiteSpace: "nowrap"
                    }}
                  >
                    {verifyingOrderId === orderId ? "Verifying..." : "Verify OTP"}
                  </button>

                  <button
                    disabled={resendDisabled}
                    onClick={() => resendOtp(o)}
                    style={{
                      background: "transparent",
                      border: "1px solid rgba(255,255,255,0.25)",
                      color: "rgba(255,255,255,0.92)",
                      padding: "10px 14px",
                      fontSize: 12,
                      cursor: resendDisabled ? "not-allowed" : "pointer",
                      opacity: resendDisabled ? 0.65 : 1,
                      fontFamily: "DM Sans, sans-serif",
                      whiteSpace: "nowrap"
                    }}
                  >
                    {resendingOrderId === orderId
                      ? "Resending..."
                      : resendCooldown > 0
                        ? `Resend in ${resendCooldown}s`
                        : maxResendReached
                          ? "Max resend reached"
                          : "Resend OTP"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
