import { z } from 'astro/zod';
import { site } from '@/config/site';
import { toTokyoDate } from '@/lib/timeline/date';
import { githubRest } from '@/lib/timeline/sources/github/client';
import type { TimelineEntry, TimelineSource } from '@/lib/timeline/types';

const { user, topic } = site.timeline.github;
const perPage = 100;

const repoSchema = z.object({
  name: z.string(),
  html_url: z.string(),
  description: z.string().nullable(),
  created_at: z.string(),
  private: z.boolean(),
  fork: z.boolean(),
  archived: z.boolean(),
  topics: z.array(z.string()),
});

export const githubRepoSource: TimelineSource = {
  name: 'github-repo',
  required: false,
  async load() {
    const repos = z
      .array(repoSchema)
      .parse(await githubRest(`/users/${user}/repos?type=owner&per_page=${perPage}`));

    if (repos.length === perPage) {
      console.warn(`timeline: ${user} has ${perPage}+ repositories; only the first page was read`);
    }

    // `private` is checked even though the endpoint returns public repositories only:
    // a broader token must never leak a private one onto the site.
    return repos
      .filter(
        (repo) => !repo.private && !repo.fork && !repo.archived && repo.topics.includes(topic),
      )
      .map(
        (repo): TimelineEntry => ({
          id: `github-repo:${repo.name}`,
          date: toTokyoDate(repo.created_at),
          kind: 'repo',
          title: `Published ${repo.name}`,
          url: repo.html_url,
          detail: repo.description ?? undefined,
          source: 'github-repo',
          lang: 'en',
        }),
      );
  },
};
