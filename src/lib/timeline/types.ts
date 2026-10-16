export type TimelineKind = 'article' | 'repo' | 'contribution' | 'stats' | 'milestone';

/** YYYY-MM-DD. Rejects month-only dates at compile time; not a full validator. */
export type IsoDate = `${number}-${number}-${number}`;

export interface TimelineEntry {
  /** "<source>:<stable-key>". Used for dedupe and as the render key. */
  id: string;
  date: IsoDate;
  kind: TimelineKind;
  title: string;
  url?: string;
  detail?: string;
  source: string;
  /** Language of `title` / `detail`. Not derived from `source`. */
  lang: 'en' | 'ja';
}

export interface TimelineSource {
  name: string;
  /** A required source fails the build; an optional one is logged and skipped. */
  required: boolean;
  load(): Promise<TimelineEntry[]>;
}
