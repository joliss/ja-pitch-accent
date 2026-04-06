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
  renderCharacter: CharacterRenderer
): string {
  return [...text]
    .map((character, index) => renderCharacter(character, index))
    .join('');
}

function renderSegment(
  text: string,
  renderCharacter: CharacterRenderer,
  extraStyle: string
): string {
  return `<span style="margin:0;font-size:90%;border-style:dotted;border-color:currentColor;border-width:0;${extraStyle}">${renderCharacters(text, renderCharacter)}</span>`;
}

export function formatJaPitchAccentHtml(
  match: Pick<JaPitchAccentMatch, 'accent' | 'reading'>,
  renderCharacter: CharacterRenderer = (character) => escapeHtml(character)
): string {
  const accent = match.accent;
  const moraCount = countMora(match.reading);

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
      renderSegment(
        moraSubstring(match.reading, 0, 1),
        renderCharacter,
        firstSegmentStyle
      ),
    ];

    if (moraCount > 1) {
      parts.push(
        renderSegment(
          moraSubstring(match.reading, 1),
          renderCharacter,
          remainderStyle
        )
      );
    }

    return `<span style="display:inline-block;margin-bottom:0.25rem;">${parts.join('')}</span>`;
  }

  const parts = [
    renderSegment(
      moraSubstring(match.reading, 0, 1),
      renderCharacter,
      'border-bottom-width:1.5px;border-right-width:1.5px;'
    ),
    renderSegment(
      moraSubstring(match.reading, 1, accent),
      renderCharacter,
      'border-top-width:1.5px;border-right-width:1.5px;'
    ),
  ];

  if (accent < moraCount) {
    parts.push(
      renderSegment(
        moraSubstring(match.reading, accent),
        renderCharacter,
        'border-bottom-width:1.5px;'
      )
    );
  }

  return `<span style="display:inline-block;margin-bottom:0.25rem;">${parts.join('')}</span>`;
}
