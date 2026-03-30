import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Bot, User, Sparkles, Lock } from "lucide-react";
import { AppData } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Props {
  data: AppData;
}

function generateLocalAdvice(data: AppData, question: string): string {
  const p = data.profile;
  const q = question.toLowerCase();

  const parts: string[] = [];

  parts.push(`## Profile Analysis for ${p.name || 'Student'}\n`);

  if (q.includes('improve') || q.includes('weak') || q.includes('gap') || q.includes('what should')) {
    if (p.gpaUnweighted < 3.9 && p.gpaUnweighted > 0) parts.push("📚 **GPA**: Your unweighted GPA could be stronger. Focus on maintaining straight A's this semester — even small improvements matter for MIT.");
    if (p.satScore && p.satScore < 1550) parts.push(`📝 **SAT**: Your score of ${p.satScore} is below MIT's median (~1550). Consider retaking with focused prep on your weakest sections.`);
    if (p.actScore && p.actScore < 35) parts.push(`📝 **ACT**: Your score of ${p.actScore} could be stronger. MIT's median is around 35-36. Focused practice could help.`);
    if (p.apClasses.length < 8) parts.push(`🔬 **Course Rigor**: ${p.apClasses.length} AP classes is a start, but competitive applicants often take 8-12. Consider adding more STEM APs.`);
    if (data.projects.length < 3) parts.push("🏆 **Activities**: You need more substantial projects. MIT values depth over breadth — focus on 2-3 high-impact activities.");
    if (data.essays.length === 0) parts.push("✍️ **Essays**: Start drafting essays early. MIT essays should showcase your authentic voice and intellectual curiosity.");
  }

  if (q.includes('competitive') || q.includes('chances') || q.includes('ready')) {
    const highImpact = data.projects.filter(p => p.impactLevel === 'national' || p.impactLevel === 'international');
    parts.push("### Competitiveness Assessment\n");
    if (p.gpaUnweighted >= 3.9 && (p.satScore ?? 0) >= 1550) parts.push("✅ Your academics are competitive for MIT.");
    else parts.push("⚠️ Your academic stats need improvement to be competitive.");
    if (highImpact.length >= 2) parts.push("✅ You have strong high-impact activities.");
    else parts.push("⚠️ You need more nationally/internationally recognized activities.");
    parts.push("\nMIT's acceptance rate is ~4%. Strong academics are necessary but not sufficient — you need a compelling \"spike\" that shows deep passion.");
  }

  if (q.includes('spike') || q.includes('position') || q.includes('narrative')) {
    const categories = data.projects.map(p => p.category);
    const mostCommon = categories.sort((a, b) => categories.filter(v => v === b).length - categories.filter(v => v === a).length)[0];
    if (mostCommon) {
      parts.push(`### Your Spike\n`);
      parts.push(`Based on your projects, your strongest area appears to be **${mostCommon}**. MIT loves applicants who show deep, genuine passion in a specific area.`);
      parts.push("\n**Suggestions:**");
      parts.push("- Deepen your impact in this area with research or competitions");
      parts.push("- Connect your projects into a narrative arc");
      parts.push("- Show how your work has evolved and grown in complexity");
    }
  }

  if (parts.length <= 1) {
    parts.push("I can help you analyze your profile for MIT admissions. Try asking me:");
    parts.push("- \"What should I improve most for MIT?\"");
    parts.push("- \"Is my profile competitive?\"");
    parts.push("- \"What kind of spike do I have?\"");
    parts.push("- \"How can I strengthen my application?\"");
  }

  parts.push("\n---\n*💡 Connect Lovable Cloud for personalized AI-powered advice using advanced language models.*");
  return parts.join("\n\n");
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

  function send(text?: string) {
    const msg = text || input.trim();
    if (!msg) return;
    setInput('');
    const userMsg: Message = { role: 'user', content: msg };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    setTimeout(() => {
      const response = generateLocalAdvice(data, msg);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      setIsLoading(false);
    }, 800);
  }

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-7rem)] flex flex-col animate-fade-in">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-foreground">AI Profile Advisor</h1>
        <p className="text-sm text-muted-foreground mt-1">Get strategic advice for your MIT application</p>
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
                <p className="text-xs text-muted-foreground mt-1">I'll analyze your profile and give strategic advice</p>
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
                <div className="whitespace-pre-wrap">{m.content}</div>
              </div>
              {m.role === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4 text-secondary-foreground" />
                </div>
              )}
            </motion.div>
          ))}
          {isLoading && (
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
              placeholder="Ask about your MIT application..."
              className="min-h-[40px] max-h-[120px] text-sm resize-none bg-surface"
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            />
            <Button size="icon" onClick={() => send()} disabled={isLoading || !input.trim()} className="shrink-0 h-10 w-10">
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
            <Lock className="w-2.5 h-2.5" /> Local analysis mode — connect Lovable Cloud for AI-powered advice
          </p>
        </div>
      </div>
    </div>
  );
}
