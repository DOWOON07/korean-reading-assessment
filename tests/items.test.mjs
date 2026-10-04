// 문항 규칙 점검: 해독·선별 문항의 허용 발음이 표준 발음법 적용 결과와 같은지,
// 표기-발음 일치 문항은 음운변동이 없고, 음운변동 문항은 규칙이 정확히 하나인지 확인한다.
import assert from 'assert/strict';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
const items = JSON.parse(execFileSync('node', [fileURLToPath(new URL('../tools/dump_items.mjs', import.meta.url))]).toString());
for (const item of items.filter(item => item.set === 'decoding' || item.set === 'screening')) {
  assert.equal(item.accepted[0], item.pron, `${item.id} ${item.text}: 허용 발음 ${item.accepted[0]} ≠ 규칙 적용 ${item.pron}`);
  if (item.regularity === 'consistent') { assert.equal(item.pron, item.text, `${item.id} 일치 조건인데 발음이 다름`); assert.equal(item.rules.length, 0, `${item.id} 일치 조건에 규칙 위치`); }
  else assert.equal(item.rules.length, 1, `${item.id} 음운변동 문항은 규칙이 하나여야 함 (${item.rules})`);
  assert.equal(item.syllables, 2, `${item.id} 2음절 (KOLRA 해독 문항 구성)`);
}
const lexical = items.filter(item => item.set === 'lexical');
assert.equal(lexical.filter(item => item.lexicality === 'real').length, lexical.filter(item => item.lexicality === 'nonword').length, '단어 재인 실제·비단어 수 같음');
console.log('통과: 문항 규칙 점검 (허용 발음 = 표준 발음법 적용, 일치/음운변동 조건, 2음절, 단어 재인 균형)');
