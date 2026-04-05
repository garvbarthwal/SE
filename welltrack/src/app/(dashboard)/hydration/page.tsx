'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/Button'
import { Droplets, Trash2, Plus, GlassWater } from 'lucide-react'

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
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-orange-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Hydration</h1>
        <p className="mt-1 text-slate-500">Track your daily water intake</p>
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 p-1">
        <div className="rounded-xl bg-white p-8">
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
                  stroke="#06B6D4"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  transform="rotate(180 100 100)"
                  className="transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
                <Droplets className="h-5 w-5 text-cyan-500 mb-1" />
                <span className="text-3xl font-bold text-slate-900">{totalAmount}</span>
                <span className="text-sm text-slate-500">/ {DAILY_GOAL}ml</span>
              </div>
            </div>
            <p className="mt-4 text-sm font-medium text-slate-600">
              {progressPercent >= 100
                ? 'Daily goal reached!'
                : `${DAILY_GOAL - totalAmount}ml remaining`}
            </p>
            <div className="mt-2 w-full max-w-xs bg-slate-100 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
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
              className="flex items-center gap-2"
            >
              <GlassWater className="h-4 w-4" />
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
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
          />
          <Button type="submit" disabled={submitting} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </form>
      </div>

      {hydration.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Today&apos;s Logs</h2>
            <span className="text-sm text-slate-500">{hydration.length} entries</span>
          </div>
          <div className="divide-y divide-slate-100">
            {hydration.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-50">
                    <Droplets className="h-5 w-5 text-cyan-500" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-slate-900">{log.amount}ml</span>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(log.id)} className="flex items-center gap-1">
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
