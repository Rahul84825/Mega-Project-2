import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package,
  Search,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Save
} from "lucide-react";
import { useProducts } from "../context/ProductContext";
import { formatCurrency } from "shared/utils/pricing";
import { toast } from "react-toastify";

const AdminSignatureProducts = () => {
  const { 
    products, 
    categories,
    updateProduct
  } = useProducts();
  
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [expandedStockId, setExpandedStockId] = useState(null);
  const [busyId, setBusyId] = useState("");

  const getId = (p) => {
    if (!p) return "";
    return String(p._id || p.id);
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

  const handleCategoryChange = async (productId, newCategory) => {
    setBusyId(productId);
    try {
      await updateProduct(productId, { category: newCategory });
      toast.success("Category updated");
    } catch (err) {
      console.error("Category update failed:", err);
      toast.error("Failed to update category");
    } finally {
      setBusyId("");
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return (products || [])
      .filter((p) => p.isSignature)
      .filter((p) => {
        if (!q) return true;
        return (p.name || "").toLowerCase().includes(q);
      });
  }, [products, search]);

  const toggleExpand = (id) => {
    setExpandedStockId(prev => prev === id ? null : id);
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto page-enter space-y-8 pb-20">
      
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 bg-white p-6 md:p-8 rounded-[32px] border border-[#e6d3b3] shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#fffaf3] text-[#b67b3a] border border-[#f0e0c4] text-[10px] font-bold uppercase tracking-widest mb-4">
            <Sparkles size={14} /> Signature Collection
          </div>
          <h2 className="serif text-3xl md:text-4xl font-medium text-[#2d1b0e] mb-2">Signature Sweets</h2>
          <p className="text-sm font-medium text-[#7a5c3a]">Exclusive products that define the Mithai World brand.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#a67f52] group-focus-within:text-[#8b4513] transition-colors" />
          <input 
            type="text" 
            placeholder="Search signature sweets..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="w-full h-14 pl-12 pr-4 bg-white border border-[#e6d3b3] rounded-2xl text-sm font-medium text-[#2d1b0e] placeholder:text-[#a67f52] focus:outline-none focus:ring-2 focus:ring-[#8b4513]/20 focus:border-[#8b4513] transition-all shadow-sm" 
          />
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-[#e6d3b3] shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-[#fffaf3] border-b border-[#e6d3b3]">
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-[#b67b3a] w-[35%]">Mithai & Detail</th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-[#b67b3a] w-[25%]">Change Category</th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-[#b67b3a] w-[20%]">Pricing</th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-[#b67b3a] text-right w-[20%]">Stock Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e6d3b3]/50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-24 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#fffaf3] mb-4 text-[#d4a373]">
                      <Package size={32} />
                    </div>
                    <p className="text-sm font-bold text-[#7a5c3a]">No signature sweets found.</p>
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
                  const currentCatSlug = typeof product.category === 'object' ? product.category.slug : product.category;

                  return (
                    <React.Fragment key={id}>
                      <tr className={`hover:bg-[#fffaf3]/50 transition-colors group ${isExpanded ? 'bg-[#fffaf3]' : ''}`}>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-white border border-[#f0e0c4] overflow-hidden shrink-0 shadow-sm flex items-center justify-center p-1 relative">
                              {preview ? (
                                <img src={preview} className="w-full h-full object-cover rounded-xl" alt={product.name} />
                              ) : (
                                <Package size={20} className="text-[#e6d3b3]" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-[#2d1b0e] truncate cursor-default">
                                {product.name}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-medium text-[#7a5c3a] bg-[#f5e6d3]/50 px-2 py-0.5 rounded-md">
                                  {hasVariants ? `${variants.length} Sizes` : '1 Size'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                           <div className="relative max-w-[200px]">
                             <select 
                               disabled={busyId === id}
                               value={currentCatSlug}
                               onChange={(e) => handleCategoryChange(id, e.target.value)}
                               className="w-full h-10 pl-3 pr-8 bg-[#fffaf3] border border-[#e6d3b3] rounded-xl text-[11px] font-bold text-[#7a5c3a] focus:outline-none focus:ring-2 focus:ring-[#8b4513]/20 appearance-none cursor-pointer"
                             >
                               {categories.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                             </select>
                             <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#a67f52]">
                               <ChevronDown size={14} />
                             </div>
                           </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col justify-center">
                            <span className="text-sm font-bold text-[#2d1b0e]">{formatCurrency(pricing.finalPrice)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                           <div className="flex items-center justify-end gap-3">
                             <span className="text-xs font-bold text-[#7a5c3a]">Total: {totalStock}</span>
                             {hasVariants && (
                               <button 
                                 onClick={() => toggleExpand(id)}
                                 className={`h-9 px-3 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${isExpanded ? 'bg-[#8b4513] text-white border-[#8b4513]' : 'bg-white text-[#7a5c3a] border-[#e6d3b3]'}`}
                               >
                                 {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                               </button>
                             )}
                           </div>
                        </td>
                      </tr>

                      {isExpanded && hasVariants && (
                        <tr className="bg-[#fffaf3] border-b border-[#e6d3b3]">
                          <td colSpan={4} className="px-0 py-0">
                            <div className="px-6 py-4 bg-white/50 border-t border-dashed border-[#e6d3b3]/50">
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pl-12 border-l-2 border-[#8b4513]/20 ml-6 py-2">
                                {variants.map((v) => (
                                  <div key={v._id || v.id} className="p-4 rounded-2xl border bg-white border-[#f0e0c4] shadow-sm flex items-center justify-between">
                                    <div className="min-w-0">
                                      <p className="text-sm font-bold text-[#2d1b0e] truncate">{v.label}</p>
                                      <p className="text-[10px] text-[#a67f52] font-medium">Stock: {v.stock || 0}</p>
                                    </div>
                                    <p className="text-xs font-bold text-[#8b4513]">{formatCurrency(v.sellingPrice)}</p>
                                  </div>
                                ))}
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
    </div>
  );
};

export default AdminSignatureProducts;