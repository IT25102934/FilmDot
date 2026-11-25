/**
 * Local screenplay parser — splits raw screenplay text into shot objects
 * based on standard screenplay formatting conventions.
 *
 * No API call, instant, works fully offline.
 *
 * Recognised patterns:
 *   • Scene headings:  INT. / EXT. / INT./EXT. (with optional scene numbers)
 *   • Character cues:  ALL-CAPS name on its own line, followed by dialogue
 *   • Action blocks:   everything else becomes a shot description
 *
 * Each scene heading starts a new scene_number; within a scene, every
 * meaningful block (action paragraph or dialogue beat) becomes a separate shot.
 */

// Matches standard sluglines: INT. / EXT. / INT/EXT. / I/E.
const SLUGLINE_RE = /^\s*(INT\.|EXT\.|INT\.?\s*\/\s*EXT\.|I\s*\/\s*E\.)\s+/i;

// Matches character cues: an ALL-CAPS word (optional parenthetical like (V.O.))
const CHARACTER_CUE_RE = /^[A-Z][A-Z0-9 .'-]{1,}(\s*\(.*?\))?\s*$/;

/**
 * Parse raw screenplay text into an array of shot objects, locally.
 *
 * @param {string} scriptText  Raw screenplay text.
 * @returns {Array<{
 *   shot_id: string,
 *   scene_number: number,
 *   shot_type: string,
 *   camera_movement: string,
 *   lens: string,
 *   lensType: string,
 *   lighting: string,
 *   lightingTemp: string,
 *   description: string,
 *   characters: string[]
 * }>}
 */
export function parseScriptLocally(scriptText) {
  if (!scriptText || typeof scriptText !== 'string' || !scriptText.trim()) {
    throw new Error('Please provide valid screenplay text to parse.');
  }

  const lines = scriptText.split(/\r?\n/);
  const shots = [];
  let sceneNumber = 0;
  let currentBlock = [];   // accumulated lines for the current shot
  let currentChars = [];   // characters detected so far in this shot
  let currentSlugline = '';

  const flushBlock = () => {
    const text = currentBlock
      .map((l) => l.trim())
      .filter(Boolean)
      .join(' ')
      .trim();

    if (!text) {
      currentBlock = [];
      return;
    }

    const shotIndex = shots.length + 1;
    shots.push({
      shot_id: `SHOT-${String(shotIndex).padStart(3, '0')}`,
      scene_number: sceneNumber || 1,
      shot_type: 'Medium Shot (MS)',
      camera_movement: 'Static (Locked-off / Tripod)',
      lens: '35mm Narrative Standard (T1.3) — Cinematic Normal',
      lensType: 'Static (Prime)',
      lighting: 'Low-Key / Film Noir (Deep shadows, high chiaroscuro)',
      lightingTemp: '5600K (Daylight Cool)',
      description: currentSlugline ? `${currentSlugline} — ${text}` : text,
      characters: [...new Set(currentChars)],
    });

    currentBlock = [];
    currentChars = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();

    // ── Scene heading ──
    if (SLUGLINE_RE.test(trimmed)) {
      flushBlock();
      sceneNumber++;
      currentSlugline = trimmed;
      continue;
    }

    // ── Blank line → paragraph boundary → flush into a shot ──
    if (!trimmed) {
      if (currentBlock.length > 0) {
        flushBlock();
      }
      continue;
    }

    // ── Character cue ──
    if (CHARACTER_CUE_RE.test(trimmed) && trimmed.length < 60) {
      // Flush preceding action block as its own shot before the dialogue beat
      if (currentBlock.length > 0 && !currentBlock.some((l) => CHARACTER_CUE_RE.test(l.trim()))) {
        flushBlock();
      }
      currentChars.push(trimmed.replace(/\s*\(.*?\)\s*$/, '').trim());
      currentBlock.push(trimmed);
      continue;
    }

    // ── Regular line (action or dialogue text) ──
    currentBlock.push(trimmed);
  }

  // Flush remaining
  flushBlock();

  // If nothing was parsed (e.g. single-paragraph with no headings) treat the
  // whole text as one shot
  if (shots.length === 0) {
    shots.push({
      shot_id: 'SHOT-001',
      scene_number: 1,
      shot_type: 'Medium Shot (MS)',
      camera_movement: 'Static (Locked-off / Tripod)',
      lens: '35mm Narrative Standard (T1.3) — Cinematic Normal',
      lensType: 'Static (Prime)',
      lighting: 'Low-Key / Film Noir (Deep shadows, high chiaroscuro)',
      lightingTemp: '5600K (Daylight Cool)',
      description: scriptText.trim(),
      characters: [],
    });
  }

  return shots;
}

export default { parseScriptLocally };
