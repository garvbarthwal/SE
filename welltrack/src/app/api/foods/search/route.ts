import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')

    if (!q || q.trim().length === 0) {
      return NextResponse.json({ foods: [] })
    }

    const foods = await prisma.food.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { brand: { contains: q, mode: 'insensitive' } },
        ],
      },
      orderBy: { name: 'asc' },
      take: 20,
    })

    return NextResponse.json({ foods })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
