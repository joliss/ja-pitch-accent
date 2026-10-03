import assert from 'node:assert/strict';
import test from 'node:test';

import { formatJaPitchAccentFuriganaHtml } from '../src/index.ts';

const count = (html: string, text: string) => html.split(text).length - 1;

test('formats a kana-only word verbatim', () => {
  assert.equal(
    formatJaPitchAccentFuriganaHtml('はし', [1, 0]),
    '<span class="ja-pitch-accent-furigana" data-accents="1,0"><span style="position:relative;">は<i style="position:absolute;pointer-events:none;left:0;right:0;bottom:calc(100% + var(--ja-pitch-accent-furigana-offset, 0.1em));height:0;border-top:var(--ja-pitch-accent-furigana-stroke, max(2px, 0.06em)) solid var(--ja-pitch-accent-furigana-atamadaka-color, #E24B4A);"></i><i style="position:absolute;pointer-events:none;right:0;bottom:100%;width:0;height:calc(var(--ja-pitch-accent-furigana-offset, 0.1em) + var(--ja-pitch-accent-furigana-stroke, max(2px, 0.06em)));border-right:var(--ja-pitch-accent-furigana-stroke, max(2px, 0.06em)) solid var(--ja-pitch-accent-furigana-atamadaka-color, #E24B4A);"></i><i style="position:absolute;pointer-events:none;left:0;right:0;bottom:calc(100% + var(--ja-pitch-accent-furigana-offset, 0.1em) + var(--ja-pitch-accent-furigana-gap, 0.2em));height:0;border-top:var(--ja-pitch-accent-furigana-stroke-alt, max(1.5px, 0.045em)) solid var(--ja-pitch-accent-furigana-heiban-color, #378ADD);"></i></span><span style="position:relative;">し<i style="position:absolute;pointer-events:none;left:0;right:0;bottom:calc(100% + var(--ja-pitch-accent-furigana-offset, 0.1em) + var(--ja-pitch-accent-furigana-gap, 0.2em));height:0;border-top:var(--ja-pitch-accent-furigana-stroke-alt, max(1.5px, 0.045em)) solid var(--ja-pitch-accent-furigana-heiban-color, #378ADD);"></i></span></span>'
  );
});

test('formats a word with furigana verbatim', () => {
  assert.equal(
    formatJaPitchAccentFuriganaHtml('日[ひ]', 0),
    '<span class="ja-pitch-accent-furigana" data-accents="0"><ruby>日<rt style="font-size:50%;line-height:1;user-select:none;-webkit-user-select:none;"><span style="display:inline-block;vertical-align:text-bottom;position:relative;width:2em;height:1em;line-height:1em;text-align:center;">ひ<i style="position:absolute;pointer-events:none;font-size:200%;left:0;right:0;bottom:calc(100% + var(--ja-pitch-accent-furigana-offset, 0.1em));height:0;border-top:var(--ja-pitch-accent-furigana-stroke, max(2px, 0.06em)) solid var(--ja-pitch-accent-furigana-heiban-color, #378ADD);"></i></span></rt></ruby></span>'
  );
});

test('gives kana segments an empty <rt> and draws heiban over every mora', () => {
  const html = formatJaPitchAccentFuriganaHtml('取[と]り 消[け]す', 0);
  assert.equal(count(html, '<ruby>'), 4);
  assert.match(html, /<ruby><span style="position:relative;">り<\/span><rt style="[^"]*" aria-hidden="true"><span style="[^"]*width:2em;[^"]*"><i /);
  assert.equal(count(html, 'border-top:'), 4);
  assert.equal(count(html, 'border-right:'), 0);
});

test('sizes mora boxes by the wider of the base text and the reading', () => {
  // 昨日 is 2 base characters = 4 furigana em, shared by 3 mora
  assert.match(formatJaPitchAccentFuriganaHtml('昨日[きのう]', 2), /width:1\.3333em;/);
  // 客 is 1 base character = 2 furigana em, narrower than きゃく
  const html = formatJaPitchAccentFuriganaHtml('客[きゃく]', 1);
  assert.match(html, /width:2em;[^"]*">きゃ</);
  assert.match(html, /width:1em;[^"]*">く</);
});

test('puts drops on level 0 and heiban above them, with an inset where drops touch', () => {
  const html = formatJaPitchAccentFuriganaHtml('ぱぴぷぺ', [3, 2, 0]);
  assert.equal(count(html, '<ruby>'), 0);
  assert.equal(count(html, 'var(--ja-pitch-accent-furigana-gap, 0.2em));height:0;'), 4);
  assert.equal(count(html, 'left:var(--ja-pitch-accent-furigana-inset, max(3px, 0.075em));'), 1);
  assert.equal(count(html, 'border-right:'), 2);
  // Only the first accent's rail and tick use the primary stroke
  assert.equal(count(html, 'solid var(--ja-pitch-accent-furigana-nakadaka-color, #BA7E17)'), 4);
  assert.equal(count(html, 'var(--ja-pitch-accent-furigana-stroke, max(2px, 0.06em)) solid'), 2);
});

test('puts drops on the base kana when no drop is over furigana', () => {
  const clearance = 'var(--ja-pitch-accent-furigana-clearance, 0.15em)';
  const html = formatJaPitchAccentFuriganaHtml('正[ただ]しい', 3);
  assert.equal(count(html, 'font-size:200%;'), 0);
  // The stub keeps clear of だ on its left, and the tick needs no clearance next to い
  assert.equal(count(html, `">し<i style="position:absolute;pointer-events:none;left:${clearance};right:0;`), 1);
  assert.equal(count(html, 'right:0;bottom:100%;'), 1);

  // Heiban stays on the furigana, and doesn't move up, as the drop is drawn lower
  const withHeiban = formatJaPitchAccentFuriganaHtml('正[ただ]しい', [3, 0]);
  assert.equal(count(withHeiban, 'font-size:200%;'), 4);
  assert.equal(count(withHeiban, 'furigana-gap'), 0);
  assert.equal(count(withHeiban, '<span style="position:relative;">し<i '), 1);

  // The tick keeps clear of き on its right
  const beforeFurigana = formatJaPitchAccentFuriganaHtml('お 客[きゃく]', 1);
  assert.equal(count(beforeFurigana, `left:0;right:${clearance};`), 1);
  assert.equal(count(beforeFurigana, `right:${clearance};bottom:100%;`), 1);
});

test('keeps all drops on the furigana when one of them is over furigana', () => {
  const html = formatJaPitchAccentFuriganaHtml('正[ただ]しい', [2, 3]);
  assert.equal(count(html, 'font-size:200%;'), 4);
  assert.equal(count(html, '<span style="position:relative;">し</span>'), 1);
  assert.equal(count(html, 'furigana-clearance'), 0);
});

test('keeps small kana in the same mora', () => {
  const html = formatJaPitchAccentFuriganaHtml('東京[とうきょう]', 0);
  assert.equal(count(html, 'display:inline-block;'), 4);
  assert.match(html, />きょ</);
});

test('supports options', () => {
  const monochrome = formatJaPitchAccentFuriganaHtml('箸[はし]', 1, { color: false });
  assert.match(monochrome, /solid currentColor;/);
  assert.doesNotMatch(monochrome, /-color, /);
  const scaled = formatJaPitchAccentFuriganaHtml('箸[はし]', 1, { rtScale: 0.6 });
  assert.match(scaled, /<rt style="font-size:60%;/);
  assert.match(scaled, /font-size:166\.6667%;/);
  assert.match(formatJaPitchAccentFuriganaHtml('箸[はし]', [1, 1]), /data-accents="1"/);
  assert.match(formatJaPitchAccentFuriganaHtml('<b>[よみ]', 1), /<ruby>&lt;b&gt;<rt/);
});

test('throws on invalid input', () => {
  assert.throws(() => formatJaPitchAccentFuriganaHtml('箸[はし]', 3), /out of range/);
  assert.throws(() => formatJaPitchAccentFuriganaHtml('箸[はし]', []), /At least one accent/);
  assert.throws(() => formatJaPitchAccentFuriganaHtml('箸', 1), /needs a reading/);
  assert.throws(() => formatJaPitchAccentFuriganaHtml('箸[hashi]', 1), /must be kana/);
  assert.throws(() => formatJaPitchAccentFuriganaHtml('客[きゃく', 1), /closing/);
  assert.throws(() => formatJaPitchAccentFuriganaHtml('[きゃく]', 1), /base text/);
  assert.throws(() => formatJaPitchAccentFuriganaHtml('', 0), /Empty word/);
});
