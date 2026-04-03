'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface Goal {
  id: string
  type: string
  title: string
  targetValue: number
  currentValue: number
  deadline: string | null
  status: string
  progress: { id: string; value: number; notes: string | null; loggedAt: string }[]
}

export default function GoalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { status } = useSession()
  const router = useRouter()
  const [goal, setGoal] = useState<Goal | null>(null)
  const [loading, setLoading] = useState(true)
  const [progressValue, setProgressValue] = useState('')
  const [progressNotes, setProgressNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [goalId, setGoalId] = useState('')

  useEffect(() => {
    params.then((p) => setGoalId(p.id))
  }, [params])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    if (status === 'authenticated' && goalId) {
      fetchGoal()
    }
  }, [status, router, goalId])

  const fetchGoal = async () => {
    try {
      const res = await fetch(`/api/goals/${goalId}`)
      const data = await res.json()
      setGoal(data.goal)
    } catch {
      console.error('Failed to fetch goal')
    } finally {
      setLoading(false)
    }
  }

  const handleProgressSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const res = await fetch(`/api/goals/${goalId}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          value: parseFloat(progressValue),
          notes: progressNotes || undefined,
        }),
      })

      if (res.ok) {
        setProgressValue('')
        setProgressNotes('')
        fetchGoal()
      }
    } catch {
      console.error('Failed to log progress')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-gray-500">Loading...</div>
  }

  if (!goal) {
    return <div className="text-center text-gray-500">Goal not found</div>
  }

  const progress = goal.targetValue > 0 ? Math.min((goal.currentValue / goal.targetValue) * 100, 100) : 0

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" onClick={() => router.push('/goals')}>
          ← Back to Goals
        </Button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">{goal.title}</h1>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Type</p>
            <p className="text-lg font-semibold capitalize">{goal.type}</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Target</p>
            <p className="text-lg font-semibold">{goal.targetValue}</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Current</p>
            <p className="text-lg font-semibold">{goal.currentValue}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Progress</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <div className="h-3 w-full rounded-full bg-gray-200">
            <div
              className="h-3 rounded-full bg-blue-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {goal.deadline && (
          <p className="text-sm text-gray-500">
            Deadline: {new Date(goal.deadline).toLocaleDateString()}
          </p>
        )}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Log Progress</h2>
        <form onSubmit={handleProgressSubmit} className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Current Value"
              type="number"
              placeholder="e.g., 72.5"
              value={progressValue}
              onChange={(e) => setProgressValue(e.target.value)}
              required
            />
            <Input
              label="Notes (optional)"
              placeholder="How are you feeling?"
              value={progressNotes}
              onChange={(e) => setProgressNotes(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Logging...' : 'Log Progress'}
          </Button>
        </form>
      </div>

      {goal.progress.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Progress History</h2>
          <div className="mt-4 space-y-2">
            {goal.progress.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-lg border border-gray-100 p-3"
              >
                <div>
                  <span className="font-medium text-gray-900">{p.value}</span>
                  {p.notes && <span className="ml-2 text-sm text-gray-500">{p.notes}</span>}
                </div>
                <span className="text-sm text-gray-400">
                  {new Date(p.loggedAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
