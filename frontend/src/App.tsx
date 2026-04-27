import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AuthProvider } from "@/contexts/AuthContext";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import Inquiries from "./pages/Inquiries";
import Login from "./pages/Login";
import PublicQuote from "./pages/PublicQuote";
import Register from "./pages/Register";
import Invoices from "./pages/Invoices";
import Expenses from "./pages/Expenses";
import Tax from "./pages/Tax";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Wrapper component for pages with layout
const PageWithLayout = ({ children }: { children: React.ReactNode }) => (
  <AppLayout>{children}</AppLayout>
);

const ProtectedPage = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <PageWithLayout>{children}</PageWithLayout>
  </ProtectedRoute>
);

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/q/:token" element={<PublicQuote />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<ProtectedPage><Dashboard /></ProtectedPage>} />
            <Route path="/customers" element={<ProtectedPage><Customers /></ProtectedPage>} />
            <Route path="/inquiries" element={<ProtectedPage><Inquiries /></ProtectedPage>} />
            <Route path="/quotes" element={<Navigate to="/inquiries" replace />} />
            <Route path="/invoices" element={<ProtectedPage><Invoices /></ProtectedPage>} />
            <Route path="/transactions" element={<ProtectedPage><NotFound /></ProtectedPage>} />
            <Route path="/expenses" element={<ProtectedPage><Expenses /></ProtectedPage>} />
            <Route path="/income" element={<ProtectedPage><NotFound /></ProtectedPage>} />
            <Route path="/tax" element={<ProtectedPage><Tax /></ProtectedPage>} />
            <Route path="/reports" element={<ProtectedPage><NotFound /></ProtectedPage>} />
            <Route path="/settings" element={<ProtectedPage><NotFound /></ProtectedPage>} />
            <Route path="*" element={<ProtectedPage><NotFound /></ProtectedPage>} />
          </Routes>
          {import.meta.env.DEV ? <ReactQueryDevtools initialIsOpen={false} /> : null}
        </TooltipProvider>
      </QueryClientProvider>
    </AuthProvider>
  </BrowserRouter>
);

export default App;
