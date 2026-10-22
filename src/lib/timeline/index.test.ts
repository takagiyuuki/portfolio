import { afterEach, describe, expect, it, vi } from 'vitest';
import { getTimeline, loadTimeline } from '@/lib/timeline';
import { manualSource } from '@/lib/timeline/sources/manual';
import type { IsoDate, TimelineEntry, TimelineSource } from '@/lib/timeline/types';

function entry(source: string, key: string, date: IsoDate): TimelineEntry {
  return { id: `${source}:${key}`, date, kind: 'milestone', title: key, source, lang: 'en' };
}

function source(name: string, required: boolean, entries: TimelineEntry[]): TimelineSource {
  return { name, required, load: async () => entries };
}

function failing(name: string, required: boolean): TimelineSource {
  return {
    name,
    required,
    load: async () => {
      throw new Error('network down');
    },
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('loadTimeline', () => {
  it('returns nothing when there are no sources', async () => {
    await expect(loadTimeline([])).resolves.toEqual([]);
  });

  it('merges sources newest first', async () => {
    const timeline = await loadTimeline([
      source('a', true, [entry('a', 'old', '2026-01-01'), entry('a', 'new', '2026-03-01')]),
      source('b', false, [entry('b', 'mid', '2026-02-01')]),
    ]);
    expect(timeline.map((e) => e.id)).toEqual(['a:new', 'b:mid', 'a:old']);
  });

  it('breaks date ties by id so builds are reproducible', async () => {
    const timeline = await loadTimeline([
      source('b', true, [entry('b', 'x', '2026-01-01')]),
      source('a', true, [entry('a', 'x', '2026-01-01')]),
    ]);
    expect(timeline.map((e) => e.id)).toEqual(['a:x', 'b:x']);
  });

  it('accepts the hand-written data', async () => {
    await expect(loadTimeline([manualSource])).resolves.toBeInstanceOf(Array);
  });
});

describe('an optional source', () => {
  it('is skipped when it fails to load', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const timeline = await loadTimeline([
      source('manual', true, [entry('manual', 'kept', '2026-01-01')]),
      failing('zenn', false),
    ]);
    expect(timeline.map((e) => e.id)).toEqual(['manual:kept']);
    expect(warn).toHaveBeenCalledOnce();
  });

  it('drops invalid entries and keeps the rest', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const timeline = await loadTimeline([
      source('github', false, [
        entry('github', 'ok', '2026-01-01'),
        entry('github', 'ok', '2026-01-01'),
        entry('github', 'bad', '2026-02-30'),
        { ...entry('github', 'x', '2026-01-01'), id: 'x' },
      ]),
    ]);
    expect(timeline.map((e) => e.id)).toEqual(['github:ok']);
    expect(warn).toHaveBeenCalledTimes(3);
  });
});

describe('a required source', () => {
  it('fails the build when it fails to load, keeping the cause', async () => {
    const result = loadTimeline([failing('manual', true)]);
    await expect(result).rejects.toThrow('timeline: source "manual" failed to load');
    await expect(result).rejects.toHaveProperty('cause.message', 'network down');
  });

  it.each([
    {
      name: 'a duplicate id',
      entries: [entry('manual', 'a', '2026-01-01'), entry('manual', 'a', '2026-01-01')],
      message: 'timeline: duplicate id "manual:a"',
    },
    {
      name: 'an impossible date',
      entries: [entry('manual', 'a', '2026-02-30')],
      message: 'timeline: invalid date "2026-02-30" on "manual:a"',
    },
    {
      name: 'a missing prefix',
      entries: [{ ...entry('manual', 'a', '2026-01-01'), id: 'a' }],
      message: 'timeline: id "a" lacks the "manual:" prefix',
    },
  ])('fails the build on $name and names the entry', async ({ entries, message }) => {
    await expect(loadTimeline([source('manual', true, entries)])).rejects.toThrow(message);
  });
});

describe('getTimeline', () => {
  it('loads once and hands every caller the same list', async () => {
    // getTimeline always reads the registered sources; keep them off the network.
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.error()),
    );
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const first = getTimeline();
    expect(first).toBe(getTimeline());
    await first;
  });
});
