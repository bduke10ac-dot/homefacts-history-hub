import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { FileText, ArrowLeft } from "lucide-react";

type Doc = { id: string; doc_type: string; title: string; description: string | null; storage_path: string; source: string; created_at: string };

export default function PropertyVault() {
  const { id } = useParams();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase.from("platform_documents").select("*").eq("property_id", id).order("created_at", { ascending: false });
      setDocs((data ?? []) as Doc[]);
      setLoading(false);
    })();
  }, [id]);

  return (
    <div>
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Link to={`/property/${id}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Back to property</Link>
        <h1 className="mt-3 text-2xl font-bold">Document Vault</h1>
        <p className="text-sm text-muted-foreground">All documents tied to this property.</p>

        <div className="mt-6 space-y-2">
          {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {!loading && docs.length === 0 && <p className="text-sm text-muted-foreground">No documents yet.</p>}
          {docs.map((d) => (
            <div key={d.id} className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-card">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><FileText className="h-5 w-5" /></div>
              <div className="flex-1 min-w-0">
                <p className="font-medium">{d.title}</p>
                <p className="text-xs text-muted-foreground capitalize">{d.doc_type.replace("_"," ")} · {d.source.replace("_"," ")} · {new Date(d.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
