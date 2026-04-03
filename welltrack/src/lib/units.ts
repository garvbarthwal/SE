const UNIT_TO_GRAMS: Record<string, number> = {
  g: 1,
  kg: 1000,
  oz: 28.35,
  lb: 453.6,
  cup: 240,
  tbsp: 15,
  tsp: 5,
  ml: 1,
}

export function toGrams(quantity: number, unit: string): number {
  const factor = UNIT_TO_GRAMS[unit.toLowerCase()] ?? 1
  return quantity * factor
}

export function calculateNutrition(
  quantity: number,
  unit: string,
  nutritionPer100g: {
    calories: number
    protein: number
    carbs: number
    fat: number
    fiber: number
  }
) {
  const grams = toGrams(quantity, unit)
  const ratio = grams / 100

  return {
    calories: Math.round(nutritionPer100g.calories * ratio),
    protein: parseFloat((nutritionPer100g.protein * ratio).toFixed(1)),
    carbs: parseFloat((nutritionPer100g.carbs * ratio).toFixed(1)),
    fat: parseFloat((nutritionPer100g.fat * ratio).toFixed(1)),
    fiber: parseFloat((nutritionPer100g.fiber * ratio).toFixed(1)),
  }
}

export const UNITS = [
  { value: 'g', label: 'Grams (g)' },
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'oz', label: 'Ounces (oz)' },
  { value: 'lb', label: 'Pounds (lb)' },
  { value: 'cup', label: 'Cups' },
  { value: 'tbsp', label: 'Tablespoons (tbsp)' },
  { value: 'tsp', label: 'Teaspoons (tsp)' },
  { value: 'ml', label: 'Milliliters (ml)' },
]
