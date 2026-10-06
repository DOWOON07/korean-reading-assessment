// Chrome headless로 320/768/1440 CSS px에서 45초 낱말 격자의 가시성과 재배치를 검사한다.
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { strict as assert } from 'node:assert';

const candidates = process.platform === 'win32'
  ? ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe']
  : ['google-chrome', 'chromium', 'chromium-browser'];
const chrome = candidates.find(candidate => process.platform !== 'win32' || existsSync(candidate));

if (!chrome) {
  console.log('건너뜀: Chrome/Edge 실행 파일을 찾지 못해 브라우저 화면 행렬 감사를 실행하지 않았습니다.');
} else {
  const port = 8300 + (process.pid % 400);
  const profile = mkdtempSync(join(tmpdir(), 'kra-browser-audit-'));
  const server = spawn(process.execPath, ['server.mjs'], { cwd: new URL('..', import.meta.url), env: { ...process.env, PORT: String(port), NO_OPEN: '1' }, stdio: 'ignore' });
  try {
    let ready = false;
    for (let attempt = 0; attempt < 40; attempt++) {
      try { const response = await fetch(`http://127.0.0.1:${port}/tools/visual_harness.html`); if (response.ok) { ready = true; break; } } catch {}
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    assert.equal(ready, true, '검증용 로컬 서버가 준비되지 않았습니다.');
    const homeRun = spawnSync(chrome, [
      '--headless=new', '--disable-gpu', '--no-first-run', '--disable-extensions', '--disable-background-networking',
      `--user-data-dir=${profile}`, '--window-size=1280,900', '--force-device-scale-factor=1', '--virtual-time-budget=2500', '--dump-dom', `http://127.0.0.1:${port}/`
    ], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
    assert.equal(homeRun.status, 0, `홈 화면 브라우저 감사 실패: ${homeRun.stderr}`);
    assert.match(homeRun.stdout, /<main id="app"[^>]*>\s*<section class="hero-grid participant-home">/, 'app.js가 홈 화면을 렌더링하지 못했습니다.');
    assert.match(homeRun.stdout, /연구용 프로토타입 v0\.15\.0/, '브라우저 홈 화면 버전이 v0.15.0이 아닙니다.');
    const matrix = [[320, 800], [768, 768], [1440, 900]];
    const results = [];
    for (const [width, height] of matrix) {
      const browserWidth = Math.max(500, width);
      const url = `http://127.0.0.1:${port}/tools/visual_harness.html?contentWidth=${width}`;
      const run = spawnSync(chrome, [
        '--headless=new', '--disable-gpu', '--no-first-run', '--disable-extensions', '--disable-background-networking',
        `--user-data-dir=${profile}`, `--window-size=${browserWidth},${height}`, '--force-device-scale-factor=1', '--virtual-time-budget=1600', '--dump-dom', url
      ], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
      assert.equal(run.status, 0, `브라우저 감사 실패 ${width}×${height}: ${run.stderr}`);
      const match = run.stdout.match(/<pre id="audit">([^<]+)<\/pre>/);
      assert.ok(match, `${width}×${height} 감사 결과를 찾지 못했습니다.`);
      const decoded = match[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&');
      const result = JSON.parse(decoded);
      assert.equal(result.valid, true, `${width}×${height}: ${JSON.stringify(result)}`);
      results.push(result);
    }
    console.log(`통과: v0.15 홈 렌더링 및 콘텐츠 폭 행렬 ${results.map(result => `${result.targetContentWidth}px`).join(', ')}에서 60개·5열×12행·가로 넘침 없음`);
  } finally {
    server.kill();
    rmSync(profile, { recursive: true, force: true });
  }
}
