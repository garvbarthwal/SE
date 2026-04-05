'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Users, Search, ChefHat, BookOpen, ArrowLeft, ChevronRight } from 'lucide-react'

interface Recipe {
  id: string
  name: string
  description: string | null
  servings: number
  isPublic: boolean
  ingredients: { id: string; food: { name: string } }[]
  user: { name: string | null; email: string }
  createdAt: string
}

export default function PublicRecipesPage() {
  const { status } = useSession()
  const router = useRouter()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    if (status === 'authenticated') {
      fetchRecipes()
    }
  }, [status, router])

  const fetchRecipes = async () => {
    try {
      const url = search
        ? `/api/recipes/public?q=${encodeURIComponent(search)}`
        : '/api/recipes/public'
      const res = await fetch(url)
      const data = await res.json()
      setRecipes(data.recipes || [])
    } catch {
      console.error('Failed to fetch public recipes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (status === 'authenticated') fetchRecipes()
    }, 500)
    return () => clearTimeout(timer)
  }, [search])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-orange-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Community Recipes</h1>
          <p className="mt-1 text-slate-500">Discover recipes shared by the WellTrack community</p>
        </div>
        <Link
          href="/recipes"
          className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          My Recipes
        </Link>
      </div>

      <div className="max-w-md relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search community recipes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-slate-200 pl-10 pr-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
        />
      </div>

      {recipes.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <ChefHat className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-4 text-sm text-slate-500">
            {search ? 'No recipes match your search' : 'No community recipes yet. Be the first to share!'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe) => (
            <div
              key={recipe.id}
              className="rounded-xl border border-slate-200 bg-white p-5 space-y-3 hover:border-orange-200 transition-colors"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-slate-900">{recipe.name}</h3>
                {recipe.isPublic && (
                  <span className="rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-medium text-orange-700">
                    Public
                  </span>
                )}
              </div>

              {recipe.description && (
                <p className="text-sm text-slate-500 line-clamp-2">{recipe.description}</p>
              )}

              <div className="flex items-center gap-4 text-sm text-slate-400">
                <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {recipe.servings} serving{recipe.servings > 1 ? 's' : ''}</span>
                <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> {recipe.ingredients.length} ingredient{recipe.ingredients.length !== 1 ? 's' : ''}</span>
              </div>

              <p className="text-xs text-slate-400">
                by {recipe.user.name || recipe.user.email}
              </p>

              <Link
                href={`/recipes/${recipe.id}`}
                className="flex items-center justify-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                View Recipe <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
