'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface Workout {
  id: string
  type: string
  name: string
  duration: number
  calories: number | null
  notes: string | null
  createdAt: string
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
    return <div className="flex h-64 items-center justify-center text-gray-500">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workouts</h1>
          <p className="mt-1 text-sm text-gray-500">Track your exercise sessions</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Log Workout'}
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
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="How did it go?"
              rows={2}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : 'Save Workout'}
          </Button>
        </form>
      )}

      {workouts.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <p className="text-gray-500">No workouts logged yet. Start tracking your fitness journey!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {workouts.map((workout) => (
            <div
              key={workout.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4"
            >
              <div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                    {workout.type}
                  </span>
                  <h3 className="font-medium text-gray-900">{workout.name}</h3>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  {workout.duration} min
                  {workout.calories && ` • ${workout.calories} cal`}
                  {workout.notes && ` • ${workout.notes}`}
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(workout.createdAt).toLocaleDateString()}
                </p>
              </div>
              <Button variant="destructive" size="sm" onClick={() => handleDelete(workout.id)}>
                Delete
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
