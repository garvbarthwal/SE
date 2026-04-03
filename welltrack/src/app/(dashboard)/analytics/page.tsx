'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

interface DailyData {
  date: string
  workouts: number
  calories: number
  water: number
}

interface Summary {
  totalWorkouts: number
  totalCalories: number
  totalWater: number
  avgDailyCalories: number
  avgDailyWater: number
  mealsLogged: number
}

export default function AnalyticsPage() {
  const { status } = useSession()
  const router = useRouter()
  const [dailyData, setDailyData] = useState<DailyData[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    if (status === 'authenticated') {
      fetchAnalytics()
    }
  }, [status, router])

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/analytics')
      const data = await res.json()
      setDailyData(data.dailyData || [])
      setSummary(data.summary)
    } catch {
      console.error('Failed to fetch analytics')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-sm text-slate-500">Loading...</div>
  }

  const maxCalories = Math.max(...dailyData.map((d) => d.calories), 1)
  const maxWater = Math.max(...dailyData.map((d) => d.water), 1)

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Analytics</h1>
        <p className="mt-1 text-sm text-slate-500">Your weekly health trends</p>
      </div>

      {summary && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Workouts" value={summary.totalWorkouts} />
          <StatCard label="Total Calories" value={summary.totalCalories} />
          <StatCard label="Avg Daily Cal" value={Math.round(summary.avgDailyCalories)} />
          <StatCard label="Total Water" value={`${summary.totalWater}ml`} />
          <StatCard label="Meals Logged" value={summary.mealsLogged} />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-base font-semibold text-slate-900">Daily Calories</h2>
          <div className="mt-4 flex items-end gap-2 h-32">
            {dailyData.map((day, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-green-500 transition-all hover:bg-green-600"
                  style={{ height: `${(day.calories / maxCalories) * 100}%`, minHeight: day.calories > 0 ? '4px' : '0' }}
                />
                <span className="text-xs text-slate-400">
                  {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-base font-semibold text-slate-900">Daily Water Intake</h2>
          <div className="mt-4 flex items-end gap-2 h-32">
            {dailyData.map((day, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-green-500 transition-all hover:bg-green-600"
                  style={{ height: `${(day.water / maxWater) * 100}%`, minHeight: day.water > 0 ? '4px' : '0' }}
                />
                <span className="text-xs text-slate-400">
                  {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-base font-semibold text-slate-900">Daily Breakdown</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="py-2 text-left text-sm font-medium text-slate-400">Date</th>
                <th className="py-2 text-center text-sm font-medium text-slate-400">Workouts</th>
                <th className="py-2 text-center text-sm font-medium text-slate-400">Calories</th>
                <th className="py-2 text-center text-sm font-medium text-slate-400">Water</th>
              </tr>
            </thead>
            <tbody>
              {dailyData.map((day, i) => (
                <tr key={i} className="border-b border-slate-100 last:border-0">
                  <td className="py-2 text-slate-900">
                    {new Date(day.date).toLocaleDateString('en', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td className="py-2 text-center text-slate-600">{day.workouts}</td>
                  <td className="py-2 text-center text-slate-600">{day.calories}</td>
                  <td className="py-2 text-center text-slate-600">{day.water}ml</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  )
}
