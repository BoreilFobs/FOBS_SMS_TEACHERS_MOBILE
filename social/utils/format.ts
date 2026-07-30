export function formatRelativeTime(date: string, language: "en" | "fr") {
  const seconds = Math.max(1, Math.round((Date.now() - new Date(date).getTime()) / 1000));
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
    year: new Date(date).getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  }).format(new Date(date));
}

export function formatDate(date: string, language: "en" | "fr") {
  return new Intl.DateTimeFormat(language, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}
