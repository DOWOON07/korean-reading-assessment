import { strict as assert } from 'node:assert';
import { readFile } from 'node:fs/promises';
import Version from '../version.js';
import TtsAssets from '../tts-assets.js';

const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
assert.equal(Version.VERSION, pkg.version);
assert.equal(Version.LABEL, '연구용 프로토타입 v0.15.0');
assert.equal(TtsAssets.coverage().ready, 0);
assert.equal(TtsAssets.resolve({ kind: 'instruction', sectionId: 'missing' }), null);

console.log('통과: 앱 버전 단일 기준과 고정 TTS manifest 상태');
