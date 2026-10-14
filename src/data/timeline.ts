import type { TimelineEntry } from '@/lib/timeline/types';

/** Hand-written entry. The manual source derives `id` and `source`. */
export type ManualEntry = Omit<TimelineEntry, 'id' | 'source'> & {
  /** Stable key; becomes `manual:<slug>`. Do not change once published. */
  slug: string;
};

export const timeline: readonly ManualEntry[] = [];
