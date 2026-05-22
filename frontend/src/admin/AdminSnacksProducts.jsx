import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package,
  Search,
  ChevronDown,
  ChevronUp,
  LayoutGrid
} from "lucide-react";
import { useProducts } from "../context/ProductContext";
import { formatCurrency } from "shared/utils/pricing";

const AdminSnacksProducts = () => {
  const { 
    products, 
    categories
  } = useProducts();
  
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [expandedStockId, setExpandedStockId] = useState(null);

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
        const pCat = typeof p.category === "object" ? p.category?.slug : p.category;
        return String(pCat || "").toLowerCase() === 'namkeen-snacks';
      })
      .filter((p) => {
        if (!q) return true;
        const name = (p.name || "").toLowerCase();
        return name.includes(q);
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
            <LayoutGrid size={14} /> Snacks Inventory
          </div>
          <h2 className="serif text-3xl md:text-4xl font-medium text-[#2d1b0e] mb-2">Namkeen & Snacks</h2>
          <p className="text-sm font-medium text-[#7a5c3a]">View and manage your savory snacks collection.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#a67f52] group-focus-within:text-[#8b4513] transition-colors" />
          <input 
            type="text" 
            placeholder="Search snacks..." 
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
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-[#b67b3a] w-[40%]">Mithai & Detail</th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-[#b67b3a] w-[20%]">Category</th>
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
                    <p className="text-sm font-bold text-[#7a5c3a]">No snacks found.</p>
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
                          <span className="inline-block bg-[#f5e6d3]/50 text-[#8b4513] text-[10px] font-bold px-3 py-1 rounded-full tracking-widest uppercase border border-[#e6d3b3]/50 shadow-sm">
                            {getCategoryName(product.category)}
                          </span>
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

export default AdminSnacksProducts;