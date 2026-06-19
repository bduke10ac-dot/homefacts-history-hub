import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  propertyId: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

export function PropertyAssistant({ propertyId }: Props) {
  const { session, user } = useAuth();
  const [initial, setInitial] = useState<UIMessage[] | null>(null);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load saved history
  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("property_chat_messages")
        .select("id, role, content, created_at")
        .eq("property_id", propertyId)
        .order("created_at", { ascending: true });
      if (!active) return;
      const ui: UIMessage[] = (data ?? [])
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          parts: [{ type: "text", text: m.content }],
        }));
      setInitial(ui);
    })();
    return () => {
      active = false;
    };
  }, [propertyId]);

  const transport = new DefaultChatTransport({
    api: `${SUPABASE_URL}/functions/v1/property-chat`,
    headers: session?.access_token
      ? { Authorization: `Bearer ${session.access_token}` }
      : undefined,
    body: { propertyId },
  });

  const { messages, sendMessage, status, error } = useChat({
    id: propertyId,
    messages: initial ?? [],
    transport,
    onError: (e) => toast.error(e.message || "Assistant error"),
  });

  useEffect(() => {
    inputRef.current?.focus();
  }, [propertyId, status]);

  if (!user) {
    return (
      <div className="rounded-2xl border bg-card p-6 shadow-card">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="h-4 w-4 text-primary" /> AI Assistant
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in to chat with this home's AI assistant.
        </p>
      </div>
    );
  }

  if (!initial) {
    return (
      <div className="flex items-center justify-center rounded-2xl border bg-card p-6 text-sm text-muted-foreground shadow-card">
        Loading assistant…
      </div>
    );
  }

  const busy = status === "submitted" || status === "streaming";

  const handleSend = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    await sendMessage({ text });
  };

  return (
    <div className="flex flex-col rounded-2xl border bg-card shadow-card">
      <div className="flex items-center gap-2 border-b px-5 py-3">
        <Sparkles className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">AI Assistant</h2>
        <span className="ml-auto text-xs text-muted-foreground">
          Ask about this home's history, risks, or upkeep
        </span>
      </div>

      <div className="max-h-[480px] min-h-[200px] space-y-3 overflow-y-auto px-5 py-4">
        {messages.length === 0 && (
          <div className="text-sm text-muted-foreground">
            Try: "When was the roof last replaced?" or "What maintenance is overdue?"
          </div>
        )}
        {messages.map((m) => {
          const text = m.parts
            .map((p: any) => (p.type === "text" ? p.text : ""))
            .join("");
          return (
            <div
              key={m.id}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                {text || (busy && m.role === "assistant" ? "…" : "")}
              </div>
            </div>
          );
        })}
        {status === "submitted" && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" /> Thinking…
          </div>
        )}
        {error && (
          <div className="text-xs text-destructive">Error: {error.message}</div>
        )}
      </div>

      <div className="border-t p-3">
        <div className="flex items-end gap-2">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask about this property…"
            rows={1}
            className="min-h-[40px] resize-none"
            disabled={busy}
          />
          <Button onClick={handleSend} disabled={busy || !input.trim()} size="icon">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
