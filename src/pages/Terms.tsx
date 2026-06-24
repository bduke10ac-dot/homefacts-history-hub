import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Footer } from "@/components/layout/Footer";

const SITE = "https://homefacts-history-hub.lovable.app";

export default function Terms() {
  return (
    <>
      <Helmet>
        <title>Terms of Service — Orivaz</title>
        <meta name="description" content="The terms governing your use of the Orivaz property intelligence service." />
        <link rel="canonical" href={`${SITE}/terms`} />
        <meta property="og:title" content="Terms of Service — Orivaz" />
        <meta property="og:url" content={`${SITE}/terms`} />
      </Helmet>
      <main className="mx-auto max-w-3xl px-4 py-12">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Back to Orivaz</Link>
        <h1 className="mt-4 text-3xl font-semibold">Terms of Service</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>

        <section className="prose prose-sm mt-8 max-w-none dark:prose-invert">
          <p>
            By accessing or using Orivaz ("Service"), you agree to these Terms. If you do not agree,
            do not use the Service.
          </p>

          <h2>1. Eligibility and accounts</h2>
          <p>
            You must be at least 16 years old and able to enter into a binding agreement. You are
            responsible for maintaining the confidentiality of your credentials and for all activity
            under your account.
          </p>

          <h2>2. Your content</h2>
          <p>
            You retain ownership of content you upload (documents, photos, records). You grant us a
            limited license to store, process, and display that content as necessary to operate the
            Service. You are responsible for the accuracy and legality of content you provide.
          </p>

          <h2>3. Acceptable use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Misuse the Service or attempt to access it in unauthorized ways.</li>
            <li>Scrape, harvest, or extract data at volume without our written permission.</li>
            <li>Upload illegal content or content that infringes others' rights.</li>
            <li>Use the Service to impersonate or defraud anyone.</li>
          </ul>

          <h2>4. Payments</h2>
          <p>
            Paid plans renew automatically until cancelled. You can cancel through your account; access
            continues until the end of the paid period. Fees are non-refundable except where required
            by law.
          </p>

          <h2>5. Informational use only — no professional advice</h2>
          <p>
            Reports, scores, risk indicators, value estimates, insurance readiness assessments, crime
            data, and forecasts presented through the Service are provided <strong>"as is" for
            informational purposes only</strong>. They are generated from modeled and third-party
            data, may include estimates, and may be incomplete or out of date. They are <strong>not a
            substitute</strong> for a professional inspection, appraisal, insurance underwriting
            decision, legal advice, financial advice, or any other professional service. Always consult
            a licensed professional before making decisions about purchasing, insuring, financing, or
            improving a property.
          </p>

          <h2>6. No warranty</h2>
          <p>
            ORIVAZ DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR
            A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE MAKE NO WARRANTY THAT THE SERVICE OR ITS
            CONTENT IS ACCURATE, COMPLETE, OR CURRENT.
          </p>

          <h2>7. Limitation of liability</h2>
          <p>
            TO THE FULLEST EXTENT PERMITTED BY LAW, ORIVAZ WILL NOT BE LIABLE FOR INDIRECT,
            INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR LOST PROFITS OR REVENUE,
            ARISING FROM YOUR USE OF THE SERVICE. OUR TOTAL LIABILITY FOR ANY CLAIM WILL NOT EXCEED
            THE GREATER OF (A) THE AMOUNT YOU PAID US IN THE 12 MONTHS BEFORE THE EVENT, OR (B) USD
            $100.
          </p>

          <h2>8. Termination</h2>
          <p>
            We may suspend or terminate accounts that violate these Terms. You may close your account
            at any time.
          </p>

          <h2>9. Changes</h2>
          <p>We may modify these Terms. Continued use after changes constitutes acceptance.</p>

          <h2>10. Governing law</h2>
          <p>These Terms are governed by the laws of the State of Delaware, USA.</p>

          <h2>11. Contact</h2>
          <p>Questions: <a href="mailto:legal@orivaz.com">legal@orivaz.com</a></p>
        </section>
      </main>
      <Footer />
    </>
  );
}
