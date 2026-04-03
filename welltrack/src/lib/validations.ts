import { z } from 'zod'

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const workoutSchema = z.object({
  type: z.string().min(1, 'Workout type is required'),
  name: z.string().min(1, 'Workout name is required'),
  duration: z.number().min(1, 'Duration must be at least 1 minute'),
  calories: z.number().optional(),
  notes: z.string().optional(),
})

export const nutritionSchema = z.object({
  food: z.string().min(1, 'Food name is required'),
  calories: z.number().min(0, 'Calories must be a positive number'),
  protein: z.number().optional(),
  carbs: z.number().optional(),
  fat: z.number().optional(),
  portion: z.string().optional(),
})

export const hydrationSchema = z.object({
  amount: z.number().min(1, 'Amount must be at least 1ml'),
})

export const goalSchema = z.object({
  type: z.enum(['weight', 'workout', 'nutrition', 'hydration']),
  title: z.string().min(1, 'Title is required'),
  targetValue: z.number().min(0, 'Target must be positive'),
  deadline: z.string().optional(),
})

export const goalProgressSchema = z.object({
  value: z.number(),
  notes: z.string().optional(),
})

export const userPreferenceSchema = z.object({
  calorieGoal: z.number().min(500).max(10000),
  proteinGoal: z.number().min(0).max(500),
  carbsGoal: z.number().min(0).max(1000),
  fatGoal: z.number().min(0).max(500),
  waterGoal: z.number().min(500).max(10000),
  dietType: z.string().optional(),
  restrictions: z.array(z.string()).optional(),
})

export const foodSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  brand: z.string().optional(),
  source: z.enum(['system', 'user', 'usda']).default('user'),
  calories: z.number().min(0, 'Calories must be positive'),
  protein: z.number().optional(),
  carbs: z.number().optional(),
  fat: z.number().optional(),
  fiber: z.number().optional(),
  servingSize: z.number().optional(),
  defaultUnit: z.string().default('g'),
})

export const recipeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().optional(),
  servings: z.number().min(1, 'At least 1 serving').default(1),
  isPublic: z.boolean().default(false),
})

export const recipeIngredientSchema = z.object({
  foodId: z.string().min(1, 'Food is required'),
  quantity: z.number().min(0.01, 'Quantity must be positive'),
  unit: z.enum(['g', 'kg', 'oz', 'lb', 'cup', 'tbsp', 'tsp', 'ml']),
  notes: z.string().optional(),
})
