import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parseTrackingRange } from '@/lib/tracking'
import { nutritionEntrySchema, nutritionPatchFieldsSchema } from '@/lib/validations'

const nutritionBatchUpdateSchema = z.array(
  nutritionPatchFieldsSchema
    .extend({
      id: z.string().min(1, 'Nutrition log id is required'),
    })
    .refine(
      (value) =>
        value.food !== undefined ||
        value.calories !== undefined ||
        value.protein !== undefined ||
        value.carbs !== undefined ||
        value.fat !== undefined ||
        value.portion !== undefined ||
        value.createdAt !== undefined,
      'At least one nutrition field is required'
    )
).min(1, 'At least one nutrition update is required')

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

    const nutrition = await prisma.nutritionLog.findMany({
      where: {
        userId: session.user.id,
        ...(range.start && range.end
          ? {
              createdAt: {
                gte: range.start,
                lt: range.end,
              },
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: range.start ? 250 : 50,
    })

    return NextResponse.json({
      nutrition,
      filters: {
        from: range.from,
        to: range.to,
        label: range.label,
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
      ? z.array(nutritionEntrySchema).min(1, 'At least one meal is required').safeParse(body)
      : nutritionEntrySchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.issues },
        { status: 400 }
      )
    }

    if (Array.isArray(validation.data)) {
      const nutrition = await prisma.$transaction(
        validation.data.map((entry) =>
          prisma.nutritionLog.create({
            data: {
              ...entry,
              userId: session.user.id,
            },
          })
        )
      )

      return NextResponse.json({ nutrition, count: nutrition.length }, { status: 201 })
    }

    const log = await prisma.nutritionLog.create({
      data: {
        ...validation.data,
        userId: session.user.id,
      },
    })

    return NextResponse.json({ nutrition: log }, { status: 201 })
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
    const validation = nutritionBatchUpdateSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.issues },
        { status: 400 }
      )
    }

    const ids = validation.data.map(({ id }) => id)
    const existingLogs = await prisma.nutritionLog.findMany({
      where: {
        id: { in: ids },
        userId: session.user.id,
      },
      select: { id: true },
    })

    if (existingLogs.length !== ids.length) {
      return NextResponse.json({ error: 'One or more meals were not found.' }, { status: 404 })
    }

    const nutrition = await prisma.$transaction(
      validation.data.map(({ id, ...data }) =>
        prisma.nutritionLog.update({
          where: { id },
          data,
        })
      )
    )

    return NextResponse.json({ nutrition, count: nutrition.length })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
