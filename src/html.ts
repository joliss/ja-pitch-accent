import { countMora, moraSubstring } from "./normal-jp.ts";
import type { CharacterRenderer, JaPitchAccentMatch } from "./types.ts";

const WRAPPER_CLASS_NAME = "ja-pitch-accent";
const SEGMENT_CLASS_NAME = "ja-pitch-accent-segment";
const BORDER_WIDTH_VARIABLE_NAME = "--ja-pitch-accent-border-width";
const DEFAULT_BORDER_WIDTH = "1.5px";

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
  return `<span class="${SEGMENT_CLASS_NAME} ${modifierClassName}" style="margin:0;border-style:dotted;border-color:currentColor;border-width:0;${extraStyle}">${renderCharacters(text, renderCharacter, startIndex)}</span>`;
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
            style: `border-top-width:var(${BORDER_WIDTH_VARIABLE_NAME});border-right-width:var(${BORDER_WIDTH_VARIABLE_NAME});`,
          }
        : moraCount > 1
          ? {
              modifierClassName: "ja-pitch-accent-segment-bottom-right",
              style: `border-bottom-width:var(${BORDER_WIDTH_VARIABLE_NAME});border-right-width:var(${BORDER_WIDTH_VARIABLE_NAME});`,
            }
          : {
              modifierClassName: "ja-pitch-accent-segment-top",
              style: `border-top-width:var(${BORDER_WIDTH_VARIABLE_NAME});`,
            };
    const remainderSegment =
      accent === 1
        ? {
            modifierClassName: "ja-pitch-accent-segment-bottom",
            style: `border-bottom-width:var(${BORDER_WIDTH_VARIABLE_NAME});`,
          }
        : {
            modifierClassName: "ja-pitch-accent-segment-top",
            style: `border-top-width:var(${BORDER_WIDTH_VARIABLE_NAME});`,
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

    return `<span class="${WRAPPER_CLASS_NAME}" style="${BORDER_WIDTH_VARIABLE_NAME}:${DEFAULT_BORDER_WIDTH};display:inline-block;margin-bottom:0.25rem;">${parts.join("")}</span>`;
  }

  const parts = [
    renderIndexedSegment(
      moraSubstring(match.reading, 0, 1),
      `border-bottom-width:var(${BORDER_WIDTH_VARIABLE_NAME});border-right-width:var(${BORDER_WIDTH_VARIABLE_NAME});`,
      "ja-pitch-accent-segment-bottom-right",
    ),
    renderIndexedSegment(
      moraSubstring(match.reading, 1, accent),
      `border-top-width:var(${BORDER_WIDTH_VARIABLE_NAME});border-right-width:var(${BORDER_WIDTH_VARIABLE_NAME});`,
      "ja-pitch-accent-segment-top-right",
    ),
  ];

  if (accent < moraCount) {
    parts.push(
      renderIndexedSegment(
        moraSubstring(match.reading, accent),
        `border-bottom-width:var(${BORDER_WIDTH_VARIABLE_NAME});`,
        "ja-pitch-accent-segment-bottom",
      ),
    );
  }

  return `<span class="${WRAPPER_CLASS_NAME}" style="${BORDER_WIDTH_VARIABLE_NAME}:${DEFAULT_BORDER_WIDTH};display:inline-block;margin-bottom:0.25rem;">${parts.join("")}</span>`;
}
