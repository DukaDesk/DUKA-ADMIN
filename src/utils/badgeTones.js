/**
 * Safe translucent backgrounds for status badges.
 *
 * Never concatenate alpha onto a color string (`color + "22"`): that only
 * works for 6-digit hex and produces invalid CSS like `var(--amber)22`
 * when the palette uses CSS variables. This map resolves our known
 * palette tokens to rgba() equivalents and falls back safely.
 */

const TONE_BACKGROUNDS = {
  "var(--amber)": "rgba(244, 160, 38, 0.13)",
  "var(--green)": "rgba(46, 204, 113, 0.13)",
  "var(--red)": "rgba(231, 76, 60, 0.13)",
  "var(--blue)": "rgba(59, 130, 246, 0.13)",
  "var(--teal)": "rgba(13, 148, 136, 0.13)",
  "var(--purple)": "rgba(124, 58, 237, 0.13)",
  "var(--orange)": "rgba(245, 158, 11, 0.13)",
  "var(--cyan)": "rgba(6, 182, 212, 0.13)",
  "var(--indigo)": "rgba(99, 102, 241, 0.13)",
  "var(--gray-100)": "rgba(243, 244, 246, 0.9)",
  "var(--gray-200)": "rgba(229, 231, 235, 0.6)",
  "var(--gray-400)": "rgba(156, 163, 175, 0.18)",
  "var(--gray-500)": "rgba(107, 114, 128, 0.13)",
};

const FALLBACK_BACKGROUND = "rgba(107, 114, 128, 0.13)";

export function toneBackground(color, fallback = FALLBACK_BACKGROUND) {
  if (!color) return fallback;
  if (TONE_BACKGROUNDS[color]) return TONE_BACKGROUNDS[color];
  // Only raw hex strings can safely take an appended alpha channel.
  if (/^#[0-9a-fA-F]{6}$/.test(color)) return `${color}22`;
  if (/^#[0-9a-fA-F]{3}$/.test(color)) {
    const [r, g, b] = [color[1], color[2], color[3]];
    return `#${r}${r}${g}${g}${b}${b}22`;
  }
  return fallback;
}

export default toneBackground;
