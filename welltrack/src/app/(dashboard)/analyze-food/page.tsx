'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/Button'

export default function AnalyzeFoodPage() {
  const { status } = useSession()
  const router = useRouter()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<{
    food: string
    calories: number
    protein: number
    carbs: number
    fat: number
    portion: string
  } | null>(null)
  const [error, setError] = useState('')
  const [logging, setLogging] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setPreview(URL.createObjectURL(file))
      setResult(null)
      setError('')
    }
  }

  const handleAnalyze = async () => {
    if (!selectedFile) return

    setAnalyzing(true)
    setError('')
    setResult(null)

    try {
      const uploadForm = new FormData()
      uploadForm.append('file', selectedFile)

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: uploadForm,
      })

      if (!uploadRes.ok) {
        throw new Error('Upload failed')
      }

      const uploadData = await uploadRes.json()

      const analyzeRes = await fetch('/api/ai/analyze-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: uploadData.url }),
      })

      if (!analyzeRes.ok) {
        throw new Error('Analysis failed')
      }

      const analyzeData = await analyzeRes.json()
      setResult(analyzeData.parsedData)
    } catch {
      setError('Failed to analyze food. Please try again.')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleLogToNutrition = async () => {
    if (!result) return
    setLogging(true)

    try {
      const res = await fetch('/api/nutrition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          food: result.food || 'Unknown',
          calories: Math.round(result.calories || 0),
          protein: result.protein || undefined,
          carbs: result.carbs || undefined,
          fat: result.fat || undefined,
          portion: result.portion || undefined,
        }),
      })

      if (res.ok) {
        setResult(null)
        setSelectedFile(null)
        setPreview(null)
      }
    } catch {
      console.error('Failed to log nutrition')
    } finally {
      setLogging(false)
    }
  }

  if (status === 'unauthenticated') return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI Food Analysis</h1>
        <p className="mt-1 text-sm text-gray-500">Take a photo of your food to get instant nutrition data</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Upload Food Photo</h2>

          <div className="mt-4 space-y-4">
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-8 hover:bg-gray-50">
              {preview ? (
                <img src={preview} alt="Food preview" className="max-h-64 rounded-lg" />
              ) : (
                <div className="text-center">
                  <span className="text-4xl">📷</span>
                  <p className="mt-2 text-sm text-gray-500">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-400">PNG, JPG up to 5MB</p>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            <Button
              onClick={handleAnalyze}
              disabled={!selectedFile || analyzing}
              className="w-full"
            >
              {analyzing ? 'Analyzing...' : 'Analyze Food'}
            </Button>

            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Results</h2>

          {!result && !analyzing && (
            <div className="mt-8 text-center text-gray-500">
              <span className="text-4xl">🍽️</span>
              <p className="mt-2">Upload a food photo to see results</p>
            </div>
          )}

          {analyzing && (
            <div className="mt-8 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
              <p className="mt-4 text-gray-500">Analyzing your food...</p>
            </div>
          )}

          {result && (
            <div className="mt-4 space-y-4">
              <div className="rounded-lg bg-gray-50 p-4">
                <h3 className="text-xl font-bold text-gray-900">{result.food || 'Unknown'}</h3>
                {result.portion && <p className="text-sm text-gray-500">{result.portion}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-orange-50 p-3 text-center">
                  <p className="text-2xl font-bold text-orange-600">{result.calories || 0}</p>
                  <p className="text-xs text-gray-500">Calories</p>
                </div>
                <div className="rounded-lg bg-blue-50 p-3 text-center">
                  <p className="text-2xl font-bold text-blue-600">{result.protein || 0}g</p>
                  <p className="text-xs text-gray-500">Protein</p>
                </div>
                <div className="rounded-lg bg-green-50 p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">{result.carbs || 0}g</p>
                  <p className="text-xs text-gray-500">Carbs</p>
                </div>
                <div className="rounded-lg bg-yellow-50 p-3 text-center">
                  <p className="text-2xl font-bold text-yellow-600">{result.fat || 0}g</p>
                  <p className="text-xs text-gray-500">Fat</p>
                </div>
              </div>

              <Button onClick={handleLogToNutrition} disabled={logging} className="w-full">
                {logging ? 'Logging...' : 'Log to Nutrition'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
