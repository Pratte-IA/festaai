import { useCallback, useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { PanelLeft } from "lucide-react";

import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Button } from "@/components/ui/button";

export const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeSidebar();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [closeSidebar]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(81,88,231,0.12),transparent_34%),linear-gradient(180deg,#ffffff_0%,#fbf7ff_100%)] text-foreground">
      <AdminSidebar open={sidebarOpen} onClose={closeSidebar} />

      <div className="min-h-screen md:pl-60">
        <header className="sticky top-0 z-30 flex h-14 items-center border-b border-white/60 bg-white/70 px-4 backdrop-blur md:hidden">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Abrir menu"
            aria-expanded={sidebarOpen}
            onClick={() => setSidebarOpen((prev) => !prev)}
          >
            <PanelLeft className="h-5 w-5" />
          </Button>
          <span className="ml-2 text-sm font-semibold">Admin FestaAI</span>
        </header>

        <Outlet />
      </div>
    </div>
  );
};
