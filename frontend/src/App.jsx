import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { App as CapApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { SplashScreen as CapSplashScreen } from "@capacitor/splash-screen";

// ── UTILS ──
/**
 * lazyRetry Utility
 * Fixes "Failed to fetch dynamically imported module" errors after a new deployment.
 * If a module fails to load (due to old cache), it forces a page refresh to get the latest build.
 */
const lazyRetry = (componentImport) => {
  return lazy(async () => {
    try {
      return await componentImport();
    } catch (error) {
      console.error("Failed to load component, refreshing...", error);
      
      const hasRefreshed = sessionStorage.getItem("retry-refreshed") || "false";
      if (hasRefreshed === "false") {
        sessionStorage.setItem("retry-refreshed", "true");
        // Force a hard reload from the server to bypass browser cache
        window.location.reload(true);
        return { default: () => null }; 
      }
      
      // If we already refreshed and it still fails, it's a real error
      throw error; 
    }
  });
};

// Core Components (always loaded)
import CartDrawer from "./components/CartDrawer";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import ScrollToTop from "./components/ScrollToTop";
import ErrorBoundary from "./components/ErrorBoundary";
import { CartProvider } from "./context/CartContext";
import { ProductProvider } from "./context/ProductContext";
import { useAuth } from "./context/AuthContext";
import GlobalStyle from "./services/utils/GlobalStyle";
import PromotionBar from "./components/common/PromotionBar";
import AnnouncementPopup from "./components/common/AnnouncementPopup";

// Store Pages (core pages, loaded early)
import HomePage from "./pages/HomePage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProductsPage from "./pages/ProductsPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import OrderSuccessPage from "./pages/OrderSuccessPage";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import MyOrders from "./pages/MyOrders";

// Policy Pages (lazy loaded)
const ShippingPolicy = lazyRetry(() => import("./pages/policies/ShippingPolicy"));
const PrivacyPolicy = lazyRetry(() => import("./pages/policies/PrivacyPolicy"));
const ReturnsExchange = lazyRetry(() => import("./pages/policies/ReturnsExchange"));
const TermsConditions = lazyRetry(() => import("./pages/policies/TermsConditions"));

// Store Components (lazy loaded)
const About = lazyRetry(() => import("./components/About"));
const Contact = lazyRetry(() => import("./components/Contact"));
const BuiltBy = lazyRetry(() => import("./components/BuiltBy"));

// Admin Components (lazy loaded - heavy bundle)
const AdminLayout = lazyRetry(() => import("./admin/AdminLayout"));
const AdminDashboard = lazyRetry(() => import("./admin/AdminDashboard"));
const AdminCategories = lazyRetry(() => import("./admin/AdminCategories"));
const AdminProducts = lazyRetry(() => import("./admin/AdminProducts"));
const AdminProductForm = lazyRetry(() => import("./admin/AdminProductForm"));
const AdminOffers = lazyRetry(() => import("./admin/AdminOffers"));
const AdminOrders = lazyRetry(() => import("./admin/AdminOrders"));
const AdminCoupons = lazyRetry(() => import("./admin/AdminCoupons"));
const AdminHeroBannerManager = lazyRetry(() => import("./admin/AdminHeroBannerManager"));

/**
 * Fallback loading component for lazy-loaded routes
 */
const LazyFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-[var(--cream)]">
    <div className="text-center">
      <div className="mb-4 inline-flex h-12 w-12 animate-spin rounded-full border-4 border-[var(--surface)] border-t-[var(--saffron)]" />
      <p className="text-sm text-gray-600">Loading...</p>
    </div>
  </div>
);

/**
 * StoreLayout Component
 * Wraps store pages with Navbar, Cart, and Footer
 * Moved outside App to ensure stable identity
 */
function StoreLayout({ children, hideFooter = false }) {
  return (
    <div className="flex flex-col min-h-screen" style={{ background: "var(--cream)" }}>
      <PromotionBar />
      <Navbar />
      <CartDrawer />
      <main className="flex-1">
        {children}
      </main>
      {!hideFooter && <Footer />}
    </div>
  );
}

const closeActiveModal = () => {
  const overlays = document.querySelectorAll(".fixed.inset-0");
  for (const overlay of overlays) {
    if (overlay.offsetWidth > 0 || overlay.offsetHeight > 0) {
      const buttons = overlay.querySelectorAll("button");
      for (const btn of buttons) {
        const hasX = btn.querySelector("svg") || btn.innerHTML.includes("svg");
        const hasCancelText = btn.textContent.toLowerCase().includes("cancel") 
          || btn.textContent.toLowerCase().includes("close")
          || btn.textContent.toLowerCase().includes("dismiss");
        
        if (hasX || hasCancelText) {
          btn.click();
          return true;
        }
      }
      if (buttons.length > 0) {
        buttons[0].click();
        return true;
      }
    }
  }
  return false;
};

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const lastBackPress = useRef(0);
  const { authReady } = useAuth();

  // Track global route changes
  useEffect(() => {
    console.log("ROUTE_AFTER_REDIRECT: Successfully routed to " + location.pathname + (location.search || ""));
  }, [location]);

  // Hide native splash screen as soon as React app is ready and auth state is restored
  useEffect(() => {
    if (Capacitor.isNativePlatform() && authReady) {
      const timer = setTimeout(() => {
        if (typeof window !== "undefined" && window.startupTimestamps) {
          window.startupTimestamps.splashHideStart = Date.now();
          console.log("MithaiWorldStartup: SPLASH_HIDE_START_MS: " + window.startupTimestamps.splashHideStart + " (diff from html: " + (window.startupTimestamps.splashHideStart - window.startupTimestamps.htmlLoad) + "ms)");
        }
        
        CapSplashScreen.hide().then(() => {
          if (typeof window !== "undefined" && window.startupTimestamps) {
            window.startupTimestamps.splashHideEnd = Date.now();
            console.log("MithaiWorldStartup: SPLASH_HIDE_END_MS: " + window.startupTimestamps.splashHideEnd + " (diff from html: " + (window.startupTimestamps.splashHideEnd - window.startupTimestamps.htmlLoad) + "ms)");
            console.log("MithaiWorldStartup: FULL_TIMESTAMPS_JSON: " + JSON.stringify(window.startupTimestamps));
          }
        }).catch(err => {
          console.warn("Failed to hide native splash screen:", err);
        });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [authReady]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const handleBackButton = async () => {
      if (closeActiveModal()) {
        console.log("Back button: Closed active modal/drawer.");
        return;
      }

      const path = location.pathname;

      if (path.startsWith("/product/")) {
        console.log("Back button: Navigating from Product Details to Products page.");
        navigate("/sweets");
        return;
      }

      if (path === "/checkout") {
        console.log("Back button: Navigating from Checkout to Cart.");
        navigate("/cart");
        return;
      }

      if (path === "/my-orders" || path === "/admin/orders") {
        console.log("Back button: Navigating back from Orders.");
        navigate(-1);
        return;
      }

      if (path === "/" || path === "/admin") {
        const now = Date.now();
        if (now - lastBackPress.current < 2000) {
          console.log("Back button: Exiting app.");
          CapApp.exitApp();
        } else {
          lastBackPress.current = now;
          toast.info("Press back again to exit", {
            position: "bottom-center",
            autoClose: 2000,
            toastId: "exit-toast"
          });
        }
        return;
      }

      console.log("Back button: Standard back navigation.");
      navigate(-1);
    };

    const backButtonListener = CapApp.addListener("backButton", handleBackButton);

    return () => {
      backButtonListener.then(l => l.remove());
    };
  }, [location, navigate]);

  return (
    <ErrorBoundary>
      <CartProvider>
        <ProductProvider>
          <GlobalStyle />
          <ScrollToTop />
          <ToastContainer position="bottom-right" autoClose={3000} />
          <AnnouncementPopup />

          <Routes>
            {/* ═══════════════════════════════════════════ */}
            {/* AUTH ROUTES */}
            {/* ═══════════════════════════════════════════ */}
            <Route path="/login" element={<StoreLayout hideFooter={true}><Login /></StoreLayout>} />
            <Route path="/register" element={<StoreLayout hideFooter={true}><Register /></StoreLayout>} />

            {/* ═══════════════════════════════════════════ */}
            {/* STORE ROUTES (With StoreLayout) */}
            {/* ═══════════════════════════════════════════ */}
            <Route
              path="/"
              element={
                <StoreLayout>
                  <HomePage />
                </StoreLayout>
              }
            />

            <Route
              path="/my-orders"
              element={
                <ProtectedRoute>
                  <StoreLayout hideFooter={true}>
                    <MyOrders />
                  </StoreLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/sweets"
              element={
                <StoreLayout>
                  <ProductsPage />
                </StoreLayout>
              }
            />

            <Route path="/products" element={<Navigate to="/sweets" replace />} />

            <Route
              path="/product/:id"
              element={
                <StoreLayout hideFooter={true}>
                  <ProductDetailPage />
                </StoreLayout>
              }
            />

            <Route
              path="/cart"
              element={
                <ProtectedRoute>
                  <StoreLayout hideFooter={true}>
                    <CartPage />
                  </StoreLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <StoreLayout hideFooter={true}>
                    <CheckoutPage />
                  </StoreLayout>
                </ProtectedRoute>
              }
            />

            <Route path="/order-success" element={<Navigate to="/payment-success" replace />} />

            <Route
              path="/payment-success"
              element={
                <ProtectedRoute>
                  <StoreLayout hideFooter={true}>
                    <PaymentSuccessPage />
                  </StoreLayout>
                </ProtectedRoute>
              }
            />

            {/* Policy Pages (Lazy loaded with Suspense) */}
            <Route
              path="/contact"
              element={
                <StoreLayout>
                  <Suspense fallback={<LazyFallback />}>
                    <Contact />
                  </Suspense>
                </StoreLayout>
              }
            />

            <Route
              path="/about"
              element={
                <StoreLayout>
                  <Suspense fallback={<LazyFallback />}>
                    <About />
                  </Suspense>
                </StoreLayout>
              }
            />

            <Route
              path="/built-by"
              element={
                <StoreLayout>
                  <Suspense fallback={<LazyFallback />}>
                    <BuiltBy />
                  </Suspense>
                </StoreLayout>
              }
            />

            <Route
              path="/shipping-policy"
              element={
                <StoreLayout>
                  <Suspense fallback={<LazyFallback />}>
                    <ShippingPolicy />
                  </Suspense>
                </StoreLayout>
              }
            />

            <Route
              path="/returns-exchanges"
              element={
                <StoreLayout>
                  <Suspense fallback={<LazyFallback />}>
                    <ReturnsExchange />
                  </Suspense>
                </StoreLayout>
              }
            />

            <Route
              path="/privacy-policy"
              element={
                <StoreLayout>
                  <Suspense fallback={<LazyFallback />}>
                    <PrivacyPolicy />
                  </Suspense>
                </StoreLayout>
              }
            />

            <Route
              path="/terms-conditions"
              element={
                <StoreLayout>
                  <Suspense fallback={<LazyFallback />}>
                    <TermsConditions />
                  </Suspense>
                </StoreLayout>
              }
            />

            {/* ═══════════════════════════════════════════ */}
            {/* ADMIN ROUTES (Protected, lazy loaded) */}
            {/* ═══════════════════════════════════════════ */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute adminOnly>
                  <Suspense fallback={<LazyFallback />}>
                    <AdminLayout />
                  </Suspense>
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="add-product" element={<AdminProductForm />} />
              <Route path="products/edit/:id" element={<Navigate to="/admin/add-product" replace />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="coupons" element={<AdminCoupons />} />
              <Route path="offers" element={<AdminOffers />} />
              <Route path="hero-banners" element={<AdminHeroBannerManager />} />
              <Route path="brands" element={<Navigate to="/admin/products" replace />} />
            </Route>

            {/* ═══════════════════════════════════════════ */}
            {/* 404 FALLBACK */}
            {/* ═══════════════════════════════════════════ */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ProductProvider>
      </CartProvider>
    </ErrorBoundary>
  );
}

export default App;