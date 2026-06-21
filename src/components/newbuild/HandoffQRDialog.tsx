import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QRCodeCanvas } from "qrcode.react";
import { QrCode, Copy } from "lucide-react";
import { toast } from "sonner";

export function HandoffQRDialog({ handoffToken, label }: { handoffToken: string; label?: string }) {
  const url = `${window.location.origin}/home/${handoffToken}`;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><QrCode className="mr-2 h-4 w-4" />Handoff QR</Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Homeowner handoff</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-xl border bg-white p-4">
            <QRCodeCanvas value={url} size={208} includeMargin />
          </div>
          {label && <p className="text-sm font-medium">{label}</p>}
          <p className="break-all rounded-md bg-muted p-2 text-center text-xs">{url}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { navigator.clipboard.writeText(url); toast.success("Link copied"); }}
          >
            <Copy className="mr-2 h-4 w-4" />Copy link
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
