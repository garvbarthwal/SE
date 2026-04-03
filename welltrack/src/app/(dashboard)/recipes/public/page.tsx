'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

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
    return <div className="flex h-64 items-center justify-center text-sm text-slate-500">Loading...</div>
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Community Recipes</h1>
          <p className="mt-1 text-sm text-slate-500">Discover recipes shared by the WellTrack community</p>
        </div>
        <Link
          href="/recipes"
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          ← My Recipes
        </Link>
      </div>

      <div className="max-w-md">
        <input
          type="text"
          placeholder="Search community recipes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
      </div>

      {recipes.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-sm text-slate-500">
            {search ? 'No recipes match your search' : 'No community recipes yet. Be the first to share!'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe) => (
            <div
              key={recipe.id}
              className="rounded-xl border border-slate-200 bg-white p-5 space-y-3"
            >
              <h3 className="text-sm font-medium text-slate-900">{recipe.name}</h3>

              {recipe.description && (
                <p className="text-sm text-slate-500 line-clamp-2">{recipe.description}</p>
              )}

              <div className="flex items-center gap-4 text-sm text-slate-400">
                <span>{recipe.servings} serving{recipe.servings > 1 ? 's' : ''}</span>
                <span>{recipe.ingredients.length} ingredient{recipe.ingredients.length !== 1 ? 's' : ''}</span>
              </div>

              <p className="text-xs text-slate-400">
                by {recipe.user.name || recipe.user.email}
              </p>

              <Link
                href={`/recipes/${recipe.id}`}
                className="block text-center rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                View Recipe
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
