'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import Link from 'next/link'

interface NutritionLog {
  id: string
  food: string
  calories: number
  protein: number | null
  carbs: number | null
  fat: number | null
  portion: string | null
  createdAt: string
}

interface Recipe {
  id: string
  name: string
  servings: number
  ingredients: { food: { name: string } }[]
}

export default function NutritionPage() {
  const { status } = useSession()
  const router = useRouter()
  const [nutrition, setNutrition] = useState<NutritionLog[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [logMode, setLogMode] = useState<'manual' | 'recipe'>('manual')
  const [formData, setFormData] = useState({
    food: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    portion: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const [recipeSearch, setRecipeSearch] = useState('')
  const [recipeResults, setRecipeResults] = useState<Recipe[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [recipeServings, setRecipeServings] = useState(1)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    if (status === 'authenticated') {
      fetchNutrition()
    }
  }, [status, router])

  const fetchNutrition = async () => {
    try {
      const res = await fetch('/api/nutrition')
      const data = await res.json()
      setNutrition(data.nutrition || [])
    } catch {
      console.error('Failed to fetch nutrition')
    } finally {
      setLoading(false)
    }
  }

  const searchRecipes = useCallback(async (q: string) => {
    if (!q.trim()) {
      setRecipeResults([])
      return
    }
    setSearching(true)
    try {
      const res = await fetch('/api/recipes')
      const data = await res.json()
      const filtered = (data.recipes || []).filter((r: Recipe) =>
        r.name.toLowerCase().includes(q.toLowerCase())
      )
      setRecipeResults(filtered)
    } catch {
      console.error('Search failed')
    } finally {
      setSearching(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (logMode === 'recipe' && recipeSearch.trim()) {
        searchRecipes(recipeSearch)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [recipeSearch, logMode, searchRecipes])

  const handleRecipeSelect = async (recipe: Recipe) => {
    setSelectedRecipe(recipe)
    setRecipeSearch('')
    setRecipeResults([])

    try {
      const res = await fetch(`/api/recipes/${recipe.id}/nutrition`)
      const data = await res.json()
      const total = data.total
      setFormData({
        food: recipe.name,
        calories: total.calories.toString(),
        protein: total.protein.toString(),
        carbs: total.carbs.toString(),
        fat: total.fat.toString(),
        portion: `${recipeServings} serving${recipeServings > 1 ? 's' : ''}`,
      })
    } catch {
      console.error('Failed to fetch recipe nutrition')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const res = await fetch('/api/nutrition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          food: formData.food,
          calories: parseInt(formData.calories),
          protein: formData.protein ? parseFloat(formData.protein) : undefined,
          carbs: formData.carbs ? parseFloat(formData.carbs) : undefined,
          fat: formData.fat ? parseFloat(formData.fat) : undefined,
          portion: formData.portion || undefined,
        }),
      })

      if (res.ok) {
        setFormData({ food: '', calories: '', protein: '', carbs: '', fat: '', portion: '' })
        setShowForm(false)
        setSelectedRecipe(null)
        setRecipeServings(1)
        fetchNutrition()
      }
    } catch {
      console.error('Failed to create nutrition log')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/nutrition/${id}`, { method: 'DELETE' })
      setNutrition(nutrition.filter((n) => n.id !== id))
    } catch {
      console.error('Failed to delete nutrition log')
    }
  }

  const totalCalories = nutrition.reduce((sum, n) => sum + n.calories, 0)
  const totalProtein = nutrition.reduce((sum, n) => sum + (n.protein || 0), 0)
  const totalCarbs = nutrition.reduce((sum, n) => sum + (n.carbs || 0), 0)
  const totalFat = nutrition.reduce((sum, n) => sum + (n.fat || 0), 0)

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-gray-500">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nutrition</h1>
          <p className="mt-1 text-sm text-gray-500">Track your meals and macros</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Log Meal'}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Calories</p>
          <p className="text-xl font-bold text-gray-900">{totalCalories}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Protein</p>
          <p className="text-xl font-bold text-gray-900">{totalProtein.toFixed(1)}g</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Carbs</p>
          <p className="text-xl font-bold text-gray-900">{totalCarbs.toFixed(1)}g</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Fat</p>
          <p className="text-xl font-bold text-gray-900">{totalFat.toFixed(1)}g</p>
        </div>
      </div>

      {showForm && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setLogMode('manual'); setSelectedRecipe(null); setRecipeSearch(''); }}
              className={`px-4 py-2 text-sm font-medium rounded-lg ${logMode === 'manual' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Manual Entry
            </button>
            <button
              type="button"
              onClick={() => setLogMode('recipe')}
              className={`px-4 py-2 text-sm font-medium rounded-lg ${logMode === 'recipe' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              🍳 From Recipe
            </button>
          </div>

          {logMode === 'recipe' && (
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Search your recipes..."
                value={recipeSearch}
                onChange={(e) => setRecipeSearch(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {searching && <p className="text-sm text-gray-400">Searching...</p>}
              {recipeResults.length > 0 && (
                <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200">
                  {recipeResults.map((recipe) => (
                    <button
                      key={recipe.id}
                      type="button"
                      onClick={() => handleRecipeSelect(recipe)}
                      className="flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-gray-50 border-b border-gray-100 last:border-0"
                    >
                      <div>
                        <span className="font-medium text-gray-900">{recipe.name}</span>
                        <span className="ml-2 text-gray-400">
                          ({recipe.ingredients.length} ingredients, {recipe.servings} servings)
                        </span>
                      </div>
                      <span className="text-blue-600 text-xs">Select →</span>
                    </button>
                  ))}
                </div>
              )}
              {recipeSearch && recipeResults.length === 0 && !searching && (
                <p className="text-sm text-gray-500">No recipes found. <Link href="/recipes/new" className="text-blue-600 hover:underline">Create one</Link></p>
              )}
              {selectedRecipe && (
                <div className="rounded-lg bg-green-50 border border-green-200 p-3 flex items-center justify-between">
                  <div>
                    <span className="font-medium text-green-800">Selected: {selectedRecipe.name}</span>
                    <p className="text-xs text-green-600">Nutrition auto-filled</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setSelectedRecipe(null); setFormData({ food: '', calories: '', protein: '', carbs: '', fat: '', portion: '' }); }}
                    className="text-sm text-green-600 hover:underline"
                  >
                    Change
                  </button>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Food"
                placeholder={logMode === 'recipe' ? 'Auto-filled from recipe' : 'e.g., Chicken Breast'}
                value={formData.food}
                onChange={(e) => setFormData({ ...formData, food: e.target.value })}
                required
                readOnly={logMode === 'recipe' && !!selectedRecipe}
              />
              <Input
                label="Calories"
                type="number"
                placeholder="250"
                value={formData.calories}
                onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                required
              />
              <Input
                label="Protein (g)"
                type="number"
                placeholder="30"
                value={formData.protein}
                onChange={(e) => setFormData({ ...formData, protein: e.target.value })}
              />
              <Input
                label="Carbs (g)"
                type="number"
                placeholder="0"
                value={formData.carbs}
                onChange={(e) => setFormData({ ...formData, carbs: e.target.value })}
              />
              <Input
                label="Fat (g)"
                type="number"
                placeholder="10"
                value={formData.fat}
                onChange={(e) => setFormData({ ...formData, fat: e.target.value })}
              />
              <Input
                label="Portion"
                placeholder={logMode === 'recipe' ? 'Auto-filled' : 'e.g., 150g'}
                value={formData.portion}
                onChange={(e) => setFormData({ ...formData, portion: e.target.value })}
                readOnly={logMode === 'recipe' && !!selectedRecipe}
              />
            </div>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Meal'}
            </Button>
          </form>
        </div>
      )}

      {nutrition.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <p className="text-gray-500">No meals logged yet. Start tracking your nutrition!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {nutrition.map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4"
            >
              <div>
                <h3 className="font-medium text-gray-900">{log.food}</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {log.calories} cal
                  {log.protein && ` • P: ${log.protein}g`}
                  {log.carbs && ` • C: ${log.carbs}g`}
                  {log.fat && ` • F: ${log.fat}g`}
                  {log.portion && ` • ${log.portion}`}
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(log.createdAt).toLocaleDateString()}
                </p>
              </div>
              <Button variant="destructive" size="sm" onClick={() => handleDelete(log.id)}>
                Delete
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
