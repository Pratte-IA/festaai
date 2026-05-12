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
  LogOut,
  UserCircle,
  UserCog,
  Building2,
  CreditCard,
  LifeBuoy,
} from "lucide-react";
import { useAuth } from "@/features/auth";
import { useCurrentTenant } from "@/features/tenants";
import { useTenantAdminCapability } from "@/features/tenants/use-tenant-admin-capability";
import { toast } from "@/hooks/use-toast";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Users, label: "CRM", path: "/crm" },
  { icon: Calendar, label: "Calendário", path: "/calendario" },
  { icon: BarChart3, label: "Relatórios", path: "/relatorios" },
  { icon: CreditCard, label: "Assinatura", path: "/minha-assinatura" },
  { icon: Settings, label: "Configurações", path: "/configuracoes" },
  { icon: UserCog, label: "Usuários", path: "/usuarios" },
];

const AppSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { currentTenant, isLoading: isTenantLoading } = useCurrentTenant();
  const { data: tenantAdminCap } = useTenantAdminCapability();

  const navItemsResolved = tenantAdminCap?.isTenantAdmin
    ? [...navItems, { icon: LifeBuoy, label: "Suporte", path: "/suporte" } as const]
    : navItems;

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
      <div
        className={`flex h-16 items-center border-b border-sidebar-border ${
          collapsed ? "justify-center px-2" : "min-w-0 justify-start px-4"
        }`}
      >
        <img
          src="/horizontal-festaai.svg"
          alt="FestaAI"
          className={
            collapsed
              ? "h-10 w-10 shrink-0 object-cover object-left"
              : "h-10 w-auto max-w-full min-w-0 shrink object-contain object-left"
          }
          loading="eager"
          decoding="async"
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {navItemsResolved.map((item) => {
          const isActive =
            item.path === "/"
              ? location.pathname === "/"
              : location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
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

      {/* Empresa atual + conta (um bloco) */}
      <div
        className="mx-2 mb-2 rounded-lg border border-sidebar-border bg-sidebar-accent/40 p-2.5"
        role="group"
        aria-label={
          collapsed
            ? [
                currentTenant?.name ? `Empresa: ${currentTenant.name}` : null,
                user?.email ? `Conta: ${user.email}` : null,
              ]
                .filter(Boolean)
                .join(". ") || "Empresa e conta"
            : undefined
        }
        title={
          collapsed
            ? [currentTenant?.name, user?.email].filter(Boolean).join(" · ") || undefined
            : undefined
        }
      >
        {collapsed ? (
          <div className="flex flex-col items-center gap-1.5 py-0.5">
            <Building2 className="h-4 w-4 shrink-0 text-primary" aria-hidden />
            <div className="h-3 w-px shrink-0 bg-sidebar-border/70" aria-hidden />
            <UserCircle className="h-4 w-4 shrink-0 text-sidebar-foreground" aria-hidden />
          </div>
        ) : (
          <div className="space-y-2.5">
            <div className="flex gap-2">
              <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-sidebar-accent-foreground">
                  {isTenantLoading ? "Carregando empresa…" : currentTenant?.name ?? "Sem empresa ativa"}
                </p>
                <p className="truncate text-[11px] text-sidebar-foreground">
                  {isTenantLoading ? "…" : currentTenant?.slug ?? "Tenant"}
                </p>
              </div>
            </div>
            <div className="border-t border-sidebar-border/50" />
            <div className="flex gap-2">
              <UserCircle className="mt-0.5 h-4 w-4 shrink-0 text-sidebar-foreground" aria-hidden />
              <p className="min-w-0 truncate text-[11px] leading-snug text-sidebar-accent-foreground">
                {user?.email ?? "Usuário"}
              </p>
            </div>
          </div>
        )}
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
