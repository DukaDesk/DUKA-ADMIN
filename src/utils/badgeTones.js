/**
 * Translucent backgrounds for status badges.
 *
 * Never concatenate alpha onto a color string (`color + "22"`): that only
 * works for 6-digit hex and produces invalid CSS like `var(--amber)22`
 * when the palette uses CSS variables. Dynamic values (CSS variables,
 * rgb()/hsl()) go through `color-mix()` so theme switches adapt the
 * background automatically instead of freezing a hardcoded snapshot.
 */

const FALLBACK_BACKGROUND = "rgba(107, 114, 128, 0.13)";

export function toneBackground(color, alphaHex = "22", percentage = "13%") {
  if (!color) return FALLBACK_BACKGROUND;

  // CSS variables (e.g. var(--amber)) — adapt to theme switches automatically.
  if (color.startsWith("var(")) {
    return `color-mix(in srgb, ${color} ${percentage}, transparent)`;
  }

  // 6-digit hex — an appended alpha channel is valid CSS.
  if (/^#[0-9a-fA-F]{6}$/.test(color)) {
    return `${color}${alphaHex}`;
  }

  // 3-digit hex — expand before appending alpha.
  if (/^#[0-9a-fA-F]{3}$/.test(color)) {
    const [r, g, b] = [color[1], color[2], color[3]];
    return `#${r}${r}${g}${g}${b}${b}${alphaHex}`;
  }

  // rgb()/hsl()/named colors and anything else — blend dynamically.
  return `color-mix(in srgb, ${color} ${percentage}, transparent)`;
}

export default toneBackground;
