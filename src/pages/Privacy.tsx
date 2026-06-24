import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Footer } from "@/components/layout/Footer";

const SITE = "https://homefacts-history-hub.lovable.app";

export default function Privacy() {
  return (
    <>
      <Helmet>
        <title>Privacy Policy — Orivaz</title>
        <meta name="description" content="How Orivaz collects, uses, and protects information about you and your property." />
        <link rel="canonical" href={`${SITE}/privacy`} />
        <meta property="og:title" content="Privacy Policy — Orivaz" />
        <meta property="og:url" content={`${SITE}/privacy`} />
      </Helmet>
      <main className="mx-auto max-w-3xl px-4 py-12">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Back to Orivaz</Link>
        <h1 className="mt-4 text-3xl font-semibold">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>

        <section className="prose prose-sm mt-8 max-w-none dark:prose-invert">
          <p>
            This Privacy Policy explains how Orivaz ("we", "us") collects, uses,
            and protects information when you use our website, applications, and
            services (the "Service"). This page is maintained by Orivaz to answer
            common privacy questions; it is not an independent certification.
          </p>

          <h2>1. Information we collect</h2>
          <ul>
            <li><strong>Account information</strong>: name, email, role, and password (hashed).</li>
            <li><strong>Property information</strong>: addresses, ownership status, documents, photos,
              warranty records, maintenance history, and other property-related content you upload or generate.</li>
            <li><strong>Estate-planning records</strong>: documents and contacts you choose to store in
              the Disaster Vault or Estate Planning surfaces.</li>
            <li><strong>Payment information</strong>: handled by our payments processor (Stripe). We do
              not store full card numbers on our servers.</li>
            <li><strong>Usage data</strong>: pages visited, features used, IP address (hashed for rate
              limiting), browser type, and approximate location derived from IP.</li>
          </ul>

          <h2>2. How we use information</h2>
          <ul>
            <li>To provide the Service: create your account, generate reports, store your records.</li>
            <li>To secure the Service: detect abuse, enforce rate limits, prevent fraud.</li>
            <li>To improve the Service: analyze aggregate usage and product performance.</li>
            <li>To communicate with you about your account, transactional events, and important changes.</li>
          </ul>

          <h2>3. How we share information</h2>
          <p>We share information only with:</p>
          <ul>
            <li><strong>Subprocessors</strong> we use to run the Service (currently Supabase for database
              and authentication, Stripe for payments, Google for address autocomplete, and Lovable AI for
              AI features).</li>
            <li><strong>People you authorize</strong>, such as co-owners you add to a property, builders
              who hand off a property to you, or admins of your account.</li>
            <li><strong>Legal authorities</strong> when required by law or to protect rights, safety, and
              property.</li>
          </ul>
          <p>We do not sell personal information.</p>

          <h2>4. Data retention</h2>
          <p>
            We retain account and property data for as long as your account is active. You can request
            deletion of your account and associated personal data by contacting us; some records may be
            retained as required by law (e.g., financial transaction records).
          </p>

          <h2>5. Your rights</h2>
          <p>
            Depending on your location, you may have rights to access, correct, delete, or port your
            personal information. To exercise these rights, contact us at the address below.
          </p>

          <h2>6. Security</h2>
          <p>
            We use industry-standard security practices including encryption in transit, access controls,
            row-level security, and signed URLs for file access. No system is perfectly secure; we cannot
            guarantee absolute security of information transmitted to or stored on the Service.
          </p>

          <h2>7. Cookies</h2>
          <p>
            We use essential cookies for authentication and to remember preferences. We do not currently
            use third-party advertising or tracking cookies. You can manage cookies through your browser.
          </p>

          <h2>8. Children</h2>
          <p>The Service is not directed to children under 16, and we do not knowingly collect their data.</p>

          <h2>9. Changes</h2>
          <p>We may update this Policy. Material changes will be notified through the Service or by email.</p>

          <h2>10. Contact</h2>
          <p>Questions: <a href="mailto:privacy@orivaz.com">privacy@orivaz.com</a></p>
        </section>
      </main>
      <Footer />
    </>
  );
}
