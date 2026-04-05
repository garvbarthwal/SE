'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import Link from 'next/link'
import { Target, Plus, X, Trash2, Calendar, ChevronRight, TrendingUp } from 'lucide-react'

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

const goalTypeColors: Record<string, string> = {
  weight: 'bg-orange-100 text-orange-700',
  workout: 'bg-green-100 text-green-700',
  nutrition: 'bg-blue-100 text-blue-700',
  hydration: 'bg-cyan-100 text-cyan-700',
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

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-orange-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Goals</h1>
          <p className="mt-1 text-slate-500">Set and track your fitness goals</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2">
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? 'Cancel' : 'New Goal'}
        </Button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-colors"
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
        </div>
      )}

      {goals.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <Target className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-4 text-sm text-slate-500">No goals set yet. Create your first goal to start tracking progress!</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => {
            const progress = goal.targetValue > 0 ? Math.min((goal.currentValue / goal.targetValue) * 100, 100) : 0

            return (
              <div
                key={goal.id}
                className="rounded-xl border border-slate-200 bg-white p-6 space-y-4 hover:border-orange-200 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${goalTypeColors[goal.type] || goalTypeColors.weight}`}>
                    {goal.type}
                  </span>
                  <span className={`text-xs font-medium ${goal.status === 'completed' ? 'text-green-600' : 'text-slate-400'}`}>
                    {goal.status}
                  </span>
                </div>

                <div className="flex flex-col items-center">
                  <div className="relative w-24 h-12 overflow-hidden">
                    <svg className="w-24 h-24" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r={40}
                        fill="none"
                        stroke="#E2E8F0"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={Math.PI * 40}
                        strokeDashoffset={0}
                        transform="rotate(180 50 50)"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r={40}
                        fill="none"
                        stroke="#F97316"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={Math.PI * 40}
                        strokeDashoffset={Math.PI * 40 - (progress / 100) * Math.PI * 40}
                        transform="rotate(180 50 50)"
                        className="transition-all duration-500"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pt-4">
                      <span className="text-lg font-bold text-slate-900">{Math.round(progress)}%</span>
                    </div>
                  </div>
                </div>

                <h3 className="text-sm font-medium text-slate-900 text-center">{goal.title}</h3>

                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Current</span>
                  <span className="text-sm font-medium text-slate-900">
                    {goal.currentValue} / {goal.targetValue}
                  </span>
                </div>

                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div
                    className="bg-gradient-to-r from-orange-400 to-orange-500 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {goal.deadline && (
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Due: {new Date(goal.deadline).toLocaleDateString()}
                  </p>
                )}

                <div className="flex gap-2">
                  <Link
                    href={`/goals/${goal.id}`}
                    className="flex-1 flex items-center justify-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    View <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(goal.id)} className="flex items-center gap-1">
                    <Trash2 className="h-4 w-4" />
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
