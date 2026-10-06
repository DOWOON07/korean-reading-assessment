import { strict as assert } from 'node:assert';
import Spec from '../assessment-spec.js';

assert.equal(Spec.VERSION, 'assessment-spec-0.4');
assert.equal(Spec.calibrationFromCard(342.4).cssPxPerMm, 4);
assert.equal(Spec.calibrationFromCard(100), null);
assert.equal(Spec.calibrationFromReference(400, 'ruler').cssPxPerMm, 4);
assert.equal(Spec.defaultCalibration().status, 'UNCALIBRATED_BROWSER_DEFAULT');
assert.deepEqual(Spec.TTS.targetSpm, { min: 220, max: 280, status: 'ADULT_CLEAR_SPEECH_PILOT_RANGE_NOT_AGE_NORM' });
assert.equal(Spec.VISUAL.controlTargetCssPx, 44);
assert.ok(Spec.contrastRatio(Spec.VISUAL.foreground, Spec.VISUAL.background) >= 4.5);
assert.equal(Spec.evaluateExposure(350, 374).status, 'VALID');
assert.equal(Spec.evaluateExposure(350, 409).status, 'VALID');
assert.equal(Spec.evaluateExposure(350, 411).status, 'PRESENTATION_INVALID');
assert.equal(Spec.evaluateExposure(350, 120, 'response').status, 'VALID');
assert.equal(Spec.evaluateExposure(350, null).reason, 'TIMING_MISSING');
assert.equal(Spec.estimateWpm('하나 둘 셋', 3000), 60);
assert.equal(Spec.estimateSpm('하나 둘 셋', 3000), 80);
assert.equal(Spec.practiceFeedback({ practice: false, correct: false, rightAnswer: '가' }), null);
assert.equal(Spec.practiceFeedback({ practice: true, correct: true, rightAnswer: '가' }), '맞았어요!');
assert.equal(Spec.practiceFeedback({ practice: true, correct: false, rightAnswer: '가' }), '정답은 “가”예요.');
assert.equal(Spec.isScorable({ scoringStatus: 'PRESENTATION_INVALID' }), false);
assert.equal(Spec.isScorable({ scoringStatus: 'VALID' }), true);

const voices = [
  { name: 'English', lang: 'en-US', default: true },
  { name: '한국어 로컬', lang: 'ko-KR', localService: true },
  { name: '한국어 기본', lang: 'ko-KR', default: true },
  { name: 'Microsoft SunHi Online (Natural)', lang: 'ko-KR' }
];
assert.equal(Spec.selectKoreanVoice(voices).name, 'Microsoft SunHi Online (Natural)');
assert.equal(Spec.selectKoreanVoice(voices, '한국어 로컬').name, '한국어 로컬');
assert.equal(Spec.selectKoreanVoice(voices, '없는 음성'), null);

const summary = Spec.presentationSummary({
  choiceAnswers: [
    { scoringStatus: 'VALID', presentation: { targetMs: 350, driftMs: 20 } },
    { scoringStatus: 'PRESENTATION_INVALID', presentation: { targetMs: 350, driftMs: 90 } }
  ],
  ttsEvents: [{ ok: true, wpm: 180, spm: 330 }, { ok: true, wpm: 200, spm: 370 }, { ok: false, wpm: null, spm: null }]
});
assert.deepEqual(summary, { totalAnswers: 2, timedItems: 2, invalidItems: 1, maxLateDriftMs: 90, ttsPlays: 3, ttsFailures: 1, medianTtsWpm: 190, medianTtsSpm: 350 });

console.log('통과: 검사 사양, 자극 노출 허용 오차, 음성 선택, 제시 품질 요약 테스트');
