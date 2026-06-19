import {
  ClipboardCheck,
  Eye,
  FileCheck2,
  Package,
  PlusCircle,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type FormConfigurationTabId =
  | "estrutura"
  | "pacotes"
  | "adicionais"
  | "pagamento"
  | "aceites"
  | "preview";

export interface FormConfigurationTab {
  description: string;
  icon: LucideIcon;
  id: FormConfigurationTabId;
  label: string;
}

export const FORM_CONFIGURATION_TABS: FormConfigurationTab[] = [
  {
    id: "estrutura",
    label: "Estrutura",
    description: "Blocos padrão, campos personalizados, categorias e destinos de uso",
    icon: FileCheck2,
  },
  {
    id: "pacotes",
    label: "Pacotes",
    description: "Catálogo de pacotes, preços, itens inclusos e regras",
    icon: Package,
  },
  {
    id: "adicionais",
    label: "Adicionais",
    description: "Itens extras, categorias e tipos de cobrança",
    icon: PlusCircle,
  },
  {
    id: "pagamento",
    label: "Pagamento",
    description: "Formas de pagamento e regras financeiras do espaço",
    icon: Wallet,
  },
  {
    id: "aceites",
    label: "Aceites e Regras",
    description: "Termos obrigatórios e opcionais para o cliente",
    icon: ClipboardCheck,
  },
  {
    id: "preview",
    label: "Preview",
    description: "Visualização simulada do formulário final",
    icon: Eye,
  },
];

export const DEFAULT_FORM_CONFIGURATION_TAB: FormConfigurationTabId = "estrutura";

/** Abas editáveis só nos passos dedicados da configuração guiada (pacotes, adicionais, financeiro). */
export const GUIDED_FORM_CONFIGURATION_TAB_IDS: FormConfigurationTabId[] = [
  "estrutura",
  "aceites",
  "preview",
];

export const getFormConfigurationTabs = (guidedMode = false) =>
  guidedMode
    ? FORM_CONFIGURATION_TABS.filter((tab) => GUIDED_FORM_CONFIGURATION_TAB_IDS.includes(tab.id))
    : FORM_CONFIGURATION_TABS;

export const isFormConfigurationTabId = (value: string | null): value is FormConfigurationTabId =>
  FORM_CONFIGURATION_TABS.some((tab) => tab.id === value);
