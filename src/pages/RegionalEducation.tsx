import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin } from "lucide-react";

const SOUTH = ["TX","LA","MS","AL","GA","FL","SC","NC","TN","AR","OK"];
const NORTH = ["ME","VT","NH","MA","CT","RI","NY","PA","NJ","OH","MI","WI","MN","IL","IN","ND","SD"];
const WEST = ["CA","OR","WA","NV","AZ","UT","CO","NM","ID","MT","WY","AK","HI"];

const CONTENT: Record<string, { topic: string; inspection: string; insurance: string; education: string }[]> = {
  South: [
    { topic: "Termite risk", inspection: "Annual termite inspection", insurance: "Most policies exclude termite damage", education: "High humidity accelerates wood-destroying organisms." },
    { topic: "Hurricane prep", inspection: "Wind-mitigation inspection", insurance: "Wind/hail deductible separate", education: "Document pre-storm condition with photos every year." },
    { topic: "HVAC strain", inspection: "Bi-annual HVAC service", insurance: "Mechanical breakdown often optional", education: "Constant cooling demand shortens compressor life." },
    { topic: "Flood zones", inspection: "Confirm FEMA flood zone", insurance: "Standard policies exclude flood", education: "Consider NFIP or private flood coverage." },
  ],
  North: [
    { topic: "Ice dams", inspection: "Roof and attic ventilation inspection", insurance: "Ice-dam damage may be limited", education: "Adequate insulation prevents melt-and-refreeze cycles." },
    { topic: "Boilers", inspection: "Annual boiler service", insurance: "Mechanical breakdown rider", education: "Bleed radiators annually; check pressure monthly." },
    { topic: "Snow load", inspection: "Structural snow-load review for older homes", insurance: "Collapse coverage check", education: "Heavy wet snow exceeds typical load limits." },
    { topic: "Freeze risk", inspection: "Insulate pipes, install freeze sensors", insurance: "Water damage may exclude freeze if heat off", education: "Keep heat above 55°F when away." },
  ],
  West: [
    { topic: "Wildfire", inspection: "Defensible space audit", insurance: "Many carriers restrict in WUI zones", education: "Clear 30 ft of vegetation; ember-resistant vents." },
    { topic: "Earthquake", inspection: "Foundation bolting review", insurance: "Separate earthquake policy", education: "Strap water heater; secure tall furniture." },
    { topic: "Drought", inspection: "Drip irrigation audit", insurance: "Water restrictions affect landscaping coverage", education: "Mulch deeply; convert lawn to xeriscape." },
    { topic: "Solar", inspection: "Annual solar production check", insurance: "Notify carrier of solar install", education: "Track inverter warranties; clean panels yearly." },
  ],
  Midwest: [
    { topic: "Tornadoes", inspection: "Safe-room or basement shelter check", insurance: "Wind damage typically covered", education: "Practice family shelter plan." },
    { topic: "Hail", inspection: "Roof inspection after each season", insurance: "Hail can have separate deductible", education: "Impact-resistant shingles may earn premium discounts." },
    { topic: "Sump pumps", inspection: "Test pump and backup quarterly", insurance: "Water/sewer backup rider", education: "Battery backup pumps prevent basement flooding." },
    { topic: "Freeze/thaw", inspection: "Foundation crack monitoring", insurance: "Foundation movement often excluded", education: "Maintain grading away from foundation." },
  ],
};

function regionFor(state?: string | null) {
  const s = (state || "").toUpperCase();
  if (SOUTH.includes(s)) return "South";
  if (NORTH.includes(s)) return "North";
  if (WEST.includes(s)) return "West";
  return "Midwest";
}

export default function RegionalEducation() {
  const { id } = useParams();
  const [region, setRegion] = useState<string>("Midwest");
  const [state, setState] = useState<string>("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("properties").select("state").eq("id", id).maybeSingle();
      setState(data?.state ?? "");
      setRegion(regionFor(data?.state));
    })();
  }, [id]);

  const items = CONTENT[region] ?? [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container space-y-6 py-10">
        <Link to={`/property/${id}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="mr-1 h-4 w-4" />Back</Link>
        <div>
          <h1 className="text-3xl font-bold">Regional Home Education</h1>
          <p className="text-muted-foreground flex items-center gap-2"><MapPin className="h-4 w-4" />Detected region: <Badge>{region}</Badge> {state && <span>· {state}</span>}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((it) => (
            <Card key={it.topic}>
              <CardHeader><CardTitle className="text-base">{it.topic}</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>{it.education}</p>
                <div className="rounded-md border bg-muted/30 p-2"><span className="font-medium">Recommended inspection:</span> {it.inspection}</div>
                <div className="rounded-md border bg-muted/30 p-2"><span className="font-medium">Insurance note:</span> {it.insurance}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
