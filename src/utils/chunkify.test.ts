import { describe, it, expect } from 'vitest';
import { chunkify } from './chunkify';

describe('chunkify', () => {
  it('returns single chunk when text fits', () => {
    expect(chunkify('hello', 100)).toEqual(['hello']);
  });

  it('splits text at maxLen boundary', () => {
    const chunks = chunkify('abcde', 2);
    expect(chunks).toEqual(['ab', 'cd', 'e']);
  });

  it('uses default maxLen of 1000', () => {
    const short = 'x'.repeat(999);
    expect(chunkify(short)).toHaveLength(1);
    const exact = 'x'.repeat(1000);
    expect(chunkify(exact)).toHaveLength(1);
    const over = 'x'.repeat(1001);
    expect(chunkify(over)).toHaveLength(2);
  });

  it('preserves full content across chunks', () => {
    const text = 'abcdefghij';
    const chunks = chunkify(text, 3);
    expect(chunks.join('')).toBe(text);
  });

  it('handles empty string', () => {
    expect(chunkify('')).toEqual(['']);
  });
});
