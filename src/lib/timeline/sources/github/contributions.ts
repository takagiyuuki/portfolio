import { z } from 'astro/zod';
import { site } from '@/config/site';
import { toTokyoDate } from '@/lib/timeline/date';
import { githubRest } from '@/lib/timeline/sources/github/client';
import type { TimelineEntry, TimelineSource } from '@/lib/timeline/types';

const { user } = site.timeline.github;
const perPage = 100;
const repoPrefix = 'https://api.github.com/repos/';

const itemSchema = z.object({
  number: z.number(),
  title: z.string(),
  html_url: z.string(),
  state: z.enum(['open', 'closed']),
  created_at: z.string(),
  repository_url: z.string().startsWith(repoPrefix),
  pull_request: z.object({ merged_at: z.string().nullable() }).optional(),
});

const searchSchema = z.object({
  total_count: z.number(),
  incomplete_results: z.boolean(),
  items: z.array(itemSchema),
});

type Item = z.infer<typeof itemSchema>;

/** A pull request closed without merging is not an entry. */
function toEntry(item: Item): TimelineEntry | undefined {
  const repo = item.repository_url.slice(repoPrefix.length);
  const common = {
    id: `github-contribution:${repo}#${item.number}`,
    kind: 'contribution',
    url: item.html_url,
    detail: item.title,
    source: 'github-contribution',
    lang: 'en',
  } as const;

  if (!item.pull_request) {
    return { ...common, date: toTokyoDate(item.created_at), title: `Opened an issue on ${repo}` };
  }
  if (item.pull_request.merged_at) {
    return {
      ...common,
      date: toTokyoDate(item.pull_request.merged_at),
      title: `Merged a pull request into ${repo}`,
    };
  }
  if (item.state === 'open') {
    return {
      ...common,
      date: toTokyoDate(item.created_at),
      title: `Opened a pull request to ${repo}`,
    };
  }
  return undefined;
}

export const githubContributionSource: TimelineSource = {
  name: 'github-contribution',
  required: false,
  async load() {
    const params = new URLSearchParams({
      q: `author:${user} -user:${user} is:public`,
      per_page: String(perPage),
    });
    const result = searchSchema.parse(await githubRest(`/search/issues?${params}`));

    // An empty result is more likely a broken query than no contributions at all.
    if (result.total_count === 0) {
      console.warn(`timeline: no contributions found for ${user}; check the search query`);
    }
    if (result.incomplete_results || result.total_count > result.items.length) {
      console.warn(
        `timeline: contribution search returned ${result.items.length} of ${result.total_count}`,
      );
    }

    return result.items.map(toEntry).filter((entry) => entry !== undefined);
  },
};
