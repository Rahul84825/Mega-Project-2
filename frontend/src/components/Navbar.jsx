import { useMemo, useRef, useState, useEffect } from "react";
import { 
  ChevronDown, Menu, Search, 
  ShoppingBag, User, X, 
  Store, LogOut, Package, LayoutDashboard
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useProducts } from "../context/ProductContext";
import brandLogo from "../assets/image.png";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart, toggleCart } = useCart();
  const { user, isAuthenticated, logout } = useAuth();
  const { categories } = useProducts();
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);

  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navbarCategories = useMemo(() => {
    const list = Array.isArray(categories) ? categories : [];
    return list.filter(c => c.showInNavbar && c.is_active !== false);
  }, [categories]);

  const sweetsCategories = useMemo(() => {
    const list = Array.isArray(categories) ? categories : [];
    return list.filter(c => c.type === "sweets" && c.is_active !== false);
  }, [categories]);

  const handleNav = (path) => {
    navigate(path);
    setMobileOpen(false);
    setDropOpen(false);
  };

  const isCategoryActive = (slug) => {
    const params = new URLSearchParams(location.search);
    return params.get("category") === slug;
  };

  return (
    <nav className={`sticky top-0 z-50 w-full transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-lg h-20' : 'bg-[var(--cream)] h-24'}`}>
      <div className="max-w-7xl mx-auto h-full px-6 sm:px-8 flex items-center justify-between">
        
        {/* ── LOGO ── */}
        <button onClick={() => navigate("/")} className="flex items-center gap-3">
          <img src={brandLogo} alt="Logo" className={`transition-all duration-300 ${scrolled ? 'h-12' : 'h-14'}`} />
          <span className="serif text-2xl font-medium text-[var(--charcoal)] hidden sm:block">Mithai World</span>
        </button>

        {/* ── DESKTOP NAV ── */}
        <div className="hidden lg:flex items-center gap-10">
          <button
            onClick={() => handleNav("/sweets")}
            className={`text-[11px] font-medium uppercase tracking-[0.25em] transition-colors hover:text-[var(--burgundy)]
              ${location.pathname === "/sweets" && !location.search ? 'text-[var(--burgundy)]' : 'text-[var(--muted)]'}`}
          >
            All Products
          </button>

          <div 
            className="relative group"
            onMouseEnter={() => setDropOpen(true)}
            onMouseLeave={() => setDropOpen(false)}
          >
            <button
              className={`flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.25em] transition-colors hover:text-[var(--burgundy)]
                ${location.pathname === "/sweets" && sweetsCategories.some(c => isCategoryActive(c.slug)) ? 'text-[var(--burgundy)]' : 'text-[var(--muted)]'}`}
            >
              Sweets <ChevronDown size={14} className={`transition-transform duration-300 ${dropOpen ? 'rotate-180' : ''}`} />
            </button>

            <div className={`absolute left-1/2 -translate-x-1/2 top-full pt-6 transition-all duration-300 ${dropOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'}`}>
              <div className="bg-white rounded-2xl border border-[var(--surface-border)] shadow-2xl p-8 min-w-[440px]">
                <div className="grid grid-cols-2 gap-3">
                  {sweetsCategories.map(cat => (
                    <button
                      key={cat._id}
                      onClick={() => handleNav(`/sweets?category=${cat.slug}`)}
                      className={`text-left px-5 py-3 rounded-xl text-xs font-medium transition-all
                        ${isCategoryActive(cat.slug) ? 'bg-[var(--surface-strong)] text-[var(--burgundy)]' : 'text-[var(--charcoal)] hover:bg-[var(--cream)]'}`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {navbarCategories.filter(c => c.type !== "sweets").map(cat => (
            <button
              key={cat._id}
              onClick={() => handleNav(`/sweets?category=${cat.slug}`)}
              className={`text-[11px] font-medium uppercase tracking-[0.25em] transition-colors hover:text-[var(--burgundy)]
                ${isCategoryActive(cat.slug) ? 'text-[var(--burgundy)]' : 'text-[var(--muted)]'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* ── ACTIONS ── */}
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/sweets")} className="p-2.5 text-[var(--charcoal)] hover:bg-[var(--surface-strong)] rounded-full transition-colors">
            <Search size={22} />
          </button>
          
          <button onClick={toggleCart} className="relative p-2.5 text-[var(--charcoal)] hover:bg-[var(--surface-strong)] rounded-full transition-colors">
            <ShoppingBag size={22} />
            {cartCount > 0 && (
              <span className="absolute top-0 right-0 h-5 w-5 bg-[var(--burgundy)] text-white text-[10px] font-medium rounded-full flex items-center justify-center border-2 border-white">
                {cartCount}
              </span>
            )}
          </button>

          <div className="relative">
            <button 
              onClick={() => isAuthenticated ? setProfileOpen(!profileOpen) : navigate("/login")}
              className="flex items-center gap-3 p-2 rounded-full bg-[var(--surface-strong)] hover:bg-[var(--gold)]/20 transition-all border border-[var(--surface-border)]"
            >
              <div className="h-8 w-8 rounded-full bg-[var(--burgundy)] text-white flex items-center justify-center shadow-md">
                <User size={18} />
              </div>
              {isAuthenticated && <span className="text-[11px] font-medium uppercase tracking-widest text-[var(--charcoal)] pr-3 hidden sm:block">{user.name?.split(' ')[0]}</span>}
            </button>

            {profileOpen && isAuthenticated && (
              <div className="absolute right-0 mt-4 w-60 bg-white rounded-2xl border border-[var(--surface-border)] shadow-2xl py-3 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-5 py-4 border-b border-[var(--surface-border)] mb-2">
                  <div className="text-sm font-medium text-[var(--charcoal)] truncate">{user.name}</div>
                  <div className="text-[11px] text-[var(--muted)] truncate font-medium">{user.email}</div>
                </div>
                
                {user.isAdmin && (
                  <button onClick={() => { handleNav("/admin"); setProfileOpen(false); }} className="w-full flex items-center gap-3 px-5 py-3 text-xs font-medium text-[var(--charcoal)] hover:bg-[var(--cream)] transition-colors">
                    <LayoutDashboard size={16} className="text-[var(--gold)]" /> Admin Dashboard
                  </button>
                )}
                
                <button onClick={() => { handleNav("/my-orders"); setProfileOpen(false); }} className="w-full flex items-center gap-3 px-5 py-3 text-xs font-medium text-[var(--charcoal)] hover:bg-[var(--cream)] transition-colors">
                  <Package size={16} className="text-[var(--gold)]" /> My Orders
                </button>
                
                <button 
                  onClick={() => { logout(); setProfileOpen(false); }}
                  className="w-full flex items-center gap-3 px-5 py-3 text-xs font-medium text-[var(--burgundy)] hover:bg-red-50 transition-colors border-t border-[var(--surface-border)] mt-2"
                >
                  <LogOut size={16} /> Sign Out
                </button>
              </div>
            )}
          </div>

          <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2.5 text-[var(--charcoal)]">
            {mobileOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden absolute top-full left-0 w-full bg-white border-b border-[var(--surface-border)] shadow-2xl animate-in slide-in-from-top duration-300">
          <div className="p-8 space-y-6 max-h-[75vh] overflow-y-auto">
            <button onClick={() => handleNav("/sweets")} className="w-full text-left text-base font-medium uppercase tracking-widest text-[var(--charcoal)] border-b border-gray-100 pb-4">
              All Products
            </button>
            
            <div className="space-y-4">
              <div className="text-[11px] font-medium text-[var(--gold)] uppercase tracking-widest">Sweets Collection</div>
              <div className="grid grid-cols-2 gap-4">
                {sweetsCategories.map(cat => (
                  <button key={cat._id} onClick={() => handleNav(`/sweets?category=${cat.slug}`)} className="text-left text-xs font-medium text-[var(--muted)] py-1 hover:text-[var(--burgundy)]">
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {navbarCategories.filter(c => c.type !== "sweets").length > 0 && (
              <div className="space-y-4 pt-4 border-t border-gray-100">
                <div className="text-[11px] font-medium text-[var(--gold)] uppercase tracking-widest">Featured</div>
                <div className="grid grid-cols-2 gap-4">
                  {navbarCategories.filter(c => c.type !== "sweets").map(cat => (
                    <button key={cat._id} onClick={() => handleNav(`/sweets?category=${cat.slug}`)} className="text-left text-xs font-medium text-[var(--muted)] py-1 hover:text-[var(--burgundy)]">
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
