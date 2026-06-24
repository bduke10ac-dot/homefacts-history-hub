import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Home, MapPin, Plus, ShieldCheck, MoreVertical, Trash2, Loader2, Activity, Wrench } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface Property { id: string; address_line: string; city: string; state: string; zip: string; }
interface RecordCount { property_id: string; total: number; verified: number; }

const HomeownerDashboard = () => {
  const { user, primaryRole } = useAuth();
  const [claimed, setClaimed] = useState<Property[]>([]);
  const [submittedTo, setSubmittedTo] = useState<Property[]>([]);
  const [counts, setCounts] = useState<Record<string, RecordCount>>({});
  const [pendingDelete, setPendingDelete] = useState<Property | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data: cl } = await supabase.from("properties").select("id,address_line,city,state,zip").eq("claimed_by", user.id);
    const { data: subRecs } = await supabase.from("property_records").select("property_id").eq("submitted_by", user.id);
    const subIds = Array.from(new Set((subRecs ?? []).map((r) => r.property_id)));
    const { data: subProps } = subIds.length
      ? await supabase.from("properties").select("id,address_line,city,state,zip").in("id", subIds)
      : { data: [] as Property[] };

    const all = [...(cl ?? []), ...(subProps ?? [])];
    const uniqueIds = Array.from(new Set(all.map((p) => p.id)));
    if (uniqueIds.length) {
      const { data: recs } = await supabase.from("property_records").select("property_id,verified").in("property_id", uniqueIds);
      const map: Record<string, RecordCount> = {};
      for (const id of uniqueIds) map[id] = { property_id: id, total: 0, verified: 0 };
      for (const r of recs ?? []) { map[r.property_id].total++; if (r.verified) map[r.property_id].verified++; }
      setCounts(map);
    }
    setClaimed(cl ?? []);
    setSubmittedTo((subProps ?? []).filter((p) => !(cl ?? []).some((c) => c.id === p.id)));
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user]);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke("delete-property", {
        body: { property_id: pendingDelete.id },
      });
      if (error || (data as any)?.error) throw new Error(error?.message || (data as any)?.error || "Delete failed");
      toast.success("Property removed");
      setPendingDelete(null);
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm capitalize text-muted-foreground">{primaryRole} dashboard</p>
            <h1 className="mt-1 text-3xl font-bold">Your homes</h1>
          </div>
          <Button asChild><Link to="/search"><Plus className="mr-2 h-4 w-4" />Add or find a property</Link></Button>
        </div>

        <Section
          title="Claimed properties"
          empty="You haven't claimed a home yet. Search for your address to get started."
          items={claimed}
          counts={counts}
          accentBadge="Owner"
          onDelete={(p) => setPendingDelete(p)}
        />
        <Section title="Properties you've contributed to" empty="" items={submittedTo} counts={counts} />
      </div>

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && !deleting && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this property?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <b>{pendingDelete?.address_line}</b>? This will permanently
              delete its records, documents, warranties, reports, maintenance history, and uploaded files.
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); confirmDelete(); }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Removing…</> : "Delete permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

function Section({ title, empty, items, counts, accentBadge, onDelete }: {
  title: string; empty: string; items: Property[]; counts: Record<string, RecordCount>;
  accentBadge?: string; onDelete?: (p: Property) => void;
}) {
  if (items.length === 0 && !empty) return null;
  return (
    <section className="mt-10">
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      {items.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed p-10 text-center text-muted-foreground">
          <Home className="mx-auto h-8 w-8" /><p className="mt-3">{empty}</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((p) => {
            const c = counts[p.id] ?? { total: 0, verified: 0 };
            return (
              <div key={p.id} className="group relative rounded-xl border bg-card p-5 shadow-card transition-all hover:border-primary/40 hover:shadow-elevated">
                <Link to={`/property/${p.id}`} className="block">
                  <div className="flex items-start justify-between gap-3 pr-8">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><MapPin className="h-5 w-5" /></div>
                      <div>
                        <p className="font-semibold">{p.address_line}</p>
                        <p className="text-sm text-muted-foreground">{p.city}, {p.state} {p.zip}</p>
                      </div>
                    </div>
                    {accentBadge && <Badge variant="outline">{accentBadge}</Badge>}
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{c.total} records</span>
                    <span className="flex items-center gap-1 text-accent"><ShieldCheck className="h-3.5 w-3.5" />{c.verified} verified</span>
                  </div>
                </Link>
                {onDelete && (
                  <div className="absolute right-3 top-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground opacity-60 hover:opacity-100"
                          aria-label="Property actions"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={(e) => { e.stopPropagation(); onDelete(p); }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />Remove property
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default HomeownerDashboard;
