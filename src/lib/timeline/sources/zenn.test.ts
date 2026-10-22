import { afterEach, describe, expect, it, vi } from 'vitest';
import { zennSource } from '@/lib/timeline/sources/zenn';

function feed(items: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title><![CDATA[yukiさんのフィード]]></title><language><![CDATA[ja]]></language>${items}</channel></rss>`;
}

function item(slug: string, title: string, pubDate: string): string {
  return `<item><title><![CDATA[${title}]]></title><link>https://zenn.dev/yukitakagi/articles/${slug}</link><pubDate>${pubDate}</pubDate></item>`;
}

function respond(body: string, status = 200) {
  const fetchMock = vi.fn(async () => new Response(body, { status }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('zennSource', () => {
  it('turns each article in the feed into an entry', async () => {
    const fetchMock = respond(
      feed(item('astro-timeline', 'Astro で Timeline & RSS', 'Fri, 02 Oct 2026 16:00:00 GMT')),
    );

    await expect(zennSource.load()).resolves.toEqual([
      {
        id: 'zenn:yukitakagi/articles/astro-timeline',
        date: '2026-10-03',
        kind: 'article',
        title: 'Astro で Timeline & RSS',
        url: 'https://zenn.dev/yukitakagi/articles/astro-timeline',
        source: 'zenn',
        lang: 'ja',
      },
    ]);
    expect(fetchMock).toHaveBeenCalledWith('https://zenn.dev/yukitakagi/feed');
  });

  it('returns nothing for a feed without articles', async () => {
    respond(feed(''));
    await expect(zennSource.load()).resolves.toEqual([]);
  });

  it('fails when Zenn answers with an error', async () => {
    respond('Service Unavailable', 503);
    await expect(zennSource.load()).rejects.toThrow('503');
  });

  it('does not mistake a page without a channel for an empty feed', async () => {
    respond('<html><body>maintenance</body></html>');
    await expect(zennSource.load()).rejects.toThrow('no <channel>');
  });

  it('fails when an article lacks its link', async () => {
    respond(
      feed('<item><title>No link</title><pubDate>Fri, 02 Oct 2026 16:00:00 GMT</pubDate></item>'),
    );
    await expect(zennSource.load()).rejects.toThrow();
  });
});
