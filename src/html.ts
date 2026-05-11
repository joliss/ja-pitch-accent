import { countMora, moraSubstring } from "./normal-jp.ts";
import type { CharacterRenderer, JaPitchAccentMatch } from "./types.ts";

const WRAPPER_CLASS_NAME = "ja-pitch-accent";
const SEGMENT_CLASS_NAME = "ja-pitch-accent-segment";
const BORDER_COLOR = "var(--ja-pitch-accent-border-color, currentColor)";
const BORDER_STYLE = "var(--ja-pitch-accent-border-style, dotted)";
const BORDER_WIDTH = "var(--ja-pitch-accent-border-width, 1.5px)";
const DISPLAY = "var(--ja-pitch-accent-display, inline-block)";
const MARGIN_BOTTOM = "var(--ja-pitch-accent-margin-bottom, 0.25rem)";

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderCharacters(text: string, renderCharacter: CharacterRenderer, startIndex: number): string {
  return [...text].map((character, index) => renderCharacter(character, startIndex + index)).join("");
}

function renderSegment(
  text: string,
  renderCharacter: CharacterRenderer,
  startIndex: number,
  extraStyle: string,
  modifierClassName: string,
): string {
  return `<span class="${SEGMENT_CLASS_NAME} ${modifierClassName}" style="margin:0;border-style:${BORDER_STYLE};border-color:${BORDER_COLOR};border-width:0;${extraStyle}">${renderCharacters(text, renderCharacter, startIndex)}</span>`;
}

export function formatJaPitchAccentHtml(
  match: Pick<JaPitchAccentMatch, "accent" | "reading">,
  renderCharacter: CharacterRenderer = (character) => escapeHtml(character),
): string {
  const accent = match.accent;
  const moraCount = countMora(match.reading);
  let characterIndex = 0;

  const renderIndexedSegment = (text: string, extraStyle: string, modifierClassName: string): string => {
    const rendered = renderSegment(text, renderCharacter, characterIndex, extraStyle, modifierClassName);
    characterIndex += [...text].length;
    return rendered;
  };

  if (accent === 0 || accent === 1) {
    const firstSegment =
      accent === 1
        ? {
            modifierClassName: "ja-pitch-accent-segment-top-right",
            style: `border-top-width:${BORDER_WIDTH};border-right-width:${BORDER_WIDTH};`,
          }
        : moraCount > 1
          ? {
              modifierClassName: "ja-pitch-accent-segment-bottom-right",
              style: `border-bottom-width:${BORDER_WIDTH};border-right-width:${BORDER_WIDTH};`,
            }
          : {
              modifierClassName: "ja-pitch-accent-segment-top",
              style: `border-top-width:${BORDER_WIDTH};`,
            };
    const remainderSegment =
      accent === 1
        ? {
            modifierClassName: "ja-pitch-accent-segment-bottom",
            style: `border-bottom-width:${BORDER_WIDTH};`,
          }
        : {
            modifierClassName: "ja-pitch-accent-segment-top",
            style: `border-top-width:${BORDER_WIDTH};`,
          };

    const parts = [
      renderIndexedSegment(moraSubstring(match.reading, 0, 1), firstSegment.style, firstSegment.modifierClassName),
    ];

    if (moraCount > 1) {
      parts.push(
        renderIndexedSegment(
          moraSubstring(match.reading, 1),
          remainderSegment.style,
          remainderSegment.modifierClassName,
        ),
      );
    }

    return `<span class="${WRAPPER_CLASS_NAME}" style="display:${DISPLAY};margin-bottom:${MARGIN_BOTTOM};">${parts.join("")}</span>`;
  }

  const parts = [
    renderIndexedSegment(
      moraSubstring(match.reading, 0, 1),
      `border-bottom-width:${BORDER_WIDTH};border-right-width:${BORDER_WIDTH};`,
      "ja-pitch-accent-segment-bottom-right",
    ),
    renderIndexedSegment(
      moraSubstring(match.reading, 1, accent),
      `border-top-width:${BORDER_WIDTH};border-right-width:${BORDER_WIDTH};`,
      "ja-pitch-accent-segment-top-right",
    ),
  ];

  if (accent < moraCount) {
    parts.push(
      renderIndexedSegment(
        moraSubstring(match.reading, accent),
        `border-bottom-width:${BORDER_WIDTH};`,
        "ja-pitch-accent-segment-bottom",
      ),
    );
  }

  return `<span class="${WRAPPER_CLASS_NAME}" style="display:${DISPLAY};margin-bottom:${MARGIN_BOTTOM};">${parts.join("")}</span>`;
}
