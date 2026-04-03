import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { openai } from '@/lib/openai'
import { prisma } from '@/lib/prisma'

const CACHE_KEY = 'recommendations'
const CACHE_HOURS = 6

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const cached = await prisma.aICache.findUnique({
      where: {
        userId_key: {
          userId: session.user.id,
          key: CACHE_KEY,
        },
      },
    })

    if (cached && cached.expiresAt > new Date()) {
      return NextResponse.json(cached.data)
    }

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const [workouts, nutrition, hydration, goals, preferences] = await Promise.all([
      prisma.workout.count({
        where: { userId: session.user.id, createdAt: { gte: sevenDaysAgo } },
      }),
      prisma.nutritionLog.findMany({
        where: { userId: session.user.id, createdAt: { gte: sevenDaysAgo } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      prisma.hydrationLog.findMany({
        where: { userId: session.user.id, createdAt: { gte: sevenDaysAgo } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      prisma.goal.findMany({
        where: { userId: session.user.id, status: 'active' },
      }),
      prisma.userPreference.findUnique({
        where: { userId: session.user.id },
      }),
    ])

    const totalCalories = nutrition.reduce((sum, n) => sum + n.calories, 0)
    const totalWater = hydration.reduce((sum, h) => sum + h.amount, 0)

    const context = {
      workoutsThisWeek: workouts,
      avgDailyCalories: Math.round(totalCalories / 7),
      avgDailyWater: Math.round(totalWater / 7),
      mealsLogged: nutrition.length,
      activeGoals: goals.length,
      goals: goals.map((g) => ({
        title: g.title,
        type: g.type,
        progress: `${Math.round((g.currentValue / g.targetValue) * 100)}%`,
      })),
      preferences: preferences
        ? {
            calorieGoal: preferences.calorieGoal,
            waterGoal: preferences.waterGoal,
            dietType: preferences.dietType,
          }
        : null,
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a personal fitness coach. Based on the user's weekly data, provide 3 personalized recommendations and 2 insights. Return ONLY valid JSON with this structure:
{
  "recommendations": [
    {"title": "short title", "description": "1-2 sentence advice", "type": "nutrition|workout|hydration|general"}
  ],
  "insights": [
    {"title": "short title", "description": "1-2 sentence observation", "type": "positive|warning|neutral"}
  ]
}`,
        },
        {
          role: 'user',
          content: `Here is my weekly fitness data: ${JSON.stringify(context)}`,
        },
      ],
      max_tokens: 500,
      temperature: 0.7,
    })

    const content = response.choices[0]?.message?.content || '{}'
    let parsedData

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      parsedData = jsonMatch ? JSON.parse(jsonMatch[0]) : { recommendations: [], insights: [] }
    } catch {
      parsedData = { recommendations: [], insights: [] }
    }

    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + CACHE_HOURS)

    await prisma.aICache.upsert({
      where: {
        userId_key: {
          userId: session.user.id,
          key: CACHE_KEY,
        },
      },
      update: {
        data: parsedData,
        expiresAt,
      },
      create: {
        userId: session.user.id,
        key: CACHE_KEY,
        data: parsedData,
        expiresAt,
      },
    })

    return NextResponse.json(parsedData)
  } catch (error: unknown) {
    console.error('AI recommendations error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to generate recommendations', details: message },
      { status: 500 }
    )
  }
}
