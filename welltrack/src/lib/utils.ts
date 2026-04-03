type ClassValue = string | undefined | false | null | Record<string, boolean>

export function cn(...classes: ClassValue[]) {
  return classes
    .flatMap((cls) => {
      if (typeof cls === 'string') return cls
      if (!cls) return null
      if (typeof cls === 'object') {
        return Object.entries(cls)
          .filter(([, value]) => value)
          .map(([key]) => key)
      }
      return null
    })
    .filter(Boolean)
    .join(' ')
}
