import { useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle2, BookOpen, Trophy, FlaskConical, FolderKanban, Target, PenTool, Download, Upload, Copy, Check } from "lucide-react";
import { AppData, loadData, saveData } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import TagInput from "@/components/TagInput";

interface Props {
  data: AppData;
  updateProfile: (p: Partial<AppData["profile"]>) => void;
}

function computeReadiness(data: AppData) {
  let score = 0;
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const missing: string[] = [];

  const p = data.profile;
  if (p.gpaUnweighted >= 3.9) { score += 20; strengths.push("Outstanding GPA"); }
  else if (p.gpaUnweighted >= 3.7) { score += 15; }
  else if (p.gpaUnweighted > 0) { score += 8; weaknesses.push("GPA below MIT median"); }
  else { missing.push("GPA not entered"); }

  if (p.satScore && p.satScore >= 1550) { score += 15; strengths.push("Excellent SAT"); }
  else if (p.satScore && p.satScore >= 1500) { score += 10; }
  else if (p.satScore) { score += 5; weaknesses.push("SAT could be higher"); }
  if (p.actScore && p.actScore >= 35) { score += 15; strengths.push("Excellent ACT"); }
  else if (p.actScore && p.actScore >= 33) { score += 10; }
  else if (p.actScore) { score += 5; weaknesses.push("ACT could be higher"); }
  if (!p.satScore && !p.actScore) missing.push("No test scores entered");

  if (p.apClasses.length >= 8) { score += 15; strengths.push("Strong course rigor"); }
  else if (p.apClasses.length >= 5) { score += 10; }
  else if (p.apClasses.length > 0) { score += 5; weaknesses.push("Consider more AP courses"); }
  else { missing.push("No AP classes listed"); }

  const highImpact = data.projects.filter(p => p.impactLevel === 'national' || p.impactLevel === 'international');
  if (highImpact.length >= 2) { score += 20; strengths.push("Strong extracurricular impact"); }
  else if (data.projects.length >= 3) { score += 12; }
  else if (data.projects.length > 0) { score += 6; weaknesses.push("Need more high-impact activities"); }
  else { missing.push("No projects added"); }

  if (data.essays.length >= 1) { score += 10; strengths.push("Essays in progress"); }
  else { missing.push("No essays started"); }

  if (data.goals.length >= 2) { score += 5; }

  return { score: Math.min(score, 100), strengths, weaknesses, missing };
}

function ScoreRing({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 52;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 75 ? 'var(--score-excellent)' : score >= 50 ? 'var(--score-good)' : score >= 30 ? 'var(--score-fair)' : 'var(--score-poor)';

  return (
    <div className="relative score-ring flex items-center justify-center">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="52" fill="none" strokeWidth="8" className="stroke-muted" />
        <motion.circle
          cx="60" cy="60" r="52" fill="none" strokeWidth="8"
          strokeLinecap="round"
          stroke={`hsl(${color})`}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-foreground">{score}</span>
        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Score</span>
      </div>
    </div>
  );
}

export default function ProfileOverview({ data, updateProfile }: Props) {
  const { score, strengths, weaknesses, missing } = computeReadiness(data);
  const p = data.profile;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Profile Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">Your MIT application readiness at a glance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div className="glass-card p-6 flex flex-col items-center justify-center gap-3 md:row-span-2" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">MIT Readiness</h3>
          <ScoreRing score={score} />
          <p className="text-xs text-muted-foreground text-center max-w-[180px]">Based on your profile data, projects, and essays</p>
        </motion.div>

        <motion.div className="glass-card p-5 space-y-3" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="flex items-center gap-2 text-success">
            <CheckCircle2 className="w-4 h-4" />
            <h4 className="text-xs font-semibold uppercase tracking-wider">Strengths</h4>
          </div>
          {strengths.length > 0 ? strengths.map(s => (
            <div key={s} className="flex items-center gap-2 text-sm text-foreground">
              <TrendingUp className="w-3.5 h-3.5 text-success shrink-0" />{s}
            </div>
          )) : <p className="text-xs text-muted-foreground">Add your data to see strengths</p>}
        </motion.div>

        <motion.div className="glass-card p-5 space-y-3" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center gap-2 text-warning">
            <AlertCircle className="w-4 h-4" />
            <h4 className="text-xs font-semibold uppercase tracking-wider">Weaknesses</h4>
          </div>
          {weaknesses.length > 0 ? weaknesses.map(w => (
            <div key={w} className="flex items-center gap-2 text-sm text-foreground">
              <TrendingDown className="w-3.5 h-3.5 text-warning shrink-0" />{w}
            </div>
          )) : <p className="text-xs text-muted-foreground">No weaknesses identified yet</p>}
        </motion.div>

        <motion.div className="glass-card p-5 space-y-3 md:col-span-2" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="w-4 h-4" />
            <h4 className="text-xs font-semibold uppercase tracking-wider">Missing Components</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {missing.length > 0 ? missing.map(m => (
              <Badge key={m} variant="outline" className="text-xs border-destructive/30 text-destructive">{m}</Badge>
            )) : <p className="text-xs text-muted-foreground">All core components present!</p>}
          </div>
        </motion.div>
      </div>

      <motion.div className="glass-card p-6 space-y-5" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" /> Academic Profile
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Student Name</Label>
            <Input value={p.name} placeholder="Your name" onChange={e => updateProfile({ name: e.target.value })} className="h-9 text-sm bg-surface" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">GPA (Unweighted)</Label>
            <Input type="number" step="0.01" min="0" max="4" value={p.gpaUnweighted || ''} placeholder="e.g. 3.95" onChange={e => updateProfile({ gpaUnweighted: parseFloat(e.target.value) || 0 })} className="h-9 text-sm bg-surface" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">GPA (Weighted)</Label>
            <Input type="number" step="0.01" min="0" max="5" value={p.gpaWeighted || ''} placeholder="e.g. 4.5" onChange={e => updateProfile({ gpaWeighted: parseFloat(e.target.value) || 0 })} className="h-9 text-sm bg-surface" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">SAT Score</Label>
            <Input type="number" min="400" max="1600" value={p.satScore || ''} placeholder="e.g. 1540" onChange={e => updateProfile({ satScore: parseInt(e.target.value) || null })} className="h-9 text-sm bg-surface" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">ACT Score</Label>
            <Input type="number" min="1" max="36" value={p.actScore || ''} placeholder="e.g. 34" onChange={e => updateProfile({ actScore: parseInt(e.target.value) || null })} className="h-9 text-sm bg-surface" />
          </div>
          <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
            <Label className="text-xs text-muted-foreground">AP / Advanced Classes</Label>
            <TagInput
              tags={p.apClasses}
              onChange={apClasses => updateProfile({ apClasses })}
              placeholder="e.g. AP Calc BC (5)"
            />
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Projects", value: data.projects.length, icon: FolderKanban, color: "text-primary" },
          { label: "Goals", value: data.goals.length, icon: Target, color: "text-info" },
          { label: "Essays", value: data.essays.length, icon: PenTool, color: "text-warning" },
          { label: "AP Classes", value: p.apClasses.length, icon: FlaskConical, color: "text-success" },
        ].map((stat) => (
          <motion.div key={stat.label} className="glass-card p-4 flex items-center gap-3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.35 }}>
            <stat.icon className={`w-5 h-5 ${stat.color} shrink-0`} />
            <div>
              <p className="text-xl font-bold text-foreground">{stat.value}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
