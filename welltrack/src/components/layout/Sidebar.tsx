'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  Dumbbell,
  UtensilsCrossed,
  Droplets,
  Target,
  ChefHat,
  Camera,
  Sparkles,
  BarChart3,
  LogOut,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/workouts', label: 'Workouts', icon: Dumbbell },
  { href: '/nutrition', label: 'Nutrition', icon: UtensilsCrossed },
  { href: '/hydration', label: 'Hydration', icon: Droplets },
  { href: '/goals', label: 'Goals', icon: Target },
  { href: '/recipes', label: 'Recipes', icon: ChefHat },
  { href: '/analyze-food', label: 'AI Food Scan', icon: Camera },
  { href: '/recommendations', label: 'AI Insights', icon: Sparkles },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden w-64 border-r border-slate-200 bg-white md:block">
      <div className="px-5 py-5">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500">
            <svg
              className="h-5 w-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">
            WellTrack
          </span>
        </Link>
      </div>
      <nav className="space-y-1 px-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-orange-50 text-orange-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'text-orange-500' : 'text-slate-400'}`} />
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="absolute bottom-4 left-0 w-64 px-3">
        <button
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
        >
          <LogOut className="h-5 w-5 text-slate-400" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
