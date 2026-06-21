import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy } from "lucide-react";

export function BulkCloneDialog({ templateId, onDone }: { templateId: string; onDone?: () => void }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async () => {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) {
      toast.error("Add at least one lot or address (one per line).");
      return;
    }
    const specs = lines.map((line) => {
      // Format: "Lot 14 | 123 Maple St | Austin | TX | 78701"  OR just a lot number
      const parts = line.split("|").map((p) => p.trim());
      return {
        lot_number: parts[0] ?? null,
        address_line: parts[1] ?? null,
        city: parts[2] ?? null,
        state: parts[3] ?? null,
        zip: parts[4] ?? null,
        status: "draft",
      };
    });
    setBusy(true);
    const { error } = await supabase.rpc("nb_clone_template" as any, {
      _template_id: templateId,
      _lot_specs: specs as any,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Created ${specs.length} home record${specs.length === 1 ? "" : "s"}`);
    setOpen(false);
    setText("");
    onDone?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Copy className="mr-2 h-4 w-4" />Clone for lots</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Bulk clone to lots</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label>One lot per line</Label>
          <p className="text-xs text-muted-foreground">
            Format: <code className="rounded bg-muted px-1">Lot # | Address | City | State | Zip</code> (only Lot # is required)
          </p>
          <Textarea
            rows={8}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={"Lot 14 | 123 Maple St | Austin | TX | 78701\nLot 15 | 125 Maple St | Austin | TX | 78701"}
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={run} disabled={busy}>{busy ? "Cloning…" : "Clone"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
