import assert from 'node:assert/strict';
import test from 'node:test';

import {
  formatJaPitchAccentHtml,
  getJaPitchAccent,
} from '../src/index.ts';

test('looks up a specific spelling and reading', () => {
  assert.deepEqual(getJaPitchAccent('閉める', 'しめる'), [
    {
      accent: 2,
      partOfSpeech: [],
      reading: 'しめる',
      spellings: ['閉める'],
    },
  ]);
});

test('returns multiple accent patterns when they exist', () => {
  assert.deepEqual(getJaPitchAccent('明白', 'あからさま'), [
    {
      accent: 0,
      partOfSpeech: [],
      reading: 'あからさま',
      spellings: ['明白'],
    },
    {
      accent: 3,
      partOfSpeech: [],
      reading: 'あからさま',
      spellings: ['明白'],
    },
  ]);
});

test('normalizes katakana input through hiragana lookup', () => {
  assert.deepEqual(getJaPitchAccent('ティーシャツ'), [
    {
      accent: 0,
      partOfSpeech: [],
      reading: 'ティーシャツ',
      spellings: ['Ｔシャツ'],
    },
  ]);
});

test('formats binary pitch accent html and delegates character rendering', () => {
  const html = formatJaPitchAccentHtml(
    {
      accent: 2,
      reading: 'しめる',
    },
    (character, index) => `<b data-index="${index}">${character}</b>`
  );

  assert.match(html, /class="ja-pitch-accent"/);
  assert.match(
    html,
    /class="ja-pitch-accent-segment ja-pitch-accent-segment-bottom-right"/
  );
  assert.match(html, /--ja-pitch-accent-border-width:1\.5px/);
  assert.match(html, /display:inline-block/);
  assert.match(
    html,
    /border-bottom-width:var\(--ja-pitch-accent-border-width\);border-right-width:var\(--ja-pitch-accent-border-width\);/
  );
  assert.match(
    html,
    /border-top-width:var\(--ja-pitch-accent-border-width\);border-right-width:var\(--ja-pitch-accent-border-width\);/
  );
  assert.match(html, /<b data-index="0">し<\/b>/);
});

test('character callback index is global across pitch segments', () => {
  assert.equal(
    formatJaPitchAccentHtml(
      {
        accent: 2,
        reading: 'しめる',
      },
      (character, index) => `<b data-index="${index}">${character}</b>`
    ),
    '<span class="ja-pitch-accent" style="--ja-pitch-accent-border-width:1.5px;display:inline-block;margin-bottom:0.25rem;"><span class="ja-pitch-accent-segment ja-pitch-accent-segment-bottom-right" style="margin:0;border-style:dotted;border-color:currentColor;border-width:0;border-bottom-width:var(--ja-pitch-accent-border-width);border-right-width:var(--ja-pitch-accent-border-width);"><b data-index="0">し</b></span><span class="ja-pitch-accent-segment ja-pitch-accent-segment-top-right" style="margin:0;border-style:dotted;border-color:currentColor;border-width:0;border-top-width:var(--ja-pitch-accent-border-width);border-right-width:var(--ja-pitch-accent-border-width);"><b data-index="1">め</b></span><span class="ja-pitch-accent-segment ja-pitch-accent-segment-bottom" style="margin:0;border-style:dotted;border-color:currentColor;border-width:0;border-bottom-width:var(--ja-pitch-accent-border-width);"><b data-index="2">る</b></span></span>'
  );
});

test('formats default binary pitch accent html verbatim', () => {
  assert.equal(
    formatJaPitchAccentHtml({
      accent: 2,
      reading: 'しめる',
    }),
    '<span class="ja-pitch-accent" style="--ja-pitch-accent-border-width:1.5px;display:inline-block;margin-bottom:0.25rem;"><span class="ja-pitch-accent-segment ja-pitch-accent-segment-bottom-right" style="margin:0;border-style:dotted;border-color:currentColor;border-width:0;border-bottom-width:var(--ja-pitch-accent-border-width);border-right-width:var(--ja-pitch-accent-border-width);">し</span><span class="ja-pitch-accent-segment ja-pitch-accent-segment-top-right" style="margin:0;border-style:dotted;border-color:currentColor;border-width:0;border-top-width:var(--ja-pitch-accent-border-width);border-right-width:var(--ja-pitch-accent-border-width);">め</span><span class="ja-pitch-accent-segment ja-pitch-accent-segment-bottom" style="margin:0;border-style:dotted;border-color:currentColor;border-width:0;border-bottom-width:var(--ja-pitch-accent-border-width);">る</span></span>'
  );
});
