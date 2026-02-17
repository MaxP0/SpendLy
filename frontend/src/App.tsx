import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Invoices from "./pages/Invoices";
import Expenses from "./pages/Expenses";
import Tax from "./pages/Tax";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Wrapper component for pages with layout
const PageWithLayout = ({ children }: { children: React.ReactNode }) => (
  <AppLayout>{children}</AppLayout>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PageWithLayout><Dashboard /></PageWithLayout>} />
          <Route path="/quotes" element={<PageWithLayout><Dashboard /></PageWithLayout>} />
          <Route path="/invoices" element={<PageWithLayout><Invoices /></PageWithLayout>} />
          <Route path="/payments" element={<PageWithLayout><Dashboard /></PageWithLayout>} />
          <Route path="/expenses" element={<PageWithLayout><Expenses /></PageWithLayout>} />
          <Route path="/transactions" element={<PageWithLayout><Dashboard /></PageWithLayout>} />
          <Route path="/tax" element={<PageWithLayout><Tax /></PageWithLayout>} />
          <Route path="/reports" element={<PageWithLayout><Dashboard /></PageWithLayout>} />
          <Route path="/settings" element={<PageWithLayout><Dashboard /></PageWithLayout>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
