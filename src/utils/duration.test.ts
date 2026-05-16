import { describe, it, expect } from 'vitest';
import { parseDuration, formatDuration } from './duration';

describe('parseDuration', () => {
  it('parses seconds', () => expect(parseDuration('30s')).toBe(30_000));
  it('parses minutes', () => expect(parseDuration('10m')).toBe(600_000));
  it('parses hours', () => expect(parseDuration('2h')).toBe(7_200_000));
  it('parses days', () => expect(parseDuration('7d')).toBe(604_800_000));
  it('parses weeks', () => expect(parseDuration('1w')).toBe(604_800_000));
  it('parses combined (1h30m)', () => expect(parseDuration('1h30m')).toBe(5_400_000));
  it('parses combined (2d12h)', () => expect(parseDuration('2d12h')).toBe(216_000_000));
  it('is case-insensitive', () => expect(parseDuration('10M')).toBe(600_000));
  it('returns null for empty string', () => expect(parseDuration('')).toBeNull());
  it('returns null for invalid input', () => expect(parseDuration('abc')).toBeNull());
  it('returns null for zero duration', () => expect(parseDuration('0m')).toBeNull());
});

describe('formatDuration', () => {
  it('formats seconds', () => expect(formatDuration(30_000)).toBe('30s'));
  it('formats minutes', () => expect(formatDuration(600_000)).toBe('10m'));
  it('formats hours', () => expect(formatDuration(3_600_000)).toBe('1h'));
  it('formats days', () => expect(formatDuration(86_400_000)).toBe('1d'));
  it('formats combined (1d2h30m)', () => expect(formatDuration(95_400_000)).toBe('1d 2h 30m'));
  it('formats zero as 0s', () => expect(formatDuration(0)).toBe('0s'));
  it('round-trips with parseDuration', () => {
    const inputs = ['10m', '1h', '2d', '1h30m'];
    for (const input of inputs) {
      const ms = parseDuration(input)!;
      expect(parseDuration(formatDuration(ms))).toBe(ms);
    }
  });
});
