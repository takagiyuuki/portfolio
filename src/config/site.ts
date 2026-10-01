import type { PageMeta } from '@/types/page';

const author = 'Yuki Takagi';

export const site = {
  name: author,
  tagline: 'Infrastructure Engineer',
  description: 'Projects, repositories, and activity.',
  author,
  social: {
    github: 'https://github.com/takagiyuuki',
    linkedin: 'https://www.linkedin.com/in/takagiyuuki/',
  },
} as const;

/**
 * Both translated pages emit this whole set, themselves included: search
 * engines drop hreflang unless every version points at all the others. One
 * copy here is what keeps the two pages from disagreeing.
 */
export const languageAlternates: NonNullable<PageMeta['alternate']> = [
  { hreflang: 'ja', href: '/' },
  { hreflang: 'en', href: '/en/' },
];
