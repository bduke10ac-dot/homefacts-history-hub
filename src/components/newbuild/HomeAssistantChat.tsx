import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Send } from "lucide-react";
import ReactMarkdown from "react-markdown";

export function HomeAssistantChat({ token }: { token: string }) {
  const [input, setInput] = useState("");
  const transport = new DefaultChatTransport({
    api: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/home-assistant`,
    headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
    body: { token },
  });
  const { messages, sendMessage, status } = useChat({ transport });
  const busy = status === "submitted" || status === "streaming";

  const send = async () => {
    const t = input.trim();
    if (!t || busy) return;
    setInput("");
    await sendMessage({ text: t });
  };

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium">
        <Sparkles className="h-4 w-4 text-primary" />Ask the AI Home Assistant
      </div>
      <div className="mb-3 max-h-[420px] space-y-3 overflow-y-auto">
        {!messages.length && (
          <p className="text-xs text-muted-foreground">
            Try: "When does my roof warranty expire?", "How do I shut off the main water?", or "Who do I call for an HVAC issue?"
          </p>
        )}
        {messages.map((m) => {
          const text = m.parts.map((p: any) => (p.type === "text" ? p.text : "")).join("");
          return (
            <div key={m.id} className={`rounded-lg p-3 text-sm ${m.role === "user" ? "bg-primary/10" : "bg-muted"}`}>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {m.role === "user" ? "You" : "Assistant"}
              </p>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown>{text}</ReactMarkdown>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about warranties, maintenance, contacts…"
          onKeyDown={(e) => e.key === "Enter" && send()}
          disabled={busy}
        />
        <Button onClick={send} disabled={busy} size="icon"><Send className="h-4 w-4" /></Button>
      </div>
    </Card>
  );
}
