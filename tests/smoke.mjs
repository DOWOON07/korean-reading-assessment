import { readFile } from 'node:fs/promises';
import { strict as assert } from 'node:assert';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const js = await readFile(new URL('../app.js', import.meta.url), 'utf8');
const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8');

const templates = [
  'home', 'setup', 'mic', 'screen', 'route',
  'task', 'complete', 'review', 'result'
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

assert.ok(html.includes('진단용 아님'), '비진단 안내가 없습니다.');
assert.ok(html.includes('app.js'), 'app.js 연결이 없습니다.');
assert.ok(html.includes('styles.css'), 'styles.css 연결이 없습니다.');
assert.ok(css.length > 1000, '스타일 파일이 비어 있거나 너무 짧습니다.');

console.log('통과: 핵심 파일, 화면, 저장, 녹음, 채점 상태를 확인했습니다.');
