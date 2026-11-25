import { describe, it, expect } from 'vitest';
import { parseScriptLocally } from './scriptParser';

describe('parseScriptLocally', () => {
  it('throws an error on empty or non-string input', () => {
    expect(() => parseScriptLocally('')).toThrow();
    expect(() => parseScriptLocally('   \n  ')).toThrow();
    expect(() => parseScriptLocally(null)).toThrow();
  });

  it('splits scene headings, action blocks, and dialogue into sequential shots', () => {
    const script = `EXT. NEON ALLEYWAY - NIGHT

Rain falls on wet asphalt.

DETECTIVE KALE
We are out of time.

INT. BUNKER - CONTINUOUS

MAYA (V.O.)
Bypassing the lock now.`;

    const shots = parseScriptLocally(script);

    expect(shots).toHaveLength(3);
    expect(shots[0]).toMatchObject({
      shot_id: 'SHOT-001',
      scene_number: 1,
      description: 'EXT. NEON ALLEYWAY - NIGHT — Rain falls on wet asphalt.',
      characters: [],
    });
    expect(shots[1]).toMatchObject({
      shot_id: 'SHOT-002',
      scene_number: 1,
      characters: ['DETECTIVE KALE'],
    });
    expect(shots[1].description).toContain('We are out of time.');
    expect(shots[2]).toMatchObject({
      shot_id: 'SHOT-003',
      scene_number: 2,
      characters: ['MAYA'],
    });
    expect(shots[2].description).toContain('INT. BUNKER - CONTINUOUS');
  });

  it('separates an action block from an immediately following character cue', () => {
    const script = `INT. STUDIO - DAY

Maya adjusts the lens.
MAYA
Rolling.`;

    const shots = parseScriptLocally(script);

    expect(shots).toHaveLength(2);
    expect(shots[0].description).toBe('INT. STUDIO - DAY — Maya adjusts the lens.');
    expect(shots[0].characters).toEqual([]);
    expect(shots[1].characters).toEqual(['MAYA']);
    expect(shots[1].description).toContain('Rolling.');
  });

  it('handles a single paragraph with no sluglines', () => {
    const shots = parseScriptLocally('A lone figure walks across the bridge.');

    expect(shots).toHaveLength(1);
    expect(shots[0]).toMatchObject({
      shot_id: 'SHOT-001',
      scene_number: 1,
      description: 'A lone figure walks across the bridge.',
      characters: [],
    });
  });
});
