export type DecimalSeparator = '.' | ',';

export interface ParsedToken {
  text: string;
  /** Offset of the token in the original text. */
  start: number;
  /** 1-based position among all tokens. */
  position: number;
  value: number | null;
}

export interface ParseResult {
  values: number[];
  tokens: ParsedToken[];
  invalid: ParsedToken[];
}

/**
 * Splits pasted data into numbers.
 * - Decimal ".": separators are whitespace, newlines, tabs, ";" and ",".
 * - Decimal ",": separators are whitespace, newlines, tabs and ";" only.
 * Invalid tokens are reported with their position, never dropped silently.
 */
export function parseData(text: string, decimal: DecimalSeparator): ParseResult {
  const sep = decimal === '.' ? /[\s;,]+/g : /[\s;]+/g;
  const d = decimal === '.' ? '\\.' : ',';
  const numberRe = new RegExp(`^[+-]?(\\d+(${d}\\d*)?|${d}\\d+)([eE][+-]?\\d+)?$`);

  const tokens: ParsedToken[] = [];
  let last = 0;
  const push = (raw: string, start: number) => {
    if (!raw) return;
    // Accept the Unicode minus sign that some keyboards and PDFs produce.
    const normalized = raw.replace(/[−–]/g, '-');
    const ok = numberRe.test(normalized);
    const value = ok ? Number(decimal === ',' ? normalized.replace(',', '.') : normalized) : null;
    tokens.push({ text: raw, start, position: tokens.length + 1, value: ok && isFinite(value!) ? value : null });
  };

  sep.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = sep.exec(text)) !== null) {
    push(text.slice(last, m.index), last);
    last = m.index + m[0].length;
  }
  push(text.slice(last), last);

  const values = tokens.filter((t) => t.value !== null).map((t) => t.value as number);
  const invalid = tokens.filter((t) => t.value === null);
  return { values, tokens, invalid };
}

/** "," when the device locale writes 1,5; otherwise ".". */
export function defaultDecimalSeparator(): DecimalSeparator {
  try {
    const parts = new Intl.NumberFormat().formatToParts(1.5);
    const dec = parts.find((p) => p.type === 'decimal')?.value;
    return dec === ',' ? ',' : '.';
  } catch {
    return '.';
  }
}
