import { strict as assert } from 'node:assert';
import { access, readFile } from 'node:fs/promises';

const docs = [
  'V0_8_DESIGN_RATIONALE_KO.md',
  'V0_8_TECHNICAL_SPEC_KO.md',
  'V0_8_BEFORE_AFTER_KO.md',
  'V0_8_VERIFICATION_MANUAL_KO.md'
];
for (const file of docs) {
  const url = new URL(`../docs/${file}`, import.meta.url);
  const text = await readFile(url, 'utf8');
  assert.ok(text.length > 1000, `${file} 내용이 너무 짧습니다.`);
}
for (const file of ['01-home-annotated.svg', '02-preflight-annotated.svg', '03-assessment-annotated.svg', '04-results-annotated.svg']) {
  await access(new URL(`../docs/images/v0.8/${file}`, import.meta.url));
}
const rationale = await readFile(new URL('../docs/V0_8_DESIGN_RATIONALE_KO.md', import.meta.url), 'utf8');
for (const marker of ['신용카드는 필수가 아님', '220–280 SPM', '연습 피드백', 'DEFERRED_UNTIL_RESEARCHER_REQUEST', '아동·청소년·성인']) assert.ok(rationale.includes(marker), `설계 근거 누락: ${marker}`);

console.log('통과: v0.8 근거서·기술 사양·전후 비교·검증 매뉴얼과 화면 설명도');
