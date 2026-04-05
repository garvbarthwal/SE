'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ArrowLeft, Target, Calendar, TrendingUp, CheckCircle2, Clock } from 'lucide-react'

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

const goalTypeColors: Record<string, string> = {
  weight: 'bg-orange-100 text-orange-700',
  workout: 'bg-green-100 text-green-700',
  nutrition: 'bg-blue-100 text-blue-700',
  hydration: 'bg-cyan-100 text-cyan-700',
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
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-orange-500 border-t-transparent" />
      </div>
    )
  }

  if (!goal) {
    return (
      <div className="max-w-5xl mx-auto text-center py-16">
        <Target className="mx-auto h-12 w-12 text-slate-300" />
        <p className="mt-4 text-slate-500">Goal not found</p>
      </div>
    )
  }

  const progress = goal.targetValue > 0 ? Math.min((goal.currentValue / goal.targetValue) * 100, 100) : 0
  const radius = 80
  const circumference = Math.PI * radius
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => router.push('/goals')} className="flex items-center gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back to Goals
      </Button>

      <div className="rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 p-1">
        <div className="rounded-xl bg-white p-6 space-y-4">
          <div className="flex flex-col items-center">
            <div className="relative w-48 h-24 overflow-hidden">
              <svg className="w-48 h-48" viewBox="0 0 200 200">
                <circle
                  cx="100"
                  cy="100"
                  r={radius}
                  fill="none"
                  stroke="#E2E8F0"
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
                  stroke="#F97316"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  transform="rotate(180 100 100)"
                  className="transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
                <span className="text-3xl font-bold text-slate-900">{Math.round(progress)}%</span>
              </div>
            </div>
            <div className="w-full max-w-xs mt-4 bg-slate-100 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-orange-400 to-orange-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <h1 className="text-xl font-bold text-slate-900 text-center">{goal.title}</h1>

          <div className="grid gap-4 sm:grid-cols-3">
            <StatBox label="Type" value={goal.type} capitalize />
            <StatBox label="Target" value={goal.targetValue.toString()} />
            <StatBox label="Current" value={goal.currentValue.toString()} />
          </div>

          {goal.deadline && (
            <p className="text-sm text-slate-400 flex items-center justify-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Deadline: {new Date(goal.deadline).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-orange-500" />
          <h2 className="text-base font-semibold text-slate-900">Log Progress</h2>
        </div>
        <form onSubmit={handleProgressSubmit} className="space-y-4">
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
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Progress History</h2>
            <span className="text-sm text-slate-400">{goal.progress.length} entries</span>
          </div>
          <div className="divide-y divide-slate-100">
            {goal.progress.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50">
                    <CheckCircle2 className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-slate-900">{p.value}</span>
                    {p.notes && <p className="text-xs text-slate-500 mt-0.5">{p.notes}</p>}
                  </div>
                </div>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
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

function StatBox({ label, value, capitalize }: { label: string; value: string; capitalize?: boolean }) {
  return (
    <div className="rounded-lg bg-slate-50 p-4 text-center">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`text-lg font-semibold text-slate-900 ${capitalize ? 'capitalize' : ''}`}>{value}</p>
    </div>
  )
}
