import React, { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  PlusCircle,
  Pencil,
  Trash2,
  Search,
  Package,
  Sparkles,
  ChevronDown,
  ChevronUp,
  LayoutGrid
} from "lucide-react";
import { useProducts } from "../context/ProductContext";
import { formatCurrency } from "shared/utils/pricing";

const AdminProducts = () => {
  const { 
    products, 
    categories, 
    deleteProduct, 
    toggleProductStatus, 
    toggleVariantStatus,
  } = useProducts();
  
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [busyId, setBusyId] = useState("");
  const [expandedStockId, setExpandedStockId] = useState(null);

  // Stable ID selection for keys and state
  const getId = (p) => {
    if (!p) return "";
    const id = p._id || p.id;
    if (id) return String(id);
    if (p.slug) return `slug_${p.slug}`;
    return `temp_${p.name?.replace(/\s+/g, '-').toLowerCase() || 'unknown'}`;
  };

  const handleStatusToggle = async (product) => {
    const id = getId(product);
    if (!id || id.startsWith('temp_')) {
       console.error("Cannot toggle status for product without stable ID");
       return;
    }
    const currentlyActive = product.isActive;
    setBusyId(id);
    try {
      await toggleProductStatus(id, !currentlyActive);
    } catch (err) {
      console.error("Status toggle failed:", err);
    } finally {
      setBusyId("");
    }
  };

  const handleVariantToggle = async (productId, variantId, currentlyAvailable) => {
    if (!toggleVariantStatus) return;
    const pid = String(productId);
    const vid = String(variantId);
    
    setBusyId(vid);
    try {
      await toggleVariantStatus(pid, vid, !currentlyAvailable);
    } catch (err) {
      console.error("Variant toggle failed:", err);
    } finally {
      setBusyId("");
    }
  };

  const getDisplayPricing = (product) => {
    const variants = Array.isArray(product?.variants) ? product.variants : [];
    if (!variants.length) {
      return { finalPrice: Number(product?.price || 0), mrp: Number(product?.mrp || 0) };
    }
    const prices = variants.map(v => Number(v.sellingPrice || 0)).filter(p => p > 0);
    const mrps = variants.map(v => Number(v.mrp || 0)).filter(p => p > 0);
    return {
      finalPrice: prices.length ? Math.min(...prices) : 0,
      mrp: mrps.length ? Math.min(...mrps) : 0
    };
  };

  const getVariantStock = (product) => {
    const variants = Array.isArray(product?.variants) ? product.variants : [];
    if (!variants.length) return Number(product?.stock || 0);
    return variants.reduce((total, v) => total + Number(v?.stock || 0), 0);
  };

  const getCategoryName = (cat) => {
    if (!cat) return "-";
    const slug = typeof cat === 'object' ? cat.slug : cat;
    const found = categories?.find((c) => c.slug === slug);
    return found ? found.name : slug;
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return (products || [])
      .filter((p) => {
        if (filterCat === "all") return true;
        const pCat = typeof p.category === "object" ? p.category?.slug : p.category;
        return String(pCat || "").toLowerCase() === filterCat;
      })
      .filter((p) => {
        if (!q) return true;
        const name = (p.name || "").toLowerCase();
        const catName = getCategoryName(p.category).toLowerCase();
        const tags = Array.isArray(p.tags) ? p.tags.join(" ").toLowerCase() : "";
        const id = String(p.orderNumber || p._id || "").toLowerCase();
        return name.includes(q) || catName.includes(q) || tags.includes(q) || id.includes(q);
      });
  }, [products, filterCat, search, categories]);

  const handleDelete = async (id) => {
    await deleteProduct(id);
    setDeleteConfirm(null);
  };

  const toggleExpand = (id) => {
    setExpandedStockId(prev => prev === id ? null : id);
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto page-enter space-y-8 pb-20">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 bg-white p-6 md:p-8 rounded-[32px] border border-[#e6d3b3] shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#fffaf3] text-[#b67b3a] border border-[#f0e0c4] text-[10px] font-bold uppercase tracking-widest mb-4">
            <LayoutGrid size={14} /> Inventory Management
          </div>
          <h2 className="serif text-3xl md:text-4xl font-medium text-[#2d1b0e] mb-2">Product Catalog</h2>
          <p className="text-sm font-medium text-[#7a5c3a]">Manage sizes, pricing, and availability across your entire collection.</p>
        </div>
        <button 
          onClick={() => navigate("/admin/add-product", { state: null })} 
          className="h-14 px-8 rounded-2xl bg-[#8b4513] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#6b3410] transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2 shrink-0"
        >
          <PlusCircle size={18} /> Add New Mithai
        </button>
      </div>

      {/* FILTERS & SEARCH */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#a67f52] group-focus-within:text-[#8b4513] transition-colors" />
          <input 
            type="text" 
            placeholder="Search by name, category, or tags..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="w-full h-14 pl-12 pr-4 bg-white border border-[#e6d3b3] rounded-2xl text-sm font-medium text-[#2d1b0e] placeholder:text-[#a67f52] focus:outline-none focus:ring-2 focus:ring-[#8b4513]/20 focus:border-[#8b4513] transition-all shadow-sm" 
          />
        </div>
        <div className="relative md:w-72">
           <select 
             value={filterCat} 
             onChange={(e) => setFilterCat(e.target.value)} 
             className="w-full h-14 pl-4 pr-12 bg-white border border-[#e6d3b3] rounded-2xl text-sm font-bold text-[#7a5c3a] focus:outline-none focus:ring-2 focus:ring-[#8b4513]/20 focus:border-[#8b4513] transition-all shadow-sm appearance-none cursor-pointer"
           >
             <option value="all">All Categories</option>
             {(categories || []).map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
           </select>
           <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#a67f52]">
             <ChevronDown size={18} />
           </div>
        </div>
      </div>

      {/* DATA GRID */}
      <div className="bg-white rounded-[32px] border border-[#e6d3b3] shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-[#fffaf3] border-b border-[#e6d3b3]">
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-[#b67b3a] w-[35%]">Mithai & Detail</th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-[#b67b3a] w-[15%]">Category</th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-[#b67b3a] w-[15%]">Pricing</th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-[#b67b3a] w-[20%]">Status</th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-[#b67b3a] text-right w-[15%]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e6d3b3]/50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-24 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#fffaf3] mb-4 text-[#d4a373]">
                      <Package size={32} />
                    </div>
                    <p className="text-sm font-bold text-[#7a5c3a]">No products found.</p>
                    <p className="text-xs font-medium text-[#a67f52] mt-1">Try adjusting your search or filters.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((product) => {
                  const id = getId(product);
                  const preview = product.images?.[0] || product.image || "";
                  const pricing = getDisplayPricing(product);
                  const totalStock = getVariantStock(product);
                  const isExpanded = expandedStockId === id;
                  const variants = product.variants || [];
                  const hasVariants = variants.length > 0;

                  return (
                    <React.Fragment key={id}>
                      {/* Main Product Row */}
                      <tr className={`hover:bg-[#fffaf3]/50 transition-colors group ${isExpanded ? 'bg-[#fffaf3]' : ''}`}>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-white border border-[#f0e0c4] overflow-hidden shrink-0 shadow-sm flex items-center justify-center p-1 relative">
                              {preview ? (
                                <img src={preview} className="w-full h-full object-cover rounded-xl" alt={product.name} />
                              ) : (
                                <Package size={20} className="text-[#e6d3b3]" />
                              )}
                              {!product.isActive && (
                                <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center rounded-xl">
                                  <span className="bg-[#2d1b0e] text-white text-[8px] font-bold px-1.5 py-0.5 rounded">HIDDEN</span>
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-[#2d1b0e] truncate hover:text-[#8b4513] transition-colors cursor-default" title={product.name}>
                                {product.name}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-medium text-[#7a5c3a] bg-[#f5e6d3]/50 px-2 py-0.5 rounded-md">
                                  {hasVariants ? `${variants.length} Sizes` : '1 Size'}
                                </span>
                                <span className="text-[10px] font-medium text-[#7a5c3a]">
                                  Total Stock: {totalStock}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className="inline-block bg-[#f5e6d3]/50 text-[#8b4513] text-[10px] font-bold px-3 py-1 rounded-full tracking-widest uppercase border border-[#e6d3b3]/50 shadow-sm">
                            {getCategoryName(product.category)}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col justify-center">
                            <span className="text-sm font-bold text-[#2d1b0e]">{formatCurrency(pricing.finalPrice)}</span>
                            {pricing.mrp > pricing.finalPrice && (
                              <span className="text-[10px] font-medium text-[#a67f52] line-through">
                                {formatCurrency(pricing.mrp)}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          {!product.isSignature ? (
                            <div className="flex items-center gap-3">
                              <button 
                                disabled={busyId === id}
                                onClick={() => handleStatusToggle(product)}
                                className={`h-6 w-11 rounded-full transition-all relative flex items-center shrink-0 border-2 ${product.isActive ? 'bg-emerald-500 border-emerald-500' : 'bg-gray-100 border-gray-200'} ${busyId === id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                title={product.isActive ? "Hide from Storefront" : "Show on Storefront"}
                              >
                                 <div className={`absolute h-4 w-4 rounded-full bg-white transition-all shadow-md ${product.isActive ? 'left-[20px]' : 'left-0.5'}`} />
                              </button>
                              <span className={`text-[10px] font-bold uppercase tracking-widest ${product.isActive ? 'text-emerald-700' : 'text-gray-500'}`}>
                                {product.isActive ? "Live" : "Hidden"}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--gold)] bg-[var(--gold)]/10 px-2 py-1 rounded-md">
                              Signature Item
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {hasVariants && (
                              <button 
                                onClick={() => toggleExpand(id)}
                                className={`h-9 px-3 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${isExpanded ? 'bg-[#8b4513] text-white border-[#8b4513] shadow-md' : 'bg-white text-[#7a5c3a] border-[#e6d3b3] hover:border-[#8b4513] hover:text-[#8b4513] shadow-sm'}`}
                              >
                                Variants {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </button>
                            )}
                            <div className="flex items-center gap-1 bg-[#fffaf3] border border-[#e6d3b3] p-1 rounded-xl shadow-sm opacity-0 group-hover:opacity-100 transition-all">
                              <button onClick={() => navigate("/admin/add-product", { state: { product } })} className="p-1.5 hover:bg-white hover:text-[#8b4513] text-[#7a5c3a] rounded-lg transition-all" title="Edit">
                                <Pencil size={14} />
                              </button>
                              <div className="w-px h-4 bg-[#e6d3b3]" />
                              <button onClick={() => setDeleteConfirm(id)} className="p-1.5 hover:bg-rose-50 text-rose-500 hover:text-rose-700 rounded-lg transition-all" title="Delete">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Variants Row (Accordion Style) */}
                      {isExpanded && hasVariants && (
                        <tr className="bg-[#fffaf3] border-b border-[#e6d3b3]">
                          <td colSpan={5} className="px-0 py-0">
                            <div className="px-6 py-4 bg-white/50 border-t border-dashed border-[#e6d3b3]/50">
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pl-12 border-l-2 border-[#8b4513]/20 ml-6 py-2">
                                {variants.map((v, i) => {
                                  const vId = v._id || v.id;
                                  const isAvail = v.isAvailable !== false;
                                  const isBusy = busyId === vId;
                                  
                                  return (
                                    <div key={vId} className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all ${isAvail ? 'bg-white border-[#f0e0c4] shadow-sm' : 'bg-gray-50 border-gray-200 grayscale-[0.5]'}`}>
                                      <div className="min-w-0">
                                        <p className="text-sm font-bold text-[#2d1b0e] truncate">{v.label}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                          <p className="text-xs font-medium text-[#7a5c3a]">{formatCurrency(v.sellingPrice)}</p>
                                          <span className="text-[10px] text-[#a67f52] px-1.5 py-0.5 rounded bg-[#f5e6d3]/50 font-medium">Stock: {v.stock || 0}</span>
                                        </div>
                                      </div>
                                      
                                      <button 
                                        disabled={isBusy}
                                        onClick={() => handleVariantToggle(id, vId, isAvail)}
                                        className={`h-6 w-11 rounded-full transition-all relative flex items-center shrink-0 border-2 ${isAvail ? 'bg-emerald-500 border-emerald-500' : 'bg-gray-200 border-gray-300'} ${isBusy ? 'opacity-50' : 'cursor-pointer'}`}
                                      >
                                        <div className={`absolute h-4 w-4 rounded-full bg-white transition-all shadow-sm ${isAvail ? 'left-[20px]' : 'left-0.5'}`} />
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirm && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#2d1b0e]/40 backdrop-blur-md px-4 transition-all duration-300 animate-in fade-in">
          <div className="w-full max-w-sm rounded-[32px] border border-[#e6d3b3] bg-[#fffaf3] shadow-[0_32px_64px_-12px_rgba(45,27,14,0.3)] p-8 text-center transform transition-all animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6 text-rose-600 shadow-inner">
              <Trash2 size={36} />
            </div>
            <h3 className="serif text-2xl font-medium text-[#2d1b0e] mb-3 text-center">Delete Mithai?</h3>
            <p className="text-sm text-[#7a5c3a] mb-8 leading-relaxed font-medium">This action is permanent. The product and all its variants will be removed from your storefront immediately.</p>
            <div className="flex gap-4">
              <button 
                onClick={() => setDeleteConfirm(null)} 
                className="flex-1 h-12 rounded-2xl border-2 border-[#e6d3b3] text-[#8b4513] text-xs font-bold uppercase tracking-widest hover:bg-[#f5e6d3] transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleDelete(deleteConfirm)} 
                className="flex-1 h-12 rounded-2xl bg-rose-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-rose-700 transition-colors shadow-lg active:scale-95"
              >
                Delete Item
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AdminProducts;