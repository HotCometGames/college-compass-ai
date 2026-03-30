// localStorage-backed state management

export interface StudentProfile {
  name: string;
  gpaWeighted: number;
  gpaUnweighted: number;
  satScore: number | null;
  actScore: number | null;
  apClasses: string[];
  targetSchool: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  category: 'ai' | 'hackathons' | 'research' | 'clubs' | 'athletics' | 'community' | 'arts' | 'other';
  impactLevel: 'local' | 'state' | 'national' | 'international';
  awards: string[];
  metrics: string;
  startDate: string;
  endDate: string;
  isOngoing: boolean;
}

export interface Goal {
  id: string;
  title: string;
  category: 'academic' | 'extracurricular' | 'testing' | 'essay' | 'other';
  currentValue: string;
  targetValue: string;
  deadline: string;
  progress: number; // 0-100
  notes: string;
}

export interface Essay {
  id: string;
  title: string;
  prompt: string;
  content: string;
  wordCount: number;
  lastModified: string;
  status: 'draft' | 'reviewing' | 'final';
}

export interface AppData {
  profile: StudentProfile;
  projects: Project[];
  goals: Goal[];
  essays: Essay[];
}

const DEFAULT_DATA: AppData = {
  profile: {
    name: '',
    gpaWeighted: 0,
    gpaUnweighted: 0,
    satScore: null,
    actScore: null,
    apClasses: [],
    targetSchool: 'MIT',
  },
  projects: [],
  goals: [],
  essays: [],
};

const STORAGE_KEY = 'admit-ai-data';

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_DATA, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { ...DEFAULT_DATA };
}

export function saveData(data: AppData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}
