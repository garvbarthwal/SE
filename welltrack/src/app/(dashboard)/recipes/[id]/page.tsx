'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, ChefHat, Users, BookOpen, Trash2, Flame, Wheat } from 'lucide-react'

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
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-orange-500 border-t-transparent" />
      </div>
    )
  }

  if (!recipe) {
    return (
      <div className="max-w-5xl mx-auto text-center py-16">
        <ChefHat className="mx-auto h-12 w-12 text-slate-300" />
        <p className="mt-4 text-slate-500">Recipe not found</p>
      </div>
    )
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
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.push('/recipes')} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Recipes
        </Button>
        <Button variant="destructive" onClick={handleDelete} className="flex items-center gap-2">
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 p-1">
        <div className="rounded-xl bg-white p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100">
              <ChefHat className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">{recipe.name}</h1>
                {recipe.isPublic && (
                  <span className="rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-medium text-orange-700">
                    Public
                  </span>
                )}
              </div>
              {recipe.description && (
                <p className="text-sm text-slate-500 mt-0.5">{recipe.description}</p>
              )}
            </div>
          </div>

          <div className="flex gap-4 text-sm text-slate-500">
            <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {recipe.servings} serving{recipe.servings > 1 ? 's' : ''}</span>
            <span className="flex items-center gap-1"><BookOpen className="h-4 w-4" /> {recipe.ingredients.length} ingredient{recipe.ingredients.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-2">
          <Wheat className="h-5 w-5 text-orange-500" />
          <h2 className="text-base font-semibold text-slate-900">Ingredients</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {recipe.ingredients.map((ing) => (
            <div
              key={ing.id}
              className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
            >
              <span className="text-sm font-medium text-slate-900">{ing.food.name}</span>
              <span className="text-sm text-slate-500 bg-slate-50 px-3 py-1 rounded-full">
                {ing.quantity} {ing.unit}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-2 mb-4">
          <Flame className="h-5 w-5 text-orange-500" />
          <h2 className="text-base font-semibold text-slate-900">Nutrition</h2>
        </div>
        <div className="grid grid-cols-4 gap-3">
          <MacroCard value={Math.round(totalCalories)} label="Calories" unit="" color="orange" />
          <MacroCard value={parseFloat(totalProtein.toFixed(1))} label="Protein" unit="g" color="blue" />
          <MacroCard value={parseFloat(totalCarbs.toFixed(1))} label="Carbs" unit="g" color="cyan" />
          <MacroCard value={parseFloat(totalFat.toFixed(1))} label="Fat" unit="g" color="amber" />
        </div>
        {recipe.servings > 1 && (
          <div className="mt-4 p-3 bg-orange-50 rounded-lg">
            <p className="text-sm text-orange-700 font-medium">Per serving</p>
            <p className="text-sm text-orange-600 mt-0.5">
              {Math.round(totalCalories / recipe.servings)} cal · P: {(totalProtein / recipe.servings).toFixed(1)}g · C: {(totalCarbs / recipe.servings).toFixed(1)}g · F: {(totalFat / recipe.servings).toFixed(1)}g
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function MacroCard({ value, label, unit, color }: { value: number; label: string; unit: string; color: string }) {
  const colorMap: Record<string, string> = {
    orange: 'text-orange-600 bg-orange-50',
    blue: 'text-blue-600 bg-blue-50',
    cyan: 'text-cyan-600 bg-cyan-50',
    amber: 'text-amber-600 bg-amber-50',
  }

  return (
    <div className={`rounded-lg p-4 text-center ${colorMap[color]}`}>
      <p className="text-xl font-bold">
        {value}{unit}
      </p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  )
}
