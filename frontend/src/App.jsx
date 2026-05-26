import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Core Components (always loaded)
import CartDrawer from "./components/CartDrawer";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import ScrollToTop from "./components/ScrollToTop";
import ErrorBoundary from "./components/ErrorBoundary";
import { CartProvider } from "./context/CartContext";
import { ProductProvider } from "./context/ProductContext";
import GlobalStyle from "./services/utils/GlobalStyle";

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
const ShippingPolicy = lazy(() => import("./pages/policies/ShippingPolicy"));
const PrivacyPolicy = lazy(() => import("./pages/policies/PrivacyPolicy"));
const ReturnsExchange = lazy(() => import("./pages/policies/ReturnsExchange"));
const TermsConditions = lazy(() => import("./pages/policies/TermsConditions"));

// Store Components (lazy loaded)
const About = lazy(() => import("./components/About"));
const Contact = lazy(() => import("./components/Contact"));
const BuiltBy = lazy(() => import("./components/BuiltBy"));

// Admin Components (lazy loaded - heavy bundle)
const AdminLayout = lazy(() => import("./admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./admin/AdminDashboard"));
const AdminCategories = lazy(() => import("./admin/AdminCategories"));
const AdminProducts = lazy(() => import("./admin/AdminProducts"));
const AdminProductForm = lazy(() => import("./admin/AdminProductForm"));
const AdminOffers = lazy(() => import("./admin/AdminOffers"));
const AdminOrders = lazy(() => import("./admin/AdminOrders"));
const AdminCoupons = lazy(() => import("./admin/AdminCoupons"));
const AdminHeroBannerManager = lazy(() => import("./admin/AdminHeroBannerManager"));

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
      <Navbar />
      <CartDrawer />
      <main className="flex-1">
        {children}
      </main>
      {!hideFooter && <Footer />}
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <CartProvider>
        <ProductProvider>
          <GlobalStyle />
          <ScrollToTop />
          <ToastContainer position="bottom-right" autoClose={3000} />

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

            <Route path="/sweets" element={<Navigate to="/sweets" replace />} />

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
                <StoreLayout hideFooter={true}>
                  <CartPage />
                </StoreLayout>
              }
            />

            <Route
              path="/checkout"
              element={
                <StoreLayout hideFooter={true}>
                  <CheckoutPage />
                </StoreLayout>
              }
            />

            <Route path="/order-success" element={<Navigate to="/payment-success" replace />} />

            <Route
              path="/payment-success"
              element={
                <StoreLayout hideFooter={true}>
                  <PaymentSuccessPage />
                </StoreLayout>
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