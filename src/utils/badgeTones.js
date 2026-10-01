/**
 * Translucent backgrounds for status badges.
 * Dynamically mixes CSS variables, HEX, RGB, and HSL colors with transparency.
 */
const FALLBACK_BACKGROUND = "rgba(107, 114, 128, 0.13)";

export function toneBackground(color, alphaHex = "22", percentage = "13%") {
  if (!color || typeof color !== "string") return FALLBACK_BACKGROUND;

  const trimmed = color.trim();
  if (!trimmed) return FALLBACK_BACKGROUND;

  // 6-digit Hex
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) {
    return `${trimmed}${alphaHex}`;
  }

  // 3-digit Hex
  if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
    const [r, g, b] = [trimmed[1], trimmed[2], trimmed[3]];
    return `#${r}${r}${g}${g}${b}${b}${alphaHex}`;
  }

  // CSS variables, rgb(), hsl(), or named colors -> blend dynamically
  if (trimmed.startsWith("var(") || trimmed.startsWith("rgb") || trimmed.startsWith("hsl")) {
    return `color-mix(in srgb, ${trimmed} ${percentage}, transparent)`;
  }

  return `color-mix(in srgb, ${trimmed} ${percentage}, transparent)`;
}

export default toneBackground;
