/** Tiny classnames joiner — filters falsy values and joins with spaces. */
export function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}
