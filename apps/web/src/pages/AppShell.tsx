import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { BarChart3, Code2, FileScan, LogOut, Settings as SettingsIcon, User, Video } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { AIOrb } from "../components/AIOrb";
import { cn } from "../lib/utils";

const nav = [
  ["Dashboard", "/app", BarChart3],
  ["Resume", "/app/resume", FileScan],
  ["Interview", "/app/interview", Video],
  ["Coding", "/app/coding", Code2],
  ["Profile", "/app/profile", User],
  ["Settings", "/app/settings", SettingsIcon]
] as const;

export function AppShell() {
  const auth = useAuth();
  const navigate = useNavigate();
  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-white/10 bg-slate-950/55 p-5 backdrop-blur-2xl lg:block">
        <div className="font-display text-2xl font-bold">NEXVORA AI</div>
        <p className="mt-2 text-sm text-slate-400">{auth.user?.targetRole}</p>
        <nav className="mt-10 space-y-2">
          {nav.map(([label, href, Icon]) => (
            <NavLink key={href} to={href} end={href === "/app"} className={({ isActive }) => cn("flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition", isActive ? "bg-cyan-300 text-slate-950" : "text-slate-300 hover:bg-white/10 hover:text-white")}>
              <Icon className="h-4 w-4" /> {label}
            </NavLink>
          ))}
        </nav>
        <button onClick={() => { auth.logout(); navigate("/"); }} className="absolute bottom-5 left-5 right-5 flex items-center justify-center gap-2 rounded-lg border border-white/12 px-4 py-3 text-sm font-semibold text-slate-300 hover:bg-white/10">
          <LogOut className="h-4 w-4" /> Logout
        </button>
      </aside>
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/55 px-5 py-4 backdrop-blur-2xl lg:hidden">
        <div className="font-display text-lg font-bold">NEXVORA AI</div>
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {nav.map(([label, href]) => <NavLink key={href} to={href} end={href === "/app"} className="rounded-lg bg-white/8 px-3 py-2 text-xs text-slate-200">{label}</NavLink>)}
        </div>
      </header>
      <main className="px-5 py-6 lg:ml-72 lg:p-8">
        <Outlet />
      </main>
      <AIOrb onClick={() => navigate("/app/resume")} />
    </div>
  );
}
