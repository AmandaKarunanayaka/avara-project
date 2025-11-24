// src/components/AvaraAssistant.tsx
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type AvaraAssistantProps = {
  service: "research";
  projectId: string;
  clarifyingQuestions?: string[];
  onDocUpdated?: (doc: any) => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  triggerMessage?: string;
};

const getToken = () => localStorage.getItem("token") || "";

export default function AvaraAssistant({
  service,
  projectId,
  clarifyingQuestions = [],
  onDocUpdated,
  isOpen,
  onOpenChange,
  triggerMessage,
}: AvaraAssistantProps) {
  const [internalOpen, setInternalOpen] = useState(true);
  const open = isOpen !== undefined ? isOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement | null>(null);



  useEffect(() => {
    if (clarifyingQuestions.length > 0 && messages.length === 0) {
      const intro: Message = {
        id: "intro",
        role: "assistant",
        content:
          "I’ve spotted a few things we can clarify to make this research sharper. You can start by answering any of these:",
      };
      const qs: Message = {
        id: "qs",
        role: "assistant",
        content: clarifyingQuestions.map((q) => `• ${q}`).join("\n"),
      };
      setMessages([intro, qs]);
    }
  }, [clarifyingQuestions, messages.length]);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, streamingId]);

  const handleSend = async (msgOverride?: string) => {
    const trimmed = (typeof msgOverride === "string" ? msgOverride : input).trim();
    if (!trimmed || sending) return;
    if (!projectId) {
      alert("Missing projectId in assistant.");
      return;
    }

    const token = getToken();
    if (!token) {
      alert("Please login first.");
      return;
    }

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    try {
      const res = await fetch(
        `http://localhost:3008/chat/${service}/${projectId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ message: trimmed }),
        }
      );

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();

      if (onDocUpdated && data.doc) {
        onDocUpdated(data.doc);
      }

      const fullReply: string =
        typeof data.reply === "string"
          ? data.reply
          : "Got it – I’ve updated your research pack.";

      const assistantId = crypto.randomUUID();
      const newAssistant: Message = {
        id: assistantId,
        role: "assistant",
        content: "",
      };

      setMessages((prev) => [...prev, newAssistant]);
      setStreamingId(assistantId);

      let i = 0;
      const interval = setInterval(() => {
        i++;
        const content = fullReply.slice(0, i);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content } : m
          )
        );
        if (i >= fullReply.length) {
          clearInterval(interval);
          setStreamingId(null);
          setSending(false);
        }
      }, 15);
    } catch (e) {
      console.error("AvaraAssistant send error:", e);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            "Hmm, something went wrong talking to the brain. Try again in a bit.",
        },
      ]);
      setSending(false);
      setStreamingId(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle trigger message (must be after handleSend is defined)
  useEffect(() => {
    if (triggerMessage && !sending) {
      handleSend(triggerMessage);
    }
  }, [triggerMessage]);

  return (
    <>
      {/* FAB toggle button */}
      <motion.button
        className={cn(
          "fixed bottom-5 right-5 z-[90] rounded-full shadow-lg border border-white/10 bg-black/70 px-4 py-2 flex items-center gap-2 text-xs text-white/90 backdrop-blur-md",
          open && "hidden md:flex"
        )}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => setOpen(true)}
      >
        <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
        Avara Assistant
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed bottom-4 right-4 z-[100] w-[350px] max-h-[70vh] rounded-2xl border border-white/15 bg-[#050509]/95 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden"
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.18 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-gradient-to-r from-emerald-500/15 via-cyan-500/10 to-emerald-500/20">
              <div>
                <p className="text-xs font-semibold text-white">
                  Avara Assistant
                </p>
                <p className="text-[10px] text-white/60">
                  Co-founder mode · research & strategy
                </p>
              </div>
              <button
                className="text-white/60 hover:text-white text-xs px-2 py-1 rounded-full bg-white/5"
                onClick={() => setOpen(false)}
              >
                ✕
              </button>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-3 py-3 space-y-3 text-xs"
            >
              {messages.length === 0 && (
                <div className="text-[11px] text-white/60">
                  Ask me to tighten your problem, reframe personas, or adjust
                  GTM. I’ll also update the research cards for you.
                </div>
              )}

              {messages.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    "flex",
                    m.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-3 py-2 whitespace-pre-wrap leading-relaxed",
                      m.role === "user"
                        ? "bg-emerald-500 text-black text-[11px]"
                        : "bg-white/5 text-white/90 text-[11px] border border-white/10"
                    )}
                  >
                    {m.content}
                  </div>
                </div>
              ))}

              {streamingId && (
                <div className="flex items-center gap-1 text-[10px] text-white/50 mt-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  Avara is thinking…
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-white/10 px-3 py-2 bg-black/60">
              <Textarea
                rows={2}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="resize-none text-xs bg-black/60 border-white/20 focus-visible:ring-emerald-500/60"
                placeholder="Ask anything about your problem, personas, or GTM…"
              />
              <div className="flex justify-end mt-2">
                <Button
                  size="sm"
                  className="rounded-full text-[11px] px-3 py-1"
                  disabled={sending || !input.trim()}
                  onClick={() => handleSend()}
                >
                  {sending ? "Sending…" : "Send"}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
