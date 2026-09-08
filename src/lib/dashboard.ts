/** Fixed to UTC so the server and client render the same string. */
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

export function formatItemDate(date: Date): string {
  return dateFormatter.format(date);
}

/** Long form ("January 15, 2024"), UTC-pinned, used in the item drawer's Details section. */
const longDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export function formatLongDate(date: Date): string {
  return longDateFormatter.format(date);
}
