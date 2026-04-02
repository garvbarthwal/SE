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

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

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
    }
  }, [status, router])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
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
        </div>
      </div>
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
