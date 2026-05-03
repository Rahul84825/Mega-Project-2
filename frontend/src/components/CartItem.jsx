import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "../context/CartContext";
import { formatPrice } from "../utils/priceCalculator";

function CartItem({ item }) {
  const { dispatch } = useCart();
  const qty = Number(item?.qty) || 1;
  const stock = Number(item?.stock) || 99;
  const itemId = item?.cartItemId || item?._id || item?.id;
  const itemPrice = Number(item?.price) || Number(item?.variant?.finalPrice) || 0;
  const variantLabel = item?.variant?.label || item?.variantLabel;

  const updateQty = (nextQty) => {
    dispatch({ type: "UPDATE_QTY", id: itemId, qty: nextQty });
  };

  const removeItem = () => {
    dispatch({ type: "REMOVE", id: itemId });
  };

  return (
    <div className="rounded-xl border border-[#f1dfc5] bg-[#fff8ee] p-3">
      <div className="flex gap-3">
        <img
          src={item.image}
          alt={item.name}
          className="h-20 w-20 flex-shrink-0 rounded-xl object-cover border border-[#f0dfc6]"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-[#3b2417]">{item.name}</h3>
              <p className="mt-0.5 text-xs text-[#8c7358]">{item.category || "Mithai"}</p>
              {variantLabel && <p className="mt-0.5 text-[11px] text-[#a67f52]">{variantLabel}</p>}
            </div>
            <button
              type="button"
              onClick={removeItem}
              className="w-8 h-8 flex items-center bg-[#fff2e2] border-none justify-center rounded-full hover:bg-[#fff3e5] text-slate-500 hover:text-slate-800 transition-colors"
              aria-label={`Remove ${item.name}`}
            >
              <Trash2 size={14} />
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-[#e8883a]">{formatPrice(itemPrice)}</div>

            <div className="flex items-center gap-2 bg-[#fff2e2] px-2 py-1 rounded-full">
              <button
                type="button"
                onClick={() => updateQty(qty - 1)}
                disabled={qty <= 1}
                className="w-8 h-8 flex items-center bg-[#fff2e2] border-none justify-center rounded-full hover:bg-[#fff3e5] text-slate-500 hover:text-slate-800 transition-colors"
                aria-label={`Decrease ${item.name}`}
              >
                <Minus size={14} />
              </button>
              <span className="px-3 text-center text-sm font-medium text-[#3b2417]">{qty}</span>
              <button
                type="button"
                onClick={() => updateQty(qty + 1)}
                disabled={qty >= stock}
                className="w-8 h-8 flex items-center bg-[#fff2e2] border-none justify-center rounded-full hover:bg-[#fff3e5] text-slate-500 hover:text-[#2F2F2F] transition-colors"
                aria-label={`Increase ${item.name}`}
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CartItem;
