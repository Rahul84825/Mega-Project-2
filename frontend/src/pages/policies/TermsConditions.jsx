import { useEffect } from "react";
import { Link } from "react-router-dom";
import { SEO } from "../../components/common";

/**
 * TermsConditions Component
 * Displays terms and conditions
 */
const TermsConditions = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-[60vh] bg-[var(--cream)]">
      <SEO 
        title="Terms & Conditions"
        description="Review the terms and conditions for using Mithai World's website and services."
        canonical="/terms-conditions"
      />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-4xl font-medium text-[var(--charcoal)]">Terms & Conditions</h1>

        <div className="prose max-w-none space-y-6 text-gray-700">
          <section>
            <h2 className="mb-3 text-2xl font-medium text-[var(--charcoal)]">Agreement to Terms</h2>
            <p>
              By accessing and using Mithai World, you accept and agree to be bound by the terms and
              provision of this agreement.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-medium text-[var(--charcoal)]">Use License</h2>
            <p>
              Permission is granted to temporarily download one copy of the materials (information or software)
              on Mithai World for personal, non-commercial transitory viewing only. This is the grant of a license,
              not a transfer of title, and under this license you may not:
            </p>
            <ul className="list-inside list-disc space-y-2">
              <li>Modify or copy the materials</li>
              <li>Use the materials for any commercial purpose or for any public display</li>
              <li>Attempt to decompile or reverse engineer any software contained on the site</li>
              <li>Remove any copyright or other proprietary notations from the materials</li>
              <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-medium text-[var(--charcoal)]">Disclaimer</h2>
            <p>
              The materials on Mithai World are provided on an "as is" basis. Mithai World makes no
              warranties, expressed or implied, and hereby disclaims and negates all other warranties
              including, without limitation, implied warranties or conditions of merchantability,
              fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-medium text-[var(--charcoal)]">Limitations</h2>
            <p>
              In no event shall Mithai World or its suppliers be liable for any damages (including,
              without limitation, damages for loss of data or profit, or due to business interruption)
              arising out of the use or inability to use the materials on Mithai World.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-medium text-[var(--charcoal)]">Accuracy of Materials</h2>
            <p>
              The materials appearing on Mithai World could include technical, typographical, or
              photographic errors. Mithai World does not warrant that any of the materials on its
              website are accurate, complete, or current. We may make changes to the materials contained
              on its website at any time without notice.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-medium text-[var(--charcoal)]">Links</h2>
            <p>
              Mithai World has not reviewed all of the sites linked to its website and is not responsible
              for the contents of any such linked site. The inclusion of any link does not imply endorsement
              by Mithai World of the site. Use of any such linked website is at the user's own risk.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-medium text-[var(--charcoal)]">Modifications</h2>
            <p>
              Mithai World may revise these terms of service for its website at any time without notice.
              By using this website, you are agreeing to be bound by the then current version of these terms of service.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-medium text-[var(--charcoal)]">Governing Law</h2>
            <p>
              These terms and conditions are governed by and construed in accordance with the laws of
              India, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
            </p>
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

export default TermsConditions;
