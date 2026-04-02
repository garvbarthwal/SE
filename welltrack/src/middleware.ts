import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const session = await auth()
  const pathname = request.nextUrl.pathname

  const isProtectedRoute = pathname.startsWith('/dashboard') ||
    pathname.startsWith('/workouts') ||
    pathname.startsWith('/nutrition') ||
    pathname.startsWith('/hydration')

  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (session && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/workouts/:path*', '/nutrition/:path*', '/hydration/:path*', '/login', '/register'],
}
