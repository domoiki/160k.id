/**
 * Tiny class joiner. Avoids pulling in clsx for a 6-line helper.
 * Accepts any falsy value so it can be fed a conditional ReactNode directly.
 */
export function cn(
  ...parts: Array<string | number | bigint | boolean | null | undefined>
): string {
  return parts.filter((p): p is string => typeof p === "string" && p.length > 0).join(" ");
}
