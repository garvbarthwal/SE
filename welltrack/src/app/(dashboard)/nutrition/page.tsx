'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

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

export default function NutritionPage() {
  const { status } = useSession()
  const router = useRouter()
  const [nutrition, setNutrition] = useState<NutritionLog[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    food: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    portion: '',
  })
  const [submitting, setSubmitting] = useState(false)

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
        <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Food"
              placeholder="e.g., Chicken Breast"
              value={formData.food}
              onChange={(e) => setFormData({ ...formData, food: e.target.value })}
              required
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
              placeholder="e.g., 150g"
              value={formData.portion}
              onChange={(e) => setFormData({ ...formData, portion: e.target.value })}
            />
          </div>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : 'Save Meal'}
          </Button>
        </form>
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
