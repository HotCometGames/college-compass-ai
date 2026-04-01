import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Edit2, FileText, Clock, CheckCircle, AlertCircle, Send, Bot, Sparkles } from "lucide-react";
import { Essay, generateId } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

const STATUS_STYLES: Record<string, { icon: typeof Clock; class: string }> = {
  draft: { icon: Edit2, class: 'bg-muted text-muted-foreground' },
  reviewing: { icon: AlertCircle, class: 'bg-warning/10 text-warning' },
  final: { icon: CheckCircle, class: 'bg-success/10 text-success' },
};

interface CowriterMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface Props {
  essays: Essay[];
  setEssays: (e: Essay[]) => void;
}

function emptyEssay(): Essay {
  return { id: generateId(), title: '', prompt: '', content: '', wordCount: 0, lastModified: new Date().toISOString(), status: 'draft' };
}

const QUICK_PROMPTS = [
  "How can I make this more personal?",
  "Does this answer the prompt well?",
  "Suggest a stronger opening",
  "How can I show instead of tell?",
];

export default function EssayHelper({ essays, setEssays }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [cowriterMessages, setCowriterMessages] = useState<CowriterMessage[]>([]);
  const [cowriterInput, setCowriterInput] = useState('');
  const [isCowriterLoading, setIsCowriterLoading] = useState(false);
  const [showCowriter, setShowCowriter] = useState(false);
  const cowriterScrollRef = useRef<HTMLDivElement>(null);

  const activeEssay = essays.find(e => e.id === activeId);

  useEffect(() => {
    cowriterScrollRef.current?.scrollTo({ top: cowriterScrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [cowriterMessages]);

  // Reset cowriter when switching essays
  useEffect(() => {
    setCowriterMessages([]);
    setCowriterInput('');
  }, [activeId]);

  function addEssay() {
    const essay = emptyEssay();
    setEssays([...essays, essay]);
    setActiveId(essay.id);
  }

  function updateEssay(id: string, updates: Partial<Essay>) {
    setEssays(essays.map(e => e.id === id ? {
      ...e,
      ...updates,
      wordCount: (updates.content ?? e.content).split(/\s+/).filter(Boolean).length,
      lastModified: new Date().toISOString(),
    } : e));
  }

  function remove(id: string) {
    setEssays(essays.filter(e => e.id !== id));
    if (activeId === id) setActiveId(null);
  }

  async function sendToCowriter(text?: string) {
    if (!activeEssay) return;
    const msg = text || cowriterInput.trim();
    if (!msg || isCowriterLoading) return;
    setCowriterInput('');
    setShowCowriter(true);

    const userMsg: CowriterMessage = { role: 'user', content: msg };
    const updated = [...cowriterMessages, userMsg];
    setCowriterMessages(updated);
    setIsCowriterLoading(true);

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/essay-cowriter`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            essayContent: activeEssay.content,
            essayPrompt: activeEssay.prompt,
            essayTitle: activeEssay.title,
            userMessage: msg,
          }),
        }
      );

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Request failed" }));
        toast.error(err.error || "AI request failed");
        setIsCowriterLoading(false);
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
        setCowriterMessages(prev => {
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
      console.error("Essay cowriter error:", e);
      toast.error("Failed to get AI response. Please try again.");
    } finally {
      setIsCowriterLoading(false);
    }
  }

  function getQuickFeedback(content: string): string[] {
    const tips: string[] = [];
    const words = content.split(/\s+/).filter(Boolean);
    if (words.length < 50) tips.push("Your essay is quite short — try to develop your ideas further.");
    if (words.length > 650) tips.push("Your essay may be too long. MIT essays typically have word limits — check the prompt.");
    const cliches = ['passionate about', 'ever since i was', 'changed my life', 'making the world a better place', 'always been interested'];
    cliches.forEach(c => { if (content.toLowerCase().includes(c)) tips.push(`Consider rephrasing "${c}" — admissions officers see this frequently.`); });
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const longSentences = sentences.filter(s => s.split(/\s+/).length > 35);
    if (longSentences.length > 2) tips.push("Some sentences are very long. Break them up for clarity.");
    if (content && !content.includes('I ') && !content.includes('I\'')) tips.push("Make sure your essay is personal — use 'I' to share your own experience.");
    if (tips.length === 0) tips.push("Looking good! Consider having someone else review for fresh perspective.");
    return tips;
  }

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-7rem)] flex flex-col animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Essay Helper</h1>
          <p className="text-sm text-muted-foreground mt-1">Write and refine your application essays with AI assistance</p>
        </div>
        <div className="flex gap-2">
          {activeEssay && (
            <Button size="sm" variant={showCowriter ? "default" : "outline"} onClick={() => setShowCowriter(!showCowriter)} className="gap-1.5">
              <Sparkles className="w-4 h-4" /> AI Co-writer
            </Button>
          )}
          <Button size="sm" onClick={addEssay} className="gap-1.5">
            <Plus className="w-4 h-4" /> New Essay
          </Button>
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Essay List */}
        <div className="w-56 shrink-0 space-y-2 overflow-auto">
          {essays.map(e => {
            const StatusIcon = STATUS_STYLES[e.status].icon;
            return (
              <motion.button
                key={e.id}
                onClick={() => setActiveId(e.id)}
                className={`w-full text-left glass-card p-3 space-y-1.5 transition-all ${activeId === e.id ? 'ring-1 ring-primary/50 bg-primary/5' : 'hover:bg-surface-hover'}`}
                layout
              >
                <div className="flex items-start justify-between gap-1">
                  <p className="text-sm font-medium text-foreground truncate">{e.title || 'Untitled Essay'}</p>
                  <button onClick={(ev) => { ev.stopPropagation(); remove(e.id); }} className="p-0.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`text-[10px] ${STATUS_STYLES[e.status].class}`}>
                    <StatusIcon className="w-2.5 h-2.5 mr-0.5" />{e.status}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">{e.wordCount} words</span>
                </div>
              </motion.button>
            );
          })}
          {essays.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-6 h-6 mx-auto mb-2 opacity-40" />
              <p className="text-xs">No essays yet</p>
            </div>
          )}
        </div>

        {/* Editor */}
        {activeEssay ? (
          <div className="flex-1 flex flex-col gap-4 min-h-0">
            <div className="glass-card p-4 space-y-3 shrink-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1 md:col-span-2">
                  <Label className="text-xs">Essay Title</Label>
                  <Input value={activeEssay.title} onChange={e => updateEssay(activeEssay.id, { title: e.target.value })} className="h-9 text-sm bg-surface" placeholder="e.g. MIT Essay - Why MIT?" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Status</Label>
                  <Select value={activeEssay.status} onValueChange={v => updateEssay(activeEssay.id, { status: v as Essay['status'] })}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="reviewing">Reviewing</SelectItem>
                      <SelectItem value="final">Final</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Essay Prompt</Label>
                <Input value={activeEssay.prompt} onChange={e => updateEssay(activeEssay.id, { prompt: e.target.value })} className="h-9 text-sm bg-surface" placeholder="Paste the essay prompt here..." />
              </div>
            </div>

            <div className="flex-1 min-h-0 flex gap-4">
              <div className="flex-1 flex flex-col min-h-0">
                <Textarea
                  value={activeEssay.content}
                  onChange={e => updateEssay(activeEssay.id, { content: e.target.value })}
                  className="flex-1 text-sm leading-relaxed bg-surface resize-none"
                  placeholder="Start writing your essay here..."
                />
                <div className="flex justify-between items-center mt-2 text-[10px] text-muted-foreground">
                  <span>{activeEssay.wordCount} words</span>
                  <span>Last modified: {new Date(activeEssay.lastModified).toLocaleString()}</span>
                </div>
              </div>

              {/* AI Co-writer Panel */}
              {showCowriter && (
                <motion.div
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="w-80 shrink-0 glass-card flex flex-col min-h-0 overflow-hidden"
                >
                  <div className="p-3 border-b border-border/50 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <h4 className="text-xs font-semibold text-foreground">AI Co-writer</h4>
                  </div>

                  <div ref={cowriterScrollRef} className="flex-1 overflow-auto p-3 space-y-3">
                    {cowriterMessages.length === 0 && (
                      <div className="text-center py-4 space-y-3">
                        <Bot className="w-8 h-8 mx-auto text-primary/40" />
                        <p className="text-xs text-muted-foreground">Ask for suggestions, improvements, or feedback on your essay</p>
                        <div className="flex flex-col gap-1.5">
                          {QUICK_PROMPTS.map(q => (
                            <button key={q} onClick={() => sendToCowriter(q)} className="text-left px-2.5 py-1.5 text-[11px] rounded-md bg-surface hover:bg-surface-hover text-muted-foreground hover:text-foreground border border-border/50 transition-colors">
                              {q}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {cowriterMessages.map((m, i) => (
                      <div key={i} className={`text-xs ${m.role === 'user' ? 'text-right' : ''}`}>
                        <div className={`inline-block rounded-lg px-3 py-2 max-w-[95%] ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-surface text-foreground'}`}>
                          {m.role === 'assistant' ? (
                            <div className="prose prose-xs prose-invert max-w-none"><ReactMarkdown>{m.content}</ReactMarkdown></div>
                          ) : (
                            <span>{m.content}</span>
                          )}
                        </div>
                      </div>
                    ))}
                    {isCowriterLoading && cowriterMessages[cowriterMessages.length - 1]?.role !== 'assistant' && (
                      <div className="flex gap-1 px-3 py-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse" />
                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse" style={{ animationDelay: '0.2s' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse" style={{ animationDelay: '0.4s' }} />
                      </div>
                    )}
                  </div>

                  <div className="p-2 border-t border-border/50">
                    <div className="flex gap-1.5">
                      <Input
                        value={cowriterInput}
                        onChange={e => setCowriterInput(e.target.value)}
                        placeholder="Ask for suggestions..."
                        className="h-8 text-xs bg-surface"
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); sendToCowriter(); } }}
                      />
                      <Button size="icon" onClick={() => sendToCowriter()} disabled={isCowriterLoading || !cowriterInput.trim()} className="h-8 w-8 shrink-0">
                        <Send className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Quick Tips Panel - show when cowriter is hidden */}
              {!showCowriter && activeEssay.content.length > 20 && (
                <motion.div
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="w-56 shrink-0 glass-card p-4 space-y-3 overflow-auto"
                >
                  <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Quick Feedback</h4>
                  {getQuickFeedback(activeEssay.content).map((tip, i) => (
                    <div key={i} className="flex gap-2 text-xs text-muted-foreground">
                      <AlertCircle className="w-3.5 h-3.5 text-warning shrink-0 mt-0.5" />
                      <span>{tip}</span>
                    </div>
                  ))}
                </motion.div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Select an essay or create a new one</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
