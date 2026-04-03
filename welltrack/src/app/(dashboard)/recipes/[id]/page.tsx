'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/Button'

interface Recipe {
  id: string
  name: string
  description: string | null
  servings: number
  isPublic: boolean
  ingredients: {
    id: string
    quantity: number
    unit: string
    food: {
      id: string
      name: string
      calories: number
      protein: number | null
      carbs: number | null
      fat: number | null
    }
  }[]
}

export default function RecipeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { status } = useSession()
  const router = useRouter()
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(true)
  const [recipeId, setRecipeId] = useState('')

  useEffect(() => {
    params.then((p) => setRecipeId(p.id))
  }, [params])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    if (status === 'authenticated' && recipeId) {
      fetchRecipe()
    }
  }, [status, router, recipeId])

  const fetchRecipe = async () => {
    try {
      const res = await fetch(`/api/recipes/${recipeId}`)
      const data = await res.json()
      setRecipe(data.recipe)
    } catch {
      console.error('Failed to fetch recipe')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      await fetch(`/api/recipes/${recipeId}`, { method: 'DELETE' })
      router.push('/recipes')
    } catch {
      console.error('Failed to delete recipe')
    }
  }

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-gray-500">Loading...</div>
  }

  if (!recipe) {
    return <div className="text-center text-gray-500">Recipe not found</div>
  }

  let totalCalories = 0
  let totalProtein = 0
  let totalCarbs = 0
  let totalFat = 0

  recipe.ingredients.forEach((ing) => {
    const ratio = ing.quantity / 100
    totalCalories += ing.food.calories * ratio
    totalProtein += (ing.food.protein ?? 0) * ratio
    totalCarbs += (ing.food.carbs ?? 0) * ratio
    totalFat += (ing.food.fat ?? 0) * ratio
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.push('/recipes')}>
          ← Back to Recipes
        </Button>
        <Button variant="destructive" onClick={handleDelete}>Delete Recipe</Button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{recipe.name}</h1>
          {recipe.isPublic && (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
              Public
            </span>
          )}
        </div>

        {recipe.description && (
          <p className="text-gray-600">{recipe.description}</p>
        )}

        <div className="flex gap-4 text-sm text-gray-500">
          <span>{recipe.servings} serving{recipe.servings > 1 ? 's' : ''}</span>
          <span>{recipe.ingredients.length} ingredient{recipe.ingredients.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Ingredients</h2>
        <div className="mt-4 space-y-2">
          {recipe.ingredients.map((ing) => (
            <div
              key={ing.id}
              className="flex items-center justify-between rounded-lg border border-gray-100 p-3"
            >
              <span className="font-medium text-gray-900">{ing.food.name}</span>
              <span className="text-sm text-gray-500">
                {ing.quantity} {ing.unit}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Nutrition</h2>
        <div className="mt-4 grid grid-cols-4 gap-4">
          <div className="rounded-lg bg-orange-50 p-3 text-center">
            <p className="text-2xl font-bold text-orange-600">{Math.round(totalCalories)}</p>
            <p className="text-xs text-gray-500">Calories</p>
          </div>
          <div className="rounded-lg bg-blue-50 p-3 text-center">
            <p className="text-2xl font-bold text-blue-600">{totalProtein.toFixed(1)}g</p>
            <p className="text-xs text-gray-500">Protein</p>
          </div>
          <div className="rounded-lg bg-green-50 p-3 text-center">
            <p className="text-2xl font-bold text-green-600">{totalCarbs.toFixed(1)}g</p>
            <p className="text-xs text-gray-500">Carbs</p>
          </div>
          <div className="rounded-lg bg-yellow-50 p-3 text-center">
            <p className="text-2xl font-bold text-yellow-600">{totalFat.toFixed(1)}g</p>
            <p className="text-xs text-gray-500">Fat</p>
          </div>
        </div>
        {recipe.servings > 1 && (
          <p className="mt-3 text-sm text-gray-500">
            Per serving: {Math.round(totalCalories / recipe.servings)} cal • P: {(totalProtein / recipe.servings).toFixed(1)}g • C: {(totalCarbs / recipe.servings).toFixed(1)}g • F: {(totalFat / recipe.servings).toFixed(1)}g
          </p>
        )}
      </div>
    </div>
  )
}
