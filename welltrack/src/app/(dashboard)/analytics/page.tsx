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
    return <div className="flex h-64 items-center justify-center text-gray-500">Loading...</div>
  }

  const maxCalories = Math.max(...dailyData.map((d) => d.calories), 1)
  const maxWater = Math.max(...dailyData.map((d) => d.water), 1)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="mt-1 text-sm text-gray-500">Your weekly health trends</p>
      </div>

      {summary && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Workouts" value={summary.totalWorkouts} />
          <StatCard label="Total Calories" value={summary.totalCalories} />
          <StatCard label="Avg Daily Cal" value={summary.avgDailyCalories} />
          <StatCard label="Total Water" value={`${summary.totalWater}ml`} />
          <StatCard label="Meals Logged" value={summary.mealsLogged} />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Daily Calories</h2>
          <div className="mt-4 flex items-end gap-2 h-40">
            {dailyData.map((day, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-orange-400 transition-all hover:bg-orange-500"
                  style={{ height: `${(day.calories / maxCalories) * 100}%`, minHeight: day.calories > 0 ? '4px' : '0' }}
                />
                <span className="text-xs text-gray-400">
                  {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Daily Water Intake</h2>
          <div className="mt-4 flex items-end gap-2 h-40">
            {dailyData.map((day, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-cyan-400 transition-all hover:bg-cyan-500"
                  style={{ height: `${(day.water / maxWater) * 100}%`, minHeight: day.water > 0 ? '4px' : '0' }}
                />
                <span className="text-xs text-gray-400">
                  {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Daily Breakdown</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-2 text-left font-medium text-gray-500">Date</th>
                <th className="py-2 text-center font-medium text-gray-500">Workouts</th>
                <th className="py-2 text-center font-medium text-gray-500">Calories</th>
                <th className="py-2 text-center font-medium text-gray-500">Water</th>
              </tr>
            </thead>
            <tbody>
              {dailyData.map((day, i) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="py-2 text-gray-900">
                    {new Date(day.date).toLocaleDateString('en', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td className="py-2 text-center text-gray-600">{day.workouts}</td>
                  <td className="py-2 text-center text-gray-600">{day.calories}</td>
                  <td className="py-2 text-center text-gray-600">{day.water}ml</td>
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
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
    </div>
  )
}
