export interface ChecklistItem {
  id: string;
  label: string;
  active: boolean;
}

export interface ChecklistCategory {
  id: string;
  name: string;
  active: boolean;
  items: ChecklistItem[];
}

export const defaultChecklistConfig: ChecklistCategory[] = [
  {
    id: "buffet",
    name: "Buffet",
    active: true,
    items: [
      { id: "buffet-1", label: "Confirmar cardápio com o cliente", active: true },
      { id: "buffet-2", label: "Encomendar bolo", active: true },
      { id: "buffet-3", label: "Confirmar fornecedor de salgados", active: true },
      { id: "buffet-4", label: "Comprar bebidas", active: true },
      { id: "buffet-5", label: "Preparar mesa de doces", active: true },
    ],
  },
  {
    id: "decoracao",
    name: "Decoração",
    active: true,
    items: [
      { id: "deco-1", label: "Definir tema com o cliente", active: true },
      { id: "deco-2", label: "Comprar balões e painéis", active: true },
      { id: "deco-3", label: "Montar decoração da mesa principal", active: true },
      { id: "deco-4", label: "Preparar lembrancinhas", active: true },
      { id: "deco-5", label: "Arrumar espaço da festa", active: true },
    ],
  },
  {
    id: "equipe",
    name: "Equipe",
    active: true,
    items: [
      { id: "equipe-1", label: "Escalar monitores", active: true },
      { id: "equipe-2", label: "Confirmar DJ / som", active: true },
      { id: "equipe-3", label: "Confirmar fotógrafo", active: true },
      { id: "equipe-4", label: "Confirmar recepcionista", active: true },
      { id: "equipe-5", label: "Briefing com equipe", active: true },
    ],
  },
];

// Generate a checklist for an event based on active config
export interface EventChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

export interface EventChecklistCategory {
  categoryId: string;
  name: string;
  items: EventChecklistItem[];
}

export const generateEventChecklist = (config: ChecklistCategory[]): EventChecklistCategory[] => {
  return config
    .filter((cat) => cat.active)
    .map((cat) => ({
      categoryId: cat.id,
      name: cat.name,
      items: cat.items
        .filter((item) => item.active)
        .map((item) => ({
          id: item.id,
          label: item.label,
          done: false,
        })),
    }));
};
