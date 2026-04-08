import { useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import { CartProvider } from "./context/CartContext";
import AdminDashboard from "./pages/AdminDashboard";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import HomePage from "./pages/HomePage";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import GlobalStyle from "./utils/GlobalStyle";

export default function App() {
  const [page, setPage] = useState("home");
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [products, setProducts] = useState([]);
  const [paymentInfo, setPaymentInfo] = useState(() => {
    try {
      const storedOrder = localStorage.getItem("mithai-world-current-order");
      return storedOrder ? JSON.parse(storedOrder) : null;
    } catch (_error) {
      return null;
    }
  });

  useEffect(() => {
    try {
      if (paymentInfo) {
        localStorage.setItem("mithai-world-current-order", JSON.stringify(paymentInfo));
      } else {
        localStorage.removeItem("mithai-world-current-order");
      }
    } catch (_error) {
      // Ignore storage errors in constrained environments.
    }
  }, [paymentInfo]);

  const renderPage = () => {
    switch (page) {
      case "home":
        return (
          <HomePage
            setPage={setPage}
            setSelectedProductId={setSelectedProductId}
            products={products}
            setProducts={setProducts}
          />
        );
      case "product":
        return selectedProductId ? (
          <ProductDetailPage
            productId={selectedProductId}
            setPage={setPage}
            products={products}
          />
        ) : (
          <HomePage
            setPage={setPage}
            setSelectedProductId={setSelectedProductId}
            products={products}
            setProducts={setProducts}
          />
        );
      case "cart":
        return <CartPage setPage={setPage} />;
      case "checkout":
        return <CheckoutPage setPage={setPage} setPaymentInfo={setPaymentInfo} />;
      case "payment-success":
        return <PaymentSuccessPage setPage={setPage} paymentInfo={paymentInfo} setPaymentInfo={setPaymentInfo} onReturnHome={() => setPaymentInfo(null)} />;
      case "admin":
        return <AdminDashboard />;
      default:
        return (
          <HomePage
            setPage={setPage}
            setSelectedProductId={setSelectedProductId}
            products={products}
            setProducts={setProducts}
          />
        );
    }
  };

  return (
    <CartProvider>
      <GlobalStyle />
      <div style={{ minHeight: "100vh", background: "var(--cream)" }}>
        <Navbar page={page} setPage={setPage} />
        {renderPage()}
        <footer style={{ background: "var(--charcoal)", padding: "32px 32px", textAlign: "center" }}>
          <div className="serif" style={{ fontSize: 22, color: "var(--saffron)", marginBottom: 8 }}>Mithai World</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", letterSpacing: 1 }}>© 2025 · Crafting Sweetness Since 1985 · All Rights Reserved</div>
        </footer>
      </div>
    </CartProvider>
  );
}
