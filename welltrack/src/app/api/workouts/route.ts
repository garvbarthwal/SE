import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parseTrackingRange } from '@/lib/tracking'
import { workoutEntrySchema, workoutPatchFieldsSchema } from '@/lib/validations'

const workoutBatchUpdateSchema = z.array(
  workoutPatchFieldsSchema
    .extend({
      id: z.string().min(1, 'Workout id is required'),
    })
    .refine(
      (value) =>
        value.type !== undefined ||
        value.name !== undefined ||
        value.duration !== undefined ||
        value.calories !== undefined ||
        value.notes !== undefined ||
        value.createdAt !== undefined,
      'At least one workout field is required'
    )
).min(1, 'At least one workout update is required')

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

    const workouts = await prisma.workout.findMany({
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
      workouts,
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
      ? z.array(workoutEntrySchema).min(1, 'At least one workout is required').safeParse(body)
      : workoutEntrySchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.issues },
        { status: 400 }
      )
    }

    if (Array.isArray(validation.data)) {
      const workouts = await prisma.$transaction(
        validation.data.map((workout) =>
          prisma.workout.create({
            data: {
              ...workout,
              userId: session.user.id,
            },
          })
        )
      )

      return NextResponse.json({ workouts, count: workouts.length }, { status: 201 })
    }

    const workout = await prisma.workout.create({
      data: {
        ...validation.data,
        userId: session.user.id,
      },
    })

    return NextResponse.json({ workout }, { status: 201 })
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
    const validation = workoutBatchUpdateSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.issues },
        { status: 400 }
      )
    }

    const ids = validation.data.map(({ id }) => id)
    const existingWorkouts = await prisma.workout.findMany({
      where: {
        id: { in: ids },
        userId: session.user.id,
      },
      select: { id: true },
    })

    if (existingWorkouts.length !== ids.length) {
      return NextResponse.json({ error: 'One or more workouts were not found.' }, { status: 404 })
    }

    const workouts = await prisma.$transaction(
      validation.data.map(({ id, ...data }) =>
        prisma.workout.update({
          where: { id },
          data,
        })
      )
    )

    return NextResponse.json({ workouts, count: workouts.length })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
