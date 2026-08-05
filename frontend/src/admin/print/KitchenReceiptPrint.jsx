import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import KitchenReceipt from "./KitchenReceipt";
import "./print.css";

/**
 * KitchenReceiptPrint
 * Renders the thermal receipt into a standalone print portal
 * and triggers window.print() immediately on mount.
 */
const KitchenReceiptPrint = ({ order, onAfterPrint }) => {
  useEffect(() => {
    if (!order) return;

    const timestamp = Date.now();

    // Trigger browser print after render frame
    const timer = setTimeout(() => {
      window.print();
      if (onAfterPrint) {
        onAfterPrint();
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [order, onAfterPrint]);

  if (!order) return null;

  return createPortal(
    <div className="kitchen-receipt-print-wrapper">
      <KitchenReceipt order={order} printTimestamp={Date.now()} />
    </div>,
    document.body
  );
};

/**
 * Helper function to trigger printing direct from any order object
 */
export const triggerKitchenPrint = (order) => {
  if (!order) return;

  // Search for existing print node or create one dynamically
  let printContainer = document.getElementById("kitchen-bill-dynamic-print-root");
  if (!printContainer) {
    printContainer = document.createElement("div");
    printContainer.id = "kitchen-bill-dynamic-print-root";
    printContainer.className = "kitchen-receipt-print-wrapper";
    document.body.appendChild(printContainer);
  }

  // Create temporary container and trigger print
  window.print();
};

export default KitchenReceiptPrint;
