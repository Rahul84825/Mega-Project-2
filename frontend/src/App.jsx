import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AdminHeroBannerManager from "./admin/AdminHeroBannerManager";
import AdminCategories from "./admin/AdminCategories";
import AdminLayout from "./admin/AdminLayout";
import AdminDashboard from "./admin/AdminDashboard";
import AdminOffers from "./admin/AdminOffers";
import AdminOrders from "./admin/AdminOrders";
import AdminProductForm from "./admin/AdminProductForm";
import AdminProducts from "./admin/AdminProducts";
import CartDrawer from "./components/CartDrawer";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import { CartProvider } from "./context/CartContext";
import { ProductProvider } from "./context/ProductContext";
import Login from "./pages/Login";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import HomePage from "./pages/HomePage";
import OrderSuccessPage from "./pages/OrderSuccessPage";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import Register from "./pages/Register";
import GlobalStyle from "./utils/GlobalStyle";

export default function App() {
  const getInitialPage = () => (window.location.pathname.startsWith("/admin") ? "admin" : "home");

  const [page, setPage] = useState(getInitialPage);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
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
    const handlePopState = () => {
      setPage(window.location.pathname.startsWith("/admin") ? "admin" : "home");
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

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

  const setPageWithRoute = (nextPage) => {
    setPage(nextPage);

    if (nextPage === "admin") {
      if (!window.location.pathname.startsWith("/admin")) {
        window.history.pushState({}, "", "/admin");
      }
      return;
    }

    if (window.location.pathname.startsWith("/admin")) {
      window.history.pushState({}, "", "/");
    }
  };

  const renderPage = () => {
    const renderCatalogPage = (category, title) => (
      <HomePage
        setPage={setPageWithRoute}
        setSelectedProductId={setSelectedProductId}
        products={products}
        setProducts={setProducts}
        showHero={false}
        initialCategory={category}
        catalogTitle={title}
      />
    );

    switch (page) {
      case "home":
        return (
          <HomePage
            setPage={setPageWithRoute}
            setSelectedProductId={setSelectedProductId}
            products={products}
            setProducts={setProducts}
          />
        );
      case "all":
        return renderCatalogPage("all", "All Products");
      case "category":
        return renderCatalogPage(selectedCategory || "all", "Products");
      case "product":
        return selectedProductId ? (
          <ProductDetailPage
            productId={selectedProductId}
            setPage={setPageWithRoute}
            products={products}
          />
        ) : (
          <HomePage
            setPage={setPageWithRoute}
            setSelectedProductId={setSelectedProductId}
            products={products}
            setProducts={setProducts}
          />
        );
      case "cart":
        return <CartPage setPage={setPageWithRoute} />;
      case "checkout":
        return <CheckoutPage setPage={setPageWithRoute} setPaymentInfo={setPaymentInfo} setProducts={setProducts} />;
      case "order-success":
        return <OrderSuccessPage setPage={setPageWithRoute} paymentInfo={paymentInfo} />;
      case "payment-success":
        return <PaymentSuccessPage setPage={setPageWithRoute} paymentInfo={paymentInfo} setPaymentInfo={setPaymentInfo} onReturnHome={() => setPaymentInfo(null)} />;
      case "admin":
        return <AdminDashboard />;
      default:
        return (
          <HomePage
            setPage={setPageWithRoute}
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
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly>
              <ProductProvider>
                <AdminLayout />
              </ProductProvider>
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="products/add" element={<AdminProductForm mode="add" />} />
          <Route path="products/edit/:id" element={<AdminProductForm mode="edit" />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="offers" element={<AdminOffers />} />
          <Route path="hero-banners" element={<AdminHeroBannerManager />} />
          <Route path="brands" element={<Navigate to="/admin/products" replace />} />
        </Route>
        <Route
          path="*"
          element={
            <div style={{ minHeight: "100vh", background: "var(--cream)" }}>
              <Navbar page={page} selectedCategory={selectedCategory} setPage={setPageWithRoute} setCategory={setSelectedCategory} />
              <CartDrawer setPage={setPageWithRoute} />
              {renderPage()}
              <footer style={{ background: "var(--charcoal)", padding: "32px 32px", textAlign: "center" }}>
                <div className="serif" style={{ fontSize: 22, color: "var(--saffron)", marginBottom: 8 }}>Mithai World</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", letterSpacing: 1 }}>© 2025 · Crafting Sweetness Since 1985 · All Rights Reserved</div>
              </footer>
            </div>
          }
        />
      </Routes>
    </CartProvider>
  );
}
