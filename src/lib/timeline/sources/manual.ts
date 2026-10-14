import { timeline } from '@/data/timeline';
import type { TimelineSource } from '@/lib/timeline/types';

export const manualSource: TimelineSource = {
  name: 'manual',
  required: true,
  async load() {
    return timeline.map(({ slug, ...entry }) => ({
      ...entry,
      id: `manual:${slug}`,
      source: 'manual',
    }));
  },
};
