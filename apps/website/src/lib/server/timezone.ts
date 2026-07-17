import { fromDate, startOfMonth, startOfWeek, toCalendarDate } from "@internationalized/date";

export function storeDate(date: Date, timezone: string) {
  return toCalendarDate(fromDate(date, timezone));
}

export function storePeriodStarts(date: Date, timezone: string) {
  const today = storeDate(date, timezone);
  const week = startOfWeek(today, "en", "mon");

  return {
    today: today.toDate(timezone),
    week: week.toDate(timezone),
    lastWeek: week.subtract({ weeks: 1 }).toDate(timezone),
    month: startOfMonth(today).toDate(timezone),
  };
}
