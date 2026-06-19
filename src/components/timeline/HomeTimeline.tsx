import { Fragment, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Calendar, ShieldCheck, Paperclip, Home } from "lucide-react";
import { format } from "date-fns";
import { getCategoryMeta } from "@/lib/categoryMeta";

export interface TimelineRecord {
  id: string;
  category: string;
  title: string;
  description?: string | null;
  performed_by?: string | null;
  cost?: number | null;
  performed_at?: string | null;
  verified?: boolean;
  attachmentsCount?: number;
}

export interface TimelineProperty {
  year_built?: number | null;
  address_line?: string;
}

interface Entry {
  id: string;
  date: Date | null;
  year: number;
  isMilestone: boolean;
  category: string;
  title: string;
  description?: string | null;
  performed_by?: string | null;
  cost?: number | null;
  verified?: boolean;
  attachmentsCount?: number;
  trailing?: ReactNode;
}

interface Props {
  property: TimelineProperty;
  records: TimelineRecord[];
  /** Optional trailing content (e.g. verify button) keyed by record id */
  recordActions?: Record<string, ReactNode>;
}

export function HomeTimeline({ property, records, recordActions }: Props) {
  const entries: Entry[] = records.map((r) => ({
    id: r.id,
    date: r.performed_at ? new Date(r.performed_at) : null,
    year: r.performed_at ? new Date(r.performed_at).getFullYear() : 0,
    isMilestone: false,
    category: r.category,
    title: r.title,
    description: r.description,
    performed_by: r.performed_by,
    cost: r.cost,
    verified: r.verified,
    attachmentsCount: r.attachmentsCount,
    trailing: recordActions?.[r.id],
  }));

  if (property.year_built) {
    entries.push({
      id: "milestone-built",
      date: new Date(property.year_built, 0, 1),
      year: property.year_built,
      isMilestone: true,
      category: "construction",
      title: "Home built",
      description: property.address_line ? `Original construction of ${property.address_line}` : "Original construction",
    });
  }

  // Sort newest first; entries with no date sink to the bottom of their bucket
  entries.sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return b.date.getTime() - a.date.getTime();
  });

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border bg-card p-6 text-center text-muted-foreground shadow-card">
        <Home className="mx-auto h-8 w-8" />
        <p className="mt-3 text-sm">No timeline events yet.</p>
      </div>
    );
  }

  // Group by year for header labels
  const groups: Array<{ year: number | "Undated"; items: Entry[] }> = [];
  for (const e of entries) {
    const key: number | "Undated" = e.date ? e.date.getFullYear() : "Undated";
    const last = groups[groups.length - 1];
    if (last && last.year === key) last.items.push(e);
    else groups.push({ year: key, items: [e] });
  }

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-card">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Home timeline</h2>
        <span className="text-xs text-muted-foreground">Newest first</span>
      </div>

      <div className="relative mt-6">
        {/* Vertical rail */}
        <div className="pointer-events-none absolute left-5 top-0 bottom-0 w-px bg-border" aria-hidden />

        {groups.map((g) => (
          <Fragment key={String(g.year)}>
            <div className="relative mb-3 mt-2 flex items-center gap-3 first:mt-0">
              <div className="z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-semibold text-foreground shadow-sm">
                {g.year === "Undated" ? "—" : String(g.year).slice(-2)}
              </div>
              <span className="text-sm font-semibold text-muted-foreground">{g.year}</span>
            </div>

            <ol className="space-y-3 pb-4">
              {g.items.map((e) => {
                const meta = getCategoryMeta(e.category);
                const Icon = meta.icon;
                return (
                  <li key={e.id} className="relative pl-14">
                    {/* Dot on the rail */}
                    <span
                      className={`absolute left-3.5 top-5 z-10 flex h-4 w-4 items-center justify-center rounded-full border-2 border-background ${
                        e.isMilestone ? "bg-primary" : e.verified ? "bg-accent" : "bg-muted-foreground/40"
                      }`}
                      aria-hidden
                    />
                    <div
                      className={`rounded-xl border p-4 transition-shadow hover:shadow-card ${
                        e.isMilestone ? "border-primary/30 bg-primary/5" : "bg-background"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`flex h-9 w-9 flex-none items-center justify-center rounded-lg ${meta.tone}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-semibold leading-tight">{e.title}</h3>
                                <Badge variant="secondary" className="capitalize">{meta.label}</Badge>
                                {e.isMilestone ? (
                                  <Badge className="bg-primary text-primary-foreground hover:bg-primary">Milestone</Badge>
                                ) : e.verified ? (
                                  <Badge className="bg-accent text-accent-foreground hover:bg-accent">
                                    <ShieldCheck className="mr-1 h-3 w-3" />Verified
                                  </Badge>
                                ) : (
                                  <Badge variant="outline">Pending</Badge>
                                )}
                              </div>
                              {e.description && (
                                <p className="mt-2 text-sm text-muted-foreground">{e.description}</p>
                              )}
                              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                {e.date && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {format(e.date, "MMM d, yyyy")}
                                  </span>
                                )}
                                {e.performed_by && <span>By {e.performed_by}</span>}
                                {e.cost != null && (
                                  <span className="font-medium text-foreground">
                                    ${Number(e.cost).toLocaleString()}
                                  </span>
                                )}
                                {e.attachmentsCount ? (
                                  <span className="flex items-center gap-1">
                                    <Paperclip className="h-3 w-3" />
                                    {e.attachmentsCount} file{e.attachmentsCount > 1 ? "s" : ""}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                            {e.trailing && <div className="no-print">{e.trailing}</div>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </Fragment>
        ))}
      </div>
    </div>
  );
}
