import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Award, CheckCircle2, Circle } from "lucide-react";
import { toast } from "sonner";

const TIERS = ["none","bronze","silver","gold","platinum"] as const;
const tierColor: Record<string, string> = { none: "outline", bronze: "secondary", silver: "secondary", gold: "default", platinum: "default" };

const CRITERIA = [
  ["ownership_verified","Ownership data is verified"],
  ["documents_uploaded","Major documents uploaded"],
  ["contractors_verified","Contractors verified"],
  ["permits_matched","Permits matched"],
  ["warranties_verified","Warranties verified"],
  ["maintenance_current","Maintenance current"],
  ["insurance_reviewed","Insurance readiness reviewed"],
  ["ai_reviewed","AI has reviewed the property file"],
  ["photos_attached","Photos attached"],
  ["safety_checklist_done","Safety checklist completed"],
];

export default function Certification() {
  const { id } = useParams();
  const [row, setRow] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("certification_status").select("*").eq("property_id", id).maybeSingle();
    setRow(data);
  };
  useEffect(() => { load(); }, [id]);

  const apply = async () => {
    setLoading(true);
    const { error } = await supabase.functions.invoke("compute-certification", { body: { property_id: id } });
    if (error) toast.error(error.message); else { toast.success("Certification evaluated"); load(); }
    setLoading(false);
  };

  const tier = row?.tier ?? "none";
  const met = row?.criteria_met ?? {};

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container space-y-6 py-10">
        <Link to={`/property/${id}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="mr-1 h-4 w-4" />Back</Link>
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold">HomeFacts Certified™</h1>
            <p className="text-muted-foreground">Earn Bronze, Silver, Gold or Platinum certification.</p>
          </div>
          <Button onClick={apply} disabled={loading}><Award className="mr-2 h-4 w-4" />Apply for Certified</Button>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-10 md:flex-row md:justify-between">
            <div className="flex items-center gap-4">
              <Award className="h-16 w-16 text-primary" />
              <div>
                <div className="text-sm text-muted-foreground">Current tier</div>
                <Badge variant={tierColor[tier] as any} className="text-2xl uppercase">{tier}</Badge>
              </div>
            </div>
            <div className="flex gap-2">
              {TIERS.slice(1).map((t) => (
                <div key={t} className={`rounded-md border px-3 py-2 text-center text-xs ${tier === t ? "bg-primary text-primary-foreground" : ""}`}>
                  <div className="font-medium uppercase">{t}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Criteria</CardTitle></CardHeader>
          <CardContent className="grid gap-2 md:grid-cols-2">
            {CRITERIA.map(([k, l]) => (
              <div key={k} className="flex items-center gap-2 text-sm">
                {met[k] ? <CheckCircle2 className="h-4 w-4 text-accent" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                {l}
              </div>
            ))}
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground">Bronze requires 3+ criteria, Silver 5+, Gold 7+, Platinum 9+.</p>
      </div>
    </div>
  );
}
