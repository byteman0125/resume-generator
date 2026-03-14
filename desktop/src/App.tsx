import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { AppHeader } from "./components/AppHeader";
import { AuthProvider, useAuth } from "./lib/auth-context";
import { ResumeProvider } from "./lib/resume-context";
import { JobApplicationsView } from "./components/job-applications-view";
import { ProfilePage } from "./pages/ProfilePage";
import { AIPage } from "./pages/AIPage";
import { TemplatePage } from "./pages/TemplatePage";
import { AuthPage } from "./pages/AuthPage";
import { UsersPage } from "./pages/UsersPage";

/** Redirect empty path or /index.html to "/" so job applications always show on start. */
function EnsureJobApplicationsDefault() {
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    const pathname = location.pathname || "";
    if (pathname === "" || pathname === "/index.html") {
      navigate("/", { replace: true });
    }
  }, [location.pathname, navigate]);
  return null;
}

function AppShell() {
  return (
    <ResumeProvider>
      <div className="h-screen max-h-screen flex flex-col overflow-hidden bg-background text-foreground">
        <AppHeader />
        <main className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <EnsureJobApplicationsDefault />
          <Routes>
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/ai" element={<AIPage />} />
            <Route path="/template/:formatId" element={<TemplatePage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/" element={<JobApplicationsView />} />
            <Route path="/applications" element={<JobApplicationsView />} />
            <Route path="*" element={<JobApplicationsView />} />
          </Routes>
        </main>
      </div>
    </ResumeProvider>
  );
}

export function App() {
  const { token, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <span className="text-muted-foreground">Loading…</span>
      </div>
    );
  }
  if (!token) {
    return <AuthPage />;
  }
  return <AppShell />;
}

export function AppWithProviders() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}
