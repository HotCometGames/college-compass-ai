import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Plus } from "lucide-react";

interface Todo {
  id: string;
  text: string;
  done: boolean;
  dueDate: string;
}

const STORAGE_KEY = "admit-ai-todos";

function loadTodos(): Todo[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveTodos(todos: Todo[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

export default function TodoList() {
  const [todos, setTodos] = useState<Todo[]>(loadTodos);
  const [text, setText] = useState("");
  const [dueDate, setDueDate] = useState("");

  const update = (next: Todo[]) => { setTodos(next); saveTodos(next); };

  const add = () => {
    if (!text.trim()) return;
    update([...todos, { id: crypto.randomUUID(), text: text.trim(), done: false, dueDate }]);
    setText("");
    setDueDate("");
  };

  const toggle = (id: string) => update(todos.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const remove = (id: string) => update(todos.filter(t => t.id !== id));

  const pending = todos.filter(t => !t.done);
  const completed = todos.filter(t => t.done);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-foreground">To-Do List</h1>

      <div className="flex gap-2">
        <Input
          placeholder="What needs to be done?"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === "Enter" && add()}
          className="flex-1"
        />
        <Input
          type="date"
          value={dueDate}
          onChange={e => setDueDate(e.target.value)}
          className="w-40"
        />
        <Button onClick={add} size="icon"><Plus className="w-4 h-4" /></Button>
      </div>

      {pending.length === 0 && completed.length === 0 && (
        <p className="text-muted-foreground text-sm text-center py-8">No tasks yet — add one above!</p>
      )}

      <div className="space-y-2">
        {pending.map(t => (
          <div key={t.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
            <Checkbox checked={false} onCheckedChange={() => toggle(t.id)} />
            <span className="flex-1 text-sm text-foreground">{t.text}</span>
            {t.dueDate && <span className="text-xs text-muted-foreground">{t.dueDate}</span>}
            <Button variant="ghost" size="icon" onClick={() => remove(t.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>

      {completed.length > 0 && (
        <div className="space-y-2 pt-4 border-t border-border">
          <p className="text-xs font-medium text-muted-foreground uppercase">Completed</p>
          {completed.map(t => (
            <div key={t.id} className="flex items-center gap-3 rounded-lg border border-border bg-card/50 p-3 opacity-60">
              <Checkbox checked onCheckedChange={() => toggle(t.id)} />
              <span className="flex-1 text-sm text-foreground line-through">{t.text}</span>
              <Button variant="ghost" size="icon" onClick={() => remove(t.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
