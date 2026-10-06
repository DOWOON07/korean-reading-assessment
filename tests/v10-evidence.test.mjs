import { readFile } from 'node:fs/promises';
import { strict as assert } from 'node:assert';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const [app, battery, catalog, report, tts, readme, evidence, beforeAfter, manual] = await Promise.all([
  read('app.js'), read('battery.js'), read('catalog.js'), read('report.js'), read('tts-assets.js'), read('README.md'),
  read('docs/V0_10_EVIDENCE_ENGINEERING_KO.md'), read('docs/V0_10_BEFORE_AFTER_KO.md'), read('docs/V0_10_VERIFICATION_MANUAL_KO.md')
]);

assert.match(app, /ITEM_BANK\.B_WORD_EFFICIENCY/);
assert.match(app, /item\.taskType === 'timed-word-list'/);
assert.match(app, /item\.timeLimitSec \* 1000/);
assert.match(app, /itemEvidenceVersion: ITEM_BANK\.VERSION/);
assert.match(app, /engineering-form-0\.7/);

for (const type of ['합성어 결합', '합성어 분해', '파생어 결합', '파생어 분해']) assert.ok(battery.includes(type), `${type} 과제가 없습니다.`);
for (const oldStem of ['“밤”의 뜻이 다른 하나', '“소방관”의 “관”', '“풋-”이 ‘덜 익은, 처음 나온’이라는 뜻이 아닌']) assert.ok(!battery.includes(oldStem), `이전 동형 글자 과제가 남았습니다: ${oldStem}`);

assert.match(catalog, /B-word-efficiency/);
assert.match(catalog, /국립국어원 2023 기초어휘/);
assert.match(report, /시간제한 낱말 읽기 후보/);
assert.match(report, /f\.timedWordLists/);
assert.match(report, /또래 규준 없는 후보값/);
assert.match(tts, /FIXED_AUDIO_SPEC/);
assert.match(tts, /MANIFEST_READY_ASSETS_PENDING/);

for (const doc of [readme, evidence, beforeAfter, manual]) assert.match(doc, /v0\.10|0\.10\.0/i, 'v0.10 문서 표기가 없습니다.');
assert.match(evidence, /표준화 검사나 진단 도구라고 부르지 않는다/);
assert.match(manual, /45초가 되면/);
console.log('통과: v0.10 45초 낱말, 형태소 결합·분해, 결과 분리, 음원 검증 게이트, 문서');

