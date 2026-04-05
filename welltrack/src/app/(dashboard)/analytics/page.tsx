'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { BarChart3, Flame, Droplets, Dumbbell, UtensilsCrossed, TrendingUp } from 'lucide-react'

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
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-orange-500 border-t-transparent" />
      </div>
    )
  }

  const maxCalories = Math.max(...dailyData.map((d) => d.calories), 1)
  const maxWater = Math.max(...dailyData.map((d) => d.water), 1)

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
        <p className="mt-1 text-slate-500">Your weekly health trends</p>
      </div>

      {summary && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Workouts" value={summary.totalWorkouts} icon={Dumbbell} color="green" />
          <StatCard label="Total Calories" value={summary.totalCalories} icon={Flame} color="orange" />
          <StatCard label="Avg Daily Cal" value={Math.round(summary.avgDailyCalories)} icon={TrendingUp} color="blue" />
          <StatCard label="Total Water" value={`${summary.totalWater}ml`} icon={Droplets} color="cyan" />
          <StatCard label="Meals Logged" value={summary.mealsLogged} icon={UtensilsCrossed} color="amber" />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-2 mb-4">
            <Flame className="h-5 w-5 text-orange-500" />
            <h2 className="text-base font-semibold text-slate-900">Daily Calories</h2>
          </div>
          <div className="mt-4 flex items-end gap-1.5 h-32">
            {dailyData.map((day, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-gradient-to-t from-orange-500 to-orange-400 transition-all hover:from-orange-600 hover:to-orange-500"
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
          <div className="flex items-center gap-2 mb-4">
            <Droplets className="h-5 w-5 text-cyan-500" />
            <h2 className="text-base font-semibold text-slate-900">Daily Water Intake</h2>
          </div>
          <div className="mt-4 flex items-end gap-1.5 h-32">
            {dailyData.map((day, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-gradient-to-t from-cyan-500 to-blue-400 transition-all hover:from-cyan-600 hover:to-blue-500"
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

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-900">Daily Breakdown</h2>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="py-3 px-6 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Date</th>
                <th className="py-3 px-6 text-center text-xs font-medium text-slate-400 uppercase tracking-wider">Workouts</th>
                <th className="py-3 px-6 text-center text-xs font-medium text-slate-400 uppercase tracking-wider">Calories</th>
                <th className="py-3 px-6 text-center text-xs font-medium text-slate-400 uppercase tracking-wider">Water</th>
              </tr>
            </thead>
            <tbody>
              {dailyData.map((day, i) => (
                <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-6 text-slate-900 font-medium">
                    {new Date(day.date).toLocaleDateString('en', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td className="py-3 px-6 text-center text-slate-600">{day.workouts}</td>
                  <td className="py-3 px-6 text-center text-slate-600">{day.calories}</td>
                  <td className="py-3 px-6 text-center text-slate-600">{day.water}ml</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ElementType; color: string }) {
  const colorMap: Record<string, string> = {
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    blue: 'bg-blue-50 text-blue-600',
    cyan: 'bg-cyan-50 text-cyan-600',
    amber: 'bg-amber-50 text-amber-600',
  }

  const valueColorMap: Record<string, string> = {
    green: 'text-green-600',
    orange: 'text-orange-600',
    blue: 'text-blue-600',
    cyan: 'text-cyan-600',
    amber: 'text-amber-600',
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className={`p-2 rounded-lg w-fit ${colorMap[color]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-3 text-sm text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${valueColorMap[color]}`}>{value}</p>
    </div>
  )
}
