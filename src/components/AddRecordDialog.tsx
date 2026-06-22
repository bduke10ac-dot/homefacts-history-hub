import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, AppRole } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = ["repair", "maintenance", "warranty", "inspection", "renovation", "other"];
const ALLOWED_MIME = [
  "image/jpeg", "image/png", "image/webp", "image/gif", "image/heic",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const ALLOWED_ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/heic,application/pdf,.doc,.docx";
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

export function AddRecordDialog({ propertyId, onAdded, triggerLabel = "Add record" }: { propertyId: string; onAdded?: () => void; triggerLabel?: string }) {
  const { user, primaryRole } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [category, setCategory] = useState("maintenance");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [perfBy, setPerfBy] = useState("");
  const [cost, setCost] = useState("");
  const [date, setDate] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  const reset = () => { setCategory("maintenance"); setTitle(""); setDesc(""); setPerfBy(""); setCost(""); setDate(""); setFiles([]); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    const { data: rec, error } = await supabase.from("property_records").insert({
      property_id: propertyId, category, title,
      description: desc || null, performed_by: perfBy || null,
      cost: cost ? parseFloat(cost) : null,
      performed_at: date || null,
      submitted_by: user.id,
      submitter_role: (primaryRole ?? "homeowner") as AppRole,
    }).select("id").single();

    if (error || !rec) { setLoading(false); toast.error(error?.message ?? "Failed to add"); return; }

    // Upload files
    for (const file of files) {
      const path = `${user.id}/${rec.id}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("property-files").upload(path, file);
      if (upErr) { toast.error(`Upload failed: ${upErr.message}`); continue; }
      const { data: { publicUrl } } = supabase.storage.from("property-files").getPublicUrl(path);
      await supabase.from("record_attachments").insert({
        record_id: rec.id, file_url: publicUrl, file_name: file.name, file_type: file.type, uploaded_by: user.id,
      });
    }

    setLoading(false);
    toast.success("Record added — pending verification");
    reset(); setOpen(false); onAdded?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />{triggerLabel}</Button></DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Add a record</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Date performed</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          </div>
          <div><Label>Title</Label><Input required placeholder="Roof replacement, HVAC service…" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div><Label>Description</Label><Textarea rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Performed by</Label><Input placeholder="Contractor name" value={perfBy} onChange={(e) => setPerfBy(e.target.value)} /></div>
            <div><Label>Cost (USD)</Label><Input type="number" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} /></div>
          </div>
          <div>
            <Label>Photos / receipts</Label>
            <label className="mt-1 flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed p-4 text-sm text-muted-foreground hover:border-primary/50">
              <Upload className="h-4 w-4" />
              {files.length ? `${files.length} file(s) selected` : "Click to upload (multiple)"}
              <input type="file" multiple className="hidden" onChange={(e) => setFiles(Array.from(e.target.files ?? []))} />
            </label>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save record</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
