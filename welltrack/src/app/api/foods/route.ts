import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { foodSchema } from '@/lib/validations'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const source = searchParams.get('source')

    const where: Record<string, unknown> = {}
    if (source === 'user') {
      where.createdBy = session.user.id
    } else if (source === 'system') {
      where.source = 'system'
    }

    const foods = await prisma.food.findMany({
      where,
      orderBy: { name: 'asc' },
      take: 100,
    })

    return NextResponse.json({ foods })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = foodSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.issues },
        { status: 400 }
      )
    }

    const food = await prisma.food.create({
      data: {
        ...validation.data,
        createdBy: session.user.id,
      },
    })

    return NextResponse.json({ food }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
