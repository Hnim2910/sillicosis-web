/** Wrap text to the measured width, including long words and explicit paragraph breaks. */
export function wrapText(text: string, measure: (value: string) => number, maxWidth: number) {
  const lines: string[] = [];
  for (const paragraph of text.split(/\r?\n/)) {
    let current = "";
    for (const word of paragraph.trim().split(/\s+/).filter(Boolean)) {
      const candidate = current ? `${current} ${word}` : word;
      if (measure(candidate) <= maxWidth) {
        current = candidate;
        continue;
      }
      if (current) lines.push(current);
      current = "";
      for (const character of word) {
        if (current && measure(current + character) > maxWidth) {
          lines.push(current);
          current = "";
        }
        current += character;
      }
    }
    lines.push(current);
  }
  return lines;
}
