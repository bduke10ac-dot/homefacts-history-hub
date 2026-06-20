import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertTriangle, CheckCircle2, History, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

type Flag = {
  id: string;
  flag_type: string | null;
  severity: string | null;
  detail: string | null;
  detected_at: string | null;
  resolved: boolean | null;
  resolved_at: string | null;
  resolved_note: string | null;
  permit_id: string | null;
  professional_id: string | null;
  professionals?: { id: string; professional_name: string | null; company_name: string | null; verification_badge: string | null; license_number: string | null } | null;
};

type BadgeHistory = {
  id: string;
  changed_at: string | null;
  previous_badge: string | null;
  new_badge: string | null;
  reason: string | null;
  professional_id: string | null;
  professionals?: { professional_name: string | null; company_name: string | null } | null;
};

const sevColor: Record<string, string> = {
  high: "bg-red-100 text-red-800 border-red-300",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
  low: "bg-gray-100 text-gray-800 border-gray-300",
};

const badgeDot: Record<string, string> = {
  green: "🟢",
  yellow: "🟡",
  red: "🔴",
  gray: "⚪",
};

const AdminFraudReview = () => {
  const [open, setOpen] = useState<Flag[]>([]);
  const [resolved, setResolved] = useState<Flag[]>([]);
  const [history, setHistory] = useState<BadgeHistory[]>([]);
  const [active, setActive] = useState<Flag | null>(null);
  const [note, setNote] = useState("");

  const load = useCallback(async () => {
    const sel = "id,flag_type,severity,detail,detected_at,resolved,resolved_at,resolved_note,permit_id,professional_id,professionals(id,professional_name,company_name,verification_badge,license_number)";
    const [{ data: o }, { data: r }, { data: h }] = await Promise.all([
      supabase.from("fraud_flags").select(sel).eq("resolved", false).order("detected_at", { ascending: false }),
      supabase.from("fraud_flags").select(sel).eq("resolved", true).order("resolved_at", { ascending: false }).limit(30),
      supabase.from("professional_badge_history").select("id,changed_at,previous_badge,new_badge,reason,professional_id,professionals(professional_name,company_name)").order("changed_at", { ascending: false }).limit(50),
    ]);
    setOpen((o ?? []) as Flag[]);
    setResolved((r ?? []) as Flag[]);
    setHistory((h ?? []) as BadgeHistory[]);
  }, []);

  useEffect(() => { load(); }, [load]);

  const resolve = async () => {
    if (!active) return;
    const { error } = await supabase.from("fraud_flags").update({
      resolved: true,
      resolved_at: new Date().toISOString(),
      resolved_note: note || "Reviewed by admin",
    }).eq("id", active.id);
    if (error) return toast.error(error.message);
    toast.success("Flag resolved");
    setActive(null); setNote(""); load();
  };

  const reopen = async (id: string) => {
    const { error } = await supabase.from("fraud_flags").update({
      resolved: false, resolved_at: null, resolved_note: null,
    }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Flag reopened"); load();
  };

  const FlagRow = ({ f, action }: { f: Flag; action: "review" | "reopen" }) => (
    <li className="flex flex-wrap items-start justify-between gap-3 p-5">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={sevColor[f.severity ?? "low"]}>
            <AlertTriangle className="mr-1 h-3 w-3" />
            {f.severity ?? "low"}
          </Badge>
          <span className="font-mono text-xs uppercase text-muted-foreground">{f.flag_type}</span>
        </div>
        <p className="mt-2 text-sm">{f.detail}</p>
        {f.professionals && (
          <p className="mt-1 text-xs text-muted-foreground">
            {badgeDot[f.professionals.verification_badge ?? "gray"]} {f.professionals.professional_name}
            {f.professionals.company_name ? ` · ${f.professionals.company_name}` : ""}
            {f.professionals.license_number ? ` · Lic ${f.professionals.license_number}` : ""}
          </p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          Detected {f.detected_at ? format(new Date(f.detected_at), "MMM d, yyyy") : "—"}
          {f.resolved_at && ` · Resolved ${format(new Date(f.resolved_at), "MMM d, yyyy")}`}
          {f.resolved_note && ` · "${f.resolved_note}"`}
        </p>
      </div>
      {action === "review" ? (
        <Button size="sm" onClick={() => { setActive(f); setNote(""); }}>
          <CheckCircle2 className="mr-2 h-4 w-4" /> Review
        </Button>
      ) : (
        <Button size="sm" variant="ghost" onClick={() => reopen(f.id)}>Reopen</Button>
      )}
    </li>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Admin · Trust & safety</p>
            <h1 className="mt-1 text-3xl font-bold">Fraud review queue</h1>
          </div>
          <Link to="/admin"><Button variant="outline" size="sm"><ExternalLink className="mr-2 h-4 w-4" />Verification queue</Button></Link>
        </div>

        <Tabs defaultValue="open" className="mt-8">
          <TabsList>
            <TabsTrigger value="open">Open ({open.length})</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
            <TabsTrigger value="history"><History className="mr-1 h-4 w-4" />Badge history</TabsTrigger>
          </TabsList>

          <TabsContent value="open" className="mt-4">
            <div className="rounded-xl border bg-card shadow-card">
              {open.length === 0 ? (
                <div className="p-10 text-center text-muted-foreground">No open fraud flags 🎉</div>
              ) : (
                <ul className="divide-y">{open.map((f) => <FlagRow key={f.id} f={f} action="review" />)}</ul>
              )}
            </div>
          </TabsContent>

          <TabsContent value="resolved" className="mt-4">
            <div className="rounded-xl border bg-card shadow-card">
              {resolved.length === 0 ? (
                <div className="p-10 text-center text-muted-foreground">No resolved flags yet.</div>
              ) : (
                <ul className="divide-y">{resolved.map((f) => <FlagRow key={f.id} f={f} action="reopen" />)}</ul>
              )}
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <div className="rounded-xl border bg-card shadow-card">
              {history.length === 0 ? (
                <div className="p-10 text-center text-muted-foreground">No badge changes recorded.</div>
              ) : (
                <ul className="divide-y">
                  {history.map((h) => (
                    <li key={h.id} className="flex flex-wrap items-center justify-between gap-3 p-5">
                      <div>
                        <p className="font-medium">
                          {h.professionals?.professional_name ?? "Unknown"}
                          {h.professionals?.company_name && <span className="text-muted-foreground"> · {h.professionals.company_name}</span>}
                        </p>
                        <p className="mt-1 text-sm">
                          {badgeDot[h.previous_badge ?? "gray"]} <span className="capitalize">{h.previous_badge ?? "—"}</span>
                          <span className="mx-2 text-muted-foreground">→</span>
                          {badgeDot[h.new_badge ?? "gray"]} <span className="capitalize">{h.new_badge ?? "—"}</span>
                        </p>
                        {h.reason && <p className="mt-1 text-xs text-muted-foreground">{h.reason}</p>}
                      </div>
                      <span className="text-xs text-muted-foreground">{h.changed_at ? format(new Date(h.changed_at), "MMM d, yyyy h:mma") : ""}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve fraud flag</DialogTitle>
          </DialogHeader>
          {active && (
            <div className="space-y-3 text-sm">
              <div>
                <Badge variant="outline" className={sevColor[active.severity ?? "low"]}>{active.severity}</Badge>
                <span className="ml-2 font-mono text-xs uppercase text-muted-foreground">{active.flag_type}</span>
              </div>
              <p className="text-muted-foreground">{active.detail}</p>
              <div>
                <label className="mb-1 block text-xs font-medium">Resolution note</label>
                <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Confirmed identity with state board; license is valid under doing-business-as name." />
              </div>
              <p className="text-xs text-muted-foreground">
                Resolving this flag may automatically recompute the professional's verification badge.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setActive(null)}>Cancel</Button>
            <Button onClick={resolve}><CheckCircle2 className="mr-2 h-4 w-4" />Mark resolved</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminFraudReview;
