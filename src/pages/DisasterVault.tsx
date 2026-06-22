import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Vault, Plus, Trash2, FileDown, Upload, FileText as FileIcon } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import jsPDF from "jspdf";

const CATEGORIES = ["Home documents","Personal property","Insurance","Legal documents","Financial documents","Emergency contacts","Recovery checklist"];

interface Doc {
  id: string; category: string; subcategory: string | null; title: string;
  file_url: string | null; file_type: string | null;
  value_estimate: number | null; serial_number: string | null; quantity: number | null; notes: string | null;
}

export default function DisasterVault() {
  const { id } = useParams();
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ category: CATEGORIES[0], subcategory: "", title: "", value_estimate: 0, serial_number: "", notes: "" });
  const [uploading, setUploading] = useState(false);
  const [fileUrl, setFileUrl] = useState("");
  const [fileType, setFileType] = useState("");

  const load = async () => {
    if (!id) return;
    const { data } = await supabase.from("disaster_vault_documents").select("*").eq("property_id", id).order("category").order("created_at", { ascending: false });
    setDocs((data ?? []) as Doc[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, [id]);

  const uploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file || !id || !user) return;
    setUploading(true);
    const path = `${user.id}/${id}/vault/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("property-files").upload(path, file);
    if (error) { toast.error(error.message); setUploading(false); return; }
    const { data: pub } = supabase.storage.from("property-files").getPublicUrl(path);
    setFileUrl(pub.publicUrl); setFileType(file.type);
    if (!form.title) setForm({ ...form, title: file.name });
    setUploading(false);
    toast.success("File uploaded");
  };

  const add = async () => {
    if (!id || !user || !form.title) return;
    const { error } = await supabase.from("disaster_vault_documents").insert({
      property_id: id, created_by: user.id,
      category: form.category, subcategory: form.subcategory || null,
      title: form.title, file_url: fileUrl || null, file_type: fileType || null,
      value_estimate: form.value_estimate || null, serial_number: form.serial_number || null, notes: form.notes || null,
    });
    if (error) toast.error(error.message);
    else { toast.success("Added"); setForm({ category: CATEGORIES[0], subcategory: "", title: "", value_estimate: 0, serial_number: "", notes: "" }); setFileUrl(""); setFileType(""); if (fileRef.current) fileRef.current.value = ""; load(); }
  };

  const remove = async (d: string) => { await supabase.from("disaster_vault_documents").delete().eq("id", d); load(); };

  const exportInventory = () => {
    const pdf = new jsPDF();
    pdf.setFontSize(18); pdf.text("Personal Property Inventory", 10, 15);
    pdf.setFontSize(10);
    let y = 25;
    docs.forEach((d) => {
      if (y > 270) { pdf.addPage(); y = 15; }
      pdf.text(`[${d.category}] ${d.title}`, 10, y); y += 5;
      const meta = [d.serial_number && `SN ${d.serial_number}`, d.value_estimate && `$${d.value_estimate}`].filter(Boolean).join(" · ");
      if (meta) { pdf.setTextColor(120); pdf.text(meta, 10, y); pdf.setTextColor(0); y += 5; }
      y += 2;
    });
    pdf.save("personal-inventory.pdf");
  };

  const totalValue = docs.reduce((s, d) => s + (d.value_estimate ?? 0), 0);
  const grouped = CATEGORIES.map((c) => ({ category: c, items: docs.filter((d) => d.category === c) }));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8 space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <Link to={`/property/${id}`} className="text-sm text-muted-foreground hover:text-foreground">← Back to property</Link>
            <h1 className="mt-2 text-3xl font-bold flex items-center gap-2"><Vault className="h-7 w-7 text-primary" />Disaster Recovery Vault</h1>
            <p className="text-muted-foreground">Secure backup of documents, valuables, and personal property — ready for any claim.</p>
          </div>
          <Button onClick={exportInventory}><FileDown className="mr-2 h-4 w-4" />Export inventory PDF</Button>
        </div>

        <Card>
          <CardContent className="py-4 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{docs.length} items · est. value</span>
            <span className="text-2xl font-bold">${totalValue.toLocaleString()}</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Add to vault</CardTitle></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Category</Label>
              <select className="w-full h-10 rounded-md border bg-background px-3 text-sm" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div><Label>Subcategory</Label><Input value={form.subcategory} onChange={(e) => setForm({ ...form, subcategory: e.target.value })} placeholder="Jewelry, Electronics…" /></div>
            <div className="sm:col-span-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>Value estimate ($)</Label><Input type="number" value={form.value_estimate} onChange={(e) => setForm({ ...form, value_estimate: +e.target.value })} /></div>
            <div><Label>Serial #</Label><Input value={form.serial_number} onChange={(e) => setForm({ ...form, serial_number: e.target.value })} /></div>
            <div className="sm:col-span-2"><Label>Notes</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            <div className="sm:col-span-2">
              <Label>Attach file/photo</Label>
              <div className="flex gap-2 items-center">
                <Input ref={fileRef} type="file" onChange={uploadFile} disabled={uploading} />
                {fileUrl && <Badge variant="outline">Attached</Badge>}
              </div>
            </div>
            <div className="sm:col-span-2"><Button onClick={add}><Plus className="mr-2 h-4 w-4" />Add to vault</Button></div>
          </CardContent>
        </Card>

        {loading ? <p>Loading…</p> : grouped.map((g) => g.items.length > 0 && (
          <div key={g.category}>
            <h2 className="text-lg font-semibold mb-2">{g.category}</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {g.items.map((d) => (
                <Card key={d.id}>
                  <CardHeader className="flex flex-row items-start justify-between space-y-0">
                    <div>
                      <CardTitle className="text-base">{d.title}</CardTitle>
                      {d.subcategory && <p className="text-xs text-muted-foreground">{d.subcategory}</p>}
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => remove(d.id)}><Trash2 className="h-4 w-4" /></Button>
                  </CardHeader>
                  <CardContent className="text-sm space-y-1">
                    {d.value_estimate ? <p>Value: ${d.value_estimate.toLocaleString()}</p> : null}
                    {d.serial_number && <p>SN: {d.serial_number}</p>}
                    {d.notes && <p className="text-muted-foreground">{d.notes}</p>}
                    {d.file_url && <a href={d.file_url} target="_blank" rel="noreferrer" className="text-primary text-xs flex items-center gap-1"><FileIcon className="h-3 w-3" />Open file</a>}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
