import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QRCodeCanvas } from "qrcode.react";
import { Award, Printer, Share2, ExternalLink, ShieldCheck } from "lucide-react";

export default function BuilderMarketing() {
  const { user } = useAuth();
  const [company, setCompany] = useState<any>(null);
  const [sampleToken, setSampleToken] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data: m } = await supabase.from("builder_company_members")
        .select("builder_companies(*)").eq("user_id", user.id).limit(1).maybeSingle();
      const c = (m as any)?.builder_companies;
      setCompany(c);
      if (c) {
        const { data: clone } = await supabase.from("nb_property_clones")
          .select("handoff_token").eq("company_id", c.id).in("status", ["handed_off", "transferred"]).limit(1).maybeSingle();
        setSampleToken(clone?.handoff_token ?? null);
      }
    })();
  }, [user]);

  if (!company) return <div className="min-h-screen bg-background"><Navbar /><div className="container py-8"><p className="text-sm text-muted-foreground">No builder company found.</p></div></div>;

  const profileUrl = `${window.location.origin}/builders/${company.slug}`;
  const sampleUrl = sampleToken ? `${window.location.origin}/home/${sampleToken}` : null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Marketing Toolkit</h1>
          <p className="text-sm text-muted-foreground">Showcase your Orivaz Verified Builder status across your sales channels.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Certification badge */}
          <Card><CardContent className="space-y-3 p-6 text-center">
            <Badge variant="outline" className="bg-amber-500/15 text-amber-700 border-0"><Award className="mr-1.5 h-3.5 w-3.5" />Orivaz {company.certification_level}</Badge>
            <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full border-4 border-primary bg-card">
              <div className="text-center">
                <ShieldCheck className="mx-auto h-8 w-8 text-primary" />
                <p className="mt-1 text-[10px] font-bold uppercase tracking-wider">Orivaz</p>
                <p className="text-[9px] uppercase">Certified</p>
              </div>
            </div>
            <h3 className="font-semibold">{company.name}</h3>
            <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Print badge</Button>
          </CardContent></Card>

          {/* Public profile */}
          <Card><CardContent className="space-y-3 p-6">
            <h3 className="font-semibold">Public Builder Profile</h3>
            <p className="text-xs text-muted-foreground">Share your verified profile with prospects and partners.</p>
            <div className="flex flex-col items-center gap-2">
              <div className="rounded-xl border bg-white p-3"><QRCodeCanvas value={profileUrl} size={140} /></div>
              <p className="break-all rounded bg-muted px-2 py-1 text-[11px]">{profileUrl}</p>
              <Button asChild variant="outline" size="sm"><Link to={`/builders/${company.slug}`}><ExternalLink className="mr-2 h-4 w-4" />View profile</Link></Button>
            </div>
          </CardContent></Card>

          {/* Sample passport for sales office */}
          <Card className="md:col-span-2"><CardContent className="space-y-3 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Sales Office Demo · Sample Digital Home Passport</h3>
                <p className="text-xs text-muted-foreground">Print this QR for model home displays — "Scan to view this home's digital history."</p>
              </div>
              <Share2 className="h-5 w-5 text-muted-foreground" />
            </div>
            {sampleUrl ? (
              <div className="flex flex-wrap items-center gap-6">
                <div className="rounded-xl border bg-white p-3"><QRCodeCanvas value={sampleUrl} size={160} /></div>
                <div className="space-y-1 text-sm">
                  <p className="font-medium">Window decal text</p>
                  <p className="rounded bg-muted px-3 py-2 text-xs italic">"This Home Includes a Orivaz Digital Home Passport"</p>
                  <p className="mt-3 font-medium">Yard sign rider</p>
                  <p className="rounded bg-muted px-3 py-2 text-xs italic">"Orivaz Verified — Lifetime Property History Included"</p>
                  <Button asChild size="sm" variant="outline" className="mt-2"><a href={sampleUrl} target="_blank" rel="noreferrer"><ExternalLink className="mr-2 h-4 w-4" />Preview sample passport</a></Button>
                </div>
              </div>
            ) : <p className="text-sm text-muted-foreground">Hand off your first home to generate a sample QR.</p>}
          </CardContent></Card>

          {/* Closing day script */}
          <Card className="md:col-span-2"><CardContent className="space-y-2 p-6 text-sm">
            <h3 className="font-semibold">Closing Day Welcome Script</h3>
            <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
              <li>Hand the buyer their printed Orivaz QR card.</li>
              <li>Walk them through scanning it — passport loads instantly, no login required.</li>
              <li>Show the Warranty Center color-coded dashboard.</li>
              <li>Demo the AI Home Assistant: "When do I change my HVAC filter?"</li>
              <li>Invite them to claim the home in their Orivaz account to receive maintenance reminders.</li>
            </ol>
          </CardContent></Card>
        </div>
      </div>
    </div>
  );
}
