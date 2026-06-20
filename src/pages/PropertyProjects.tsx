import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { ArrowLeft, Hammer, CheckCircle2, Circle } from "lucide-react";

type Project = { id: string; title: string; description: string | null; project_type: string; status: string; start_date: string | null; target_completion_date: string | null; budget_cents: number | null };
type Milestone = { id: string; project_id: string; title: string; status: string; due_date: string | null; sort_order: number };

const fmt = (c: number | null) => c == null ? "—" : `$${(c / 100).toLocaleString()}`;

export default function PropertyProjects() {
  const { id } = useParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data: ps } = await supabase.from("platform_projects").select("*").eq("property_id", id).order("created_at", { ascending: false });
      const projs = (ps ?? []) as Project[];
      setProjects(projs);
      if (projs.length) {
        const { data: ms } = await supabase.from("platform_project_milestones").select("*").in("project_id", projs.map(p => p.id)).order("sort_order");
        setMilestones((ms ?? []) as Milestone[]);
      }
    })();
  }, [id]);

  return (
    <div>
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Link to={`/property/${id}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Back to property</Link>
        <h1 className="mt-3 text-2xl font-bold">Projects</h1>

        <div className="mt-6 space-y-4">
          {projects.length === 0 && <p className="text-sm text-muted-foreground">No projects yet.</p>}
          {projects.map((p) => (
            <div key={p.id} className="rounded-xl border bg-card p-5 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2"><Hammer className="h-4 w-4 text-primary" /><h3 className="font-semibold">{p.title}</h3></div>
                  {p.description && <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>}
                </div>
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs capitalize">{p.status.replace("_"," ")}</span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
                <div><p className="text-muted-foreground">Type</p><p className="font-medium capitalize">{p.project_type}</p></div>
                <div><p className="text-muted-foreground">Target</p><p className="font-medium">{p.target_completion_date ? new Date(p.target_completion_date).toLocaleDateString() : "—"}</p></div>
                <div><p className="text-muted-foreground">Budget</p><p className="font-medium">{fmt(p.budget_cents)}</p></div>
              </div>
              {milestones.filter(m => m.project_id === p.id).length > 0 && (
                <div className="mt-4 border-t pt-3">
                  <p className="text-xs font-medium mb-2">Milestones</p>
                  <ul className="space-y-1">
                    {milestones.filter(m => m.project_id === p.id).map(m => (
                      <li key={m.id} className="flex items-center gap-2 text-xs">
                        {m.status === "completed" ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> : <Circle className="h-3.5 w-3.5 text-muted-foreground" />}
                        <span>{m.title}</span>
                        {m.due_date && <span className="text-muted-foreground">· due {new Date(m.due_date).toLocaleDateString()}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
