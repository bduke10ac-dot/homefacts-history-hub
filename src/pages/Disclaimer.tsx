import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Footer } from "@/components/layout/Footer";

const SITE = "https://homefacts-history-hub.lovable.app";

export default function Disclaimer() {
  return (
    <>
      <Helmet>
        <title>Disclaimer — Orivaz</title>
        <meta name="description" content="Orivaz provides property information for informational purposes only. Not professional advice." />
        <link rel="canonical" href={`${SITE}/disclaimer`} />
        <meta property="og:title" content="Disclaimer — Orivaz" />
        <meta property="og:url" content={`${SITE}/disclaimer`} />
      </Helmet>
      <main className="mx-auto max-w-3xl px-4 py-12">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Back to Orivaz</Link>
        <h1 className="mt-4 text-3xl font-semibold">Disclaimer</h1>

        <section className="prose prose-sm mt-8 max-w-none dark:prose-invert">
          <p>
            <strong>Informational use only.</strong> All reports, scores, risk indicators, value
            estimates, insurance readiness assessments, crime data, weather/environmental events,
            forecasts, and AI-generated narratives presented by Orivaz are provided <strong>"as
            is"</strong> for informational and educational purposes only.
          </p>

          <p>
            <strong>Not professional advice.</strong> Orivaz is not a licensed real estate
            professional, inspector, appraiser, insurance carrier, financial advisor, attorney, or
            estate planner. Nothing presented on this Service constitutes professional inspection,
            appraisal, insurance underwriting, legal, tax, or financial advice. Do not rely on this
            Service as a substitute for consultation with a qualified licensed professional.
          </p>

          <p>
            <strong>Modeled and third-party data.</strong> Much of the information shown is generated
            from public records, third-party providers, statistical models, and AI summaries. It may
            be incomplete, out of date, or contain errors. Property descriptions, square footage,
            year built, tax assessments, school ratings, crime statistics, hazard exposure, and
            similar fields are estimates only and should be independently verified before any
            decision.
          </p>

          <p>
            <strong>No warranty.</strong> Orivaz makes no warranty as to the accuracy, completeness,
            timeliness, or fitness for any particular purpose of any information shown.
          </p>

          <p>
            <strong>Your responsibility.</strong> Decisions to buy, sell, insure, finance, repair, or
            improve a property are your responsibility. Always commission a professional inspection
            and consult licensed professionals before acting.
          </p>

          <p className="text-sm">
            See also our <Link to="/terms" className="underline underline-offset-2">Terms of Service</Link>{" "}
            and <Link to="/privacy" className="underline underline-offset-2">Privacy Policy</Link>.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
