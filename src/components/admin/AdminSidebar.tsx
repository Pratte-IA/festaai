import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Building2,
  FileText,
  Handshake,
  LayoutDashboard,
  LayoutGrid,
  LifeBuoy,
  LogOut,
  MessageCircle,
  PlugZap,
  Radar,
  UserCircle,
  X,
  type LucideIcon,
} from "lucide-react";

import { useAuth } from "@/features/auth";
import { useAdminCommercialLeads } from "@/features/comercial";
import { usePlatformWhatsappConversations } from "@/features/platform-whatsapp";
import { toast } from "@/hooks/use-toast";

interface NavItem {
  icon: LucideIcon;
  label: string;
  path: string;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    items: [{ icon: LayoutDashboard, label: "Dashboard", path: "/admin" }],
  },
  {
    title: "Vendas",
    items: [
      { icon: Radar, label: "Radar Comercial", path: "/admin/radar" },
      { icon: LayoutGrid, label: "CRM", path: "/admin/crm" },
      { icon: MessageCircle, label: "WhatsApp", path: "/admin/whatsapp" },
      { icon: Handshake, label: "Planos SobMedida", path: "/admin/comercial" },
    ],
  },
  {
    title: "Gestão",
    items: [
      { icon: Building2, label: "Clientes", path: "/admin/clientes" },
      { icon: FileText, label: "Contratos", path: "/admin/comercial/contratos" },
      { icon: LifeBuoy, label: "Solicitações", path: "/admin/agent-requests" },
    ],
  },
  {
    title: "Sistema",
    items: [{ icon: PlugZap, label: "Conexões", path: "/admin/conexoes" }],
  },
];

function isNavItemActive(pathname: string, path: string) {
  if (path === "/admin") {
    return pathname === "/admin";
  }

  if (path === "/admin/clientes") {
    return pathname === "/admin/clientes" || pathname.startsWith("/admin/tenants");
  }

  if (path === "/admin/comercial") {
    return (
      pathname === "/admin/comercial" ||
      (pathname.startsWith("/admin/comercial/") && !pathname.startsWith("/admin/comercial/contratos"))
    );
  }

  return pathname === path || pathname.startsWith(`${path}/`);
}

interface AdminSidebarProps {
  open: boolean;
  onClose: () => void;
}

function NavBadge({ count, label }: { count: number; label: string }) {
  if (count <= 0) return null;

  return (
    <span
      className="ml-auto flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-semibold leading-none text-destructive-foreground"
      aria-label={`${count} ${label}`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

export const AdminSidebar = ({ open, onClose }: AdminSidebarProps) => {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut, user } = useAuth();
  const { data: whatsappConversations = [] } = usePlatformWhatsappConversations();
  const { data: newCommercialLeads = [] } = useAdminCommercialLeads("novo");

  const unreadWhatsappCount = whatsappConversations.filter((conversation) => conversation.is_unread).length;
  const newLeadsCount = newCommercialLeads.length;

  const badgeByPath: Record<string, { count: number; label: string }> = {
    "/admin/whatsapp": {
      count: unreadWhatsappCount,
      label: unreadWhatsappCount === 1 ? "conversa para responder" : "conversas para responder",
    },
    "/admin/comercial": {
      count: newLeadsCount,
      label: newLeadsCount === 1 ? "proposta sob medida nova" : "propostas sob medida novas",
    },
  };

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
    <>
      {open ? (
        <button
          type="button"
          aria-label="Fechar menu"
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px] md:hidden"
          onClick={onClose}
        />
      ) : null}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-60 flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-300 ease-in-out md:translate-x-0 md:shadow-none ${
          open ? "translate-x-0 shadow-xl" : "-translate-x-full pointer-events-none md:pointer-events-auto"
        }`}
      >
        <div className="flex h-16 min-w-0 items-center justify-between border-b border-sidebar-border px-4">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg">
              <img
                src="/favicon%20simbolo1.svg?v=2"
                alt="FestaAI"
                className="h-8 w-8 object-contain"
              />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-sidebar-accent-foreground">Admin FestaAI</p>
              <p className="truncate text-[11px] text-muted-foreground">Plataforma</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar menu"
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground md:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-4">
          <div className="space-y-5">
            {navSections.map((section) => (
              <div key={section.title ?? "main"}>
                {section.title ? (
                  <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {section.title}
                  </p>
                ) : null}
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = isNavItemActive(location.pathname, item.path);
                    const badge = badgeByPath[item.path];

                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={onClose}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200 ${
                          isActive
                            ? "bg-primary/15 text-primary"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        }`}
                      >
                        <item.icon className={`h-5 w-5 flex-shrink-0 ${isActive ? "text-primary" : ""}`} />
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">{item.label}</span>
                        {badge && badge.count > 0 ? (
                          <NavBadge count={badge.count} label={badge.label} />
                        ) : isActive ? (
                          <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                        ) : null}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>

        <div
          className="mx-2 mb-2 rounded-lg border border-sidebar-border bg-sidebar-accent/40 p-2.5"
          role="group"
          aria-label="Conta"
        >
          <div className="flex gap-2">
            <UserCircle className="mt-0.5 h-4 w-4 shrink-0 text-sidebar-foreground" aria-hidden />
            <p className="min-w-0 truncate text-[11px] leading-snug text-sidebar-accent-foreground">
              {profile?.email ?? user?.email ?? "Administrador"}
            </p>
          </div>
        </div>

        <button
          onClick={() => void handleSignOut()}
          disabled={isSigningOut}
          className="mx-2 mb-3 flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground disabled:cursor-not-allowed disabled:opacity-60"
          type="button"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          <span>{isSigningOut ? "Saindo..." : "Sair"}</span>
        </button>
      </aside>
    </>
  );
};
