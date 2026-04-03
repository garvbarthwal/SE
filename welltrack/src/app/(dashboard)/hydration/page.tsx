'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/Button'

interface HydrationLog {
  id: string
  amount: number
  createdAt: string
}

const QUICK_AMOUNTS = [250, 500, 750, 1000]
const DAILY_GOAL = 2500

export default function HydrationPage() {
  const { status } = useSession()
  const router = useRouter()
  const [hydration, setHydration] = useState<HydrationLog[]>([])
  const [totalAmount, setTotalAmount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [customAmount, setCustomAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    if (status === 'authenticated') {
      fetchHydration()
    }
  }, [status, router])

  const fetchHydration = async () => {
    try {
      const res = await fetch('/api/hydration')
      const data = await res.json()
      setHydration(data.hydration || [])
      setTotalAmount(data.totalAmount || 0)
    } catch {
      console.error('Failed to fetch hydration')
    } finally {
      setLoading(false)
    }
  }

  const addWater = async (amount: number) => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/hydration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      })

      if (res.ok) {
        fetchHydration()
      }
    } catch {
      console.error('Failed to add water')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCustomAmount = async (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseInt(customAmount)
    if (amount > 0) {
      addWater(amount)
      setCustomAmount('')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/hydration/${id}`, { method: 'DELETE' })
      fetchHydration()
    } catch {
      console.error('Failed to delete hydration log')
    }
  }

  const progressPercent = Math.min((totalAmount / DAILY_GOAL) * 100, 100)
  const radius = 80
  const circumference = Math.PI * radius
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-sm text-slate-500">Loading...</div>
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Hydration</h1>
        <p className="mt-1 text-sm text-slate-500">Track your daily water intake</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-8">
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
              <span className="text-3xl font-semibold text-slate-900">{totalAmount}</span>
              <span className="text-sm text-slate-500">/ {DAILY_GOAL}ml</span>
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-500">
            {progressPercent >= 100
              ? 'Daily goal reached!'
              : `${DAILY_GOAL - totalAmount}ml remaining`}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-base font-semibold text-slate-900">Quick Add</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {QUICK_AMOUNTS.map((amount) => (
            <Button
              key={amount}
              variant="outline"
              onClick={() => addWater(amount)}
              disabled={submitting}
            >
              {amount}ml
            </Button>
          ))}
        </div>
        <form onSubmit={handleCustomAmount} className="mt-4 flex gap-2">
          <input
            type="number"
            placeholder="Custom amount (ml)"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <Button type="submit" disabled={submitting}>
            Add
          </Button>
        </form>
      </div>

      {hydration.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-base font-semibold text-slate-900">Today&apos;s Logs</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {hydration.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between px-6 py-4"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-slate-900">{log.amount}ml</span>
                  <span className="text-sm text-slate-400">
                    {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(log.id)}>
                  Delete
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
