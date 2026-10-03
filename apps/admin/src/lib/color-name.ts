import namer from "color-namer";

/** Closest CSS colour name for a "#rrggbb" hex, e.g. "#e84545" → "Crimson". */
export function colorNameFromHex(hex: string): string {
  const name = namer(hex, { pick: ["html"] }).html[0]?.name ?? hex;
  return name.charAt(0).toUpperCase() + name.slice(1);
}
