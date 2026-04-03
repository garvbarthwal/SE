'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/Button'

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

export default function RecommendationsPage() {
  const { status } = useSession()
  const router = useRouter()
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    if (status === 'authenticated') {
      fetchRecommendations()
    }
  }, [status, router])

  const fetchRecommendations = async () => {
    try {
      const res = await fetch('/api/ai/recommendations')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setRecommendations(data.recommendations || [])
      setInsights(data.insights || [])
    } catch {
      setError('Failed to generate recommendations. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const typeIcons: Record<string, string> = {
    nutrition: '🍎',
    workout: '💪',
    hydration: '💧',
    general: '🎯',
  }

  const typeColors: Record<string, string> = {
    nutrition: 'bg-green-100 text-green-700',
    workout: 'bg-blue-100 text-blue-700',
    hydration: 'bg-cyan-100 text-cyan-700',
    general: 'bg-purple-100 text-purple-700',
  }

  const insightColors: Record<string, string> = {
    positive: 'border-green-200 bg-green-50',
    warning: 'border-yellow-200 bg-yellow-50',
    neutral: 'border-gray-200 bg-gray-50',
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="mt-4 text-gray-500">Generating personalized insights...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Recommendations</h1>
          <p className="mt-1 text-sm text-gray-500">Personalized suggestions based on your weekly data</p>
        </div>
        <Button onClick={fetchRecommendations} variant="secondary">
          Refresh
        </Button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">{error}</div>
      )}

      {recommendations.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Recommendations</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recommendations.map((rec, i) => (
              <div
                key={i}
                className="rounded-lg border border-gray-200 bg-white p-5 space-y-3"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{typeIcons[rec.type] || '💡'}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${typeColors[rec.type] || 'bg-gray-100 text-gray-700'}`}>
                    {rec.type}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900">{rec.title}</h3>
                <p className="text-sm text-gray-600">{rec.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {insights.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Insights</h2>
          <div className="mt-4 space-y-3">
            {insights.map((insight, i) => (
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

      {recommendations.length === 0 && insights.length === 0 && !error && (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <span className="text-4xl">🤖</span>
          <p className="mt-2 text-gray-500">No recommendations yet. Start logging data to get personalized insights!</p>
        </div>
      )}
    </div>
  )
}
