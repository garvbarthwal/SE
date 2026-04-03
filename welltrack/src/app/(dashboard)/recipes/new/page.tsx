'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { UNITS } from '@/lib/units'

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
    <div className="space-y-6">
      <div>
        <Button variant="ghost" onClick={() => router.push('/recipes')}>
          ← Back to Recipes
        </Button>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Create Recipe</h1>
        <p className="mt-1 text-sm text-gray-500">Build your custom recipe with automatic nutrition calculation</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Recipe Details</h2>
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
            <label className="block text-sm font-medium text-gray-700">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-600">Share with community</span>
          </label>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Ingredients</h2>
            <Button type="button" variant="secondary" onClick={() => setShowSearch(!showSearch)}>
              + Add Ingredient
            </Button>
          </div>

          {showSearch && (
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Search foods..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {searching && <p className="text-sm text-gray-400">Searching...</p>}
              {searchResults.length > 0 && (
                <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200">
                  {searchResults.map((food) => (
                    <button
                      key={food.id}
                      type="button"
                      onClick={() => addIngredient(food)}
                      className="flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-gray-50 border-b border-gray-100 last:border-0"
                    >
                      <span className="font-medium text-gray-900">{food.name}</span>
                      <span className="text-gray-400">{food.calories} cal/100g</span>
                    </button>
                  ))}
                </div>
              )}
              {searchQuery && searchResults.length === 0 && !searching && (
                <p className="text-sm text-gray-500">No results found</p>
              )}
            </div>
          )}

          {ingredients.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No ingredients added yet</p>
          ) : (
            <div className="space-y-3">
              {ingredients.map((ing) => (
                <div
                  key={ing.id}
                  className="flex items-center gap-3 rounded-lg border border-gray-200 p-3"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{ing.foodName}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="number"
                        value={ing.quantity}
                        onChange={(e) => updateIngredient(ing.id, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-20 rounded border border-gray-300 px-2 py-1 text-sm"
                        min="0"
                        step="1"
                      />
                      <select
                        value={ing.unit}
                        onChange={(e) => updateIngredient(ing.id, 'unit', e.target.value)}
                        className="rounded border border-gray-300 px-2 py-1 text-sm"
                      >
                        {UNITS.map((u) => (
                          <option key={u.value} value={u.value}>{u.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <p>{ing.calories} cal</p>
                    <p>P: {ing.protein}g • C: {ing.carbs}g • F: {ing.fat}g</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeIngredient(ing.id)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {ingredients.length > 0 && (
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-900">Total Nutrition</h2>
            <div className="mt-4 grid grid-cols-4 gap-4">
              <div className="rounded-lg bg-orange-50 p-3 text-center">
                <p className="text-2xl font-bold text-orange-600">{totals.calories}</p>
                <p className="text-xs text-gray-500">Calories</p>
              </div>
              <div className="rounded-lg bg-blue-50 p-3 text-center">
                <p className="text-2xl font-bold text-blue-600">{totals.protein}g</p>
                <p className="text-xs text-gray-500">Protein</p>
              </div>
              <div className="rounded-lg bg-green-50 p-3 text-center">
                <p className="text-2xl font-bold text-green-600">{totals.carbs}g</p>
                <p className="text-xs text-gray-500">Carbs</p>
              </div>
              <div className="rounded-lg bg-yellow-50 p-3 text-center">
                <p className="text-2xl font-bold text-yellow-600">{totals.fat}g</p>
                <p className="text-xs text-gray-500">Fat</p>
              </div>
            </div>
            {servings > 1 && (
              <p className="mt-3 text-sm text-gray-500">
                Per serving: {Math.round(totals.calories / servings)} cal • P: {(totals.protein / servings).toFixed(1)}g • C: {(totals.carbs / servings).toFixed(1)}g • F: {(totals.fat / servings).toFixed(1)}g
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
