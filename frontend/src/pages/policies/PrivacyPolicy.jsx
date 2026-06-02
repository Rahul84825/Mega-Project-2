import { useEffect } from "react";
import { Link } from "react-router-dom";
import { SEO } from "../../components/common";

/**
 * PrivacyPolicy Component
 * Displays privacy policy information
 */
const PrivacyPolicy = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-[60vh] bg-[var(--cream)]">
      <SEO 
        title="Privacy Policy"
        description="Read Mithai World's privacy policy to understand how we collect, use, and protect your personal information."
        canonical="/privacy-policy"
      />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-4xl font-medium text-[var(--charcoal)]">Privacy Policy</h1>

        <div className="prose max-w-none space-y-6 text-gray-700">
          <section>
            <h2 className="mb-3 text-2xl font-medium text-[var(--charcoal)]">Introduction</h2>
            <p>
              Mithai World ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy
              explains how we collect, use, disclose, and otherwise handle your information.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-medium text-[var(--charcoal)]">Information We Collect</h2>
            <ul className="list-inside list-disc space-y-2">
              <li>Personal identification information (name, email, phone, address)</li>
              <li>Order history and delivery information</li>
              <li>Payment information (processed securely by third-party providers)</li>
              <li>Browsing behavior and preferences</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-medium text-[var(--charcoal)]">How We Use Your Information</h2>
            <p>We use collected information to:</p>
            <ul className="list-inside list-disc space-y-2">
              <li>Process orders and deliver products</li>
              <li>Send order confirmations and updates</li>
              <li>Improve our website and services</li>
              <li>Send promotional offers (with your consent)</li>
              <li>Prevent fraudulent transactions</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-medium text-[var(--charcoal)]">Data Security</h2>
            <p>
              We implement industry-standard security measures to protect your personal information.
              However, no method of transmission over the internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-medium text-[var(--charcoal)]">Third-Party Services</h2>
            <p>
              We use third-party services for payment processing and delivery. These services have their
              own privacy policies, and we encourage you to review them.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-medium text-[var(--charcoal)]">Contact Us</h2>
            <p>For privacy concerns, please contact our support team.</p>
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

export default PrivacyPolicy;
