import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronUp } from "lucide-react";

/**
 * ShippingPolicy Component
 * Displays shipping policy information to customers
 */
const ShippingPolicy = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Shipping Policy | Mithai World";
  }, []);

  return (
    <div className="min-h-[60vh] bg-[var(--cream)]">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-4xl font-medium text-[var(--charcoal)]">Shipping Policy</h1>

        <div className="prose max-w-none space-y-6 text-gray-700">
          <section>
            <h2 className="mb-3 text-2xl font-medium text-[var(--charcoal)]">Delivery Information</h2>
            <p>
              We ship fresh mithai and sweets directly to your doorstep. All orders are carefully packed
              to ensure quality upon delivery.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-medium text-[var(--charcoal)]">Shipping Timeline</h2>
            <ul className="list-inside list-disc space-y-2">
              <li>Same-day delivery available for orders placed before 12 PM</li>
              <li>Next-day delivery for standard orders</li>
              <li>Delivery times may vary based on location and weather conditions</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-medium text-[var(--charcoal)]">Shipping Charges</h2>
            <p>
              Shipping charges are calculated based on your location and order weight. They will be
              displayed during checkout before you confirm your order.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-medium text-[var(--charcoal)]">Contact Us</h2>
            <p>For shipping inquiries, please contact our customer service team.</p>
          </section>
        </div>

        <Link
          to="/"
          className="mt-12 inline-block rounded-lg bg-[var(--saffron)] px-6 py-3 font-medium text-[var(--charcoal)] hover:opacity-90"
        >
          Back to Store
        </Link>
      </div>
    </div>
  );
};

export default ShippingPolicy;
