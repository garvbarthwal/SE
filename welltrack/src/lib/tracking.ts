export function formatDateKey(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function startOfDay(date: Date) {
  const nextDate = new Date(date)
  nextDate.setHours(0, 0, 0, 0)
  return nextDate
}

export function addDays(date: Date, amount: number) {
  const nextDate = new Date(date)
  nextDate.setDate(nextDate.getDate() + amount)
  return nextDate
}

function parseDateOnly(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null
  }

  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null
  }

  return date
}

export function parseTrackingRange(searchParams: URLSearchParams) {
  const dateParam = searchParams.get('date')
  const fromParam = searchParams.get('from')
  const toParam = searchParams.get('to')

  if (dateParam && (fromParam || toParam)) {
    return { error: 'Use either date or from/to filters, not both.' }
  }

  if (dateParam) {
    const day = parseDateOnly(dateParam)

    if (!day) {
      return { error: 'Invalid date. Use YYYY-MM-DD.' }
    }

    const start = startOfDay(day)
    const end = addDays(start, 1)

    return {
      start,
      end,
      label: formatDateKey(start),
      from: formatDateKey(start),
      to: formatDateKey(start),
    }
  }

  if (!fromParam && !toParam) {
    return { start: null, end: null, label: null, from: null, to: null }
  }

  if (!fromParam || !toParam) {
    return { error: 'Both from and to are required for range filters.' }
  }

  const from = parseDateOnly(fromParam)
  const to = parseDateOnly(toParam)

  if (!from || !to) {
    return { error: 'Invalid range. Use YYYY-MM-DD.' }
  }

  const start = startOfDay(from)
  const end = addDays(startOfDay(to), 1)

  if (start >= end) {
    return { error: 'The from date must be on or before the to date.' }
  }

  return {
    start,
    end,
    label: `${formatDateKey(start)} to ${formatDateKey(addDays(end, -1))}`,
    from: formatDateKey(start),
    to: formatDateKey(addDays(end, -1)),
  }
}

export function listDateKeys(start: Date, endExclusive: Date) {
  const keys: string[] = []
  const cursor = startOfDay(start)

  while (cursor < endExclusive) {
    keys.push(formatDateKey(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }

  return keys
}

export function getTodayDateKey() {
  return formatDateKey(new Date())
}

export function getRelativeDateKey(daysFromToday: number) {
  return formatDateKey(addDays(startOfDay(new Date()), daysFromToday))
}

export function toDateTimeLocalValue(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value)

  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  const hours = `${date.getHours()}`.padStart(2, '0')
  const minutes = `${date.getMinutes()}`.padStart(2, '0')

  return `${year}-${month}-${day}T${hours}:${minutes}`
}

export function formatDisplayDate(value: Date | string, options?: Intl.DateTimeFormatOptions) {
  const date = value instanceof Date ? value : new Date(value)

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...options,
  }).format(date)
}
