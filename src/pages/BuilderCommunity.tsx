import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BuiltBy } from "@/components/builder/BuiltBy";
import {
  ArrowLeft, MapPin, Trees, GraduationCap, ShoppingBag, Footprints, Zap,
  Home as HomeIcon, ClipboardCheck, Building2, ShieldCheck, Loader2,
} from "lucide-react";

const STATUS_LABEL: Record<string, string> = {
  under_construction: "Under construction",
  ready_for_handoff: "Ready for handoff",
  handed_off: "Handed off",
  transferred: "Transferred",
  draft: "Coming soon",
};

export default function BuilderCommunity() {
  const { slug, id } = useParams();
  const [builder, setBuilder] = useState<any>(null);
  const [community, setCommunity] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [homes, setHomes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!slug || !id) return;
      const { data: b } = await supabase.from("builder_companies").select("*").eq("slug", slug).maybeSingle();
      setBuilder(b);
      const { data: c } = await supabase.from("nb_templates").select("*").eq("id", id).maybeSingle();
      setCommunity(c);
      if (b?.id) {
        const [{ data: p }, { data: h }] = await Promise.all([
          supabase.from("nb_templates").select("*").eq("parent_template_id", id).eq("kind", "model").order("name"),
          (supabase as any).from("nb_property_clones")
            .select("id, lot_number, address_line, city, state, zip, status, handoff_token, template_id, completion_date, co_date, nb_templates(name, square_feet, bedrooms, bathrooms)")
            .eq("company_id", b.id),
        ]);
        setPlans(p ?? []);
        // Filter homes by their floor plan parent template
        const planIds = new Set((p ?? []).map((x: any) => x.id));
        setHomes((h ?? []).filter((x: any) => planIds.has(x.template_id)));
      }
      setLoading(false);
    })();
  }, [slug, id]);

  if (loading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading…</div>;
  if (!community || !builder) return <div className="container py-12 text-center">Community not found.</div>;

  const hoa = community.hoa_info ?? {};
  const utils = community.utility_info ?? {};
  const amenities: string[] = Array.isArray(hoa.amenities) ? hoa.amenities : [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div
        className="px-6 py-12 text-primary-foreground"
        style={{
          background: builder.brand_primary_color
            ? `linear-gradient(135deg, ${builder.brand_primary_color}, ${builder.brand_secondary_color ?? builder.brand_primary_color})`
            : undefined,
        }}
      >
        <div className="container">
          <Link to={`/builders/${slug}`} className="inline-flex items-center text-xs opacity-85 hover:opacity-100"><ArrowLeft className="mr-1 h-3.5 w-3.5" />Back to {builder.name}</Link>
          <div className="mt-2 flex items-center gap-2 text-xs uppercase tracking-wider opacity-85"><Building2 className="h-4 w-4" />Community</div>
          <h1 className="mt-2 text-3xl font-bold md:text-4xl">{community.name}</h1>
          <p className="mt-2 opacity-90 max-w-2xl">{community.description}</p>
          <p className="mt-3 inline-flex items-center gap-1 text-xs"><ShieldCheck className="h-3.5 w-3.5" />Built by HomeFacts Certified Builder · {builder.name}</p>
        </div>
      </div>

      <div className="container py-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {/* Overview & amenities */}
          <Card><CardContent className="space-y-4 p-5">
            <Section title="Community amenities" icon={Trees}>
              {amenities.length ? (
                <div className="flex flex-wrap gap-1.5">{amenities.map((a) => <Badge key={a} variant="outline">{a}</Badge>)}</div>
              ) : <p className="text-sm text-muted-foreground">Amenities coming soon.</p>}
            </Section>

            <Section title="Nearby schools" icon={GraduationCap}>
              <p className="text-sm text-muted-foreground">Spring Hill High School, Heritage Middle, and Allendale Elementary are within Maury County Public Schools — check current school assignment with the district.</p>
            </Section>

            <Section title="Nearby shopping & dining" icon={ShoppingBag}>
              <p className="text-sm text-muted-foreground">Crossings of Spring Hill, Publix, Kroger, Target, and the historic Columbia square are all within 15 minutes.</p>
            </Section>

            <Section title="Parks & walking trails" icon={Footprints}>
              <p className="text-sm text-muted-foreground">Harvey Park, Port Royal State Park, and community walking trails surround the area.</p>
            </Section>

            <Section title="Utilities" icon={Zap}>
              <ul className="grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
                {utils.electric && <li><strong className="text-foreground">Electric:</strong> {utils.electric}</li>}
                {utils.water && <li><strong className="text-foreground">Water:</strong> {utils.water}</li>}
                {utils.gas && <li><strong className="text-foreground">Gas:</strong> {utils.gas}</li>}
                {utils.internet && <li><strong className="text-foreground">Internet:</strong> {utils.internet}</li>}
              </ul>
            </Section>

            {hoa.hoa_name && (
              <Section title="HOA information" icon={ClipboardCheck}>
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">{hoa.hoa_name}</strong>
                  {hoa.dues_monthly ? ` · $${hoa.dues_monthly}/mo` : ""}
                </p>
              </Section>
            )}
          </CardContent></Card>

          {/* Floor plans */}
          <Card><CardContent className="p-5">
            <h2 className="flex items-center gap-2 text-base font-semibold"><ClipboardCheck className="h-4 w-4 text-primary" />Floor plans</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {plans.map((p) => (
                <div key={p.id} className="rounded-xl border bg-card p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold">{p.name}</p>
                    {p.elevation && <Badge variant="outline" className="text-xs">{p.elevation}</Badge>}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{p.square_feet} sf · {p.bedrooms} bd · {p.bathrooms} ba</p>
                  {p.description && <p className="mt-2 text-xs text-muted-foreground">{p.description}</p>}
                </div>
              ))}
              {!plans.length && <p className="text-sm text-muted-foreground">Floor plans coming soon.</p>}
            </div>
          </CardContent></Card>

          {/* Available homes */}
          <Card><CardContent className="p-5">
            <h2 className="flex items-center gap-2 text-base font-semibold"><HomeIcon className="h-4 w-4 text-primary" />Homes in this community</h2>
            <div className="mt-3 space-y-2">
              {homes.map((h) => (
                <Link
                  key={h.id}
                  to={`/home/${h.handoff_token}`}
                  className="block rounded-xl border bg-card p-4 transition hover:border-primary"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold">{h.address_line}</p>
                      <p className="text-xs text-muted-foreground">
                        {[h.city, h.state, h.zip].filter(Boolean).join(", ")} · Lot {h.lot_number} · {h.nb_templates?.name}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {h.nb_templates?.square_feet} sf · {h.nb_templates?.bedrooms} bd · {h.nb_templates?.bathrooms} ba
                      </p>
                    </div>
                    <Badge variant="secondary" className="capitalize">{STATUS_LABEL[h.status] ?? h.status}</Badge>
                  </div>
                </Link>
              ))}
              {!homes.length && <p className="text-sm text-muted-foreground">No homes listed yet.</p>}
            </div>
          </CardContent></Card>

          {/* Community gallery placeholder */}
          <Card><CardContent className="p-5">
            <h2 className="flex items-center gap-2 text-base font-semibold"><MapPin className="h-4 w-4 text-primary" />Community gallery</h2>
            <p className="mt-2 text-xs text-muted-foreground">Builder-approved photos appear here once uploaded by {builder.name}.</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="aspect-video rounded-lg bg-muted" />
              ))}
            </div>
          </CardContent></Card>
        </div>

        <aside className="space-y-4">
          <BuiltBy company={builder} />
          <Button asChild className="w-full" variant="outline">
            <a href={builder.available_homes_url ?? builder.website ?? "#"} target="_blank" rel="noreferrer">
              View available homes on Creekside →
            </a>
          </Button>
        </aside>
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-1.5 flex items-center gap-2 text-sm font-semibold"><Icon className="h-4 w-4 text-primary" />{title}</h3>
      {children}
    </div>
  );
}
