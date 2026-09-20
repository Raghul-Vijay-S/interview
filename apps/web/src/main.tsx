import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { AuroraBackground } from "./components/Background";
import "./styles.css";

const AppShell = lazy(() => import("./pages/AppShell").then((module) => ({ default: module.AppShell })));
const Dashboard = lazy(() => import("./pages/Dashboard").then((module) => ({ default: module.Dashboard })));
const Landing = lazy(() => import("./pages/Landing").then((module) => ({ default: module.Landing })));
const Login = lazy(() => import("./pages/Login").then((module) => ({ default: module.Login })));
const Onboarding = lazy(() => import("./pages/Onboarding").then((module) => ({ default: module.Onboarding })));
const Profile = lazy(() => import("./pages/Profile").then((module) => ({ default: module.Profile })));
const ResumeStudio = lazy(() => import("./pages/ResumeStudio").then((module) => ({ default: module.ResumeStudio })));
const Settings = lazy(() => import("./pages/Settings").then((module) => ({ default: module.Settings })));
const InterviewLab = lazy(() => import("./pages/InterviewLab").then((module) => ({ default: module.InterviewLab })));
const CodingArena = lazy(() => import("./pages/CodingArena").then((module) => ({ default: module.CodingArena })));

if (localStorage.getItem("nexvora_theme") === "light") {
  document.documentElement.classList.add("theme-light");
}

function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="grid min-h-screen place-items-center text-cyan-100">Initializing NEXVORA...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.onboarded) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

function OnboardingRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.onboarded) return <Navigate to="/app" replace />;
  return <Onboarding />;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <AuroraBackground />
        <Suspense fallback={<div className="grid min-h-screen place-items-center text-cyan-100">Loading NEXVORA...</div>}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/onboarding" element={<OnboardingRoute />} />
            <Route path="/app" element={<Protected><AppShell /></Protected>}>
              <Route index element={<Dashboard />} />
              <Route path="resume" element={<ResumeStudio />} />
              <Route path="interview" element={<InterviewLab />} />
              <Route path="coding" element={<CodingArena />} />
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
