import { createRequire } from 'node:module';
import { strict as assert } from 'node:assert';

const require = createRequire(import.meta.url);
const bank = require('../item-bank.js');

assert.equal(bank.VERSION, 'item-evidence-0.2');
assert.equal(Object.keys(bank.A_REAL_WORDS).length, 8, 'A 실제단어 8개의 공식 어휘 메타데이터가 필요합니다.');
for (const [id, item] of Object.entries(bank.A_REAL_WORDS)) {
  assert.equal(item.niklGrade, 1, `${id}의 국립국어원 등급이 기록되지 않았습니다.`);
  assert.equal(item.source, 'niklBasicVocabulary2023', `${id}의 출처가 다릅니다.`);
  assert.ok(Number.isFinite(item.corpusFrequency) && item.corpusFrequency > 0, `${id}의 KoFREN 빈도가 없습니다.`);
  assert.match(item.corpusFrequencySource, /^kofren2024:all:/, `${id}의 KoFREN 출처가 없습니다.`);
}

const audit = bank.auditTimedWordList();
assert.equal(audit.n, 60);
assert.deepEqual(audit.gradeCounts, { 1: 20, 2: 20, 3: 20 });
assert.equal(audit.unique, true);
assert.equal(audit.allTwoSyllable, true);
assert.equal(audit.allNouns, true);
assert.equal(audit.allUnambiguousEntries, true);
assert.equal(audit.balanced, true);
assert.equal(bank.B_WORD_EFFICIENCY.timeLimitSec, 45);
assert.equal(bank.B_WORD_EFFICIENCY.selection.validationStatus, 'OFFICIAL_VOCABULARY_ENGINEERED_PENDING_PILOT');

assert.deepEqual(bank.C_MORPHOLOGY_BLUEPRINT.constructs, ['합성어 결합', '합성어 분해', '파생어 결합', '파생어 분해']);
for (const form of Object.values(bank.B_WORD_EFFICIENCY_FORMS)) {
  const formAudit = bank.auditTimedWordList(form.words);
  assert.equal(formAudit.n, 60);
  assert.equal(formAudit.balanced, true);
  assert.equal(new Set(form.words.map(item => item.text)).size, 60);
}
assert.equal(Object.keys(bank.A_NONWORDS).length, 8);
for (const [id, audit] of Object.entries(bank.A_NONWORD_AUDITS)) {
  assert.equal(audit.officialLexiconCollision, false, `${id}가 공식 기초어휘와 충돌합니다.`);
  assert.equal(audit.referenceMatch.syllables, true, `${id} 음절 수 불일치`);
  assert.equal(audit.referenceMatch.finalConsonants, true, `${id} 받침 수 불일치`);
  assert.equal(audit.phonotacticMethod, 'ORTHOGRAPHIC_SYLLABLE_BIGRAM_PROXY');
  assert.ok(Number.isFinite(audit.phonotacticPercentile));
}
console.log('통과: A 공식 어휘 메타데이터, B 60개 등급 균형, C 형태소 청사진');

