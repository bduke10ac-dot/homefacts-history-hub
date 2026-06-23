import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BuilderBadgeRow } from "./BuilderBadgeRow";
import {
  Globe, CalendarCheck, Home, Mail, Phone, MapPin, ShieldCheck, Star,
  Facebook, Instagram, Youtube, Linkedin, Award, FileText,
} from "lucide-react";

type Variant = "full" | "compact" | "banner";

interface Props {
  /** Pass a company row OR a slug to auto-load. */
  company?: any;
  slug?: string;
  variant?: Variant;
  className?: string;
}

const SOCIALS: Array<[string, any]> = [
  ["social_facebook", Facebook],
  ["social_instagram", Instagram],
  ["social_youtube", Youtube],
  ["social_linkedin", Linkedin],
];

function ext(url?: string | null) {
  if (!url) return undefined;
  return url.startsWith("http") ? url : `https://${url}`;
}

function logEvent(companyId: string, type: string) {
  if (!companyId) return;
  (supabase as any).from("builder_events").insert({ company_id: companyId, event_type: type });
}

export function BuiltBy({ company: companyProp, slug, variant = "full", className }: Props) {
  const [company, setCompany] = useState<any>(companyProp ?? null);

  useEffect(() => {
    if (companyProp) { setCompany(companyProp); return; }
    if (!slug) return;
    supabase
      .from("builder_companies")
      .select("*")
      .eq("slug", slug)
      .maybeSingle()
      .then(({ data }) => setCompany(data));
  }, [slug, companyProp]);

  if (!company) return null;

  const website = ext(company.website);
  const tour = ext(company.schedule_tour_url) ?? website;
  const homes = ext(company.available_homes_url) ?? website;
  const contact = ext(company.contact_url) ?? website;

  if (variant === "compact") {
    return (
      <div className={`flex items-center gap-3 rounded-xl border bg-card p-3 ${className ?? ""}`}>
        <Logo company={company} size={44} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">Built by {company.name}</p>
          {company.is_founding_builder && (
            <p className="text-[10px] uppercase tracking-wider text-primary">Founding Builder #{String(company.founding_builder_number ?? 1).padStart(3, "0")}</p>
          )}
        </div>
        {website && (
          <Button asChild size="sm" variant="outline">
            <a href={website} target="_blank" rel="noreferrer"><Globe className="mr-1.5 h-3.5 w-3.5" />Website</a>
          </Button>
        )}
      </div>
    );
  }

  if (variant === "banner") {
    return (
      <div
        className={`rounded-2xl border p-4 ${className ?? ""}`}
        style={{
          background: company.brand_primary_color
            ? `linear-gradient(135deg, ${company.brand_primary_color}, ${company.brand_secondary_color ?? company.brand_primary_color})`
            : undefined,
          color: company.brand_primary_color ? "white" : undefined,
        }}
      >
        <div className="flex flex-wrap items-center gap-3">
          <Logo company={company} size={56} />
          <div className="flex-1">
            <p className="text-xs uppercase tracking-wider opacity-80">Built by</p>
            <p className="text-lg font-bold">{company.name}</p>
          </div>
          {website && (
            <Button asChild size="sm" variant="secondary">
              <a href={website} target="_blank" rel="noreferrer"><Globe className="mr-1.5 h-4 w-4" />Visit Website</a>
            </Button>
          )}
        </div>
      </div>
    );
  }

  // FULL
  return (
    <div className={`overflow-hidden rounded-2xl border bg-card shadow-card ${className ?? ""}`}>
      <div
        className="px-5 pt-5 pb-3"
        style={{
          background: company.brand_primary_color
            ? `linear-gradient(135deg, ${company.brand_primary_color}10, ${company.brand_secondary_color ?? company.brand_primary_color}20)`
            : undefined,
        }}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Built By</p>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <Logo company={company} size={80} />
          <div className="min-w-0 flex-1">
            <h3 className="text-xl font-bold">{company.name}</h3>
            {company.is_founding_builder && (
              <p className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-primary">
                <Star className="h-3.5 w-3.5 fill-current" />
                Founding Builder #{String(company.founding_builder_number ?? 1).padStart(3, "0")}
              </p>
            )}
            <p className="mt-1 flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              Orivaz Verified Builder
            </p>
          </div>
        </div>

        {company.description && (
          <p className="mt-3 text-sm leading-relaxed text-foreground/85">{company.description}</p>
        )}
        {company.tagline && company.tagline !== company.description && (
          <p className="mt-1 text-xs italic text-muted-foreground">{company.tagline}</p>
        )}

        {company.badges?.length > 0 && <div className="mt-3"><BuilderBadgeRow badges={company.badges} /></div>}
      </div>

      <div className="grid gap-2 px-5 py-4 sm:grid-cols-2">
        <Button asChild>
          <a href={website ?? "#"} target="_blank" rel="noreferrer" onClick={() => logEvent(company.id, "website_click")}>
            <Globe className="mr-2 h-4 w-4" />Visit Builder Website
          </a>
        </Button>
        <Button asChild variant="outline">
          <a href={tour ?? "#"} target="_blank" rel="noreferrer" onClick={() => logEvent(company.id, "tour_click")}>
            <CalendarCheck className="mr-2 h-4 w-4" />Schedule a Tour
          </a>
        </Button>
        <Button asChild variant="outline">
          <a href={homes ?? "#"} target="_blank" rel="noreferrer" onClick={() => logEvent(company.id, "homes_click")}>
            <Home className="mr-2 h-4 w-4" />View Available Homes
          </a>
        </Button>
        <Button asChild variant="outline">
          <a href={contact ?? "#"} target="_blank" rel="noreferrer" onClick={() => logEvent(company.id, "contact_click")}>
            <Mail className="mr-2 h-4 w-4" />Contact Builder
          </a>
        </Button>
      </div>

      {(company.phone || company.email || company.city || company.warranty_portal_url) && (
        <div className="space-y-1.5 border-t px-5 py-3 text-xs text-muted-foreground">
          {company.phone && <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" />{company.phone}</p>}
          {company.email && <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" />{company.email}</p>}
          {(company.city || company.state) && (
            <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" />{[company.address_line, company.city, company.state, company.zip].filter(Boolean).join(", ")}</p>
          )}
          {company.warranty_portal_url && (
            <p className="flex items-center gap-2">
              <FileText className="h-3.5 w-3.5" />
              <a href={ext(company.warranty_portal_url)} target="_blank" rel="noreferrer" className="text-primary underline">Warranty portal</a>
            </p>
          )}
        </div>
      )}

      {SOCIALS.some(([k]) => company[k]) && (
        <div className="flex flex-wrap gap-2 border-t px-5 py-3">
          {SOCIALS.map(([k, Icon]) => company[k] && (
            <a key={k} href={ext(company[k])} target="_blank" rel="noreferrer" className="rounded-full border bg-card p-2 transition hover:bg-muted">
              <Icon className="h-4 w-4" />
            </a>
          ))}
        </div>
      )}

      {company.awards?.length > 0 && (
        <div className="border-t px-5 py-3 text-xs">
          <p className="mb-1.5 flex items-center gap-1.5 font-semibold"><Award className="h-3.5 w-3.5" />Awards & recognition</p>
          <ul className="space-y-0.5 text-muted-foreground">
            {company.awards.map((a: string) => <li key={a}>• {a}</li>)}
          </ul>
        </div>
      )}

      {company.slug && (
        <div className="border-t bg-muted/40 px-5 py-2 text-right">
          <Link to={`/builders/${company.slug}`} className="text-xs text-primary underline">View full builder profile →</Link>
        </div>
      )}
    </div>
  );
}

function Logo({ company, size }: { company: any; size: number }) {
  if (company.logo_url) {
    return (
      <img
        src={company.logo_url}
        alt={`${company.name} logo`}
        className="rounded-lg border bg-white object-contain p-1"
        style={{ height: size, width: size }}
      />
    );
  }
  return (
    <div
      className="flex items-center justify-center rounded-lg border bg-muted text-xs font-bold text-muted-foreground"
      style={{ height: size, width: size }}
    >
      {company.name?.[0] ?? "B"}
    </div>
  );
}
