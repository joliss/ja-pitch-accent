import { escapeHtml } from "./html.ts";
import { countMora, moraSubstring } from "./normal-jp.ts";
import type { FuriganaHtmlOptions } from "./types.ts";

type AccentKind = "heiban" | "atamadaka" | "nakadaka" | "odaka";

interface FuriganaSegment {
  base: string;
  reading?: string;
}

// A line over the mora range from..to (inclusive), plus a drop tick at the right edge of mora `tick` (-1 for none).
// `onBase` marks are drawn over the base text, and the others over the furigana.
interface Mark {
  kind: AccentKind;
  primary: boolean;
  onBase: boolean;
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
const CLEARANCE = "var(--ja-pitch-accent-furigana-clearance, 0.15em)";
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
// heiban moves up to level 1 when a drop is drawn at the same height. The first accent is the primary one and is drawn
// with a slightly thicker line.
//
// Marks normally sit on the furigana. But when no drop is over furigana, as in 正[ただ]しい with accent 3, the drops sit
// on the base kana instead, so that they don't float high above them.
function planMarks(hasFurigana: Array<boolean>, accents: Array<number>): Array<Mark> {
  const moraCount = hasFurigana.length;
  const drops = accents.filter((accent) => accent > 0);
  const dropsOnBase = drops.every((accent) => !hasFurigana[accent - 1]);
  const heibanOnBase = !hasFurigana.includes(true);
  const heibanLevel = drops.length > 0 && dropsOnBase === heibanOnBase ? 1 : 0;
  return accents.map((accent, index) =>
    accent > 0
      ? {
          kind: accentKind(moraCount, accent),
          primary: index === 0,
          onBase: dropsOnBase,
          level: 0,
          from: accent - 1,
          to: accent - 1,
          tick: accent - 1,
        }
      : {
          kind: "heiban",
          primary: index === 0,
          onBase: heibanOnBase,
          level: heibanLevel,
          from: 0,
          to: moraCount - 1,
          tick: -1,
        },
  );
}

// Marks are absolutely positioned against their mora's box and take no layout space. Their font size is reset to the
// word's font size (from the smaller furigana size inside <rt>), so that em lengths always refer to the word. Marks on
// the base text sit at the same height as the furigana next to them, so their ends keep clear of it.
function renderMarks(
  marks: Array<Mark>,
  hasFurigana: Array<boolean>,
  moraIndex: number,
  color: boolean,
  fontSizeStyle: string,
): string {
  let html = "";
  for (const mark of marks) {
    const strokeWidth = mark.primary ? STROKE : STROKE_ALT;
    const border = `${strokeWidth} solid ${color ? COLORS[mark.kind] : "currentColor"}`;
    const height = mark.level === 0 ? OFFSET : `${OFFSET} + ${GAP}`;
    const style = `position:absolute;pointer-events:none;${fontSizeStyle}`;
    const clearLeft = mark.onBase && hasFurigana[mark.from - 1] === true;
    const clearRight = mark.onBase && hasFurigana[mark.to + 1] === true;
    if (moraIndex >= mark.from && moraIndex <= mark.to) {
      // Leave a small gap where this mark starts right after another mark on the same level
      const inset =
        moraIndex === mark.from &&
        marks.some(
          (other) =>
            other !== mark && other.level === mark.level && moraIndex - 1 >= other.from && moraIndex - 1 <= other.to,
        );
      const left = moraIndex === mark.from && clearLeft ? CLEARANCE : inset ? INSET : 0;
      const right = moraIndex === mark.to && clearRight ? CLEARANCE : 0;
      html += `<i style="${style}left:${left};right:${right};bottom:calc(100% + ${height});height:0;border-top:${border};"></i>`;
    }
    if (mark.tick === moraIndex) {
      html += `<i style="${style}right:${clearRight ? CLEARANCE : 0};bottom:100%;width:0;height:calc(${height} + ${strokeWidth});border-right:${border};"></i>`;
    }
  }
  return html;
}

export function formatJaPitchAccentFuriganaHtml(
  word: string,
  accents: number | Array<number>,
  options: FuriganaHtmlOptions = {},
): string {
  const { color = true, rtScale = 0.5 } = options;
  const segments = parseFurigana(word);
  if (segments.length === 0) throw new Error("Empty word");
  for (const segment of segments) {
    if (segment.reading !== undefined && !KANA_RE.test(segment.reading)) {
      throw new Error(`Reading for "${segment.base}" must be kana: "${segment.reading}"`);
    }
    if (segment.reading === undefined && !KANA_RE.test(segment.base)) {
      throw new Error(`"${segment.base}" needs a reading, e.g. ${segment.base}[よみ]`);
    }
  }
  const hasFurigana = segments.flatMap((segment) =>
    splitMora(segment.reading ?? segment.base).map(() => segment.reading !== undefined),
  );
  const moraCount = hasFurigana.length;
  const uniqueAccents = [...new Set(typeof accents === "number" ? [accents] : accents)];
  if (uniqueAccents.length === 0) throw new Error("At least one accent is required");
  for (const accent of uniqueAccents) {
    if (!Number.isInteger(accent) || accent < 0 || accent > moraCount) {
      throw new Error(`Accent ${accent} is out of range 0..${moraCount}`);
    }
  }

  const marks = planMarks(hasFurigana, uniqueAccents);
  const baseMarks = marks.filter((mark) => mark.onBase);
  const rtMarks = marks.filter((mark) => !mark.onBase);
  const renderBaseMora = (mora: string, index: number, style = "") =>
    `<span style="position:relative;${style}">${escapeHtml(mora)}${renderMarks(baseMarks, hasFurigana, index, color, "")}</span>`;
  const open = `<span class="${WRAPPER_CLASS_NAME}" data-accents="${uniqueAccents.join(",")}">`;
  let moraIndex = 0;
  let html = "";

  // Without kanji, the marks sit directly on the kana, and there is no <ruby>. Each mora is an inline-block with
  // line-height 1, like the furigana's boxes below, so that the marks sit at the same height above the kana in any
  // font. An inline box would reach up to the font's ascent, which in some fonts is well above the kana (1.16em in
  // Noto Sans JP, whose kana reach about 0.8em).
  if (segments.every((segment) => segment.reading === undefined)) {
    for (const mora of splitMora(segments.map((segment) => segment.base).join(""))) {
      html += renderBaseMora(mora, moraIndex++, "display:inline-block;line-height:1;");
    }
    return `${open}${html}</span>`;
  }

  // With kanji, most marks sit on the furigana (see planMarks). Each mora is a fixed-width box inside <rt>. Kana
  // without furigana (such as okurigana) get an empty <rt>, so that their marks line up too. The widths assume
  // full-width glyphs: a base character is 1em, and a furigana character is rtScale em. The boxes use
  // vertical-align:text-bottom because with vertical-align:bottom, Firefox pushes the furigana down into the base text.
  const rtStyle = `font-size:${formatNumber(rtScale * 100)}%;line-height:1;user-select:none;-webkit-user-select:none;`;
  const markFontSizeStyle = `font-size:${formatNumber(100 / rtScale)}%;`;
  for (const segment of segments) {
    const isKana = segment.reading === undefined;
    const text = segment.reading ?? segment.base;
    const characterCount = [...text].length;
    // Segment width in furigana em
    const width = Math.max(isKana ? 0 : characterCount, [...segment.base].length / rtScale);
    let base = isKana ? "" : escapeHtml(segment.base);
    let rt = "";
    for (const mora of splitMora(text)) {
      const moraWidth = formatNumber((width * [...mora].length) / characterCount);
      if (isKana) base += renderBaseMora(mora, moraIndex);
      rt += `<span style="display:inline-block;vertical-align:text-bottom;position:relative;width:${moraWidth}em;height:1em;line-height:1em;text-align:center;">${isKana ? "" : escapeHtml(mora)}${renderMarks(rtMarks, hasFurigana, moraIndex, color, markFontSizeStyle)}</span>`;
      moraIndex++;
    }
    html += `<ruby>${base}<rt style="${rtStyle}"${isKana ? ' aria-hidden="true"' : ""}>${rt}</rt></ruby>`;
  }
  return `${open}${html}</span>`;
}
