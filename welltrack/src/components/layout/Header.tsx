'use client'

import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

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

export function Header() {
  const { data: session } = useSession()
  const pathname = usePathname()

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold text-blue-600">
          WellTrack
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-medium transition-colors ${
                pathname === item.href
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {item.icon} {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{session?.user?.name || session?.user?.email}</span>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}
