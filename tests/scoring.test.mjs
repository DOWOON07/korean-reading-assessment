import { strict as assert } from 'node:assert';
import Scoring from '../scoring.js';

const { decompose, alignSyllables, decodingCandidate, tokenizePassage, computeFluency, detectSpeech, ratingsAgree, estimateTokenTimes } = Scoring;

// 한글 분해
assert.deepEqual(decompose('꽃'), { cho: 'ㄲ', jung: 'ㅗ', jong: 'ㅊ' });
assert.deepEqual(decompose('가'), { cho: 'ㄱ', jung: 'ㅏ', jong: '' });

// 음절 정렬: 위치와 자모 차이
const aligned = alignSyllables('궁물', '국물');
assert.equal(aligned.distance, 1);
assert.equal(aligned.ops[0].op, 'sub');
assert.equal(aligned.ops[0].position, 1);
assert.deepEqual(aligned.ops[0].jamo, [{ part: 'jong', label: '받침', from: 'ㅇ', to: 'ㄱ' }]);
assert.deepEqual(alignSyllables('바다', '바').ops.map(op => op.op), ['match', 'del']);
assert.deepEqual(alignSyllables('바다', '바다다').ops.filter(op => op.op === 'ins').length, 1);

const item = (text, accepted, rule = '') => ({ text, accepted, rule });

// 정확
let c = decodingCandidate(item('국물', ['궁물'], '비음화 후보'), '궁물');
assert.equal(c.suggestion.itemScore, 'CORRECT');
assert.deepEqual(c.suggestion.events, []);

// 표기대로 읽음 = 음운변동 미적용 후보 + 대치
c = decodingCandidate(item('국물', ['궁물'], '비음화 후보'), '국물');
assert.equal(c.suggestion.itemScore, 'INCORRECT');
assert.ok(c.suggestion.events.includes('대치'));
assert.ok(c.notes.some(note => note.includes('음운변동')));
assert.equal(c.attempts[0].ops[0].position, 1);

// 자기수정: 첫 시도 오류, 최종 정답
c = decodingCandidate(item('꽃잎', ['꼰닙']), '꼳입/꼰닙');
assert.equal(c.suggestion.firstAttemptCorrect, 'INCORRECT');
assert.equal(c.suggestion.finalAttemptCorrect, 'CORRECT');
assert.equal(c.suggestion.itemScore, 'CORRECT');
assert.ok(c.suggestion.events.includes('자기수정'));

// 생략, 삽입, 순서 바꿈, 반복, 분절, 무응답
assert.ok(decodingCandidate(item('우산', ['우산']), '우').suggestion.events.includes('생략'));
assert.ok(decodingCandidate(item('우산', ['우산']), '우산이').suggestion.events.includes('삽입'));
assert.deepEqual(decodingCandidate(item('모자', ['모자']), '자모').suggestion.events, ['순서 바꿈']);
assert.ok(decodingCandidate(item('버눅', ['버눅']), '버버눅').suggestion.events.includes('반복'));
c = decodingCandidate(item('소덥', ['소덥']), '소-덥');
assert.equal(c.suggestion.itemScore, 'CORRECT');
assert.ok(c.suggestion.events.includes('분절 후 합성'));
assert.deepEqual(decodingCandidate(item('나무', ['나무']), '').suggestion.events, ['무응답']);

// 유창성 계산
const tokens = tokenizePassage('민지는 아침에 작은 우산을 들고 집을 나섰다.');
assert.equal(tokens.length, 7);
assert.equal(tokens.reduce((sum, token) => sum + token.syllables, 0), 18);
let f = computeFluency({ tokens, onsetMs: 1000, endMs: 7000 });
assert.equal(f.accuracyEojeol, 100);
assert.equal(f.correctEojeolPerMin, 70);
assert.equal(f.correctSyllablesPerMin, 180);
assert.equal(f.first60.reachedSixty, false);

f = computeFluency({
  tokens, onsetMs: 0, endMs: 6000,
  marks: { 1: { mark: 'sub' }, 3: { mark: 'correct', flags: ['selfcorrect'] }, 4: { mark: 'omit' }, 5: { mark: 'correct', flags: ['repeat'] } }
});
assert.equal(f.attemptedEojeol, 7);
assert.equal(f.correctEojeol, 5);
assert.equal(f.errors, 2);
assert.equal(f.correctSyllables, 18 - 3 - 2);
assert.deepEqual(f.events, { '대치': 1, '자기수정': 1, '생략': 1, '반복': 1 });

// 보류 어절은 분자·분모에서 제외, 끝내지 못한 지문은 읽은 범위까지만
f = computeFluency({ tokens, onsetMs: 0, endMs: 6000, marks: { 0: { mark: 'unclear' } }, lastIndex: 3 });
assert.equal(f.excluded, 1);
assert.equal(f.attemptedEojeol, 3);
assert.equal(f.completed, false);

// 60초가 넘으면 60초 어절까지만 첫 60초 값
f = computeFluency({ tokens, onsetMs: 0, endMs: 90000, sixtyIndex: 2, marks: { 1: { mark: 'help' } } });
assert.equal(f.first60.reachedSixty, true);
assert.equal(f.first60.attemptedEojeol, 3);
assert.equal(f.first60.correctEojeol, 2);

// 어절 시각 추정은 음절 비율
const times = estimateTokenTimes(tokens, 0, 1800);
assert.equal(times[0].startMs, 0);
assert.equal(times[0].endMs, 300);
assert.equal(times[6].endMs, 1800);

// 발화 탐지: 0.5초 무음, 1초 소리, 1초 무음, 0.5초 소리, 0.5초 무음
const rate = 8000;
const segments = [[0.5, 0], [1, 0.3], [1, 0], [0.5, 0.3], [0.5, 0]];
const samples = new Float32Array(segments.reduce((sum, [sec]) => sum + sec * rate, 0));
let offset = 0;
for (const [sec, amp] of segments) {
  for (let k = 0; k < sec * rate; k++) samples[offset + k] = amp * Math.sin(2 * Math.PI * 220 * k / rate) + (Math.random() - 0.5) * 0.002;
  offset += sec * rate;
}
const vad = detectSpeech(samples, rate);
assert.ok(Math.abs(vad.onsetMs - 500) <= 40, `onset ${vad.onsetMs}`);
assert.ok(Math.abs(vad.offsetMs - 3000) <= 40, `offset ${vad.offsetMs}`);
assert.equal(vad.pauses.length, 1);
assert.ok(Math.abs(vad.pauses[0].durationMs - 1000) <= 40);
assert.equal(detectSpeech(new Float32Array(rate), rate).onsetMs, null);

// 두 채점자 비교: 해독은 전사 표기 차이를 무시, 유창성은 시각 허용 오차 적용
assert.ok(ratingsAgree('decoding',
  { itemScore: 'INCORRECT', events: ['대치'], firstAttemptCorrect: 'INCORRECT', finalAttemptCorrect: 'INCORRECT', transcript: '국물' },
  { itemScore: 'INCORRECT', events: ['대치'], firstAttemptCorrect: 'INCORRECT', finalAttemptCorrect: 'INCORRECT', transcript: '국 물' }));
assert.ok(!ratingsAgree('decoding', { itemScore: 'CORRECT', events: [] }, { itemScore: 'INCORRECT', events: [] }));
const fa = { itemScore: 'VALID', marks: { 2: { mark: 'sub', flags: [] } }, onsetMs: 500, speechEndMs: 20000, lastIndex: 6, sixtyIndex: null };
assert.ok(ratingsAgree('fluency', fa, { ...fa, onsetMs: 700 }));
assert.ok(!ratingsAgree('fluency', fa, { ...fa, onsetMs: 900 }));
assert.ok(!ratingsAgree('fluency', fa, { ...fa, marks: { 2: { mark: 'omit' } } }));

// 대치 어절에 실제 읽은 말을 적으면 음절 단위로 부분 인정
f = computeFluency({ tokens, onsetMs: 0, endMs: 6000, marks: { 3: { mark: 'sub', actual: '우상을' } } });
assert.equal(f.correctEojeol, 6);
assert.equal(f.correctSyllables, 18 - 1);

// 시각 사건: 3초 창 안의 자기수정과 창 밖의 자기수정
const sc = Scoring.selfCorrectionCheck([{ type: '첫 오류', timeMs: 1000 }, { type: '자기수정', timeMs: 2500 }, { type: '대치', timeMs: 5000 }, { type: '자기수정', timeMs: 9000 }]);
assert.deepEqual(sc.pairs.map(pair => [pair.gapMs, pair.withinWindow]), [[1500, true], [4000, false]]);
assert.equal(Scoring.hesitationCheck(3500).exceeded, true);
assert.equal(Scoring.hesitationCheck(900).exceeded, false);

// ASR 후처리: 제한 후보 선택
let choice = Scoring.constrainedDecodingChoice('궁물', { text: '국물', accepted: ['궁물'] });
assert.equal(choice.nearest.label, '허용 발음'); assert.equal(choice.confident, true);
choice = Scoring.constrainedDecodingChoice('국물', { text: '국물', accepted: ['궁물'] });
assert.equal(choice.nearest.label, '표기대로 읽음');
choice = Scoring.constrainedDecodingChoice('강물이', { text: '각물', accepted: ['강물'] });
assert.equal(choice.nearest.form, '강물'); assert.equal(choice.confident, false);

// ASR 단어열을 지문 어절에 정렬
const asrWords = [
  { text: '민지는', startMs: 500, endMs: 900 }, { text: '아침에', startMs: 900, endMs: 1300 },
  { text: '우상을', startMs: 1300, endMs: 1800 }, { text: '음', startMs: 1800, endMs: 1900 }, { text: '들고', startMs: 1900, endMs: 2200 },
  { text: '집을', startMs: 2200, endMs: 2500 }
];
const al = Scoring.alignWordsToPassage(tokens, asrWords);
assert.deepEqual(al.tokens.map(x => x.status), ['match', 'match', 'omit', 'sub', 'match', 'match', 'omit']);
assert.equal(al.tokens[3].heard, '우상을');
assert.equal(al.tokens[3].startMs, 1300);
assert.equal(al.insertions.length, 1);
assert.equal(al.lastReadIndex, 5);

// Cohen's kappa: 교과서 예 (Cohen 1960 형식)
const k = Scoring.cohensKappa([['C', 'C'], ['C', 'C'], ['C', 'I'], ['I', 'I'], ['I', 'I'], ['C', 'C'], ['I', 'C'], ['C', 'C'], ['I', 'I'], ['C', 'C']]);
assert.equal(k.n, 10); assert.equal(k.agreement, 80);
// p_o=.8, p_a(C)=.6 p_b(C)=.6 → p_e=.36+.16=.52 → κ=(.8-.52)/.48=.583
assert.equal(k.kappa, 0.583);
assert.equal(Scoring.kappaLabel(0.583), '중간');
assert.equal(Scoring.cohensKappa([['C', 'C'], ['C', 'C']]).kappa, 1);

// Wilson 구간: 8/10 → 49.0~94.3% (Brown, Cai & DasGupta 2001 표와 일치하는 값)
const w = Scoring.wilsonInterval(8, 10);
assert.equal(w.p, 80); assert.equal(w.low, 49); assert.equal(w.high, 94.3);
assert.equal(Scoring.wilsonInterval(0, 0), null);
// Newcombe (1998) 방법 10: 56/70 vs 48/80 → 차이 20%p, 95% CI 5.2~33.4 (논문 표 II 예 (a))
const nd = Scoring.proportionDifference(56, 70, 48, 80);
assert.equal(nd.diff, 20); assert.ok(Math.abs(nd.low - 5.24) < 0.1, `low ${nd.low}`); assert.ok(Math.abs(nd.high - 33.36) < 0.1, `high ${nd.high}`); assert.equal(nd.excludesZero, true);
assert.equal(Scoring.proportionDifference(3, 4, 2, 4).excludesZero, false);

// 선별 → 모듈과 확인 포인트
const sTokens = tokenizePassage('동생은 공원에서 노란 공을 찼다.');
const okSentence = { ...computeFluency({ tokens: sTokens, onsetMs: 0, endMs: 3000 }), seconds: 3 }; // 13음절/3초 = 260/분
const W = (lexicality, regularity, correct, extra = {}) => ({ lexicality, regularity, correct, ...extra });
const allRight = [W('real', 'consistent', true), W('real', 'phonological', true), W('nonword', 'consistent', true), W('nonword', 'phonological', true)];
let sd = Scoring.screeningDecision({ words: allRight, sentence: okSentence, ageBand: '성인' });
assert.deepEqual(sd.paths, []); assert.deepEqual(sd.modules, []); assert.deepEqual(sd.focus, []);
sd = Scoring.screeningDecision({ words: [W('real', 'consistent', true), W('real', 'phonological', true), W('nonword', 'consistent', true), W('nonword', 'phonological', false, { spellingRead: true })], sentence: okSentence, ageBand: '성인' });
assert.deepEqual(sd.paths, ['A']); assert.deepEqual(sd.modules, ['decoding']);
assert.deepEqual(sd.focus.map(f => f.key), ['nonword', 'phonological']); assert.ok(sd.focus[1].reason.includes('표기대로 읽음 1'));
const slow = { ...computeFluency({ tokens: sTokens, onsetMs: 0, endMs: 20000 }), seconds: 20 }; // 39/분
sd = Scoring.screeningDecision({ words: allRight, sentence: slow, ageBand: '아동' });
assert.deepEqual(sd.paths, []); assert.deepEqual(sd.modules, []); assert.equal(sd.measures.rateFloor, null);
assert.deepEqual(sd.focus, []);
const inaccurate = { ...computeFluency({ tokens: sTokens, marks: { 1: { mark: 'sub' } }, onsetMs: 0, endMs: 3000 }), seconds: 3 };
sd = Scoring.screeningDecision({ words: allRight, sentence: inaccurate, ageBand: '아동' });
assert.deepEqual(sd.paths, ['A', 'B']); assert.deepEqual(sd.focus.map(f => f.key), ['accuracy']);

// 음성인식 기반 자동 채점
assert.equal(Scoring.asrToTranscript('나비.', '나비'), '나비');
assert.equal(Scoring.asrToTranscript('나 비', '나비'), '나-비');
assert.equal(Scoring.asrToTranscript('국물 궁물', '국물'), '국물/궁물');
assert.equal(Scoring.asrToTranscript('', '나비'), '무응답');
const gm = { text: '국물', accepted: ['궁물'], rule: '비음화' };
let ar = Scoring.autoDecodingRating(gm, '궁물');
assert.equal(ar.itemScore, 'CORRECT'); assert.equal(ar.source, 'AUTO');
ar = Scoring.autoDecodingRating(gm, '국물');
assert.equal(ar.itemScore, 'INCORRECT'); assert.equal(ar.spellingRead, true);
ar = Scoring.autoDecodingRating(gm, '국물 궁물');
assert.equal(ar.itemScore, 'CORRECT'); assert.equal(ar.firstAttemptCorrect, 'INCORRECT'); assert.ok(ar.events.includes('자기수정'));
ar = Scoring.autoDecodingRating(gm, '궁물', { speechDetected: false });
assert.equal(ar.noResponse, true); assert.equal(ar.itemScore, 'INCORRECT');
const fTok = tokenizePassage('동생은 공원에서 노란 공을 찼다. 공은 높이 날아갔다.');
const fw = [['동생은', 0, 500], ['공원에서', 600, 1200], ['노랑', 1300, 1600], ['공을', 3200, 3500], ['찼다', 3600, 3900], ['공은', 4000, 4300], ['높이', 4400, 4700]]
  .map(([text, startMs, endMs]) => ({ text, startMs, endMs }));
const af = Scoring.autoFluencyRating(fTok, fw, { speech: { onsetMs: 0, offsetMs: 4700, pauses: [{ startMs: 1600, endMs: 3200 }] } });
assert.equal(af.itemScore, 'VALID');
assert.equal(af.marks[2].mark, 'sub'); assert.equal(af.marks[2].actual, '노랑');
assert.ok(af.marks[3].flags.includes('pauseBefore'));
assert.equal(af.lastIndex, 6); assert.equal(af.metrics.completed, false);
assert.equal(af.metrics.correctEojeol, 6);
assert.equal(Scoring.autoFluencyRating(fTok, []).itemScore, 'UNSCORABLE');

// 선택형 하위검사 요약과 d′
const cs = Scoring.choiceSummary([{ correct: true, rtMs: 900, type: '가' }, { correct: false, rtMs: 1200, type: '가' }, { correct: true, rtMs: 700, type: '나' }, { correct: false, noResponse: true, type: '나' }]);
assert.equal(cs.n, 4); assert.equal(cs.correct, 2); assert.equal(cs.incorrect, 1); assert.equal(cs.noResponse, 1); assert.equal(cs.efficiency, 1);
assert.equal(cs.medianCorrectRtMs, 800); assert.equal(cs.pct, 50); assert.deepEqual(cs.byType['나'], { n: 2, correct: 1 });
assert.ok(Math.abs(Scoring.inverseNormal(0.975) - 1.959964) < 1e-5);
assert.ok(Math.abs(Scoring.inverseNormal(0.5)) < 1e-9);
// 적중 0.8(보정 (8.5/11)), 오경보 0.2(보정 (2.5/11)) → d′ = z(.7727) - z(.2273) ≈ 1.49
const dp = Scoring.dPrime({ hits: 8, signalN: 10, falseAlarms: 2, noiseN: 10 });
assert.equal(dp.hitRate, 0.8); assert.ok(Math.abs(dp.dPrime - 1.49) < 0.02, `d' ${dp.dPrime}`);

// 음운규칙 필요 위치 (표준 발음법)
for (const [word, rule] of [['국물', '비음화'], ['같이', '구개음화'], ['설날', '유음화'], ['국밥', '된소리되기'], ['좋고', '기식음화'], ['놓아', 'ㅎ탈락'], ['담력', '비음화']]) assert.equal(Scoring.ruleSites(word)[0]?.rule, rule, word);
assert.equal(Scoring.ruleSites('나무').length, 0); assert.equal(Scoring.ruleSites('우산을').length, 0);

// 실제 음성 ASR 검증용 CER/WER·문항 정오 일치·처리속도
assert.deepEqual(Scoring.transcriptionError('국물', '궁물', 'char'), { edits: 1, referenceUnits: 2, hypothesisUnits: 2, rate: 50 });
const asrBenchmark = Scoring.asrBenchmarkSummary([
  { referenceTranscript: '국물', asrTranscript: '궁물', humanScore: 'I', autoScore: 'I', audioSeconds: 2, elapsedMs: 1000 },
  { referenceTranscript: '나무', asrTranscript: '나무', humanScore: 'C', autoScore: 'I', audioSeconds: 2, elapsedMs: 3000 }
]);
assert.equal(asrBenchmark.cer, 25); assert.equal(asrBenchmark.wer, 50); assert.equal(asrBenchmark.itemAgreement.agreement, 50); assert.equal(asrBenchmark.realTimeFactor, 1);

console.log('통과: 해독 오류 후보, 유창성 계산, 발화 탐지, 채점자 비교, 자동 채점, 선택형 요약·d′·음운규칙 위치 단위 테스트');
