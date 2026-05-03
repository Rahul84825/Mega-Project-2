import { PackageX } from "lucide-react";
import ProductCard from "./ProductCard";

const ProductCardSkeleton = () => (
  <div className="flex animate-pulse flex-col overflow-hidden rounded-2xl bg-white border border-[#f0e6d6]">
    <div className="aspect-square w-full bg-[#f5ede0]" />
    <div className="flex flex-col gap-3 p-4">
      <div className="h-3.5 bg-[#f0e6d6] rounded-full w-3/4" />
      <div className="h-3 bg-[#f0e6d6] rounded-full w-1/2" />
      <div className="mt-1 flex gap-2">
        <div className="h-6 w-14 bg-[#f0e6d6] rounded-md" />
        <div className="h-6 w-14 bg-[#f0e6d6] rounded-md" />
      </div>
      <div className="h-5 bg-[#f0e6d6] rounded-full w-1/3" />
      <div className="h-px bg-[#f0e6d6]" />
      <div className="h-9 bg-[#f0e6d6] rounded-xl w-full" />
    </div>
  </div>
);

const EmptyState = () => (
  <div className="col-span-full flex items-center justify-center py-20 text-center">
    <div className="flex flex-col items-center gap-3">
      <PackageX className="h-7 w-7 text-[#a0836b]" />
      <h3 className="text-[15px] font-semibold text-[#1c1c1c]">No products found</h3>
    </div>
  </div>
);

const ProductGrid = ({ products = [], loading = false }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-8">
      {loading
        ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
        : products.length === 0
        ? <EmptyState />
        : products.map((product) => (
            <ProductCard key={product._id || product.id} product={product} />
          ))
      }
    </div>
  );
};

export default ProductGrid;