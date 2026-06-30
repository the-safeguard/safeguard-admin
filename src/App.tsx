import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import { MainLayout } from "./components/layout/MainLayout";
import { Login } from "./pages/Login";
import { AcceptInvite } from "./pages/AcceptInvite";
import { Dashboard } from "./pages/Dashboard";
import { Alerts } from "./pages/Alerts";
import { Discovery } from "./pages/Discovery";
import { Policies } from "./pages/Policies";
import { Knowledge } from "./pages/Knowledge";
import { Users } from "./pages/Users";
import { Logs } from "./pages/Logs";
import { Extensions } from "./pages/Extensions";
import { Settings } from "./pages/Settings";
import type { ReactNode } from "react";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
});

function Protected({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  if (!ready) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <MainLayout>{children}</MainLayout>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/accept-invite" element={<AcceptInvite />} />
            <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
            <Route path="/alerts" element={<Protected><Alerts /></Protected>} />
            <Route path="/discovery" element={<Protected><Discovery /></Protected>} />
            <Route path="/policies" element={<Protected><Policies /></Protected>} />
            <Route path="/knowledge" element={<Protected><Knowledge /></Protected>} />
            <Route path="/users" element={<Protected><Users /></Protected>} />
            <Route path="/logs" element={<Protected><Logs /></Protected>} />
            <Route path="/extensions" element={<Protected><Extensions /></Protected>} />
            <Route path="/settings" element={<Protected><Settings /></Protected>} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
