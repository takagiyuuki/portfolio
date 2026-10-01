/** Per-page metadata every page supplies to the layout. */

export interface PageMeta {
  title: string;
  description?: string;
  /** Document language. Drives <html lang> and og:locale. */
  lang?: 'en' | 'ja';
  /** Set on the two pages that are translations of each other. */
  alternate?: { hreflang: 'en' | 'ja'; href: string }[];
  /** The front door carries the full identity in its title. */
  isFrontDoor?: boolean;
}
