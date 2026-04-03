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

    const where: Record<string, unknown> = {
      isPublic: true,
    }

    if (q && q.trim().length > 0) {
      where.name = { contains: q, mode: 'insensitive' }
    }

    const recipes = await prisma.recipe.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        ingredients: {
          include: { food: true },
        },
        user: {
          select: { name: true, email: true },
        },
      },
      take: 50,
    })

    return NextResponse.json({ recipes })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
