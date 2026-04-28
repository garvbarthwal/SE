import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parseTrackingRange } from '@/lib/tracking'
import { hydrationEntrySchema, hydrationPatchFieldsSchema } from '@/lib/validations'

const hydrationBatchUpdateSchema = z.array(
  hydrationPatchFieldsSchema
    .extend({
      id: z.string().min(1, 'Hydration log id is required'),
    })
    .refine(
      (value) => value.amount !== undefined || value.createdAt !== undefined,
      'At least one hydration field is required'
    )
).min(1, 'At least one hydration update is required')

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const range = parseTrackingRange(new URL(request.url).searchParams)
    if ('error' in range) {
      return NextResponse.json({ error: range.error }, { status: 400 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const start = range.start ?? today
    const end = range.end ?? new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

    const hydration = await prisma.hydrationLog.findMany({
      where: {
        userId: session.user.id,
        createdAt: {
          gte: start,
          lt: end,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: range.start ? 500 : undefined,
    })

    const totalAmount = hydration.reduce((sum, log) => sum + log.amount, 0)

    return NextResponse.json({
      hydration,
      totalAmount,
      filters: {
        from: range.from ?? null,
        to: range.to ?? null,
        label: range.label ?? 'Today',
      },
    })
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
    const validation = Array.isArray(body)
      ? z.array(hydrationEntrySchema).min(1, 'At least one hydration log is required').safeParse(body)
      : hydrationEntrySchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.issues },
        { status: 400 }
      )
    }

    if (Array.isArray(validation.data)) {
      const hydration = await prisma.$transaction(
        validation.data.map((entry) =>
          prisma.hydrationLog.create({
            data: {
              ...entry,
              userId: session.user.id,
            },
          })
        )
      )

      return NextResponse.json({ hydration, count: hydration.length }, { status: 201 })
    }

    const log = await prisma.hydrationLog.create({
      data: {
        ...validation.data,
        userId: session.user.id,
      },
    })

    return NextResponse.json({ hydration: log }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = hydrationBatchUpdateSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.issues },
        { status: 400 }
      )
    }

    const ids = validation.data.map(({ id }) => id)
    const existingLogs = await prisma.hydrationLog.findMany({
      where: {
        id: { in: ids },
        userId: session.user.id,
      },
      select: { id: true },
    })

    if (existingLogs.length !== ids.length) {
      return NextResponse.json({ error: 'One or more hydration logs were not found.' }, { status: 404 })
    }

    const hydration = await prisma.$transaction(
      validation.data.map(({ id, ...data }) =>
        prisma.hydrationLog.update({
          where: { id },
          data,
        })
      )
    )

    const totalAmount = hydration.reduce((sum, log) => sum + log.amount, 0)

    return NextResponse.json({ hydration, count: hydration.length, totalAmount })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
