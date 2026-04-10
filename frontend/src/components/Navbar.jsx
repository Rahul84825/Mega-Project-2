/**
 * Navbar.jsx — "Dark Editorial Mithai"
 *
 * Design language:
 *  • Deep charcoal (#0f0d0b) base — feels premium, not just dark
 *  • Saffron (#e8883a) as the single accent — warm, Indian, distinctive
 *  • Gold (#c9a84c) for secondary glows and labels
 *  • Underline-bar active state — editorial, not pill/capsule
 *  • Inline expanding search — no modal, no overlay
 *  • 3-column CSS grid on desktop — mathematically centered nav
 *  • Fully separate mobile bar — no breakpoint conflicts
 */

import { useState, useRef } from "react";
import {
  ChevronDown,
  MapPin,
  Menu,
  Search,
  ShoppingBag,
  User,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart }     from "../context/CartContext";
import { useAuth }     from "../context/AuthContext";
import brandLogo       from "../assets/image.png";

/* ─── Design tokens ─────────────────────────────────── */
const C = {
  bg:        "#2f190d",
  bgCard:    "#fff8ee",
  bgHover:   "rgba(232,136,58,0.16)",
  bgActive:  "rgba(232,136,58,0.20)",
  border:    "rgba(83,44,22,0.24)",
  borderGold:"rgba(201,168,76,0.55)",
  saffron:   "#e8883a",
  gold:      "#c9a84c",
  cream:     "#3b2417",
  muted:     "rgba(59,36,23,0.68)",
};

/* ─── Static data ────────────────────────────────────── */
const NAV = [
  { label: "ALL",     key: "home"    },
  { label: "SWEETS",  key: "sweets"  },
  { label: "SNACKS",  key: "snacks"  },
  { label: "NAMKEEN", key: "namkeen" },
  { label: "BAKERY",  key: "bakery"  },
];

const SWEETS = [
  "Halwa","Bengali Sweets","Pedha","Gulab Jamun","Sugarfree",
  "Dryfruit Sweets","Shrikhand","Burfi","Others","Laddu",
];

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
        position:       "relative",
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        width:          "38px",
        height:         "38px",
        borderRadius:   "50%",
        border:         "none",
        background:     h ? C.bgHover : "transparent",
        color:          C.cream,
        cursor:         "pointer",
        flexShrink:     0,
        transition:     "background .15s",
      }}
    >
      {children}
      {badge > 0 && (
        <span style={{
          position:       "absolute",
          top: "3px", right: "3px",
          minWidth:       "15px",
          height:         "15px",
          background:     C.saffron,
          borderRadius:   "8px",
          fontSize:       "9px",
          fontWeight:     "800",
          color:          C.bg,
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          padding:        "0 3px",
          lineHeight:     1,
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
export default function Navbar({ page, setPage, setCategory }) {
  const { cart }                          = useCart();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate                          = useNavigate();

  const qty = cart.reduce((s, i) => s + i.qty, 0);

  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [sweetsOpen,  setSweetsOpen]  = useState(false);
  const [dropOpen,    setDropOpen]    = useState(false);
  const [searchOpen,  setSearchOpen]  = useState(false);
  const searchRef = useRef(null);

  const closeAll = () => { setMobileOpen(false); setSweetsOpen(false); };
  const go  = (key) => { setPage(key); closeAll(); setSearchOpen(false); };
  const cat = (name) => { setPage("sweets"); setCategory?.(name); closeAll(); setDropOpen(false); };
  const authAction = isAuthenticated
    ? () => { logout(); setPage("home"); navigate("/login"); }
    : () => navigate("/login");

  /* Nav link style */
  const nlStyle = (key) => ({
    display:        "inline-flex",
    alignItems:     "center",
    gap:            "3px",
    padding:        "6px 10px",
    fontSize:       "11px",
    fontWeight:     "700",
    letterSpacing:  "0.13em",
    color:          page === key ? C.saffron : C.muted,
    background:     "transparent",
    border:         "none",
    borderBottom:   page === key ? `2px solid ${C.saffron}` : "2px solid transparent",
    cursor:         "pointer",
    whiteSpace:     "nowrap",
    transition:     "color .15s, border-color .15s",
  });

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
        input.si { background:transparent;border:none;outline:none;color:${C.cream};font-size:13px;flex:1 }
        input.si::placeholder { color:${C.muted} }
      `}</style>

      <nav style={{ position:"sticky", top:0, zIndex:50, width:"100%", background:"#fff3e0", borderBottom:`1px solid ${C.border}` }}>

        {/* ════════════════════════════════════════
            DESKTOP  (lg+)   grid: 1fr | auto | 1fr
        ════════════════════════════════════════ */}
        <div
          className="mw-dt"
          style={{
            maxWidth:            "1280px",
            margin:              "0 auto",
            padding:             "0 32px",
            height:              "68px",
            alignItems:          "center",
            gridTemplateColumns: "1fr auto 1fr",
          }}
        >
          {/* Col 1 — brand */}
          <div style={{ display:"flex", alignItems:"center", gap:"14px" }}>
            <img
              src={brandLogo}
              alt="Mithai World"
              style={{ width:"44px", height:"44px", objectFit:"contain", flexShrink:0 }}
            />

            <button type="button" className="dp-pill"
              style={{
                display:"flex", alignItems:"center", gap:"7px",
                padding:"7px 12px", borderRadius:"8px",
                border:`1px solid ${C.border}`, background:"rgba(255,255,255,0.58)", cursor:"pointer", transition:"border-color .15s, background .15s",
              }}>
              <MapPin size={13} color={C.gold} strokeWidth={2} />
              <div style={{ lineHeight:1.3, textAlign:"left" }}>
                <div style={{ fontSize:"9px", color:C.muted, letterSpacing:"0.14em", textTransform:"uppercase" }}>Deliver to</div>
                <div style={{ fontSize:"12px", color:C.cream, fontWeight:"600" }}>Select Address</div>
              </div>
            </button>
          </div>

          {/* Col 2 — nav (true center via auto column) */}
          <ul style={{ display:"flex", alignItems:"center", gap:"2px", listStyle:"none", margin:0, padding:0 }}>
            {NAV.map((item) => {
              if (item.key !== "sweets") return (
                <li key={item.key}>
                  <button type="button" className="nl" onClick={() => go(item.key)} style={nlStyle(item.key)}>
                    {item.label}
                  </button>
                </li>
              );
              return (
                <li key={item.key} style={{ position:"relative" }}
                  onMouseEnter={() => setDropOpen(true)}
                  onMouseLeave={() => setDropOpen(false)}
                >
                  <button type="button" className="nl" onClick={() => go("sweets")} style={nlStyle("sweets")}>
                    SWEETS
                    <ChevronDown size={11} style={{ transform: dropOpen ? "rotate(180deg)" : "rotate(0)", transition:"transform .2s", flexShrink:0 }} />
                  </button>

                  {/* Megamenu */}
                  <div style={{
                    position:   "absolute",
                    top:        "calc(100% + 10px)",
                    left:       "50%",
                    transform:  `translateX(-50%) translateY(${dropOpen ? "0" : "-6px"})`,
                    width:      "560px",
                    background: C.bgCard,
                    border:     `1px solid ${C.borderGold}`,
                    borderRadius:"14px",
                    padding:    "20px",
                    zIndex:     100,
                    opacity:    dropOpen ? 1 : 0,
                    visibility: dropOpen ? "visible" : "hidden",
                    transition: "opacity .18s, transform .18s, visibility .18s",
                  }}>
                    <div style={{ fontSize:"10px", fontWeight:"700", letterSpacing:"0.18em", color:C.gold, textTransform:"uppercase", marginBottom:"14px" }}>
                      Sweet Categories
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(5, 1fr)", gap:"5px" }}>
                      {SWEETS.map((name) => (
                        <button key={name} type="button" className="dc"
                          onClick={() => cat(name)}
                          style={{
                            padding:"10px 8px", borderRadius:"8px", border:"none",
                            background:"transparent", color:C.cream,
                            fontSize:"12px", fontWeight:"500", textAlign:"left",
                            cursor:"pointer", transition:"background .12s, color .12s, box-shadow .12s",
                          }}
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Col 3 — actions */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"flex-end", gap:"4px" }}>

            {/* Expanding search */}
            <div style={{
              display:      "flex",
              alignItems:   "center",
              gap:          "6px",
              height:       "38px",
              borderRadius: "19px",
              border:       searchOpen ? `1px solid ${C.border}` : "1px solid transparent",
              background:   searchOpen ? "rgba(232,136,58,0.10)" : "transparent",
              padding:      searchOpen ? "0 12px 0 4px" : "0",
              overflow:     "hidden",
              maxWidth:     searchOpen ? "230px" : "38px",
              transition:   "max-width .22s, border-color .22s, background .22s, padding .22s",
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

            <IBtn label="Cart" onClick={() => go("cart")} badge={qty}>
              <ShoppingBag size={17} />
            </IBtn>

            <IBtn label={isAuthenticated ? "Logout" : "Login"} onClick={authAction}>
              <User size={17} />
            </IBtn>

            {isAuthenticated && (
              <span style={{
                marginLeft:"4px", padding:"4px 10px",
                borderRadius:"20px", border:`1px solid ${C.border}`,
                fontSize:"11px", color:C.muted,
                whiteSpace:"nowrap", maxWidth:"110px",
                overflow:"hidden", textOverflow:"ellipsis",
              }}>
                {user?.name?.split(" ")[0]}
              </span>
            )}
          </div>
        </div>

        {/* ════════════════════════════════════════
            MOBILE BAR  (below lg)
        ════════════════════════════════════════ */}
        <div className="mw-mb" style={{ alignItems:"center", justifyContent:"space-between", height:"60px", padding:"0 16px" }}>
          <button type="button" onClick={() => go("home")}
            style={{ display:"flex", alignItems:"center", gap:"10px", background:"none", border:"none", cursor:"pointer", padding:0 }}
          >
            <img
              src={brandLogo}
              alt="Mithai World"
              style={{ width:"34px", height:"34px", objectFit:"contain", flexShrink:0 }}
            />
          </button>

          <div style={{ display:"flex", alignItems:"center", gap:"2px" }}>
            <IBtn label="Search" onClick={() => setSearchOpen((v) => !v)}>
              <Search size={17} />
            </IBtn>
            <IBtn label="Cart" onClick={() => go("cart")} badge={qty}>
              <ShoppingBag size={17} />
            </IBtn>
            <IBtn label={isAuthenticated ? "Logout" : "Login"} onClick={authAction}>
              <User size={17} />
            </IBtn>
            <IBtn label="Menu" onClick={() => setMobileOpen((v) => !v)}>
              {mobileOpen ? <X size={17} /> : <Menu size={17} />}
            </IBtn>
          </div>
        </div>

        {/* Mobile search bar */}
        <div style={{
          overflow:   "hidden",
          maxHeight:  searchOpen ? "70px" : "0",
          transition: "max-height .22s ease",
          borderTop:  searchOpen ? `1px solid ${C.border}` : "none",
        }}>
          <div style={{ padding:"10px 16px" }}>
            <div style={{
              display:"flex", alignItems:"center", gap:"8px",
              background:"rgba(255,255,255,0.78)", borderRadius:"10px",
              padding:"0 12px", height:"40px", border:`1px solid ${C.border}`,
            }}>
              <Search size={15} color={C.muted} />
              <input className="si" placeholder="Search sweets, snacks…" style={{ width:"100%" }}
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
          overflow:   "hidden",
          maxHeight:  mobileOpen ? "720px" : "0",
          transition: "max-height .32s ease-in-out",
          borderTop:  mobileOpen ? `1px solid ${C.border}` : "none",
          background: "linear-gradient(180deg, #ffefd3 0%, #ffe7c2 100%)",
        }}>
          <div style={{ padding:"12px 12px 24px" }}>

            {/* Delivery */}
            <div style={{
              display:"flex", alignItems:"center", gap:"10px",
              padding:"12px 14px", borderRadius:"10px",
              border:`1px solid ${C.border}`, marginBottom:"8px",
              background:"rgba(255,255,255,0.66)",
            }}>
              <MapPin size={14} color={C.gold} />
              <div style={{ lineHeight:1.3 }}>
                <div style={{ fontSize:"9px", color:C.muted, letterSpacing:"0.16em", textTransform:"uppercase" }}>Deliver to</div>
                <div style={{ fontSize:"13px", color:C.cream, fontWeight:"600" }}>Select Address</div>
              </div>
            </div>

            {/* Nav links */}
            {NAV.map((item) => {
              const active = page === item.key || (item.key === "sweets" && page === "sweets");

              if (item.key !== "sweets") return (
                <button key={item.key} type="button" className="mi"
                  onClick={() => go(item.key)}
                  style={{
                    display:"flex", alignItems:"center", width:"100%",
                    padding:"13px 14px", borderRadius:"10px", border:"none",
                    background: page === item.key ? C.bgActive : "transparent",
                    color:      page === item.key ? C.saffron  : C.cream,
                    fontSize:"12px", fontWeight:"700", letterSpacing:"0.14em",
                    cursor:"pointer", transition:"background .12s, color .12s", marginBottom:"2px",
                    borderLeft: page === item.key ? `3px solid ${C.saffron}` : "3px solid transparent",
                  }}
                >
                  {item.label}
                </button>
              );

              return (
                <div key={item.key} style={{ marginBottom:"2px" }}>
                  <button type="button" className="mi"
                    onClick={() => setSweetsOpen((v) => !v)}
                    style={{
                      display:"flex", alignItems:"center", justifyContent:"space-between",
                      width:"100%", padding:"13px 14px", borderRadius:"10px", border:"none",
                      background: active ? C.bgActive : "transparent",
                      color:      active ? C.saffron  : C.cream,
                      fontSize:"12px", fontWeight:"700", letterSpacing:"0.14em", cursor:"pointer",
                      transition:"background .12s, color .12s",
                      borderLeft: active ? `3px solid ${C.saffron}` : "3px solid transparent",
                    }}
                  >
                    SWEETS
                    <ChevronDown size={13} style={{ transform: sweetsOpen ? "rotate(180deg)" : "rotate(0)", transition:"transform .2s" }} />
                  </button>

                  <div style={{ overflow:"hidden", maxHeight: sweetsOpen ? "380px" : "0", transition:"max-height .28s ease" }}>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"4px", padding:"6px 8px 8px" }}>
                      {SWEETS.map((name) => (
                        <button key={name} type="button" className="dc"
                          onClick={() => cat(name)}
                          style={{
                            padding:"10px 12px", borderRadius:"8px", border:"none",
                            background:"rgba(232,136,58,0.09)", color:C.cream,
                            fontSize:"12px", fontWeight:"500", textAlign:"left",
                            cursor:"pointer", transition:"background .12s, color .12s, box-shadow .12s",
                          }}
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Auth */}
            <div style={{ marginTop:"10px" }}>
              {isAuthenticated ? (
                <div style={{
                  display:"flex", alignItems:"center", justifyContent:"space-between",
                  padding:"12px 14px", borderRadius:"10px", border:`1px solid ${C.border}`,
                }}>
                  <span style={{ fontSize:"12px", color:C.muted }}>
                    Hi, <span style={{ color:C.cream, fontWeight:"600" }}>{user?.name?.split(" ")[0]}</span>
                  </span>
                  <button type="button"
                    onClick={() => { logout(); setPage("home"); navigate("/login"); }}
                    style={{
                      padding:"6px 14px", borderRadius:"8px",
                      border:`1px solid ${C.border}`, background:"transparent",
                      color:C.cream, fontSize:"11px", fontWeight:"700", cursor:"pointer",
                    }}
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => navigate("/login")}
                  style={{
                    display:"flex", alignItems:"center", justifyContent:"center", gap:"8px",
                    width:"100%", padding:"13px", borderRadius:"10px", border:"none",
                    background:C.saffron, color:C.bg,
                    fontSize:"13px", fontWeight:"800", letterSpacing:"0.06em", cursor:"pointer",
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