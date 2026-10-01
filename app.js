const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const app = $('#app');

const APP_VERSION = '0.3-demo';
const POLICY_VERSION = 'reading-research-policy-0.2';
const CONTENT_VERSION = 'engineering-form-0.3';
const RATING_VERSION = 'dual-rater-rule-0.3';
// 허용 발음 목록의 버전. 표준 발음법(국립국어원 표준어 규정 제2부)을 적용한 후보이며 전문가 검토 전이다.
const PRONUNCIATION_DICT_VERSION = 'accepted-forms-0.3';
const S = window.Scoring;

// lexicality: real | nonword, regularity: consistent(표기-발음 일치) | phonological(음운변동 필요)
// accepted: 허용 발음 목록. 비단어의 허용 발음은 표준발음법을 적용한 후보이며 전문가 검토 전이다.
const stimuli = {
  decodingPractice: [
    { id: 'DP-01', text: '도토리', accepted: ['도토리'], kind: '연습', condition: 'practice', practice: true }
  ],
  decoding: [
    { id: 'RW-C-01', text: '나무', accepted: ['나무'], lexicality: 'real', regularity: 'consistent', kind: '실제단어', condition: '실제·표기-발음 일치', rule: '규칙적' },
    { id: 'RW-C-02', text: '모자', accepted: ['모자'], lexicality: 'real', regularity: 'consistent', kind: '실제단어', condition: '실제·표기-발음 일치', rule: '규칙적' },
    { id: 'RW-C-03', text: '바다', accepted: ['바다'], lexicality: 'real', regularity: 'consistent', kind: '실제단어', condition: '실제·표기-발음 일치', rule: '규칙적' },
    { id: 'RW-C-04', text: '우산', accepted: ['우산'], lexicality: 'real', regularity: 'consistent', kind: '실제단어', condition: '실제·표기-발음 일치', rule: '규칙적' },
    { id: 'RW-I-01', text: '국물', accepted: ['궁물'], lexicality: 'real', regularity: 'phonological', kind: '실제단어', condition: '실제·음운변동', rule: '비음화 후보' },
    { id: 'RW-I-02', text: '설날', accepted: ['설랄'], lexicality: 'real', regularity: 'phonological', kind: '실제단어', condition: '실제·음운변동', rule: '유음화 후보' },
    { id: 'RW-I-03', text: '같이', accepted: ['가치'], lexicality: 'real', regularity: 'phonological', kind: '실제단어', condition: '실제·음운변동', rule: '구개음화 후보' },
    { id: 'RW-I-04', text: '꽃잎', accepted: ['꼰닙'], lexicality: 'real', regularity: 'phonological', kind: '실제단어', condition: '실제·음운변동', rule: '복합 음운변동 후보' },
    { id: 'NW-C-01', text: '가눔', accepted: ['가눔'], lexicality: 'nonword', regularity: 'consistent', kind: '비단어 후보', condition: '비단어·표기-발음 일치 후보', rule: '전문가 검토 필요', reviewNote: '‘가누다’의 명사형 ‘가눔’과 형태소 충돌 가능' },
    { id: 'NW-C-02', text: '두밋', accepted: ['두믿'], lexicality: 'nonword', regularity: 'consistent', kind: '비단어 후보', condition: '비단어·표기-발음 일치 후보', rule: '전문가 검토 필요', reviewNote: '받침 ㅅ이 [ㄷ]으로 소리 나므로 ‘일치’ 조건에 맞지 않을 수 있음' },
    { id: 'NW-C-03', text: '버눅', accepted: ['버눅'], lexicality: 'nonword', regularity: 'consistent', kind: '비단어 후보', condition: '비단어·표기-발음 일치 후보', rule: '전문가 검토 필요' },
    { id: 'NW-C-04', text: '소덥', accepted: ['소덥'], lexicality: 'nonword', regularity: 'consistent', kind: '비단어 후보', condition: '비단어·표기-발음 일치 후보', rule: '전문가 검토 필요' },
    { id: 'NW-I-01', text: '각물', accepted: ['강물'], lexicality: 'nonword', regularity: 'phonological', kind: '비단어 후보', condition: '비단어·음운변동 후보', rule: '비음화 · 전문가 검토 필요', reviewNote: '발음 [강물]이 실제 단어 ‘강물’과 같음' },
    { id: 'NW-I-02', text: '밭문', accepted: ['반문'], lexicality: 'nonword', regularity: 'phonological', kind: '비단어 후보', condition: '비단어·음운변동 후보', rule: '비음화 · 전문가 검토 필요', reviewNote: '발음 [반문]이 실제 단어 ‘반문’과 같음' },
    { id: 'NW-I-03', text: '옷리', accepted: ['온니'], lexicality: 'nonword', regularity: 'phonological', kind: '비단어 후보', condition: '비단어·음운변동 후보', rule: '비음화 · 전문가 검토 필요' },
    { id: 'NW-I-04', text: '닫는', accepted: ['단는'], lexicality: 'nonword', regularity: 'phonological', kind: '비단어 여부 재검토', condition: '비단어·음운변동 후보', rule: '어휘·형태소 충돌 검토 필요', reviewNote: '실제 활용형 ‘닫는’과 같음' }
  ],
  fluencyPractice: [
    { id: 'FP-01', kind: '연습 지문', practice: true, text: '아침이 되자 창문으로 밝은 햇빛이 들어왔습니다.' }
  ],
  fluency: [
    { id: 'F-A', kind: '이야기글 초안', condition: '개발용 지문 A', text: '민지는 아침에 작은 우산을 들고 집을 나섰다. 하늘에는 회색 구름이 많았지만 비는 아직 오지 않았다. 학교에 가는 길에 민지는 젖은 강아지 한 마리를 보았다. 민지는 강아지를 가게 처마 아래로 데려가 잠시 비를 피하게 했다. 조금 뒤 주인이 달려와 민지에게 고맙다고 말했다.' },
    { id: 'F-B', kind: '설명글 초안', condition: '개발용 지문 B', text: '나무는 뿌리로 땅속의 물을 빨아들인다. 물은 줄기를 지나 잎까지 올라간다. 잎은 햇빛을 이용해 나무가 자라는 데 필요한 양분을 만든다. 나무는 계절에 따라 모습이 달라지기도 한다. 봄에는 새잎이 나고, 가을에는 잎의 색이 변한다. 여러 나무는 사람과 동물에게 그늘과 보금자리를 제공한다.' }
  ],
  // 짧은 공통 선별 (브리핑 v1.2 2장 중 기초 해독·유창성 축). 세부검사 문항과 겹치지 않게 따로 둔다. 검토 전 후보 문항이다.
  // 단어는 세부검사와 같은 2×2(실제·비단어 × 표기 일치·음운변동)에서 칸마다 2개씩 뽑아, 어느 조건을 더 볼지 정한다.
  screening: {
    words: [
      { id: 'S-W1', text: '나비', accepted: ['나비'], lexicality: 'real', regularity: 'consistent' },
      { id: 'S-W2', text: '국민', accepted: ['궁민'], lexicality: 'real', regularity: 'phonological', rule: '비음화 (제18항)' },
      { id: 'S-W3', text: '수벙', accepted: ['수벙'], lexicality: 'nonword', regularity: 'consistent' },
      { id: 'S-W4', text: '벅눔', accepted: ['벙눔'], lexicality: 'nonword', regularity: 'phonological', rule: '비음화 (제18항)' },
      { id: 'S-W5', text: '사과', accepted: ['사과'], lexicality: 'real', regularity: 'consistent' },
      { id: 'S-W6', text: '학교', accepted: ['학꾜'], lexicality: 'real', regularity: 'phonological', rule: '된소리되기 (제23항)' },
      { id: 'S-W7', text: '토밀', accepted: ['토밀'], lexicality: 'nonword', regularity: 'consistent' },
      { id: 'S-W8', text: '덕마', accepted: ['덩마'], lexicality: 'nonword', regularity: 'phonological', rule: '비음화 (제18항)' }
    ],
    sentence: { id: 'S-S1', text: '동생은 공원에서 노란 공을 찼다. 공은 높이 날아가 나무 위에 걸렸다. 아빠가 긴 막대로 공을 꺼내 주었다.' }
  }
};
// 지문 길이 메타데이터는 본문에서 계산해 버전과 함께 저장한다.
for (const passage of [...stimuli.fluencyPractice, ...stimuli.fluency]) {
  const tokens = S.tokenizePassage(passage.text);
  passage.meta = { eojeol: tokens.length, syllables: S.countSyllables(passage.text), sentences: (passage.text.match(/[.!?]/g) || []).length, contentVersion: CONTENT_VERSION };
}
const stimulusById = id => [...stimuli.decodingPractice, ...stimuli.decoding, ...stimuli.fluencyPractice, ...stimuli.fluency].find(item => item.id === id);

const TIMED_DECODING = ['첫 오류', '자기수정', '반복', '분절', '소음'];
const TIMED_FLUENCY = ['오류', '자기수정', '반복', '긴 멈춤', '도움 제공', '외부 방해'];
const RULES = {
  decoding: [
    ['정확하게 읽음', '정답', '허용 발음 기록'], ['다른 소리로 읽음', '대치 오류', '목표와 실제 소리 위치'], ['일부를 빼고 읽음', '생략 오류', '빠진 위치'],
    ['없는 소리를 추가함', '전체 단어 오답', '삽입 위치'], ['순서를 바꿈', '전체 단어 오답', '바뀐 순서'], ['같은 부분을 반복함', '한 번만 점수에 포함', '반복 횟수와 시간'],
    ['나누어 읽고 합치지 못함', '전체 단어 오답', '분절 읽기 사건'], ['나누어 읽은 뒤 올바르게 합침', '최종 정답', '분절 후 합성 사건'],
    ['짧은 시간 안에 자기수정', '최종 정답', '첫 오류와 수정 시간 (창: 설정값)'], ['무반응', '무반응', '대기 시간'], ['소음 또는 겹친 목소리', '점수 확정 금지', '재녹음 또는 채점 불가']
  ],
  fluency: [
    ['다른 말로 읽음', '해당 어절 오답', '대치 내용 보존 (음절 단위 부분 인정)'], ['단어나 행을 건너뜀', '건너뛴 어절 생략 오류', '행 건너뜀은 사건으로도 표시'],
    ['없는 말을 추가함', '점수 없음, 삽입 기록', '분모에는 넣지 않음'], ['같은 말을 반복함', '한 번만 점수에 포함', '반복 시간 보존'],
    ['제한시간 안 자기수정', '최종 정답', '첫 오류와 수정 시간 보존'], ['오래 멈춰 단어를 알려줌', '해당 어절 오답', '도움 제공 표시'],
    ['사투리 또는 오류가 불명확', '판정 보류', '분자·분모에서 제외'], ['지문을 끝내지 못함', '읽은 범위까지만 계산', '마지막 읽은 어절 지정']
  ]
};
function rulesHtml(module) {
  const rows = RULES[module] || [];
  return `<details class="rules"><summary>채점 규칙 보기 (설계도 v0.2 ${module === 'decoding' ? '3.5' : '4.4'}, ${esc(RATING_VERSION)})</summary><div class="table-wrap"><table><thead><tr><th>상황</th><th>처리</th><th>남기는 기록</th></tr></thead><tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${esc(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="quiet">자기수정 창 ${S.SCORING_CONFIG.selfCorrectionWindowMs / 1000}초·머뭇거림 창 ${S.SCORING_CONFIG.hesitationWindowMs / 1000}초는 DIBELS 초기값을 설정으로 둔 것이며 한국어 검증값이 아닙니다.</p></details>`;
}
const DECODING_EVENTS = ['대치', '생략', '삽입', '순서 바꿈', '반복', '분절 후 합성', '자기수정', '무응답', '소음'];
const FLUENCY_EVENTS = ['대치', '단어 생략', '행 건너뜀', '삽입', '반복', '자기수정', '긴 멈춤', '도움 제공', '외부 방해'];

let state = {
  view: 'home', session: null, stream: null, recorder: null, chunks: [], timer: null,
  seconds: 0, taskQueue: [], taskIndex: 0, currentBlob: null, currentQuality: null,
  shownAt: null, recordingStartedAt: null
};

const uid = () => crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
const now = () => new Date().toISOString();
const esc = value => String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
const moduleName = module => module === 'decoding' ? '단어 해독' : '읽기 유창성';
const scoredResponses = session => (session.responses || []).filter(response => !response.practice);

function migrateSession(session) {
  session.schemaVersion ||= '0.2';
  session.responses = (session.responses || []).map(response => {
    response.ratings ||= {};
    if (response.rating && !response.ratings.A) {
      response.ratings.A = {
        raterSlot: 'A', raterId: 'legacy', transcript: response.transcript || '',
        itemScore: response.rating === 'CORRECT' ? 'CORRECT' : response.rating === 'INCORRECT' ? 'INCORRECT' : 'UNSCORABLE',
        events: response.events || [], uncertainty: false, notes: 'v0.1 기록에서 변환', ratingVersion: 'legacy-0.1', createdAt: response.reviewedAt || now()
      };
    }
    response.adjudication ||= null;
    return response;
  });
  return session;
}

function sessions() {
  try { return JSON.parse(localStorage.getItem('readingSessions') || '[]').map(migrateSession); }
  catch { return []; }
}

function saveSessions(value) { localStorage.setItem('readingSessions', JSON.stringify(value)); }
function upsertSession(session) {
  const list = sessions();
  const index = list.findIndex(item => item.id === session.id);
  if (index >= 0) list[index] = session; else list.unshift(session);
  saveSessions(list);
}

// ---------- 화면 이동과 브라우저 뒤로 가기 ----------
// 화면마다 주소(#이름)와 브라우저 기록을 남겨 브라우저 뒤로/앞으로 버튼과 화면 안의 '← 뒤로'가 같은 방식으로 동작한다.
// 진행 중인 검사(task)나 선별(screen)을 떠날 때는 확인을 받고, 새로고침 뒤에는 저장된 기록으로 돌아간다.
const SESSION_VIEWS = new Set(['mic', 'screen', 'route', 'task', 'complete']);
const ACTIVE_KEY = 'readingActiveSession';

function restoreActiveSession() {
  if (state.session) return state.session;
  const id = sessionStorage.getItem(ACTIVE_KEY);
  state.session = id ? sessions().find(session => session.id === id) || null : null;
  return state.session;
}

function canShow(view) {
  if (!document.getElementById(`${view}-template`)) return false;
  if (SESSION_VIEWS.has(view) && !restoreActiveSession()) return false;
  if (view === 'task' && !state.taskQueue.length) return false;
  if (view === 'preview' && !state.previewQueue) return false;
  return true;
}

function render(name, { history: mode = 'push' } = {}) {
  if (!canShow(name)) {
    // 새로고침 등으로 진행 상태가 사라졌으면 가장 가까운 안전한 화면으로 보낸다.
    name = name === 'task' && state.session ? 'route' : name === 'preview' && state.session ? 'complete' : 'home';
    if (!canShow(name)) name = 'home';
    mode = 'replace';
  }
  const depth = window.history.state?.depth || 0;
  if (mode === 'push' && name !== state.view) window.history.pushState({ view: name, depth: depth + 1 }, '', `#${name}`);
  else if (mode !== 'none') window.history.replaceState({ view: name, depth }, '', `#${name}`);
  if (state.session) sessionStorage.setItem(ACTIVE_KEY, state.session.id);
  state.view = name;
  const template = $(`#${name}-template`);
  app.innerHTML = '';
  app.append(template.content.cloneNode(true));
  app.focus();
  bindCommon();
  ({ home, setup, mic, screen, route, task, review, result, preview, report }[name] || (() => {}))();
}

function goBack() {
  if ((window.history.state?.depth || 0) > 0) window.history.back();
  else render('home');
}

function leaveGuard(from, to) {
  if (from === to) return true;
  if (from === 'task') {
    if (state.recorder?.state === 'recording' || state.taskIndex < state.taskQueue.length) {
      if (!confirm('검사를 중단하고 나갈까요? 지금까지 저장한 응답은 남습니다.')) return false;
      if (state.session) { state.session.status = 'INTERRUPTED'; state.session.updatedAt = now(); upsertSession(state.session); }
      state.taskQueue = [];
    }
    stopStream();
  }
  if (from === 'screen' && !confirm('선별을 중단할까요? 진행 중인 선별 응답은 저장되지 않습니다.')) return false;
  if (from === 'mic') stopStream();
  return true;
}

window.addEventListener('popstate', event => {
  const target = event.state?.view || location.hash.slice(1) || 'home';
  if (!leaveGuard(state.view, target)) {
    window.history.pushState({ view: state.view, depth: (event.state?.depth || 0) + 1 }, '', `#${state.view}`);
    return;
  }
  render(target, { history: 'none' });
});

function bindCommon() {
  $$('[data-action="home"]', app).forEach(button => button.onclick = () => { if (leaveGuard(state.view, 'home')) { stopStream(); render('home'); } });
  $$('[data-action="back"]', app).forEach(button => button.onclick = () => goBack());
  $$('[data-action="new-session"]', app).forEach(button => button.onclick = () => { state.setupMode = { mode: 'full' }; render('setup'); });
  $$('[data-action="new-module"]', app).forEach(button => button.onclick = () => { state.setupMode = { mode: 'module', module: button.dataset.module }; render('setup'); });
  $$('[data-action="open-review"]', app).forEach(button => button.onclick = () => render('review'));
  $$('[data-action="open-results"]', app).forEach(button => button.onclick = () => render('result'));
  $$('[data-action="open-report"]', app).forEach(button => button.onclick = () => render('report'));
}

function home() {
  const pending = sessions().filter(session => scoredResponses(session).some(response => !response.adjudication || ['UNPAIRED', 'NEEDS_CONSENSUS'].includes(response.adjudication.status))).length;
  const counter = $('#review-count');
  if (counter) counter.textContent = pending;
  bindImport($('#import-session-home'));
  $('#load-demo').onclick = () => {
    const demo = buildDemoSession();
    upsertSession(demo);
    sessionStorage.setItem('readingResultSession', demo.id);
    sessionStorage.setItem('readingReviewSession', demo.id);
    render('result');
  };
}

// 두 가지 실시 방식
// - full: 전체 흐름. 짧은 선별 → 경로 추천 → 세부검사 → 결과지 (실제 검사용 설계)
// - module: 모듈별 검사. 선별 없이 단어 해독 또는 읽기 유창성 하나만 실시하고 그 모듈의 결과지만 본다 (시연·모듈 검증용)
function setup() {
  const setupMode = state.setupMode || { mode: 'full' };
  if (setupMode.mode === 'module') {
    $('#setup-title').textContent = `${moduleName(setupMode.module)} 검사를 준비합니다`;
    $('#setup-route-note').innerHTML = `선별 없이 <b>${esc(moduleName(setupMode.module))}</b> 모듈만 실시하고, 끝나면 이 모듈의 결과지만 봅니다.`;
    $$('.stepper span').forEach((span, i) => { if (i === 1) span.textContent = '장치 점검'; });
    if (setupMode.module !== 'decoding') $('#random-order-row').classList.add('hidden');
  }
  $('#setup-form').onsubmit = event => {
    event.preventDefault();
    const form = new FormData(event.target);
    const moduleMode = setupMode.mode === 'module';
    // 전체 흐름이면 실시할 모듈과 경로는 선별 결과로 정한다 (screen → route).
    state.session = {
      id: uid(), participant: form.get('participant').trim(), ageBand: form.get('ageBand'), mode: setupMode.mode, modules: moduleMode ? [setupMode.module] : [], orderPolicy: form.get('randomOrder') ? 'random' : 'fixed', previewPaths: [],
      createdAt: now(), updatedAt: now(), screening: {}, responses: [], status: 'CREATED',
      formVersion: CONTENT_VERSION, policyVersion: POLICY_VERSION, ratingVersion: RATING_VERSION, pronunciationDictVersion: PRONUNCIATION_DICT_VERSION,
      sttModelVersion: 'not-connected', schemaVersion: '0.2',
      deviceMetadata: { userAgent: navigator.userAgent, platform: navigator.platform || 'unknown', language: navigator.language }
    };
    upsertSession(state.session);
    render('mic');
  };
}

async function getMic() {
  if (state.stream) return state.stream;
  if (!navigator.mediaDevices?.getUserMedia) throw new Error('이 브라우저는 마이크 녹음을 지원하지 않습니다.');
  state.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: false } });
  return state.stream;
}

function stopStream() {
  if (state.recorder?.state === 'recording') state.recorder.stop();
  if (state.stream) state.stream.getTracks().forEach(track => track.stop());
  state.stream = null;
  if (state.timer) clearInterval(state.timer);
  state.timer = null;
}

async function analyzeAudio(blob) {
  const fallback = { durationMs: Math.round((state.seconds || 0) * 1000), rms: null, peak: null, clipRatio: null, flags: ['분석 미완료'] };
  try {
    const context = new AudioContext();
    const buffer = await context.decodeAudioData(await blob.arrayBuffer());
    let sumSquares = 0, peak = 0, clipped = 0, samples = 0;
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const data = buffer.getChannelData(channel);
      for (let index = 0; index < data.length; index++) {
        const absolute = Math.abs(data[index]);
        sumSquares += data[index] * data[index];
        peak = Math.max(peak, absolute);
        if (absolute >= 0.98) clipped++;
      }
      samples += data.length;
    }
    await context.close();
    const rms = samples ? Math.sqrt(sumSquares / samples) : 0;
    const clipRatio = samples ? clipped / samples : 0;
    const flags = [];
    if (buffer.duration < 0.35) flags.push('지나치게 짧음');
    if (rms < 0.012) flags.push('입력 음량 매우 낮음');
    if (clipRatio > 0.01) flags.push('클리핑 후보');
    if (!flags.length) flags.push('기본 분석 가능');
    const speech = S.detectSpeech(buffer.getChannelData(0), buffer.sampleRate);
    if (speech.onsetMs == null) flags.push('발화 미탐지');
    return { durationMs: Math.round(buffer.duration * 1000), sampleRate: buffer.sampleRate, channels: buffer.numberOfChannels, rms: +rms.toFixed(4), peak: +peak.toFixed(4), clipRatio: +clipRatio.toFixed(5), flags, speech };
  } catch { return fallback; }
}

function mic() {
  let context, analyser, animation;
  const status = $('#mic-status');
  const button = $('#check-mic');
  button.onclick = async () => {
    button.disabled = true;
    $('#continue-screening').classList.add('hidden');
    status.textContent = '4초 동안 평소 목소리로 문장을 읽어 주세요.';
    try {
      const stream = await getMic();
      context ||= new AudioContext();
      const source = context.createMediaStreamSource(stream);
      analyser = context.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      const meterData = new Uint8Array(analyser.frequencyBinCount);
      $('#mic-orb').classList.add('listening');
      const draw = () => {
        analyser.getByteFrequencyData(meterData);
        const average = meterData.reduce((a, b) => a + b, 0) / meterData.length;
        $('#meter-fill').style.width = `${Math.min(100, average * 1.8)}%`;
        animation = requestAnimationFrame(draw);
      };
      draw();
      const chunks = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      const blobPromise = new Promise(resolve => recorder.onstop = () => resolve(new Blob(chunks, { type: recorder.mimeType || 'audio/webm' })));
      recorder.start(250);
      await new Promise(resolve => setTimeout(resolve, 4000));
      recorder.stop();
      const quality = await analyzeAudio(await blobPromise);
      state.session.deviceCheck = { checkedAt: now(), quality, provisionalThresholds: { rmsMin: 0.012, clipRatioMax: 0.01 } };
      state.session.status = 'READY';
      state.session.updatedAt = now();
      upsertSession(state.session);
      const blocking = quality.flags.some(flag => ['입력 음량 매우 낮음', '클리핑 후보', '지나치게 짧음'].includes(flag));
      status.innerHTML = blocking
        ? `<b>다시 점검해 주세요.</b> ${esc(quality.flags.join(', '))}`
        : `<b>점검 완료.</b> ${esc(quality.flags.join(', '))} · ${quality.sampleRate || '확인 불가'} Hz`;
      if (!blocking) $('#continue-screening').classList.remove('hidden');
      button.textContent = blocking ? '마이크 다시 확인' : '다시 점검';
    } catch (error) {
      status.textContent = `마이크 점검을 완료하지 못했습니다. ${error.message || '권한을 확인해 주세요.'}`;
    } finally { button.disabled = false; }
  };
  const moduleMode = state.session?.mode === 'module';
  if (moduleMode) $('#continue-screening').textContent = `${moduleName(state.session.modules[0])} 검사 시작`;
  $('#continue-screening').onclick = () => {
    if (animation) cancelAnimationFrame(animation);
    if (context) context.close();
    if (moduleMode) startTasks(state.session); else render('screen');
  };
}

// ---------- 짧은 공통 선별 (브리핑 v1.2 2장) ----------
// 1 단어 읽기: 검사자가 듣고 바로 정확/오류를 누른다 (DIBELS·BASA처럼 실시간 채점).
// 2 문장 읽기: 검사자가 읽기 시작·끝을 누르고, 틀린 어절을 누른다 → 정확도와 분당 정확 음절.
// 두 결과를 S.screeningDecision 규칙에 넣어 실시할 모듈과 모듈 안에서 중점 확인할 것(확인 포인트)을 정한다.
// 녹음하지 않으며 정밀 채점은 세부검사에서 녹음으로 한다.
function screen() {
  const content = stimuli.screening;
  const result = { words: [], sentence: null, startedAt: now() };
  const stage = $('#screen-stage');
  const mark = step => $$('#screen-steps li').forEach(li => li.classList.toggle('current', li.dataset.step === step));

  const words = (index = 0) => {
    mark('words');
    if (index >= content.words.length) return sentence();
    const item = content.words[index];
    const shownAt = performance.now();
    drawJourney('screen', index);
    stage.innerHTML = `<p class="eyebrow">선별 1 · 단어 읽기 ${index + 1} / ${content.words.length}</p>
      <p class="task-instruction">참여자: 화면의 낱말을 소리 내어 읽어 주세요. 처음 보는 낱말도 있어요.</p>
      <div class="stimulus word">${esc(item.text)}</div>
      <div class="examiner-panel"><span class="examiner-label">검사자 채점</span><span class="quiet">허용 발음 [${esc(item.accepted.join(', '))}]${item.rule ? ` · ${esc(item.rule)}` : ''}</span>
        <div class="button-row compact"><button class="primary" data-score="1">정확</button><button class="secondary" data-score="0">오류</button>${item.regularity === 'phonological' ? `<button class="secondary" data-score="0" data-spell="1">표기대로 읽음 (“${esc(item.text)}”)</button>` : ''}<button class="secondary" data-score="0" data-nr="1">무응답 (3초 이상)</button></div></div>`;
    $$('[data-score]', stage).forEach(button => button.onclick = () => {
      result.words.push({ id: item.id, text: item.text, lexicality: item.lexicality, regularity: item.regularity, correct: button.dataset.score === '1', noResponse: Boolean(button.dataset.nr), spellingRead: Boolean(button.dataset.spell), responseMs: Math.round(performance.now() - shownAt) });
      words(index + 1);
    });
  };

  const sentence = () => {
    mark('sentence');
    const tokens = S.tokenizePassage(content.sentence.text);
    const errors = new Set();
    let startedAt = null, timer = null;
    drawJourney('screen', content.words.length);
    stage.innerHTML = `<p class="eyebrow">선별 2 · 문장 읽기</p>
      <p class="task-instruction">참여자: 아래 글을 평소처럼 소리 내어 읽어 주세요.</p>
      <div class="stimulus passage screen-passage">${tokens.map(token => `<button type="button" class="token" data-token="${token.index}">${esc(token.surface)}</button>`).join(' ')}</div>
      <div class="examiner-panel"><span class="examiner-label">검사자</span><span class="quiet">첫 낱말을 읽기 시작하면 <b>시작</b>, 다 읽으면 <b>끝</b>. 틀리거나 건너뛴 어절은 눌러 표시합니다(반복·자기수정은 정답).</span>
        <div class="button-row compact"><button class="primary" id="sentence-start">시작</button><button class="secondary" id="sentence-stop" disabled>끝</button><span id="sentence-time" class="marker-chip">0.0초</span></div></div>`;
    $$('.token', stage).forEach(button => button.onclick = () => {
      const index = +button.dataset.token;
      errors.has(index) ? errors.delete(index) : errors.add(index);
      button.classList.toggle('mark-sub', errors.has(index));
    });
    $('#sentence-start').onclick = () => {
      startedAt = performance.now();
      $('#sentence-start').disabled = true; $('#sentence-stop').disabled = false;
      timer = setInterval(() => { $('#sentence-time').textContent = `${((performance.now() - startedAt) / 1000).toFixed(1)}초`; }, 100);
    };
    $('#sentence-stop').onclick = () => {
      clearInterval(timer);
      const ms = performance.now() - startedAt;
      const marks = Object.fromEntries([...errors].map(index => [index, { mark: 'sub', flags: [] }]));
      const metrics = S.computeFluency({ tokens, marks, onsetMs: 0, endMs: ms });
      result.sentence = { id: content.sentence.id, errors: [...errors].sort((x, y) => x - y), seconds: +(ms / 1000).toFixed(2),
        attemptedEojeol: metrics.attemptedEojeol, correctEojeol: metrics.correctEojeol, attemptedSyllables: metrics.attemptedSyllables, correctSyllables: metrics.correctSyllables };
      finish();
    };
  };

  const finish = () => {
    const decision = S.screeningDecision({ ...result, ageBand: state.session.ageBand });
    state.session.screening = { ...result, finishedAt: now(), contentVersion: 'screening-form-0.2', decision };
    state.session.modules = [...decision.modules];
    state.session.previewPaths = [...decision.paths];
    state.session.updatedAt = now();
    upsertSession(state.session);
    render('route');
  };

  words();
}

// ---------- 진행 표시 ----------
// 참여자가 "어디까지 왔고 얼마나 남았는지" 알 수 있게 전체 단계와 남은 문항·대략 시간을 보여 준다.
// 시간은 문항 종류별 대략값(단어 6초, 문장 30초, 지문 70초, 미리보기 20초)으로 추정한 안내용이다.
function journeyStages(session) {
  const modules = session?.modules || [];
  const previews = PREVIEW_SUBTESTS.filter(subtest => (session?.previewPaths || []).includes(subtest.pathId)).length;
  const stages = session?.mode === 'module' ? [] : [{ key: 'screen', label: '선별', count: stimuli.screening.words.length + 1, sec: stimuli.screening.words.length * 6 + 30 }];
  if (modules.includes('decoding')) stages.push({ key: 'decoding', label: '단어 해독', count: stimuli.decodingPractice.length + stimuli.decoding.length, sec: (stimuli.decodingPractice.length + stimuli.decoding.length) * 6 });
  if (modules.includes('fluency')) stages.push({ key: 'fluency', label: '읽기 유창성', count: stimuli.fluencyPractice.length + stimuli.fluency.length, sec: 20 + stimuli.fluency.length * 70 });
  if (previews) stages.push({ key: 'preview', label: '다른 영역 둘러보기', count: previews, sec: previews * 20 });
  return stages;
}

function drawJourney(stageKey, position) {
  const box = $('#journey');
  if (!box) return;
  const stages = journeyStages(state.session);
  // 선별 단계에서는 아직 모듈이 정해지지 않았으므로 선별만 보여 준다.
  const list = stageKey === 'screen' && !(state.session?.modules || []).length ? stages.slice(0, 1) : stages;
  const at = list.findIndex(stage => stage.key === stageKey);
  const total = list.reduce((sum, stage) => sum + stage.count, 0);
  const done = list.slice(0, Math.max(at, 0)).reduce((sum, stage) => sum + stage.count, 0) + position;
  const current = list[at] || list[0];
  const remainingSec = list.slice(at + 1).reduce((sum, stage) => sum + stage.sec, 0) + Math.max(0, current.sec * (1 - position / current.count));
  const minutes = Math.max(1, Math.round(remainingSec / 60));
  const pending = stageKey === 'screen' && list.length === 1 ? `<li><span>2</span>세부검사 (선별 결과로 결정)</li>` : '';
  box.innerHTML = `<ol class="journey-steps">${list.map((stage, i) => `<li class="${i < at ? 'done' : i === at ? 'current' : ''}"><span>${i < at ? '✓' : i + 1}</span>${esc(stage.label)}</li>`).join('')}${pending}<li class="${at === list.length ? 'current' : ''}"><span>★</span>완료</li></ol>
    <div class="journey-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${done}"><span style="width:${Math.round(done / total * 100)}%"></span></div>
    <p class="journey-text"><b>${esc(current.label)} ${Math.min(position + 1, current.count)} / ${current.count}</b> · 전체 ${Math.round(done / total * 100)}% 진행 · ${stageKey === 'screen' && list.length === 1 ? '선별 ' : ''}남은 시간 약 ${minutes}분</p>`;
}

function screeningSummaryHtml(screening) {
  const d = screening?.decision;
  if (!d) return '<p class="quiet">선별 기록 없음 (이전 형식 기록)</p>';
  const m = d.measures, c = m.cells || {};
  const cell = x => x && x.n ? `${x.hit}/${x.n}` : '–';
  const tag = list => list.length ? `<span class="tag core">추가 확인</span>` : '<span class="tag off">통과</span>';
  const focus = d.focus || [];
  return `<div class="table-wrap"><table class="item-table"><thead><tr><th>선별 축</th><th>측정값</th><th>임시 기준</th><th>결과</th></tr></thead><tbody>
    <tr><td>기초 해독 · 단어 ${m.wordN}개</td><td>${m.wordHit}/${m.wordN} 정확 · 실제 ${cell(c.real)} · 비단어 ${cell(c.nonword)} · 표기 일치 ${cell(c.consistent)} · 음운변동 ${cell(c.phonological)}</td><td class="quiet">하나라도 오류 → A 단어 해독</td><td>${tag(d.flags.A)}</td></tr>
    <tr><td>유창성 · 문장 낭독</td><td>${m.sentenceAccuracy != null ? `어절 정확도 ${m.sentenceAccuracy}% · 분당 정확 음절 ${m.sentenceRate}` : '–'}</td><td class="quiet">정확도 ${S.SCREENING_CONFIG.sentenceMinAccuracy}% 미만 → A·B · 속도 ${m.rateFloor} 미만(${esc(d.ageBand)}) → B</td><td>${tag(d.flags.B)}</td></tr>
  </tbody></table></div>
  <div class="focus-list"><h4>세부검사에서 중점 확인할 것</h4>${focus.length ? `<ul>${focus.map(f => `<li><span class="tag ${f.module === 'decoding' ? 'core' : 'preview'}">${f.module === 'decoding' ? 'A 단어 해독' : 'B 유창성'}</span> <b>${esc(f.label)}</b> <span class="quiet">— 선별 신호: ${esc(f.reason)} · 세부검사에서 볼 것: ${esc(f.check)}</span></li>`).join('')}</ul>` : '<p class="quiet">선별에서 추가 확인 신호가 없습니다. 필요하면 아래 경로를 직접 켜서 세부검사를 실시할 수 있습니다.</p>'}</div>`;
}

function route() {
  const session = state.session;
  const decision = session.screening?.decision;
  $('#screen-summary').innerHTML = screeningSummaryHtml(session.screening);
  $('#rule-version').textContent = decision?.ruleVersion || '–';
  const recommended = new Set(decision?.paths || []);
  const draw = () => {
    const selected = new Set($$('[name=routePath]:checked').map(box => box.value));
    const chosen = selected.size || $$('[name=routePath]').length ? selected : recommended;
    $('#route-summary').innerHTML = PLATFORM_PATHS.map(path => {
      const on = chosen.has(path.id);
      const reasons = decision?.flags?.[path.id] || [];
      const subtests = path.subtests.map(subtest => {
        const tag = !on ? '<span class="tag off">건너뜀</span>' : subtest.status === 'core' ? '<span class="tag core">실시·채점</span>' : '<span class="tag preview">화면 미리보기</span>';
        return `<li class="${on ? '' : 'dim'}"><span>${esc(subtest.title)}</span>${tag}</li>`;
      }).join('');
      return `<article class="path-card path-${path.id} ${on ? 'on' : 'off'}"><label class="path-toggle"><input type="checkbox" name="routePath" value="${path.id}" ${on ? 'checked' : ''}> 경로 ${path.id}${recommended.has(path.id) ? ' · <b>선별 추천</b>' : ''}</label><h3>${esc(path.title)}</h3><p class="quiet">${reasons.length ? esc(reasons.join(' / ')) : ['C', 'D'].includes(path.id) ? '이번 선별 범위 밖 (두 핵심 모듈 우선). 켜면 화면 미리보기만 진행' : '선별에서 추가 확인 신호 없음'}</p><ul>${subtests}</ul></article>`;
    }).join('');
    $$('[name=routePath]').forEach(box => box.onchange = draw);
    const none = !chosen.size;
    $('#start-assessment').disabled = none;
    $('#start-assessment').textContent = none ? '추가 확인이 필요한 경로 없음' : '세부검사 시작';
  };
  draw();
  $('#tour-previews').onclick = () => startPreviews(PREVIEW_SUBTESTS, 'route');
  $('#start-assessment').onclick = () => {
    const chosen = $$('[name=routePath]:checked').map(box => box.value);
    // 검사자 조정은 추천과 다른 경로만 기록한다.
    session.routing = { recommended: [...recommended], final: chosen,
      added: chosen.filter(id => !recommended.has(id)), removed: [...recommended].filter(id => !chosen.includes(id)), decidedAt: now() };
    session.modules = [chosen.includes('A') ? 'decoding' : null, chosen.includes('B') ? 'fluency' : null].filter(Boolean);
    session.previewPaths = chosen;
    upsertSession(session);
    if (!session.modules.length) return startPreviews(PREVIEW_SUBTESTS.filter(subtest => chosen.includes(subtest.pathId)), 'complete');
    startTasks(session);
  };
}

function startTasks(session) {
  const modules = session.modules;
  state.taskQueue = [];
  // 연습은 항상 먼저. 본검사 순서는 설정에 따라 고정 또는 무작위이며, 실제 제시 순서를 세션에 저장한다.
  const mainItems = [...stimuli.decoding];
  if (session.orderPolicy === 'random') for (let i = mainItems.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [mainItems[i], mainItems[j]] = [mainItems[j], mainItems[i]]; }
  if (modules.includes('decoding')) state.taskQueue.push(...[...stimuli.decodingPractice, ...mainItems].map(item => ({ ...item, module: 'decoding' })));
  if (modules.includes('fluency')) state.taskQueue.push(...[...stimuli.fluencyPractice, ...stimuli.fluency].map(item => ({ ...item, module: 'fluency' })));
  state.taskIndex = 0;
  session.presentationOrder = state.taskQueue.map(item => item.id);
  session.status = 'IN_PROGRESS';
  session.startedAt = now();
  upsertSession(session);
  render('task');
}

async function saveBlob(key, blob) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ReadingPrototypeDB', 2);
    request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains('audio')) request.result.createObjectStore('audio'); };
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const database = request.result;
      const transaction = database.transaction('audio', 'readwrite');
      transaction.objectStore('audio').put(blob, key);
      transaction.oncomplete = () => { database.close(); resolve(); };
      transaction.onerror = () => reject(transaction.error);
    };
  });
}

async function getBlob(key) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ReadingPrototypeDB', 2);
    request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains('audio')) request.result.createObjectStore('audio'); };
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const database = request.result;
      const transaction = database.transaction('audio', 'readonly');
      const query = transaction.objectStore('audio').get(key);
      query.onsuccess = () => { database.close(); resolve(query.result); };
      query.onerror = () => reject(query.error);
    };
  });
}

function formatTime(value) {
  const seconds = Math.max(0, Math.floor(Number(value) || 0));
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

function task() {
  const item = state.taskQueue[state.taskIndex];
  state.currentBlob = null;
  state.currentQuality = null;
  state.seconds = 0;
  state.shownAt = now();
  $('#task-name').textContent = `${moduleName(item.module)}${item.practice ? ' · 연습' : ''}`;
  $('#task-progress').textContent = `${state.taskIndex + 1} / ${state.taskQueue.length}`;
  const sameModule = state.taskQueue.filter(task => task.module === item.module);
  drawJourney(item.module, sameModule.indexOf(state.taskQueue[state.taskIndex]));
  $('#practice-banner').classList.toggle('hidden', !item.practice);
  $('#task-tags').innerHTML = [item.id, item.kind, item.condition, item.rule].filter(Boolean).map(tag => `<span>${esc(tag)}</span>`).join('');
  const stimulus = $('#stimulus');
  stimulus.textContent = item.text;
  stimulus.className = `stimulus ${item.module === 'decoding' ? 'word' : 'passage'}`;
  $('#task-instruction').textContent = item.module === 'decoding' ? '화면의 글자열을 한 번 소리 내어 읽어주세요.' : '글을 처음부터 끝까지 소리 내어 읽어주세요. 60초가 지나도 끝까지 계속 읽습니다.';
  $('#quit-task').onclick = () => {
    if (confirm('현재까지 저장한 응답은 남겨두고 검사를 중단할까요?')) {
      state.session.status = 'INTERRUPTED';
      state.session.updatedAt = now();
      upsertSession(state.session);
      stopStream();
      state.taskQueue = [];
      render('home');
    }
  };
  let recording = false;
  const recordButton = $('#record-button');
  const nextButton = $('#next-task');
  const retryButton = $('#retry-task');
  recordButton.onclick = async () => {
    if (!recording) {
      try {
        const stream = await getMic();
        state.chunks = [];
        state.recorder = new MediaRecorder(stream);
        state.recorder.ondataavailable = event => { if (event.data.size) state.chunks.push(event.data); };
        state.recorder.onstop = async () => {
          state.currentBlob = new Blob(state.chunks, { type: state.recorder.mimeType || 'audio/webm' });
          state.currentQuality = await analyzeAudio(state.currentBlob);
          const playback = $('#playback');
          playback.src = URL.createObjectURL(state.currentBlob);
          playback.classList.remove('hidden');
          nextButton.classList.remove('hidden');
          retryButton.classList.remove('hidden');
          const quality = $('#quality-summary');
          quality.classList.remove('hidden');
          const speech = state.currentQuality.speech;
          const speechText = speech?.onsetMs != null ? ` · 발화 시작 ${(speech.onsetMs / 1000).toFixed(2)}초 · 발화 길이 ${((speech.offsetMs - speech.onsetMs) / 1000).toFixed(1)}초${speech.pauses.length ? ` · 긴 멈춤 ${speech.pauses.length}회` : ''}` : '';
          quality.innerHTML = `<b>음질·발화 후보</b><span>${esc(state.currentQuality.flags.join(' · ') + speechText)}</span><small>자동 품질값은 최종 판정이 아닙니다.</small>`;
        };
        state.recordingStartedAt = now();
        state.recorder.start(250);
        recording = true;
        recordButton.classList.add('stop');
        $('#record-dot').classList.add('live');
        $('#record-label').textContent = '녹음 중';
        $('#record-help').textContent = '읽기가 끝나면 버튼을 다시 누르세요.';
        state.timer = setInterval(() => {
          state.seconds++;
          $('#record-time').textContent = formatTime(state.seconds);
          if (item.module === 'fluency' && state.seconds === 60) $('#record-help').textContent = '60초 지점을 기록했습니다. 글 끝까지 계속 읽어주세요.';
        }, 1000);
      } catch {
        alert('마이크 권한이 필요합니다. 장치 권한을 확인한 뒤 다시 시도해 주세요.');
      }
    } else {
      state.recorder.stop();
      recording = false;
      clearInterval(state.timer);
      state.timer = null;
      recordButton.classList.remove('stop');
      $('#record-dot').classList.remove('live');
      $('#record-label').textContent = '녹음 완료';
      $('#record-help').textContent = '재생해 확인하거나 다시 녹음할 수 있습니다.';
    }
  };
  retryButton.onclick = () => {
    state.currentBlob = null;
    state.currentQuality = null;
    state.seconds = 0;
    state.recordingStartedAt = null;
    $('#record-time').textContent = '00:00';
    $('#playback').classList.add('hidden');
    nextButton.classList.add('hidden');
    retryButton.classList.add('hidden');
    $('#quality-summary').classList.add('hidden');
    $('#record-label').textContent = '다시 녹음 준비';
    $('#record-help').textContent = '버튼을 눌러 새 녹음을 시작하세요.';
  };
  nextButton.onclick = async () => {
    nextButton.disabled = true;
    const responseId = uid();
    const audioKey = `${state.session.id}-${responseId}`;
    try {
      await saveBlob(audioKey, state.currentBlob);
      state.session.responses.push({
        id: responseId, stimulusId: item.id, module: item.module, target: item.text, expected: item.accepted?.[0] || item.expected || '', kind: item.kind,
        condition: item.condition || '', rule: item.rule || '', practice: Boolean(item.practice), audioKey,
        presentationIndex: state.taskIndex, orderPolicy: state.session.orderPolicy || 'fixed',
        stimulusShownAt: state.shownAt, recordingStartedAt: state.recordingStartedAt, recordingStoppedAt: now(),
        durationMs: state.currentQuality?.durationMs || state.seconds * 1000, first60Reached: item.module === 'fluency' && state.seconds >= 60,
        accepted: item.accepted || [], lexicality: item.lexicality || '', regularity: item.regularity || '', reviewNote: item.reviewNote || '', passageMeta: item.meta || null,
        quality: state.currentQuality,
        machineAnalysis: {
          status: state.currentQuality?.speech ? 'VAD_ONLY' : 'NOT_CONNECTED', transcript: '', candidate: null, modelVersion: 'energy-vad', configVersion: S.SCORING_CONFIG.version,
          speechOnsetMs: state.currentQuality?.speech?.onsetMs ?? null, speechOffsetMs: state.currentQuality?.speech?.offsetMs ?? null, pauses: state.currentQuality?.speech?.pauses || [],
          // 제시 후 첫 발화까지: (녹음 시작 - 제시) + 녹음 안의 발화 시작
          onsetLatencyMs: state.currentQuality?.speech?.onsetMs != null && state.recordingStartedAt ? new Date(state.recordingStartedAt) - new Date(state.shownAt) + state.currentQuality.speech.onsetMs : null
        },
        ratings: {}, adjudication: null, createdAt: now()
      });
      state.session.updatedAt = now();
      upsertSession(state.session);
      state.taskIndex++;
      if (state.taskIndex < state.taskQueue.length) render('task');
      else {
        stopStream();
        state.taskQueue = [];
        state.session.status = 'REVIEW_PENDING';
        state.session.submittedAt = now();
        sessionStorage.setItem('readingReviewSession', state.session.id);
        sessionStorage.setItem('readingResultSession', state.session.id);
        state.session.updatedAt = now();
        upsertSession(state.session);
        const previews = PREVIEW_SUBTESTS.filter(subtest => (state.session.previewPaths || []).includes(subtest.pathId));
        if (previews.length) startPreviews(previews, 'complete'); else render('complete');
      }
    } catch {
      nextButton.disabled = false;
      alert('녹음을 저장하지 못했습니다. 이 화면을 닫지 말고 다시 시도해 주세요.');
    }
  };
}

function numberOrNull(value) { return value === '' || value == null ? null : Number(value); }
const pct = (part, whole) => whole ? `${Math.round(part / whole * 100)}%` : '–';
const seconds1 = ms => ms == null ? '–' : `${(ms / 1000).toFixed(2)}초`;

// ---------- 나머지 경로 화면 미리보기 (채점·저장 안 함) ----------
function startPreviews(list, returnTo) {
  state.previewQueue = list;
  state.previewIndex = 0;
  state.previewReturn = returnTo;
  render('preview');
}

function preview() {
  const list = state.previewQueue || PREVIEW_SUBTESTS;
  state.previewIndex ||= 0;
  const item = list[state.previewIndex];
  const finish = () => {
    if (state.session && state.previewReturn === 'complete') {
      state.session.previewLog = list.map(subtest => subtest.id);
      upsertSession(state.session);
    }
    render(state.previewReturn === 'complete' ? 'complete' : state.previewReturn === 'route' && state.session ? 'route' : 'home');
  };
  $('#preview-path').textContent = `경로 ${item.pathId} · ${item.pathTitle}`;
  $('#preview-progress').textContent = `미리보기 ${state.previewIndex + 1} / ${list.length}`;
  if (state.previewReturn === 'complete') drawJourney('preview', state.previewIndex); else $('#journey')?.remove();
  $('#preview-title').textContent = item.title;
  $('#preview-instruction').textContent = item.sample.instruction;
  $('#preview-stimulus').textContent = item.sample.prompt;
  $('#preview-options').innerHTML = item.sample.options.map(option => `<button type="button" class="secondary option">${esc(option)}</button>`).join('');
  $$('#preview-options .option').forEach(button => button.onclick = () => { $$('#preview-options .option').forEach(other => other.classList.remove('chosen')); button.classList.add('chosen'); });
  $('#preview-meta').innerHTML = `<div><small>저장할 원자료(구현 시)</small><b>${esc(item.measure)}</b></div><div><small>결과지 연결</small><b>${esc(item.report)}</b></div><div><small>설계 근거</small><b>${esc(item.basis || '')}</b></div>`;
  $('#preview-prev').disabled = !state.previewIndex;
  $('#preview-prev').onclick = () => { state.previewIndex--; render('preview'); };
  $('#preview-next').textContent = state.previewIndex === list.length - 1 ? '미리보기 마치기' : '다음';
  $('#preview-next').onclick = () => { if (state.previewIndex === list.length - 1) finish(); else { state.previewIndex++; render('preview'); } };
  $('#preview-exit').onclick = finish;
}

// ---------- 기기 안 음성인식 ----------
async function getAsr() { return window.ReadingAsrOverride || import('./asr.js'); }

// 한 응답에 ASR을 돌리고 후처리(제한 후보 선택 또는 지문 정렬)까지 machineAnalysis에 저장한다.
async function analyzeResponseWithAsr(session, response, onProgress) {
  const blob = response.audioKey ? await getBlob(response.audioKey) : null;
  if (!blob) return false;
  const asr = await (await getAsr()).transcribe(blob, onProgress);
  response.machineAnalysis ||= {};
  response.machineAnalysis.asr = asr;
  response.machineAnalysis.status = 'ASR_CANDIDATE';
  response.machineAnalysis.modelVersion = `${asr.model} (${asr.library})`;
  if (response.module === 'decoding') {
    response.machineAnalysis.constrained = S.constrainedDecodingChoice(asr.text, { text: response.target, accepted: response.accepted, expected: response.expected });
  } else {
    response.machineAnalysis.alignment = S.alignWordsToPassage(S.tokenizePassage(response.target), asr.words);
  }
  session.sttModelVersion = response.machineAnalysis.modelVersion;
  return true;
}

function review() {
  const list = sessions().filter(session => session.responses?.length);
  const sessionSelect = $('#session-select');
  bindImport($('#import-session'));
  if (!list.length) { $('#review-empty').classList.remove('hidden'); return; }
  $('#review-content').classList.remove('hidden');
  sessionSelect.innerHTML = list.map(session => `<option value="${session.id}">${esc(session.participant)}${session.demo ? ' (예시)' : ''} · ${new Date(session.createdAt).toLocaleDateString('ko-KR')}</option>`).join('');
  const preferred = sessionStorage.getItem('readingReviewSession');
  if (preferred && list.some(session => session.id === preferred)) sessionSelect.value = preferred;
  const slot = $('#rater-slot');
  const raterId = $('#rater-id');
  let current = 0;
  raterId.value = localStorage.getItem(`readingRater${slot.value}`) || '';
  slot.onchange = () => { raterId.value = localStorage.getItem(`readingRater${slot.value}`) || ''; drawSession(); };
  raterId.onchange = () => localStorage.setItem(`readingRater${slot.value}`, raterId.value.trim());
  $('#export-session').onclick = () => exportSession(list.find(session => session.id === sessionSelect.value) || list[0]);
  $('#open-session-result').onclick = () => { sessionStorage.setItem('readingResultSession', sessionSelect.value); render('result'); };
  $('#run-asr').onclick = async () => {
    const session = list.find(item => item.id === sessionSelect.value) || list[0];
    const status = $('#asr-status');
    const button = $('#run-asr');
    const targets = session.responses.filter(response => response.audioKey && response.machineAnalysis?.asr?.status !== 'DONE');
    status.classList.remove('hidden');
    if (!targets.length) { status.textContent = session.demo ? '예시 기록에는 원음성이 없어 AI 분석을 할 수 없습니다.' : '모든 녹음에 AI 분석이 이미 있습니다.'; return; }
    button.disabled = true;
    let done = 0;
    try {
      for (const response of targets) {
        status.textContent = `AI 분석 ${done + 1} / ${targets.length}: ${response.stimulusId} · 처음 한 번은 모델(약 80MB)을 내려받습니다.`;
        await analyzeResponseWithAsr(session, response, message => { status.textContent = `AI 분석 ${done + 1} / ${targets.length}: ${message}`; });
        done++;
        upsertSession(session);
      }
      status.textContent = `AI 분석 완료: ${done}개 녹음. 각 문항의 ‘AI 후보’ 칸에서 확인하세요. 점수는 사람이 확정합니다.`;
    } catch (error) {
      status.textContent = `AI 분석을 마치지 못했습니다 (${done}개 완료). ${error.message || error} · 인터넷 연결(jsdelivr.net, huggingface.co)을 확인하세요. 사람 채점은 그대로 할 수 있습니다.`;
    } finally { button.disabled = false; drawSession(); }
  };
  function drawSession() {
    const session = list.find(item => item.id === sessionSelect.value) || list[0];
    sessionStorage.setItem('readingReviewSession', session.id);
    if (current >= session.responses.length) current = 0;
    const navigation = $('#response-list');
    navigation.innerHTML = session.responses.map((response, index) => {
      const a = response.ratings?.A ? 'A✓' : 'A–';
      const b = response.ratings?.B ? 'B✓' : 'B–';
      const status = response.practice ? '연습' : adjudicationLabel(response.adjudication?.status);
      const done = response.adjudication && !['UNPAIRED', 'NEEDS_CONSENSUS'].includes(response.adjudication.status);
      return `<button class="response-item ${index === current ? 'active' : ''}" data-i="${index}"><b>${esc(response.stimulusId)} · ${moduleName(response.module)}</b><small>${esc(response.target.slice(0, 24))}${response.target.length > 24 ? '…' : ''}</small><small class="${done ? 'reviewed' : ''}">${a} ${b} · ${status}</small></button>`;
    }).join('');
    $$('.response-item', navigation).forEach(button => button.onclick = () => {
      current = +button.dataset.i;
      $$('.response-item', navigation).forEach(item => item.classList.remove('active'));
      button.classList.add('active');
      drawDetail(session, current, slot.value, raterId.value.trim(), drawSession);
    });
    drawDetail(session, current, slot.value, raterId.value.trim(), drawSession);
  }
  sessionSelect.onchange = () => { current = 0; drawSession(); };
  drawSession();
}

function adjudicationLabel(status) {
  return ({ AGREE: '일치', CONSENSUS: '합의', EXPERT_PENDING: '전문가 보류', INVALID_AUDIO: '음성 무효', NEEDS_CONSENSUS: '불일치', UNPAIRED: '독립 채점 중', PROVISIONAL: '잠정(1인 채점)' })[status] || '채점 전';
}

function eventInputs(events, checked = []) {
  return events.map(event => `<label><input type="checkbox" name="rating-event" value="${esc(event)}" ${checked.includes(event) ? 'checked' : ''}><span>${esc(event)}</span></label>`).join('');
}
function scoreRadio(value, current, label) {
  return `<label><input type="radio" name="item-score" value="${value}" ${current === value ? 'checked' : ''}><span>${label}</span></label>`;
}
function attemptSelect(id, value, label) {
  return `<label>${label}<select id="${id}"><option value="">미정</option><option value="CORRECT" ${value === 'CORRECT' ? 'selected' : ''}>정확</option><option value="INCORRECT" ${value === 'INCORRECT' ? 'selected' : ''}>오류</option></select></label>`;
}

// ---------- 파형 ----------
// markers: [{ key, label, ms, draggable, tone }], onChange(key, ms)
async function mountWaveform(host, { blob, durationMs, markers = [], pauses = [], ticks = [], audio, onChange }) {
  host.innerHTML = '<canvas class="waveform-canvas" height="120"></canvas><div class="waveform-legend"></div>';
  const canvas = $('canvas', host);
  const legend = $('.waveform-legend', host);
  let peaks = [];
  let total = durationMs || 1;
  if (blob) {
    try {
      const context = new AudioContext();
      const buffer = await context.decodeAudioData(await blob.arrayBuffer());
      await context.close();
      peaks = S.waveformPeaks(buffer.getChannelData(0), 700);
      total = Math.round(buffer.duration * 1000) || total;
    } catch { /* 파형을 그리지 못해도 마커는 표시 */ }
  }
  const colors = { onset: '#14877e', sixty: '#9b6500', end: '#a33a3a' };
  const dpr = window.devicePixelRatio || 1;
  let drag = null;
  const xOf = ms => ms / total * canvas.width;
  const msOf = clientX => {
    const rect = canvas.getBoundingClientRect();
    return Math.max(0, Math.min(total, Math.round((clientX - rect.left) / rect.width * total)));
  };
  function draw() {
    const width = canvas.clientWidth * dpr;
    if (canvas.width !== width) canvas.width = width;
    canvas.height = 120 * dpr;
    const ctx = canvas.getContext('2d');
    const h = canvas.height, mid = h / 2;
    ctx.clearRect(0, 0, canvas.width, h);
    ctx.fillStyle = '#f4f7fa'; ctx.fillRect(0, 0, canvas.width, h);
    ctx.fillStyle = 'rgba(155,101,0,.14)';
    for (const pause of pauses) ctx.fillRect(xOf(pause.startMs), 0, xOf(pause.endMs) - xOf(pause.startMs), h);
    const max = Math.max(0.05, ...peaks);
    ctx.fillStyle = '#16365d';
    const barWidth = canvas.width / Math.max(1, peaks.length);
    peaks.forEach((peak, index) => { const bar = peak / max * (mid - 6); ctx.fillRect(index * barWidth, mid - bar, Math.max(1, barWidth - 0.5), bar * 2 || 1); });
    if (!peaks.length) { ctx.fillStyle = '#627087'; ctx.font = `${13 * dpr}px sans-serif`; ctx.fillText(blob ? '파형을 읽지 못했습니다' : '음성 없음 (예시 자료)', 12 * dpr, 22 * dpr); }
    for (const marker of markers) {
      if (marker.ms == null) continue;
      const x = xOf(marker.ms);
      ctx.fillStyle = colors[marker.key] || '#14877e';
      ctx.fillRect(x - dpr, 0, 2 * dpr, h);
      ctx.fillRect(x - 5 * dpr, 0, 10 * dpr, 10 * dpr);
    }
    ctx.fillStyle = '#7b3fa0';
    for (const tick of ticks) { const x = xOf(tick.timeMs); ctx.fillRect(x - dpr / 2, h - 26 * dpr, dpr, 26 * dpr); ctx.beginPath(); ctx.arc(x, h - 26 * dpr, 4 * dpr, 0, Math.PI * 2); ctx.fill(); }
    if (audio && !audio.paused) {
      ctx.fillStyle = '#e04f4f';
      ctx.fillRect(xOf(audio.currentTime * 1000) - dpr / 2, 0, dpr, h);
      requestAnimationFrame(draw);
    }
    legend.innerHTML = markers.filter(marker => marker.ms != null).map(marker => `<span class="marker-chip ${marker.key}">${esc(marker.label)} ${(marker.ms / 1000).toFixed(2)}초${marker.draggable ? ' ↔' : ''}</span>`).join('') + (pauses.length ? `<span class="marker-chip pause">긴 멈춤 후보 ${pauses.length}곳</span>` : '') + `<span class="quiet">전체 ${(total / 1000).toFixed(1)}초 · 파형을 누르면 그 지점부터 재생</span>`;
  }
  canvas.onpointerdown = event => {
    const ms = msOf(event.clientX);
    const near = markers.filter(marker => marker.draggable && marker.ms != null)
      .map(marker => ({ marker, gap: Math.abs(xOf(marker.ms) - xOf(ms)) / dpr })).sort((x, y) => x.gap - y.gap)[0];
    if (near && near.gap < 12 * (canvas.width / dpr / canvas.clientWidth || 1) + 8) { drag = near.marker; canvas.setPointerCapture(event.pointerId); return; }
    if (audio?.src) { audio.currentTime = ms / 1000; audio.play(); }
  };
  canvas.onpointermove = event => { if (!drag) return; drag.ms = msOf(event.clientX); draw(); };
  canvas.onpointerup = () => { if (drag) { onChange?.(drag.key, drag.ms); drag = null; draw(); } };
  if (audio) audio.onplay = () => requestAnimationFrame(draw);
  draw();
  return { draw, total: () => total, setTicks(next) { ticks = next; draw(); }, setMarker(key, ms) { const marker = markers.find(item => item.key === key); if (marker) { marker.ms = ms; draw(); } } };
}

function playSegment(audio, startMs, endMs) {
  if (!audio?.src) return;
  audio.currentTime = Math.max(0, startMs / 1000);
  audio.play();
  const stopAt = endMs / 1000;
  const guard = () => { if (audio.currentTime >= stopAt) { audio.pause(); audio.removeEventListener('timeupdate', guard); } };
  audio.addEventListener('timeupdate', guard);
}

// ---------- 단어 해독 후보 표시 ----------
function candidateHtml(response, transcript) {
  if (!String(transcript || '').trim()) return '<p class="quiet">원음성을 듣고 전사를 입력하면 음절 위치별 오류 후보가 여기에 나타납니다.</p>';
  const candidate = S.decodingCandidate({ text: response.target, accepted: response.accepted?.length ? response.accepted : (response.expected ? [response.expected] : []), rule: response.rule }, transcript);
  if (candidate.status === 'NO_RESPONSE') return '<div class="candidate-summary"><b>무응답 후보</b></div>';
  const attempts = candidate.attempts.map((attempt, index) => {
    const cells = attempt.ops.map(op => {
      const cls = op.op === 'match' ? 'ok' : op.op;
      const top = op.target || '＋';
      const bottom = op.actual || '∅';
      const note = op.op === 'sub' ? op.jamo.map(diff => `${diff.label} ${diff.from}→${diff.to}`).join(', ') : op.op === 'del' ? '생략' : op.op === 'ins' ? '삽입' : '';
      return `<div class="syl ${cls}" title="${esc(note)}"><span>${esc(top)}</span><b>${esc(bottom)}</b><small>${op.target ? `${op.position}음절` : ''}${note ? `<br>${esc(note)}` : ''}</small></div>`;
    }).join('');
    const label = candidate.attempts.length > 1 ? (index === 0 ? '첫 시도' : index === candidate.attempts.length - 1 ? '최종 시도' : `${index + 1}번째 시도`) : '시도';
    return `<div class="attempt-row"><div class="attempt-label"><b>${label}</b><small>“${esc(attempt.raw)}” vs [${esc(attempt.form || '')}]</small><span class="state-pill ${attempt.correct ? 'agree' : 'needs_consensus'}">${attempt.correct ? '허용 발음 일치' : `차이 ${attempt.distance}`}</span></div><div class="syl-row">${cells}</div></div>`;
  }).join('');
  const suggestion = candidate.suggestion;
  return `${attempts}<div class="candidate-summary"><div><b>자동 후보</b> 판정 ${suggestion.itemScore === 'CORRECT' ? '정확' : '오류'} · 첫 시도 ${suggestion.firstAttemptCorrect === 'CORRECT' ? '정확' : '오류'} · 최종 ${suggestion.finalAttemptCorrect === 'CORRECT' ? '정확' : '오류'}${suggestion.events.length ? ` · ${esc(suggestion.events.join(', '))}` : ''}</div>${candidate.notes.map(note => `<small>${esc(note)}</small>`).join('')}<button class="secondary compact-button" id="apply-candidate" type="button">후보를 판정 칸에 채우기</button></div>`;
}

function applyDecodingSuggestion(response, transcript) {
  const candidate = S.decodingCandidate({ text: response.target, accepted: response.accepted?.length ? response.accepted : [response.expected].filter(Boolean), rule: response.rule }, transcript);
  const suggestion = candidate.suggestion;
  const radio = $(`input[name="item-score"][value="${suggestion.itemScore}"]`);
  if (radio) radio.checked = true;
  $('#first-attempt').value = suggestion.firstAttemptCorrect;
  $('#final-attempt').value = suggestion.finalAttemptCorrect;
  $$('input[name="rating-event"]').forEach(input => { input.checked = suggestion.events.includes(input.value); });
  return candidate;
}

// ---------- 유창성 어절 지도 ----------
const FLUENCY_TOOLS = [
  ['sub', '대치'], ['omit', '생략'], ['help', '도움 제공'], ['unclear', '판정 보류'],
  ['selfcorrect', '자기수정'], ['repeat', '반복'], ['insertAfter', '뒤에 삽입'], ['pauseBefore', '앞 긴 멈춤'], ['lineSkip', '행 건너뜀 시작'], ['interrupt', '외부 방해'],
  ['sixty', '60초 경계'], ['last', '마지막 읽은 어절'], ['listen', '▶ 추정 위치 듣기']
];

function passageMapHtml(tokens, work, { interactive = true } = {}) {
  return tokens.map(token => {
    const entry = work.marks[token.index] || {};
    const classes = ['token', entry.mark && entry.mark !== 'correct' ? `m-${entry.mark}` : '', ...(entry.flags || []).map(flag => `f-${flag}`),
      work.lastIndex != null && token.index > work.lastIndex ? 'unread' : '', work.sixtyIndex === token.index ? 'sixty' : ''].filter(Boolean).join(' ');
    const title = [entry.mark && entry.mark !== 'correct' ? S.FLUENCY_MARKS[entry.mark].label : '', ...(entry.flags || []).map(flag => S.FLUENCY_FLAGS[flag])].filter(Boolean).join(', ');
    const actual = entry.mark === 'sub' && entry.actual ? `<small class="actual">${esc(entry.actual)}</small>` : '';
    return interactive
      ? `<button type="button" class="${classes}" data-token="${token.index}" title="${esc(title)}">${esc(token.surface)}${actual}</button>`
      : `<span class="${classes}" title="${esc(title)}">${esc(token.surface)}${actual}</span>`;
  }).join(' ');
}

function fluencyMetricsHtml(metrics, meta) {
  const cell = (label, value, hint = '') => `<div><dt>${label}</dt><dd>${value ?? '–'}</dd>${hint ? `<small>${hint}</small>` : ''}</div>`;
  const eventText = Object.entries(metrics.events).map(([name, count]) => `${name} ${count}`).join(' · ') || '표시된 오류 없음';
  return `<dl class="metric-grid">${cell('낭독 구간', metrics.readingSeconds != null ? `${metrics.readingSeconds}초` : '–', '시작~종료 마커')}${cell('정확도(어절)', metrics.accuracyEojeol != null ? `${metrics.accuracyEojeol}%` : '–', `${metrics.correctEojeol}/${metrics.attemptedEojeol} 어절`)}${cell('정확도(음절)', metrics.accuracySyllable != null ? `${metrics.accuracySyllable}%` : '–', `${metrics.correctSyllables}/${metrics.attemptedSyllables} 음절`)}${cell('분당 정확 어절', metrics.correctEojeolPerMin)}${cell('분당 정확 음절', metrics.correctSyllablesPerMin)}${cell('첫 60초 정확 어절', metrics.first60.correctEojeol, metrics.first60.reachedSixty ? '60초 경계까지' : '60초 전에 끝남: 전체와 같음')}</dl><p class="quiet">${esc(eventText)}${metrics.excluded ? ` · 판정 보류 ${metrics.excluded}어절은 분자·분모에서 제외` : ''}${metrics.completed ? '' : ' · 지문 미완료: 읽은 범위까지만 계산'} · 지문 ${meta?.eojeol ?? '–'}어절 ${meta?.syllables ?? '–'}음절</p>`;
}

function aiBoxHtml(response) {
  const machine = response.machineAnalysis || {};
  const asr = machine.asr;
  const head = '<h3>AI 후보 · 기기 안 Whisper 음성인식</h3>';
  if (!asr) return `<div class="review-box span-two ai-box">${head}<p class="quiet">아직 AI 분석을 하지 않았습니다. 인식 결과는 오류 후보일 뿐이며 점수는 사람이 확정합니다.</p>${response.audioKey ? '<button class="secondary compact-button" id="ai-run-one" type="button">이 녹음 AI 분석</button>' : '<p class="quiet">원음성이 없는 기록입니다.</p>'}</div>`;
  const meta = `<small>${esc(asr.model)} · ${esc(asr.library)} · 시각 ${asr.timestampMode === 'word' ? '단어 단위' : '구간 단위(단어 시각은 추정)'} · ${new Date(asr.createdAt).toLocaleString('ko-KR')}</small>`;
  if (response.module === 'decoding') {
    const c = machine.constrained;
    return `<div class="review-box span-two ai-box">${head}<div class="ai-line"><span class="ai-heard">“${esc(asr.text || '(인식 없음)')}”</span>${c?.nearest ? `<span class="marker-chip ${c.confident ? 'onset' : 'sixty'}">가장 가까운 후보 [${esc(c.nearest.form)}] ${esc(c.nearest.label)} · 차이 ${c.nearest.distance}</span>` : ''}</div><p class="quiet">${esc(c?.note || '')}. 음성인식은 비단어를 비슷한 실제 단어로 바꿔 들을 수 있어 사람이 원음성으로 확인해야 합니다.</p>${meta}<button class="secondary compact-button" id="ai-to-transcript" type="button">AI 전사를 전사 칸에 넣기</button></div>`;
  }
  const al = machine.alignment;
  const counts = al ? al.tokens.reduce((acc, token) => { if (token.index <= al.lastReadIndex) acc[token.status]++; return acc; }, { match: 0, sub: 0, omit: 0 }) : null;
  return `<div class="review-box span-two ai-box">${head}<p class="ai-heard small">“${esc(asr.text)}”</p>${al ? `<div class="chip-row"><span class="marker-chip onset">일치 ${counts.match}</span><span class="marker-chip sixty">대치 후보 ${counts.sub}</span><span class="marker-chip end">생략 후보 ${counts.omit}</span><span class="marker-chip">삽입 후보 ${al.insertions.length}</span>${al.lastReadIndex < al.tokens.length - 1 ? `<span class="marker-chip">${al.tokens.length - 1 - al.lastReadIndex}어절 읽지 않음 후보</span>` : ''}</div>` : ''}${meta}<button class="secondary compact-button" id="ai-to-marks" type="button">AI 후보를 어절 지도에 표시</button><small>표시 후 원음성을 들으며 고치고 저장하세요. 어절 ‘듣기’는 AI 단어 시각을 사용합니다.</small></div>`;
}

async function drawDetail(session, index, slot, raterId, redraw) {
  const response = session.responses[index];
  const rating = response.ratings?.[slot] || {};
  const machine = response.machineAnalysis || {};
  const detail = $('#review-detail');
  const qualityFlags = response.quality?.flags?.join(' · ') || '품질값 없음';
  const latency = machine.onsetLatencyMs != null ? `<span>반응 시작 ${seconds1(machine.onsetLatencyMs)}</span>` : '';
  const commonTop = `<p class="eyebrow">${esc(response.stimulusId)} · ${esc(response.kind || '')}${response.practice ? ' · 점수 제외' : ''}${session.demo ? ' · 예시 자료' : ''}</p><h2>${esc(response.target)}</h2><div class="evidence-strip"><span>녹음 ${formatTime((response.durationMs || 0) / 1000)}</span>${latency}<span>${esc(qualityFlags)}</span><span>${esc(response.condition || '')}</span></div>`;
  const audioBox = `<div class="review-box span-two"><h3>원음성과 발화 구간</h3><audio id="review-audio" controls></audio><div id="waveform" class="waveform"></div><div class="timed-row"><select id="timed-type">${(response.module === 'decoding' ? TIMED_DECODING : TIMED_FLUENCY).map(type => `<option>${type}</option>`).join('')}</select><button class="secondary compact-button" id="add-timed" type="button">현재 재생 위치에 사건 기록</button><span class="quiet">재생하다 멈춘 뒤 누르면 그 시각이 저장됩니다.</span></div><div id="timed-list" class="timed-list"></div><button class="text-button audio-download" id="download-audio">음성 파일 내려받기</button></div>`;
  let scoring;
  if (response.module === 'decoding') {
    const accepted = response.accepted?.length ? response.accepted : [response.expected].filter(Boolean);
    scoring = `<div class="review-box"><h3>목표 표기와 허용 발음</h3><div class="accepted-list"><span class="target-chip">${esc(response.target)}</span>→${accepted.map(form => `<span class="accept-chip">[${esc(form)}]</span>`).join('') || '<span class="quiet">미확정</span>'}</div><small>${esc(response.rule || '')}</small>${response.reviewNote ? `<p class="notice warning small-notice"><b>문항 검토:</b> ${esc(response.reviewNote)}</p>` : ''}</div>
      <div class="review-box"><h3>${slot} 독립 채점 · 사람 전사</h3><input id="transcript" class="transcript-input" value="${esc(rating.transcript || '')}" placeholder="들리는 대로 입력 (예: 꼳입/꼰닙)"><small class="quiet">규약: <code>/</code> 뒤는 다시 읽은 시도, <code>-</code>는 나누어 읽음, 무응답은 “무응답”.</small></div>
      <div class="review-box span-two"><h3>음절 위치별 오류 후보</h3><div id="candidate" class="candidate">${candidateHtml(response, rating.transcript)}</div></div>
      <div class="review-box"><h3>문항 최종 판정</h3><div class="rating-row">${scoreRadio('CORRECT', rating.itemScore, '정확')}${scoreRadio('INCORRECT', rating.itemScore, '오류')}${scoreRadio('UNSCORABLE', rating.itemScore, '채점 불가')}</div></div>
      <div class="review-box"><h3>첫 시도와 최종 시도</h3><div class="mini-fields">${attemptSelect('first-attempt', rating.firstAttemptCorrect, '첫 시도')}${attemptSelect('final-attempt', rating.finalAttemptCorrect, '최종 시도')}</div></div>
      <div class="review-box span-two"><h3>확인된 오류·관찰 사건</h3><div class="rating-row">${eventInputs(DECODING_EVENTS, rating.events || [])}</div></div>`;
  } else {
    scoring = `<div class="review-box span-two"><h3>${slot} 독립 채점 · 지문 어절 지도</h3><div class="tool-row" id="tool-row">${FLUENCY_TOOLS.map(([key, label], i) => `<label class="tool"><input type="radio" name="fluency-tool" value="${key}" ${i === 0 ? 'checked' : ''}><span>${label}</span></label>`).join('')}</div><p class="quiet">도구를 고른 뒤 어절을 누르세요. 같은 표시를 다시 누르면 지워집니다. 표시하지 않은 어절은 정확으로 계산합니다. 행을 건너뛰면 건너뛴 어절을 ‘생략’으로 표시하고 첫 어절에 ‘행 건너뜀 시작’을 더합니다.</p><div class="passage-map" id="passage-map"></div><div class="button-row compact"><button class="secondary compact-button" id="pause-to-tokens" type="button">긴 멈춤 후보를 어절에 표시</button><button class="secondary compact-button" id="clear-marks" type="button">표시 모두 지우기</button></div></div>
      <div class="review-box span-two"><h3>즉시 계산되는 원점수</h3><div id="fluency-metrics"></div></div>
      <div class="review-box"><h3>자료 사용 여부</h3><div class="rating-row">${scoreRadio('VALID', rating.itemScore, '사용 가능')}${scoreRadio('UNSCORABLE', rating.itemScore, '채점 불가')}</div></div>
      <div class="review-box"><h3>필요하면 전사</h3><textarea id="transcript" placeholder="대치된 말 등을 기록">${esc(rating.transcript || '')}</textarea></div>`;
  }
  detail.innerHTML = `${commonTop}${rulesHtml(response.module)}<div class="review-grid">${audioBox}${aiBoxHtml(response)}${scoring}<div class="review-box span-two"><h3>판정 확신과 메모</h3><label class="inline-check"><input type="checkbox" id="uncertainty" ${rating.uncertainty ? 'checked' : ''}> 이 판정은 불확실함</label><textarea id="rating-notes" placeholder="판정 이유나 모호한 경계를 기록하세요.">${esc(rating.notes || '')}</textarea></div></div><div class="review-actions"><button class="primary" id="save-review">${slot} 독립 채점 저장</button></div><div id="adjudication-panel">${adjudicationHtml(response)}</div>`;

  const audio = $('#review-audio');
  let blob = null;
  try {
    blob = response.audioKey ? await getBlob(response.audioKey) : null;
    if (blob) {
      audio.src = URL.createObjectURL(blob);
      $('#download-audio').onclick = () => downloadBlob(blob, `${session.participant}_${response.stimulusId}.webm`);
    } else $('#download-audio').disabled = true;
  } catch { $('#download-audio').disabled = true; }

  // 유창성 작업 상태 (저장 전까지 화면 안에서만 바뀜)
  const tokens = S.tokenizePassage(response.target);
  const machineOnset = machine.speechOnsetMs ?? 0;
  const machineEnd = machine.speechOffsetMs ?? response.durationMs ?? 0;
  const work = {
    marks: JSON.parse(JSON.stringify(rating.marks || {})),
    lastIndex: rating.lastIndex ?? tokens.length - 1,
    sixtyIndex: rating.sixtyIndex ?? null,
    sixtySource: rating.sixtySource || 'auto',
    onsetMs: rating.onsetMs ?? machineOnset,
    endMs: rating.speechEndMs ?? machineEnd
  };
  const autoSixty = () => {
    if (work.endMs - work.onsetMs <= S.SCORING_CONFIG.fluencyWindowMs) return null;
    return S.tokenAtTime(tokens, work.onsetMs, work.endMs, work.onsetMs + S.SCORING_CONFIG.fluencyWindowMs);
  };
  const metricsNow = () => S.computeFluency({ tokens, marks: work.marks, lastIndex: work.lastIndex, sixtyIndex: work.sixtyIndex, onsetMs: work.onsetMs, endMs: work.endMs });

  const markers = response.module === 'fluency'
    ? [{ key: 'onset', label: '시작', ms: work.onsetMs, draggable: true }, { key: 'sixty', label: '60초', ms: work.endMs - work.onsetMs > S.SCORING_CONFIG.fluencyWindowMs ? work.onsetMs + S.SCORING_CONFIG.fluencyWindowMs : null }, { key: 'end', label: '종료', ms: work.endMs, draggable: true }]
    : [{ key: 'onset', label: '발화 시작', ms: machine.speechOnsetMs ?? null }, { key: 'end', label: '발화 끝', ms: machine.speechOffsetMs ?? null }];
  let timedEvents = JSON.parse(JSON.stringify(rating.timedEvents || []));
  const wave = await mountWaveform($('#waveform'), {
    blob, durationMs: response.durationMs, markers, pauses: machine.pauses || [], ticks: timedEvents, audio,
    onChange(key, ms) {
      if (key === 'onset') work.onsetMs = Math.min(ms, work.endMs - 100);
      if (key === 'end') work.endMs = Math.max(ms, work.onsetMs + 100);
      wave.setMarker('onset', work.onsetMs);
      wave.setMarker('end', work.endMs);
      wave.setMarker('sixty', work.endMs - work.onsetMs > S.SCORING_CONFIG.fluencyWindowMs ? work.onsetMs + S.SCORING_CONFIG.fluencyWindowMs : null);
      refreshFluency();
    }
  });

  function refreshFluency() {
    if (response.module !== 'fluency') return;
    if (work.sixtySource === 'auto') work.sixtyIndex = autoSixty();
    $('#passage-map').innerHTML = passageMapHtml(tokens, work);
    $('#fluency-metrics').innerHTML = fluencyMetricsHtml(metricsNow(), response.passageMeta) + (work.onsetMs !== machineOnset || work.endMs !== machineEnd ? `<p class="quiet">자동 발화 구간 ${seconds1(machineOnset)}~${seconds1(machineEnd)} → 사람 수정 ${seconds1(work.onsetMs)}~${seconds1(work.endMs)} (둘 다 저장)</p>` : `<p class="quiet">발화 구간은 자동 탐지값 그대로입니다. 파형의 시작·종료 마커를 끌어 수정할 수 있습니다.</p>`);
    $$('#passage-map .token').forEach(button => button.onclick = () => {
      const i = +button.dataset.token;
      const tool = $('input[name="fluency-tool"]:checked').value;
      const entry = work.marks[i] || { mark: 'correct', flags: [] };
      entry.flags ||= [];
      if (tool === 'listen') {
        const aligned = machine.alignment?.tokens?.[i];
        const time = aligned?.startMs != null ? aligned : S.estimateTokenTimes(tokens, work.onsetMs, work.endMs)[i];
        return playSegment(audio, time.startMs - 300, (time.endMs ?? time.startMs + 600) + 300);
      }
      if (tool === 'sixty') { work.sixtyIndex = work.sixtyIndex === i ? autoSixty() : i; work.sixtySource = work.sixtyIndex === i ? 'human' : 'auto'; }
      else if (tool === 'last') work.lastIndex = work.lastIndex === i ? tokens.length - 1 : i;
      else if (S.FLUENCY_MARKS[tool]) {
        entry.mark = entry.mark === tool ? 'correct' : tool;
        if (entry.mark === 'sub') {
          const actual = prompt(`“${tokens[i].surface}”을(를) 실제로 어떻게 읽었나요? (선택, 음절 단위 계산에 사용)`, entry.actual || '');
          if (actual && actual.trim()) entry.actual = actual.trim(); else delete entry.actual;
        } else delete entry.actual;
      }
      else entry.flags = entry.flags.includes(tool) ? entry.flags.filter(flag => flag !== tool) : [...entry.flags, tool];
      if (entry.mark === 'correct' && !entry.flags.length) delete work.marks[i]; else work.marks[i] = entry;
      refreshFluency();
    });
  }

  function refreshTimed() {
    const check = S.selfCorrectionCheck(timedEvents);
    const hesitation = response.module === 'decoding' ? S.hesitationCheck(machine.onsetLatencyMs) : null;
    const items = [...timedEvents].sort((x, y) => x.timeMs - y.timeMs).map(event => `<span class="marker-chip event">${esc(event.type)} ${seconds1(event.timeMs)} <button type="button" class="chip-x" data-remove="${event.timeMs}|${esc(event.type)}" aria-label="삭제">×</button></span>`).join('');
    const pairs = check.pairs.map(pair => pair.gapMs == null ? '<span class="quiet">자기수정 앞에 기록된 오류 시각이 없습니다.</span>' : `<span class="marker-chip ${pair.withinWindow ? 'onset' : 'end'}">오류→자기수정 ${(pair.gapMs / 1000).toFixed(1)}초 · ${check.windowMs / 1000}초 창 ${pair.withinWindow ? '이내 (최종 정답 후보)' : '초과 (오답 후보)'}</span>`).join('');
    const hes = hesitation?.exceeded ? `<span class="marker-chip sixty">반응 시작 ${seconds1(hesitation.onsetLatencyMs)} · 머뭇거림 창 ${hesitation.windowMs / 1000}초 초과 후보</span>` : '';
    $('#timed-list').innerHTML = items + pairs + hes;
    $$('[data-remove]').forEach(button => button.onclick = () => {
      const [time, type] = button.dataset.remove.split('|');
      timedEvents = timedEvents.filter(event => !(String(event.timeMs) === time && event.type === type));
      wave.setTicks(timedEvents); refreshTimed();
    });
  }
  $('#add-timed').onclick = () => {
    if (!audio.src) return alert('원음성이 없는 기록입니다.');
    timedEvents.push({ type: $('#timed-type').value, timeMs: Math.round(audio.currentTime * 1000) });
    wave.setTicks(timedEvents); refreshTimed();
  };
  refreshTimed();

  if ($('#ai-run-one')) $('#ai-run-one').onclick = async () => {
    const button = $('#ai-run-one');
    button.disabled = true;
    try {
      await analyzeResponseWithAsr(session, response, message => { button.textContent = message.slice(0, 40); });
      upsertSession(session);
      redraw();
    } catch (error) { alert(`AI 분석 실패: ${error.message || error}`); button.disabled = false; }
  };
  if ($('#ai-to-transcript')) $('#ai-to-transcript').onclick = () => {
    $('#transcript').value = machine.asr.text;
    $('#transcript').dispatchEvent(new Event('input'));
  };
  if ($('#ai-to-marks')) $('#ai-to-marks').onclick = () => {
    const alignment = machine.alignment;
    work.marks = {};
    for (const token of alignment.tokens) {
      if (token.index > alignment.lastReadIndex) continue;
      if (token.status === 'sub') work.marks[token.index] = { mark: 'sub', flags: [], actual: token.heard };
      if (token.status === 'omit') work.marks[token.index] = { mark: 'omit', flags: [] };
    }
    for (const insertion of alignment.insertions) {
      const index = Math.max(0, insertion.afterIndex);
      const entry = work.marks[index] || { mark: 'correct', flags: [] };
      entry.flags = [...new Set([...(entry.flags || []), 'insertAfter'])];
      work.marks[index] = entry;
    }
    work.lastIndex = alignment.lastReadIndex >= 0 ? alignment.lastReadIndex : tokens.length - 1;
    work.aiApplied = true;
    refreshFluency();
  };

  if (response.module === 'decoding') {
    const transcriptInput = $('#transcript');
    const bindApply = () => { const button = $('#apply-candidate'); if (button) button.onclick = () => applyDecodingSuggestion(response, transcriptInput.value); };
    transcriptInput.oninput = () => { $('#candidate').innerHTML = candidateHtml(response, transcriptInput.value); bindApply(); };
    bindApply();
  } else {
    refreshFluency();
    $('#clear-marks').onclick = () => { work.marks = {}; work.lastIndex = tokens.length - 1; work.sixtySource = 'auto'; refreshFluency(); };
    $('#pause-to-tokens').onclick = () => {
      const pauses = (machine.pauses || []).filter(pause => pause.startMs >= work.onsetMs && pause.endMs <= work.endMs);
      if (!pauses.length) return alert('이 녹음에서 탐지된 긴 멈춤 후보가 없습니다.');
      for (const pause of pauses) {
        const i = S.tokenAtTime(tokens, work.onsetMs, work.endMs, pause.endMs);
        const entry = work.marks[i] || { mark: 'correct', flags: [] };
        entry.flags = [...new Set([...(entry.flags || []), 'pauseBefore'])];
        work.marks[i] = entry;
      }
      refreshFluency();
    };
  }

  $('#save-review').onclick = () => {
    const actualRaterId = ($('#rater-id')?.value || raterId).trim();
    if (!actualRaterId) return alert('채점자 코드를 입력해 주세요.');
    const itemScore = $('input[name="item-score"]:checked')?.value;
    if (!itemScore) return alert('최종 판정 또는 자료 사용 여부를 선택해 주세요.');
    const base = {
      raterSlot: slot, raterId: actualRaterId, transcript: $('#transcript')?.value || '', itemScore,
      uncertainty: $('#uncertainty').checked, notes: $('#rating-notes').value, ratingVersion: RATING_VERSION, scoringConfig: S.SCORING_CONFIG.version, createdAt: now(),
      timedEvents, selfCorrectionCheck: S.selfCorrectionCheck(timedEvents)
    };
    if (response.module === 'decoding') {
      const candidate = base.transcript.trim() ? S.decodingCandidate({ text: response.target, accepted: response.accepted?.length ? response.accepted : [response.expected].filter(Boolean), rule: response.rule }, base.transcript) : null;
      Object.assign(base, {
        events: $$('input[name="rating-event"]:checked').map(input => input.value),
        firstAttemptCorrect: $('#first-attempt').value, finalAttemptCorrect: $('#final-attempt').value,
        // 기계 후보와 사람 판정을 모두 남겨 나중에 자동 후보의 일치도를 계산할 수 있게 한다.
        machineSuggestion: candidate?.suggestion || null,
        errorPositions: candidate?.attempts?.map(attempt => attempt.ops.filter(op => op.op !== 'match').map(op => ({ op: op.op, position: op.position, target: op.target, actual: op.actual, jamo: op.jamo }))) || []
      });
    } else {
      const metrics = metricsNow();
      Object.assign(base, {
        marks: work.marks, lastIndex: work.lastIndex, sixtyIndex: work.sixtyIndex, sixtySource: work.sixtySource,
        onsetMs: work.onsetMs, speechEndMs: work.endMs, machineOnsetMs: machineOnset, machineEndMs: machineEnd, aiMarksApplied: Boolean(work.aiApplied),
        metrics, events: Object.keys(metrics.events),
        accurateSyllables: metrics.correctSyllables, attemptedSyllables: metrics.attemptedSyllables,
        accurateEojeol: metrics.correctEojeol, attemptedEojeol: metrics.attemptedEojeol,
        accurateEojeol60: metrics.first60.correctEojeol, errorCount: metrics.errors
      });
    }
    response.ratings[slot] = base;
    response.adjudication = compareRatings(response);
    updateSessionStatus(session);
    upsertSession(session);
    redraw();
  };
  bindAdjudication(response, session, redraw);
}

function compareRatings(response) {
  const a = response.ratings?.A, b = response.ratings?.B;
  if (!a || !b) return { status: 'UNPAIRED', comparedAt: now(), finalRating: null };
  return S.ratingsAgree(response.module, a, b)
    ? { status: a.itemScore === 'UNSCORABLE' ? 'INVALID_AUDIO' : 'AGREE', comparedAt: now(), selectedSlot: 'A', finalRating: { ...a } }
    : { status: 'NEEDS_CONSENSUS', comparedAt: now(), finalRating: null };
}
function ratingSummary(rating, module) {
  if (!rating) return '<p>아직 저장되지 않았습니다.</p>';
  if (module === 'decoding') return `<p><b>${esc(rating.itemScore)}</b> · “${esc(rating.transcript)}” · 첫 ${esc(rating.firstAttemptCorrect || '–')} / 최종 ${esc(rating.finalAttemptCorrect || '–')}</p><small>${esc((rating.events || []).join(', ') || '오류 사건 없음')}</small>`;
  const metrics = rating.metrics || {};
  return `<p><b>${esc(rating.itemScore)}</b> · 정확 ${metrics.correctEojeol ?? '–'}/${metrics.attemptedEojeol ?? '–'} 어절 · 분당 ${metrics.correctEojeolPerMin ?? '–'} 어절 · 구간 ${seconds1(rating.onsetMs)}~${seconds1(rating.speechEndMs)}</p><small>${esc(Object.entries(metrics.events || {}).map(([name, count]) => `${name} ${count}`).join(', ') || '오류 사건 없음')}</small>`;
}
function adjudicationHtml(response) {
  if (response.practice) return '<div class="adjudication muted-panel"><b>연습 항목</b><p>채점과 원점수에서 제외됩니다.</p></div>';
  const a = response.ratings?.A, b = response.ratings?.B;
  if (!a || !b) return `<div class="adjudication"><b>독립 채점 진행 중</b><p>두 슬롯이 모두 저장되기 전에는 상대 판정을 비교하지 않습니다. (저장됨: ${a ? 'A' : ''}${b ? ' B' : ''}${!a && !b ? '없음' : ''})</p></div>`;
  const status = response.adjudication?.status;
  const rationale = response.adjudication?.rationale ? `<p class="quiet">${esc(response.adjudication.rationale)}</p>` : '';
  return `<div class="adjudication"><div class="adjudication-title"><div><p class="eyebrow">잠정 기준 자료</p><h3>${adjudicationLabel(status)}</h3></div><span class="state-pill ${status?.toLowerCase()}">${esc(status)}</span></div><div class="rater-compare"><div><b>채점 A · ${esc(a.raterId)}</b>${ratingSummary(a, response.module)}</div><div><b>채점 B · ${esc(b.raterId)}</b>${ratingSummary(b, response.module)}</div></div>${rationale}${status === 'NEEDS_CONSENSUS' ? '<p class="notice warning">두 판정이 다릅니다. 원음성과 규칙을 다시 본 뒤 합의해 한 값을 채택하거나 전문가 검토로 보류하세요.</p><div class="button-row compact"><button class="secondary" data-adjudicate="A">합의 후 A 값 채택</button><button class="secondary" data-adjudicate="B">합의 후 B 값 채택</button><button class="secondary danger" data-adjudicate="EXPERT_PENDING">전문가 검토로 보류</button></div>' : `<p class="quiet">비교 기준: ${response.module === 'decoding' ? '판정, 첫·최종 시도, 오류 사건 (전사 표기 차이는 비교하지 않음)' : `어절 표시, 60초·마지막 어절, 시작·종료 ±${S.SCORING_CONFIG.timingToleranceMs}ms`}. 합의 전 두 판정은 모두 보존됩니다.</p>`}</div>`;
}
function bindAdjudication(response, session, redraw) {
  $$('[data-adjudicate]').forEach(button => button.onclick = () => {
    const choice = button.dataset.adjudicate;
    if (choice === 'EXPERT_PENDING') response.adjudication = { status: 'EXPERT_PENDING', comparedAt: now(), finalRating: null, rationale: '두 비전문 채점자가 합의하지 못해 전문가 검토 보류' };
    else {
      const selected = response.ratings[choice];
      response.adjudication = { status: selected.itemScore === 'UNSCORABLE' ? 'INVALID_AUDIO' : 'CONSENSUS', comparedAt: now(), selectedSlot: choice, finalRating: { ...selected }, rationale: `합의 후 채점 ${choice} 값을 잠정 기준으로 채택` };
    }
    updateSessionStatus(session);
    upsertSession(session);
    redraw();
  });
}
function updateSessionStatus(session) {
  const responses = scoredResponses(session);
  const complete = responses.length && responses.every(response => response.adjudication && !['UNPAIRED', 'NEEDS_CONSENSUS'].includes(response.adjudication.status));
  session.status = complete ? 'FINALIZED' : 'REVIEW_PENDING';
  session.updatedAt = now();
  if (complete) session.finalizedAt = now();
}

// ---------- 내보내기·가져오기 ----------
const blobToDataUrl = blob => new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(blob); });

async function exportSession(session) {
  const payload = JSON.parse(JSON.stringify(session));
  payload.exportedAt = now();
  payload.appVersion = APP_VERSION;
  payload.versions = { policy: POLICY_VERSION, content: CONTENT_VERSION, rating: RATING_VERSION, scoringConfig: S.SCORING_CONFIG };
  const withAudio = confirm('원음성을 JSON 안에 함께 넣을까요?\n(다른 기기에서 가져오기 할 때 필요합니다. 파일이 커집니다.)');
  if (withAudio) {
    payload.audio = {};
    for (const response of session.responses) {
      const blob = response.audioKey ? await getBlob(response.audioKey).catch(() => null) : null;
      if (blob) payload.audio[response.audioKey] = await blobToDataUrl(blob);
    }
    payload.exportNotice = '원음성 포함 (audio: audioKey → data URL).';
  } else payload.exportNotice = '오디오 바이트는 포함되지 않음. 각 검토 화면에서 원음성을 별도 내려받아 response.audioKey와 함께 보관.';
  downloadBlob(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }), `${session.participant}_${session.id}_research-bundle.json`);
}

function bindImport(input) {
  if (!input) return;
  input.onchange = async () => {
    const file = input.files?.[0];
    if (!file) return;
    try {
      const payload = JSON.parse(await file.text());
      if (!payload.id || !Array.isArray(payload.responses)) throw new Error('검사 기록 형식이 아닙니다.');
      for (const [key, dataUrl] of Object.entries(payload.audio || {})) await saveBlob(key, await (await fetch(dataUrl)).blob());
      delete payload.audio;
      upsertSession(migrateSession(payload));
      alert(`${payload.participant} 기록을 가져왔습니다.`);
      sessionStorage.setItem('readingReviewSession', payload.id);
      render('review');
    } catch (error) { alert(`가져오지 못했습니다. ${error.message}`); }
  };
}

function downloadBlob(blob, filename) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

// ---------- 결과 ----------
function result() {
  const list = sessions().filter(session => scoredResponses(session).length);
  const select = $('#result-session-select');
  if (!list.length) { $('#result-empty').classList.remove('hidden'); return; }
  select.innerHTML = list.map(session => `<option value="${session.id}">${esc(session.participant)}${session.demo ? ' (예시)' : ''} · ${new Date(session.createdAt).toLocaleDateString('ko-KR')}</option>`).join('');
  const preferred = sessionStorage.getItem('readingResultSession');
  if (preferred && list.some(session => session.id === preferred)) select.value = preferred;
  const draw = () => { sessionStorage.setItem('readingResultSession', select.value); drawResult(list.find(session => session.id === select.value) || list[0]); };
  select.onchange = draw;
  $('#open-report').onclick = () => { sessionStorage.setItem('readingResultSession', select.value); render('report'); };
  draw();
}

const lexicalityOf = response => response.lexicality || (/비단어/.test(response.condition) ? 'nonword' : 'real');
const regularityOf = response => response.regularity || (/음운변동/.test(response.condition) ? 'phonological' : 'consistent');

// 설계도 5.1 3단계: 두 채점자의 독립 판정 일치도, 그리고 AI 후보와 사람 확정값의 일치도.
function agreementSummary(session) {
  const responses = scoredResponses(session);
  const decoding = responses.filter(response => response.module === 'decoding');
  const fluency = responses.filter(response => response.module === 'fluency');
  const isError = entry => Boolean(entry && S.FLUENCY_MARKS[entry.mark]?.error);
  const raterDecoding = S.cohensKappa(decoding.filter(r => r.ratings?.A && r.ratings?.B).map(r => [r.ratings.A.itemScore, r.ratings.B.itemScore]));
  const raterFirst = S.cohensKappa(decoding.filter(r => r.ratings?.A && r.ratings?.B).map(r => [r.ratings.A.firstAttemptCorrect, r.ratings.B.firstAttemptCorrect]));
  const raterFluency = S.cohensKappa(fluency.filter(r => r.ratings?.A && r.ratings?.B).flatMap(r => S.tokenizePassage(r.target).map(token => [
    isError(r.ratings.A.marks?.[token.index]) ? 'E' : 'C', isError(r.ratings.B.marks?.[token.index]) ? 'E' : 'C'])));
  const final = r => ['AGREE', 'CONSENSUS'].includes(r.adjudication?.status) ? r.adjudication.finalRating : null;
  const aiDecoding = S.cohensKappa(decoding.filter(r => r.machineAnalysis?.constrained?.nearest && final(r) && final(r).itemScore !== 'UNSCORABLE').map(r => {
    const c = r.machineAnalysis.constrained;
    return [c.nearest.label === '허용 발음' && c.nearest.distance === 0 ? 'CORRECT' : 'INCORRECT', final(r).itemScore];
  }));
  const aiFluency = S.cohensKappa(fluency.filter(r => r.machineAnalysis?.alignment && final(r)).flatMap(r => r.machineAnalysis.alignment.tokens
    .filter(token => token.index <= (final(r).lastIndex ?? Infinity))
    .map(token => [token.status === 'match' ? 'C' : 'E', isError(final(r).marks?.[token.index]) ? 'E' : 'C'])));
  return { raterDecoding, raterFirst, raterFluency, aiDecoding, aiFluency };
}

function agreementRow(label, stat, unit) {
  if (!stat.n) return `<tr><td>${label}</td><td colspan="3" class="quiet">자료 없음</td></tr>`;
  return `<tr><td>${label}</td><td>${stat.n}${unit}</td><td>${stat.agreement}%</td><td>κ = ${stat.kappa} <span class="quiet">(${S.kappaLabel(stat.kappa)})</span></td></tr>`;
}

function drawResult(session) {
  const responses = scoredResponses(session);
  const decoding = responses.filter(response => response.module === 'decoding');
  const fluency = responses.filter(response => response.module === 'fluency');
  const usable = response => ['AGREE', 'CONSENSUS'].includes(response.adjudication?.status) && response.adjudication?.finalRating;
  const isCorrect = response => response.adjudication.finalRating.itemScore === 'CORRECT';
  const scoredDecoding = decoding.filter(usable);
  const correct = scoredDecoding.filter(isCorrect).length;
  const invalid = responses.filter(response => response.adjudication?.status === 'INVALID_AUDIO').length;
  const expert = responses.filter(response => response.adjudication?.status === 'EXPERT_PENDING').length;
  const pending = responses.filter(response => !response.adjudication || ['UNPAIRED', 'NEEDS_CONSENSUS'].includes(response.adjudication.status)).length;
  const agreeOnly = scoredDecoding.filter(response => response.adjudication.status === 'AGREE');

  const cell = (lex, reg) => {
    const group = scoredDecoding.filter(response => lexicalityOf(response) === lex && regularityOf(response) === reg);
    const hit = group.filter(isCorrect).length;
    const total = decoding.filter(response => lexicalityOf(response) === lex && regularityOf(response) === reg).length;
    return `<td><b>${hit} / ${group.length}</b> <span class="quiet">${pct(hit, group.length)}</span>${total > group.length ? `<small>미확정 ${total - group.length}</small>` : ''}</td>`;
  };
  const grid = `<div class="table-wrap"><table class="grid-2x2"><thead><tr><th></th><th>표기-발음 일치</th><th>음운변동 필요</th></tr></thead><tbody><tr><th>실제단어</th>${cell('real', 'consistent')}${cell('real', 'phonological')}</tr><tr><th>비단어</th>${cell('nonword', 'consistent')}${cell('nonword', 'phonological')}</tr></tbody></table></div>`;

  const errorCounts = {};
  for (const response of scoredDecoding) for (const event of response.adjudication.finalRating.events || []) errorCounts[event] = (errorCounts[event] || 0) + 1;
  const latencies = scoredDecoding.map(response => response.machineAnalysis?.onsetLatencyMs).filter(value => value != null).sort((x, y) => x - y);
  const median = latencies.length ? latencies[Math.floor(latencies.length / 2)] : null;

  const itemRows = decoding.map(response => {
    const final = response.adjudication?.finalRating;
    const positions = (final?.errorPositions || []).flat().map(op => op.op === 'sub' ? `${op.position}음절 ${op.target}→${op.actual}` : op.op === 'del' ? `${op.position}음절 생략` : `삽입 ${op.actual}`).join(', ');
    return `<tr><td>${esc(response.stimulusId)}</td><td><b>${esc(response.target)}</b> <span class="quiet">[${esc((response.accepted || [response.expected]).join(', '))}]</span></td><td>${final ? `“${esc(final.transcript || '')}”` : '–'}</td><td>${final ? (final.itemScore === 'CORRECT' ? '정확' : final.itemScore === 'INCORRECT' ? '오류' : '채점 불가') : '–'}${final?.firstAttemptCorrect && final.firstAttemptCorrect !== final.finalAttemptCorrect ? ' <small>(첫 시도 오류)</small>' : ''}</td><td>${esc(positions || (final?.events || []).join(', ') || '–')}</td><td>${seconds1(response.machineAnalysis?.onsetLatencyMs)}</td><td><span class="state-pill ${(response.adjudication?.status || '').toLowerCase()}">${adjudicationLabel(response.adjudication?.status)}</span></td></tr>`;
  }).join('');

  const fluencyCards = fluency.map(response => {
    const rating = response.adjudication?.finalRating;
    if (!rating) return `<article class="result-card pending-result"><p class="eyebrow">${esc(response.stimulusId)}</p><h3>${esc(response.kind)}</h3><p>${adjudicationLabel(response.adjudication?.status)}</p></article>`;
    const tokens = S.tokenizePassage(response.target);
    const metrics = rating.metrics || S.computeFluency({ tokens, marks: rating.marks, lastIndex: rating.lastIndex, sixtyIndex: rating.sixtyIndex, onsetMs: rating.onsetMs, endMs: rating.speechEndMs });
    const d = (label, value) => `<div><dt>${label}</dt><dd>${value ?? '–'}</dd></div>`;
    return `<article class="result-card wide-card"><p class="eyebrow">${esc(response.stimulusId)} · ${adjudicationLabel(response.adjudication.status)}</p><h3>${esc(response.kind)}</h3><dl>${d('낭독 구간', `${metrics.readingSeconds}초`)}${d('정확도', `${metrics.accuracyEojeol}% 어절 · ${metrics.accuracySyllable}% 음절`)}${d('분당 정확 어절', metrics.correctEojeolPerMin)}${d('분당 정확 음절', metrics.correctSyllablesPerMin)}${d('첫 60초 정확 어절', metrics.first60.correctEojeol)}${d('오류', metrics.errors)}</dl><h4>오류 지도</h4><div class="passage-map static">${passageMapHtml(tokens, { marks: rating.marks || {}, lastIndex: rating.lastIndex, sixtyIndex: rating.sixtyIndex }, { interactive: false })}</div><p class="quiet">${esc(Object.entries(metrics.events).map(([name, count]) => `${name} ${count}`).join(' · ') || '표시된 오류 없음')} · 분모: 시도 ${metrics.attemptedEojeol}어절/${metrics.attemptedSyllables}음절${metrics.excluded ? `, 보류 ${metrics.excluded}어절 제외` : ''}</p></article>`;
  }).join('');

  $('#result-content').innerHTML = `<div class="notice warning"><b>진단 결과가 아닙니다.</b> 표준점수·백분위·난독증 판정 없이 두 채점자가 확인한 원점수와 보류 상태만 표시합니다.${session.demo ? ' <b>이 기록은 화면 시연용 예시 자료입니다.</b>' : ''}</div>
  <div class="result-meta"><span>참여자 ${esc(session.participant)}</span><span>${esc(session.ageBand)}</span><span>상태 ${esc(session.status)}</span><span>문항 ${esc(session.formVersion)}</span><span>채점 ${esc(session.ratingVersion)}</span><span>발음 목록 ${esc(session.pronunciationDictVersion || '0.2 이전')}</span><span>음성인식 ${esc(session.sttModelVersion || 'not-run')}</span></div>
  <div class="result-kpis"><article><small>해독 정확</small><b>${correct} / ${scoredDecoding.length}</b><span>AGREE만: ${agreeOnly.filter(isCorrect).length} / ${agreeOnly.length}</span></article><article><small>전문가 보류</small><b>${expert}</b><span>점수에서 제외</span></article><article><small>채점 진행 중</small><b>${pending}</b><span>독립 채점 또는 합의 필요</span></article><article><small>무효 음성</small><b>${invalid}</b><span>원점수에서 제외</span></article></div>
  <section class="result-section"><h2>단어 해독 2×2 조건별 원점수</h2>${scoredDecoding.length ? grid : '<p class="quiet">확정된 해독 문항이 없습니다.</p>'}<div class="chip-row">${Object.entries(errorCounts).map(([name, count]) => `<span class="marker-chip">${esc(name)} ${count}</span>`).join('') || '<span class="quiet">확정 문항에 기록된 오류 사건 없음</span>'}${median != null ? `<span class="marker-chip onset">반응 시작 중앙값 ${seconds1(median)}</span>` : ''}</div></section>
  <section class="result-section"><h2>문항별 근거 추적</h2><div class="table-wrap"><table class="item-table"><thead><tr><th>문항</th><th>표기 [허용 발음]</th><th>전사</th><th>판정</th><th>오류 위치</th><th>반응 시작</th><th>상태</th></tr></thead><tbody>${itemRows}</tbody></table></div></section>
  <section class="result-section"><h2>채점 신뢰도와 AI 후보 일치도</h2>${(() => { const a = agreementSummary(session); return `<div class="table-wrap"><table class="item-table"><thead><tr><th>비교</th><th>표본</th><th>일치율</th><th>Cohen's κ</th></tr></thead><tbody>${agreementRow('채점 A ↔ B · 해독 최종 판정', a.raterDecoding, '문항')}${agreementRow('채점 A ↔ B · 해독 첫 시도', a.raterFirst, '문항')}${agreementRow('채점 A ↔ B · 유창성 어절 정오', a.raterFluency, '어절')}${agreementRow('AI 후보 ↔ 사람 확정 · 해독', a.aiDecoding, '문항')}${agreementRow('AI 후보 ↔ 사람 확정 · 유창성 어절', a.aiFluency, '어절')}</tbody></table></div><p class="quiet">A↔B는 합의 전 독립 판정 기준. AI 비교는 AGREE·CONSENSUS로 확정된 값만 사용합니다. κ 해석 구간은 Landis & Koch(1977)의 관례이며 합격 기준이 아닙니다. 표본이 작으면 κ는 크게 흔들립니다.</p>`; })()}</section>
  <section class="result-section"><h2>읽기 유창성 원자료</h2><div class="fluency-results">${fluencyCards || '<p class="quiet">유창성 기록이 없습니다.</p>'}</div></section>
  <section class="evidence-note"><h2>결과 해석 범위</h2><ul><li>문항과 지문은 기능 시험용 후보이며 난이도와 동형성이 확정되지 않았습니다.</li><li>음절 정렬·발화 탐지·음성인식(Whisper)은 오류 후보를 만드는 공학 계산이며, 최종값은 사람이 확정했습니다.</li><li>AGREE와 CONSENSUS를 구분하여 보존하고 EXPERT_PENDING은 모델 정답으로 사용하지 않습니다.</li><li>자기수정·머뭇거림 창(${S.SCORING_CONFIG.selfCorrectionWindowMs}ms)은 DIBELS 초기값을 설정으로 둔 것이며 한국어 검증값이 아닙니다.</li></ul></section>`;
}

// ---------- 시연용 예시 기록 ----------
// 실제 참여자 자료가 아니다. 결과 화면의 일치·합의·보류 흐름을 보여주기 위한 가상 채점값이며 음성은 없다.
function buildDemoSession() {
  const created = now();
  // 예시 선별: 음운변동 낱말 2개 오류(1개는 표기대로 읽음), 문장은 정확하지만 느림 → A·B 모두 실시
  const wrong = { 'S-W2': 'spell', 'S-W8': 'error' };
  const words = stimuli.screening.words.map(item => ({ id: item.id, text: item.text, lexicality: item.lexicality, regularity: item.regularity, correct: !wrong[item.id], spellingRead: wrong[item.id] === 'spell', noResponse: false, responseMs: 1200 }));
  const sTokens = S.tokenizePassage(stimuli.screening.sentence.text);
  const sMetrics = S.computeFluency({ tokens: sTokens, onsetMs: 0, endMs: 21000 });
  const sentence = { id: stimuli.screening.sentence.id, errors: [], seconds: 21, attemptedEojeol: sMetrics.attemptedEojeol, correctEojeol: sMetrics.correctEojeol, attemptedSyllables: sMetrics.attemptedSyllables, correctSyllables: sMetrics.correctSyllables };
  const decision = S.screeningDecision({ words, sentence, ageBand: '아동' });
  const session = {
    id: uid(), participant: 'DEMO-예시', ageBand: '아동', modules: decision.modules, demo: true,
    createdAt: created, updatedAt: created, startedAt: created, screening: { words, sentence, decision, contentVersion: 'screening-form-0.2', finishedAt: created }, responses: [], status: 'REVIEW_PENDING',
    routing: { recommended: decision.paths, final: decision.paths, added: [], removed: [], decidedAt: created },
    previewPaths: decision.paths, previewLog: PREVIEW_SUBTESTS.filter(subtest => decision.paths.includes(subtest.pathId)).map(subtest => subtest.id), orderPolicy: 'fixed',
    formVersion: CONTENT_VERSION, policyVersion: POLICY_VERSION, ratingVersion: RATING_VERSION, pronunciationDictVersion: PRONUNCIATION_DICT_VERSION, sttModelVersion: 'not-run', schemaVersion: '0.3'
  };
  // [문항 ID, A 전사, B 전사, 반응 시작 ms, 합의 처리]
  const decodingPlan = [
    ['RW-C-01', '나무', '나무', 820], ['RW-C-02', '모자', '모자', 760], ['RW-C-03', '바다', '바다', 700], ['RW-C-04', '우산', '우산', 910],
    ['RW-I-01', '국물', '국물', 1350], ['RW-I-02', '설랄', '설랄', 1120], ['RW-I-03', '가치', '가치', 980], ['RW-I-04', '꼳입/꼰닙', '꼳입/꼰닙', 1640],
    ['NW-C-01', '가눔', '가눔', 1210], ['NW-C-02', '두믿', '두밋', 1580, 'A'], ['NW-C-03', '버-눅', '버-눅', 1900], ['NW-C-04', '소덥', '소덥', 1300],
    ['NW-I-01', '각물', '각물', 2100], ['NW-I-02', '받문', '반문', 2350, 'EXPERT_PENDING'], ['NW-I-03', '옫리', '옫리', 2600], ['NW-I-04', '단는', '단는', 1450]
  ];
  const rate = (response, slot, transcript) => {
    const candidate = S.decodingCandidate({ text: response.target, accepted: response.accepted, rule: response.rule }, transcript);
    return {
      raterSlot: slot, raterId: slot === 'A' ? 'R-A' : 'R-B', transcript, itemScore: candidate.suggestion.itemScore,
      firstAttemptCorrect: candidate.suggestion.firstAttemptCorrect, finalAttemptCorrect: candidate.suggestion.finalAttemptCorrect, events: candidate.suggestion.events,
      machineSuggestion: candidate.suggestion, errorPositions: candidate.attempts?.map(attempt => attempt.ops.filter(op => op.op !== 'match').map(op => ({ op: op.op, position: op.position, target: op.target, actual: op.actual, jamo: op.jamo }))) || [],
      uncertainty: false, notes: '예시', ratingVersion: RATING_VERSION, scoringConfig: S.SCORING_CONFIG.version, createdAt: created
    };
  };
  const base = (item, module, durationMs, speech) => ({
    id: uid(), stimulusId: item.id, module, target: item.text, expected: item.accepted?.[0] || '', accepted: item.accepted || [], kind: item.kind,
    lexicality: item.lexicality || '', regularity: item.regularity || '', reviewNote: item.reviewNote || '', passageMeta: item.meta || null,
    condition: item.condition || '', rule: item.rule || '', practice: false, audioKey: null, durationMs,
    quality: { flags: ['예시 자료 · 음성 없음'] }, machineAnalysis: { status: 'DEMO', modelVersion: 'demo', ...speech }, ratings: {}, adjudication: null, createdAt: created
  });
  for (const [id, a, b, latency, resolve] of decodingPlan) {
    const item = stimulusById(id);
    const response = base(item, 'decoding', latency + 1400, { speechOnsetMs: latency - 300, speechOffsetMs: latency + 500, onsetLatencyMs: latency, pauses: [] });
    response.ratings.A = rate(response, 'A', a);
    response.ratings.B = rate(response, 'B', b);
    if (id === 'RW-I-04') for (const slot of ['A', 'B']) {
      response.ratings[slot].timedEvents = [{ type: '첫 오류', timeMs: 1400 }, { type: '자기수정', timeMs: 2250 }];
      response.ratings[slot].selfCorrectionCheck = S.selfCorrectionCheck(response.ratings[slot].timedEvents);
    }
    response.adjudication = compareRatings(response);
    if (resolve === 'EXPERT_PENDING') response.adjudication = { status: 'EXPERT_PENDING', comparedAt: created, finalRating: null, rationale: '[받문]/[반문] 청취 불일치 · 실제 단어 ‘반문’과 충돌 가능해 전문가 보류' };
    else if (resolve) response.adjudication = { status: 'CONSENSUS', comparedAt: created, selectedSlot: resolve, finalRating: { ...response.ratings[resolve] }, rationale: '받침 ㄷ/ㅅ 청취 차이를 원음성 재청취 후 A 값으로 합의' };
    session.responses.push(response);
  }
  const fluencyPlan = [
    { id: 'F-A', onset: 620, end: 31400, marks: { 6: { mark: 'correct', flags: ['repeat'] }, 18: { mark: 'sub', flags: [], actual: '민주는' }, 25: { mark: 'correct', flags: ['selfcorrect'] }, 29: { mark: 'correct', flags: ['pauseBefore'] } }, pauses: [{ startMs: 20400, endMs: 21600, durationMs: 1200 }] },
    { id: 'F-B', onset: 540, end: 36800, marks: { 3: { mark: 'omit', flags: [] }, 11: { mark: 'sub', flags: [], actual: '햇볕을' }, 20: { mark: 'help', flags: ['pauseBefore'] }, 27: { mark: 'correct', flags: ['insertAfter'] } }, pauses: [{ startMs: 22100, endMs: 24300, durationMs: 2200 }] }
  ];
  for (const plan of fluencyPlan) {
    const item = stimulusById(plan.id);
    const response = base(item, 'fluency', plan.end + 900, { speechOnsetMs: plan.onset, speechOffsetMs: plan.end, pauses: plan.pauses });
    const tokens = S.tokenizePassage(item.text);
    const rating = (slot, onsetShift) => {
      const metrics = S.computeFluency({ tokens, marks: plan.marks, onsetMs: plan.onset + onsetShift, endMs: plan.end });
      return {
        raterSlot: slot, raterId: slot === 'A' ? 'R-A' : 'R-B', transcript: '', itemScore: 'VALID', marks: JSON.parse(JSON.stringify(plan.marks)), lastIndex: tokens.length - 1, sixtyIndex: null, sixtySource: 'auto',
        onsetMs: plan.onset + onsetShift, speechEndMs: plan.end, machineOnsetMs: plan.onset, machineEndMs: plan.end, metrics, events: Object.keys(metrics.events),
        accurateSyllables: metrics.correctSyllables, attemptedSyllables: metrics.attemptedSyllables, accurateEojeol: metrics.correctEojeol, attemptedEojeol: metrics.attemptedEojeol,
        accurateEojeol60: metrics.first60.correctEojeol, errorCount: metrics.errors, uncertainty: false, notes: '예시', ratingVersion: RATING_VERSION, createdAt: created
      };
    };
    response.ratings.A = rating('A', 0);
    response.ratings.B = rating('B', 120);
    response.adjudication = compareRatings(response);
    session.responses.push(response);
  }
  updateSessionStatus(session);
  return session;
}

$('#reset-data').onclick = () => {
  if (confirm('이 기기에 저장된 모든 검사 기록과 원음성을 삭제할까요? 이 작업은 되돌릴 수 없습니다.')) {
    localStorage.removeItem('readingSessions');
    indexedDB.deleteDatabase('ReadingPrototypeDB');
    render('home');
  }
};

render(location.hash.slice(1) || 'home', { history: 'replace' });
