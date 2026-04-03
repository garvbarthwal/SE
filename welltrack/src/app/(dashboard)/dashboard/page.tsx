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
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  const typeIcons: Record<string, string> = {
    nutrition: '🍎',
    workout: '💪',
    hydration: '💧',
    general: '🎯',
  }

  const insightColors: Record<string, string> = {
    positive: 'border-green-200 bg-green-50',
    warning: 'border-yellow-200 bg-yellow-50',
    neutral: 'border-gray-200 bg-gray-50',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {session?.user?.name || 'User'}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Here&apos;s your progress for today
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Workouts"
          value={stats?.workouts || 0}
          subtitle="Today"
          icon="💪"
          href="/workouts"
        />
        <StatCard
          title="Calories"
          value={stats?.totalCalories || 0}
          subtitle="kcal consumed"
          icon="🔥"
          href="/nutrition"
        />
        <StatCard
          title="Water"
          value={stats?.totalWater || 0}
          subtitle="ml consumed"
          icon="💧"
          href="/hydration"
        />
        <StatCard
          title="Meals"
          value={stats?.nutritionCount || 0}
          subtitle="Logged today"
          icon="🍽️"
          href="/nutrition"
        />
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/workouts"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Log Workout
          </Link>
          <Link
            href="/nutrition"
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            Log Meal
          </Link>
          <Link
            href="/hydration"
            className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700"
          >
            Add Water
          </Link>
          <Link
            href="/analyze-food"
            className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
          >
            📷 AI Food Analysis
          </Link>
          <Link
            href="/goals"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            🎯 Goals
          </Link>
        </div>
      </div>

      {aiLoading ? (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            <p className="text-sm text-gray-500">Generating your personalized insights...</p>
          </div>
        </div>
      ) : (
        <>
          {insights.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Smart Insights</h2>
                <Link href="/recommendations" className="text-sm text-blue-600 hover:underline">
                  View all →
                </Link>
              </div>
              <div className="mt-4 space-y-3">
                {insights.slice(0, 2).map((insight, i) => (
                  <div
                    key={i}
                    className={`rounded-lg border p-4 ${insightColors[insight.type] || 'border-gray-200 bg-gray-50'}`}
                  >
                    <h3 className="font-medium text-gray-900">{insight.title}</h3>
                    <p className="mt-1 text-sm text-gray-600">{insight.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {recommendations.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">AI Recommendations</h2>
                <Link href="/recommendations" className="text-sm text-blue-600 hover:underline">
                  View all →
                </Link>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {recommendations.slice(0, 3).map((rec, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-gray-100 bg-gray-50 p-4 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <span>{typeIcons[rec.type] || '💡'}</span>
                      <span className="text-xs font-medium capitalize text-gray-500">{rec.type}</span>
                    </div>
                    <h3 className="font-medium text-gray-900">{rec.title}</h3>
                    <p className="text-sm text-gray-600">{rec.description}</p>
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
  title,
  value,
  subtitle,
  icon,
  href,
}: {
  title: string
  value: number
  subtitle: string
  icon: string
  href: string
}) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
          <p className="mt-1 text-xs text-gray-400">{subtitle}</p>
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </Link>
  )
}
