import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, GraduationCap, Target, Check } from "lucide-react";
import { College, AppData } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Props {
  data: AppData;
  setColleges: (colleges: College[]) => void;
  updateProfile: (profile: Partial<AppData["profile"]>) => void;
}

const TIER_STYLES: Record<College["tier"], string> = {
  reach: "bg-destructive/10 text-destructive border-destructive/20",
  target: "bg-primary/10 text-primary border-primary/20",
  safety: "bg-success/10 text-success border-success/20",
};

function genId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export default function CollegeList({ data, setColleges, updateProfile }: Props) {
  const colleges = data.colleges || [];
  const activeSchool = data.profile.targetSchool;

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Omit<College, "id">>({
    name: "",
    location: "",
    tier: "target",
    notes: "",
    applicationDeadline: "",
  });

  const reset = () =>
    setDraft({ name: "", location: "", tier: "target", notes: "", applicationDeadline: "" });

  const add = () => {
    if (!draft.name.trim()) {
      toast.error("Please enter a college name");
      return;
    }
    const newCollege: College = { ...draft, id: genId(), name: draft.name.trim() };
    setColleges([...colleges, newCollege]);
    toast.success(`${newCollege.name} added to your list`);
    reset();
    setOpen(false);
  };

  const remove = (id: string) => {
    const c = colleges.find((x) => x.id === id);
    setColleges(colleges.filter((x) => x.id !== id));
    if (c && activeSchool === c.name) {
      updateProfile({ targetSchool: "MIT" });
    }
    toast.success("College removed");
  };

  const setActive = (name: string) => {
    updateProfile({ targetSchool: name });
    toast.success(`Now showing chances at ${name}`);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">College List</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track schools you want to apply to. Set one as active to see your chances and tailored advice.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-1.5">
              <Plus className="w-4 h-4" /> Add College
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add a college</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="c-name">Name</Label>
                <Input
                  id="c-name"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  placeholder="e.g. Stanford University"
                />
              </div>
              <div>
                <Label htmlFor="c-loc">Location</Label>
                <Input
                  id="c-loc"
                  value={draft.location}
                  onChange={(e) => setDraft({ ...draft, location: e.target.value })}
                  placeholder="e.g. Stanford, CA"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Tier</Label>
                  <Select
                    value={draft.tier}
                    onValueChange={(v: College["tier"]) => setDraft({ ...draft, tier: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="reach">Reach</SelectItem>
                      <SelectItem value="target">Target</SelectItem>
                      <SelectItem value="safety">Safety</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="c-deadline">Application Deadline</Label>
                  <Input
                    id="c-deadline"
                    type="date"
                    value={draft.applicationDeadline}
                    onChange={(e) =>
                      setDraft({ ...draft, applicationDeadline: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="c-notes">Notes</Label>
                <Textarea
                  id="c-notes"
                  value={draft.notes}
                  onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                  placeholder="Why this school? Programs, fit, etc."
                  className="min-h-[80px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { reset(); setOpen(false); }}>
                Cancel
              </Button>
              <Button onClick={add}>Add College</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="glass-card p-4 flex items-center gap-3">
        <Target className="w-5 h-5 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">Currently showing chances for</p>
          <p className="text-sm font-semibold text-foreground truncate">{activeSchool}</p>
        </div>
      </div>

      {colleges.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <GraduationCap className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">No colleges yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Add your first school to start building your application list.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {colleges.map((c) => {
            const isActive = c.name === activeSchool;
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`glass-card p-4 space-y-3 border ${
                  isActive ? "border-primary/40 ring-1 ring-primary/30" : "border-transparent"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{c.name}</h3>
                    {c.location && (
                      <p className="text-xs text-muted-foreground truncate">{c.location}</p>
                    )}
                  </div>
                  <Badge variant="outline" className={TIER_STYLES[c.tier]}>
                    {c.tier}
                  </Badge>
                </div>

                {c.applicationDeadline && (
                  <p className="text-xs text-muted-foreground">
                    Deadline: <span className="text-foreground font-medium">{c.applicationDeadline}</span>
                  </p>
                )}

                {c.notes && (
                  <p className="text-xs text-muted-foreground line-clamp-3">{c.notes}</p>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <Button
                    size="sm"
                    variant={isActive ? "default" : "outline"}
                    onClick={() => setActive(c.name)}
                    disabled={isActive}
                    className="flex-1 gap-1.5"
                  >
                    {isActive ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Active
                      </>
                    ) : (
                      <>
                        <Target className="w-3.5 h-3.5" /> Set Active
                      </>
                    )}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => remove(c.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
