'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/workouts', label: 'Workouts' },
  { href: '/nutrition', label: 'Nutrition' },
  { href: '/hydration', label: 'Hydration' },
  { href: '/goals', label: 'Goals' },
  { href: '/recipes', label: 'Recipes' },
  { href: '/analyze-food', label: 'AI Food' },
  { href: '/recommendations', label: 'AI Insights' },
  { href: '/analytics', label: 'Analytics' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden w-60 border-r border-slate-200 bg-white md:block">
      <div className="px-6 py-5">
        <Link href="/dashboard" className="text-lg font-semibold text-slate-900">
          WellTrack
        </Link>
      </div>
      <nav className="space-y-0.5 px-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-green-50 text-green-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
