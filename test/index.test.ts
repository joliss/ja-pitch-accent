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

  assert.match(html, /display:inline-block/);
  assert.match(html, /border-bottom-width:1\.5px;border-right-width:1\.5px/);
  assert.match(html, /border-top-width:1\.5px;border-right-width:1\.5px/);
  assert.match(html, /<b data-index="0">し<\/b>/);
});

test('formats default binary pitch accent html verbatim', () => {
  assert.equal(
    formatJaPitchAccentHtml({
      accent: 2,
      reading: 'しめる',
    }),
    '<span style="display:inline-block;margin-bottom:0.25rem;"><span style="margin:0;border-style:dotted;border-color:currentColor;border-width:0;border-bottom-width:1.5px;border-right-width:1.5px;">し</span><span style="margin:0;border-style:dotted;border-color:currentColor;border-width:0;border-top-width:1.5px;border-right-width:1.5px;">め</span><span style="margin:0;border-style:dotted;border-color:currentColor;border-width:0;border-bottom-width:1.5px;">る</span></span>'
  );
});
