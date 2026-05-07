import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Settings,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  LogOut,
  UserCircle,
  Building2,
} from "lucide-react";
import { useAuth } from "@/features/auth";
import { useCurrentTenant } from "@/features/tenants";
import { toast } from "@/hooks/use-toast";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Users, label: "CRM", path: "/crm" },
  { icon: Calendar, label: "Calendário", path: "/calendario" },
  { icon: BarChart3, label: "Relatórios", path: "/relatorios" },
  { icon: Settings, label: "Configurações", path: "/configuracoes" },
];

const AppSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { currentTenant, isLoading: isTenantLoading } = useCurrentTenant();

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut();
    setIsSigningOut(false);

    toast({
      title: "Sessão encerrada",
      description: "Você saiu do FestaAI com segurança.",
    });

    navigate("/login", { replace: true });
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border flex flex-col z-50 transition-all duration-300 ${
        collapsed ? "w-16" : "w-56"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 h-16 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4 text-primary-foreground" />
        </div>
        {!collapsed && (
          <span className="text-lg font-bold gradient-text">FestaAI</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                isActive
                  ? "bg-primary/15 text-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-primary" : ""}`} />
              {!collapsed && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
              {isActive && !collapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Tenant */}
      <div className="mx-2 mb-2 rounded-lg border border-sidebar-border bg-sidebar-accent/40 p-2">
        <div className={`flex items-center ${collapsed ? "justify-center" : "gap-2"}`}>
          <Building2 className="h-5 w-5 flex-shrink-0 text-primary" />
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-sidebar-accent-foreground">
                {isTenantLoading ? "Carregando empresa..." : currentTenant?.name ?? "Sem empresa ativa"}
              </p>
              <p className="text-[11px] text-sidebar-foreground">
                {currentTenant?.slug ?? "Tenant"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* User */}
      <div className="mx-2 mb-2 rounded-lg border border-sidebar-border bg-sidebar-accent/40 p-2">
        <div className={`flex items-center ${collapsed ? "justify-center" : "gap-2"}`}>
          <UserCircle className="h-5 w-5 flex-shrink-0 text-sidebar-foreground" />
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-sidebar-accent-foreground">
                {user?.email ?? "Usuário"}
              </p>
              <p className="text-[11px] text-sidebar-foreground">Sessão ativa</p>
            </div>
          )}
        </div>
      </div>

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        disabled={isSigningOut}
        className="mx-2 mb-2 flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground disabled:cursor-not-allowed disabled:opacity-60"
        type="button"
      >
        <LogOut className="h-4 w-4 flex-shrink-0" />
        {!collapsed && <span>{isSigningOut ? "Saindo..." : "Sair"}</span>}
      </button>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="mx-2 mb-4 p-2 rounded-lg text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  );
};

export default AppSidebar;
