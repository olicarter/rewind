export function cn(...classNames: (string | boolean | undefined)[]): string {
  return classNames.filter(Boolean).join(' ')
}

export function isEveryCharUppercase(value: string) {
  return value.split('').every(char => char.toUpperCase() === char)
}
