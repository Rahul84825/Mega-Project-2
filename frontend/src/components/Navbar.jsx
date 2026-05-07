import { useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  Menu,
  Search,
  ShoppingBag,
  User,
  X,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useProducts } from "../context/ProductContext";
import { slugify } from "../utils/category";
import brandLogo from "../assets/image.png";

const toSlug = slugify;

function IBtn({ label, onClick, badge, children }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full
                 border-0 bg-transparent text-[var(--charcoal)]
                 transition-all duration-200 hover:bg-[var(--surface-strong)]"
    >
      {children}
      {badge > 0 && (
        <span className="absolute right-[3px] top-[3px] flex h-[15px] min-w-[15px] items-center
                         justify-center rounded-full bg-[var(--saffron)] px-[3px]
                         text-[9px] font-extrabold leading-none text-[var(--charcoal)]">
          {badge}
        </span>
      )}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════
   NAVBAR
═══════════════════════════════════════════════════════ */
function Navbar({ page, selectedCategory = "all", setPage, setCategory }) {
  const { cart, toggleCart } = useCart();
  const { user, isAuthenticated, logout } = useAuth();
  const { categories: allCategories } = useProducts();
  const location = useLocation();
  const navigate = useNavigate();

  const qty = cart.reduce((s, i) => s + (Number(i.quantity) || 0), 0);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const searchRef = useRef(null);

  const sweetsCategories = useMemo(
    () =>
      (allCategories || [])
        .filter((c) => c.type === "sweets" && c.is_active)
        .sort((a, b) => Number(a.order || 0) - Number(b.order || 0))
        .map((item) => ({ name: item?.name || "", slug: toSlug(item?.slug) }))
        .filter((item) => Boolean(item.name && item.slug)),
    [allCategories]
  );

  const otherCategories = useMemo(
    () =>
      (allCategories || [])
        .filter((c) => c.type === "other" && c.showInNavbar)
        .sort((a, b) => Number(a.order || 0) - Number(b.order || 0))
        .map((item) => ({ name: item?.name || "", slug: toSlug(item?.slug) }))
        .filter((item) => Boolean(item.name && item.slug)),
    [allCategories]
  );

  const navItems = useMemo(
    () => [{ name: "ALL PRODUCTS", slug: "all" }, { name: "SWEETS", slug: "sweets" }, ...otherCategories],
    [otherCategories]
  );

  const currentCategoryFromURL = toSlug(new URLSearchParams(location.search).get("category") || "all");

  const closeAll = () => { setMobileOpen(false); };

  const handleLogoClick = () => {
    setPage("home");
    setCategory?.("all");
    setDropOpen(false);
    setSearchOpen(false);
    setProfileOpen(false);
    closeAll();
    navigate("/");
  };

  const go = (slug) => {
    const normalizedSlug = toSlug(slug);
    if (normalizedSlug === "home") {
      handleLogoClick();
      return;
    } else if (normalizedSlug === "all") {
      setPage("all");
      setCategory?.("all");
      navigate("/products");
    } else if (normalizedSlug === "sweets") {
      if (!sweetsCategories.length) return;
      const defaultSweets = sweetsCategories[0];
      setPage("category");
      setCategory?.(defaultSweets.slug);
      navigate(`/products?category=${encodeURIComponent(defaultSweets.slug)}`);
    } else {
      setPage("category");
      setCategory?.(normalizedSlug);
      navigate(`/products?category=${encodeURIComponent(normalizedSlug)}`);
    }
    closeAll();
    setSearchOpen(false);
  };

  const cat = (slug) => {
    const normalizedSlug = toSlug(slug);
    setPage("category");
    setCategory?.(normalizedSlug);
    navigate(`/products?category=${encodeURIComponent(normalizedSlug)}`);
    closeAll();
    setDropOpen(false);
    setSearchOpen(false);
  };

  const handleProfileClick = () => {
    if (isAuthenticated) {
      setProfileOpen((v) => !v);
    } else {
      navigate("/login");
    }
  };

  const handleLogout = () => {
    logout();
    setPage("home");
    setProfileOpen(false);
    navigate("/login");
  };

  const isCategoryActive = (slug) => {
    if (slug === "all") {
      return location.pathname === "/products" && currentCategoryFromURL === "all";
    }
    if (slug === "sweets") {
      return location.pathname === "/products" && sweetsCategories.some((item) => item.slug === currentCategoryFromURL);
    }
    return location.pathname === "/products" && currentCategoryFromURL === slug;
  };

  const navLinkClass = (slug) => {
    const active = isCategoryActive(slug);
    return `inline-flex items-center gap-1 whitespace-nowrap border-b-2 border-transparent
            bg-transparent px-3 py-2 text-xs font-bold tracking-[0.13em]
            transition-all duration-150 hover:-translate-y-px hover:text-[var(--saffron)]
            ${active ? "text-[var(--saffron)]" : "text-[var(--muted)]"}`;
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-[var(--surface-border)] bg-[var(--cream)]">

      {/* ── Desktop bar ── */}
      <div className="mx-auto hidden h-[85px] max-w-[1280px] items-center px-8 lg:grid [grid-template-columns:1fr_auto_1fr]">

        {/* Logo */}
        <div className="flex items-center">
          <button
            type="button"
            aria-label="Go to home"
            onClick={handleLogoClick}
            className="cursor-pointer border-0 bg-transparent p-0"
          >
            <img src={brandLogo} alt="Mithai World" className="h-20 w-auto shrink-0 object-contain" />
          </button>
        </div>

        {/* Nav links */}
        <ul className="m-0 flex list-none items-center gap-1 p-0">
          {navItems.map((item) => {
            if (item.slug !== "sweets") {
              return (
                <li key={item.slug}>
                  <button type="button" onClick={() => go(item.slug)} className={navLinkClass(item.slug)}>
                    {item.name.toUpperCase()}
                  </button>
                </li>
              );
            }

            return (
              <li
                key={item.slug}
                className="relative"
                onMouseEnter={() => setDropOpen(true)}
                onMouseLeave={() => setDropOpen(false)}
              >
                <button type="button" onClick={() => go("sweets")} className={navLinkClass("sweets")}>
                  SWEETS
                  <ChevronDown
                    size={11}
                    className={`shrink-0 transition-transform duration-200 ${dropOpen ? "rotate-180" : "rotate-0"}`}
                  />
                </button>

                <div
                  className={`absolute left-1/2 top-[calc(100%+10px)] z-[100] w-[560px] -translate-x-1/2
                              rounded-xl border border-[var(--surface-border)] bg-[var(--surface)]
                              p-5 transition-all duration-200
                              ${dropOpen ? "visible translate-y-0 opacity-100 shadow-[0_8px_24px_rgba(139,80,20,0.10)]" : "invisible -translate-y-1.5 opacity-0"}`}
                >
                  <div className="mb-3.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--gold)]">
                    Sweets Collection
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {sweetsCategories.map((navCat) => (
                      <button
                        key={navCat.slug}
                        type="button"
                        onClick={() => cat(navCat.slug)}
                        className="rounded-lg border-0 bg-transparent px-2 py-2.5 text-left text-xs
                                   font-medium text-[var(--charcoal)] transition-all duration-150
                                   hover:bg-[var(--surface-strong)] hover:text-[var(--burgundy)]"
                      >
                        {navCat.name}
                      </button>
                    ))}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        {/* Desktop right: search + cart + profile */}
        <div className="flex items-center justify-end gap-1">

          {/* Expanding search */}
          <div
            className={`flex h-11 items-center gap-1.5 overflow-hidden rounded-full transition-all duration-200
              ${searchOpen
                ? "max-w-[260px] border border-[var(--surface-border)] bg-[var(--surface-strong)] pl-1 pr-3"
                : "max-w-11 border border-transparent bg-transparent p-0"
              }`}
          >
            <IBtn
              label="Search"
              onClick={() => { setSearchOpen((v) => !v); setTimeout(() => searchRef.current?.focus(), 50); }}
            >
              <Search size={17} />
            </IBtn>
            <input
              ref={searchRef}
              className={`flex-1 border-none bg-transparent text-sm text-[var(--charcoal)]
                          outline-none placeholder:text-[var(--muted)] transition-opacity duration-200
                          ${searchOpen ? "opacity-100" : "opacity-0"}`}
              placeholder="Search sweets…"
              onKeyDown={(e) => e.key === "Escape" && setSearchOpen(false)}
            />
          </div>

          <IBtn label="Cart" onClick={toggleCart} badge={qty}>
            <ShoppingBag size={17} />
          </IBtn>

          {/* Profile */}
          <div className="relative">
            <IBtn label={isAuthenticated ? "Profile" : "Login"} onClick={handleProfileClick}>
              <User size={17} />
            </IBtn>

            {isAuthenticated && (
              <div
                className={`absolute right-0 top-[calc(100%+8px)] z-[1000] min-w-[200px] overflow-hidden
                            rounded-xl border border-[var(--surface-border)] bg-[var(--surface)]
                            transition-all duration-200
                            ${profileOpen
                              ? "visible opacity-100 shadow-[0_8px_24px_rgba(0,0,0,0.10)]"
                              : "invisible opacity-0"
                            }`}
              >
                {/* User info */}
                <div className="border-b border-[var(--surface-border)] px-4 py-3">
                  <div className="text-sm font-semibold text-[var(--charcoal)]">
                    {user?.name || "User"}
                  </div>
                  <div className="mt-1 text-xs text-[var(--muted)]">
                    {user?.email}
                  </div>
                </div>

                {user?.isAdmin === true && (
                  <button
                    type="button"
                    onClick={() => { setProfileOpen(false); navigate("/admin"); }}
                    className="w-full px-4 py-2.5 text-left text-sm text-[var(--charcoal)]
                               transition-colors duration-150 hover:bg-[var(--surface-strong)]"
                  >
                    📊 Admin Dashboard
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full px-4 py-2.5 text-left text-sm font-medium text-[var(--burgundy)]
                             transition-colors duration-150 hover:bg-[var(--surface-strong)]"
                >
                  🚪 Logout
                </button>
              </div>
            )}
          </div>

          {/* Username pill */}
          {isAuthenticated && (
            <span className="ml-1 max-w-[110px] overflow-hidden text-ellipsis whitespace-nowrap
                             rounded-full border border-[var(--surface-border)]
                             px-3 py-1 text-xs text-[var(--muted)]">
              {user?.name?.split(" ")[0]}
            </span>
          )}

        </div>
      </div>

      {/* ── Mobile bar ── */}
      <div className="flex h-[64px] items-center justify-between px-4 lg:hidden">
        <button
          type="button"
          onClick={handleLogoClick}
          className="flex cursor-pointer items-center gap-2.5 border-0 bg-transparent p-0"
        >
          <img src={brandLogo} alt="Mithai World" className="h-12 w-auto shrink-0 object-contain" />
        </button>

        <div className="flex items-center gap-0.5">
          <IBtn label="Search" onClick={() => setSearchOpen((v) => !v)}>
            <Search size={17} />
          </IBtn>
          <IBtn label="Cart" onClick={toggleCart} badge={qty}>
            <ShoppingBag size={17} />
          </IBtn>
          <IBtn
            label={isAuthenticated ? "Profile" : "Login"}
            onClick={() => { if (isAuthenticated) setProfileOpen((v) => !v); else navigate("/login"); }}
          >
            <User size={17} />
          </IBtn>
          <IBtn label="Menu" onClick={() => setMobileOpen((v) => !v)}>
            {mobileOpen ? <X size={17} /> : <Menu size={17} />}
          </IBtn>
        </div>
      </div>

      {/* Mobile profile dropdown */}
      {isAuthenticated && profileOpen && (
        <div className="lg:hidden border-t border-[var(--surface-border)] bg-[var(--surface)] px-4 py-3">
          <div className="mb-2 border-b border-[var(--surface-border)] pb-2">
            <div className="text-sm font-semibold text-[var(--charcoal)]">{user?.name || "User"}</div>
            <div className="mt-0.5 text-xs text-[var(--muted)]">{user?.email}</div>
          </div>
          {user?.isAdmin === true && (
            <button
              type="button"
              onClick={() => { setProfileOpen(false); closeAll(); navigate("/admin"); }}
              className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-[var(--charcoal)]
                         transition-colors duration-150 hover:bg-[var(--surface-strong)]"
            >
              📊 Admin Dashboard
            </button>
          )}
          <button
            type="button"
            onClick={() => { handleLogout(); closeAll(); }}
            className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-[var(--burgundy)]
                       transition-colors duration-150 hover:bg-[var(--surface-strong)]"
          >
            🚪 Logout
          </button>
        </div>
      )}

      {/* Mobile search bar */}
      <div
        className={`overflow-hidden transition-[max-height] duration-200 lg:hidden
          ${searchOpen ? "max-h-[70px] border-t border-[var(--surface-border)]" : "max-h-0"}`}
      >
        <div className="px-4 py-2.5">
          <div className="flex h-10 w-full items-center gap-2 rounded-xl border border-[var(--surface-border)]
                          bg-[var(--surface)] px-3">
            <Search size={15} className="text-[var(--muted)] shrink-0" />
            <input
              className="w-full flex-1 border-none bg-transparent text-sm text-[var(--charcoal)]
                         outline-none placeholder:text-[var(--muted)]"
              placeholder="Search sweets, snacks…"
              onKeyDown={(e) => e.key === "Escape" && setSearchOpen(false)}
              autoFocus={searchOpen}
            />
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`overflow-hidden bg-[var(--cream)] transition-[max-height] duration-300 ease-in-out lg:hidden
          ${mobileOpen ? "max-h-[720px] border-t border-[var(--surface-border)]" : "max-h-0"}`}
      >
        <div className="px-3 pb-6 pt-3">
          {navItems.map((item) => {
            const active = isCategoryActive(item.slug);

            if (item.slug !== "sweets") {
              return (
                <button
                  key={item.slug}
                  type="button"
                  onClick={() => go(item.slug)}
                  className={`mb-0.5 flex w-full items-center rounded-xl border-l-[3px] px-3.5 py-3
                              text-xs font-bold tracking-[0.14em] transition-all duration-150
                              hover:bg-[var(--surface-strong)] hover:text-[var(--burgundy)]
                              ${active
                                ? "border-l-[var(--saffron)] bg-[var(--surface-strong)] text-[var(--saffron)]"
                                : "border-l-transparent bg-transparent text-[var(--charcoal)]"
                              }`}
                >
                  {item.name.toUpperCase()}
                </button>
              );
            }

            return (
              <div key={item.slug} className="mb-0.5">
                <button
                  type="button"
                  onClick={() => go("sweets")}
                  className={`flex w-full items-center justify-between rounded-xl border-l-[3px] px-3.5 py-3
                              text-xs font-bold tracking-[0.14em] transition-all duration-150
                              hover:bg-[var(--surface-strong)] hover:text-[var(--burgundy)]
                              ${isCategoryActive("sweets")
                                ? "border-l-[var(--saffron)] bg-[var(--surface-strong)] text-[var(--saffron)]"
                                : "border-l-transparent bg-transparent text-[var(--charcoal)]"
                              }`}
                >
                  SWEETS
                  <ChevronDown
                    size={13}
                    className={`transition-transform duration-200 ${dropOpen ? "rotate-180" : "rotate-0"}`}
                  />
                </button>

                <div
                  className={`overflow-hidden transition-[max-height] duration-300
                    ${dropOpen && sweetsCategories.length ? "max-h-[200px]" : "max-h-0"}`}
                >
                  <div className="grid grid-cols-1 gap-1 px-2 pb-2 pt-1.5">
                    {sweetsCategories.map((navCat) => (
                      <button
                        key={navCat.slug}
                        type="button"
                        onClick={() => cat(navCat.slug)}
                        className="rounded-lg border-0 bg-[var(--surface-strong)] px-3 py-2.5
                                   text-left text-xs font-medium text-[var(--charcoal)]
                                   transition-all duration-150 hover:bg-[var(--surface-border)]
                                   hover:text-[var(--burgundy)]"
                      >
                        {navCat.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Mobile auth section */}
          <div className="mt-3">
            {isAuthenticated ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between rounded-xl border border-[var(--surface-border)]
                                bg-[var(--surface)] px-3.5 py-3">
                  <span className="text-xs text-[var(--muted)]">
                    Hi,{" "}
                    <span className="font-semibold text-[var(--charcoal)]">
                      {user?.name?.split(" ")[0]}
                    </span>
                  </span>
                </div>
                {user?.isAdmin === true && (
                  <button
                    type="button"
                    onClick={() => { closeAll(); navigate("/admin"); }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl
                               border border-[var(--surface-border)] bg-transparent
                               px-3 py-3 text-xs font-bold tracking-[0.06em] text-[var(--saffron)]
                               transition-colors duration-150 hover:bg-[var(--surface-strong)]"
                  >
                    📊 Admin Dashboard
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => { handleLogout(); closeAll(); }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl
                             border-0 bg-[var(--burgundy)] px-3 py-3 text-xs font-bold
                             tracking-[0.06em] text-white transition-colors duration-150
                             hover:opacity-90"
                >
                  🚪 Logout
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="flex w-full items-center justify-center gap-2 rounded-xl
                           border-0 bg-[var(--saffron)] px-3 py-3 text-[13px] font-extrabold
                           tracking-[0.06em] text-[var(--charcoal)] transition-colors duration-150
                           hover:opacity-90"
              >
                <User size={15} />
                Login / Sign Up
              </button>
            )}
          </div>
        </div>
      </div>

    </nav>
  );
}

export default Navbar;