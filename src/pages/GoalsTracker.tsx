import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Edit2, Calendar, Target } from "lucide-react";
import { Goal, generateId } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const GOAL_CATEGORIES = ['academic', 'extracurricular', 'testing', 'essay', 'other'] as const;
const CAT_COLORS: Record<string, string> = {
  academic: 'bg-info/10 text-info',
  extracurricular: 'bg-success/10 text-success',
  testing: 'bg-warning/10 text-warning',
  essay: 'bg-primary/10 text-primary',
  other: 'bg-muted text-muted-foreground',
};

interface Props {
  goals: Goal[];
  setGoals: (g: Goal[]) => void;
}

function emptyGoal(): Goal {
  return { id: generateId(), title: '', category: 'academic', currentValue: '', targetValue: '', deadline: '', progress: 0, notes: '' };
}

export default function GoalsTracker({ goals, setGoals }: Props) {
  const [editing, setEditing] = useState<Goal | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  function save(g: Goal) {
    const exists = goals.find(x => x.id === g.id);
    if (exists) setGoals(goals.map(x => x.id === g.id ? g : x));
    else setGoals([...goals, g]);
    setEditing(null);
    setDialogOpen(false);
  }

  function remove(id: string) {
    setGoals(goals.filter(x => x.id !== id));
  }

  const completed = goals.filter(g => g.progress >= 100).length;
  const avgProgress = goals.length > 0 ? Math.round(goals.reduce((s, g) => s + g.progress, 0) / goals.length) : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Goals & Gap Tracker</h1>
          <p className="text-sm text-muted-foreground mt-1">Track your progress toward application goals</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => setEditing(emptyGoal())} className="gap-1.5">
              <Plus className="w-4 h-4" /> Add Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editing?.title ? 'Edit Goal' : 'New Goal'}</DialogTitle></DialogHeader>
            {editing && <GoalForm goal={editing} onSave={save} onCancel={() => { setEditing(null); setDialogOpen(false); }} />}
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Goals", value: goals.length },
          { label: "Completed", value: completed },
          { label: "Avg Progress", value: `${avgProgress}%` },
        ].map(s => (
          <motion.div key={s.label} className="glass-card p-4 text-center" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-xl font-bold text-foreground">{s.value}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Goals List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {goals.map(g => (
            <motion.div key={g.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="glass-card p-5 space-y-3 hover-lift">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground text-sm">{g.title || 'Untitled Goal'}</h3>
                    <Badge className={`text-[10px] ${CAT_COLORS[g.category]}`}>{g.category}</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {g.currentValue && <span>Current: <span className="text-foreground font-medium">{g.currentValue}</span></span>}
                    {g.targetValue && <span>Target: <span className="text-foreground font-medium">{g.targetValue}</span></span>}
                    {g.deadline && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />{new Date(g.deadline).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => { setEditing(g); setDialogOpen(true); }} className="p-1 rounded hover:bg-surface-hover text-muted-foreground hover:text-foreground transition-colors">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => remove(g.id)} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Progress value={g.progress} className="flex-1 h-2" />
                <span className="text-xs font-medium text-foreground w-10 text-right">{g.progress}%</span>
              </div>
              {g.notes && <p className="text-[11px] text-muted-foreground">{g.notes}</p>}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {goals.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Target className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No goals set. Start by adding an academic or testing goal!</p>
        </div>
      )}
    </div>
  );
}

function GoalForm({ goal, onSave, onCancel }: { goal: Goal; onSave: (g: Goal) => void; onCancel: () => void }) {
  const [g, setG] = useState(goal);
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs">Title</Label>
        <Input value={g.title} onChange={e => setG({ ...g, title: e.target.value })} className="h-9 text-sm" placeholder="e.g. Improve ACT to 35" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Category</Label>
          <Select value={g.category} onValueChange={v => setG({ ...g, category: v as Goal['category'] })}>
            <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {GOAL_CATEGORIES.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Deadline</Label>
          <Input type="date" value={g.deadline} onChange={e => setG({ ...g, deadline: e.target.value })} className="h-9 text-sm" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Current Value</Label>
          <Input value={g.currentValue} onChange={e => setG({ ...g, currentValue: e.target.value })} className="h-9 text-sm" placeholder="e.g. 32" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Target Value</Label>
          <Input value={g.targetValue} onChange={e => setG({ ...g, targetValue: e.target.value })} className="h-9 text-sm" placeholder="e.g. 35" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Progress ({g.progress}%)</Label>
        <input type="range" min="0" max="100" value={g.progress} onChange={e => setG({ ...g, progress: parseInt(e.target.value) })} className="w-full accent-primary" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Notes</Label>
        <Textarea value={g.notes} onChange={e => setG({ ...g, notes: e.target.value })} className="text-sm min-h-[60px]" placeholder="Any additional context..." />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        <Button size="sm" onClick={() => onSave(g)}>Save Goal</Button>
      </div>
    </div>
  );
}
