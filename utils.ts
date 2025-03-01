export function cn(...classNames: (string | boolean | undefined)[]): string {
  return classNames.filter(Boolean).join(' ')
}

export function isDefined<T>(value: T): value is Exclude<T, undefined> {
  return value !== undefined
}

export function isEveryCharUppercase(value: string) {
  return value.split('').every(char => char.toUpperCase() === char)
}
