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
    return <div className="flex h-64 items-center justify-center text-sm text-slate-500">Loading...</div>
  }

  if (!goal) {
    return <div className="text-center text-slate-500">Goal not found</div>
  }

  const progress = goal.targetValue > 0 ? Math.min((goal.currentValue / goal.targetValue) * 100, 100) : 0
  const radius = 80
  const circumference = Math.PI * radius
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <Button variant="ghost" onClick={() => router.push('/goals')}>
          ← Back to Goals
        </Button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
        <div className="flex flex-col items-center">
          <div className="relative w-48 h-24 overflow-hidden">
            <svg className="w-48 h-48" viewBox="0 0 200 200">
              <circle
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={0}
                transform="rotate(180 100 100)"
              />
              <circle
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                stroke="#22c55e"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                transform="rotate(180 100 100)"
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
              <span className="text-3xl font-semibold text-slate-900">{Math.round(progress)}%</span>
            </div>
          </div>
        </div>

        <h1 className="text-xl font-semibold text-slate-900 text-center">{goal.title}</h1>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center">
            <p className="text-sm text-slate-500">Type</p>
            <p className="text-lg font-semibold capitalize text-slate-900">{goal.type}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center">
            <p className="text-sm text-slate-500">Target</p>
            <p className="text-lg font-semibold text-slate-900">{goal.targetValue}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center">
            <p className="text-sm text-slate-500">Current</p>
            <p className="text-lg font-semibold text-slate-900">{goal.currentValue}</p>
          </div>
        </div>

        {goal.deadline && (
          <p className="text-sm text-slate-400">
            Deadline: {new Date(goal.deadline).toLocaleDateString()}
          </p>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-base font-semibold text-slate-900">Log Progress</h2>
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
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-base font-semibold text-slate-900">Progress History</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {goal.progress.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between px-6 py-4"
              >
                <div>
                  <span className="text-sm font-medium text-slate-900">{p.value}</span>
                  {p.notes && <span className="ml-2 text-sm text-slate-500">{p.notes}</span>}
                </div>
                <span className="text-sm text-slate-400">
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
