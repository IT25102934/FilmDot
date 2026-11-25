import { GoogleGenAI } from '@google/genai';

export const GEMINI_API_KEY_STORAGE_KEY = 'filmdot_gemini_api_key';
export const GEMINI_MODEL_STORAGE_KEY = 'filmdot_gemini_model';
export const DEFAULT_GEMINI_MODEL = 'gemini-3.8-flash';

/**
 * Custom error class for missing API key with standard error code.
 */
export class MissingApiKeyError extends Error {
  constructor(
    message = 'No Gemini API key found. Please enter your free API key in Settings, or get one at Google AI Studio.'
  ) {
    super(message);
    this.name = 'MissingApiKeyError';
    this.code = 'NO_API_KEY';
  }
}

/**
 * Retrieves the currently active Gemini API key:
 * 1. Checks localStorage for a user-entered key.
 * 2. Falls back to import.meta.env.VITE_GEMINI_API_KEY if present locally.
 * 3. Returns null if neither is configured.
 */
export function getGeminiApiKey() {
  if (typeof window !== 'undefined' && window.localStorage) {
    const stored = window.localStorage.getItem(GEMINI_API_KEY_STORAGE_KEY);
    if (stored && stored.trim()) {
      return stored.trim();
    }
  }
  const envKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (envKey && envKey.trim() && envKey !== 'your_gemini_api_key_here') {
    return envKey.trim();
  }
  return null;
}

/**
 * Returns the source of the current API key:
 * 'localStorage' | 'env' | 'none'
 */
export function getApiKeySource() {
  if (typeof window !== 'undefined' && window.localStorage) {
    const stored = window.localStorage.getItem(GEMINI_API_KEY_STORAGE_KEY);
    if (stored && stored.trim()) {
      return 'localStorage';
    }
  }
  const envKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (envKey && envKey.trim() && envKey !== 'your_gemini_api_key_here') {
    return 'env';
  }
  return 'none';
}

/**
 * Stores or clears user's Gemini API key in localStorage.
 *
 * @param {string|null} key - The API key to store, or null/empty to clear.
 */
export function setGeminiApiKey(key) {
  if (typeof window !== 'undefined' && window.localStorage) {
    if (key && key.trim()) {
      window.localStorage.setItem(GEMINI_API_KEY_STORAGE_KEY, key.trim());
    } else {
      window.localStorage.removeItem(GEMINI_API_KEY_STORAGE_KEY);
    }
  }
}

/**
 * Checks if a valid API key is available (either in localStorage or in env).
 */
export function hasGeminiApiKey() {
  return Boolean(getGeminiApiKey());
}

/**
 * Retrieves the active Gemini model from localStorage, automatically migrating
 * any outdated gemini-1.5 or gemini-2.0 model strings to DEFAULT_GEMINI_MODEL.
 */
export function getGeminiModel() {
  if (typeof window !== 'undefined' && window.localStorage) {
    const stored = window.localStorage.getItem(GEMINI_MODEL_STORAGE_KEY);
    if (stored && stored.trim()) {
      const trimmed = stored.trim();
      if (/^(?:models\/)?gemini-(1\.5|2\.0)/i.test(trimmed)) {
        window.localStorage.setItem(GEMINI_MODEL_STORAGE_KEY, DEFAULT_GEMINI_MODEL);
        return DEFAULT_GEMINI_MODEL;
      }
      return trimmed;
    }
  }
  return DEFAULT_GEMINI_MODEL;
}

/**
 * Initializes and returns a GoogleGenAI instance using the active API key.
 * Throws MissingApiKeyError if no key is configured.
 */
function getGenAIClient() {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new MissingApiKeyError(
      'Gemini API key is not configured. Please enter your free API key in Settings, or get one from Google AI Studio (https://aistudio.google.com/app/apikey).'
    );
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Parses screenplay text into a structured shot list using Google Gemini.
 *
 * @param {string} scriptText - The raw screenplay text to parse into shots.
 * @returns {Promise<Array<{
 *   shot_id: string,
 *   scene_number: number|string,
 *   shot_type: string,
 *   camera_movement: string,
 *   lens: string,
 *   lensType: string,
 *   lighting: string,
 *   lightingTemp: string,
 *   description: string,
 *   characters: string[]
 * }>>} An array of parsed shot objects.
 */
export async function parseScriptToShots(scriptText) {
  if (!scriptText || typeof scriptText !== 'string' || scriptText.trim() === '') {
    throw new Error('Please provide valid screenplay text to parse.');
  }

  const ai = getGenAIClient();

  const prompt = `You are an expert film director and cinematographer. Break down the following screenplay text into a sequence of cinematic shots.

For each shot, provide:
- shot_id: A unique sequential shot identifier (e.g. "SHOT-001", "SHOT-002")
- scene_number: The scene number (e.g., 1 or "1")
- shot_type: Cinematic framing type (e.g., "Establishing Wide Shot (EWS)", "Wide Shot (WS / Master)", "Medium Shot (MS)", "Close-up (CU)", "Extreme Close-up (ECU)", "Over-the-Shoulder (OTS)", "Point of View (POV)", "Low Angle Hero Shot")
- camera_movement: The camera motion (e.g., "Static (Locked-off / Tripod)", "Slow Push-in (Dolly In)", "Slow Pull-out (Dolly Out)", "Pan Left", "Tilt Up", "Tracking / Trucking Shot", "Steadicam / Gimbal Follow", "Handheld (Organic Shaky)", "Crane / Jib Vertical Arc")
- lens: Recommended lens specification (e.g. "24mm Wide Angle (T1.4)", "35mm Narrative Standard (T1.3)", "50mm Human Perspective (T1.2)", "85mm Portrait (T1.4)", "24-70mm T2.8 Zoom (Conditional)")
- lensType: Either "Static (Prime)" or "Conditional (Zoom)"
- lighting: Recommended lighting style (e.g. "Low-Key / Film Noir", "High-Key Soft", "Cyberpunk Neon (Cobalt & Magenta)", "Golden Hour Backlit", "Practical Lighting Only", "Motivated Moonlit Night")
- lightingTemp: Recommended color temperature (e.g. "3200K (Tungsten Warm)", "5600K (Daylight Cool)", "Stylized Neon RGB")
- description: Detailed visual description of the shot action, framing, and atmosphere
- characters: Array of character names present in the shot

Screenplay text:
"""
${scriptText}
"""

Return a clean JSON array containing only the shot objects matching the schema.`;

  const primaryModel = getGeminiModel();
  // Primary model (default gemini-3.8-flash) with fallback to DEFAULT_GEMINI_MODEL and gemini-2.5-flash
  const modelsToTry = Array.from(new Set([primaryModel, DEFAULT_GEMINI_MODEL, 'gemini-2.5-flash']));
  let lastError = null;

  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Gemini returned an empty response.');
      }

      const parsedData = JSON.parse(responseText);
      if (Array.isArray(parsedData)) {
        return parsedData;
      } else if (Array.isArray(parsedData.shots)) {
        return parsedData.shots;
      }
      return [parsedData];
    } catch (err) {
      lastError = err;
      // If it's an API key error or authentication issue, do not retry other models
      if (
        err?.status === 401 ||
        err?.status === 403 ||
        err?.message?.includes('API_KEY_INVALID') ||
        err?.message?.includes('API key not valid')
      ) {
        throw new Error(
          'Your Gemini API key is invalid or has expired. Please verify your key in Settings or generate a new one at Google AI Studio.'
        );
      }
      // If model not found / deprecated (404), continue to next fallback model
      if (
        err?.status === 404 ||
        err?.code === 404 ||
        err?.error?.code === 404 ||
        err?.message?.includes('not found') ||
        err?.message?.includes('NotFound') ||
        err?.message?.includes('NOT_FOUND') ||
        err?.message?.includes('no longer available')
      ) {
        continue;
      }
      // For JSON parsing errors or other errors on valid responses, break
      if (err instanceof SyntaxError) {
        throw new Error(`Failed to parse Gemini response as JSON: ${err.message}`);
      }
    }
  }

  throw lastError || new Error('Failed to generate shots with Gemini.');
}

export default {
  parseScriptToShots,
  getGeminiApiKey,
  getApiKeySource,
  setGeminiApiKey,
  hasGeminiApiKey,
  getGeminiModel,
  MissingApiKeyError,
  GEMINI_API_KEY_STORAGE_KEY,
  GEMINI_MODEL_STORAGE_KEY,
  DEFAULT_GEMINI_MODEL,
};
