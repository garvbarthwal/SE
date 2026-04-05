'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Dumbbell, Trash2, Plus, X, Clock, Flame } from 'lucide-react'

interface Workout {
  id: string
  type: string
  name: string
  duration: number
  calories: number | null
  notes: string | null
  createdAt: string
}

const workoutTypeIcons: Record<string, string> = {
  strength: '🏋️',
  cardio: '🏃',
  flexibility: '🧘',
  sports: '⚽',
  other: '🎯',
}

const workoutTypeColors: Record<string, string> = {
  strength: 'bg-orange-100 text-orange-700',
  cardio: 'bg-red-100 text-red-700',
  flexibility: 'bg-green-100 text-green-700',
  sports: 'bg-blue-100 text-blue-700',
  other: 'bg-slate-100 text-slate-700',
}

export default function WorkoutsPage() {
  const { status } = useSession()
  const router = useRouter()
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    type: 'strength',
    name: '',
    duration: '',
    calories: '',
    notes: '',
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    if (status === 'authenticated') {
      fetchWorkouts()
    }
  }, [status, router])

  const fetchWorkouts = async () => {
    try {
      const res = await fetch('/api/workouts')
      const data = await res.json()
      setWorkouts(data.workouts || [])
    } catch {
      console.error('Failed to fetch workouts')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const res = await fetch('/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: formData.type,
          name: formData.name,
          duration: parseInt(formData.duration),
          calories: formData.calories ? parseInt(formData.calories) : undefined,
          notes: formData.notes || undefined,
        }),
      })

      if (res.ok) {
        setFormData({ type: 'strength', name: '', duration: '', calories: '', notes: '' })
        setShowForm(false)
        fetchWorkouts()
      }
    } catch {
      console.error('Failed to create workout')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/workouts/${id}`, { method: 'DELETE' })
      setWorkouts(workouts.filter((w) => w.id !== id))
    } catch {
      console.error('Failed to delete workout')
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
          <h1 className="text-2xl font-bold text-slate-900">Workouts</h1>
          <p className="mt-1 text-slate-500">Track your exercise sessions</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2">
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? 'Cancel' : 'Log Workout'}
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
                <option value="strength">Strength</option>
                <option value="cardio">Cardio</option>
                <option value="flexibility">Flexibility</option>
                <option value="sports">Sports</option>
                <option value="other">Other</option>
              </select>
            </div>
            <Input
              label="Name"
              placeholder="e.g., Morning Run"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <Input
              label="Duration (minutes)"
              type="number"
              placeholder="30"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              required
            />
            <Input
              label="Calories burned"
              type="number"
              placeholder="200"
              value={formData.calories}
              onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="How did it go?"
              rows={2}
              className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-colors"
            />
          </div>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : 'Save Workout'}
          </Button>
        </div>
      )}

      {workouts.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <Dumbbell className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-4 text-sm text-slate-500">No workouts logged yet. Start tracking your fitness journey!</p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Recent Workouts</h2>
            <span className="text-sm text-slate-500">{workouts.length} workouts</span>
          </div>
          <div className="divide-y divide-slate-100">
            {workouts.map((workout) => (
              <div
                key={workout.id}
                className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-2xl">
                    {workoutTypeIcons[workout.type] || '🎯'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${workoutTypeColors[workout.type] || workoutTypeColors.other}`}>
                        {workout.type}
                      </span>
                      <h3 className="text-sm font-medium text-slate-900">{workout.name}</h3>
                    </div>
                    <div className="mt-1.5 flex items-center gap-3 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {workout.duration} min
                      </span>
                      {workout.calories && (
                        <span className="flex items-center gap-1">
                          <Flame className="h-3.5 w-3.5" />
                          {workout.calories} cal
                        </span>
                      )}
                      {workout.notes && <span>· {workout.notes}</span>}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(workout.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(workout.id)} className="flex items-center gap-1">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
