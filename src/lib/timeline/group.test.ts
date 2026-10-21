import { describe, expect, it } from 'vitest';
import { groupByMonth, takeUntilEvents } from '@/lib/timeline/group';
import type { IsoDate, TimelineEntry, TimelineKind } from '@/lib/timeline/types';

function entry(id: string, date: IsoDate, kind: TimelineKind = 'repo'): TimelineEntry {
  return { id, date, kind, title: id, source: 'test', lang: 'en' };
}

describe('groupByMonth', () => {
  it('puts the stats on the trunk and the rest on the branch', () => {
    const [august] = groupByMonth([
      entry('stats', '2026-08-31', 'stats'),
      entry('repo', '2026-08-17'),
      entry('article', '2026-08-03', 'article'),
    ]);
    expect(august?.month).toBe('2026-08');
    expect(august?.stats?.id).toBe('stats');
    expect(august?.events.map((e) => e.id)).toEqual(['repo', 'article']);
  });

  it('orders months newest first whatever order the entries come in', () => {
    const months = groupByMonth([
      entry('june', '2026-06-17'),
      entry('august', '2026-08-17'),
      entry('july', '2026-07-01'),
    ]);
    expect(months.map((m) => m.month)).toEqual(['2026-08', '2026-07', '2026-06']);
  });

  it('keeps a month that has events but no stats yet', () => {
    const [october] = groupByMonth([entry('repo', '2026-10-05')]);
    expect(october?.stats).toBeUndefined();
    expect(october?.events).toHaveLength(1);
  });

  it('returns nothing for nothing', () => {
    expect(groupByMonth([])).toEqual([]);
  });
});

describe('takeUntilEvents', () => {
  const months = groupByMonth([
    entry('s09', '2026-09-30', 'stats'),
    entry('s08', '2026-08-31', 'stats'),
    entry('a', '2026-08-17'),
    entry('b', '2026-08-03'),
    entry('s07', '2026-07-31', 'stats'),
    entry('s06', '2026-06-30', 'stats'),
    entry('c', '2026-06-17'),
    entry('s05', '2026-05-31', 'stats'),
  ]);

  it('stops at the month where the events reach the count', () => {
    expect(takeUntilEvents(months, 3).map((m) => m.month)).toEqual([
      '2026-09',
      '2026-08',
      '2026-07',
      '2026-06',
    ]);
  });

  it('includes the whole month that crosses the count', () => {
    expect(takeUntilEvents(months, 1).map((m) => m.month)).toEqual(['2026-09', '2026-08']);
  });

  it('returns every month when there are fewer events than asked for', () => {
    expect(takeUntilEvents(months, 10)).toHaveLength(5);
  });
});
