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

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
          <p className="mt-3 text-sm text-slate-500">Generating personalized insights...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">AI Recommendations</h1>
          <p className="mt-1 text-sm text-slate-500">Personalized suggestions based on your weekly data</p>
        </div>
        <Button onClick={fetchRecommendations} variant="outline">
          Refresh
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">{error}</div>
      )}

      {insights.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-3">
          <h2 className="text-base font-semibold text-slate-900">Insights</h2>
          {insights.map((insight, i) => (
            <div
              key={i}
              className="rounded-lg border border-slate-200 bg-slate-50 p-4"
            >
              <h3 className="text-sm font-medium text-slate-900">{insight.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{insight.description}</p>
            </div>
          ))}
        </div>
      )}

      {recommendations.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-base font-semibold text-slate-900">Recommendations</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recommendations.map((rec, i) => (
              <div
                key={i}
                className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2"
              >
                <span className="text-xs font-medium capitalize text-slate-400">{rec.type}</span>
                <h3 className="text-sm font-medium text-slate-900">{rec.title}</h3>
                <p className="text-sm text-slate-500">{rec.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {recommendations.length === 0 && insights.length === 0 && !error && (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-sm text-slate-500">No recommendations yet. Start logging data to get personalized insights!</p>
        </div>
      )}
    </div>
  )
}
