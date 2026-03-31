import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAppData } from "@/lib/hooks";
import ProfileOverview from "@/pages/ProfileOverview";
import ProjectsManager from "@/pages/ProjectsManager";
import GoalsTracker from "@/pages/GoalsTracker";
import AIAdvisor from "@/pages/AIAdvisor";
import EssayHelper from "@/pages/EssayHelper";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

function DashboardRoutes() {
  const { data, updateProfile, setProjects, setGoals, setEssays } = useAppData();

  return (
    <DashboardLayout>
      <Routes>
        <Route path="/" element={<ProfileOverview data={data} updateProfile={updateProfile} />} />
        <Route path="/projects" element={<ProjectsManager projects={data.projects} setProjects={setProjects} />} />
        <Route path="/goals" element={<GoalsTracker goals={data.goals} setGoals={setGoals} />} />
        <Route path="/advisor" element={<AIAdvisor data={data} />} />
        <Route path="/essays" element={<EssayHelper essays={data.essays} setEssays={setEssays} />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </DashboardLayout>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/*" element={<DashboardRoutes />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
