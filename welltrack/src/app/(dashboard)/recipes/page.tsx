'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'

interface Recipe {
  id: string
  name: string
  description: string | null
  servings: number
  isPublic: boolean
  ingredients: { id: string; food: { name: string } }[]
  createdAt: string
}

export default function RecipesPage() {
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
      const res = await fetch('/api/recipes')
      const data = await res.json()
      setRecipes(data.recipes || [])
    } catch {
      console.error('Failed to fetch recipes')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/recipes/${id}`, { method: 'DELETE' })
      setRecipes(recipes.filter((r) => r.id !== id))
    } catch {
      console.error('Failed to delete recipe')
    }
  }

  const filtered = recipes.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-sm text-slate-500">Loading...</div>
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">My Recipes</h1>
          <p className="mt-1 text-sm text-slate-500">Create and manage your custom recipes</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/recipes/public"
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Community
          </Link>
          <Link
            href="/recipes/new"
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
          >
            + New Recipe
          </Link>
        </div>
      </div>

      <div className="max-w-md">
        <input
          type="text"
          placeholder="Search recipes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-sm text-slate-500">
            {search ? 'No recipes match your search' : 'No recipes yet. Create your first one!'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((recipe) => (
            <div
              key={recipe.id}
              className="rounded-xl border border-slate-200 bg-white p-5 space-y-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-slate-900">{recipe.name}</h3>
                {recipe.isPublic && (
                  <span className="rounded-md bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                    Public
                  </span>
                )}
              </div>

              {recipe.description && (
                <p className="text-sm text-slate-500 line-clamp-2">{recipe.description}</p>
              )}

              <div className="flex items-center gap-4 text-sm text-slate-400">
                <span>{recipe.servings} serving{recipe.servings > 1 ? 's' : ''}</span>
                <span>{recipe.ingredients.length} ingredient{recipe.ingredients.length !== 1 ? 's' : ''}</span>
              </div>

              <div className="flex gap-2">
                <Link
                  href={`/recipes/${recipe.id}`}
                  className="flex-1 text-center rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  View
                </Link>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(recipe.id)}>
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
