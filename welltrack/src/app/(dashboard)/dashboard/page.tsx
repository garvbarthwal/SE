'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  UtensilsCrossed,
  Dumbbell,
  Droplets,
  Camera,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Flame,
  Beef,
  Wheat,
} from 'lucide-react'

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

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-orange-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{getGreeting()}</h1>
          <p className="mt-1 text-slate-500">
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
          icon={Flame}
          accent="orange"
        />
        <StatCard
          label="Protein"
          value={0}
          unit="g"
          href="/nutrition"
          icon={Beef}
          accent="blue"
        />
        <StatCard
          label="Water"
          value={stats?.totalWater || 0}
          unit="ml"
          href="/hydration"
          icon={Droplets}
          accent="cyan"
        />
        <StatCard
          label="Workouts"
          value={stats?.workouts || 0}
          unit=""
          href="/workouts"
          icon={Dumbbell}
          accent="green"
        />
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 p-1">
        <div className="rounded-xl bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Quick Actions</h2>
              <p className="mt-1 text-sm text-slate-500">Log your daily activities</p>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <QuickAction
              href="/nutrition"
              icon={UtensilsCrossed}
              label="Log Food"
              color="orange"
            />
            <QuickAction
              href="/workouts"
              icon={Dumbbell}
              label="Log Workout"
              color="green"
            />
            <QuickAction
              href="/hydration"
              icon={Droplets}
              label="Add Water"
              color="cyan"
            />
            <QuickAction
              href="/analyze-food"
              icon={Camera}
              label="Scan Food"
              color="blue"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {aiLoading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
              <p className="text-sm text-slate-500">Generating your personalized insights...</p>
            </div>
          </div>
        ) : (
          <>
            {insights.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-orange-500" />
                    <h2 className="text-base font-semibold text-slate-900">Smart Insights</h2>
                  </div>
                  <Link href="/recommendations" className="text-sm text-orange-600 hover:underline flex items-center gap-1">
                    View all <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className="mt-4 space-y-3">
                  {insights.slice(0, 2).map((insight, i) => (
                    <div
                      key={i}
                      className="rounded-lg bg-slate-50 p-4"
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
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    <h2 className="text-base font-semibold text-slate-900">Recommendations</h2>
                  </div>
                  <Link href="/recommendations" className="text-sm text-orange-600 hover:underline flex items-center gap-1">
                    View all <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className="mt-4 space-y-3">
                  {recommendations.slice(0, 2).map((rec, i) => (
                    <div
                      key={i}
                      className="rounded-lg bg-slate-50 p-4"
                    >
                      <span className="text-xs font-medium capitalize text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">{rec.type}</span>
                      <h3 className="mt-2 text-sm font-medium text-slate-900">{rec.title}</h3>
                      <p className="mt-1 text-sm text-slate-500">{rec.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  unit,
  href,
  icon: Icon,
  accent,
}: {
  label: string
  value: number
  unit: string
  href: string
  icon: React.ElementType
  accent: 'orange' | 'blue' | 'cyan' | 'green'
}) {
  const accentStyles = {
    orange: 'bg-orange-50 text-orange-600',
    blue: 'bg-blue-50 text-blue-600',
    cyan: 'bg-cyan-50 text-cyan-600',
    green: 'bg-green-50 text-green-600',
  }

  const valueColors = {
    orange: 'text-orange-600',
    blue: 'text-blue-600',
    cyan: 'text-cyan-600',
    green: 'text-green-600',
  }

  return (
    <Link
      href={href}
      className="group rounded-xl border border-slate-200 bg-white p-5 transition-all duration-200 hover:border-orange-200 hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <div className={`p-2 rounded-lg ${accentStyles[accent]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <ArrowRight className="h-4 w-4 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      <p className="mt-4 text-sm text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${valueColors[accent]}`}>
        {value}
        {unit && <span className="ml-1 text-sm font-normal text-slate-400">{unit}</span>}
      </p>
    </Link>
  )
}

function QuickAction({
  href,
  icon: Icon,
  label,
  color,
}: {
  href: string
  icon: React.ElementType
  label: string
  color: 'orange' | 'blue' | 'cyan' | 'green'
}) {
  const colorStyles = {
    orange: 'bg-orange-50 text-orange-600 group-hover:bg-orange-100',
    blue: 'bg-blue-50 text-blue-600 group-hover:bg-blue-100',
    cyan: 'bg-cyan-50 text-cyan-600 group-hover:bg-cyan-100',
    green: 'bg-green-50 text-green-600 group-hover:bg-green-100',
  }

  return (
    <Link
      href={href}
      className={`group flex flex-col items-center gap-3 rounded-xl border border-slate-100 p-4 transition-all duration-200 hover:border-slate-200 hover:shadow-sm ${colorStyles[color]}`}
    >
      <Icon className="h-6 w-6" />
      <span className="text-sm font-medium text-slate-700">{label}</span>
    </Link>
  )
}
