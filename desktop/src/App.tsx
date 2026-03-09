import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { AppHeader } from "./components/AppHeader";
import { ResumeProvider } from "./lib/resume-context";
import { JobApplicationsView } from "./components/job-applications-view";
import { ProfilePage } from "./pages/ProfilePage";
import { AIPage } from "./pages/AIPage";
import { TemplatePage } from "./pages/TemplatePage";

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

export function App() {
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
            <Route path="/" element={<JobApplicationsView />} />
            <Route path="/applications" element={<JobApplicationsView />} />
            <Route path="*" element={<JobApplicationsView />} />
          </Routes>
        </main>
      </div>
    </ResumeProvider>
  );
}
