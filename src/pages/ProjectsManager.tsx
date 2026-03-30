import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Edit2, Award, Globe, Filter } from "lucide-react";
import { Project, generateId, AppData } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const CATEGORIES = ['ai', 'hackathons', 'research', 'clubs', 'athletics', 'community', 'arts', 'other'] as const;
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
  other: 'bg-muted text-muted-foreground',
};

interface Props {
  projects: Project[];
  setProjects: (p: Project[]) => void;
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

  const filtered = filterCat === 'all' ? projects : projects.filter(p => p.category === filterCat);

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
                <Badge className={`text-[10px] ${CAT_COLORS[p.category]}`}>{p.category}</Badge>
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
        <Label className="text-xs">Awards (comma-separated)</Label>
        <Input value={p.awards.join(', ')} onChange={e => setP({ ...p, awards: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} className="h-9 text-sm" placeholder="e.g. 1st Place Hackathon, Published Paper" />
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
