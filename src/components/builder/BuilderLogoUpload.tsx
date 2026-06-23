import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Upload, Image as ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  companyId: string;
  currentUrl?: string | null;
  onUpdated?: (url: string) => void;
  size?: number;
  editable?: boolean;
}

export function BuilderLogoUpload({ companyId, currentUrl, onUpdated, size = 96, editable = true }: Props) {
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const onPick = async (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Please choose an image"); return; }
    setBusy(true);
    try {
      const ext = file.name.split(".").pop() ?? "png";
      const path = `${companyId}/logo-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("builder-logos").upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data: signed, error: sErr } = await supabase.storage.from("builder-logos").createSignedUrl(path, 60 * 60 * 24 * 365);
      if (sErr || !signed?.signedUrl) throw sErr ?? new Error("Could not sign URL");
      const url = signed.signedUrl;
      const { error: dbErr } = await supabase.from("builder_companies").update({ logo_url: url }).eq("id", companyId);
      if (dbErr) throw dbErr;
      toast.success("Logo updated");
      onUpdated?.(url);
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <div
        className="flex shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted"
        style={{ width: size, height: size }}
      >
        {currentUrl ? (
          <img src={currentUrl} alt="Builder logo" className="h-full w-full object-contain" />
        ) : (
          <ImageIcon className="h-8 w-8 text-muted-foreground" />
        )}
      </div>
      {editable && (
        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && onPick(e.target.files[0])}
          />
          <Button type="button" size="sm" variant="outline" onClick={() => inputRef.current?.click()} disabled={busy}>
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            {currentUrl ? "Replace logo" : "Upload logo"}
          </Button>
          <p className="mt-1 text-xs text-muted-foreground">PNG or SVG, square works best.</p>
        </div>
      )}
    </div>
  );
}
