import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Bot, User, Sparkles } from "lucide-react";
import { AppData } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Props {
  data: AppData;
}

function buildProfileContext(data: AppData): string {
  const p = data.profile;
  const lines: string[] = [];

  lines.push(`## Student Profile`);
  lines.push(`- Name: ${p.name || 'Not set'}`);
  lines.push(`- Target School: ${p.targetSchool}`);
  lines.push(`- GPA (Weighted): ${p.gpaWeighted || 'Not set'}`);
  lines.push(`- GPA (Unweighted): ${p.gpaUnweighted || 'Not set'}`);
  lines.push(`- SAT Score: ${p.satScore ?? 'Not taken'}`);
  lines.push(`- ACT Score: ${p.actScore ?? 'Not taken'}`);
  lines.push(`- AP Classes: ${p.apClasses.length > 0 ? p.apClasses.join(', ') : 'None listed'}`);

  if (data.projects.length > 0) {
    lines.push(`\n## Projects & Activities (${data.projects.length} total)`);
    data.projects.forEach((proj, i) => {
      lines.push(`\n### ${i + 1}. ${proj.title}`);
      lines.push(`- Category: ${proj.category}`);
      lines.push(`- Description: ${proj.description}`);
      lines.push(`- Impact Level: ${proj.impactLevel}`);
      lines.push(`- Awards: ${proj.awards.length > 0 ? proj.awards.join(', ') : 'None'}`);
      lines.push(`- Metrics: ${proj.metrics || 'None'}`);
      lines.push(`- Duration: ${proj.startDate} to ${proj.isOngoing ? 'Present' : proj.endDate}`);
    });
  } else {
    lines.push(`\n## Projects & Activities: None added yet`);
  }

  if (data.goals.length > 0) {
    lines.push(`\n## Goals (${data.goals.length} total)`);
    data.goals.forEach((g) => {
      lines.push(`- ${g.title} (${g.category}): ${g.currentValue} → ${g.targetValue}, ${g.progress}% complete, deadline: ${g.deadline}`);
    });
  }

  if (data.essays.length > 0) {
    lines.push(`\n## Essays (${data.essays.length} total)`);
    data.essays.forEach((e) => {
      lines.push(`- "${e.title}" (${e.status}, ${e.wordCount} words)`);
    });
  }

  return lines.join('\n');
}

const SUGGESTED_QUESTIONS = [
  "What should I improve most for MIT?",
  "Is my profile competitive?",
  "What kind of spike do I have?",
  "How can I strengthen my activities section?",
];

export default function AIAdvisor({ data }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  async function send(text?: string) {
    const msg = text || input.trim();
    if (!msg || isLoading) return;
    setInput('');
    const userMsg: Message = { role: 'user', content: msg };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsLoading(true);

    const profileContext = buildProfileContext(data);

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-advisor`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: updatedMessages,
            profileContext,
          }),
        }
      );

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Request failed" }));
        toast.error(err.error || "AI request failed");
        setIsLoading(false);
        return;
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantSoFar = "";
      let streamDone = false;

      const upsertAssistant = (content: string) => {
        assistantSoFar = content;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) => i === prev.length - 1 ? { ...m, content } : m);
          }
          return [...prev, { role: "assistant", content }];
        });
      };

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") { streamDone = true; break; }

          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (delta) upsertAssistant(assistantSoFar + delta);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // flush remaining
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (delta) upsertAssistant(assistantSoFar + delta);
          } catch { /* ignore */ }
        }
      }
    } catch (e) {
      console.error("AI Advisor error:", e);
      toast.error("Failed to get AI response. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-7rem)] flex flex-col animate-fade-in">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-foreground">AI Profile Advisor</h1>
        <p className="text-sm text-muted-foreground mt-1">Get strategic advice for your {data.profile.targetSchool} application — powered by AI</p>
      </div>

      <div className="glass-card flex-1 flex flex-col min-h-0 overflow-hidden">
        <div ref={scrollRef} className="flex-1 overflow-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground text-sm">Ask me anything about your application</p>
                <p className="text-xs text-muted-foreground mt-1">I have access to your full profile, projects, goals, and essays</p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 mt-2">
                {SUGGESTED_QUESTIONS.map(q => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    className="px-3 py-1.5 text-xs rounded-lg bg-surface hover:bg-surface-hover text-muted-foreground hover:text-foreground border border-border/50 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : ''}`}
            >
              {m.role === 'assistant' && (
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}
              <div className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-surface text-foreground'
              }`}>
                {m.role === 'assistant' ? (
                  <div className="prose prose-sm prose-invert max-w-none">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap">{m.content}</div>
                )}
              </div>
              {m.role === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4 text-secondary-foreground" />
                </div>
              )}
            </motion.div>
          ))}
          {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="bg-surface rounded-xl px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse" />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            </motion.div>
          )}
        </div>

        <div className="p-3 border-t border-border/50">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={`Ask about your ${data.profile.targetSchool} application...`}
              className="min-h-[40px] max-h-[120px] text-sm resize-none bg-surface"
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            />
            <Button size="icon" onClick={() => send()} disabled={isLoading || !input.trim()} className="shrink-0 h-10 w-10">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
