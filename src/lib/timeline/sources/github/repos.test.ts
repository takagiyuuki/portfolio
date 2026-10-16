import { afterEach, describe, expect, it, vi } from 'vitest';
import { githubRepoSource } from '@/lib/timeline/sources/github/repos';

function repo(name: string, overrides: Record<string, unknown> = {}) {
  return {
    name,
    html_url: `https://github.com/takagiyuuki/${name}`,
    description: 'A tool',
    created_at: '2026-04-26T23:30:00Z',
    private: false,
    fork: false,
    archived: false,
    topics: ['showcase'],
    ...overrides,
  };
}

function respond(body: unknown, status = 200) {
  const fetchMock = vi.fn(async () => new Response(JSON.stringify(body), { status }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('githubRepoSource', () => {
  it('keeps only public, non-fork, unarchived repositories with the topic', async () => {
    const fetchMock = respond([
      repo('kept'),
      repo('secret', { private: true }),
      repo('forked', { fork: true }),
      repo('retired', { archived: true }),
      repo('untagged', { topics: ['astro'] }),
    ]);

    await expect(githubRepoSource.load()).resolves.toEqual([
      {
        id: 'github-repo:kept',
        date: '2026-04-27',
        kind: 'repo',
        title: 'Published kept',
        url: 'https://github.com/takagiyuuki/kept',
        detail: 'A tool',
        source: 'github-repo',
        lang: 'en',
      },
    ]);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.github.com/users/takagiyuuki/repos?type=owner&per_page=100',
      expect.anything(),
    );
  });

  it('leaves the detail out when the description is empty', async () => {
    respond([repo('bare', { description: null })]);
    const [entry] = await githubRepoSource.load();
    expect(entry?.detail).toBeUndefined();
  });

  it('warns when a full page may hide more repositories', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    respond(Array.from({ length: 100 }, (_, i) => repo(`repo-${i}`)));
    await githubRepoSource.load();
    expect(warn).toHaveBeenCalledOnce();
  });

  it('fails when GitHub answers with an error', async () => {
    respond({ message: 'Server Error' }, 500);
    await expect(githubRepoSource.load()).rejects.toThrow('500');
  });
});
