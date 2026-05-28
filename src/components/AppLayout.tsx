import { ReactNode, useCallback, useEffect, useState } from "react";
import { PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import AppSidebar from "./AppSidebar";

const AppLayout = ({ children }: { children: ReactNode }) => {
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
    <div className="min-h-screen gradient-dark">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Fechar menu"
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[1px]"
          onClick={closeSidebar}
        />
      )}

      <AppSidebar open={sidebarOpen} onClose={closeSidebar} />

      <main className="min-h-screen w-full">
        <header className="sticky top-0 z-30 flex h-14 items-center border-b border-border/40 bg-background/60 px-4 backdrop-blur-sm">
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
        </header>
        <div className="w-full p-6">{children}</div>
      </main>
    </div>
  );
};

export default AppLayout;
