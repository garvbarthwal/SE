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

    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 7)

    const [workouts, nutrition, hydration] = await Promise.all([
      prisma.workout.findMany({
        where: { userId: session.user.id, createdAt: { gte: weekAgo } },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.nutritionLog.findMany({
        where: { userId: session.user.id, createdAt: { gte: weekAgo } },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.hydrationLog.findMany({
        where: { userId: session.user.id, createdAt: { gte: weekAgo } },
        orderBy: { createdAt: 'asc' },
      }),
    ])

    const dailyData: Record<string, { workouts: number; calories: number; water: number }> = {}
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const key = date.toISOString().split('T')[0]
      dailyData[key] = { workouts: 0, calories: 0, water: 0 }
    }

    workouts.forEach((w) => {
      const key = w.createdAt.toISOString().split('T')[0]
      if (dailyData[key]) dailyData[key].workouts++
    })

    nutrition.forEach((n) => {
      const key = n.createdAt.toISOString().split('T')[0]
      if (dailyData[key]) dailyData[key].calories += n.calories
    })

    hydration.forEach((h) => {
      const key = h.createdAt.toISOString().split('T')[0]
      if (dailyData[key]) dailyData[key].water += h.amount
    })

    const totalCalories = nutrition.reduce((sum, n) => sum + n.calories, 0)
    const totalWater = hydration.reduce((sum, h) => sum + h.amount, 0)
    const avgDailyCalories = Math.round(totalCalories / 7)
    const avgDailyWater = Math.round(totalWater / 7)

    return NextResponse.json({
      dailyData: Object.entries(dailyData).map(([date, data]) => ({ date, ...data })),
      summary: {
        totalWorkouts: workouts.length,
        totalCalories,
        totalWater,
        avgDailyCalories,
        avgDailyWater,
        mealsLogged: nutrition.length,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
