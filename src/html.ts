import { countMora, moraSubstring } from './normal-jp.ts';
import type { CharacterRenderer, JaPitchAccentMatch } from './types.ts';

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderCharacters(
  text: string,
  renderCharacter: CharacterRenderer,
  startIndex: number
): string {
  return [...text]
    .map((character, index) => renderCharacter(character, startIndex + index))
    .join('');
}

function renderSegment(
  text: string,
  renderCharacter: CharacterRenderer,
  startIndex: number,
  extraStyle: string
): string {
  return `<span style="margin:0;border-style:dotted;border-color:currentColor;border-width:0;${extraStyle}">${renderCharacters(text, renderCharacter, startIndex)}</span>`;
}

export function formatJaPitchAccentHtml(
  match: Pick<JaPitchAccentMatch, 'accent' | 'reading'>,
  renderCharacter: CharacterRenderer = (character) => escapeHtml(character)
): string {
  const accent = match.accent;
  const moraCount = countMora(match.reading);
  let characterIndex = 0;

  const renderIndexedSegment = (text: string, extraStyle: string): string => {
    const rendered = renderSegment(
      text,
      renderCharacter,
      characterIndex,
      extraStyle
    );
    characterIndex += [...text].length;
    return rendered;
  };

  if (accent === 0 || accent === 1) {
    const firstSegmentStyle =
      accent === 1
        ? 'border-top-width:1.5px;border-right-width:1.5px;'
        : moraCount > 1
          ? 'border-bottom-width:1.5px;border-right-width:1.5px;'
          : 'border-top-width:1.5px;';
    const remainderStyle =
      accent === 1 ? 'border-bottom-width:1.5px;' : 'border-top-width:1.5px;';

    const parts = [
      renderIndexedSegment(
        moraSubstring(match.reading, 0, 1),
        firstSegmentStyle
      ),
    ];

    if (moraCount > 1) {
      parts.push(
        renderIndexedSegment(
          moraSubstring(match.reading, 1),
          remainderStyle
        )
      );
    }

    return `<span style="display:inline-block;margin-bottom:0.25rem;">${parts.join('')}</span>`;
  }

  const parts = [
    renderIndexedSegment(
      moraSubstring(match.reading, 0, 1),
      'border-bottom-width:1.5px;border-right-width:1.5px;'
    ),
    renderIndexedSegment(
      moraSubstring(match.reading, 1, accent),
      'border-top-width:1.5px;border-right-width:1.5px;'
    ),
  ];

  if (accent < moraCount) {
    parts.push(
      renderIndexedSegment(
        moraSubstring(match.reading, accent),
        'border-bottom-width:1.5px;'
      )
    );
  }

  return `<span style="display:inline-block;margin-bottom:0.25rem;">${parts.join('')}</span>`;
}
