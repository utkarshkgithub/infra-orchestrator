import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import ProtectedRoute from "./components/ProtectedRoute";

import LandingPage from "./pages/LandingPage";
import DashboardPage from "./pages/projects/DashboardPage";
import NewProjectPage from "./pages/projects/NewProjectPage";
import ProjectDetailPage from "./pages/projects/ProjectDetailPage";
import DeploymentDetailPage from "./pages/projects/DeploymentDetailPage";
import DeploymentsListPage from "./pages/projects/DeploymentsListPage";

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Navigate to="/" replace />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/projects" element={<DashboardPage />} />
              <Route path="/projects/new" element={<NewProjectPage />} />
              <Route path="/projects/:id" element={<ProjectDetailPage />} />
              <Route path="/deployments" element={<DeploymentsListPage />} />
              <Route
                path="/deployments/:id"
                element={<DeploymentDetailPage />}
              />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
