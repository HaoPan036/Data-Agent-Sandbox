import { syntheticEcommerce } from "../data/syntheticEcommerce";

export interface DateRange {
  start: string;
  end: string;
}

const dayMs = 24 * 60 * 60 * 1000;

function toDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(value: string, days: number) {
  const date = toDate(value);
  date.setUTCDate(date.getUTCDate() + days);
  return isoDate(date);
}

function daysBetween(start: string, end: string) {
  return Math.round((toDate(end).getTime() - toDate(start).getTime()) / dayMs) + 1;
}

function maxDate(values: string[]) {
  return values.reduce((latest, value) => (value > latest ? value : latest), values[0]);
}

export function getReferenceDate() {
  return maxDate([
    ...syntheticEcommerce.orders.map((row) => row.order_date),
    ...syntheticEcommerce.traffic.map((row) => row.date),
    ...syntheticEcommerce.experiment_events.map((row) => row.event_date)
  ]);
}

export function getLastNDaysRange(days: number, endDate = getReferenceDate()): DateRange {
  return {
    start: addDays(endDate, -(days - 1)),
    end: endDate
  };
}

export function getPreviousPeriodRange(range: DateRange): DateRange {
  const length = daysBetween(range.start, range.end);

  return {
    start: addDays(range.start, -length),
    end: addDays(range.start, -1)
  };
}

export function getLastMonthRange(referenceDate = getReferenceDate()): DateRange {
  const reference = toDate(referenceDate);
  const firstOfCurrentMonth = new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth(), 1));
  const lastOfPreviousMonth = new Date(firstOfCurrentMonth.getTime() - dayMs);
  const firstOfPreviousMonth = new Date(
    Date.UTC(lastOfPreviousMonth.getUTCFullYear(), lastOfPreviousMonth.getUTCMonth(), 1)
  );

  return {
    start: isoDate(firstOfPreviousMonth),
    end: isoDate(lastOfPreviousMonth)
  };
}

export function getLatestWeekRange(referenceDate = getReferenceDate()): DateRange {
  const reference = toDate(referenceDate);
  const dayOfMonth = reference.getUTCDate();

  if (dayOfMonth < 7) {
    const start = isoDate(new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth(), 1)));

    return {
      start,
      end: addDays(start, 6)
    };
  }

  return getLastNDaysRange(7, referenceDate);
}

export function getLastCompleteWeekRange(referenceDate = getReferenceDate()): DateRange {
  const latestWeek = getLatestWeekRange(referenceDate);

  if (isLatestWeekIncomplete(referenceDate)) {
    return {
      start: addDays(latestWeek.start, -7),
      end: addDays(latestWeek.start, -1)
    };
  }

  return latestWeek;
}

export function getLastNWeeksRange(weeks: number, referenceDate = getReferenceDate()): DateRange {
  const lastCompleteWeek = getLastCompleteWeekRange(referenceDate);

  return {
    start: addDays(lastCompleteWeek.start, -(weeks - 1) * 7),
    end: lastCompleteWeek.end
  };
}

export function isLatestWeekIncomplete(referenceDate = getReferenceDate()) {
  const range = getLatestWeekRange(referenceDate);
  const availableDates = new Set(
    syntheticEcommerce.experiment_events
      .map((row) => row.event_date)
      .filter((date) => date >= range.start && date <= range.end)
  );

  return availableDates.size < 7;
}

export function getAvailableDayCount(range: DateRange) {
  return new Set(
    syntheticEcommerce.experiment_events
      .map((row) => row.event_date)
      .filter((date) => date >= range.start && date <= range.end)
  ).size;
}

export function getWeekBucket(value: string) {
  const date = toDate(value);
  const day = date.getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  date.setUTCDate(date.getUTCDate() + mondayOffset);

  return isoDate(date);
}

export function getMonthBucket(value: string) {
  return value.slice(0, 7);
}
