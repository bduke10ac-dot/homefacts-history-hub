// Phase 3 — PropertyAssistant placeholder. Chat-style UI, no real AI call.
import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Bot, User } from "lucide-react";

const EXAMPLES = [
  "How old is my roof?",
  "When does my HVAC warranty expire?",
  "What maintenance is due this month?",
  "Who was my last contractor?",
  "What documents am I missing?",
];

const PLACEHOLDER_REPLY =
  "Orivaz Assistant will use your uploaded documents, warranties, photos, and records to answer this once AI document search is connected.";

interface Msg { role: "user" | "assistant"; text: string }

export function PropertyAssistant() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const submit = (text: string) => {
    const t = text.trim();
    if (!t) return;
    setMessages((m) => [...m, { role: "user", text: t }, { role: "assistant", text: PLACEHOLDER_REPLY }]);
    setInput("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5" /> Property Assistant</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div ref={scrollerRef} className="max-h-80 min-h-40 overflow-y-auto rounded-lg border bg-muted/20 p-3 space-y-3">
          {messages.length === 0 ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Try one of these:</p>
              <div className="flex flex-wrap gap-2">
                {EXAMPLES.map((ex) => (
                  <button key={ex} onClick={() => submit(ex)}
                    className="rounded-full border bg-background px-3 py-1 text-xs hover:bg-muted">
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "assistant" && (
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Bot className="h-4 w-4" />
                  </div>
                )}
                <div className={
                  m.role === "user"
                    ? "rounded-2xl rounded-tr-sm bg-primary px-3 py-2 text-sm text-primary-foreground max-w-[80%]"
                    : "text-sm text-foreground max-w-[80%]"
                }>
                  {m.text}
                </div>
                {m.role === "user" && (
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); submit(input); }} className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(input); } }}
            rows={1}
            placeholder="Ask about this property…"
            className="min-h-10 resize-none"
          />
          <Button type="submit" size="icon" disabled={!input.trim()}><Send className="h-4 w-4" /></Button>
        </form>
        <p className="text-[10px] text-muted-foreground">Placeholder — AI document search not yet connected.</p>
      </CardContent>
    </Card>
  );
}
