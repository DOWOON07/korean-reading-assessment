import { strict as assert } from 'node:assert';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const [html, app, catalog, battery, evidence, beforeAfter, manual] = await Promise.all([
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
  readFile(new URL('../app.js', import.meta.url), 'utf8'),
  readFile(new URL('../catalog.js', import.meta.url), 'utf8'),
  readFile(new URL('../battery.js', import.meta.url), 'utf8'),
  readFile(new URL('../docs/V0_9_EVIDENCE_ARCHITECTURE_KO.md', import.meta.url), 'utf8'),
  readFile(new URL('../docs/V0_9_BEFORE_AFTER_KO.md', import.meta.url), 'utf8'),
  readFile(new URL('../docs/V0_9_VERIFICATION_MANUAL_KO.md', import.meta.url), 'utf8')
]);

for (const name of ['digitalReadingExtension', 'morphologyExtension', 'advancedComprehensionExtension']) {
  assert.match(html, new RegExp(`name=["']${name}["']`), `${name} 연구자 선택이 없습니다.`);
  assert.doesNotMatch(html, new RegExp(`name=["']${name}["'][^>]*checked`), `${name}은 기본값이 꺼져 있어야 합니다.`);
}

assert.match(app, /const PATH_MODULES = \{ A: \['decoding', 'phonology'\], B: \['fluency'\]/, 'B 핵심 경로에 ROAR/TOSREC 모듈이 남아 있습니다.');
assert.match(app, /options\.digitalReadingExtensionEnabled\) selected\.add\('silent'\)/, 'B 디지털 확장의 명시적 선택 규칙이 없습니다.');
assert.match(app, /section\.id !== 'C-morph' \|\| session\?\.morphologyExtensionEnabled/, '형태소 과제 분리 규칙이 없습니다.');
assert.match(app, /\['D-eval', 'D-multi'\].*advancedComprehensionExtensionEnabled/, 'D 고차 문해 분리 규칙이 없습니다.');
assert.match(app, /LITERATURE_AND_OFFICIAL_DATA_ENGINEERED_PENDING_PILOT/, 'A 문항이 문헌·공식자료 공학 후 파일럿 대기임을 나타내는 게이트가 없습니다.');

const context = {};
vm.createContext(context);
vm.runInContext(`${catalog}\nthis.paths = PLATFORM_PATHS; this.roleOf = assessmentRoleForSubtest;`, context);
for (const id of ['B-lexical', 'B-silent', 'C-morph', 'D-eval', 'D-multi']) assert.equal(context.roleOf(id), 'research', `${id}는 연구 확장이어야 합니다.`);
for (const id of ['B-oral', 'C-vocab', 'C-sentence', 'C-listen', 'D-fact', 'D-infer']) assert.equal(context.roleOf(id), 'core', `${id}는 핵심 후보여야 합니다.`);

vm.runInContext(`${battery}\nthis.batteryVersion = BATTERY_VERSION; this.choiceModules = CHOICE_MODULES;`, context);
assert.match(context.batteryVersion, /^battery-items-0\.[23]$/);
assert.equal(context.choiceModules.silent.role, 'research-extension');
assert.equal(context.choiceModules.silent.standardizedInKorean, false);

for (const [name, text] of [['근거서', evidence], ['전후 비교', beforeAfter], ['검증 매뉴얼', manual]]) {
  assert.ok(text.length > 1200, `${name} 내용이 너무 짧습니다.`);
}
for (const marker of ['CLT-R', 'NISE-B·ACT', '40–45초', '형태소', '핵심 후보', '연구 확장']) assert.ok(evidence.includes(marker), `근거서 누락: ${marker}`);

console.log('통과: v0.9 핵심 후보/연구 확장 분리, A 청사진 게이트, 근거 문서');
