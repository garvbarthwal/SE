'use client'

import type { ElementType } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
  import {
  ChevronRight,
  Flame,
  Plus,
  Search,
  Sparkles,
  UtensilsCrossed,
  Wheat,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { TrackingFilters } from '@/components/tracking/TrackingFilters'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  formatDateKey,
  formatDisplayDate,
  getRelativeDateKey,
  getTodayDateKey,
  toDateTimeLocalValue,
} from '@/lib/tracking'

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

interface RecipeNutritionTotals {
  calories: number
  protein: number
  carbs: number
  fat: number
}

interface EditableNutritionRow {
  clientId: string
  id?: string
  food: string
  calories: string
  protein: string
  carbs: string
  fat: string
  portion: string
  createdAt: string
}

function createNutritionForm(dateKey = getTodayDateKey()) {
  return {
    food: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    portion: '',
    createdAt: `${dateKey}T12:00`,
  }
}

function toEditableNutritionRow(log: NutritionLog): EditableNutritionRow {
  return {
    clientId: log.id,
    id: log.id,
    food: log.food,
    calories: log.calories.toString(),
    protein: log.protein?.toString() ?? '',
    carbs: log.carbs?.toString() ?? '',
    fat: log.fat?.toString() ?? '',
    portion: log.portion ?? '',
    createdAt: toDateTimeLocalValue(log.createdAt),
  }
}

function groupNutritionByDate(logs: NutritionLog[]) {
  return logs.reduce<Record<string, NutritionLog[]>>((groups, log) => {
    const key = formatDateKey(new Date(log.createdAt))
    groups[key] = groups[key] ? [...groups[key], log] : [log]
    return groups
  }, {})
}

function scaleRecipeNutrition(totals: RecipeNutritionTotals, servings: number) {
  return {
    calories: Math.round(totals.calories * servings),
    protein: Number((totals.protein * servings).toFixed(1)),
    carbs: Number((totals.carbs * servings).toFixed(1)),
    fat: Number((totals.fat * servings).toFixed(1)),
  }
}

export default function NutritionPage() {
  const { status } = useSession()
  const router = useRouter()
  const today = getTodayDateKey()

  const [nutrition, setNutrition] = useState<NutritionLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [batchOpen, setBatchOpen] = useState(false)
  const [batchSaving, setBatchSaving] = useState(false)
  const [batchRows, setBatchRows] = useState<EditableNutritionRow[]>([])
  const [batchDeletedIds, setBatchDeletedIds] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'day' | 'range'>('day')
  const [selectedDate, setSelectedDate] = useState(today)
  const [rangeFrom, setRangeFrom] = useState(getRelativeDateKey(-6))
  const [rangeTo, setRangeTo] = useState(today)
  const [filterLabel, setFilterLabel] = useState('Today')
  const [logMode, setLogMode] = useState<'manual' | 'recipe'>('manual')
  const [formData, setFormData] = useState(createNutritionForm(today))
  const [recipeSearch, setRecipeSearch] = useState('')
  const [recipeResults, setRecipeResults] = useState<Recipe[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [recipeTotals, setRecipeTotals] = useState<RecipeNutritionTotals | null>(null)
  const [recipeServings, setRecipeServings] = useState('1')

  const fetchNutrition = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams(
        viewMode === 'day'
          ? { date: selectedDate }
          : {
              from: rangeFrom,
              to: rangeTo,
            }
      )

      const res = await fetch(`/api/nutrition?${params.toString()}`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch nutrition logs')
      }

      setNutrition(data.nutrition || [])
      setFilterLabel(data.filters?.label || (viewMode === 'day' ? selectedDate : `${rangeFrom} to ${rangeTo}`))
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to fetch nutrition logs')
      setNutrition([])
    } finally {
      setLoading(false)
    }
  }, [rangeFrom, rangeTo, selectedDate, viewMode])

  const searchRecipes = useCallback(async (query: string) => {
    if (!query.trim()) {
      setRecipeResults([])
      return
    }

    setSearching(true)

    try {
      const res = await fetch('/api/recipes')
      const data = await res.json()
      const filtered = (data.recipes || []).filter((recipe: Recipe) =>
        recipe.name.toLowerCase().includes(query.toLowerCase())
      )
      setRecipeResults(filtered)
    } catch {
      setRecipeResults([])
    } finally {
      setSearching(false)
    }
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (status === 'authenticated') {
      void fetchNutrition()
    }
  }, [status, router, fetchNutrition])

  useEffect(() => {
    if (logMode !== 'recipe') {
      return
    }

    const timeout = window.setTimeout(() => {
      void searchRecipes(recipeSearch)
    }, 250)

    return () => window.clearTimeout(timeout)
  }, [logMode, recipeSearch, searchRecipes])

  useEffect(() => {
    if (!selectedRecipe || !recipeTotals) {
      return
    }

    const servings = Number(recipeServings) || 1
    const scaled = scaleRecipeNutrition(recipeTotals, servings)

    setFormData((current) => ({
      ...current,
      food: selectedRecipe.name,
      calories: scaled.calories.toString(),
      protein: scaled.protein.toString(),
      carbs: scaled.carbs.toString(),
      fat: scaled.fat.toString(),
      portion: `${servings} serving${servings === 1 ? '' : 's'}`,
    }))
  }, [selectedRecipe, recipeTotals, recipeServings])

  async function handleRecipeSelect(recipe: Recipe) {
    setSelectedRecipe(recipe)
    setRecipeSearch('')
    setRecipeResults([])

    try {
      const res = await fetch(`/api/recipes/${recipe.id}/nutrition`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load recipe nutrition')
      }

      setRecipeTotals(data.total)
      setRecipeServings('1')
      setFormData((current) => ({
        ...current,
        createdAt: current.createdAt || `${viewMode === 'day' ? selectedDate : today}T12:00`,
      }))
    } catch (recipeError) {
      setError(recipeError instanceof Error ? recipeError.message : 'Failed to load recipe nutrition')
    }
  }

  async function handleCreateLog(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)

    try {
      const res = await fetch('/api/nutrition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          food: formData.food,
          calories: Number(formData.calories),
          protein: formData.protein ? Number(formData.protein) : undefined,
          carbs: formData.carbs ? Number(formData.carbs) : undefined,
          fat: formData.fat ? Number(formData.fat) : undefined,
          portion: formData.portion || undefined,
          createdAt: formData.createdAt,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create meal log')
      }

      setFormData(createNutritionForm(viewMode === 'day' ? selectedDate : today))
      setSelectedRecipe(null)
      setRecipeTotals(null)
      setRecipeServings('1')
      setRecipeSearch('')
      setRecipeResults([])
      setLogMode('manual')
      setShowForm(false)
      await fetchNutrition()
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Failed to create meal log')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/nutrition/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete meal')
      }

      await fetchNutrition()
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete meal')
    }
  }

  function openBatchEditor() {
    setBatchRows(nutrition.map(toEditableNutritionRow))
    setBatchDeletedIds([])
    setBatchOpen(true)
  }

  function addBatchRow() {
    const baseDate = viewMode === 'day' ? selectedDate : rangeTo

    setBatchRows((currentRows) => [
      ...currentRows,
      {
        clientId: `new-${Date.now()}-${currentRows.length}`,
        food: '',
        calories: '',
        protein: '',
        carbs: '',
        fat: '',
        portion: '',
        createdAt: `${baseDate}T12:00`,
      },
    ])
  }

  function updateBatchRow(clientId: string, field: keyof EditableNutritionRow, value: string) {
    setBatchRows((currentRows) =>
      currentRows.map((row) => (row.clientId === clientId ? { ...row, [field]: value } : row))
    )
  }

  function removeBatchRow(clientId: string) {
    const row = batchRows.find((currentRow) => currentRow.clientId === clientId)
    if (row?.id) {
      setBatchDeletedIds((currentIds) => (
        currentIds.includes(row.id!) ? currentIds : [...currentIds, row.id!]
      ))
    }

    setBatchRows((currentRows) => currentRows.filter((row) => row.clientId !== clientId))
  }

  async function saveBatchChanges() {
    setBatchSaving(true)
    setError(null)

    try {
      const existingRows = batchRows.filter((row) => row.id)
      const newRows = batchRows.filter((row) => !row.id)

      const normalizeRow = (row: EditableNutritionRow) => {
        if (!row.food.trim() || !row.calories.trim() || !row.createdAt.trim()) {
          throw new Error('Each meal row needs a food name, calories, and date/time.')
        }

        return {
          ...(row.id ? { id: row.id } : {}),
          food: row.food.trim(),
          calories: Number(row.calories),
          protein: row.protein ? Number(row.protein) : undefined,
          carbs: row.carbs ? Number(row.carbs) : undefined,
          fat: row.fat ? Number(row.fat) : undefined,
          portion: row.portion.trim() || undefined,
          createdAt: row.createdAt,
        }
      }

      if (existingRows.length > 0) {
        const res = await fetch('/api/nutrition', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(existingRows.map(normalizeRow)),
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Failed to update meals')
        }
      }

      if (newRows.length > 0) {
        const res = await fetch('/api/nutrition', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newRows.map(normalizeRow)),
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Failed to add meals')
        }
      }

      if (batchDeletedIds.length > 0) {
        await Promise.all(
          batchDeletedIds.map(async (id) => {
            const res = await fetch(`/api/nutrition/${id}`, { method: 'DELETE' })
            if (!res.ok) {
              const data = await res.json()
              throw new Error(data.error || 'Failed to remove meals')
            }
          })
        )
      }

      setBatchOpen(false)
      setBatchDeletedIds([])
      await fetchNutrition()
    } catch (batchError) {
      setError(batchError instanceof Error ? batchError.message : 'Failed to save meal updates')
    } finally {
      setBatchSaving(false)
    }
  }

  const groupedNutrition = useMemo(() => groupNutritionByDate(nutrition), [nutrition])
  const totalCalories = nutrition.reduce((sum, log) => sum + log.calories, 0)
  const totalProtein = nutrition.reduce((sum, log) => sum + (log.protein || 0), 0)
  const totalCarbs = nutrition.reduce((sum, log) => sum + (log.carbs || 0), 0)
  const totalFat = nutrition.reduce((sum, log) => sum + (log.fat || 0), 0)
  const activeRecipeScale = recipeTotals ? scaleRecipeNutrition(recipeTotals, Number(recipeServings) || 1) : null

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-orange-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Nutrition</h1>
          <p className="mt-1 text-slate-500">Track meals day by day, review longer ranges, and log recipes with clearer sections.</p>
        </div>

        <Button
          type="button"
          onClick={() => {
            setShowForm((visible) => {
              const nextVisible = !visible
              if (nextVisible) {
                setFormData(createNutritionForm(viewMode === 'day' ? selectedDate : today))
                setLogMode('manual')
                setSelectedRecipe(null)
                setRecipeTotals(null)
                setRecipeServings('1')
                setRecipeSearch('')
                setRecipeResults([])
              }
              return nextVisible
            })
          }}
          className="cursor-pointer gap-2 rounded-xl"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? 'Close Form' : 'Log Meal'}
        </Button>
      </div>

      <TrackingFilters
        title="Filter Meal History"
        description="Use a single day when logging in detail or expand to a range when auditing trends and gaps."
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        selectedDate={selectedDate}
        onSelectedDateChange={setSelectedDate}
        rangeFrom={rangeFrom}
        rangeTo={rangeTo}
        onRangeFromChange={setRangeFrom}
        onRangeToChange={setRangeTo}
        onUseToday={() => {
          setViewMode('day')
          setSelectedDate(today)
        }}
        onUseLast7Days={() => {
          setViewMode('range')
          setRangeFrom(getRelativeDateKey(-6))
          setRangeTo(today)
        }}
        onUseLast30Days={() => {
          setViewMode('range')
          setRangeFrom(getRelativeDateKey(-29))
          setRangeTo(today)
        }}
        onBatchEdit={openBatchEditor}
        batchEditLabel="Batch Edit Meals"
        accent="green"
      >
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <span className="block text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Loaded Window</span>
          <p className="mt-2 text-sm font-medium text-slate-900">{filterLabel}</p>
          <p className="mt-1 text-xs text-slate-500">{nutrition.length} meal log{nutrition.length === 1 ? '' : 's'} available</p>
        </div>
      </TrackingFilters>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Calories" value={`${totalCalories} kcal`} helper="Energy tracked in view" icon={Flame} accent="orange" />
        <StatCard label="Protein" value={`${totalProtein.toFixed(1)} g`} helper="Protein across meals" icon={Sparkles} accent="blue" />
        <StatCard label="Carbs" value={`${totalCarbs.toFixed(1)} g`} helper="Carbohydrate total" icon={Wheat} accent="cyan" />
        <StatCard label="Fat" value={`${totalFat.toFixed(1)} g`} helper="Fat tracked in window" icon={UtensilsCrossed} accent="amber" />
      </div>

      {showForm ? (
        <form onSubmit={handleCreateLog} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Create a Meal Log</h2>
              <p className="mt-1 text-sm text-slate-500">Manual logging stays flexible, while recipe logging now has dedicated search, serving, and nutrition preview sections.</p>
            </div>
            <div className="inline-flex rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => {
                  setLogMode('manual')
                  setSelectedRecipe(null)
                  setRecipeTotals(null)
                }}
                className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  logMode === 'manual' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Manual Entry
              </button>
              <button
                type="button"
                onClick={() => setLogMode('recipe')}
                className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  logMode === 'recipe' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                From Recipe
              </button>
            </div>
          </div>

          {logMode === 'recipe' ? (
            <div className="mt-5 grid gap-4 xl:grid-cols-3">
              <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold text-slate-900">1. Search Recipe</h3>
                <div className="relative mt-3">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search saved recipes"
                    value={recipeSearch}
                    onChange={(event) => setRecipeSearch(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400"
                  />
                </div>

                {searching ? <p className="mt-3 text-sm text-slate-500">Searching recipes...</p> : null}

                {recipeResults.length > 0 ? (
                  <div className="mt-3 max-h-52 overflow-y-auto rounded-xl border border-slate-200 bg-white">
                    {recipeResults.map((recipe) => (
                      <button
                        key={recipe.id}
                        type="button"
                        onClick={() => void handleRecipeSelect(recipe)}
                        className="flex w-full cursor-pointer items-center justify-between border-b border-slate-100 px-4 py-3 text-left transition-colors hover:bg-slate-50 last:border-0"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-900">{recipe.name}</p>
                          <p className="text-xs text-slate-500">{recipe.ingredients.length} ingredients • {recipe.servings} default servings</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-emerald-500" />
                      </button>
                    ))}
                  </div>
                ) : null}

                {!searching && recipeSearch && recipeResults.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-500">
                    No recipes found. <Link href="/recipes/new" className="font-medium text-emerald-600 hover:underline">Create one</Link>
                  </p>
                ) : null}
              </section>

              <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold text-slate-900">2. Serving Plan</h3>
                {selectedRecipe ? (
                  <>
                    <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                      <p className="text-sm font-medium text-emerald-900">{selectedRecipe.name}</p>
                      <p className="mt-1 text-xs text-emerald-700">Recipe selected and ready to scale.</p>
                    </div>

                    <Input
                      label="Servings to log"
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={recipeServings}
                      onChange={(event) => setRecipeServings(event.target.value)}
                      className="mt-3"
                    />

                    <Input
                      label="Logged At"
                      type="datetime-local"
                      value={formData.createdAt}
                      onChange={(event) => setFormData((current) => ({ ...current, createdAt: event.target.value }))}
                      className="mt-3"
                    />
                  </>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">Choose a recipe first to unlock serving controls.</p>
                )}
              </section>

              <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold text-slate-900">3. Nutrition Preview</h3>
                {activeRecipeScale ? (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <PreviewMetric label="Calories" value={`${activeRecipeScale.calories} kcal`} />
                    <PreviewMetric label="Protein" value={`${activeRecipeScale.protein} g`} />
                    <PreviewMetric label="Carbs" value={`${activeRecipeScale.carbs} g`} />
                    <PreviewMetric label="Fat" value={`${activeRecipeScale.fat} g`} />
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">Recipe macros will appear here once you select one.</p>
                )}
              </section>
            </div>
          ) : null}

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Input
              label="Food"
              value={formData.food}
              onChange={(event) => setFormData((current) => ({ ...current, food: event.target.value }))}
              required
              readOnly={logMode === 'recipe' && !!selectedRecipe}
            />
            <Input
              label="Calories"
              type="number"
              value={formData.calories}
              onChange={(event) => setFormData((current) => ({ ...current, calories: event.target.value }))}
              required
              readOnly={logMode === 'recipe' && !!selectedRecipe}
            />
            <Input
              label="Protein (g)"
              type="number"
              value={formData.protein}
              onChange={(event) => setFormData((current) => ({ ...current, protein: event.target.value }))}
              readOnly={logMode === 'recipe' && !!selectedRecipe}
            />
            <Input
              label="Carbs (g)"
              type="number"
              value={formData.carbs}
              onChange={(event) => setFormData((current) => ({ ...current, carbs: event.target.value }))}
              readOnly={logMode === 'recipe' && !!selectedRecipe}
            />
            <Input
              label="Fat (g)"
              type="number"
              value={formData.fat}
              onChange={(event) => setFormData((current) => ({ ...current, fat: event.target.value }))}
              readOnly={logMode === 'recipe' && !!selectedRecipe}
            />
            <Input
              label="Portion"
              value={formData.portion}
              onChange={(event) => setFormData((current) => ({ ...current, portion: event.target.value }))}
              readOnly={logMode === 'recipe' && !!selectedRecipe}
            />
            {logMode === 'manual' ? (
              <Input
                label="Logged At"
                type="datetime-local"
                value={formData.createdAt}
                onChange={(event) => setFormData((current) => ({ ...current, createdAt: event.target.value }))}
                required
              />
            ) : null}
          </div>

          <div className="mt-5 flex justify-end">
            <Button type="submit" disabled={submitting} className="cursor-pointer rounded-xl px-5">
              {submitting ? 'Saving...' : 'Save Meal'}
            </Button>
          </div>
        </form>
      ) : null}

      {nutrition.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <UtensilsCrossed className="mx-auto h-10 w-10 text-slate-300" />
          <h2 className="mt-4 text-lg font-semibold text-slate-900">No meals in this view</h2>
          <p className="mt-2 text-sm text-slate-500">Shift the date window or log a meal to start building your nutrition history.</p>
        </div>
      ) : (
        Object.entries(groupedNutrition).map(([dateKey, dayLogs]) => (
          <section key={dateKey} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/60">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  {formatDisplayDate(`${dateKey}T00:00:00`, { weekday: 'long', month: 'long', day: 'numeric' })}
                </h2>
                <p className="mt-1 text-sm text-slate-500">{dayLogs.length} meal log{dayLogs.length === 1 ? '' : 's'}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                {dateKey}
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {dayLogs.map((log) => (
                <article key={log.id} className="flex flex-col gap-4 px-6 py-4 transition-colors hover:bg-slate-50 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                      <UtensilsCrossed className="h-5 w-5" />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-slate-900">{log.food}</h3>
                        {log.portion ? (
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{log.portion}</span>
                        ) : null}
                      </div>

                      <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-500">
                        <span>{log.calories} kcal</span>
                        {log.protein ? <span>P {log.protein}g</span> : null}
                        {log.carbs ? <span>C {log.carbs}g</span> : null}
                        {log.fat ? <span>F {log.fat}g</span> : null}
                      </div>

                      <p className="mt-1 text-xs text-slate-400">
                        {formatDisplayDate(log.createdAt, {
                          hour: 'numeric',
                          minute: '2-digit',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>

                  <Button type="button" variant="destructive" size="sm" onClick={() => void handleDelete(log.id)} className="cursor-pointer rounded-lg">
                    Delete
                  </Button>
                </article>
              ))}
            </div>
          </section>
        ))
      )}

      <Dialog open={batchOpen} onOpenChange={setBatchOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] !max-w-6xl overflow-hidden rounded-2xl border-slate-200 bg-white p-0 shadow-2xl shadow-slate-950/20">
          <DialogHeader className="border-b border-slate-100 px-6 py-5 pr-14">
            <DialogTitle className="text-xl font-semibold text-slate-950">Batch Edit Meals</DialogTitle>
            <DialogDescription className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Edit visible meals, remove saved rows, or add historical entries before saving the set.
            </DialogDescription>
          </DialogHeader>

          <div className="min-w-0 space-y-4 px-6 py-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900">{filterLabel}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {batchRows.length} active meal row{batchRows.length === 1 ? '' : 's'}
                  {batchDeletedIds.length > 0 ? `, ${batchDeletedIds.length} marked for removal` : ''}
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addBatchRow} className="w-full cursor-pointer gap-2 rounded-lg border-emerald-200 text-emerald-700 hover:bg-emerald-50 sm:w-auto">
                <Plus className="h-4 w-4" />
                Add Row
              </Button>
            </div>

            {batchRows.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <UtensilsCrossed className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-slate-950">No meal rows in this view</h3>
                <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
                  Add a row to backfill a meal for this date window.
                </p>
                <Button type="button" onClick={addBatchRow} className="mt-5 cursor-pointer gap-2 rounded-lg">
                  <Plus className="h-4 w-4" />
                  Add First Row
                </Button>
              </div>
            ) : (
              <div className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="max-h-[56vh] overflow-auto">
                  <table className="w-full min-w-[1100px] text-left text-sm">
                    <thead className="sticky top-0 z-10 bg-slate-50 text-slate-500 shadow-[inset_0_-1px_0_#e2e8f0]">
                      <tr>
                        <th className="px-4 py-3 font-medium">Food</th>
                        <th className="px-4 py-3 font-medium">Calories</th>
                        <th className="px-4 py-3 font-medium">Protein</th>
                        <th className="px-4 py-3 font-medium">Carbs</th>
                        <th className="px-4 py-3 font-medium">Fat</th>
                        <th className="px-4 py-3 font-medium">Portion</th>
                        <th className="px-4 py-3 font-medium">Logged At</th>
                        <th className="px-4 py-3 font-medium text-right">Row</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batchRows.map((row) => (
                        <tr key={row.clientId} className="border-t border-slate-100 align-top hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <input value={row.food} onChange={(event) => updateBatchRow(row.clientId, 'food', event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400" />
                          </td>
                          <td className="px-4 py-3">
                            <input type="number" value={row.calories} onChange={(event) => updateBatchRow(row.clientId, 'calories', event.target.value)} className="w-28 rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400" />
                          </td>
                          <td className="px-4 py-3">
                            <input type="number" value={row.protein} onChange={(event) => updateBatchRow(row.clientId, 'protein', event.target.value)} className="w-24 rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400" />
                          </td>
                          <td className="px-4 py-3">
                            <input type="number" value={row.carbs} onChange={(event) => updateBatchRow(row.clientId, 'carbs', event.target.value)} className="w-24 rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400" />
                          </td>
                          <td className="px-4 py-3">
                            <input type="number" value={row.fat} onChange={(event) => updateBatchRow(row.clientId, 'fat', event.target.value)} className="w-24 rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400" />
                          </td>
                          <td className="px-4 py-3">
                            <input value={row.portion} onChange={(event) => updateBatchRow(row.clientId, 'portion', event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400" />
                          </td>
                          <td className="px-4 py-3">
                            <input type="datetime-local" value={row.createdAt} onChange={(event) => updateBatchRow(row.clientId, 'createdAt', event.target.value)} className="w-52 rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400" />
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button type="button" variant="ghost" size="sm" onClick={() => removeBatchRow(row.clientId)} className="cursor-pointer text-slate-500 hover:text-slate-900">
                              Remove
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="border-t border-slate-100 bg-slate-50 px-6 py-4">
            <Button type="button" variant="outline" onClick={() => setBatchOpen(false)} className="cursor-pointer rounded-lg">
              Cancel
            </Button>
            <Button type="button" onClick={() => void saveBatchChanges()} disabled={batchSaving || (batchRows.length === 0 && batchDeletedIds.length === 0)} className="cursor-pointer rounded-lg">
              {batchSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StatCard({
  label,
  value,
  helper,
  icon: Icon,
  accent,
}: {
  label: string
  value: string
  helper: string
  icon: ElementType
  accent: 'orange' | 'blue' | 'cyan' | 'amber'
}) {
  const iconClasses = {
    orange: 'bg-orange-50 text-orange-600',
    blue: 'bg-blue-50 text-blue-600',
    cyan: 'bg-cyan-50 text-cyan-600',
    amber: 'bg-amber-50 text-amber-600',
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClasses[accent]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-4 text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{helper}</p>
    </div>
  )
}

function PreviewMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  )
}
