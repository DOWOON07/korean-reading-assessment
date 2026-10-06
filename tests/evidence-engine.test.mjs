import { createRequire } from 'node:module';
import { strict as assert } from 'node:assert';

const require = createRequire(import.meta.url);
const E = require('../evidence-engine.js');

assert.equal(E.finalConsonantCount('국물'), 2);
assert.equal(E.wordFeatures('우산', { niklGrade: 1 }).syllables, 2);
assert.equal(E.wordFeatures('우산', { niklGrade: 1 }).finalConsonants, 1);
const observed = E.wordFeatures('우산', { corpusFrequency: 5192, corpusLog10: 3.800142, corpusFrequencySource: 'kofren2024:all:NNG' });
assert.equal(observed.corpusFrequencyStatus, 'OBSERVED');
assert.equal(observed.corpusFrequencySource, 'kofren2024:all:NNG');

const nonword = E.auditNonword('우덩', { referenceWord: '우산', officialLexiconCollision: false });
assert.equal(nonword.referenceMatch.syllables, true);
assert.equal(nonword.referenceMatch.finalConsonants, true);
assert.ok(nonword.flags.includes('PHONOTACTIC_PROBABILITY_PENDING'));
const proxyNonword = E.auditNonword('우덩', { referenceWord: '우산', officialLexiconCollision: false, phonotacticProbability: -2.59, phonotacticPercentile: 9.61, phonotacticMethod: 'ORTHOGRAPHIC_SYLLABLE_BIGRAM_PROXY' });
assert.equal(proxyNonword.status, 'DIGITAL_PREFILTER_PASS_WITH_ORTHOGRAPHIC_PROXY');
assert.ok(proxyNonword.flags.includes('ORTHOGRAPHIC_BIGRAM_PROXY_ONLY'));

const metrics = E.textMetrics('꿀벌은 꽃에서 꿀을 모은다. 식물은 열매를 맺는다.', { 꿀: 1, 식물은: 2 });
assert.equal(metrics.sentences, 2);
assert.equal(metrics.eojeol, 7);
assert.equal(metrics.readabilityStatus, 'DESCRIPTIVE_FEATURE_PROFILE_NOT_GRADE_PREDICTION');

const cleanChoice = E.choiceItemAudit({ id: 'Q1', type: '사실', options: ['꽃가루', '물', '흙', '돌'], answer: '꽃가루' }, '꿀벌은 꽃가루를 옮긴다.');
assert.equal(cleanChoice.answerMatches, 1);
const duplicate = E.choiceItemAudit({ id: 'Q2', options: ['가', '가', '나'], answer: '가' });
assert.ok(duplicate.flags.includes('ANSWER_NOT_EXACTLY_ONCE'));
assert.ok(duplicate.flags.includes('DUPLICATE_OPTIONS'));

assert.equal(E.rapidResponseAudit(199).status, 'RAPID_GUESS_FLAG');
assert.equal(E.rapidResponseAudit(500).valid, true);

const rows = [
  { participantId: 'P1', itemId: 'I1', score: 1, group: '아동' }, { participantId: 'P1', itemId: 'I2', score: 1, group: '아동' },
  { participantId: 'P2', itemId: 'I1', score: 1, group: '성인' }, { participantId: 'P2', itemId: 'I2', score: 0, group: '성인' },
  { participantId: 'P3', itemId: 'I1', score: 0, group: '아동' }, { participantId: 'P3', itemId: 'I2', score: 0, group: '아동' }
];
const analysis = E.classicalItemAnalysis(rows);
assert.equal(analysis.participants, 3);
assert.equal(analysis.items.length, 2);
assert.equal(E.groupItemGapScreen(rows).status, 'RAW_GROUP_GAP_SCREEN_NOT_DIF_MODEL');
console.log('통과: 문항 특징, 비단어 짝맞춤, 지문·선택지 감사, 반응품질, 파일럿 통계 엔진');
