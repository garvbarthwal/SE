import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { openai } from '@/lib/openai'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { imageUrl } = await request.json()

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 })
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a nutrition expert. Analyze the food image and return ONLY valid JSON with these fields: food (name), calories (number), protein (grams), carbs (grams), fat (grams), portion (string description). Do not include any other text.',
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Analyze this food image and estimate the nutritional values.' },
            { type: 'image_url', image_url: { url: imageUrl } },
          ],
        },
      ],
      max_tokens: 300,
      temperature: 0.3,
    })

    const content = response.choices[0]?.message?.content || '{}'
    let parsedData

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      parsedData = jsonMatch ? JSON.parse(jsonMatch[0]) : {}
    } catch {
      parsedData = { food: 'Unknown', calories: 0, protein: 0, carbs: 0, fat: 0, portion: '' }
    }

    const foodImage = await prisma.foodImage.create({
      data: {
        userId: session.user.id,
        imageUrl,
        parsedData,
      },
    })

    return NextResponse.json({
      foodImage,
      parsedData,
    })
  } catch (error: unknown) {
    console.error('AI food analysis error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Food analysis failed', details: message },
      { status: 500 }
    )
  }
}
