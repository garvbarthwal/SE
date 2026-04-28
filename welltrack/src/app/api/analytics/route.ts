import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { addDays, formatDateKey, listDateKeys, parseTrackingRange, startOfDay } from '@/lib/tracking'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const today = startOfDay(new Date())
    const defaultStart = addDays(today, -6)
    const defaultEnd = addDays(today, 1)
    const parsedRange = parseTrackingRange(new URL(request.url).searchParams)

    if ('error' in parsedRange) {
      return NextResponse.json({ error: parsedRange.error }, { status: 400 })
    }

    const start = parsedRange.start ?? defaultStart
    const end = parsedRange.end ?? defaultEnd

    const [workouts, nutrition, hydration] = await Promise.all([
      prisma.workout.findMany({
        where: {
          userId: session.user.id,
          createdAt: { gte: start, lt: end },
        },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.nutritionLog.findMany({
        where: {
          userId: session.user.id,
          createdAt: { gte: start, lt: end },
        },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.hydrationLog.findMany({
        where: {
          userId: session.user.id,
          createdAt: { gte: start, lt: end },
        },
        orderBy: { createdAt: 'asc' },
      }),
    ])

    const dailyData: Record<string, { workouts: number; calories: number; water: number; meals: number; domainsCompleted: number; active: boolean }> = {}
    const dateKeys = listDateKeys(start, end)

    dateKeys.forEach((key) => {
      dailyData[key] = {
        workouts: 0,
        calories: 0,
        water: 0,
        meals: 0,
        domainsCompleted: 0,
        active: false,
      }
    })

    const markDailyState = (key: string) => {
      const day = dailyData[key]

      if (!day) {
        return
      }

      let completedDomains = 0

      if (day.workouts > 0) completedDomains += 1
      if (day.meals > 0) completedDomains += 1
      if (day.water > 0) completedDomains += 1

      day.domainsCompleted = completedDomains
      day.active = completedDomains > 0
    }

    workouts.forEach((w) => {
      const key = formatDateKey(w.createdAt)
      if (dailyData[key]) dailyData[key].workouts++
    })

    nutrition.forEach((n) => {
      const key = formatDateKey(n.createdAt)
      if (dailyData[key]) {
        dailyData[key].calories += n.calories
        dailyData[key].meals++
      }
    })

    hydration.forEach((h) => {
      const key = formatDateKey(h.createdAt)
      if (dailyData[key]) dailyData[key].water += h.amount
    })

    dateKeys.forEach(markDailyState)

    const totalCalories = nutrition.reduce((sum, n) => sum + n.calories, 0)
    const totalWater = hydration.reduce((sum, h) => sum + h.amount, 0)
    const rangeDays = dateKeys.length || 1
    const avgDailyCalories = Math.round(totalCalories / rangeDays)
    const avgDailyWater = Math.round(totalWater / rangeDays)
    const orderedDays = dateKeys.map((key) => dailyData[key])
    const activeDays = orderedDays.filter((day) => day.active).length

    let currentStreak = 0
    for (let index = orderedDays.length - 1; index >= 0; index -= 1) {
      if (!orderedDays[index].active) {
        break
      }
      currentStreak += 1
    }

    let longestStreak = 0
    let runningStreak = 0
    orderedDays.forEach((day) => {
      if (day.active) {
        runningStreak += 1
        longestStreak = Math.max(longestStreak, runningStreak)
      } else {
        runningStreak = 0
      }
    })

    return NextResponse.json({
      dailyData: Object.entries(dailyData).map(([date, data]) => ({ date, ...data })),
      summary: {
        totalWorkouts: workouts.length,
        totalCalories,
        totalWater,
        avgDailyCalories,
        avgDailyWater,
        mealsLogged: nutrition.length,
        activeDays,
        currentStreak,
        longestStreak,
        completionRate: Math.round((activeDays / rangeDays) * 100),
        rangeDays,
        from: formatDateKey(start),
        to: formatDateKey(addDays(end, -1)),
      },
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
