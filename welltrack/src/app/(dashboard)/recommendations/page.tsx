'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/Button'
import { Sparkles, RefreshCw, Lightbulb, TrendingUp } from 'lucide-react'

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

  const typeColors: Record<string, string> = {
    workout: 'bg-green-100 text-green-700',
    nutrition: 'bg-orange-100 text-orange-700',
    hydration: 'bg-cyan-100 text-cyan-700',
    general: 'bg-blue-100 text-blue-700',
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-3 border-orange-500 border-t-transparent" />
          <p className="mt-3 text-sm text-slate-500">Generating personalized insights...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">AI Recommendations</h1>
          <p className="mt-1 text-slate-500">Personalized suggestions based on your weekly data</p>
        </div>
        <Button onClick={fetchRecommendations} variant="outline" className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">{error}</div>
      )}

      {insights.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-orange-500" />
            <h2 className="text-base font-semibold text-slate-900">Insights</h2>
          </div>
          {insights.map((insight, i) => (
            <div
              key={i}
              className="rounded-lg bg-slate-50 p-4"
            >
              <h3 className="text-sm font-medium text-slate-900">{insight.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{insight.description}</p>
            </div>
          ))}
        </div>
      )}

      {recommendations.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-green-500" />
            <h2 className="text-base font-semibold text-slate-900">Recommendations</h2>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recommendations.map((rec, i) => (
              <div
                key={i}
                className="rounded-lg bg-slate-50 p-4 space-y-2"
              >
                <span className={`text-xs font-medium capitalize px-2 py-0.5 rounded-full ${typeColors[rec.type] || typeColors.general}`}>{rec.type}</span>
                <h3 className="text-sm font-medium text-slate-900">{rec.title}</h3>
                <p className="text-sm text-slate-500">{rec.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {recommendations.length === 0 && insights.length === 0 && !error && (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <Sparkles className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-4 text-sm text-slate-500">No recommendations yet. Start logging data to get personalized insights!</p>
        </div>
      )}
    </div>
  )
}
