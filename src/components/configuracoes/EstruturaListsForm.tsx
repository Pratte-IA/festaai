import type { EstruturaBlock } from "@/data/packagesData";
import { itemSuggestions } from "@/data/packageTemplates";
import { ItemList } from "@/components/ItemList";

export interface EstruturaListsFormProps {
  value: EstruturaBlock;
  onChange: (next: EstruturaBlock) => void;
}

export const EstruturaListsForm = ({ value, onChange }: EstruturaListsFormProps) => {
  return (
    <div className="space-y-6">
      <ItemList
        label="Brinquedos"
        items={value.brinquedos}
        suggestions={itemSuggestions.brinquedos}
        onChange={(v) => onChange({ ...value, brinquedos: v })}
      />
    </div>
  );
};
