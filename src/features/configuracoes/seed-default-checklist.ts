import { defaultChecklistTemplate } from "@/data/checklistConfig";
import { supabase } from "@/lib/supabase/client";

export const seedDefaultChecklistForPackage = async (
  tenantId: number,
  packageId: number,
  userId: string
) => {
  for (const [categoryIndex, category] of defaultChecklistTemplate.entries()) {
    const { data: createdCategory, error: categoryError } = await supabase
      .from("tenant_checklist_categories")
      .insert({
        active: true,
        created_by: userId,
        name: category.name,
        package_id: packageId,
        sort_order: categoryIndex,
        tenant_id: tenantId,
        updated_by: userId,
      })
      .select("id")
      .single();

    if (categoryError) throw categoryError;

    if (category.items.length === 0) continue;

    const { error: itemsError } = await supabase.from("tenant_checklist_items").insert(
      category.items.map((label, itemIndex) => ({
        active: true,
        category_id: createdCategory.id,
        created_by: userId,
        label,
        sort_order: itemIndex,
        tenant_id: tenantId,
        updated_by: userId,
      }))
    );

    if (itemsError) throw itemsError;
  }
};
