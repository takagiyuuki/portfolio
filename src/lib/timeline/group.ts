import type { TimelineEntry } from '@/lib/timeline/types';

/** One node on the trunk: a month, its contributions, and what happened in it. */
export interface TimelineMonth {
  /** YYYY-MM */
  month: string;
  /** The month's contributions. Absent for the month still open, or one before the stats start. */
  stats?: TimelineEntry;
  /** Everything else that month, newest first. These go on the branch. */
  events: TimelineEntry[];
}

export function groupByMonth(entries: readonly TimelineEntry[]): TimelineMonth[] {
  const months = new Map<string, TimelineMonth>();
  for (const entry of entries) {
    const key = entry.date.slice(0, 7);
    let month = months.get(key);
    if (month === undefined) {
      month = { month: key, events: [] };
      months.set(key, month);
    }
    if (entry.kind === 'stats') {
      month.stats = entry;
    } else {
      month.events.push(entry);
    }
  }
  return [...months.values()].sort((a, b) => (a.month < b.month ? 1 : -1));
}

/** The newest months, up to and including the one where the events reach `events`. */
export function takeUntilEvents(months: readonly TimelineMonth[], events: number): TimelineMonth[] {
  const taken: TimelineMonth[] = [];
  let seen = 0;
  for (const month of months) {
    if (seen >= events) {
      break;
    }
    taken.push(month);
    seen += month.events.length;
  }
  return taken;
}
