// Copied from @birchill/normal-jp, which is used by 10ten Japanese Reader.

const SKIP_FOR_MORA_COUNT = [
  12353, 12355, 12357, 12359, 12361, 12419, 12421, 12423, 12430,
  12449, 12451, 12453, 12455, 12457, 12515, 12517, 12519, 12526,
];

export function kanaToHiragana(input: string): string {
  let result = '';

  for (const character of input) {
    let codePoint = character.codePointAt(0)!;

    if (
      (codePoint >= 12449 && codePoint <= 12534) ||
      codePoint === 12541 ||
      codePoint === 12542
    ) {
      codePoint -= 96;
    }

    result += String.fromCodePoint(codePoint);
  }

  return result;
}

export function countMora(text: string): number {
  return [...text].filter(
    (character, index) =>
      index === 0 || !SKIP_FOR_MORA_COUNT.includes(character.codePointAt(0)!)
  ).length;
}

export function moraSubstring(
  input: string,
  startIndex: number,
  endIndex?: number
): string {
  let start = Math.max(0, startIndex);
  let end = typeof endIndex === 'number' ? Math.max(0, endIndex) : undefined;
  const moraLength = countMora(input);

  start = Math.min(start, moraLength);
  if (typeof end === 'number') {
    end = Math.min(end, moraLength);
  }

  if (start === end) {
    return '';
  }

  if (typeof end === 'number' && start > end) {
    [start, end] = [end, start];
  }

  let moraIndex = 0;
  let characterStart = input.length;
  let characterEnd: number | undefined;

  for (let index = 0; index < input.length; index++, moraIndex++) {
    if (moraIndex === start) {
      characterStart = index;
      if (typeof end === 'undefined') {
        break;
      }
    }

    if (moraIndex === end) {
      characterEnd = index;
      break;
    }

    if (
      index < input.length - 1 &&
      SKIP_FOR_MORA_COUNT.includes(input.codePointAt(index + 1)!)
    ) {
      index++;
    }
  }

  return input.substring(characterStart, characterEnd);
}
