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
import brandLogo from "../assets/logo.png";

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
  const [search, setSearch] = useState("");

  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearch = (e) => {
    if (e.key === "Enter" && search.trim()) {
      navigate(`/sweets?search=${encodeURIComponent(search.trim())}`);
      setSearch("");
      setSearchFocused(false);
      setMobileOpen(false);
    }
  };

  const navbarCategories = useMemo(() => {
    const list = Array.isArray(categories) ? categories : [];
    return list
      .filter(c => c.showInNavbar && c.is_active !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .slice(0, 6);
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
      <nav className={`sticky top-0 z-[100] w-full transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] border-b ${
        scrolled 
          ? 'bg-white/90 backdrop-blur-xl shadow-[0_10px_40px_-10px_rgba(139,30,63,0.15)] border-gray-100 py-2.5' 
          : 'bg-[var(--cream)] border-transparent py-4'
      }`}>
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 flex items-center justify-between gap-4 lg:gap-8">
          
          <button 
            onClick={() => navigate("/")} 
            className="group flex items-center gap-2 sm:gap-4 shrink-0 transition-all duration-500"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-[var(--gold)]/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-700" />
              <img src={brandLogo} alt="Logo" className={`relative object-contain transition-all duration-700 ease-out ${scrolled ? 'h-12 w-12' : 'h-16 w-16'}`} />
            </div>
            <div className="flex flex-col items-start leading-none">
              <span className={`font-serif font-black tracking-tighter transition-all duration-500 ${scrolled ? 'text-base text-[var(--burgundy)]' : 'text-xl text-[var(--burgundy)]'}`}>
                Mithai
              </span>
              <span className={`font-sans font-bold uppercase tracking-[0.3em] transition-all duration-500 ${scrolled ? 'text-[7px] text-[var(--gold)]' : 'text-[9px] text-[var(--gold)]'}`}>
                World
              </span>
            </div>
          </button>

          {/* ── SEARCH BAR (MODERN DESKTOP) ── */}
          <div className="hidden md:flex flex-1 max-w-lg relative group">
            <div className={`absolute inset-0 bg-white rounded-2xl shadow-inner transition-all duration-500 ease-out border-2 ${searchFocused ? 'ring-8 ring-[var(--burgundy)]/5 border-[var(--burgundy)] scale-[1.03]' : 'border-[var(--surface-border)] group-hover:border-[var(--gold)]'}`} />
            <div className="relative flex items-center w-full h-11 px-5 gap-3">
              <Search size={16} className={`transition-all duration-500 ${searchFocused ? 'text-[var(--burgundy)] scale-110' : 'text-[var(--muted)]'}`} />
              <input 
                type="text" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleSearch}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                placeholder="Search treats..." 
                className="bg-transparent w-full h-full text-sm font-medium focus:outline-none placeholder:text-gray-400 transition-all"
              />
              <div className={`hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gray-50 border border-gray-100 text-[9px] font-bold text-gray-400 transition-all duration-500 ${searchFocused ? 'opacity-0 translate-x-4' : 'opacity-100'}`}>
                <span className="border-b-2 border-gray-300 px-0.5">CMD</span>
                <span>K</span>
              </div>
            </div>
          </div>

          {/* ── ACTION ICONS ── */}
          <div className="flex items-center gap-1 sm:gap-2 lg:gap-3 shrink-0">
            
            {/* Desktop Quick Nav */}
            <div className="hidden lg:flex items-center gap-6 mr-6 border-r border-gray-200 pr-8">
              <button 
                onClick={() => navigate("/sweets")}
                className="text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--charcoal)] hover:text-[var(--burgundy)] transition-all relative group/nav"
              >
                Products
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[var(--burgundy)] transition-all duration-300 group-hover/nav:w-full" />
              </button>
              <div 
                className="relative"
                onMouseEnter={() => setDropOpen(true)}
                onMouseLeave={() => setDropOpen(false)}
              >
                <button className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--charcoal)] hover:text-[var(--burgundy)] transition-all group/coll">
                  Collections <ChevronDown size={12} className={`transition-transform duration-500 ease-out ${dropOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Mega Menu Dropdown */}
                <div className={`absolute left-0 top-full pt-4 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${dropOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-4'}`}>
                  <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_40px_80px_-15px_rgba(139,30,63,0.2)] p-6 min-w-[280px] overflow-hidden">
                    <div className="grid grid-cols-1 gap-1">
                      <div className="text-[9px] font-black text-[var(--gold)] uppercase tracking-[0.3em] mb-3 pl-3 opacity-60">Sweets & Mithai</div>
                      {navbarCategories.map(cat => (
                        <button
                          key={cat._id}
                          onClick={() => handleNav(`/sweets?category=${cat.slug}`)}
                          className="flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-[var(--cream)] hover:text-[var(--burgundy)] transition-all duration-300 group/item"
                        >
                          {cat.name}
                          <ChevronRight size={12} className="opacity-0 group-hover/item:opacity-100 transition-all duration-300 translate-x-[-8px] group-hover/item:translate-x-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button 
              onClick={toggleCart} 
              className="relative p-2.5 sm:p-3 text-[var(--charcoal)] hover:bg-white hover:text-[var(--burgundy)] hover:shadow-xl hover:-translate-y-0.5 rounded-2xl transition-all duration-300 active:scale-90 group"
            >
              <ShoppingBag size={20} className="group-hover:scale-110 transition-transform duration-500" />
              {cartCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-4 w-4 sm:h-5 sm:w-5 bg-[var(--burgundy)] text-white text-[8px] sm:text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-lg animate-in zoom-in duration-300">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Profile Menu */}
            <div className="relative ml-1 sm:ml-2">
              <button 
                onClick={() => isAuthenticated ? setProfileOpen(!profileOpen) : navigate("/login")}
                className={`flex items-center gap-2 sm:gap-3 p-1.5 rounded-2xl transition-all duration-500 border-2 ${
                  profileOpen 
                    ? 'bg-white border-[var(--burgundy)] shadow-xl -translate-y-0.5' 
                    : 'bg-white/50 border-transparent hover:border-[var(--gold)] hover:bg-white hover:shadow-lg'
                }`}
              >
                <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-[var(--burgundy)] text-white flex items-center justify-center shadow-lg relative overflow-hidden group">
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
                  <User size={16} sm:size={18} className="relative transition-transform duration-500 group-hover:scale-110" />
                </div>
                {isAuthenticated && (
                  <div className="hidden lg:flex flex-col items-start pr-4 leading-none">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--charcoal)]">{user.name?.split(' ')[0]}</span>
                    <span className="text-[8px] font-bold text-[var(--muted)] mt-0.5 opacity-70">Account</span>
                  </div>
                )}
              </button>

              {profileOpen && isAuthenticated && (
                <div className="absolute right-0 mt-4 w-64 bg-white rounded-3xl border border-gray-100 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.2)] py-4 animate-in fade-in slide-in-from-top-4 duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]">
                  <div className="px-6 py-4 border-b border-gray-50 mb-2">
                    <div className="text-sm font-black text-[var(--charcoal)] truncate">{user.name}</div>
                    <div className="text-[9px] text-[var(--muted)] truncate font-bold uppercase tracking-wider mt-0.5 opacity-70">{user.email}</div>
                  </div>
                  
                  <div className="px-2 space-y-1">
                    {user.isAdmin && (
                      <button onClick={() => handleNav("/admin")} className="w-full flex items-center gap-4 px-4 py-3 text-xs font-bold text-gray-600 hover:bg-[var(--cream)] hover:text-[var(--burgundy)] rounded-2xl transition-all duration-300">
                        <LayoutDashboard size={18} className="text-[var(--gold)]" /> Admin Dashboard
                      </button>
                    )}
                    <button onClick={() => handleNav("/my-orders")} className="w-full flex items-center gap-4 px-4 py-3 text-xs font-bold text-gray-600 hover:bg-[var(--cream)] hover:text-[var(--burgundy)] rounded-2xl transition-all duration-300">
                      <Package size={18} className="text-[var(--gold)]" /> My Orders
                    </button>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-50 px-2">
                    <button 
                      onClick={() => logout()}
                      className="w-full flex items-center gap-4 px-4 py-3 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-2xl transition-all duration-300"
                    >
                      <LogOut size={18} /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button 
              onClick={() => setMobileOpen(!mobileOpen)} 
              className="lg:hidden p-2.5 sm:p-3 text-[var(--charcoal)] hover:bg-white rounded-2xl transition-all duration-300 active:scale-90 ml-0.5"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </nav>

      {/* ── MOBILE MENU ── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-[120] bg-white animate-in slide-in-from-right-full duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]">
          <div className="flex flex-col h-full bg-[var(--cream)]/30">
            <div className="p-6 flex items-center justify-between border-b border-gray-100 bg-white">
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 bg-[var(--gold)]/10 rounded-full flex items-center justify-center p-2">
                   <img src={brandLogo} className="w-full h-full object-contain" alt="" />
                </div>
                <div className="flex flex-col items-start leading-none">
                  <span className="font-serif text-xl font-black tracking-tighter text-[var(--burgundy)]">
                    Mithai
                  </span>
                  <span className="font-sans text-[8px] font-bold uppercase tracking-[0.3em] text-[var(--gold)]">
                    World
                  </span>
                </div>
              </div>
              <button onClick={() => setMobileOpen(false)} className="p-2.5 bg-gray-50 hover:bg-gray-100 rounded-full transition-all active:scale-90 shadow-sm border border-gray-100">
                <X size={20} className="text-[var(--charcoal)]" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <div className="relative group">
                <div className="absolute inset-0 bg-white rounded-2xl shadow-sm transition-all group-focus-within:ring-4 group-focus-within:ring-[var(--burgundy)]/5" />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[var(--burgundy)] transition-colors" size={20} />
                <input 
                  type="text" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={handleSearch}
                  placeholder="Search sweets..." 
                  className="relative w-full h-14 bg-transparent rounded-2xl pl-12 pr-4 text-sm font-medium focus:outline-none" 
                />
              </div>

              <div className="space-y-6">
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[var(--gold)] opacity-70 ml-2">Main Menu</p>
                <div className="grid grid-cols-1 gap-2">
                  <button 
                    onClick={() => handleNav("/sweets")} 
                    className="flex items-center justify-between p-5 bg-white rounded-2xl text-sm font-bold text-[var(--charcoal)] shadow-sm active:scale-[0.98] transition-all border border-gray-100/50 animate-in slide-in-from-right duration-500 delay-100"
                  >
                    Explore Shop <ChevronRight size={16} className="text-[var(--burgundy)]" />
                  </button>
                  
                  <div className="space-y-2 mt-4">
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[var(--gold)] opacity-70 ml-2">Categories</p>
                    <div className="grid grid-cols-1 gap-2">
                      {navbarCategories.map((cat, idx) => (
                        <button 
                          key={cat._id} 
                          onClick={() => handleNav(`/sweets?category=${cat.slug}`)} 
                          style={{ animationDelay: `${200 + (idx * 50)}ms` }}
                          className="flex items-center justify-between p-4 border border-gray-100 bg-white/50 rounded-2xl text-xs font-bold text-gray-600 active:scale-[0.98] transition-all animate-in slide-in-from-right duration-500"
                        >
                          {cat.name} <ChevronRight size={14} className="text-gray-300" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white border-t border-gray-100 shadow-[0_-10px_30px_rgba(0,0,0,0.02)]">
              {isAuthenticated ? (
                <div className="flex items-center gap-4 bg-[var(--cream)]/50 p-4 rounded-2xl border border-[var(--surface-border)]">
                  <div className="h-12 w-12 rounded-2xl bg-[var(--burgundy)] text-white flex items-center justify-center shadow-lg transform rotate-3">
                    <User size={24} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-gray-800 truncate">{user.name}</p>
                    <p className="text-[10px] font-bold text-[var(--gold)] uppercase tracking-widest mt-0.5">Premium Member</p>
                  </div>
                  <button onClick={() => logout()} className="ml-auto p-2.5 text-rose-500 bg-rose-50 rounded-xl active:scale-90 transition-all">
                     <LogOut size={18} />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => handleNav("/login")} 
                  className="w-full h-14 bg-[var(--burgundy)] text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-2xl shadow-[var(--burgundy)]/30 active:scale-95 transition-all overflow-hidden relative group"
                >
                  <span className="relative z-10">Sign In to Order</span>
                  <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
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
