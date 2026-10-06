import { createRequire } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const manifest = require('../tts-assets.js');
const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const required = ['url', 'voice', 'sourceLicense', 'textVersion', 'sha256', 'durationMs', 'sampleRateHz', 'listeningStatus'];
const problems = [];

for (const [key, entry] of Object.entries(manifest.ENTRIES)) {
  for (const field of required) if (entry[field] == null || entry[field] === '') problems.push(`${key}: ${field} 누락`);
  if (entry.listeningStatus !== 'ACCEPTED') problems.push(`${key}: 청취 승인 전(${entry.listeningStatus || '미기록'})`);
  if (/^https?:/i.test(entry.url)) {
    problems.push(`${key}: 외부 URL이 아니라 버전 관리된 로컬 고정 음원이어야 함`);
    continue;
  }
  const path = resolve(projectRoot, entry.url.replace(/^\//, ''));
  if (!existsSync(path)) {
    problems.push(`${key}: 파일 없음 ${entry.url}`);
    continue;
  }
  const hash = createHash('sha256').update(readFileSync(path)).digest('hex');
  if (hash !== entry.sha256) problems.push(`${key}: SHA-256 불일치`);
}

if (problems.length) {
  console.error(problems.join('\n'));
  process.exitCode = 1;
} else if (!Object.keys(manifest.ENTRIES).length) {
  console.log(`통과(대기): ${manifest.STATUS} · 고정 음원 0개 · 빈 manifest를 READY로 오인하지 않습니다.`);
} else {
  console.log(`통과: 고정 음원 ${Object.keys(manifest.ENTRIES).length}개의 파일·메타데이터·해시·청취 승인을 확인했습니다.`);
}
