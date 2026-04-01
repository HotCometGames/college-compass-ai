import {
  BarChart3,
  FolderKanban,
  Target,
  Bot,
  PenTool,
  GraduationCap,
  ListChecks,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Profile Overview", url: "/", icon: BarChart3 },
  { title: "Projects & Activities", url: "/projects", icon: FolderKanban },
  { title: "Goals & Gaps", url: "/goals", icon: Target },
  { title: "AI Advisor", url: "/advisor", icon: Bot },
  { title: "Essay Helper", url: "/essays", icon: PenTool },
  { title: "To-Do List", url: "/todos", icon: ListChecks },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50">
      <SidebarContent className="pt-4">
        <div className="px-4 mb-6 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <GraduationCap className="w-4.5 h-4.5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="font-semibold text-foreground text-sm tracking-tight">
              AdmitAI
            </span>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
                      activeClassName="bg-primary/10 text-primary"
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
