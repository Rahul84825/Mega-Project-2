import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ShieldCheck, AlertCircle, RefreshCw, PhoneCall } from "lucide-react";
import { useProducts } from "../context/ProductContext";
import { useCart } from "../context/CartContext";
import api, { getApiErrorMessage } from "../services/api";

function PaymentProcessingPage() {
  const navigate = useNavigate();
  const { fetchProducts } = useProducts();
  const { dispatch } = useCart();

  const [status, setStatus] = useState("verifying"); // 'verifying' | 'reassuring' | 'success' | 'failure'
  const [errorMessage, setErrorMessage] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [loadingText, setLoadingText] = useState("Securing connection & verifying payment...");
  
  const verificationDataRef = useRef(null);
  const isMountedRef = useRef(true);
  const verifyTimeoutRef = useRef(null);

  // Load pending transaction on mount
  useEffect(() => {
    isMountedRef.current = true;
    const rawData = sessionStorage.getItem("mithai-world-pending-verification");
    if (!rawData) {
      setStatus("failure");
      setErrorMessage("No pending payment details found. If you were charged, please contact customer support.");
      return;
    }
    
    try {
      verificationDataRef.current = JSON.parse(rawData);
    } catch (e) {
      console.error("Failed to parse verification data:", e);
      setStatus("failure");
      setErrorMessage("Invalid payment details. Please contact support.");
    }

    return () => {
      isMountedRef.current = false;
      if (verifyTimeoutRef.current) clearTimeout(verifyTimeoutRef.current);
    };
  }, []);

  // Update loading message sequentially to keep user engaged and patient
  useEffect(() => {
    if (status !== "verifying" && status !== "reassuring") return;

    const timer1 = setTimeout(() => {
      if (isMountedRef.current) {
        setStatus("reassuring");
        setLoadingText("Reserving your fresh sweets & updating inventory...");
      }
    }, 4000);

    const timer2 = setTimeout(() => {
      if (isMountedRef.current) {
        setLoadingText("Confirming with payment gateway (this may take a moment)...");
      }
    }, 9000);

    const timer3 = setTimeout(() => {
      if (isMountedRef.current) {
        setLoadingText("Finalizing order creation. Please do not close this window...");
      }
    }, 15000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [status]);

  const verifyPayment = async () => {
    if (!verificationDataRef.current) return;
    setStatus("verifying");
    setErrorMessage("");

    try {
      const payload = {
        razorpay_order_id: verificationDataRef.current.razorpay_order_id,
        razorpay_payment_id: verificationDataRef.current.razorpay_payment_id,
        razorpay_signature: verificationDataRef.current.razorpay_signature,
        orderData: verificationDataRef.current.orderData
      };

      console.log("Processing page verify payload:", payload);

      const { data } = await api.post("/api/payment/verify", payload, {
        timeout: 25000 // Give plenty of time for database transactions and cold starts
      });

      if (!isMountedRef.current) return;

      if (data.success) {
        setStatus("success");
        // Clear pending session state on success
        sessionStorage.removeItem("mithai-world-pending-verification");
        if (data.order?._id) {
          sessionStorage.setItem("last_order_id", data.order._id);
        }
        dispatch({ type: "CLEAR" });
        fetchProducts().catch(console.error);

        // Brief delay before redirecting for premium visual confirmation
        setTimeout(() => {
          navigate("/payment-success", { state: { order: data.order }, replace: true });
        }, 1500);
      } else {
        throw new Error(data.message || "Payment verification failed");
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      console.error("Verification attempt failed:", err);

      const status = err?.response?.status;
      // If order already created (409 Conflict), consider it a success and navigate
      if (status === 409) {
        console.log("Order was already created (409 Conflict), redirecting to success");
        setStatus("success");
        sessionStorage.removeItem("mithai-world-pending-verification");
        if (err?.response?.data?.order?._id) {
          sessionStorage.setItem("last_order_id", err.response.data.order._id);
        }
        dispatch({ type: "CLEAR" });
        fetchProducts().catch(console.error);
        navigate("/payment-success", { state: { order: err.response.data.order }, replace: true });
        return;
      }

      // Auto-retry once on network/server errors
      if (retryCount < 1) {
        setRetryCount(prev => prev + 1);
        setLoadingText("Network delay detected. Retrying verification...");
        verifyTimeoutRef.current = setTimeout(() => {
          verifyPayment();
        }, 3000);
      } else {
        setStatus("failure");
        setErrorMessage(getApiErrorMessage(err, "Payment verification timed out. If you were charged, please contact customer support."));
      }
    }
  };

  // Start verification once data is loaded
  useEffect(() => {
    if (verificationDataRef.current && retryCount === 0) {
      verifyPayment();
    }
  }, [retryCount]);

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center p-4 bg-[var(--cream)] pattern-bg">
      <div className="bg-white p-8 md:p-12 rounded-3xl border border-[var(--surface-border)] shadow-2xl text-center max-w-lg w-full transition-all duration-500">
        
        {/* Verification in progress or success */}
        {(status === "verifying" || status === "reassuring") && (
          <div className="space-y-6">
            <div className="relative h-24 w-24 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-[var(--burgundy)]/10 border-t-[var(--burgundy)] animate-spin" />
              <ShieldCheck size={36} className="text-[var(--burgundy)] animate-bounce" />
            </div>
            <div className="space-y-3">
              <h2 className="serif text-2xl md:text-3xl text-[var(--charcoal)]">Verifying Payment</h2>
              <p className="text-xs md:text-sm text-[var(--muted)] font-medium leading-relaxed max-w-sm mx-auto">
                {loadingText}
              </p>
            </div>
            <div className="p-4 bg-[var(--surface-strong)]/30 rounded-2xl border border-[var(--surface-border)] text-[10px] text-[var(--muted)] font-semibold uppercase tracking-wider">
              Please do not click back, refresh, or close this window.
            </div>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-6 animate-in zoom-in-95 duration-500">
            <div className="h-24 w-24 bg-green-50 rounded-full flex items-center justify-center mx-auto text-green-500 shadow-inner">
              <ShieldCheck size={48} className="animate-bounce" />
            </div>
            <div className="space-y-2">
              <h2 className="serif text-2xl md:text-3xl text-green-600">Payment Secured!</h2>
              <p className="text-sm text-[var(--muted)] font-medium">
                Your order is confirmed. Redirecting you now...
              </p>
            </div>
          </div>
        )}

        {status === "failure" && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="h-20 w-20 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500 shadow-inner">
              <AlertCircle size={40} />
            </div>
            <div className="space-y-3">
              <h2 className="serif text-2xl text-[var(--charcoal)]">Verification Pending</h2>
              <p className="text-xs md:text-sm text-red-600 font-bold leading-relaxed max-w-sm mx-auto">
                {errorMessage}
              </p>
              {verificationDataRef.current?.razorpay_payment_id && (
                <div className="p-3 bg-[var(--surface-strong)]/40 rounded-xl text-xs font-mono text-[var(--charcoal)] border border-[var(--surface-border)] max-w-xs mx-auto">
                  Payment ID: {verificationDataRef.current.razorpay_payment_id}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 pt-4">
              <button 
                onClick={verifyPayment}
                className="btn-primary w-full h-12 flex items-center justify-center gap-2 font-bold"
              >
                <RefreshCw size={16} /> Retry Verification
              </button>
              
              <a 
                href="tel:+919881988751" 
                className="btn-outline w-full h-12 flex items-center justify-center gap-2 font-bold"
              >
                <PhoneCall size={16} /> Contact Support
              </a>
            </div>

            <p className="text-[10px] text-[var(--muted)] leading-tight max-w-xs mx-auto">
              Our automated system (Razorpay Webhook) is also reconciling this payment. Your order will not be lost.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default PaymentProcessingPage;
