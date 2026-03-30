import { useState, useEffect, useCallback } from 'react';
import { loadData, saveData, AppData } from './store';

export function useAppData() {
  const [data, setData] = useState<AppData>(loadData);

  useEffect(() => {
    saveData(data);
  }, [data]);

  const updateProfile = useCallback((profile: Partial<AppData['profile']>) => {
    setData(prev => ({ ...prev, profile: { ...prev.profile, ...profile } }));
  }, []);

  const setProjects = useCallback((projects: AppData['projects']) => {
    setData(prev => ({ ...prev, projects }));
  }, []);

  const setGoals = useCallback((goals: AppData['goals']) => {
    setData(prev => ({ ...prev, goals }));
  }, []);

  const setEssays = useCallback((essays: AppData['essays']) => {
    setData(prev => ({ ...prev, essays }));
  }, []);

  return { data, updateProfile, setProjects, setGoals, setEssays };
}
