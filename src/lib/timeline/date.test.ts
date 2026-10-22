import { describe, expect, it } from 'vitest';
import { toTokyoDate } from '@/lib/timeline/date';

describe('toTokyoDate', () => {
  it('moves a late UTC evening into the next day in Japan', () => {
    expect(toTokyoDate('2026-04-26T23:30:00Z')).toBe('2026-04-27');
  });

  it('keeps a UTC morning on the same day', () => {
    expect(toTokyoDate('2026-04-27T04:51:19Z')).toBe('2026-04-27');
  });

  it('reads the RFC 822 dates that RSS uses', () => {
    expect(toTokyoDate('Fri, 02 Oct 2026 16:00:00 GMT')).toBe('2026-10-03');
  });
});
