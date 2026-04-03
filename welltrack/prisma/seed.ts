import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const foods = [
  { name: 'Chicken Breast', calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, defaultUnit: 'g' },
  { name: 'Brown Rice', calories: 123, protein: 2.7, carbs: 26, fat: 1, fiber: 1.8, defaultUnit: 'cup' },
  { name: 'Broccoli', calories: 34, protein: 2.8, carbs: 7, fat: 0.4, fiber: 2.6, defaultUnit: 'cup' },
  { name: 'Egg (Whole)', calories: 155, protein: 13, carbs: 1.1, fat: 11, fiber: 0, defaultUnit: 'unit' },
  { name: 'Banana', calories: 89, protein: 1.1, carbs: 23, fat: 0.3, fiber: 2.6, defaultUnit: 'unit' },
  { name: 'Greek Yogurt', calories: 59, protein: 10, carbs: 3.6, fat: 0.7, fiber: 0, defaultUnit: 'cup' },
  { name: 'Sweet Potato', calories: 86, protein: 1.6, carbs: 20, fat: 0.1, fiber: 3, defaultUnit: 'unit' },
  { name: 'Salmon', calories: 208, protein: 20, carbs: 0, fat: 13, fiber: 0, defaultUnit: 'g' },
  { name: 'Oats (Rolled)', calories: 389, protein: 16.9, carbs: 66, fat: 6.9, fiber: 10.6, defaultUnit: 'cup' },
  { name: 'Almonds', calories: 579, protein: 21, carbs: 22, fat: 49, fiber: 12.5, defaultUnit: 'oz' },
  { name: 'Spinach', calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, fiber: 2.2, defaultUnit: 'cup' },
  { name: 'Avocado', calories: 160, protein: 2, carbs: 8.5, fat: 15, fiber: 6.7, defaultUnit: 'unit' },
  { name: 'Whole Wheat Bread', calories: 247, protein: 13, carbs: 41, fat: 3.4, fiber: 7, defaultUnit: 'slice' },
  { name: 'Milk (Whole)', calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3, fiber: 0, defaultUnit: 'cup' },
  { name: 'Peanut Butter', calories: 588, protein: 25, carbs: 20, fat: 50, fiber: 6, defaultUnit: 'tbsp' },
  { name: 'Olive Oil', calories: 884, protein: 0, carbs: 0, fat: 100, fiber: 0, defaultUnit: 'tbsp' },
  { name: 'Apple', calories: 52, protein: 0.3, carbs: 14, fat: 0.2, fiber: 2.4, defaultUnit: 'unit' },
  { name: 'Orange', calories: 47, protein: 0.9, carbs: 12, fat: 0.1, fiber: 2.4, defaultUnit: 'unit' },
  { name: 'Tomato', calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, fiber: 1.2, defaultUnit: 'unit' },
  { name: 'Cucumber', calories: 15, protein: 0.7, carbs: 3.6, fat: 0.1, fiber: 0.5, defaultUnit: 'cup' },
  { name: 'Tuna (Canned)', calories: 116, protein: 26, carbs: 0, fat: 1, fiber: 0, defaultUnit: 'g' },
  { name: 'Cottage Cheese', calories: 98, protein: 11, carbs: 3.4, fat: 4.3, fiber: 0, defaultUnit: 'cup' },
  { name: 'Quinoa', calories: 120, protein: 4.4, carbs: 21, fat: 1.9, fiber: 2.8, defaultUnit: 'cup' },
  { name: 'Black Beans', calories: 132, protein: 8.9, carbs: 24, fat: 0.5, fiber: 8.7, defaultUnit: 'cup' },
  { name: 'Lentils', calories: 116, protein: 9, carbs: 20, fat: 0.4, fiber: 7.9, defaultUnit: 'cup' },
  { name: 'Turkey Breast', calories: 135, protein: 30, carbs: 0, fat: 1, fiber: 0, defaultUnit: 'g' },
  { name: 'Cheddar Cheese', calories: 403, protein: 25, carbs: 1.3, fat: 33, fiber: 0, defaultUnit: 'oz' },
  { name: 'Mozzarella', calories: 280, protein: 28, carbs: 3.1, fat: 17, fiber: 0, defaultUnit: 'oz' },
  { name: 'Honey', calories: 304, protein: 0.3, carbs: 82, fat: 0, fiber: 0.2, defaultUnit: 'tbsp' },
  { name: 'Rice (White)', calories: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4, defaultUnit: 'cup' },
]

async function main() {
  console.log('Seeding foods...')

  const existing = await prisma.food.findMany({
    where: { source: 'system' },
    select: { name: true },
  })
  const existingNames = new Set(existing.map((f) => f.name))

  const toCreate = foods.filter((f) => !existingNames.has(f.name))

  if (toCreate.length === 0) {
    console.log('All system foods already exist')
    return
  }

  await prisma.food.createMany({
    data: toCreate.map((f) => ({ ...f, source: 'system' })),
  })

  console.log(`Seeded ${toCreate.length} new foods (${foods.length} total)`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
