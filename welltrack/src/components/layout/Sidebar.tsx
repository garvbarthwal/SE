'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/workouts', label: 'Workouts', icon: '💪' },
  { href: '/nutrition', label: 'Nutrition', icon: '🍎' },
  { href: '/hydration', label: 'Hydration', icon: '💧' },
  { href: '/goals', label: 'Goals', icon: '🎯' },
  { href: '/recipes', label: 'Recipes', icon: '🍳' },
  { href: '/analyze-food', label: 'AI Food', icon: '📷' },
  { href: '/recommendations', label: 'AI Insights', icon: '🤖' },
  { href: '/analytics', label: 'Analytics', icon: '📈' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden w-64 border-r border-gray-200 bg-white md:block">
      <div className="p-6">
        <Link href="/" className="text-xl font-bold text-blue-600">
          WellTrack
        </Link>
      </div>
      <nav className="space-y-1 px-3">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              pathname === item.href
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
