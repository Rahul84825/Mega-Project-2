import { useEffect, useMemo, useState } from "react";

const resolveEta = (order) => {
  const readyBy = order?.preparation?.readyBy ? new Date(order.preparation.readyBy) : null;
  if (readyBy && Number.isFinite(readyBy.getTime())) {
    return readyBy;
  }

  const acceptedAt = order?.statusTimestamps?.acceptedAt ? new Date(order.statusTimestamps.acceptedAt) : null;
  const etaMinutes = Number(order?.preparation?.etaMinutes ?? null);
  if (acceptedAt && Number.isFinite(acceptedAt.getTime()) && Number.isFinite(etaMinutes)) {
    return new Date(acceptedAt.getTime() + etaMinutes * 60 * 1000);
  }

  return null;
};

const formatDuration = (ms) => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
};

const OrderTimer = ({ order }) => {
  const target = useMemo(() => resolveEta(order), [order]);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!target) {
      return undefined;
    }

    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [target]);

  if (!target) {
    return (
      <div className="text-xs text-[#7a5c3a]">ETA: To be confirmed</div>
    );
  }

  const remaining = target.getTime() - now;
  const isOverdue = remaining <= 0;

  return (
    <div className={`text-xs font-semibold ${isOverdue ? "text-rose-600" : "text-[#6d4c41]"}`}>
      {isOverdue ? "Overdue" : "Ready in"} {formatDuration(Math.abs(remaining))}
    </div>
  );
};

export default OrderTimer;
