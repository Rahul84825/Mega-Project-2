import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import { calculateTotals, formatCurrency, TAX_MESSAGE } from "shared/utils/pricing";

function CartPage() {
  const { cart, dispatch } = useCart();
  const navigate = useNavigate();
  const { subtotal, deliveryFee, total, deliveryThreshold } = calculateTotals(cart);
  const amountNeeded = Math.max(0, deliveryThreshold - subtotal);

  if (cart.length === 0) {
    return (
      <div className="page-enter min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4 py-20">
        <div className="text-6xl">🛒</div>
        <h2 className="serif text-3xl md:text-4xl text-center">Your cart is empty</h2>
        <p className="text-[var(--muted)] text-center text-sm md:text-base">Add some sweet goodness first!</p>
        <button 
          className="btn-primary mt-2 px-6 py-3 rounded-lg" 
          onClick={() => navigate("/")}
        >
          Browse Sweets
        </button>
      </div>
    );
  }

  return (
    <div className="page-enter bg-white min-h-[60vh] px-4 sm:px-6 lg:px-8 py-8 md:py-12 lg:py-14">
      <div className="max-w-7xl mx-auto">
        <h1 className="serif text-2xl md:text-3xl lg:text-4xl font-medium text-[var(--charcoal)] mb-8 md:mb-12">
          Your Cart <span className="ornament">✦</span>
        </h1>

        {/* Mobile/Tablet: Stacked, Desktop: Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
          
          {/* Items column - takes 2 cols on desktop */}
          <div className="lg:col-span-2 flex flex-col gap-4 md:gap-6">
            {cart.map((item) => (
              <div
                key={`${item.productId}::${item.variantId}`}
                className="bg-white rounded-xl border border-[#e8d4b4] p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col sm:flex-row gap-4 items-start sm:items-center"
              >
                {/* Image */}
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-20 h-20 md:w-24 md:h-24 object-cover rounded-lg flex-shrink-0"
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="serif text-lg md:text-xl font-medium text-[var(--charcoal)] mb-1">
                    {item.name}
                  </h3>
                  <p className="text-xs md:text-sm text-[var(--muted)]">
                    {item.category} · {item.variantLabel || "Default"}
                  </p>
                </div>

                {/* Actions - Stack on mobile, row on tablet+ */}
                <div className="w-full sm:w-auto flex flex-col sm:flex-row sm:items-center gap-3">
                  {/* Quantity control */}
                  <div className="flex items-center border-2 border-[#e8d4b4] rounded-lg bg-white overflow-hidden">
                    <button
                      onClick={() =>
                        dispatch({
                          type: "UPDATE_QTY",
                          productId: item.productId,
                          variantId: item.variantId,
                          quantity: item.quantity - 1
                        })
                      }
                      className="w-12 h-12 flex items-center justify-center hover:bg-[#f5e6d3] font-medium text-[var(--burgundy)] transition-colors"
                    >
                      −
                    </button>
                    <span className="w-14 text-center font-medium text-[var(--charcoal)]">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        dispatch({
                          type: "UPDATE_QTY",
                          productId: item.productId,
                          variantId: item.variantId,
                          quantity: item.quantity + 1
                        })
                      }
                      className="w-12 h-12 flex items-center justify-center hover:bg-[#f5e6d3] font-medium text-[var(--burgundy)] transition-colors"
                    >
                      +
                    </button>
                  </div>

                  {/* Price */}
                  <div className="font-medium text-lg md:text-xl text-[var(--burgundy)] text-right sm:text-center min-w-[80px]">
                    {formatCurrency((Number(item?.price) || 0) * item.quantity)}
                  </div>

                  {/* Remove button */}
                  <button
                    onClick={() =>
                      dispatch({
                        type: "REMOVE",
                        productId: item.productId,
                        variantId: item.variantId
                      })
                    }
                    className="ml-auto sm:ml-0 w-8 h-8 flex items-center justify-center text-[#ccc] hover:text-[#999] transition-colors flex-shrink-0"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Order summary - sticky on desktop, fixed position on mobile */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-[#e8d4b4] p-6 md:p-8 shadow-sm lg:sticky lg:top-24">
              <h2 className="serif text-2xl md:text-3xl font-medium text-[var(--charcoal)] mb-6 pb-4 border-b border-[#e8d4b4]">
                Summary
              </h2>

              {/* Summary rows */}
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-sm md:text-base text-[var(--muted)]">
                  <span>Subtotal</span>
                  <span className="font-medium text-[var(--charcoal)]">{formatCurrency(subtotal)}</span>
                </div>

                <div className="flex justify-between text-sm md:text-base text-[var(--muted)]">
                  <span>Delivery</span>
                  {deliveryFee === 0 ? (
                    <span className="font-medium text-green-600">FREE</span>
                  ) : (
                    <span className="font-medium text-[var(--charcoal)]">{formatCurrency(deliveryFee)}</span>
                  )}
                </div>

                {deliveryFee > 0 && amountNeeded > 0 && (
                  <p className="text-xs text-[var(--saffron)] bg-[var(--saffron)]/10 p-3 rounded-lg">
                    Add {formatCurrency(amountNeeded)} more for free delivery
                  </p>
                )}
              </div>

              {/* Total */}
              <div className="flex justify-between items-center pt-4 border-t border-[#e8d4b4] mb-2">
                <span className="serif text-xl md:text-2xl font-medium text-[var(--charcoal)]">
                  Total
                </span>
                <span className="serif text-2xl md:text-3xl font-medium text-[var(--burgundy)]">
                  {formatCurrency(total)}
                </span>
              </div>
              <div className="text-[11px] text-[var(--muted)] text-right mb-6">
                {TAX_MESSAGE}
              </div>

              {/* CTA Buttons */}
              <div className="space-y-3">
                <button
                  className="btn-primary w-full py-3 md:py-4 rounded-lg font-medium text-sm md:text-base"
                  onClick={() => navigate("/checkout")}
                >
                  Proceed to Checkout
                </button>
                <button
                  className="btn-outline w-full py-3 md:py-4 rounded-lg font-medium text-sm md:text-base"
                  onClick={() => navigate("/")}
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CartPage;
