// ── Cinematic Shot Type Pre-made Templates ──
export const PREMADE_SHOT_TYPES = [
  'Establishing Wide Shot (EWS)',
  'Extreme Wide Shot (XWS)',
  'Wide Shot (WS / Master)',
  'Full Shot (FS)',
  'Medium Wide Shot (Cowboy)',
  'Medium Shot (MS)',
  'Medium Close-up (MCU)',
  'Close-up (CU)',
  'Extreme Close-up (ECU)',
  'Choker / Macro',
  'Over-the-Shoulder (OTS)',
  'Point of View (POV)',
  'Dutch Angle / Canted',
  'Low Angle Hero Shot',
  'High Angle / Bird\'s Eye',
  'Aerial / Drone Shot',
];

// ── Cinematic Camera Movement Templates ──
export const PREMADE_CAMERA_MOVEMENTS = [
  'Static (Locked-off / Tripod)',
  'Slow Push-in (Dolly In)',
  'Slow Pull-out (Dolly Out)',
  'Pan Left',
  'Pan Right',
  'Tilt Up',
  'Tilt Down',
  'Tracking / Trucking Shot',
  'Steadicam / Gimbal Follow',
  'Handheld (Organic Shaky)',
  'Crane / Jib Vertical Arc',
  'Whip Pan (Fast Snap)',
  '360° Orbital Arc',
  'Vertigo Effect (Dolly Zoom)',
];

// ── Lens Presets (Static Prime vs Conditional Zoom) ──
export const PREMADE_LENSES = [
  { label: '14mm Ultra-Wide (T2.8) — Fisheye / Expansive', focal: '14mm', speed: 'T2.8', type: 'Static (Prime)' },
  { label: '24mm Wide Angle (T1.4) — Environmental Context', focal: '24mm', speed: 'T1.4', type: 'Static (Prime)' },
  { label: '35mm Narrative Standard (T1.3) — Cinematic Normal', focal: '35mm', speed: 'T1.3', type: 'Static (Prime)' },
  { label: '50mm Human Perspective (T1.2) — True-to-Eye', focal: '50mm', speed: 'T1.2', type: 'Static (Prime)' },
  { label: '85mm Portrait / Short Tele (T1.4) — Shallow DOF', focal: '85mm', speed: 'T1.4', type: 'Static (Prime)' },
  { label: '100mm Macro (T2.8) — Extreme Detail', focal: '100mm', speed: 'T2.8', type: 'Static (Prime)' },
  { label: '135mm Telephoto (T2.0) — Compression', focal: '135mm', speed: 'T2.0', type: 'Static (Prime)' },
  { label: '40mm Anamorphic 2x Squeeze (T2.0) — Oval Bokeh', focal: '40mm Anamorphic', speed: 'T2.0', type: 'Static (Prime)' },
  { label: '24-70mm T2.8 Standard Zoom (Conditional)', focal: '24-70mm', speed: 'T2.8', type: 'Conditional (Zoom)' },
  { label: '70-200mm T2.8 Telephoto Zoom (Conditional)', focal: '70-200mm', speed: 'T2.8', type: 'Conditional (Zoom)' },
];

// ── Lighting Setups & Color Temperature Templates ──
export const PREMADE_LIGHTING_STYLES = [
  'Low-Key / Film Noir (Deep shadows, high chiaroscuro)',
  'High-Key (Bright, diffused, low contrast)',
  'Classic 3-Point (Key, Fill, Rim/Hair light)',
  'Rembrandt Lighting (Triangular cheek highlight)',
  'Golden Hour / Natural Backlit (Warm atmospheric flare)',
  'Cyberpunk Neon (Cobalt blue & hot magenta RGB)',
  'Practical Lighting Only (Lamps, monitors, candles)',
  'Diffused Softbox (Window light / overcast day)',
  'Motivated Moonlit Night (Cool 5600K ambient fill)',
  'Hard Direct Spotlight (High-contrast beam / interrogation)',
];

export const PREMADE_COLOR_TEMPS = [
  '3200K (Tungsten Warm)',
  '4300K (Fluorescent Neutral)',
  '5600K (Daylight Cool)',
  '6500K (Cloudy / Sky Fill)',
  'Stylized Neon RGB / Duo-Tone',
];
