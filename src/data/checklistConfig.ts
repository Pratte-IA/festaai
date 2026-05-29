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

export interface ChecklistCategoryTemplate {
  name: string;
  items: string[];
}

export const defaultChecklistTemplate: ChecklistCategoryTemplate[] = [
  {
    name: "Equipe de Limpeza",
    items: ["Contratar equipe"],
  },
  {
    name: "Decoração",
    items: ["Contratar decoradora", "Alinhar decoração com a mãe"],
  },
  {
    name: "Buffet",
    items: ["Salgado", "Doce", "Bolo", "Bebidas sem álcool"],
  },
  {
    name: "Equipe da Festa",
    items: ["Recepcionista", "Copeira", "Garçom", "Monitora"],
  },
];

export const defaultChecklistConfig: ChecklistCategory[] = defaultChecklistTemplate.map(
  (category, categoryIndex) => ({
    id: `cat-${categoryIndex}`,
    name: category.name,
    active: true,
    items: category.items.map((label, itemIndex) => ({
      id: `cat-${categoryIndex}-item-${itemIndex}`,
      label,
      active: true,
    })),
  })
);

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
