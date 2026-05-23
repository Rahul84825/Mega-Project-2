import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin, Phone, Mail, Clock, Send, Loader2,
  User, MessageSquare, AlertCircle, Truck, Info, CheckCircle2,
} from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import StoreMap from "./common/StoreMap";
import LocationCard from "./common/LocationCard";

// ── Field wrapper ──────────────────────────────────────────────────────────────
const Field = ({ icon: Icon, label, required, error, children }) => (
  <div className="flex flex-col">
    <label className="mb-2 flex items-center gap-1.5 text-[13px] font-medium text-[#3b2417]">
      <Icon className="h-3.5 w-3.5 text-[#b76a1f]" />
      {label}
      {required && <span className="ml-0.5 text-red-500">*</span>}
    </label>
    {children}
    {error && (
      <p className="mt-1.5 flex items-center gap-1 text-[11px] font-medium
                    tracking-wide text-red-500">
        <AlertCircle className="h-3 w-3" /> {error}
      </p>
    )}
  </div>
);

const inputCls = (err) =>
  `w-full rounded-xl border px-4 py-3 text-sm font-medium outline-none
   transition-all duration-200
   ${err
     ? "border-red-300 bg-red-50 text-red-900 placeholder:text-red-300 focus:ring-4 focus:ring-red-100"
     : "border-[rgba(83,44,22,0.15)] bg-[rgba(212,160,23,0.04)] text-[#1d120d] placeholder:text-[rgba(83,44,22,0.35)] hover:border-[rgba(83,44,22,0.28)] focus:border-[#d4a017] focus:bg-white focus:ring-4 focus:ring-[rgba(212,160,23,0.12)]"
   }`;

// ── Contact Page ──────────────────────────────────────────────────────────────
const Contact = () => {
  const { user } = useAuth();
  const [form, setForm]       = useState({ name: "", email: "", phone: "", message: "" });
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Pre-fill form if user is logged in
  useEffect(() => {
    if (user) {
      setForm((p) => ({
        ...p,
        name: p.name || user.name || "",
        email: p.email || user.email || "",
      }));
    }
  }, [user]);

  const validate = () => {
    const e = {};
    if (!form.name.trim())    e.name    = "Name is required";
    if (!form.email.trim())   e.email   = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email address";
    if (!form.phone.trim())   e.phone   = "Phone number is required";
    if (form.phone && !/^[6-9]\d{9}$/.test(form.phone)) e.phone = "Enter a valid 10-digit mobile number";
    if (!form.message.trim()) e.message = "Message is required";
    else if (form.message.trim().length < 10) e.message = "Message must be at least 10 characters";
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await api.post("/api/contact", {
        name:    form.name,
        email:   form.email,
        phone:   form.phone ? `+91${form.phone}` : "",
        subject: "Store Enquiry from Contact Page",
        message: form.message,
      });
      setSuccess(true);
      // Keep name and email if user is logged in
      setForm({
        name: user?.name || "",
        email: user?.email || "",
        phone: "",
        message: ""
      });
    } catch (err) {
      setErrors({ submit: err.message || "Something went wrong. Please try again or call us directly." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[60vh] bg-[#fff8f0] font-['Inter',system-ui,sans-serif]">

      {/* ── Page header ── */}
      <div className="relative overflow-hidden border-b border-[rgba(83,44,22,0.10)] bg-[#fffaf3]">
        <div className="pointer-events-none absolute -right-16 -top-16 h-[360px] w-[360px]
                        rounded-full bg-[rgba(232,136,58,0.07)] blur-[70px]" />
        <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.28em] text-[#9c6a18]">
            Get in Touch
          </p>
          <h1 className="mb-3 text-3xl font-medium tracking-tight text-[#24140f] sm:text-4xl">
            Contact Us
          </h1>
          <p className="max-w-xl text-[13px] font-medium leading-relaxed text-[#6e5443] sm:text-sm">
            We're here to help with your orders and queries
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-2 lg:gap-16">

          {/* ── Left: info ── */}
          <div className="flex flex-col gap-6">

            {/* Notice */}
            <div className="flex items-start gap-3 rounded-2xl border border-[rgba(212,160,23,0.25)]
                            bg-[rgba(212,160,23,0.07)] p-5">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#b76a1f]" />
              <div>
                <h3 className="mb-1 text-sm font-medium text-[#24140f]">Direct Assistance</h3>
                <p className="text-[13px] leading-relaxed text-[#6e5443]">
                  Need immediate help with a bulk order or delivery? Reach out to us directly through the channels below.
                </p>
              </div>
            </div>

            {/* Store info cards */}
            <LocationCard compact={false} />
          </div>

          {/* ── Right: form ── */}
          <div className="rounded-[2rem] border border-[rgba(83,44,22,0.10)]
                          bg-[#fffaf3] p-6 shadow-sm sm:p-8 lg:p-10">
            <h2 className="mb-2 text-xl font-medium tracking-tight text-[#24140f] sm:text-2xl">
              Send a Message
            </h2>
            <p className="mb-8 text-[13px] text-[#6e5443]">
              Prefer writing? Drop your details below and we'll call you back.
            </p>

            {errors.submit && (
              <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-100
                              bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                <AlertCircle className="h-4 w-4" /> {errors.submit}
              </div>
            )}

            {success && (
              <div className="mb-6 flex items-center gap-3 rounded-xl border
                              border-[rgba(212,160,23,0.25)] bg-[rgba(212,160,23,0.08)]
                              px-4 py-4 text-sm font-medium text-[#7a4a00]">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-[#b76a1f]" />
                Your message has been sent successfully. Our team will contact you shortly!
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div className="grid grid-cols-1 gap-5">
                <Field icon={User} label="Full Name" required error={errors.name}>
                  <input type="text" name="name" value={form.name} onChange={handleChange}
                         placeholder="Rahul Sharma" className={inputCls(errors.name)} />
                </Field>

                <Field icon={Mail} label="Email Address" required error={errors.email}>
                  <input type="email" name="email" value={form.email} onChange={handleChange}
                         placeholder="rahul@example.com" className={inputCls(errors.email)} />
                </Field>

                <Field icon={Phone} label="Phone Number" required error={errors.phone}>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 select-none
                                     text-sm font-medium text-[rgba(83,44,22,0.55)]">
                      +91
                    </span>
                    <input type="tel" name="phone" value={form.phone} onChange={handleChange}
                           placeholder="98765 43210" maxLength={10}
                           className={`${inputCls(errors.phone)} pl-12`} />
                  </div>
                </Field>

                <Field icon={MessageSquare} label="Your Message" required error={errors.message}>
                  <textarea name="message" value={form.message} onChange={handleChange}
                            rows={4} placeholder="How can we help you?"
                            className={`${inputCls(errors.message)} resize-none`} />
                </Field>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl
                           bg-[#7a2828] py-3.5 text-sm font-medium text-white shadow-md
                           shadow-[rgba(122,40,40,0.20)] transition-all hover:-translate-y-0.5
                           hover:bg-[#6b2020] disabled:translate-y-0 disabled:cursor-not-allowed
                           disabled:bg-[rgba(83,44,22,0.25)]"
              >
                {loading
                  ? <><Loader2 className="h-5 w-5 animate-spin" /> Sending Message…</>
                  : <><Send className="h-4 w-4" /> Send Message</>
                }
              </button>
            </form>
          </div>

        </div>

        {/* Map Section */}
        <div className="mt-16">
          <h2 className="mb-6 text-xl font-medium tracking-tight text-[#24140f]">
            Find Us on the Map
          </h2>
          <StoreMap size="large" showTitle={false} />
        </div>

      </div>
    </main>
  );
};

export default Contact;