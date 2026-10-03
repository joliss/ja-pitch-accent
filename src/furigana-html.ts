import { escapeHtml } from "./html.ts";
import { countMora, moraSubstring } from "./normal-jp.ts";
import type { FuriganaHtmlOptions, FuriganaSegment } from "./types.ts";

type AccentKind = "heiban" | "atamadaka" | "nakadaka" | "odaka";

// A line over the mora range from..to (inclusive), plus a drop tick at the right edge of mora `tick` (-1 for none).
interface Mark {
  kind: AccentKind;
  primary: boolean;
  level: number;
  from: number;
  to: number;
  tick: number;
}

const WRAPPER_CLASS_NAME = "ja-pitch-accent-furigana";
const KANA_RE = /^[ぁ-ゖァ-ヺー]+$/;
const OFFSET = "var(--ja-pitch-accent-furigana-offset, 0.1em)";
const GAP = "var(--ja-pitch-accent-furigana-gap, 0.2em)";
const STROKE = "var(--ja-pitch-accent-furigana-stroke, max(2px, 0.06em))";
const STROKE_ALT = "var(--ja-pitch-accent-furigana-stroke-alt, max(1.5px, 0.045em))";
const INSET = "var(--ja-pitch-accent-furigana-inset, max(3px, 0.075em))";
const COLORS: Record<AccentKind, string> = {
  heiban: "var(--ja-pitch-accent-furigana-heiban-color, #378ADD)",
  atamadaka: "var(--ja-pitch-accent-furigana-atamadaka-color, #E24B4A)",
  nakadaka: "var(--ja-pitch-accent-furigana-nakadaka-color, #BA7E17)",
  odaka: "var(--ja-pitch-accent-furigana-odaka-color, #639922)",
};

function formatNumber(value: number): string {
  return String(Number(value.toFixed(4)));
}

function splitMora(kana: string): Array<string> {
  return Array.from({ length: countMora(kana) }, (_, index) => moraSubstring(kana, index, index + 1));
}

function accentKind(moraCount: number, accent: number): AccentKind {
  if (accent === 0) return "heiban";
  if (accent === 1) return "atamadaka";
  return accent === moraCount ? "odaka" : "nakadaka";
}

// Parses Anki-style furigana. A [reading] applies to the text since the previous space or ].
// 'お 客[きゃく]様[さま]' -> [{ base: 'お' }, { base: '客', reading: 'きゃく' }, { base: '様', reading: 'さま' }]
function parseFurigana(text: string): Array<FuriganaSegment> {
  const segments: Array<FuriganaSegment> = [];
  let buffer = "";
  for (let index = 0; index < text.length; index++) {
    const character = text[index]!;
    if (character === "[") {
      const end = text.indexOf("]", index);
      if (end < 0) throw new Error(`Missing a closing ] in "${text}"`);
      if (!buffer) throw new Error(`A [reading] needs base text before it in "${text}"`);
      segments.push({ base: buffer, reading: text.slice(index + 1, end).trim() });
      buffer = "";
      index = end;
    } else if (/\s/.test(character)) {
      if (buffer) segments.push({ base: buffer });
      buffer = "";
    } else {
      buffer += character;
    }
  }
  if (buffer) segments.push({ base: buffer });
  return segments;
}

// A drop accent is a short stub over the accented mora with a drop tick at its right edge. The rise before the drop is
// predictable, so it isn't drawn. Heiban is a line over the whole word. All drops share level 0, closest to the text;
// heiban moves up to level 1 when the word also has a drop accent. The first accent is the primary one and is drawn
// with a slightly thicker line.
function planMarks(moraCount: number, accents: Array<number>): Array<Mark> {
  const hasDrop = accents.some((accent) => accent > 0);
  return accents.map((accent, index) =>
    accent > 0
      ? {
          kind: accentKind(moraCount, accent),
          primary: index === 0,
          level: 0,
          from: accent - 1,
          to: accent - 1,
          tick: accent - 1,
        }
      : { kind: "heiban", primary: index === 0, level: hasDrop ? 1 : 0, from: 0, to: moraCount - 1, tick: -1 },
  );
}

// Marks are absolutely positioned against their mora's box and take no layout space. Their font size is reset to the
// word's font size (from the smaller furigana size inside <rt>), so that em lengths always refer to the word.
function renderMarks(marks: Array<Mark>, moraIndex: number, color: boolean, fontSizeStyle: string): string {
  let html = "";
  for (const mark of marks) {
    const strokeWidth = mark.primary ? STROKE : STROKE_ALT;
    const border = `${strokeWidth} solid ${color ? COLORS[mark.kind] : "currentColor"}`;
    const height = mark.level === 0 ? OFFSET : `${OFFSET} + ${GAP}`;
    const style = `position:absolute;pointer-events:none;${fontSizeStyle}`;
    if (moraIndex >= mark.from && moraIndex <= mark.to) {
      // Leave a small gap where this mark starts right after another mark on the same level
      const inset =
        moraIndex === mark.from &&
        marks.some(
          (other) =>
            other !== mark && other.level === mark.level && moraIndex - 1 >= other.from && moraIndex - 1 <= other.to,
        );
      html += `<i style="${style}left:${inset ? INSET : 0};right:0;bottom:calc(100% + ${height});height:0;border-top:${border};"></i>`;
    }
    if (mark.tick === moraIndex) {
      html += `<i style="${style}right:0;bottom:100%;width:0;height:calc(${height} + ${strokeWidth});border-right:${border};"></i>`;
    }
  }
  return html;
}

export function formatJaPitchAccentFuriganaHtml(
  word: string | Array<FuriganaSegment>,
  accents: number | Array<number>,
  options: FuriganaHtmlOptions = {},
): string {
  const { color = true, rtScale = 0.5 } = options;
  const segments = typeof word === "string" ? parseFurigana(word) : word;
  if (segments.length === 0) throw new Error("Empty word");
  for (const segment of segments) {
    if (segment.reading !== undefined && !KANA_RE.test(segment.reading)) {
      throw new Error(`Reading for "${segment.base}" must be kana: "${segment.reading}"`);
    }
    if (segment.reading === undefined && !KANA_RE.test(segment.base)) {
      throw new Error(`"${segment.base}" needs a reading, e.g. ${segment.base}[よみ]`);
    }
  }
  const moraCount = segments.reduce((total, segment) => total + countMora(segment.reading ?? segment.base), 0);
  const uniqueAccents = [...new Set(typeof accents === "number" ? [accents] : accents)];
  if (uniqueAccents.length === 0) throw new Error("At least one accent is required");
  for (const accent of uniqueAccents) {
    if (!Number.isInteger(accent) || accent < 0 || accent > moraCount) {
      throw new Error(`Accent ${accent} is out of range 0..${moraCount}`);
    }
  }

  const marks = planMarks(moraCount, uniqueAccents);
  const open = `<span class="${WRAPPER_CLASS_NAME}" data-accents="${uniqueAccents.join(",")}">`;
  let moraIndex = 0;
  let html = "";

  // Without kanji, the marks sit directly on the kana, and there is no <ruby>.
  if (segments.every((segment) => segment.reading === undefined)) {
    for (const mora of splitMora(segments.map((segment) => segment.base).join(""))) {
      html += `<span style="position:relative;">${escapeHtml(mora)}${renderMarks(marks, moraIndex++, color, "")}</span>`;
    }
    return `${open}${html}</span>`;
  }

  // With kanji, the marks sit on the furigana. Each mora is a fixed-width box inside <rt>. Kana without furigana (such
  // as okurigana) get an empty <rt>, so that their marks line up too. The widths assume full-width glyphs: a base
  // character is 1em, and a furigana character is rtScale em. The boxes use vertical-align:text-bottom because with
  // vertical-align:bottom, Firefox pushes the furigana down into the base text.
  const rtStyle = `font-size:${formatNumber(rtScale * 100)}%;line-height:1;user-select:none;-webkit-user-select:none;`;
  const markFontSizeStyle = `font-size:${formatNumber(100 / rtScale)}%;`;
  for (const segment of segments) {
    const isKana = segment.reading === undefined;
    const text = segment.reading ?? segment.base;
    const characterCount = [...text].length;
    // Segment width in furigana em
    const width = Math.max(isKana ? 0 : characterCount, [...segment.base].length / rtScale);
    let rt = "";
    for (const mora of splitMora(text)) {
      const moraWidth = formatNumber((width * [...mora].length) / characterCount);
      rt += `<span style="display:inline-block;vertical-align:text-bottom;position:relative;width:${moraWidth}em;height:1em;line-height:1em;text-align:center;">${isKana ? "" : escapeHtml(mora)}${renderMarks(marks, moraIndex++, color, markFontSizeStyle)}</span>`;
    }
    html += `<ruby>${escapeHtml(segment.base)}<rt style="${rtStyle}"${isKana ? ' aria-hidden="true"' : ""}>${rt}</rt></ruby>`;
  }
  return `${open}${html}</span>`;
}
