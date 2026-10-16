import type { IsoDate } from '@/lib/timeline/types';

const tokyo = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Tokyo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** The calendar date in Japan for a timestamp. loadTimeline validates the result. */
export function toTokyoDate(timestamp: string): IsoDate {
  const parts = Object.fromEntries(
    tokyo.formatToParts(new Date(timestamp)).map((part) => [part.type, part.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}` as IsoDate;
}
