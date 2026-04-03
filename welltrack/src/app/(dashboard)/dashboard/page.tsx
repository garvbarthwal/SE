'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface DashboardStats {
  workouts: number
  totalCalories: number
  totalWater: number
  nutritionCount: number
}

interface Recommendation {
  title: string
  description: string
  type: string
}

interface Insight {
  title: string
  description: string
  type: string
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [insights, setInsights] = useState<Insight[]>([])
  const [aiLoading, setAiLoading] = useState(() => {
    return !sessionStorage.getItem('ai_recommendations_fetched')
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (status === 'authenticated') {
      fetch('/api/dashboard')
        .then((res) => res.json())
        .then((data) => {
          setStats(data)
          setLoading(false)
        })
        .catch(() => setLoading(false))

      const aiFetched = sessionStorage.getItem('ai_recommendations_fetched')
      if (!aiFetched) {
        fetch('/api/ai/recommendations')
          .then((res) => res.json())
          .then((data) => {
            setRecommendations(data.recommendations || [])
            setInsights(data.insights || [])
            sessionStorage.setItem('ai_recommendations_fetched', 'true')
          })
          .catch(() => {})
          .finally(() => setAiLoading(false))
      }
    }
  }, [status, router])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-sm text-slate-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {session?.user?.name || 'User'} · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Calories"
          value={stats?.totalCalories || 0}
          unit="kcal"
          href="/nutrition"
          accent="orange"
        />
        <StatCard
          label="Protein"
          value={0}
          unit="g"
          href="/nutrition"
          accent="blue"
        />
        <StatCard
          label="Water"
          value={stats?.totalWater || 0}
          unit="ml"
          href="/hydration"
          accent="cyan"
        />
        <StatCard
          label="Workouts"
          value={stats?.workouts || 0}
          unit=""
          href="/workouts"
          accent="green"
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-base font-semibold text-slate-900">Quick Add</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Link
            href="/nutrition"
            className="flex flex-col items-center gap-2 rounded-lg border border-slate-200 p-4 hover:border-green-300 hover:bg-green-50 transition-colors"
          >
            <span className="text-2xl">🍽️</span>
            <span className="text-sm font-medium text-slate-700">Log Food</span>
          </Link>
          <Link
            href="/workouts"
            className="flex flex-col items-center gap-2 rounded-lg border border-slate-200 p-4 hover:border-green-300 hover:bg-green-50 transition-colors"
          >
            <span className="text-2xl">🏋️</span>
            <span className="text-sm font-medium text-slate-700">Exercise</span>
          </Link>
          <Link
            href="/hydration"
            className="flex flex-col items-center gap-2 rounded-lg border border-slate-200 p-4 hover:border-green-300 hover:bg-green-50 transition-colors"
          >
            <span className="text-2xl">💧</span>
            <span className="text-sm font-medium text-slate-700">Add Water</span>
          </Link>
          <Link
            href="/analyze-food"
            className="flex flex-col items-center gap-2 rounded-lg border border-slate-200 p-4 hover:border-green-300 hover:bg-green-50 transition-colors"
          >
            <span className="text-2xl">📷</span>
            <span className="text-sm font-medium text-slate-700">Scan Food</span>
          </Link>
        </div>
      </div>

      {aiLoading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
            <p className="text-sm text-slate-500">Generating your personalized insights...</p>
          </div>
        </div>
      ) : (
        <>
          {insights.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-900">Smart Insights</h2>
                <Link href="/recommendations" className="text-sm text-green-600 hover:underline">
                  View all
                </Link>
              </div>
              <div className="mt-4 space-y-3">
                {insights.slice(0, 2).map((insight, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                  >
                    <h3 className="text-sm font-medium text-slate-900">{insight.title}</h3>
                    <p className="mt-1 text-sm text-slate-500">{insight.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {recommendations.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-900">Recommendations</h2>
                <Link href="/recommendations" className="text-sm text-green-600 hover:underline">
                  View all
                </Link>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {recommendations.slice(0, 3).map((rec, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                  >
                    <span className="text-xs font-medium capitalize text-slate-400">{rec.type}</span>
                    <h3 className="mt-1 text-sm font-medium text-slate-900">{rec.title}</h3>
                    <p className="mt-0.5 text-sm text-slate-500">{rec.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  unit,
  href,
  accent,
}: {
  label: string
  value: number
  unit: string
  href: string
  accent: 'orange' | 'blue' | 'cyan' | 'green'
}) {
  const accentColors = {
    orange: 'border-l-orange-400',
    blue: 'border-l-blue-400',
    cyan: 'border-l-cyan-400',
    green: 'border-l-green-500',
  }

  const accentText = {
    orange: 'text-orange-600',
    blue: 'text-blue-600',
    cyan: 'text-cyan-600',
    green: 'text-green-600',
  }

  return (
    <Link
      href={href}
      className={`rounded-xl border border-slate-200 bg-white p-5 border-l-4 ${accentColors[accent]} transition-colors hover:border-slate-300`}
    >
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${accentText[accent]}`}>
        {value}
        {unit && <span className="ml-1 text-sm font-normal text-slate-400">{unit}</span>}
      </p>
    </Link>
  )
}
