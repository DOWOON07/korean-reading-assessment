import { readFile } from 'node:fs/promises';
import { strict as assert } from 'node:assert';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const js = await readFile(new URL('../app.js', import.meta.url), 'utf8');
const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8');

const templates = [
  'home', 'setup', 'preflight', 'mic', 'screen', 'route',
  'task', 'choice', 'scaffold', 'complete', 'review', 'result', 'preview', 'report', 'tts-lab'
];

for (const name of templates) {
  assert.match(html, new RegExp(`<template id=["']${name}-template["']`), `${name} 화면이 없습니다.`);
}

for (const status of ['AGREE', 'CONSENSUS', 'EXPERT_PENDING', 'INVALID_AUDIO']) {
  assert.ok(js.includes(status), `${status} 판정 상태가 없습니다.`);
}

for (const marker of ['localStorage', 'indexedDB', 'MediaRecorder', 'readingSessions']) {
  assert.ok(js.includes(marker), `${marker} 기능이 없습니다.`);
}

for (const marker of ['assessmentSpecVersion', 'PRESENTATION_INVALID', 'practiceFeedback', 'prepareChoiceStep', 'detached-dom-template', 'PerformanceObserver', 'SUPPORT_EXPERIMENT_VERSION', 'readingTtsPreference', 'task-instruction-audio']) {
  assert.ok(js.includes(marker) || html.includes(marker), `${marker} 측정 품질 연결이 없습니다.`);
}
const report = await readFile(new URL('../report.js', import.meta.url), 'utf8');
assert.ok(report.includes('drawParticipantReport'), '참여자용 쉬운 결과지가 없습니다.');
assert.ok(html.includes('연구자용 상세'), '참여자/연구자 결과 분리가 없습니다.');

assert.ok(html.includes('표준화 전 연구판'), '표준화 전 단계 안내가 없습니다.');
assert.ok(html.includes('app.js'), 'app.js 연결이 없습니다.');
assert.ok(html.includes('styles.css'), 'styles.css 연결이 없습니다.');
assert.ok(css.length > 1000, '스타일 파일이 비어 있거나 너무 짧습니다.');

// 브라우저는 classic script들을 한 전역 범위에서 실행한다. 같은 이름의 최상위 const/let/function이 있으면 화면 전체가 멈추므로 합쳐서 파싱한다.
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const scripts = [...html.matchAll(/<script src=["']([^"']+)["']/g)].map(match => match[1]).filter(src => !/^https?:/.test(src));
assert.deepEqual(scripts, ['version.js', 'evidence-engine.js', 'item-bank.js', 'tts-assets.js', 'assessment-spec.js', 'scoring.js', 'catalog.js', 'battery.js', 'report.js', 'app.js'], `스크립트 순서: ${scripts}`);
const bundle = (await Promise.all(scripts.map(src => readFile(new URL(`../${src}`, import.meta.url), 'utf8')))).join('\n;\n');
const bundlePath = join(mkdtempSync(join(tmpdir(), 'kra-')), 'bundle.js');
writeFileSync(bundlePath, bundle);
execFileSync(process.execPath, ['--check', bundlePath]);

console.log('통과: 핵심 파일, 화면, 저장, 녹음, 채점 상태를 확인했습니다.');
