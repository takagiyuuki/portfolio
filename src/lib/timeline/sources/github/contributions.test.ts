import { afterEach, describe, expect, it, vi } from 'vitest';
import { githubContributionSource } from '@/lib/timeline/sources/github/contributions';

function item(number: number, overrides: Record<string, unknown> = {}) {
  return {
    number,
    title: `change ${number}`,
    html_url: `https://github.com/acme/tool/pull/${number}`,
    state: 'open',
    created_at: '2026-06-17T02:16:02Z',
    repository_url: 'https://api.github.com/repos/acme/tool',
    pull_request: { merged_at: null },
    ...overrides,
  };
}

function respond(items: unknown[], extra: Record<string, unknown> = {}) {
  const body = { total_count: items.length, incomplete_results: false, items, ...extra };
  const fetchMock = vi.fn(async () => new Response(JSON.stringify(body)));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('githubContributionSource', () => {
  it('searches public work outside my own repositories', async () => {
    const fetchMock = respond([item(1)]);
    await githubContributionSource.load();
    // Spelled out rather than rebuilt with URLSearchParams, so an encoding mistake cannot hide.
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.github.com/search/issues?q=author%3Atakagiyuuki+-user%3Atakagiyuuki+is%3Apublic&per_page=100',
      expect.anything(),
    );
  });

  it('dates an open pull request by when it was opened', async () => {
    respond([item(5273)]);
    await expect(githubContributionSource.load()).resolves.toEqual([
      {
        id: 'github-contribution:acme/tool#5273',
        date: '2026-06-17',
        kind: 'contribution',
        title: 'Opened a pull request to acme/tool',
        url: 'https://github.com/acme/tool/pull/5273',
        detail: 'change 5273',
        source: 'github-contribution',
        lang: 'en',
      },
    ]);
  });

  it('dates a merged pull request by its merge', async () => {
    respond([item(1, { state: 'closed', pull_request: { merged_at: '2026-07-01T15:30:00Z' } })]);
    const [entry] = await githubContributionSource.load();
    expect(entry?.title).toBe('Merged a pull request into acme/tool');
    expect(entry?.date).toBe('2026-07-02');
  });

  it('tells an issue apart from a pull request', async () => {
    respond([item(1, { pull_request: undefined })]);
    const [entry] = await githubContributionSource.load();
    expect(entry?.title).toBe('Opened an issue on acme/tool');
  });

  it('leaves out a pull request closed without merging', async () => {
    respond([item(1, { state: 'closed' })]);
    await expect(githubContributionSource.load()).resolves.toEqual([]);
  });

  it('warns when the search finds nothing', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    respond([]);
    await githubContributionSource.load();
    expect(warn).toHaveBeenCalledOnce();
  });

  it('warns when the search returns only part of the results', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    respond([item(1)], { total_count: 150 });
    await githubContributionSource.load();
    expect(warn).toHaveBeenCalledOnce();
  });
});
