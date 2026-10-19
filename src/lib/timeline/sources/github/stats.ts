import { z } from 'astro/zod';
import { site } from '@/config/site';
import { toTokyoDate } from '@/lib/timeline/date';
import { githubGraphql } from '@/lib/timeline/sources/github/client';
import type { IsoDate, TimelineEntry, TimelineSource } from '@/lib/timeline/types';

const { user, statsSince } = site.timeline.github;

const yearMonth = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);

const yearSchema = z.object({
  contributionCalendar: z.object({
    weeks: z.array(
      z.object({
        contributionDays: z.array(z.object({ date: z.iso.date(), contributionCount: z.number() })),
      }),
    ),
  }),
});
const responseSchema = z.object({ user: z.record(z.string(), yearSchema) });

/** One aliased field per calendar year, which keeps each inside GraphQL's one-year limit. */
function buildQuery(years: number[]): string {
  const fields = years.map(
    (year) =>
      `y${year}: contributionsCollection(from: "${year}-01-01T00:00:00+09:00", to: "${year}-12-31T23:59:59+09:00") {
        contributionCalendar { weeks { contributionDays { date contributionCount } } }
      }`,
  );
  return `query($login: String!) { user(login: $login) { ${fields.join('\n')} } }`;
}

const monthName = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

export const githubStatsSource: TimelineSource = {
  name: 'github-stats',
  required: false,
  async load() {
    // A malformed month would make the string comparisons below silently wrong.
    const since = yearMonth.parse(statsSince);
    const today = toTokyoDate(new Date().toISOString());
    const thisMonth = today.slice(0, 7);
    const firstYear = Number(since.slice(0, 4));
    const thisYear = Number(today.slice(0, 4));
    const years = Array.from({ length: thisYear - firstYear + 1 }, (_, i) => firstYear + i);

    const data = responseSchema.parse(await githubGraphql(buildQuery(years), { login: user }));
    const days = Object.values(data.user)
      .flatMap((year) => year.contributionCalendar.weeks)
      .flatMap((week) => week.contributionDays);

    const months = new Map<string, { count: number; lastDay: string }>();
    for (const day of days) {
      const month = day.date.slice(0, 7);
      const sofar = months.get(month);
      months.set(month, {
        count: (sofar?.count ?? 0) + day.contributionCount,
        lastDay: sofar && sofar.lastDay > day.date ? sofar.lastDay : day.date,
      });
    }

    // The current month is still open, so only closed months become entries.
    return [...months]
      .filter(([month, { count }]) => month >= since && month < thisMonth && count > 0)
      .map(
        ([month, { count, lastDay }]): TimelineEntry => ({
          id: `github-stats:${month}`,
          date: lastDay as IsoDate,
          kind: 'stats',
          title: `${monthName.format(new Date(`${month}-01T00:00:00Z`))}: ${count.toLocaleString('en-US')} ${count === 1 ? 'contribution' : 'contributions'}`,
          url: `https://github.com/${user}?tab=overview&from=${month}-01&to=${lastDay}`,
          source: 'github-stats',
          lang: 'en',
        }),
      );
  },
};
