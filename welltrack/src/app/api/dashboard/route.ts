import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [workouts, nutrition, hydration] = await Promise.all([
      prisma.workout.count({
        where: {
          userId: session.user.id,
          createdAt: { gte: today },
        },
      }),
      prisma.nutritionLog.findMany({
        where: {
          userId: session.user.id,
          createdAt: { gte: today },
        },
      }),
      prisma.hydrationLog.findMany({
        where: {
          userId: session.user.id,
          createdAt: { gte: today },
        },
      }),
    ])

    const totalCalories = nutrition.reduce((sum, log) => sum + log.calories, 0)
    const totalWater = hydration.reduce((sum, log) => sum + log.amount, 0)

    return NextResponse.json({
      workouts,
      totalCalories,
      totalWater,
      nutritionCount: nutrition.length,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
