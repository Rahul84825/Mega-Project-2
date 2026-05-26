import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Package, PlusCircle, Tag, Ticket,
  ShoppingBag, Store, LogOut, ChevronLeft, Menu, Percent, Image as ImageIcon, Sparkles
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import brandLogo from "../assets/image.png";

const NAV_ITEMS = [
  { to: "/admin",            label: "Dashboard",   icon: LayoutDashboard, end: true },
  { to: "/admin/orders",     label: "Orders",      icon: ShoppingBag },
  { to: "/admin/products",    label: "Products",    icon: Package,     end: true },
  { to: "/admin/add-product", label: "Add Product", icon: PlusCircle },
  { to: "/admin/categories", label: "Categories",  icon: Tag },
  { to: "/admin/coupons",    label: "Coupons",     icon: Ticket },
  { to: "/admin/offers",     label: "Offers & Deals", icon: Percent },
  { to: "/admin/hero-banners", label: "Hero Banners", icon: ImageIcon },
];

const Sidebar = ({ mobile = false, collapsed, setCollapsed, mobileOpen, setMobileOpen, navigate, logout, navLinkClass }) => (
  <div className={`flex flex-col h-full bg-[#f5e6d3] border-r border-[#e6d3b3] shadow-[4px_0_24px_rgba(0,0,0,0.25)] z-20 ${mobile ? "w-[280px]" : collapsed ? "w-[80px]" : "w-[280px]"} transition-all duration-300`}>
    
    <div className={`flex items-center ${collapsed && !mobile ? 'justify-center' : 'justify-between'} px-5 py-5 border-b border-[#e6d3b3] min-h-[72px]`}>
      {(!collapsed || mobile) && (
        <div className="flex items-center gap-3 animate-in fade-in duration-300">
          <button
            type="button"
            aria-label="Go to home"
            onClick={() => navigate("/")}
            style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
          >
            <img
              src={brandLogo}
              alt="Mithai World"
              className="h-16 sm:h-20 w-auto object-contain flex-shrink-0"
            />
          </button>
        </div>
      )}
      
      {!mobile && (
        <button 
          onClick={() => setCollapsed(!collapsed)} 
          className={`flex items-center justify-center w-7 h-7 text-[#7a5c3a] hover:text-[#2d1b0e] hover:bg-[#d4a373] rounded-lg transition-all ${collapsed ? "" : "ml-2"}`}
        >
          <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`} />
        </button>
      )}
    </div>

    <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = navLinkClass(item).includes("bg-[#8b4513]");
        return (
          <button
            key={item.to}
            onClick={() => { navigate(item.to); mobile && setMobileOpen(false); }}
            className={navLinkClass(item) + ` ${collapsed && !mobile ? 'justify-center px-0' : 'w-full text-left'}`}
            title={collapsed && !mobile ? item.label : undefined}
          >
            {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#8b4513] rounded-r-full" />}
            <Icon className={`w-5 h-5 flex-shrink-0 transition-colors ${active ? "text-white" : "text-[#7a5c3a] group-hover:text-[#2d1b0e]"}`} strokeWidth={active ? 2 : 1.5} />
            {(!collapsed || mobile) && <span className="truncate">{item.label}</span>}
          </button>
        );
      })}
    </nav>

    <div className="px-4 py-5 border-t border-[#e6d3b3] space-y-2 bg-[#f5e6d3]">
      <button
        onClick={() => navigate("/")}
        className={`flex items-center gap-3 ${collapsed && !mobile ? 'justify-center w-10 h-10 mx-auto px-0' : 'w-full px-3 py-2.5'} rounded-xl text-sm font-medium text-[#7a5c3a] hover:bg-[#d4a373] hover:text-[#8b4513] border border-transparent hover:border-[#e6d3b3] transition-all`}
        title={collapsed && !mobile ? "View Store" : undefined}
      >
        <Store className="w-4.5 h-4.5 flex-shrink-0" />
        {(!collapsed || mobile) && <span>View Store Live</span>}
      </button>
      
      <button
        onClick={() => { logout(); navigate("/login"); }}
        className={`flex items-center gap-3 ${collapsed && !mobile ? 'justify-center w-10 h-10 mx-auto px-0' : 'w-full px-3 py-2.5'} rounded-xl text-sm font-medium text-red-600 hover:bg-[#d4a373] transition-all`}
        title={collapsed && !mobile ? "Logout" : undefined}
      >
        <LogOut className="w-4.5 h-4.5 flex-shrink-0" />
        {(!collapsed || mobile) && <span>Secure Logout</span>}
      </button>
    </div>
  </div>
);

const AdminLayout = () => {
  const [collapsed, setCollapsed]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate  = useNavigate();
  const location  = useLocation();
  const { logout, user } = useAuth();

  const isActive = (item) => {
    if (item.end) return location.pathname === item.to;
    return location.pathname.startsWith(item.to);
  };

  const navLinkClass = (item) => {
    const active = isActive(item);
    return `flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm transition-all duration-200 group relative
      ${active 
        ? "bg-[#8b4513] text-white font-medium" 
        : "text-[#7a5c3a] hover:bg-[#d4a373] hover:text-[#2d1b0e] font-medium"
      }`;
  };

  return (
    <div className="flex h-screen bg-[#fffaf3] overflow-hidden font-sans text-[#2d1b0e]">
      <div className="hidden md:flex flex-shrink-0 relative z-20">
        <Sidebar 
          collapsed={collapsed} 
          setCollapsed={setCollapsed} 
          navigate={navigate} 
          logout={logout} 
          navLinkClass={navLinkClass} 
        />
      </div>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-[#2d1b0e]/20 backdrop-blur-sm transition-opacity animate-in fade-in duration-300" 
            onClick={() => setMobileOpen(false)} 
          />
          <div className="relative z-10 animate-in slide-in-from-left duration-300">
            <Sidebar 
              mobile 
              collapsed={collapsed} 
              setCollapsed={setCollapsed} 
              mobileOpen={mobileOpen} 
              setMobileOpen={setMobileOpen} 
              navigate={navigate} 
              logout={logout} 
              navLinkClass={navLinkClass} 
            />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        <header className="bg-[#fffaf3] border-b border-[#e6d3b3] px-4 h-16 flex items-center gap-4 flex-shrink-0 shadow-sm md:hidden">
          <button 
            className="p-2 -ml-2 text-[#7a5c3a] hover:text-[#8b4513] hover:bg-[#d4a373] rounded-xl transition-colors" 
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-2">
            <img src={brandLogo} alt="Logo" className="h-10" />
            <h1 className="text-sm font-medium text-[#2d1b0e] tracking-tight">Admin</h1>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="w-8 h-8 bg-[#d4a373] border border-[#e6d3b3] rounded-full flex items-center justify-center ring-2 ring-[#fffaf3] shadow-sm">
              <span className="text-xs font-medium text-white">{user?.name?.[0]?.toUpperCase() || "A"}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar bg-[#fffaf3]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
