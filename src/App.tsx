import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import Index from "./pages/Index";
import MatchPage from "./pages/MatchPage";
import NotFound from "./pages/NotFound";
import AdminStreams from "./pages/AdminStreams";
import AdminDashboard from "./pages/AdminDashboard";

const queryClient = new QueryClient();

// هاد الزر غادي يديك لصفحة الستريمات نيشان باش تجرب
const AdminAccessButton = () => {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => {
        console.log("ADMIN_ACCESS_CLICK");
        navigate("/admin");
      }}
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        zIndex: 9999,
        background: "red",
        color: "white",
        padding: "12px 20px",
        borderRadius: "8px",
        fontWeight: "bold",
        cursor: "pointer",
        border: "none"
      }}
    >
      ADMIN ACCESS
    </button>
  );
};

const App = () => (
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
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
