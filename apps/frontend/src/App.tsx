import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import NewProjectPage from './pages/dashboard/NewProjectPage';
import ProjectDetailPage from './pages/dashboard/ProjectDetailPage';
import DeploymentDetailPage from './pages/dashboard/DeploymentDetailPage';
import DeploymentsListPage from './pages/dashboard/DeploymentsListPage';

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/dashboard/new" element={<NewProjectPage />} />
              <Route path="/dashboard/project/:id" element={<ProjectDetailPage />} />
              <Route path="/dashboard/deployments" element={<DeploymentsListPage />} />
              <Route path="/dashboard/deployment/:id" element={<DeploymentDetailPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}