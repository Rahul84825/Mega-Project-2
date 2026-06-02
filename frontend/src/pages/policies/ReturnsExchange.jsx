import { useEffect } from "react";
import { Link } from "react-router-dom";
import { SEO } from "../../components/common";

/**
 * ReturnsExchange Component
 * Displays returns and exchange policy
 */
const ReturnsExchange = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-[60vh] bg-[var(--cream)]">
      <SEO 
        title="Returns & Exchange Policy"
        description="Learn about Mithai World's returns and exchange policy. We guarantee freshness and quality for all our Indian sweets."
        canonical="/returns-exchanges"
      />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-4xl font-medium text-[var(--charcoal)]">Returns & Exchange Policy</h1>

        <div className="prose max-w-none space-y-6 text-gray-700">
          <section>
            <h2 className="mb-3 text-2xl font-medium text-[var(--charcoal)]">Return Window</h2>
            <p>
              Products can be returned within 7 days of delivery if they are in original condition
              and packaging. Since our sweets are perishable, return eligibility depends on product quality.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-medium text-[var(--charcoal)]">Quality Guarantee</h2>
            <p>
              We guarantee that all products are fresh and of the highest quality. If you receive any
              damaged or defective product, please contact us immediately with photos for replacement.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-medium text-[var(--charcoal)]">Refund Process</h2>
            <ol className="list-inside list-decimal space-y-2">
              <li>Submit return request with product details and photos</li>
              <li>Our team will review and approve/deny within 48 hours</li>
              <li>Once approved, arrange pickup at your convenience</li>
              <li>Refund will be processed within 7-10 business days</li>
            </ol>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-medium text-[var(--charcoal)]">Non-Returnable Items</h2>
            <p>Customized or special orders cannot be returned unless there is a quality issue.</p>
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

export default ReturnsExchange;
