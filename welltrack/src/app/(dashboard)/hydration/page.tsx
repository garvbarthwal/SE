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

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-gray-500">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hydration</h1>
        <p className="mt-1 text-sm text-gray-500">Track your daily water intake</p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Daily Progress</p>
            <p className="text-3xl font-bold text-gray-900">
              {totalAmount}ml / {DAILY_GOAL}ml
            </p>
          </div>
          <div className="text-4xl">💧</div>
        </div>
        <div className="mt-4 h-3 w-full rounded-full bg-gray-200">
          <div
            className="h-3 rounded-full bg-cyan-500 transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="mt-2 text-sm text-gray-500">
          {progressPercent >= 100
            ? '🎉 Goal reached!'
            : `${DAILY_GOAL - totalAmount}ml remaining`}
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Quick Add</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {QUICK_AMOUNTS.map((amount) => (
            <Button
              key={amount}
              variant="secondary"
              onClick={() => addWater(amount)}
              disabled={submitting}
            >
              {amount}ml
            </Button>
          ))}
        </div>
        <form onSubmit={handleCustomAmount} className="mt-4 flex gap-3">
          <input
            type="number"
            placeholder="Custom amount (ml)"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <Button type="submit" disabled={submitting}>
            Add
          </Button>
        </form>
      </div>

      {hydration.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-gray-900">Today&apos;s Logs</h2>
          {hydration.map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3"
            >
              <div className="flex items-center gap-3">
                <span className="text-cyan-600">💧</span>
                <span className="font-medium text-gray-900">{log.amount}ml</span>
                <span className="text-sm text-gray-400">
                  {new Date(log.createdAt).toLocaleTimeString()}
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => handleDelete(log.id)}>
                ✕
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
