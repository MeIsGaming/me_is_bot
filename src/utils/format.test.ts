import { describe, it, expect } from 'vitest';
import { intToHex, dt, snowflakeToMs } from './format';

describe('intToHex', () => {
  it('converts discord blurple', () => expect(intToHex(0x5865F2)).toBe('#5865F2'));
  it('converts red', () => expect(intToHex(0xFF0000)).toBe('#FF0000'));
  it('converts black', () => expect(intToHex(0x000000)).toBe('#000000'));
  it('converts white', () => expect(intToHex(0xFFFFFF)).toBe('#FFFFFF'));
  it('pads short values', () => expect(intToHex(0x0000FF)).toBe('#0000FF'));
  it('output always starts with #', () => expect(intToHex(0x123456).startsWith('#')).toBe(true));
  it('output is always 7 chars (#RRGGBB)', () => expect(intToHex(0x123456)).toHaveLength(7));
});

describe('dt', () => {
  it('formats as Discord timestamp', () => {
    expect(dt(1000)).toBe('<t:1:F>');
  });

  it('uses custom format', () => {
    expect(dt(1000, 'R')).toBe('<t:1:R>');
    expect(dt(1000, 'd')).toBe('<t:1:d>');
  });

  it('floors to seconds', () => {
    expect(dt(1500)).toBe('<t:1:F>');
    expect(dt(1999)).toBe('<t:1:F>');
  });
});

describe('snowflakeToMs', () => {
  it('converts a known Discord snowflake', () => {
    // Discord epoch is 2015-01-01T00:00:00.000Z = 1420070400000ms
    // snowflake with timestamp=0 should return exactly the epoch
    const epochSnowflake = (0n << 22n).toString();
    expect(snowflakeToMs(epochSnowflake)).toBe(1420070400000);
  });

  it('returns a plausible timestamp for a real-looking snowflake', () => {
    const ms = snowflakeToMs('175928847299117063');
    expect(ms).toBeGreaterThan(1420070400000);
    expect(ms).toBeLessThan(Date.now() + 1000);
  });
});
