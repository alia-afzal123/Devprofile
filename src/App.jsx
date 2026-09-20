import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import ResumeAnalyzer from "./pages/ResumeAnalyzer";
import GitHubAnalyzer from "./pages/GitHubAnalyzer";
import PortfolioAnalyzer from "./pages/PortfolioAnalyzer";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import History from "./pages/History";
import Settings from "./pages/Settings";

import AppLayout from "./layouts/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Routes>
      {/* PUBLIC ROUTES */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* PROTECTED APP */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/resume-analyzer" element={<ResumeAnalyzer />} />
        <Route path="/github-analyzer" element={<GitHubAnalyzer />} />
        <Route
          path="/portfolio-analyzer"
          element={<PortfolioAnalyzer />}
        />
        <Route path="/history" element={<History />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      {/* FALLBACK */}
      <Route path="*" element={<h1>Page Not Found</h1>} />
    </Routes>
  );
}

export default App;