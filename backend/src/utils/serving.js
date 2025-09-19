// utils/serving.js
/**
 * คำนวณ serving size จากรายการวัตถุดิบ (sum ของ quantity)
 * - รองรับตัวเลือกปัดทศนิยม และ filter คัดบางวัตถุดิบออกได้
 */
export function computeServingSize(ingredients = [], opts = {}) {
  const { decimals = null, filter } = opts;

  const total = (ingredients || [])
    .filter(ing => (typeof filter === 'function' ? filter(ing) : true))
    .reduce((sum, ing) => sum + Number(ing?.quantity ?? ing?.FoodIngredient?.quantity ?? 0), 0);

  return typeof decimals === 'number' ? Number(total.toFixed(decimals)) : total;
}