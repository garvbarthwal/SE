'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { UNITS } from '@/lib/units'
import { ArrowLeft, Plus, Search, ChefHat, Flame, Wheat, Trash2 } from 'lucide-react'

interface Food {
  id: string
  name: string
  calories: number
  protein: number | null
  carbs: number | null
  fat: number | null
  fiber: number | null
  defaultUnit: string | null
}

interface Ingredient {
  id: string
  foodId: string
  foodName: string
  quantity: number
  unit: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

export default function NewRecipePage() {
  const { status } = useSession()
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [servings, setServings] = useState(1)
  const [isPublic, setIsPublic] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Food[]>([])
  const [searching, setSearching] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  const searchFoods = useCallback(async (q: string) => {
    if (!q.trim()) {
      setSearchResults([])
      return
    }
    setSearching(true)
    try {
      const res = await fetch(`/api/foods/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setSearchResults(data.foods || [])
    } catch {
      console.error('Search failed')
    } finally {
      setSearching(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) searchFoods(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, searchFoods])

  const addIngredient = (food: Food) => {
    const unit = food.defaultUnit || 'g'
    const grams = unit === 'g' ? 100 : 1
    const ratio = grams / 100

    const newIngredient: Ingredient = {
      id: `temp-${Date.now()}`,
      foodId: food.id,
      foodName: food.name,
      quantity: 100,
      unit,
      calories: Math.round(food.calories * ratio),
      protein: parseFloat(((food.protein ?? 0) * ratio).toFixed(1)),
      carbs: parseFloat(((food.carbs ?? 0) * ratio).toFixed(1)),
      fat: parseFloat(((food.fat ?? 0) * ratio).toFixed(1)),
    }

    setIngredients([...ingredients, newIngredient])
    setShowSearch(false)
    setSearchQuery('')
    setSearchResults([])
  }

  const removeIngredient = (id: string) => {
    setIngredients(ingredients.filter((i) => i.id !== id))
  }

  const updateIngredient = (id: string, field: 'quantity' | 'unit', value: number | string) => {
    setIngredients(ingredients.map((ing) => {
      if (ing.id !== id) return ing
      const updated = { ...ing, [field]: value }
      const ratio = updated.quantity / 100
      const food = searchResults.find((f) => f.id === ing.foodId)
      if (!food) return updated
      return {
        ...updated,
        calories: Math.round(food.calories * ratio),
        protein: parseFloat(((food.protein ?? 0) * ratio).toFixed(1)),
        carbs: parseFloat(((food.carbs ?? 0) * ratio).toFixed(1)),
        fat: parseFloat(((food.fat ?? 0) * ratio).toFixed(1)),
      }
    }))
  }

  const totals = ingredients.reduce(
    (acc, ing) => ({
      calories: acc.calories + ing.calories,
      protein: acc.protein + ing.protein,
      carbs: acc.carbs + ing.carbs,
      fat: acc.fat + ing.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (ingredients.length === 0) return

    setSubmitting(true)
    try {
      const recipeRes = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, servings, isPublic }),
      })

      if (!recipeRes.ok) throw new Error('Failed to create recipe')

      const recipeData = await recipeRes.json()
      const recipeId = recipeData.recipe.id

      for (const ing of ingredients) {
        await fetch(`/api/recipes/${recipeId}/ingredients`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            foodId: ing.foodId,
            quantity: ing.quantity,
            unit: ing.unit,
          }),
        })
      }

      router.push(`/recipes/${recipeId}`)
    } catch {
      console.error('Failed to save recipe')
    } finally {
      setSubmitting(false)
    }
  }

  if (status === 'unauthenticated') return null

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push('/recipes')} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Create Recipe</h1>
        <p className="mt-1 text-slate-500">Build your custom recipe with automatic nutrition calculation</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <ChefHat className="h-5 w-5 text-orange-500" />
            <h2 className="text-base font-semibold text-slate-900">Recipe Details</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Recipe Name"
              placeholder="e.g., Chicken Salad"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Servings"
              type="number"
              min="1"
              value={servings.toString()}
              onChange={(e) => setServings(parseInt(e.target.value) || 1)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-colors"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="rounded border-slate-300 text-orange-500 focus:ring-orange-400"
            />
            <span className="text-sm text-slate-600">Share with community</span>
          </label>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wheat className="h-5 w-5 text-orange-500" />
              <h2 className="text-base font-semibold text-slate-900">Ingredients</h2>
              {ingredients.length > 0 && (
                <span className="text-xs text-slate-400">({ingredients.length})</span>
              )}
            </div>
            <Button type="button" variant="secondary" onClick={() => setShowSearch(!showSearch)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Ingredient
            </Button>
          </div>

          {showSearch && (
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search foods..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 pl-10 pr-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                />
              </div>
              {searching && <p className="text-sm text-slate-400">Searching...</p>}
              {searchResults.length > 0 && (
                <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200">
                  {searchResults.map((food) => (
                    <button
                      key={food.id}
                      type="button"
                      onClick={() => addIngredient(food)}
                      className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-slate-50 border-b border-slate-100 last:border-0"
                    >
                      <span className="font-medium text-slate-900">{food.name}</span>
                      <span className="text-slate-400">{food.calories} cal/100g</span>
                    </button>
                  ))}
                </div>
              )}
              {searchQuery && searchResults.length === 0 && !searching && (
                <p className="text-sm text-slate-500">No results found</p>
              )}
            </div>
          )}

          {ingredients.length === 0 ? (
            <div className="text-center py-8">
              <Wheat className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-2 text-sm text-slate-500">No ingredients added yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {ingredients.map((ing) => (
                <div
                  key={ing.id}
                  className="flex items-center gap-4 rounded-lg border border-slate-200 p-4 hover:border-orange-200 transition-colors"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">{ing.foodName}</p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <input
                        type="number"
                        value={ing.quantity}
                        onChange={(e) => updateIngredient(ing.id, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-20 rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-400"
                        min="0"
                        step="1"
                      />
                      <select
                        value={ing.unit}
                        onChange={(e) => updateIngredient(ing.id, 'unit', e.target.value)}
                        className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-400"
                      >
                        {UNITS.map((u) => (
                          <option key={u.value} value={u.value}>{u.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="text-right text-sm text-slate-500">
                    <p className="font-medium text-slate-700">{ing.calories} cal</p>
                    <p>P: {ing.protein}g · C: {ing.carbs}g · F: {ing.fat}g</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeIngredient(ing.id)}
                    className="text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {ingredients.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex items-center gap-2 mb-4">
              <Flame className="h-5 w-5 text-orange-500" />
              <h2 className="text-base font-semibold text-slate-900">Total Nutrition</h2>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <MacroCard value={totals.calories} label="Calories" unit="" color="orange" />
              <MacroCard value={totals.protein} label="Protein" unit="g" color="blue" />
              <MacroCard value={totals.carbs} label="Carbs" unit="g" color="cyan" />
              <MacroCard value={totals.fat} label="Fat" unit="g" color="amber" />
            </div>
            {servings > 1 && (
              <p className="mt-3 text-sm text-slate-500">
                Per serving: {Math.round(totals.calories / servings)} cal · P: {(totals.protein / servings).toFixed(1)}g · C: {(totals.carbs / servings).toFixed(1)}g · F: {(totals.fat / servings).toFixed(1)}g
              </p>
            )}
          </div>
        )}

        <Button type="submit" disabled={ingredients.length === 0 || submitting || !name}>
          {submitting ? 'Saving...' : 'Save Recipe'}
        </Button>
      </form>
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
        {typeof value === 'number' ? (Number.isInteger(value) ? value : value.toFixed(1)) : value}{unit}
      </p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  )
}
