import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import CRM from "./pages/CRM.tsx";
import Calendario from "./pages/Calendario.tsx";
import Relatorios from "./pages/Relatorios.tsx";
import Configuracoes from "./pages/Configuracoes.tsx";
import EventoDetalhe from "./pages/EventoDetalhe.tsx";
import Contratar from "./pages/Contratar.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/crm" element={<CRM />} />
          <Route path="/crm/evento/:id" element={<EventoDetalhe />} />
          <Route path="/calendario" element={<Calendario />} />
          <Route path="/relatorios" element={<Relatorios />} />
          <Route path="/configuracoes" element={<Configuracoes />} />
          <Route path="/contratar" element={<Contratar />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
