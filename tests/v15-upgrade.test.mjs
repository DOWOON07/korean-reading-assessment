import { readFile } from 'node:fs/promises';
import { strict as assert } from 'node:assert';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const [app, battery, report, spec, registry, development, manual, architecture, evidence] = await Promise.all([
  read('app.js'), read('battery.js'), read('report.js'), read('assessment-spec.js'), read('data/public-benchmark-registry.json'),
  read('docs/V0_15_DEVELOPMENT_REPORT_KO.md'), read('docs/V0_15_VERIFICATION_MANUAL_KO.md'),
  read('docs/V0_15_CODE_ARCHITECTURE_KO.md'), read('docs/V0_15_EVIDENCE_MATRIX_KO.md')
]);

for (const marker of ['timedWordLayoutAudit', 'DOCUMENT_HIDDEN', 'SCROLLED_DURING_TIMED_TASK', 'recordingStartedPerf', 'randomizationSeed', 'wordEfficiencyForm']) assert.ok(app.includes(marker), `${marker}가 없습니다.`);
assert.match(app, /PRESENTATION_INVALID/);
assert.match(app, /const responseQuality = section\.id === 'B-lexical'/);
assert.match(battery, /CHOICE_EVIDENCE_AUDITS/);
assert.match(battery, /battery-items-0\.3/);
assert.match(report, /디지털 근거·제시 품질 감사/);
assert.match(report, /실측·오차/);
assert.match(spec, /timedRecordingToleranceMs: 250/);
assert.match(spec, /columns: 5, rows: 12/);
const parsed = JSON.parse(registry);
assert.deepEqual(parsed.datasets.map(dataset => dataset.id), ['ksponspeech', 'common-voice-ko-26']);
for (const [name, doc] of [['개발 결과', development], ['검증 매뉴얼', manual], ['코드 구조', architecture], ['근거 행렬', evidence]]) {
  assert.ok(doc.length > 3000, `${name} 문서가 너무 짧습니다.`);
  assert.match(doc, /v0\.15|0\.15\.0/i, `${name}에 v0.15 표기가 없습니다.`);
}
for (const marker of ['국립국어원', 'ROAR', 'Common Voice', '점수 제외', '고정 음원 0개']) assert.ok(evidence.includes(marker) || development.includes(marker), `v0.15 문서 누락: ${marker}`);
console.log('통과: v0.15 말뭉치 감사, 45초 제시 유효성, 선택지 감사, 공개음성·파일럿 분석 기반');
