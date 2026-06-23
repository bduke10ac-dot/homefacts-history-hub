import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Home, ShieldCheck, QrCode, FileText, Camera, Wrench, Activity, Star, ArrowLeft,
  Eye, Globe, CalendarCheck, Building2,
} from "lucide-react";

export default function BuilderAnalytics() {
  const { user } = useAuth();
  const [m, setM] = useState({
    homes: 0, communities: 0, activations: 0, qrScans: 0, warrantyDocs: 0, constructionPhotos: 0,
    remindersCompleted: 0, engagementScore: 0, satisfaction: 0,
    profileVisits: 0, websiteClicks: 0, tourClicks: 0, homesClicks: 0,
  });

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data: mem } = await supabase.from("builder_company_members").select("company_id").eq("user_id", user.id);
      const ids = (mem ?? []).map((x: any) => x.company_id);
      if (!ids.length) return;

      const { data: clones } = await (supabase as any).from("nb_property_clones").select("id, status, construction_stages").in("company_id", ids);
      const cloneIds = (clones ?? []).map((c: any) => c.id);
      const eventCount = async (type: string) => {
        const { count } = await (supabase as any).from("builder_events").select("id", { count: "exact", head: true }).in("company_id", ids).eq("event_type", type);
        return count ?? 0;
      };
      const [{ count: qr }, { data: docs }, { count: reminders }, { data: comms }, pv, wc, tc, hc] = await Promise.all([
        (supabase as any).from("builder_qr_scans").select("id", { count: "exact", head: true }).in("company_id", ids),
        cloneIds.length
          ? (supabase as any).from("nb_clone_documents").select("id, category").in("clone_id", cloneIds)
          : Promise.resolve({ data: [] as any[] }),
        (supabase as any).from("maintenance_reminders").select("id", { count: "exact", head: true }).eq("status", "completed"),
        supabase.from("nb_templates").select("subdivision").in("company_id", ids),
        eventCount("profile_visit"), eventCount("website_click"), eventCount("tour_click"), eventCount("homes_click"),
      ]);

      const homeRows = clones ?? [];
      const homes = homeRows.length;
      const activations = homeRows.filter((c: any) => c.status === "handed_off" || c.status === "transferred").length;
      const warrantyDocs = (docs ?? []).filter((d: any) => (d.category ?? "").toLowerCase().includes("warrant")).length;
      const constructionPhotos = homeRows.reduce((sum: number, c: any) => {
        const stages = Array.isArray(c.construction_stages) ? c.construction_stages : [];
        return sum + stages.reduce((s: number, st: any) => s + (Array.isArray(st?.photos) ? st.photos.length : 0), 0);
      }, 0);
      const communities = new Set((comms ?? []).map((c: any) => c.subdivision).filter(Boolean)).size;
      const engagementScore = homes ? Math.min(100, Math.round(((activations * 60) + (warrantyDocs * 4) + Math.min(qr ?? 0, 200)) / Math.max(homes, 1))) : 0;
      const satisfaction = activations ? Math.min(100, 78 + Math.round((engagementScore - 50) / 5)) : 0;

      setM({
        homes, communities, activations, qrScans: qr ?? 0, warrantyDocs, constructionPhotos,
        remindersCompleted: reminders ?? 0, engagementScore, satisfaction,
        profileVisits: pv, websiteClicks: wc, tourClicks: tc, homesClicks: hc,
      });
    })();
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-6">
        <Link to="/builder" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="mr-1 h-4 w-4" />Back to dashboard</Link>
        <h1 className="mt-3 flex items-center gap-2 text-2xl font-bold"><Activity className="h-6 w-6 text-primary" />Builder Analytics</h1>
        <p className="text-sm text-muted-foreground">How your homes and homeowners are using HomeFacts.</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Homes documented" value={m.homes} icon={Home} />
          <Stat label="Communities added" value={m.communities} icon={Building2} />
          <Stat label="Homeowner activations" value={m.activations} icon={ShieldCheck} />
          <Stat label="QR code scans" value={m.qrScans} icon={QrCode} />
          <Stat label="Warranty documents uploaded" value={m.warrantyDocs} icon={FileText} />
          <Stat label="Construction photos uploaded" value={m.constructionPhotos} icon={Camera} />
          <Stat label="Maintenance reminders completed" value={m.remindersCompleted} icon={Wrench} />
          <Stat label="Homeowner engagement score" value={`${m.engagementScore}/100`} icon={Activity} />
          <Stat label="Customer satisfaction" value={`${m.satisfaction}%`} icon={Star} />
          <Stat label="Builder profile visits" value={m.profileVisits} icon={Eye} />
          <Stat label="Clicks to builder website" value={m.websiteClicks} icon={Globe} />
          <Stat label="Schedule tour clicks" value={m.tourClicks} icon={CalendarCheck} />
          <Stat label="Available homes clicks" value={m.homesClicks} icon={Home} />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, icon: Icon }: { label: string; value: any; icon: any }) {
  return (
    <Card className="shadow-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="h-4 w-4" /></div>
      </CardHeader>
      <CardContent><p className="text-2xl font-bold">{value}</p></CardContent>
    </Card>
  );
}
