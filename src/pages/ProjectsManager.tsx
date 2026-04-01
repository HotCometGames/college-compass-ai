import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Edit2, Award, Globe, Filter, Trophy } from "lucide-react";
import { Project, generateId } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import TagInput from "@/components/TagInput";

const CATEGORIES = ['ai', 'hackathons', 'research', 'clubs', 'athletics', 'community', 'arts', 'passion project', 'other'] as const;
const IMPACT_LEVELS = ['local', 'state', 'national', 'international'] as const;
const IMPACT_COLORS: Record<string, string> = {
  local: 'bg-muted text-muted-foreground',
  state: 'bg-info/10 text-info',
  national: 'bg-warning/10 text-warning',
  international: 'bg-success/10 text-success',
};
const CAT_COLORS: Record<string, string> = {
  ai: 'bg-primary/10 text-primary',
  hackathons: 'bg-warning/10 text-warning',
  research: 'bg-info/10 text-info',
  clubs: 'bg-success/10 text-success',
  athletics: 'bg-destructive/10 text-destructive',
  community: 'bg-primary/10 text-primary',
  arts: 'bg-warning/10 text-warning',
  'passion project': 'bg-info/10 text-info',
  other: 'bg-muted text-muted-foreground',
};

// Achievement types
interface Achievement {
  id: string;
  title: string;
  description: string;
  date: string;
  category: string;
}

interface Props {
  projects: Project[];
  setProjects: (p: Project[]) => void;
}

const ACHIEVEMENTS_KEY = 'admit-ai-achievements';

function loadAchievements(): Achievement[] {
  try {
    const raw = localStorage.getItem(ACHIEVEMENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveAchievements(a: Achievement[]) {
  localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(a));
}

function emptyProject(): Project {
  return {
    id: generateId(),
    title: '',
    description: '',
    category: 'other',
    impactLevel: 'local',
    awards: [],
    metrics: '',
    startDate: '',
    endDate: '',
    isOngoing: false,
  };
}

export default function ProjectsManager({ projects, setProjects }: Props) {
  const [editing, setEditing] = useState<Project | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterCat, setFilterCat] = useState<string>('all');
  const [achievements, setAchievementsState] = useState<Achievement[]>(loadAchievements);
  const [showAchievementForm, setShowAchievementForm] = useState(false);
  const [newAchievement, setNewAchievement] = useState({ title: '', description: '', date: '', category: '' });

  const filtered = filterCat === 'all' ? projects : projects.filter(p => p.category === filterCat);

  function setAchievements(a: Achievement[]) {
    setAchievementsState(a);
    saveAchievements(a);
  }

  function addAchievement() {
    if (!newAchievement.title.trim()) return;
    const achievement: Achievement = { id: generateId(), ...newAchievement };
    setAchievements([...achievements, achievement]);
    setNewAchievement({ title: '', description: '', date: '', category: '' });
    setShowAchievementForm(false);
  }

  function removeAchievement(id: string) {
    setAchievements(achievements.filter(a => a.id !== id));
  }

  function save(p: Project) {
    const exists = projects.find(x => x.id === p.id);
    if (exists) {
      setProjects(projects.map(x => x.id === p.id ? p : x));
    } else {
      setProjects([...projects, p]);
    }
    setEditing(null);
    setDialogOpen(false);
  }

  function remove(id: string) {
    setProjects(projects.filter(x => x.id !== id));
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Projects & Activities</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your extracurricular profile</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => setEditing(emptyProject())} className="gap-1.5">
              <Plus className="w-4 h-4" /> Add Project
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing?.title ? 'Edit Project' : 'New Project'}</DialogTitle>
            </DialogHeader>
            {editing && (
              <ProjectForm project={editing} onSave={save} onCancel={() => { setEditing(null); setDialogOpen(false); }} />
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <button
          onClick={() => setFilterCat('all')}
          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${filterCat === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
        >
          All
        </button>
        {CATEGORIES.map(c => (
          <button
            key={c}
            onClick={() => setFilterCat(c)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-colors ${filterCat === c ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {filtered.map(p => (
            <motion.div
              key={p.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card p-5 space-y-3 hover-lift"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-foreground text-sm leading-tight">{p.title || 'Untitled Project'}</h3>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => { setEditing(p); setDialogOpen(true); }} className="p-1 rounded hover:bg-surface-hover text-muted-foreground hover:text-foreground transition-colors">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => remove(p.id)} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">{p.description || 'No description'}</p>
              <div className="flex flex-wrap gap-1.5">
                <Badge className={`text-[10px] ${CAT_COLORS[p.category] || 'bg-muted text-muted-foreground'}`}>{p.category}</Badge>
                <Badge className={`text-[10px] ${IMPACT_COLORS[p.impactLevel]}`}>
                  <Globe className="w-2.5 h-2.5 mr-0.5" />{p.impactLevel}
                </Badge>
                {p.awards.length > 0 && (
                  <Badge className="text-[10px] bg-warning/10 text-warning">
                    <Award className="w-2.5 h-2.5 mr-0.5" />{p.awards.length} award{p.awards.length > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
              {p.metrics && <p className="text-[11px] text-muted-foreground italic">{p.metrics}</p>}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-sm">No projects yet. Add your first one!</p>
        </div>
      )}

      {/* Achievements Section */}
      <div className="pt-4 border-t border-border/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-warning" />
            <h2 className="text-lg font-bold text-foreground">Achievements</h2>
          </div>
          <Button size="sm" variant="outline" onClick={() => setShowAchievementForm(!showAchievementForm)} className="gap-1.5">
            <Plus className="w-4 h-4" /> Add Achievement
          </Button>
        </div>

        {showAchievementForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="glass-card p-4 mb-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Title</Label>
                <Input value={newAchievement.title} onChange={e => setNewAchievement({ ...newAchievement, title: e.target.value })} className="h-9 text-sm" placeholder="e.g. National Merit Semifinalist" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Category</Label>
                <Input value={newAchievement.category} onChange={e => setNewAchievement({ ...newAchievement, category: e.target.value })} className="h-9 text-sm" placeholder="e.g. Academic, STEM, Arts" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Description</Label>
              <Input value={newAchievement.description} onChange={e => setNewAchievement({ ...newAchievement, description: e.target.value })} className="h-9 text-sm" placeholder="Brief description of the achievement" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Date</Label>
                <Input type="date" value={newAchievement.date} onChange={e => setNewAchievement({ ...newAchievement, date: e.target.value })} className="h-9 text-sm" />
              </div>
              <div className="flex items-end gap-2">
                <Button size="sm" onClick={addAchievement}>Add</Button>
                <Button size="sm" variant="outline" onClick={() => setShowAchievementForm(false)}>Cancel</Button>
              </div>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {achievements.map(a => (
            <motion.div key={a.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-warning shrink-0" />
                  <h4 className="text-sm font-semibold text-foreground">{a.title}</h4>
                </div>
                <button onClick={() => removeAchievement(a.id)} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              {a.description && <p className="text-xs text-muted-foreground">{a.description}</p>}
              <div className="flex gap-1.5">
                {a.category && <Badge className="text-[10px] bg-primary/10 text-primary">{a.category}</Badge>}
                {a.date && <Badge className="text-[10px] bg-muted text-muted-foreground">{new Date(a.date).toLocaleDateString()}</Badge>}
              </div>
            </motion.div>
          ))}
        </div>
        {achievements.length === 0 && !showAchievementForm && (
          <p className="text-center text-sm text-muted-foreground py-6">No achievements added yet. Showcase your honors and awards!</p>
        )}
      </div>
    </div>
  );
}

function ProjectForm({ project, onSave, onCancel }: { project: Project; onSave: (p: Project) => void; onCancel: () => void }) {
  const [p, setP] = useState(project);

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs">Title</Label>
        <Input value={p.title} onChange={e => setP({ ...p, title: e.target.value })} className="h-9 text-sm" placeholder="Project name" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Description</Label>
        <Textarea value={p.description} onChange={e => setP({ ...p, description: e.target.value })} className="text-sm min-h-[80px]" placeholder="What did you do? What was the impact?" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Category</Label>
          <Select value={p.category} onValueChange={v => setP({ ...p, category: v as Project['category'] })}>
            <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Impact Level</Label>
          <Select value={p.impactLevel} onValueChange={v => setP({ ...p, impactLevel: v as Project['impactLevel'] })}>
            <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {IMPACT_LEVELS.map(l => <SelectItem key={l} value={l} className="capitalize">{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Awards</Label>
        <TagInput tags={p.awards} onChange={awards => setP({ ...p, awards })} placeholder="e.g. 1st Place Hackathon" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Key Metrics</Label>
        <Input value={p.metrics} onChange={e => setP({ ...p, metrics: e.target.value })} className="h-9 text-sm" placeholder="e.g. 500 users, $2K revenue, 3 publications" />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        <Button size="sm" onClick={() => onSave(p)}>Save Project</Button>
      </div>
    </div>
  );
}
