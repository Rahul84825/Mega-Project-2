
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  Menu,
  Search,
  ShoppingBag,
  User,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { getCategories } from "../services/api";
import brandLogo from "../assets/image.png";

/* ─── Design tokens ─────────────────────────────────── */
const C = {
  bg: "#2f190d",
  bgCard: "#fff8ee",
  bgHover: "rgba(232,136,58,0.16)",
  bgActive: "rgba(232,136,58,0.20)",
  border: "rgba(83,44,22,0.24)",
  borderGold: "rgba(201,168,76,0.55)",
  saffron: "#e8883a",
  gold: "#c9a84c",
  cream: "#3b2417",
  muted: "rgba(59,36,23,0.68)",
};

const toSlug = (value) => String(value || "").trim().toLowerCase();

/* ─── Tiny icon-button helper ────────────────────────── */
function IBtn({ label, onClick, badge, children }) {
  const [h, setH] = useState(false);
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "44px",
        height: "44px",
        borderRadius: "50%",
        border: "none",
        background: h ? C.bgHover : "transparent",
        color: C.cream,
        cursor: "pointer",
        flexShrink: 0,
        transition: "background .15s",
      }}
    >
      {children}
      {badge > 0 && (
        <span style={{
          position: "absolute",
          top: "3px", right: "3px",
          minWidth: "15px",
          height: "15px",
          background: C.saffron,
          borderRadius: "8px",
          fontSize: "9px",
          fontWeight: "800",
          color: C.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 3px",
          lineHeight: 1,
        }}>
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
  const navigate = useNavigate();

  const qty = cart.reduce((s, i) => s + i.qty, 0);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [sweetsOpen, setSweetsOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const searchRef = useRef(null);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const list = await getCategories();
        const normalized = (Array.isArray(list) ? list : [])
          .map((item) => ({ name: item?.name || "", slug: toSlug(item?.slug) }))
          .filter((item) => Boolean(item.name && item.slug));
        setCategories(normalized);
      } catch (_error) {
        setCategories([]);
      }
    };

    loadCategories();
  }, []);

  const navItems = useMemo(() => [{ name: "ALL PRODUCTS", slug: "all" }, ...categories], [categories]);
  const sweetsCategory = useMemo(() => categories.find((item) => item.slug === "sweets") || null, [categories]);
  const normalizedSelectedCategory = toSlug(selectedCategory || "all");

  const closeAll = () => { setMobileOpen(false); setSweetsOpen(false); };
  const go = (slug) => {
    const normalizedSlug = toSlug(slug);
    console.log("[Navbar] Category clicked:", normalizedSlug);

    if (normalizedSlug === "home") {
      setPage("home");
      setCategory?.("all");
    } else if (normalizedSlug === "all") {
      setPage("home");
      setCategory?.("all");
    } else {
      setPage("category");
      setCategory?.(normalizedSlug);
    }
    closeAll();
    setSearchOpen(false);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const cat = (slug) => {
    const normalizedSlug = toSlug(slug);
    console.log("[Navbar] Category clicked from sweets dropdown:", normalizedSlug);
    setPage("category");
    setCategory?.(normalizedSlug);
    closeAll();
    setDropOpen(false);
    setSearchOpen(false);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
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
      return page === "all" || page === "home" || (page === "category" && normalizedSelectedCategory === "all");
    }

    return (page === "category" && normalizedSelectedCategory === slug) || page === slug;
  };

  const nlStyle = (slug) => {
    const active = isCategoryActive(slug);
    return ({
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    padding: "8px 12px",
    fontSize: "12px",
    fontWeight: "700",
    letterSpacing: "0.13em",
    color: active ? C.saffron : C.muted,
    background: "transparent",
    border: "none",
    borderBottom: active ? `2px solid ${C.saffron}` : "2px solid transparent",
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "color .15s, border-color .15s",
  });
  };

  return (
    <>
      {/* ── One-time global overrides ── */}
      <style>{`
        .mw-dt { display:none!important }
        .mw-mb { display:flex!important }
        @media(min-width:1024px){
          .mw-dt { display:grid!important }
          .mw-mb { display:none!important }
        }
        .nl:hover { color:${C.saffron}!important; transform:translateY(-1px) }
        .dc:hover { background:${C.bgActive}!important; color:#6a350f!important; box-shadow:0 6px 14px rgba(232,136,58,0.18) }
        .mi:hover { background:${C.bgHover}!important; color:#6a350f!important }
        .dp-pill:hover { border-color:${C.gold}!important; background:rgba(232,136,58,0.12)!important }
        input.si { background:transparent;border:none;outline:none;color:${C.cream};font-size:14px;flex:1 }
        input.si::placeholder { color:${C.muted} }
      `}</style>

      <nav style={{ position: "sticky", top: 0, zIndex: 50, width: "100%", background: "#fff3e0", borderBottom: `1px solid ${C.border}` }}>

        {/* ════════════════════════════════════════
            DESKTOP  (lg+)   grid: 1fr | auto | 1fr
        ════════════════════════════════════════ */}
        <div
          className="mw-dt"
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            padding: "0 32px",
            height: "85px",
            alignItems: "center",
            gridTemplateColumns: "1fr auto 1fr",
          }}
        >
          {/* Col 1 — brand */}
          <div style={{ display: "flex", alignItems: "center" }}>
            <button
              type="button"
              aria-label="Go to home"
              onClick={() => go("home")}
              style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
            >
              <img
                src={brandLogo}
                alt="Mithai World"
                style={{
                  height: "80px",
                  width: "auto",
                  objectFit: "contain",
                  flexShrink: 0
                }}
              />
            </button>
          </div>

          {/* Col 2 — nav (true center via auto column) */}
          <ul style={{ display: "flex", alignItems: "center", gap: "4px", listStyle: "none", margin: 0, padding: 0 }}>
            {navItems.map((item) => {
              if (item.slug !== "sweets") return (
                <li key={item.slug}>
                  <button type="button" className="nl" onClick={() => go(item.slug)} style={nlStyle(item.slug)}>
                    {item.name.toUpperCase()}
                  </button>
                </li>
              );

              if (!sweetsCategory) {
                return null;
              }

              return (
                <li key={item.slug} style={{ position: "relative" }}
                  onMouseEnter={() => setDropOpen(true)}
                  onMouseLeave={() => setDropOpen(false)}
                >
                  <button type="button" className="nl" onClick={() => go("sweets")} style={nlStyle("sweets")}>
                    {sweetsCategory.name.toUpperCase()}
                    <ChevronDown size={11} style={{ transform: dropOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform .2s", flexShrink: 0 }} />
                  </button>

                  {/* Megamenu */}
                  <div style={{
                    position: "absolute",
                    top: "calc(100% + 10px)",
                    left: "50%",
                    transform: `translateX(-50%) translateY(${dropOpen ? "0" : "-6px"})`,
                    width: "560px",
                    background: C.bgCard,
                    border: `1px solid ${C.borderGold}`,
                    borderRadius: "14px",
                    padding: "20px",
                    zIndex: 100,
                    opacity: dropOpen ? 1 : 0,
                    visibility: dropOpen ? "visible" : "hidden",
                    transition: "opacity .18s, transform .18s, visibility .18s",
                  }}>
                    <div style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "0.18em", color: C.gold, textTransform: "uppercase", marginBottom: "14px" }}>
                      Sweet Collections
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "5px" }}>
                      <button key={sweetsCategory.slug} type="button" className="dc"
                          onClick={() => cat(sweetsCategory.slug)}
                          style={{
                            padding: "10px 8px", borderRadius: "8px", border: "none",
                            background: "transparent", color: C.cream,
                            fontSize: "12px", fontWeight: "500", textAlign: "left",
                            cursor: "pointer", transition: "background .12s, color .12s, box-shadow .12s",
                          }}
                        >
                          {sweetsCategory.name}
                        </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Col 3 — actions */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "4px" }}>

            {/* Expanding search */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              height: "44px",
              borderRadius: "22px",
              border: searchOpen ? `1px solid ${C.border}` : "1px solid transparent",
              background: searchOpen ? "rgba(232,136,58,0.10)" : "transparent",
              padding: searchOpen ? "0 12px 0 4px" : "0",
              overflow: "hidden",
              maxWidth: searchOpen ? "260px" : "44px",
              transition: "max-width .22s, border-color .22s, background .22s, padding .22s",
            }}>
              <IBtn label="Search" onClick={() => { setSearchOpen((v) => !v); setTimeout(() => searchRef.current?.focus(), 50); }}>
                <Search size={17} />
              </IBtn>
              <input
                ref={searchRef}
                className="si"
                placeholder="Search sweets…"
                style={{ opacity: searchOpen ? 1 : 0, transition: "opacity .2s" }}
                onKeyDown={(e) => e.key === "Escape" && setSearchOpen(false)}
              />
            </div>

            <IBtn label="Cart" onClick={() => { toggleCart(); }} badge={qty}>
              <ShoppingBag size={17} />
            </IBtn>

            <div style={{ position: "relative" }}>
              <IBtn label={isAuthenticated ? "Profile" : "Login"} onClick={handleProfileClick}>
                <User size={17} />
              </IBtn>

              {isAuthenticated && (
                <div style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  right: 0,
                  background: C.bgCard,
                  border: `1px solid ${C.borderGold}`,
                  borderRadius: "10px",
                  minWidth: "200px",
                  zIndex: 1000,
                  opacity: profileOpen ? 1 : 0,
                  visibility: profileOpen ? "visible" : "hidden",
                  transition: "opacity .18s, visibility .18s",
                  overflow: "hidden",
                  boxShadow: profileOpen ? "0 8px 24px rgba(0,0,0,0.12)" : "none",
                }}>
                  <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, fontSize: "13px", color: C.cream }}>
                    <div style={{ fontWeight: "600" }}>{user?.name || "User"}</div>
                    <div style={{ fontSize: "11px", color: C.muted, marginTop: "4px" }}>{user?.email}</div>
                  </div>
                  {user?.isAdmin === true && (
                    <button
                      type="button"
                      onClick={() => { setProfileOpen(false); navigate("/admin"); }}
                      style={{
                        width: "100%",
                        padding: "10px 16px",
                        background: "transparent",
                        border: "none",
                        textAlign: "left",
                        color: C.cream,
                        fontSize: "13px",
                        cursor: "pointer",
                        transition: "background .15s",
                      }}
                      onMouseEnter={(e) => e.target.style.background = C.bgActive}
                      onMouseLeave={(e) => e.target.style.background = "transparent"}
                    >
                      📊 Admin Dashboard
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleLogout}
                    style={{
                      width: "100%",
                      padding: "10px 16px",
                      background: "transparent",
                      border: "none",
                      textAlign: "left",
                      color: "#c41e3a",
                      fontSize: "13px",
                      fontWeight: "500",
                      cursor: "pointer",
                      transition: "background .15s",
                    }}
                    onMouseEnter={(e) => e.target.style.background = "rgba(196, 30, 58, 0.08)"}
                    onMouseLeave={(e) => e.target.style.background = "transparent"}
                  >
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>

            {isAuthenticated && (
              <span style={{
                marginLeft: "4px", padding: "4px 10px",
                borderRadius: "20px", border: `1px solid ${C.border}`,
                fontSize: "11px", color: C.muted,
                whiteSpace: "nowrap", maxWidth: "110px",
                overflow: "hidden", textOverflow: "ellipsis",
              }}>
                {user?.name?.split(" ")[0]}
              </span>
            )}
          </div>
        </div>

        {/* ════════════════════════════════════════
            MOBILE BAR  (below lg)
        ════════════════════════════════════════ */}
        <div className="mw-mb" style={{ alignItems: "center", justifyContent: "space-between", height: "92px", padding: "0 16px" }}>
          <button type="button" onClick={() => go("home")}
            style={{ display: "flex", alignItems: "center", gap: "10px", background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            <img
              src={brandLogo}
              alt="Mithai World"
              style={{ width: "auto", height: "80px", objectFit: "contain", flexShrink: 0 }}
            />
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
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

        {/* Mobile search bar */}
        <div className="mw-mb" style={{
          overflow: "hidden",
          maxHeight: searchOpen ? "70px" : "0",
          transition: "max-height .22s ease",
          borderTop: searchOpen ? `1px solid ${C.border}` : "none",
          width: "100%",
        }}>
          <div style={{ padding: "10px 16px", width: "100%" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: "8px",
              background: "rgba(255,255,255,0.78)", borderRadius: "10px",
              padding: "0 12px", height: "40px", border: `1px solid ${C.border}`, width: "100%",
            }}>
              <Search size={15} color={C.muted} />
              <input className="si" placeholder="Search sweets, snacks…" style={{ width: "100%" }}
                onKeyDown={(e) => e.key === "Escape" && setSearchOpen(false)}
                autoFocus={searchOpen}
              />
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════
            MOBILE DRAWER
        ════════════════════════════════════════ */}
        <div style={{
          overflow: "hidden",
          maxHeight: mobileOpen ? "720px" : "0",
          transition: "max-height .32s ease-in-out",
          borderTop: mobileOpen ? `1px solid ${C.border}` : "none",
          background: "linear-gradient(180deg, #ffefd3 0%, #ffe7c2 100%)",
        }}>
          <div style={{ padding: "12px 12px 24px" }}>

            {/* Nav links */}
            {navItems.map((item) => {
              const active = isCategoryActive(item.slug);

              if (item.slug !== "sweets") return (
                <button key={item.slug} type="button" className="mi"
                  onClick={() => go(item.slug)}
                  style={{
                    display: "flex", alignItems: "center", width: "100%",
                    padding: "13px 14px", borderRadius: "10px", border: "none",
                    background: active ? C.bgActive : "transparent",
                    color: active ? C.saffron : C.cream,
                    fontSize: "12px", fontWeight: "700", letterSpacing: "0.14em",
                    cursor: "pointer", transition: "background .12s, color .12s", marginBottom: "2px",
                    borderLeft: active ? `3px solid ${C.saffron}` : "3px solid transparent",
                  }}
                >
                  {item.name.toUpperCase()}
                </button>
              );

              return (
                <div key={item.slug} style={{ marginBottom: "2px" }}>
                  <button type="button" className="mi"
                    onClick={() => go("sweets")}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      width: "100%", padding: "13px 14px", borderRadius: "10px", border: "none",
                      background: active ? C.bgActive : "transparent",
                      color: active ? C.saffron : C.cream,
                      fontSize: "12px", fontWeight: "700", letterSpacing: "0.14em", cursor: "pointer",
                      transition: "background .12s, color .12s",
                      borderLeft: active ? `3px solid ${C.saffron}` : "3px solid transparent",
                    }}
                  >
                    {(sweetsCategory?.name || "SWEETS").toUpperCase()}
                    <ChevronDown size={13} style={{ transform: sweetsOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform .2s" }} />
                  </button>

                  <div style={{ overflow: "hidden", maxHeight: sweetsOpen ? "120px" : "0", transition: "max-height .28s ease" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "4px", padding: "6px 8px 8px" }}>
                      <button key={sweetsCategory?.slug || "sweets"} type="button" className="dc"
                          onClick={() => cat("sweets")}
                          style={{
                            padding: "10px 12px", borderRadius: "8px", border: "none",
                            background: "rgba(232,136,58,0.09)", color: C.cream,
                            fontSize: "12px", fontWeight: "500", textAlign: "left",
                            cursor: "pointer", transition: "background .12s, color .12s, box-shadow .12s",
                          }}
                        >
                          {sweetsCategory?.name || "Sweets"}
                        </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Auth */}
            <div style={{ marginTop: "10px" }}>
              {isAuthenticated ? (
                <div style={{
                  display: "flex", flexDirection: "column", gap: "8px",
                }}>
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "12px 14px", borderRadius: "10px", border: `1px solid ${C.border}`,
                  }}>
                    <span style={{ fontSize: "12px", color: C.muted }}>
                      Hi, <span style={{ color: C.cream, fontWeight: "600" }}>{user?.name?.split(" ")[0]}</span>
                    </span>
                  </div>
                  {user?.isAdmin === true && (
                    <button type="button"
                      onClick={() => { closeAll(); navigate("/admin"); }}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                        width: "100%", padding: "11px", borderRadius: "10px", border: `1px solid ${C.border}`,
                        background: "transparent",
                        color: C.saffron, fontSize: "12px", fontWeight: "700", letterSpacing: "0.06em", cursor: "pointer",
                      }}
                    >
                      📊 Admin Dashboard
                    </button>
                  )}
                  <button type="button"
                    onClick={() => { handleLogout(); closeAll(); }}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                      width: "100%", padding: "11px", borderRadius: "10px", border: "none",
                      background: "#c41e3a", color: "white",
                      fontSize: "12px", fontWeight: "700", letterSpacing: "0.06em", cursor: "pointer",
                    }}
                  >
                    🚪 Logout
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => navigate("/login")}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                    width: "100%", padding: "13px", borderRadius: "10px", border: "none",
                    background: C.saffron, color: C.bg,
                    fontSize: "13px", fontWeight: "800", letterSpacing: "0.06em", cursor: "pointer",
                  }}
                >
                  <User size={15} />
                  Login / Sign Up
                </button>
              )}
            </div>
          </div>
        </div>

      </nav>
    </>
  );
}

export default Navbar;