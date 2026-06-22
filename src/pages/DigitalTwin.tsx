import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Boxes, Plus, Trash2, Home } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface Room {
  id: string; room_name: string; room_type: string | null; floor: string | null;
  square_feet: number | null; condition: string | null; notes: string | null; photo_url: string | null;
}

const conditionColor = (c: string | null) =>
  c === "excellent" ? "bg-emerald-500/15 text-emerald-700"
  : c === "good" ? "bg-blue-500/15 text-blue-700"
  : c === "fair" ? "bg-amber-500/15 text-amber-700"
  : c === "poor" ? "bg-red-500/15 text-red-700"
  : "bg-muted text-muted-foreground";

export default function DigitalTwin() {
  const { id } = useParams();
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [form, setForm] = useState({ room_name: "", room_type: "bedroom", floor: "1", square_feet: 150, condition: "good", notes: "", photo_url: "" });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!id) return;
    const { data } = await supabase.from("digital_twin_rooms").select("*").eq("property_id", id).order("floor").order("room_name");
    setRooms((data ?? []) as Room[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, [id]);

  const add = async () => {
    if (!id || !user || !form.room_name) return;
    const { error } = await supabase.from("digital_twin_rooms").insert({ property_id: id, created_by: user.id, ...form });
    if (error) toast.error(error.message);
    else { toast.success("Room added"); setForm({ room_name: "", room_type: "bedroom", floor: "1", square_feet: 150, condition: "good", notes: "", photo_url: "" }); load(); }
  };

  const remove = async (rid: string) => { await supabase.from("digital_twin_rooms").delete().eq("id", rid); load(); };

  const totalSqft = rooms.reduce((s, r) => s + (r.square_feet ?? 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8 space-y-6">
        <div>
          <Link to={`/property/${id}`} className="text-sm text-muted-foreground hover:text-foreground">← Back to property</Link>
          <h1 className="mt-2 text-3xl font-bold flex items-center gap-2"><Boxes className="h-7 w-7 text-primary" />Digital Twin</h1>
          <p className="text-muted-foreground">A room-by-room map of your home with condition, features, and photos.</p>
        </div>

        <Card>
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-2"><Home className="h-5 w-5 text-primary" /><span className="font-medium">{rooms.length} rooms</span></div>
            <div className="text-sm text-muted-foreground">{totalSqft.toLocaleString()} sq ft documented</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Add room</CardTitle></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div><Label>Name</Label><Input value={form.room_name} onChange={(e) => setForm({ ...form, room_name: e.target.value })} placeholder="Master bedroom" /></div>
            <div>
              <Label>Type</Label>
              <Select value={form.room_type} onValueChange={(v) => setForm({ ...form, room_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["bedroom","bathroom","kitchen","living","dining","office","garage","basement","attic","laundry","outdoor","other"].map((t) =>
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Floor</Label><Input value={form.floor} onChange={(e) => setForm({ ...form, floor: e.target.value })} /></div>
            <div><Label>Square feet</Label><Input type="number" value={form.square_feet} onChange={(e) => setForm({ ...form, square_feet: +e.target.value })} /></div>
            <div>
              <Label>Condition</Label>
              <Select value={form.condition} onValueChange={(v) => setForm({ ...form, condition: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["excellent","good","fair","poor"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Photo URL</Label><Input value={form.photo_url} onChange={(e) => setForm({ ...form, photo_url: e.target.value })} /></div>
            <div className="sm:col-span-2"><Label>Notes / features</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            <div className="sm:col-span-2"><Button onClick={add}><Plus className="mr-2 h-4 w-4" />Add room</Button></div>
          </CardContent>
        </Card>

        {loading ? <p className="text-muted-foreground">Loading…</p> : rooms.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No rooms documented yet.</CardContent></Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {rooms.map((r) => (
              <Card key={r.id} className="overflow-hidden">
                {r.photo_url && <img src={r.photo_url} alt={r.room_name} className="h-40 w-full object-cover" />}
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <div>
                    <CardTitle className="text-base">{r.room_name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{r.room_type} · floor {r.floor ?? "—"}</p>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4" /></Button>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{r.square_feet ?? "—"} sq ft</span>
                    <Badge variant="outline" className={conditionColor(r.condition)}>{r.condition ?? "—"}</Badge>
                  </div>
                  {r.notes && <p className="text-muted-foreground">{r.notes}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
