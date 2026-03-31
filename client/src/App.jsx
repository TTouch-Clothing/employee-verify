import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { setAuthToken, warmUpApi, shouldWarmApi } from "./api/http";

import VerifyPage from "./pages/VerifyPage.jsx";
import AdminLogin from "./pages/AdminLogin.jsx";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.jsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.jsx";
import AdminLayout from "./pages/AdminLayout.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import EmployeesPage from "./pages/EmployeesPage.jsx";
import LogsPage from "./pages/LogsPage.jsx";
import ChangePasswordPage from "./pages/ChangePasswordPage.jsx";

function Protected({ children }) {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  setAuthToken(token);
  return children;
}

export default function App() {
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setAuthToken(token);
    }

    warmUpApi(true);

    const handleFocus = () => {
      if (shouldWarmApi()) {
        warmUpApi(true);
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible" && shouldWarmApi()) {
        warmUpApi(true);
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<VerifyPage />} />
        <Route path="/verify" element={<VerifyPage />} />

        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/admin/reset-password" element={<ResetPasswordPage />} />

        <Route
          path="/admin"
          element={
            <Protected>
              <AdminLayout />
            </Protected>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="employees" element={<EmployeesPage />} />
          <Route path="logs" element={<LogsPage />} />
          <Route path="change-password" element={<ChangePasswordPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/verify" replace />} />
      </Routes>
    </BrowserRouter>
  );
}