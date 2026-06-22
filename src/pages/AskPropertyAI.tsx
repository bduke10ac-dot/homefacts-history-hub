import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Sparkles, Send } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const SUGGESTIONS = [
  "What air filter size do I need?",
  "When was my roof replaced?",
  "Who installed my HVAC?",
  "Is my water heater under warranty?",
  "Where is my main water shutoff?",
  "What repairs are overdue?",
  "What should I fix first?",
  "What documents are missing?",
];

interface QA { id: string; question: string; answer: string | null; confidence: string | null; created_at: string; }

export default function AskPropertyAI() {
  const { id } = useParams();
  const { user } = useAuth();
  const [history, setHistory] = useState<QA[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!id) return;
    const { data } = await supabase.from("ai_assistant_queries").select("*").eq("property_id", id).order("created_at", { ascending: false }).limit(20);
    setHistory((data ?? []) as QA[]);
  };
  useEffect(() => { load(); }, [id]);

  const ask = async (question: string) => {
    if (!id || !user) { toast.error("Sign in to ask the AI"); return; }
    if (!question.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ask-property-ai", { body: { property_id: id, question } });
      if (error) throw error;
      await supabase.from("ai_assistant_queries").insert({
        property_id: id, user_id: user.id, question, answer: data.answer, confidence: data.confidence, sources: data.sources ?? [],
      });
      setQ("");
      load();
    } catch (e: any) {
      toast.error(e.message ?? "AI request failed");
    } finally {
      setLoading(false);
    }
  };

  const confidenceColor = (c: string | null) => c === "High" ? "text-accent" : c === "Medium" ? "text-primary" : "text-muted-foreground";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container space-y-6 py-10 max-w-3xl">
        <Link to={`/property/${id}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to property
        </Link>
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold"><Sparkles className="h-6 w-6 text-primary" />Ask HomeFacts AI</h1>
          <p className="text-muted-foreground">Answers grounded only in this property's verified records and public data.</p>
        </div>

        <Card>
          <CardContent className="space-y-3 p-4">
            <div className="flex gap-2">
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask anything about this home…" onKeyDown={(e) => e.key === "Enter" && ask(q)} />
              <Button onClick={() => ask(q)} disabled={loading}><Send className="h-4 w-4" /></Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <Button key={s} size="sm" variant="outline" onClick={() => ask(s)} disabled={loading}>{s}</Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {history.map((h) => (
            <Card key={h.id}>
              <CardContent className="space-y-2 p-4">
                <p className="font-medium">Q: {h.question}</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{h.answer}</p>
                {h.confidence && <Badge variant="outline" className={confidenceColor(h.confidence)}>{h.confidence} confidence</Badge>}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
