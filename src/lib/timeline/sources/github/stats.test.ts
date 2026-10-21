import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { githubStatsSource } from '@/lib/timeline/sources/github/stats';

function calendar(days: [string, number][]) {
  return {
    contributionCalendar: {
      weeks: [
        {
          contributionDays: days.map(([date, contributionCount]) => ({ date, contributionCount })),
        },
      ],
    },
  };
}

function respond(user: Record<string, unknown>) {
  const fetchMock = vi.fn(
    async (_input: string, _init?: RequestInit) => new Response(JSON.stringify({ data: { user } })),
  );
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-10-16T09:00:00+09:00'));
  vi.stubEnv('GITHUB_TOKEN', 'test-token');
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('githubStatsSource', () => {
  it('asks for every year since the first month in one request', async () => {
    const fetchMock = respond({ y2025: calendar([]), y2026: calendar([]) });
    await githubStatsSource.load();

    expect(fetchMock).toHaveBeenCalledOnce();
    const body: unknown = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(body).toMatchObject({
      query: expect.stringContaining('y2025: contributionsCollection'),
      variables: { login: 'takagiyuuki' },
    });
    expect(body).toMatchObject({
      query: expect.stringContaining('y2026: contributionsCollection'),
    });
  });

  it('turns closed months into entries and leaves the rest out', async () => {
    respond({
      y2025: calendar([
        ['2025-05-31', 9], // before the first month
        ['2025-06-01', 2],
        ['2025-06-30', 3],
        ['2025-07-15', 0], // an empty month
      ]),
      y2026: calendar([
        ['2026-09-01', 100],
        ['2026-09-30', 57],
        ['2026-10-01', 5], // the month is still open
      ]),
    });

    await expect(githubStatsSource.load()).resolves.toEqual([
      {
        id: 'github-stats:2025-06',
        date: '2025-06-30',
        kind: 'stats',
        title: 'June 2025: 5 contributions',
        url: 'https://github.com/takagiyuuki?tab=overview&from=2025-06-01&to=2025-06-30',
        source: 'github-stats',
        lang: 'en',
        count: 5,
      },
      {
        id: 'github-stats:2026-09',
        date: '2026-09-30',
        kind: 'stats',
        title: 'September 2026: 157 contributions',
        url: 'https://github.com/takagiyuuki?tab=overview&from=2026-09-01&to=2026-09-30',
        source: 'github-stats',
        lang: 'en',
        count: 157,
      },
    ]);
  });

  it('says contribution for a month with just one', async () => {
    respond({ y2025: calendar([]), y2026: calendar([['2026-08-10', 1]]) });
    const [entry] = await githubStatsSource.load();
    expect(entry?.title).toBe('August 2026: 1 contribution');
  });

  it('fails without a token, before reaching GitHub', async () => {
    const fetchMock = respond({});
    vi.stubEnv('GITHUB_TOKEN', '');
    await expect(githubStatsSource.load()).rejects.toThrow('requires GITHUB_TOKEN');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
