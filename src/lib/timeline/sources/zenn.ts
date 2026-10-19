import { parseXml, XmlElement } from '@rgrove/parse-xml';
import { z } from 'astro/zod';
import { site } from '@/config/site';
import { toTokyoDate } from '@/lib/timeline/date';
import type { TimelineEntry, TimelineSource } from '@/lib/timeline/types';

const { user } = site.timeline.zenn;
const feedUrl = `https://zenn.dev/${user}/feed`;

const itemSchema = z.object({
  title: z.string().min(1),
  link: z.url(),
  pubDate: z.string(),
});

function childElements(parent: XmlElement, name: string): XmlElement[] {
  return parent.children.filter(
    (node): node is XmlElement => node instanceof XmlElement && node.name === name,
  );
}

function childText(parent: XmlElement, name: string): string | undefined {
  return childElements(parent, name)[0]?.text.trim();
}

export const zennSource: TimelineSource = {
  name: 'zenn',
  required: false,
  async load() {
    const response = await fetch(feedUrl);
    if (!response.ok) {
      throw new Error(`Zenn ${feedUrl}: ${response.status} ${response.statusText}`);
    }

    const root = parseXml(await response.text()).root;
    const channel = root ? childElements(root, 'channel')[0] : undefined;
    // A maintenance page must not pass for a feed with no articles.
    if (!channel) {
      throw new Error(`Zenn ${feedUrl}: no <channel> in the feed`);
    }

    return childElements(channel, 'item').map((element): TimelineEntry => {
      const item = itemSchema.parse({
        title: childText(element, 'title'),
        link: childText(element, 'link'),
        pubDate: childText(element, 'pubDate'),
      });
      return {
        id: `zenn:${new URL(item.link).pathname.slice(1)}`,
        date: toTokyoDate(item.pubDate),
        kind: 'article',
        title: item.title,
        url: item.link,
        source: 'zenn',
        lang: 'ja',
      };
    });
  },
};
