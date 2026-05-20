import { useMemo, useRef, useState, useEffect } from "react";
import { 
  ChevronDown, Menu, Search, 
  ShoppingBag, User, X, 
  LogOut, Package, LayoutDashboard,
  Heart, Bell, MapPin, Sparkles
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
  const [searchFocused, setSearchFocused] = useState(false);

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
    setProfileOpen(false);
  };

  const isCategoryActive = (slug) => {
    const params = new URLSearchParams(location.search);
    return params.get("category") === slug;
  };

  return (
    <>
      {/* ── TOP BAR (PROMOMOTIONAL) ── */}
      <div className="bg-[var(--burgundy)] text-white py-2 px-6 text-center overflow-hidden whitespace-nowrap">
        <div className="inline-flex items-center gap-8 animate-marquee-slow">
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] flex items-center gap-2">
            <Sparkles size={12} className="text-[var(--gold)]" /> Free Delivery Above ₹999
          </span>
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] flex items-center gap-2">
            <Bell size={12} className="text-[var(--gold)]" /> Diwali Pre-Orders Now Open!
          </span>
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] flex items-center gap-2 hidden md:inline-flex">
            <MapPin size={12} className="text-[var(--gold)]" /> Premium Desi Ghee Preparation
          </span>
        </div>
      </div>

      <nav className={`sticky top-0 z-[100] w-full transition-all duration-500 border-b ${
        scrolled 
          ? 'bg-white/80 backdrop-blur-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border-gray-100 py-3' 
          : 'bg-[var(--cream)] border-transparent py-5'
      }`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-10 flex items-center justify-between gap-8">
          
          {/* ── LOGO ── */}
          <button 
            onClick={() => navigate("/")} 
            className="group flex items-center gap-4 shrink-0 transition-transform active:scale-95"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-[var(--gold)]/20 rounded-full blur-xl group-hover:blur-2xl transition-all" />
              <img src={brandLogo} alt="Logo" className={`relative object-contain transition-all duration-500 ${scrolled ? 'h-10 w-10' : 'h-14 w-14 rotate-[-5deg] group-hover:rotate-0'}`} />
            </div>
            <div className="hidden sm:flex flex-col items-start leading-tight">
              <span className="serif text-2xl font-bold tracking-tight text-[var(--charcoal)] group-hover:text-[var(--burgundy)] transition-colors">Mithai World</span>
              <span className="text-[9px] font-black uppercase tracking-[0.4em] text-[var(--gold)] mt-0.5">Premium Indian Treats</span>
            </div>
          </button>

          {/* ── SEARCH BAR (MODERN DESKTOP) ── */}
          <div className="hidden md:flex flex-1 max-w-xl relative group">
            <div className={`absolute inset-0 bg-white rounded-2xl shadow-inner transition-all duration-300 border-2 ${searchFocused ? 'ring-4 ring-[var(--burgundy)]/5 border-[var(--burgundy)] scale-[1.02]' : 'border-[var(--surface-border)] group-hover:border-[var(--gold)]'}`} />
            <div className="relative flex items-center w-full h-12 px-5 gap-3">
              <Search size={18} className={`transition-colors duration-300 ${searchFocused ? 'text-[var(--burgundy)]' : 'text-[var(--muted)]'}`} />
              <input 
                type="text" 
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                placeholder="Search for Kaju Katli, Besan Laddu..." 
                className="bg-transparent w-full h-full text-sm font-medium focus:outline-none placeholder:text-gray-400"
              />
              <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gray-50 border border-gray-100 text-[10px] font-bold text-gray-400">
                <span className="border-b-2 border-gray-300 px-0.5">CMD</span>
                <span>K</span>
              </div>
            </div>
          </div>

          {/* ── ACTION ICONS ── */}
          <div className="flex items-center gap-1 lg:gap-3 shrink-0">
            
            {/* Desktop Quick Nav */}
            <div className="hidden lg:flex items-center gap-6 mr-6 border-r border-gray-200 pr-8">
              <button 
                onClick={() => navigate("/sweets")}
                className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--charcoal)] hover:text-[var(--burgundy)] transition-all relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-0.5 after:bg-[var(--burgundy)] hover:after:w-full after:transition-all"
              >
                Products
              </button>
              <div 
                className="relative"
                onMouseEnter={() => setDropOpen(true)}
                onMouseLeave={() => setDropOpen(false)}
              >
                <button className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--charcoal)] hover:text-[var(--burgundy)] transition-all">
                  Collections <ChevronDown size={14} className={`transition-transform duration-300 ${dropOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Mega Menu Dropdown */}
                <div className={`absolute left-0 top-full pt-4 transition-all duration-300 ${dropOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-4'}`}>
                  <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] p-6 min-w-[320px] overflow-hidden">
                    <div className="grid grid-cols-1 gap-2">
                      <div className="text-[10px] font-bold text-[var(--gold)] uppercase tracking-[0.3em] mb-2 pl-3">Sweets & Mithai</div>
                      {sweetsCategories.map(cat => (
                        <button
                          key={cat._id}
                          onClick={() => handleNav(`/sweets?category=${cat.slug}`)}
                          className="flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold text-gray-600 hover:bg-[var(--cream)] hover:text-[var(--burgundy)] transition-all group"
                        >
                          {cat.name}
                          <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button 
              onClick={toggleCart} 
              className="relative p-3 text-[var(--charcoal)] hover:bg-white hover:text-[var(--burgundy)] hover:shadow-lg rounded-2xl transition-all active:scale-95"
            >
              <ShoppingBag size={22} />
              {cartCount > 0 && (
                <span className="absolute top-2 right-2 h-5 w-5 bg-[var(--burgundy)] text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-lg animate-bounce">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Profile Menu */}
            <div className="relative ml-2">
              <button 
                onClick={() => isAuthenticated ? setProfileOpen(!profileOpen) : navigate("/login")}
                className={`flex items-center gap-3 p-1.5 rounded-2xl transition-all border-2 ${
                  profileOpen 
                    ? 'bg-white border-[var(--burgundy)] shadow-lg' 
                    : 'bg-white/50 border-transparent hover:border-[var(--gold)] hover:bg-white'
                }`}
              >
                <div className="h-9 w-9 rounded-xl bg-[var(--burgundy)] text-white flex items-center justify-center shadow-lg relative overflow-hidden group">
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                  <User size={18} className="relative" />
                </div>
                {isAuthenticated && (
                  <div className="hidden lg:flex flex-col items-start pr-4 leading-none">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--charcoal)]">{user.name?.split(' ')[0]}</span>
                    <span className="text-[9px] font-bold text-[var(--muted)] mt-0.5">My Account</span>
                  </div>
                )}
              </button>

              {profileOpen && isAuthenticated && (
                <div className="absolute right-0 mt-4 w-64 bg-white rounded-3xl border border-gray-100 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] py-4 animate-in fade-in zoom-in-95 duration-300">
                  <div className="px-6 py-4 border-b border-gray-50 mb-2">
                    <div className="text-sm font-black text-[var(--charcoal)] truncate">{user.name}</div>
                    <div className="text-[10px] text-[var(--muted)] truncate font-bold uppercase tracking-wider mt-0.5">{user.email}</div>
                  </div>
                  
                  <div className="px-2 space-y-1">
                    {user.isAdmin && (
                      <button onClick={() => handleNav("/admin")} className="w-full flex items-center gap-4 px-4 py-3 text-xs font-bold text-gray-600 hover:bg-[var(--cream)] hover:text-[var(--burgundy)] rounded-2xl transition-all">
                        <LayoutDashboard size={18} className="text-[var(--gold)]" /> Admin Dashboard
                      </button>
                    )}
                    <button onClick={() => handleNav("/my-orders")} className="w-full flex items-center gap-4 px-4 py-3 text-xs font-bold text-gray-600 hover:bg-[var(--cream)] hover:text-[var(--burgundy)] rounded-2xl transition-all">
                      <Package size={18} className="text-[var(--gold)]" /> My Orders
                    </button>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-50 px-2">
                    <button 
                      onClick={() => logout()}
                      className="w-full flex items-center gap-4 px-4 py-3 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-2xl transition-all"
                    >
                      <LogOut size={18} /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button 
              onClick={() => setMobileOpen(!mobileOpen)} 
              className="lg:hidden p-3 text-[var(--charcoal)] hover:bg-white rounded-2xl transition-all active:scale-95 ml-1"
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* ── MOBILE MENU ── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-[110] bg-white animate-in slide-in-from-right duration-500">
          <div className="flex flex-col h-full">
            <div className="p-6 flex items-center justify-between border-b border-gray-100">
              <div className="flex items-center gap-3">
                <img src={brandLogo} className="h-10 w-10" alt="" />
                <span className="serif text-xl font-bold">Mithai World</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="p-2 bg-gray-50 rounded-full">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input type="text" placeholder="Search sweets..." className="w-full h-14 bg-gray-50 rounded-2xl pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--burgundy)]/10" />
              </div>

              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--gold)]">Explore Menu</p>
                <div className="grid grid-cols-1 gap-2">
                  <button onClick={() => handleNav("/sweets")} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl text-sm font-bold text-gray-700">
                    All Products <ChevronRight size={18} />
                  </button>
                  {sweetsCategories.map(cat => (
                    <button key={cat._id} onClick={() => handleNav(`/sweets?category=${cat.slug}`)} className="flex items-center justify-between p-4 border border-gray-100 rounded-2xl text-sm font-bold text-gray-600">
                      {cat.name} <ChevronRight size={18} className="text-gray-300" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100">
              {isAuthenticated ? (
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-12 w-12 rounded-2xl bg-[var(--burgundy)] text-white flex items-center justify-center shadow-lg">
                    <User size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-gray-800">{user.name}</p>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Premium Member</p>
                  </div>
                </div>
              ) : (
                <button onClick={() => handleNav("/login")} className="w-full h-14 bg-[var(--burgundy)] text-white rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl shadow-[var(--burgundy)]/20 mb-6">
                  Login / Register
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const ChevronRight = ({ size, className }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="3" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="m9 18 6-6-6-6" />
  </svg>
);

export default Navbar;
