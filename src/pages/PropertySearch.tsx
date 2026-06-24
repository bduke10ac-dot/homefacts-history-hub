import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Plus, MapPin, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

interface Property {
  id: string; address_line: string; city: string; state: string; zip: string;
  year_built: number | null; bedrooms: number | null;
}

const PropertySearch = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Property[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  // add property form
  const [addr, setAddr] = useState(""); const [city, setCity] = useState(""); const [state, setState] = useState(""); const [zip, setZip] = useState("");
  const [year, setYear] = useState(""); const [sqft, setSqft] = useState(""); const [bed, setBed] = useState(""); const [bath, setBath] = useState(""); const [type, setType] = useState("");

  const search = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true); setSearched(true);
    const term = q.trim();
    let query = supabase.from("properties").select("id,address_line,city,state,zip,year_built,bedrooms").limit(20);
    if (term) {
      query = query.or(`address_line.ilike.%${term}%,city.ilike.%${term}%,zip.ilike.%${term}%`);
    }
    const { data, error } = await query;
    if (error) toast.error(error.message);
    setResults(data ?? []); setLoading(false);
  };

  useEffect(() => { search(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { navigate("/auth"); return; }
    const { data, error } = await supabase.from("properties").insert({
      address_line: addr, city, state: state.toUpperCase(), zip,
      year_built: year ? parseInt(year) : null,
      square_feet: sqft ? parseInt(sqft) : null,
      bedrooms: bed ? parseInt(bed) : null,
      bathrooms: bath ? parseFloat(bath) : null,
      property_type: type || null,
      created_by: user.id,
      claimed_by: user.id,
    }).select("id").single();
    if (error) { toast.error(error.message); return; }
    toast.success("Property added");
    setOpen(false);
    navigate(`/property/${data.id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="bg-gradient-hero py-14">
        <div className="container">
          <h1 className="text-3xl font-bold text-primary-foreground md:text-4xl">Find a home's story</h1>
          <p className="mt-2 text-primary-foreground/80">Search by address, city, or ZIP.</p>
          <form onSubmit={search} className="mt-6 flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="123 Main St, Austin, 78701…" className="h-12 pl-10 text-base" />
            </div>
            <Button type="submit" size="lg" variant="secondary" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}</Button>
          </form>
        </div>
      </section>

      <section className="container py-10">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{searched ? `${results.length} ${results.length === 1 ? "result" : "results"}` : "Recent properties"}</h2>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Add property</Button></DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Add a property</DialogTitle></DialogHeader>
              <form onSubmit={handleAdd} className="space-y-3">
                <div><Label>Street address</Label><Input required value={addr} onChange={(e) => setAddr(e.target.value)} /></div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2"><Label>City</Label><Input required value={city} onChange={(e) => setCity(e.target.value)} /></div>
                  <div><Label>State</Label><Input required maxLength={2} value={state} onChange={(e) => setState(e.target.value)} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>ZIP</Label><Input required value={zip} onChange={(e) => setZip(e.target.value)} /></div>
                  <div><Label>Year built</Label><Input type="number" value={year} onChange={(e) => setYear(e.target.value)} /></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label>Sq ft</Label><Input type="number" value={sqft} onChange={(e) => setSqft(e.target.value)} /></div>
                  <div><Label>Beds</Label><Input type="number" value={bed} onChange={(e) => setBed(e.target.value)} /></div>
                  <div><Label>Baths</Label><Input type="number" step="0.5" value={bath} onChange={(e) => setBath(e.target.value)} /></div>
                </div>
                <div><Label>Property type</Label><Input placeholder="Single family, condo…" value={type} onChange={(e) => setType(e.target.value)} /></div>
                <DialogFooter><Button type="submit">Create property</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mt-6 grid gap-3">
          {loading && <div className="py-12 text-center text-muted-foreground"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>}
          {!loading && results.length === 0 && (
            <div className="rounded-xl border-2 border-dashed p-12 text-center">
              <MapPin className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 font-medium">No properties found</p>
              <p className="mt-1 text-sm text-muted-foreground">Be the first — add this property to start its history.</p>
            </div>
          )}
          {results.map((p) => (
            <Link key={p.id} to={`/property/${p.id}`} className="group flex items-center justify-between rounded-xl border bg-card p-5 shadow-card transition-all hover:border-primary/40 hover:shadow-elevated">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary"><MapPin className="h-5 w-5" /></div>
                <div>
                  <p className="font-semibold group-hover:text-primary">{p.address_line}</p>
                  <p className="text-sm text-muted-foreground">{p.city}, {p.state} {p.zip}</p>
                </div>
              </div>
              <div className="hidden text-right text-sm text-muted-foreground sm:block">
                {p.year_built && <p>Built {p.year_built}</p>}
                {p.bedrooms && <p>{p.bedrooms} bed</p>}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

export default PropertySearch;
