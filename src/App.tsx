import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { fetchFixturesForLeagues } from "@/services/footballService";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import Index from "./pages/Index";
import MatchPage from "./pages/MatchPage";
import NotFound from "./pages/NotFound";
import AdminStreams from "./pages/AdminStreams";
import AdminDashboard from "./pages/AdminDashboard";
import AdminScanner from "./pages/AdminScanner";

const queryClient = new QueryClient();
const AdminAccessButton = () => {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        zIndex: 9999,
        background: "red",
        color: "white",
        padding: "15px",
        borderRadius: "8px",
        fontWeight: "bold",
        cursor: "pointer",
        border: "none",
        boxShadow: "0px 4px 10px rgba(0,0,0,0.3)"
      }}
      onClick={() => navigate("/admin-streams")}
    >
      ADMIN ACCESS
    </button>
  );
}

const App = () => {
useEffect(() => {
fetchFixturesForLeagues()
.then((data) => {
if (Array.isArray(data) && data.length > 0) {
queryClient.setQueryData(["supabase-matches"], data);
}
})
.catch((err) => console.warn(err));
}, []);

return (
<AppErrorBoundary>
<QueryClientProvider client={queryClient}>
<TooltipProvider>
<Toaster />
<Sonner />
<BrowserRouter>
<AdminAccessButton />
<Routes>
<Route path="/" element={<Index />} />
<Route path="/match/:id" element={<MatchPage />} />
<Route path="/admin-streams" element={<AdminStreams />} />
<Route path="/admin" element={<AdminDashboard />} />
<Route path="/admin-panel" element={<AdminDashboard />} />
<Route path="/admin/scanner" element={<AdminScanner />} />
<Route path="*" element={<NotFound />} />
</Routes>
</BrowserRouter>
</TooltipProvider>
</QueryClientProvider>
</AppErrorBoundary>
);
};

export default App;
