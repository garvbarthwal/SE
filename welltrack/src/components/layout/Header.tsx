'use client'

import { signOut, useSession } from 'next-auth/react'

export function Header() {
  const { data: session } = useSession()

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="flex h-14 items-center justify-between px-6">
        <div />
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-500">
            {session?.user?.name || session?.user?.email}
          </span>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="text-sm text-slate-500 hover:text-slate-800 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  )
}
