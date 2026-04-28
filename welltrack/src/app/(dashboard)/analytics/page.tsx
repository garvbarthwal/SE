'use client'

import type { ElementType } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  BarChart3,
  Droplets,
  Dumbbell,
  Flame,
  Sparkles,
  TrendingUp,
  UtensilsCrossed,
} from 'lucide-react'
import { TrackingFilters } from '@/components/tracking/TrackingFilters'
import { formatDisplayDate, getRelativeDateKey, getTodayDateKey } from '@/lib/tracking'

interface DailyData {
  date: string
  workouts: number
  calories: number
  water: number
  meals: number
  domainsCompleted: number
  active: boolean
}

interface Summary {
  totalWorkouts: number
  totalCalories: number
  totalWater: number
  avgDailyCalories: number
  avgDailyWater: number
  mealsLogged: number
  activeDays: number
  currentStreak: number
  longestStreak: number
  completionRate: number
  rangeDays: number
  from: string
  to: string
}

export default function AnalyticsPage() {
  const { status } = useSession()
  const router = useRouter()
  const today = getTodayDateKey()

  const [dailyData, setDailyData] = useState<DailyData[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'day' | 'range'>('range')
  const [selectedDate, setSelectedDate] = useState(today)
  const [rangeFrom, setRangeFrom] = useState(getRelativeDateKey(-6))
  const [rangeTo, setRangeTo] = useState(today)
  const [filterLabel, setFilterLabel] = useState('Last 7 days')

  const fetchAnalytics = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams(
        viewMode === 'day'
          ? { date: selectedDate }
          : {
              from: rangeFrom,
              to: rangeTo,
            }
      )

      const res = await fetch(`/api/analytics?${params.toString()}`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch analytics')
      }

      setDailyData(data.dailyData || [])
      setSummary(data.summary || null)
      setFilterLabel(
        viewMode === 'day'
          ? selectedDate
          : data.summary?.from && data.summary?.to
            ? `${data.summary.from} to ${data.summary.to}`
            : `${rangeFrom} to ${rangeTo}`
      )
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to fetch analytics')
      setDailyData([])
      setSummary(null)
    } finally {
      setLoading(false)
    }
  }, [rangeFrom, rangeTo, selectedDate, viewMode])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (status === 'authenticated') {
      void fetchAnalytics()
    }
  }, [status, router, fetchAnalytics])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-orange-500 border-t-transparent" />
      </div>
    )
  }

  const maxCalories = Math.max(...dailyData.map((day) => day.calories), 1)
  const maxWater = Math.max(...dailyData.map((day) => day.water), 1)
  const maxWorkouts = Math.max(...dailyData.map((day) => day.workouts), 1)

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Analytics</h1>
        <p className="mt-1 text-slate-500">Explore daily coverage, streaks, and trend lines across any date window.</p>
      </div>

      <TrackingFilters
        title="Filter Analytics Window"
        description="Switch between a single-day snapshot and a broader range to understand momentum, gaps, and streaks."
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        selectedDate={selectedDate}
        onSelectedDateChange={setSelectedDate}
        rangeFrom={rangeFrom}
        rangeTo={rangeTo}
        onRangeFromChange={setRangeFrom}
        onRangeToChange={setRangeTo}
        onUseToday={() => {
          setViewMode('day')
          setSelectedDate(today)
        }}
        onUseLast7Days={() => {
          setViewMode('range')
          setRangeFrom(getRelativeDateKey(-6))
          setRangeTo(today)
        }}
        onUseLast30Days={() => {
          setViewMode('range')
          setRangeFrom(getRelativeDateKey(-29))
          setRangeTo(today)
        }}
        accent="blue"
      >
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <span className="block text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Loaded Window</span>
          <p className="mt-2 text-sm font-medium text-slate-900">{filterLabel}</p>
          <p className="mt-1 text-xs text-slate-500">{dailyData.length} tracked day{dailyData.length === 1 ? '' : 's'} in this result</p>
        </div>
      </TrackingFilters>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      {summary ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <StatCard label="Workouts" value={summary.totalWorkouts.toString()} icon={Dumbbell} accent="green" />
          <StatCard label="Calories" value={summary.totalCalories.toString()} icon={Flame} accent="orange" />
          <StatCard label="Water" value={`${summary.totalWater} ml`} icon={Droplets} accent="cyan" />
          <StatCard label="Meals" value={summary.mealsLogged.toString()} icon={UtensilsCrossed} accent="amber" />
          <StatCard label="Current Streak" value={`${summary.currentStreak} d`} icon={TrendingUp} accent="blue" />
          <StatCard label="Coverage" value={`${summary.completionRate}%`} icon={Sparkles} accent="violet" />
        </div>
      ) : null}

      {summary ? (
        <div className="grid gap-6 xl:grid-cols-[1.3fr,0.7fr]">
          <div className="grid gap-6 lg:grid-cols-3">
            <TrendCard
              title="Workouts"
              icon={Dumbbell}
              iconClass="text-emerald-600"
              barClass="from-emerald-500 to-green-400"
              days={dailyData}
              maxValue={maxWorkouts}
              getValue={(day) => day.workouts}
              formatValue={(value) => value.toString()}
            />
            <TrendCard
              title="Calories"
              icon={Flame}
              iconClass="text-orange-600"
              barClass="from-orange-500 to-amber-400"
              days={dailyData}
              maxValue={maxCalories}
              getValue={(day) => day.calories}
              formatValue={(value) => value.toString()}
            />
            <TrendCard
              title="Hydration"
              icon={Droplets}
              iconClass="text-cyan-600"
              barClass="from-cyan-500 to-blue-400"
              days={dailyData}
              maxValue={maxWater}
              getValue={(day) => day.water}
              formatValue={(value) => `${value} ml`}
            />
          </div>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <h2 className="text-base font-semibold text-slate-900">Window Highlights</h2>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <HighlightRow label="Range Length" value={`${summary.rangeDays} day${summary.rangeDays === 1 ? '' : 's'}`} helper="Days represented in the current view" />
              <HighlightRow label="Active Days" value={summary.activeDays.toString()} helper="Days with at least one tracked action" />
              <HighlightRow label="Longest Streak" value={`${summary.longestStreak} days`} helper="Best continuous run in this window" />
              <HighlightRow label="Avg Daily Calories" value={`${summary.avgDailyCalories} kcal`} helper="Average over the selected range" />
              <HighlightRow label="Avg Daily Water" value={`${summary.avgDailyWater} ml`} helper="Average hydration pace per day" />
            </div>
          </section>
        </div>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/60">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Daily Breakdown</h2>
            <p className="mt-1 text-sm text-slate-500">Every day shows logged domains, activity coverage, and raw totals.</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
            {summary?.from} to {summary?.to}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-6 py-3 text-left font-medium">Date</th>
                <th className="px-6 py-3 text-center font-medium">Workouts</th>
                <th className="px-6 py-3 text-center font-medium">Meals</th>
                <th className="px-6 py-3 text-center font-medium">Calories</th>
                <th className="px-6 py-3 text-center font-medium">Water</th>
                <th className="px-6 py-3 text-center font-medium">Domains</th>
                <th className="px-6 py-3 text-center font-medium">Active</th>
              </tr>
            </thead>
            <tbody>
              {dailyData.map((day) => (
                <tr key={day.date} className="border-t border-slate-100 transition-colors hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {formatDisplayDate(`${day.date}T00:00:00`, {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td className="px-6 py-4 text-center text-slate-600">{day.workouts}</td>
                  <td className="px-6 py-4 text-center text-slate-600">{day.meals}</td>
                  <td className="px-6 py-4 text-center text-slate-600">{day.calories}</td>
                  <td className="px-6 py-4 text-center text-slate-600">{day.water} ml</td>
                  <td className="px-6 py-4 text-center text-slate-600">{day.domainsCompleted}/3</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${day.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {day.active ? 'Active' : 'Idle'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function StatCard({ label, value, icon: Icon, accent }: { label: string; value: string; icon: ElementType; accent: 'green' | 'orange' | 'cyan' | 'amber' | 'blue' | 'violet' }) {
  const colorMap = {
    green: 'bg-emerald-50 text-emerald-600',
    orange: 'bg-orange-50 text-orange-600',
    cyan: 'bg-cyan-50 text-cyan-600',
    amber: 'bg-amber-50 text-amber-600',
    blue: 'bg-blue-50 text-blue-600',
    violet: 'bg-violet-50 text-violet-600',
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${colorMap[accent]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-4 text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
    </div>
  )
}

function TrendCard({
  title,
  icon: Icon,
  iconClass,
  barClass,
  days,
  maxValue,
  getValue,
  formatValue,
}: {
  title: string
  icon: ElementType
  iconClass: string
  barClass: string
  days: DailyData[]
  maxValue: number
  getValue: (day: DailyData) => number
  formatValue: (value: number) => string
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
      <div className="flex items-center gap-2">
        <Icon className={`h-5 w-5 ${iconClass}`} />
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      </div>

      <div className="mt-5 flex h-40 items-end gap-2">
        {days.map((day) => {
          const value = getValue(day)
          const height = maxValue === 0 ? 0 : Math.max((value / maxValue) * 100, value > 0 ? 8 : 0)

          return (
            <div key={day.date} className="flex flex-1 flex-col items-center gap-2">
              <div className="text-[11px] font-medium text-slate-400">{formatValue(value)}</div>
              <div className="flex h-full w-full items-end rounded-xl bg-slate-50 px-1.5 pb-1.5">
                <div className={`w-full rounded-lg bg-gradient-to-t ${barClass} transition-all duration-300`} style={{ height: `${height}%` }} />
              </div>
              <div className="text-[11px] text-slate-400">
                {formatDisplayDate(`${day.date}T00:00:00`, { weekday: 'short' })}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function HighlightRow({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-2 text-lg font-semibold text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{helper}</p>
    </div>
  )
}
