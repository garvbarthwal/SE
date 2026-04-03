'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import Link from 'next/link'

interface Goal {
  id: string
  type: string
  title: string
  targetValue: number
  currentValue: number
  deadline: string | null
  status: string
  progress: { value: number; loggedAt: string }[]
}

export default function GoalsPage() {
  const { status } = useSession()
  const router = useRouter()
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    type: 'weight',
    title: '',
    targetValue: '',
    deadline: '',
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    if (status === 'authenticated') {
      fetchGoals()
    }
  }, [status, router])

  const fetchGoals = async () => {
    try {
      const res = await fetch('/api/goals')
      const data = await res.json()
      setGoals(data.goals || [])
    } catch {
      console.error('Failed to fetch goals')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: formData.type,
          title: formData.title,
          targetValue: parseFloat(formData.targetValue),
          deadline: formData.deadline || undefined,
        }),
      })

      if (res.ok) {
        setFormData({ type: 'weight', title: '', targetValue: '', deadline: '' })
        setShowForm(false)
        fetchGoals()
      }
    } catch {
      console.error('Failed to create goal')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/goals/${id}`, { method: 'DELETE' })
      setGoals(goals.filter((g) => g.id !== id))
    } catch {
      console.error('Failed to delete goal')
    }
  }

  const typeIcons: Record<string, string> = {
    weight: '⚖️',
    workout: '💪',
    nutrition: '🍎',
    hydration: '💧',
  }

  const typeColors: Record<string, string> = {
    weight: 'bg-purple-100 text-purple-700',
    workout: 'bg-blue-100 text-blue-700',
    nutrition: 'bg-green-100 text-green-700',
    hydration: 'bg-cyan-100 text-cyan-700',
  }

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-gray-500">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Goals</h1>
          <p className="mt-1 text-sm text-gray-500">Set and track your fitness goals</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Goal'}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="weight">Weight</option>
                <option value="workout">Workout</option>
                <option value="nutrition">Nutrition</option>
                <option value="hydration">Hydration</option>
              </select>
            </div>
            <Input
              label="Title"
              placeholder="e.g., Lose 5kg"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
            <Input
              label="Target Value"
              type="number"
              placeholder="e.g., 70 (kg) or 3000 (ml)"
              value={formData.targetValue}
              onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
              required
            />
            <Input
              label="Deadline (optional)"
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
            />
          </div>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Goal'}
          </Button>
        </form>
      )}

      {goals.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <p className="text-gray-500">No goals set yet. Create your first goal to start tracking progress!</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => {
            const progress = goal.targetValue > 0 ? Math.min((goal.currentValue / goal.targetValue) * 100, 100) : 0
            return (
              <div
                key={goal.id}
                className="rounded-lg border border-gray-200 bg-white p-5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{typeIcons[goal.type] || '🎯'}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${typeColors[goal.type] || 'bg-gray-100 text-gray-700'}`}>
                      {goal.type}
                    </span>
                  </div>
                  <span className={`text-xs font-medium ${goal.status === 'completed' ? 'text-green-600' : 'text-gray-500'}`}>
                    {goal.status}
                  </span>
                </div>

                <h3 className="font-semibold text-gray-900">{goal.title}</h3>

                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Progress</span>
                    <span className="font-medium text-gray-900">
                      {goal.currentValue} / {goal.targetValue}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-200">
                    <div
                      className="h-2 rounded-full bg-blue-600 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {goal.deadline && (
                  <p className="text-xs text-gray-400">
                    Due: {new Date(goal.deadline).toLocaleDateString()}
                  </p>
                )}

                <div className="flex gap-2">
                  <Link
                    href={`/goals/${goal.id}`}
                    className="flex-1 text-center rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    View
                  </Link>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(goal.id)}>
                    Delete
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
