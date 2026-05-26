export const ORDER_TABS = [
  {
    id: "NEW",
    label: "New Orders",
    statuses: ["PLACED"],
    tone: "bg-amber-100 text-amber-900"
  },
  {
    id: "PREPARING",
    label: "Preparing",
    statuses: ["PREPARING"],
    tone: "bg-orange-100 text-orange-900"
  },
  {
    id: "READY",
    label: "Ready",
    statuses: ["READY"],
    tone: "bg-yellow-100 text-yellow-900"
  },
  {
    id: "DELIVERED",
    label: "Delivered",
    statuses: ["PICKED_UP", "DELIVERED"],
    tone: "bg-emerald-100 text-emerald-900"
  },
  {
    id: "REJECTED",
    label: "Rejected",
    statuses: ["REJECTED"],
    tone: "bg-rose-100 text-rose-900"
  }
];

export const STATUS_META = {
  PLACED: { label: "Placed", cls: "bg-amber-100 text-amber-900" },
  PREPARING: { label: "Preparing", cls: "bg-orange-100 text-orange-900" },
  READY: { label: "Ready", cls: "bg-yellow-100 text-yellow-900" },
  PICKED_UP: { label: "Picked Up", cls: "bg-blue-100 text-blue-900" },
  DELIVERED: { label: "Delivered", cls: "bg-emerald-100 text-emerald-900" },
  REJECTED: { label: "Rejected", cls: "bg-rose-100 text-rose-900" }
};

export const PAYMENT_STATUS_META = {
  PENDING: { label: "Pending", cls: "bg-amber-100 text-amber-900" },
  AUTHORIZED: { label: "Authorized", cls: "bg-blue-100 text-blue-900" },
  PAID: { label: "Paid", cls: "bg-emerald-100 text-emerald-900" },
  PARTIALLY_REFUNDED: { label: "Partially Refunded", cls: "bg-purple-100 text-purple-900" },
  REFUNDED: { label: "Refunded", cls: "bg-gray-100 text-gray-900" },
  FAILED: { label: "Failed", cls: "bg-rose-100 text-rose-900" }
};

export const PAYMENT_METHOD_META = {
  UPI: { label: "UPI", cls: "bg-emerald-100 text-emerald-900" },
  CARD: { label: "Card", cls: "bg-blue-100 text-blue-900" },
  NETBANKING: { label: "Netbanking", cls: "bg-indigo-100 text-indigo-900" },
  WALLET: { label: "Wallet", cls: "bg-violet-100 text-violet-900" },
  RAZORPAY: { label: "Razorpay", cls: "bg-slate-100 text-slate-900" }
};

export const resolveStatus = (order) => String(order?.status || "PLACED").toUpperCase();

export const resolvePaymentStatus = (order) =>
  String(order?.payment?.status || order?.paymentStatus || "PENDING").toUpperCase();

export const resolvePaymentMethod = (order) =>
  String(order?.payment?.method || order?.paymentMethod || "RAZORPAY").toUpperCase();
