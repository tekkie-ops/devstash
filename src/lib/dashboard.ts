/** Fixed to UTC so the server and client render the same string. */
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

export function formatItemDate(date: Date): string {
  return dateFormatter.format(date);
}
