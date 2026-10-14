import { z } from 'astro/zod';
import { manualSource } from '@/lib/timeline/sources/manual';
import type { TimelineEntry, TimelineSource } from '@/lib/timeline/types';

const defaultSources: readonly TimelineSource[] = [manualSource];

const isoDate = z.iso.date();

function findProblem(
  entry: TimelineEntry,
  source: TimelineSource,
  seen: Set<string>,
): string | undefined {
  if (!entry.id.startsWith(`${source.name}:`)) {
    return `id "${entry.id}" lacks the "${source.name}:" prefix`;
  }
  if (seen.has(entry.id)) {
    return `duplicate id "${entry.id}"`;
  }
  if (!isoDate.safeParse(entry.date).success) {
    return `invalid date "${entry.date}" on "${entry.id}"`;
  }
  return undefined;
}

async function loadSource(source: TimelineSource): Promise<TimelineEntry[]> {
  let loaded: TimelineEntry[];
  try {
    loaded = await source.load();
  } catch (error) {
    if (source.required) {
      throw new Error(`timeline: source "${source.name}" failed to load`, { cause: error });
    }
    console.warn(`timeline: skipping source "${source.name}"`, error);
    return [];
  }

  const seen = new Set<string>();
  const valid: TimelineEntry[] = [];
  for (const entry of loaded) {
    const problem = findProblem(entry, source, seen);
    if (problem === undefined) {
      seen.add(entry.id);
      valid.push(entry);
      continue;
    }
    if (source.required) {
      throw new Error(`timeline: ${problem}`);
    }
    console.warn(`timeline: dropping entry from "${source.name}": ${problem}`);
  }
  return valid;
}

/** Newest first; ties broken by id so the order is stable across builds. */
function newestFirst(a: TimelineEntry, b: TimelineEntry): number {
  if (a.date !== b.date) {
    return a.date < b.date ? 1 : -1;
  }
  if (a.id === b.id) {
    return 0;
  }
  return a.id < b.id ? -1 : 1;
}

export async function loadTimeline(
  sources: readonly TimelineSource[] = defaultSources,
): Promise<TimelineEntry[]> {
  const perSource = await Promise.all(sources.map(loadSource));
  return perSource.flat().sort(newestFirst);
}
