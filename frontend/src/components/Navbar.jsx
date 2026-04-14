
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
import brandLogo from "../assets/image.png";

const toSlug = (value) => String(value || "").trim().toLowerCase();

function IBtn({ label, onClick, badge, children }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-0 bg-transparent text-[#3b2f2f] transition-all duration-200 hover:bg-[#f5e1c8]"
    >
      {children}
      {badge > 0 && (
        <span className="absolute right-[3px] top-[3px] flex h-[15px] min-w-[15px] items-center justify-center rounded-[8px] bg-[#e8883a] px-[3px] text-[9px] font-extrabold leading-none text-[#2f190d]">
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

  const qty = cart.reduce((s, i) => s + i.qty, 0);

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
    console.log("[Navbar] Category clicked:", normalizedSlug);

    if (normalizedSlug === "home") {
      handleLogoClick();
      return;
    } else if (normalizedSlug === "all") {
      setPage("all");
      setCategory?.("all");
      navigate("/products");
    } else if (normalizedSlug === "sweets") {
      if (!sweetsCategories.length) {
        return;
      }
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
    console.log("[Navbar] Category clicked from sweets dropdown:", normalizedSlug);
    setPage("category");
    setCategory?.(normalizedSlug);
    navigate(`/products?category=${encodeURIComponent(normalizedSlug)}`);
    closeAll();
    setDropOpen(false);
    setSearchOpen(false);
  };

  const handleProfileClick = () => {
    if (isAuthenticated) {
      setProfileOpen(!profileOpen);
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

  /* Nav link style */
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
    return `inline-flex items-center gap-1 whitespace-nowrap border-b-2 border-transparent bg-transparent px-3 py-2 text-[12px] font-bold tracking-[0.13em] transition-all duration-150 hover:-translate-y-px hover:text-[#e8883a] ${
      active ? "text-[#e8883a]" : "text-[rgba(59,36,23,0.68)]"
    }`;
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-[rgba(83,44,22,0.24)] bg-[#fff3e0]">
      <div className="mx-auto hidden h-[85px] max-w-[1280px] items-center px-8 lg:grid [grid-template-columns:1fr_auto_1fr]">
        <div className="flex items-center">
          <button
            type="button"
            aria-label="Go to home"
            onClick={handleLogoClick}
            className="cursor-pointer border-0 bg-transparent p-0"
          >
            <img
              src={brandLogo}
              alt="Mithai World"
              className="h-20 w-auto shrink-0 object-contain"
            />
          </button>
        </div>

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
                    className={`absolute left-1/2 top-[calc(100%+10px)] z-[100] w-[560px] -translate-x-1/2 rounded-[14px] border border-[rgba(201,168,76,0.55)] bg-[#fff8ee] p-5 transition-all duration-200 ${
                      dropOpen ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1.5 opacity-0"
                    }`}
                  >
                    <div className="mb-3.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#c9a84c]">
                      Sweets Collection
                    </div>
                    <div className="grid grid-cols-3 gap-[5px]">
                      {sweetsCategories.map((navCat) => (
                        <button
                          key={navCat.slug}
                          type="button"
                          onClick={() => cat(navCat.slug)}
                          className="rounded-lg border-0 bg-transparent px-2 py-2.5 text-left text-[12px] font-medium text-[#3b2417] transition-all duration-150 hover:bg-[rgba(232,136,58,0.20)] hover:text-[#6a350f] hover:shadow-[0_6px_14px_rgba(232,136,58,0.18)]"
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

        <div className="flex items-center justify-end gap-1">
            <div
              className={`flex h-11 items-center gap-1.5 overflow-hidden rounded-full transition-all duration-200 ${
                searchOpen
                  ? "max-w-[260px] border border-[rgba(83,44,22,0.24)] bg-[rgba(232,136,58,0.10)] pl-1 pr-3"
                  : "max-w-11 border border-transparent bg-transparent p-0"
              }`}
            >
              <IBtn label="Search" onClick={() => { setSearchOpen((v) => !v); setTimeout(() => searchRef.current?.focus(), 50); }}>
                <Search size={17} />
              </IBtn>
              <input
                ref={searchRef}
                className={`flex-1 border-none bg-transparent text-[14px] text-[#3b2417] outline-none placeholder:text-[rgba(59,36,23,0.68)] transition-opacity duration-200 ${
                  searchOpen ? "opacity-100" : "opacity-0"
                }`}
                placeholder="Search sweets…"
                onKeyDown={(e) => e.key === "Escape" && setSearchOpen(false)}
              />
            </div>

            <IBtn label="Cart" onClick={() => { toggleCart(); }} badge={qty}>
              <ShoppingBag size={17} />
            </IBtn>

            <div className="relative">
              <IBtn label={isAuthenticated ? "Profile" : "Login"} onClick={handleProfileClick}>
                <User size={17} />
              </IBtn>

              {isAuthenticated && (
                <div
                  className={`absolute right-0 top-[calc(100%+8px)] z-[1000] min-w-[200px] overflow-hidden rounded-[10px] border border-[rgba(201,168,76,0.55)] bg-[#fff8ee] transition-all duration-200 ${
                    profileOpen ? "visible opacity-100 shadow-[0_8px_24px_rgba(0,0,0,0.12)]" : "invisible opacity-0"
                  }`}
                >
                  <div className="border-b border-[rgba(83,44,22,0.24)] px-4 py-3 text-[13px] text-[#3b2417]">
                    <div className="font-semibold">{user?.name || "User"}</div>
                    <div className="mt-1 text-[11px] text-[rgba(59,36,23,0.68)]">{user?.email}</div>
                  </div>
                  {user?.isAdmin === true && (
                    <button
                      type="button"
                      onClick={() => { setProfileOpen(false); navigate("/admin"); }}
                      className="w-full border-0 bg-transparent px-4 py-2.5 text-left text-[13px] text-[#3b2417] transition-colors duration-150 hover:bg-[rgba(232,136,58,0.20)]"
                    >
                      📊 Admin Dashboard
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full border-0 bg-transparent px-4 py-2.5 text-left text-[13px] font-medium text-[#c41e3a] transition-colors duration-150 hover:bg-[rgba(196,30,58,0.08)]"
                  >
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>

            {isAuthenticated && (
              <span className="ml-1 max-w-[110px] overflow-hidden text-ellipsis whitespace-nowrap rounded-[20px] border border-[rgba(83,44,22,0.24)] px-2.5 py-1 text-[11px] text-[rgba(59,36,23,0.68)]">
                {user?.name?.split(" ")[0]}
              </span>
            )}
          </div>
        </div>

      <div className="flex h-[92px] items-center justify-between px-4 lg:hidden">
          <button
            type="button"
            onClick={handleLogoClick}
            className="flex cursor-pointer items-center gap-2.5 border-0 bg-transparent p-0"
          >
            <img
              src={brandLogo}
              alt="Mithai World"
              className="h-20 w-auto shrink-0 object-contain"
            />
          </button>

          <div className="flex items-center gap-0.5">
            <IBtn label="Search" onClick={() => setSearchOpen((v) => !v)}>
              <Search size={17} />
            </IBtn>
            <IBtn label="Cart" onClick={() => { toggleCart(); }} badge={qty}>
              <ShoppingBag size={17} />
            </IBtn>
            <IBtn label={isAuthenticated ? "Profile" : "Login"} onClick={() => { if(isAuthenticated) setProfileOpen(!profileOpen); else navigate("/login"); }}>
              <User size={17} />
            </IBtn>
            <IBtn label="Menu" onClick={() => setMobileOpen((v) => !v)}>
              {mobileOpen ? <X size={17} /> : <Menu size={17} />}
            </IBtn>
          </div>
        </div>

      <div
        className={`w-full overflow-hidden transition-[max-height] duration-200 lg:hidden ${
          searchOpen ? "max-h-[70px] border-t border-[rgba(83,44,22,0.24)]" : "max-h-0 border-t-0"
        }`}
      >
        <div className="w-full px-4 py-2.5">
          <div className="flex h-10 w-full items-center gap-2 rounded-[10px] border border-[rgba(83,44,22,0.24)] bg-[rgba(255,255,255,0.78)] px-3">
              <Search size={15} className="text-[rgba(59,36,23,0.68)]" />
              <input
                className="w-full flex-1 border-none bg-transparent text-[14px] text-[#3b2417] outline-none placeholder:text-[rgba(59,36,23,0.68)]"
                placeholder="Search sweets, snacks…"
                onKeyDown={(e) => e.key === "Escape" && setSearchOpen(false)}
                autoFocus={searchOpen}
              />
            </div>
          </div>
        </div>

      <div
        className={`overflow-hidden bg-gradient-to-b from-[#ffefd3] to-[#ffe7c2] transition-[max-height] duration-300 ease-in-out ${
          mobileOpen ? "max-h-[720px] border-t border-[rgba(83,44,22,0.24)]" : "max-h-0 border-t-0"
        }`}
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
                    className={`mb-0.5 flex w-full items-center rounded-[10px] border-0 px-3.5 py-[13px] text-[12px] font-bold tracking-[0.14em] transition-all duration-150 hover:bg-[rgba(232,136,58,0.16)] hover:text-[#6a350f] ${
                      active
                        ? "border-l-[3px] border-l-[#e8883a] bg-[rgba(232,136,58,0.20)] text-[#e8883a]"
                        : "border-l-[3px] border-l-transparent bg-transparent text-[#3b2417]"
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
                    className={`flex w-full items-center justify-between rounded-[10px] border-0 px-3.5 py-[13px] text-[12px] font-bold tracking-[0.14em] transition-all duration-150 hover:bg-[rgba(232,136,58,0.16)] hover:text-[#6a350f] ${
                      isCategoryActive("sweets")
                        ? "border-l-[3px] border-l-[#e8883a] bg-[rgba(232,136,58,0.20)] text-[#e8883a]"
                        : "border-l-[3px] border-l-transparent bg-transparent text-[#3b2417]"
                    }`}
                  >
                    SWEETS
                    <ChevronDown
                      size={13}
                      className={`transition-transform duration-200 ${dropOpen ? "rotate-180" : "rotate-0"}`}
                    />
                  </button>

                  <div
                    className={`overflow-hidden transition-[max-height] duration-300 ${
                      dropOpen && sweetsCategories.length ? "max-h-[200px]" : "max-h-0"
                    }`}
                  >
                    <div className="grid grid-cols-1 gap-1 px-2 pb-2 pt-1.5">
                      {sweetsCategories.map((navCat) => (
                        <button
                          key={navCat.slug}
                          type="button"
                          onClick={() => cat(navCat.slug)}
                          className="rounded-lg border-0 bg-[rgba(232,136,58,0.09)] px-3 py-2.5 text-left text-[12px] font-medium text-[#3b2417] transition-all duration-150 hover:bg-[rgba(232,136,58,0.20)] hover:text-[#6a350f] hover:shadow-[0_6px_14px_rgba(232,136,58,0.18)]"
                        >
                          {navCat.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="mt-2.5">
              {isAuthenticated ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between rounded-[10px] border border-[rgba(83,44,22,0.24)] px-3.5 py-3">
                    <span className="text-[12px] text-[rgba(59,36,23,0.68)]">
                      Hi, <span className="font-semibold text-[#3b2417]">{user?.name?.split(" ")[0]}</span>
                    </span>
                  </div>
                  {user?.isAdmin === true && (
                    <button
                      type="button"
                      onClick={() => { closeAll(); navigate("/admin"); }}
                      className="flex w-full items-center justify-center gap-2 rounded-[10px] border border-[rgba(83,44,22,0.24)] bg-transparent px-3 py-[11px] text-[12px] font-bold tracking-[0.06em] text-[#e8883a]"
                    >
                      📊 Admin Dashboard
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => { handleLogout(); closeAll(); }}
                    className="flex w-full items-center justify-center gap-2 rounded-[10px] border-0 bg-[#c41e3a] px-3 py-[11px] text-[12px] font-bold tracking-[0.06em] text-white"
                  >
                    🚪 Logout
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="flex w-full items-center justify-center gap-2 rounded-[10px] border-0 bg-[#e8883a] px-3 py-[13px] text-[13px] font-extrabold tracking-[0.06em] text-[#2f190d]"
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