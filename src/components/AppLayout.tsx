import { ReactNode } from "react";
import AppSidebar from "./AppSidebar";

const AppLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-screen gradient-dark">
      <AppSidebar />
      <main className="ml-56 min-h-screen">
        <div className="p-6 max-w-[1400px]">{children}</div>
      </main>
    </div>
  );
};

export default AppLayout;
