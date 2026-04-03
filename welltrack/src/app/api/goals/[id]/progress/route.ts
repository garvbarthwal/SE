import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { goalProgressSchema } from '@/lib/validations'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const goal = await prisma.goal.findUnique({
      where: { id },
    })

    if (!goal || goal.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const body = await request.json()
    const validation = goalProgressSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.issues },
        { status: 400 }
      )
    }

    const progress = await prisma.goalProgress.create({
      data: {
        goalId: id,
        ...validation.data,
      },
    })

    // Update goal's current value
    await prisma.goal.update({
      where: { id },
      data: { currentValue: validation.data.value },
    })

    return NextResponse.json({ progress }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
