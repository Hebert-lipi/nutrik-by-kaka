import type { DraftPlan } from "@/lib/draft-storage";
import { getPatientFacingMeals } from "@/lib/clinical/patient-plan";

export type ShoppingListItem = {
  category: string;
  name: string;
  quantityLabel: string;
  canonicalName: string;
  unitNormalized: string;
  missingQuantity: boolean;
  unitConflict: boolean;
};

export type ShoppingListQuality = {
  totalItems: number;
  missingQuantityCount: number;
  unitConflictCount: number;
};

function categoryForItem(groupName: string, itemName: string): string {
  const x = `${groupName} ${itemName}`.toLowerCase();
  if (/(frango|carne|peixe|ovo|atum|patinho|prote)/.test(x)) return "Proteínas";
  if (/(banana|maçã|fruta|mamão|uva|laranja|abacate)/.test(x)) return "Frutas";
  if (/(alface|tomate|legume|verdura|couve|br[óo]colis|cenoura)/.test(x)) return "Vegetais";
  if (/(leite|iogurte|queijo|coalhada|kefir)/.test(x)) return "Laticínios";
  if (/(arroz|aveia|p[ãa]o|macarr[ãa]o|cereal|granola|feij[ãa]o)/.test(x)) return "Grãos e cereais";
  return "Outros";
}

function normalizeText(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeItemName(name: string): string {
  let out = normalizeText(name);
  out = out.replace(/\b(integral|desnatado|light|zero|sem lactose)\b/g, "").replace(/\s+/g, " ").trim();
  return out || normalizeText(name);
}

function normalizeUnit(raw: string): string {
  const u = normalizeText(raw);
  if (!u) return "un";
  if (/(^g$|grama|gramas)/.test(u)) return "g";
  if (/(^kg$|quilo|quilos)/.test(u)) return "kg";
  if (/(^ml$|mililitro|mililitros)/.test(u)) return "ml";
  if (/(^l$|litro|litros)/.test(u)) return "l";
  if (/(xicara|xic|xicaras)/.test(u)) return "xícara";
  if (/(colher|colheres|cs|cha)/.test(u)) return "colher";
  if (/(porcao|porcoes|porção|porções)/.test(u)) return "porção";
  if (/(unidade|unidades|un|und)/.test(u)) return "un";
  return raw.trim().toLowerCase() || "un";
}

function quantityLabel(totalQty: number, unitNormalized: string, missingQuantity: boolean): string {
  if (totalQty > 0) return `${Math.round(totalQty * 10) / 10} ${unitNormalized}`;
  if (missingQuantity) return "quantidade orientada pela nutricionista";
  return "quantidade orientada pela nutricionista";
}

export function buildShoppingListFromPlan(plan: DraftPlan): ShoppingListItem[] {
  const meals = getPatientFacingMeals(plan);
  const bucket = new Map<string, { category: string; name: string; canonicalName: string; totalQty: number; unitNormalized: string; missingQuantity: boolean; unitConflict: boolean }>();
  const unitsByCanonical = new Map<string, Set<string>>();

  for (const meal of meals) {
    for (const group of meal.groups) {
      for (const option of group.options) {
        const name = option.name.trim();
        if (!name) continue;
        const category = categoryForItem(group.name, name);
        const canonicalName = normalizeItemName(name);
        const unitNormalized = normalizeUnit(option.unit);
        const key = `${category}::${canonicalName}::${unitNormalized}`;
        const current = bucket.get(key) ?? {
          category,
          name,
          canonicalName,
          totalQty: 0,
          unitNormalized,
          missingQuantity: false,
          unitConflict: false,
        };
        if (option.quantity > 0) current.totalQty += option.quantity;
        else current.missingQuantity = true;
        bucket.set(key, current);

        const units = unitsByCanonical.get(canonicalName) ?? new Set<string>();
        units.add(unitNormalized);
        unitsByCanonical.set(canonicalName, units);
      }
    }
  }

  const consolidated = [...bucket.values()]
    .map((x) => ({
      category: x.category,
      name: x.name,
      canonicalName: x.canonicalName,
      unitNormalized: x.unitNormalized,
      missingQuantity: x.missingQuantity,
      unitConflict: (unitsByCanonical.get(x.canonicalName)?.size ?? 0) > 1,
      quantityLabel: quantityLabel(x.totalQty, x.unitNormalized, x.missingQuantity),
    }))
    .sort((a, b) => a.category.localeCompare(b.category, "pt-BR") || a.name.localeCompare(b.name, "pt-BR"));
  return consolidated;
}

export function summarizeShoppingQuality(items: ShoppingListItem[]): ShoppingListQuality {
  return {
    totalItems: items.length,
    missingQuantityCount: items.filter((x) => x.missingQuantity).length,
    unitConflictCount: items.filter((x) => x.unitConflict).length,
  };
}

export function groupShoppingByCategory(items: ShoppingListItem[]): Array<{ category: string; items: ShoppingListItem[] }> {
  const categories = [...new Set(items.map((x) => x.category))];
  return categories.map((cat) => ({
    category: cat,
    items: items.filter((x) => x.category === cat),
  }));
}
