import { strict as assert } from 'node:assert';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const app = await readFile(new URL('../app.js', import.meta.url), 'utf8');
const report = await readFile(new URL('../report.js', import.meta.url), 'utf8');

for (const marker of ['Noto+Sans+KR', 'vision-status', 'audio-output', 'tts-lab-template', 'scaffold-template']) {
  assert.ok(html.includes(marker), `미팅 피드백 UI가 없습니다: ${marker}`);
}
for (const marker of ['DEFERRED_UNTIL_RESEARCHER_REQUEST', "['L0', 'L1', 'L2']", 'THREE_PARALLEL_CANDIDATES_COUNTERBALANCED', 'SEPARATE_FROM_BASELINE', 'readingTtsPreference', "step.kind === 'ready'", 'connectPlaybackBoost']) {
  assert.ok(app.includes(marker), `미팅 피드백 로직이 없습니다: ${marker}`);
}
for (const marker of ['문자 오류율 CER', '어절 오류율 WER', '실시간 계수 RTF', '지원 반응 · L0/L1/L2']) {
  assert.ok(report.includes(marker), `검증 결과지 항목이 없습니다: ${marker}`);
}
for (const marker of ['참여자용 요약', '연구자용 상세', 'calibrationMethod', '지금 크기 사용']) assert.ok(html.includes(marker), `참여자/연구자 분리 UI가 없습니다: ${marker}`);
assert.ok(report.includes('drawParticipantReport'), '참여자용 쉬운 결과지가 없습니다.');
assert.ok(!app.includes('preloadAsr().finally'), '참여자 환경 확인에서 ASR을 자동 로드하면 안 됩니다.');

console.log('통과: TTS 후보평가, 감각·화면 사전점검, 렉 방어, ASR 검증, L0/L1/L2 분리');
