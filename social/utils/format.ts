/**
 * Parses an API date, returning null rather than an Invalid Date.
 *
 * `Intl.*.format()` throws a RangeError on an invalid date, which crashes the
 * whole screen mid-render. Records with a null or malformed date are normal, so
 * every formatter here degrades to a placeholder instead.
 */
export function parseDate(value?: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatRelativeTime(
  date: string | null | undefined,
  language: "en" | "fr",
) {
  const parsed = parseDate(date);
  if (!parsed) return "—";

  const seconds = Math.max(1, Math.round((Date.now() - parsed.getTime()) / 1000));
  const formatter = new Intl.RelativeTimeFormat(language, { numeric: "auto" });
  if (seconds < 60) return formatter.format(-seconds, "second");
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return formatter.format(-minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (hours < 24) return formatter.format(-hours, "hour");
  const days = Math.round(hours / 24);
  if (days < 30) return formatter.format(-days, "day");
  return new Intl.DateTimeFormat(language, {
    day: "numeric",
    month: "short",
    year:
      parsed.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  }).format(parsed);
}

export function formatDate(
  date: string | null | undefined,
  language: "en" | "fr",
  options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
  },
) {
  const parsed = parseDate(date);
  if (!parsed) return "—";
  return new Intl.DateTimeFormat(language, options).format(parsed);
}
