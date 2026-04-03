import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculateNutrition } from '@/lib/units'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const recipe = await prisma.recipe.findUnique({
      where: { id },
      include: {
        ingredients: {
          include: { food: true },
        },
      },
    })

    if (!recipe) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    let totalCalories = 0
    let totalProtein = 0
    let totalCarbs = 0
    let totalFat = 0
    let totalFiber = 0

    recipe.ingredients.forEach((ing) => {
      const nutrition = calculateNutrition(ing.quantity, ing.unit, {
        calories: ing.food.calories,
        protein: ing.food.protein ?? 0,
        carbs: ing.food.carbs ?? 0,
        fat: ing.food.fat ?? 0,
        fiber: ing.food.fiber ?? 0,
      })

      totalCalories += nutrition.calories
      totalProtein += nutrition.protein
      totalCarbs += nutrition.carbs
      totalFat += nutrition.fat
      totalFiber += nutrition.fiber
    })

    const perServing = recipe.servings > 0 ? recipe.servings : 1

    return NextResponse.json({
      total: {
        calories: Math.round(totalCalories),
        protein: parseFloat(totalProtein.toFixed(1)),
        carbs: parseFloat(totalCarbs.toFixed(1)),
        fat: parseFloat(totalFat.toFixed(1)),
        fiber: parseFloat(totalFiber.toFixed(1)),
      },
      perServing: {
        calories: Math.round(totalCalories / perServing),
        protein: parseFloat((totalProtein / perServing).toFixed(1)),
        carbs: parseFloat((totalCarbs / perServing).toFixed(1)),
        fat: parseFloat((totalFat / perServing).toFixed(1)),
        fiber: parseFloat((totalFiber / perServing).toFixed(1)),
      },
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
