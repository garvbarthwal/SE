'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/Button'
import { Camera, Upload, Image, Loader2, CheckCircle, Flame, Wheat, Droplet, UtensilsCrossed } from 'lucide-react'

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
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">AI Food Analysis</h1>
        <p className="mt-1 text-slate-500">Upload a photo of your food to get nutrition data</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-2 mb-4">
            <Camera className="h-5 w-5 text-orange-500" />
            <h2 className="text-base font-semibold text-slate-900">Upload Photo</h2>
          </div>

          <div className="mt-4 space-y-4">
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 p-8 hover:bg-orange-50 hover:border-orange-300 transition-all duration-200">
              {preview ? (
                <div className="relative">
                  <img src={preview} alt="Food preview" className="max-h-64 rounded-lg object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg opacity-0 hover:opacity-100 transition-opacity">
                    <p className="text-white text-sm font-medium">Click to change</p>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-orange-50">
                    <Image className="h-6 w-6 text-orange-500" />
                  </div>
                  <p className="mt-3 text-sm font-medium text-slate-700">Click to upload or drag and drop</p>
                  <p className="text-xs text-slate-400 mt-1">PNG, JPG up to 5MB</p>
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
              className="w-full flex items-center justify-center gap-2"
            >
              {analyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4" />
                  Analyze Food
                </>
              )}
            </Button>

            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-2 mb-4">
            <UtensilsCrossed className="h-5 w-5 text-orange-500" />
            <h2 className="text-base font-semibold text-slate-900">Results</h2>
          </div>

          {!result && !analyzing && (
            <div className="mt-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-50">
                <Camera className="h-8 w-8 text-slate-300" />
              </div>
              <p className="mt-4 text-sm text-slate-500">Upload a food photo to see results</p>
            </div>
          )}

          {analyzing && (
            <div className="mt-12 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-3 border-orange-500 border-t-transparent" />
              <p className="mt-4 text-sm text-slate-500">Analyzing your food...</p>
            </div>
          )}

          {result && (
            <div className="mt-4 space-y-4">
              <div className="rounded-lg bg-orange-50 p-4 flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-orange-500 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">{result.food || 'Unknown'}</h3>
                  {result.portion && <p className="text-xs text-slate-500 mt-0.5">{result.portion}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <MacroResult
                  icon={Flame}
                  value={result.calories || 0}
                  label="Calories"
                  unit=""
                  color="orange"
                />
                <MacroResult
                  icon={Wheat}
                  value={result.protein || 0}
                  label="Protein"
                  unit="g"
                  color="blue"
                />
                <MacroResult
                  icon={Wheat}
                  value={result.carbs || 0}
                  label="Carbs"
                  unit="g"
                  color="cyan"
                />
                <MacroResult
                  icon={Droplet}
                  value={result.fat || 0}
                  label="Fat"
                  unit="g"
                  color="amber"
                />
              </div>

              <Button onClick={handleLogToNutrition} disabled={logging} className="w-full flex items-center justify-center gap-2">
                {logging ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Logging...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Log to Nutrition
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function MacroResult({
  icon: Icon,
  value,
  label,
  unit,
  color,
}: {
  icon: React.ElementType
  value: number
  label: string
  unit: string
  color: string
}) {
  const colorMap: Record<string, string> = {
    orange: 'text-orange-600',
    blue: 'text-blue-600',
    cyan: 'text-cyan-600',
    amber: 'text-amber-600',
  }

  const bgMap: Record<string, string> = {
    orange: 'bg-orange-50',
    blue: 'bg-blue-50',
    cyan: 'bg-cyan-50',
    amber: 'bg-amber-50',
  }

  return (
    <div className={`rounded-lg border border-slate-100 p-4 text-center ${bgMap[color]}`}>
      <Icon className={`h-5 w-5 mx-auto mb-1 ${colorMap[color]}`} />
      <p className={`text-xl font-bold ${colorMap[color]}`}>
        {value}{unit}
      </p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  )
}
