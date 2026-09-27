const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const app = $('#app');

const POLICY_VERSION = 'reading-research-policy-0.2';
const CONTENT_VERSION = 'engineering-form-0.2';
const RATING_VERSION = 'dual-rater-rule-0.2';

const stimuli = {
  decodingPractice: [
    { id: 'DP-01', text: '도토리', expected: '도토리', kind: '연습', condition: 'practice', practice: true }
  ],
  decoding: [
    { id: 'RW-C-01', text: '나무', expected: '나무', kind: '실제단어', condition: '실제·표기-발음 일치', rule: '규칙적' },
    { id: 'RW-C-02', text: '모자', expected: '모자', kind: '실제단어', condition: '실제·표기-발음 일치', rule: '규칙적' },
    { id: 'RW-C-03', text: '바다', expected: '바다', kind: '실제단어', condition: '실제·표기-발음 일치', rule: '규칙적' },
    { id: 'RW-C-04', text: '우산', expected: '우산', kind: '실제단어', condition: '실제·표기-발음 일치', rule: '규칙적' },
    { id: 'RW-I-01', text: '국물', expected: '궁물', kind: '실제단어', condition: '실제·음운변동', rule: '비음화 후보' },
    { id: 'RW-I-02', text: '설날', expected: '설랄', kind: '실제단어', condition: '실제·음운변동', rule: '유음화 후보' },
    { id: 'RW-I-03', text: '같이', expected: '가치', kind: '실제단어', condition: '실제·음운변동', rule: '구개음화 후보' },
    { id: 'RW-I-04', text: '꽃잎', expected: '꼰닙', kind: '실제단어', condition: '실제·음운변동', rule: '복합 음운변동 후보' },
    { id: 'NW-C-01', text: '가눔', expected: '', kind: '비단어 후보', condition: '비단어·표기-발음 일치 후보', rule: '전문가 검토 필요' },
    { id: 'NW-C-02', text: '두밋', expected: '', kind: '비단어 후보', condition: '비단어·표기-발음 일치 후보', rule: '전문가 검토 필요' },
    { id: 'NW-C-03', text: '버눅', expected: '', kind: '비단어 후보', condition: '비단어·표기-발음 일치 후보', rule: '전문가 검토 필요' },
    { id: 'NW-C-04', text: '소덥', expected: '', kind: '비단어 후보', condition: '비단어·표기-발음 일치 후보', rule: '전문가 검토 필요' },
    { id: 'NW-I-01', text: '각물', expected: '', kind: '비단어 후보', condition: '비단어·음운변동 후보', rule: '전문가 검토 필요' },
    { id: 'NW-I-02', text: '밭문', expected: '', kind: '비단어 후보', condition: '비단어·음운변동 후보', rule: '전문가 검토 필요' },
    { id: 'NW-I-03', text: '옷리', expected: '', kind: '비단어 후보', condition: '비단어·음운변동 후보', rule: '전문가 검토 필요' },
    { id: 'NW-I-04', text: '닫는', expected: '', kind: '비단어 여부 재검토', condition: '비단어·음운변동 후보', rule: '어휘·형태소 충돌 검토 필요' }
  ],
  fluencyPractice: [
    { id: 'FP-01', kind: '연습 지문', practice: true, text: '아침이 되자 창문으로 밝은 햇빛이 들어왔습니다.' }
  ],
  fluency: [
    { id: 'F-A', kind: '이야기글 초안', condition: '개발용 지문 A', text: '민지는 아침에 작은 우산을 들고 집을 나섰다. 하늘에는 회색 구름이 많았지만 비는 아직 오지 않았다. 학교에 가는 길에 민지는 젖은 강아지 한 마리를 보았다. 민지는 강아지를 가게 처마 아래로 데려가 잠시 비를 피하게 했다. 조금 뒤 주인이 달려와 민지에게 고맙다고 말했다.' },
    { id: 'F-B', kind: '설명글 초안', condition: '개발용 지문 B', text: '나무는 뿌리로 땅속의 물을 빨아들인다. 물은 줄기를 지나 잎까지 올라간다. 잎은 햇빛을 이용해 나무가 자라는 데 필요한 양분을 만든다. 나무는 계절에 따라 모습이 달라지기도 한다. 봄에는 새잎이 나고, 가을에는 잎의 색이 변한다. 여러 나무는 사람과 동물에게 그늘과 보금자리를 제공한다.' }
  ]
};

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

function render(name) {
  state.view = name;
  const template = $(`#${name}-template`);
  app.innerHTML = '';
  app.append(template.content.cloneNode(true));
  app.focus();
  bindCommon();
  ({ home, setup, mic, screen, route, task, review, result }[name] || (() => {}))();
}

function bindCommon() {
  $$('[data-action="home"]', app).forEach(button => button.onclick = () => { stopStream(); render('home'); });
  $$('[data-action="new-session"]', app).forEach(button => button.onclick = () => render('setup'));
  $$('[data-action="open-review"]', app).forEach(button => button.onclick = () => render('review'));
  $$('[data-action="open-results"]', app).forEach(button => button.onclick = () => render('result'));
}

function home() {
  const pending = sessions().filter(session => scoredResponses(session).some(response => !response.adjudication || ['UNPAIRED', 'NEEDS_CONSENSUS'].includes(response.adjudication.status))).length;
  const counter = $('#review-count');
  if (counter) counter.textContent = pending;
}

function setup() {
  $('#setup-form').onsubmit = event => {
    event.preventDefault();
    const form = new FormData(event.target);
    const modules = form.getAll('modules');
    if (!modules.length) return alert('검사할 경로를 하나 이상 선택해 주세요.');
    state.session = {
      id: uid(), participant: form.get('participant').trim(), ageBand: form.get('ageBand'), modules,
      createdAt: now(), updatedAt: now(), screening: {}, responses: [], status: 'CREATED',
      formVersion: CONTENT_VERSION, policyVersion: POLICY_VERSION, ratingVersion: RATING_VERSION,
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
    return { durationMs: Math.round(buffer.duration * 1000), sampleRate: buffer.sampleRate, channels: buffer.numberOfChannels, rms: +rms.toFixed(4), peak: +peak.toFixed(4), clipRatio: +clipRatio.toFixed(5), flags };
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
  $('#continue-screening').onclick = () => {
    if (animation) cancelAnimationFrame(animation);
    if (context) context.close();
    render('screen');
  };
}

function screen() {
  $('#screen-form').onsubmit = event => {
    event.preventDefault();
    const form = new FormData(event.target);
    state.session.screening = {
      decoding: +form.get('decoding'), fluency: +form.get('fluency'), phonology: +form.get('phonology'), comprehension: +form.get('comprehension'),
      ruleStatus: 'PROVISIONAL_OBSERVATION_ONLY', recordedAt: now()
    };
    state.session.updatedAt = now();
    upsertSession(state.session);
    render('route');
  };
}

function route() {
  const modules = state.session.modules;
  const cards = [
    ['decoding', '단어 해독', '연습 1개와 개발용 후보 16개를 고정 순서로 실시합니다.'],
    ['fluency', '읽기 유창성', '연습 1개와 이야기글·설명글 2개를 전체 낭독합니다.'],
    ['phonology', '음운인식', '공통 데이터 구조에만 자리 잡고 상세 모듈은 아직 준비 중입니다.'],
    ['comprehension', '읽기이해', '공통 데이터 구조에만 자리 잡고 상세 모듈은 아직 준비 중입니다.']
  ];
  $('#route-summary').innerHTML = cards.map(([id, title, description]) => `<article class="route-card ${modules.includes(id) ? '' : 'unavailable'}"><b>${title}</b><p>${modules.includes(id) ? description : '이번 실행에서는 실시하지 않음'}</p></article>`).join('');
  $('#start-assessment').onclick = () => {
    state.taskQueue = [];
    if (modules.includes('decoding')) state.taskQueue.push(...[...stimuli.decodingPractice, ...stimuli.decoding].map(item => ({ ...item, module: 'decoding' })));
    if (modules.includes('fluency')) state.taskQueue.push(...[...stimuli.fluencyPractice, ...stimuli.fluency].map(item => ({ ...item, module: 'fluency' })));
    state.taskIndex = 0;
    state.session.status = 'IN_PROGRESS';
    state.session.startedAt = now();
    upsertSession(state.session);
    render('task');
  };
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
          quality.innerHTML = `<b>음질 후보</b><span>${esc(state.currentQuality.flags.join(' · '))}</span><small>자동 품질값은 최종 판정이 아닙니다.</small>`;
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
        id: responseId, stimulusId: item.id, module: item.module, target: item.text, expected: item.expected || '', kind: item.kind,
        condition: item.condition || '', rule: item.rule || '', practice: Boolean(item.practice), audioKey,
        stimulusShownAt: state.shownAt, recordingStartedAt: state.recordingStartedAt, recordingStoppedAt: now(),
        durationMs: state.currentQuality?.durationMs || state.seconds * 1000, first60Reached: item.module === 'fluency' && state.seconds >= 60,
        quality: state.currentQuality, machineAnalysis: { status: 'NOT_CONNECTED', transcript: '', candidate: null, modelVersion: 'not-connected' },
        ratings: {}, adjudication: null, createdAt: now()
      });
      state.session.updatedAt = now();
      upsertSession(state.session);
      state.taskIndex++;
      if (state.taskIndex < state.taskQueue.length) render('task');
      else {
        stopStream();
        state.session.status = 'REVIEW_PENDING';
        state.session.submittedAt = now();
        state.session.updatedAt = now();
        upsertSession(state.session);
        render('complete');
      }
    } catch {
      nextButton.disabled = false;
      alert('녹음을 저장하지 못했습니다. 이 화면을 닫지 말고 다시 시도해 주세요.');
    }
  };
}

function normalize(value) { return String(value || '').replace(/[\s.,!?~"'’]/g, '').toLowerCase(); }
function levenshtein(left, right) {
  const a = [...normalize(left)], b = [...normalize(right)];
  const matrix = Array.from({ length: b.length + 1 }, (_, index) => [index]);
  for (let index = 0; index <= a.length; index++) matrix[0][index] = index;
  for (let i = 1; i <= b.length; i++) for (let j = 1; j <= a.length; j++) matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + (b[i - 1] === a[j - 1] ? 0 : 1));
  return matrix[b.length][a.length];
}

function review() {
  const list = sessions().filter(session => session.responses?.length);
  const sessionSelect = $('#session-select');
  if (!list.length) { $('#review-empty').classList.remove('hidden'); return; }
  $('#review-content').classList.remove('hidden');
  sessionSelect.innerHTML = list.map(session => `<option value="${session.id}">${esc(session.participant)} · ${new Date(session.createdAt).toLocaleDateString('ko-KR')}</option>`).join('');
  const slot = $('#rater-slot');
  const raterId = $('#rater-id');
  raterId.value = localStorage.getItem(`readingRater${slot.value}`) || '';
  slot.onchange = () => { raterId.value = localStorage.getItem(`readingRater${slot.value}`) || ''; drawSession(); };
  raterId.onchange = () => localStorage.setItem(`readingRater${slot.value}`, raterId.value.trim());
  $('#export-session').onclick = () => exportSession(list.find(session => session.id === sessionSelect.value) || list[0]);
  $('#open-session-result').onclick = () => { sessionStorage.setItem('readingResultSession', sessionSelect.value); render('result'); };
  function drawSession() {
    const session = list.find(item => item.id === sessionSelect.value) || list[0];
    const navigation = $('#response-list');
    navigation.innerHTML = session.responses.map((response, index) => {
      const a = response.ratings?.A ? 'A✓' : 'A–';
      const b = response.ratings?.B ? 'B✓' : 'B–';
      const status = response.practice ? '연습' : adjudicationLabel(response.adjudication?.status);
      return `<button class="response-item ${index === 0 ? 'active' : ''}" data-i="${index}"><b>${esc(response.stimulusId)} · ${moduleName(response.module)}</b><small>${esc(response.target.slice(0, 24))}${response.target.length > 24 ? '…' : ''}</small><small class="${response.adjudication && !['UNPAIRED', 'NEEDS_CONSENSUS'].includes(response.adjudication.status) ? 'reviewed' : ''}">${a} ${b} · ${status}</small></button>`;
    }).join('');
    $$('.response-item', navigation).forEach(button => button.onclick = () => {
      $$('.response-item', navigation).forEach(item => item.classList.remove('active'));
      button.classList.add('active');
      drawDetail(session, +button.dataset.i, slot.value, raterId.value.trim(), drawSession);
    });
    drawDetail(session, 0, slot.value, raterId.value.trim(), drawSession);
  }
  sessionSelect.onchange = drawSession;
  drawSession();
}

function adjudicationLabel(status) {
  return ({ AGREE: '일치', CONSENSUS: '합의', EXPERT_PENDING: '전문가 보류', INVALID_AUDIO: '음성 무효', NEEDS_CONSENSUS: '불일치', UNPAIRED: '독립 채점 중' })[status] || '채점 전';
}

function eventInputs(events, checked = []) {
  return events.map(event => `<label><input type="checkbox" name="rating-event" value="${esc(event)}" ${checked.includes(event) ? 'checked' : ''}><span>${esc(event)}</span></label>`).join('');
}
function scoreRadio(value, current, label) {
  return `<label><input type="radio" name="item-score" value="${value}" ${current === value ? 'checked' : ''}><span>${label}</span></label>`;
}
function candidateText(expected, transcript) {
  if (!transcript) return '전사를 입력한 뒤 비교 후보를 생성하세요.';
  if (!expected) return '<b>전문가 검토 필요</b><br>이 비단어의 허용 발음은 아직 확정되지 않았습니다.';
  const distance = levenshtein(expected, transcript);
  return `<b>${distance === 0 ? '문자열 일치 후보' : '문자열 불일치 후보'}</b><br>정규화 편집거리: ${distance}<br><small>공학 확인값일 뿐 최종 점수가 아닙니다.</small>`;
}

async function drawDetail(session, index, slot, raterId, redraw) {
  const response = session.responses[index];
  const rating = response.ratings?.[slot] || {};
  const detail = $('#review-detail');
  const qualityFlags = response.quality?.flags?.join(' · ') || '품질값 없음';
  const expected = response.expected || '허용 발음 미확정';
  const commonTop = `<p class="eyebrow">${esc(response.stimulusId)} · ${esc(response.kind || '')}${response.practice ? ' · 점수 제외' : ''}</p><h2>${esc(response.target)}</h2><div class="evidence-strip"><span>녹음 ${formatTime((response.durationMs || 0) / 1000)}</span><span>${esc(qualityFlags)}</span><span>${esc(response.condition || '')}</span></div>`;
  const audioAndTarget = `<div class="review-box"><h3>원음성</h3><audio id="review-audio" controls></audio><button class="text-button audio-download" id="download-audio">음성 파일 내려받기</button></div><div class="review-box"><h3>기대 발음 또는 기준</h3><b>${esc(expected)}</b><small>${esc(response.rule || '')}</small></div>`;
  let scoring;
  if (response.module === 'decoding') {
    scoring = `<div class="review-box span-two"><h3>${slot} 독립 채점 · 사람 전사</h3><textarea id="transcript" placeholder="원음성을 듣고 들리는 대로 입력하세요.">${esc(rating.transcript || '')}</textarea><button class="secondary" id="compare" type="button">문자열 비교 후보</button><div class="candidate" id="candidate">${candidateText(response.expected, rating.transcript)}</div></div><div class="review-box"><h3>문항 최종 판정</h3><div class="rating-row">${scoreRadio('CORRECT', rating.itemScore, '정확')}${scoreRadio('INCORRECT', rating.itemScore, '오류')}${scoreRadio('UNSCORABLE', rating.itemScore, '채점 불가')}</div></div><div class="review-box"><h3>첫 시도와 최종 시도</h3><div class="mini-fields"><label>첫 시도<select id="first-attempt"><option value="">미정</option><option value="CORRECT" ${rating.firstAttemptCorrect === 'CORRECT' ? 'selected' : ''}>정확</option><option value="INCORRECT" ${rating.firstAttemptCorrect === 'INCORRECT' ? 'selected' : ''}>오류</option></select></label><label>최종 시도<select id="final-attempt"><option value="">미정</option><option value="CORRECT" ${rating.finalAttemptCorrect === 'CORRECT' ? 'selected' : ''}>정확</option><option value="INCORRECT" ${rating.finalAttemptCorrect === 'INCORRECT' ? 'selected' : ''}>오류</option></select></label></div></div><div class="review-box span-two"><h3>확인된 오류·관찰 사건</h3><div class="rating-row">${eventInputs(DECODING_EVENTS, rating.events || [])}</div></div>`;
  } else {
    scoring = `<div class="review-box span-two"><h3>${slot} 독립 채점 · 사람 전사</h3><textarea id="transcript" placeholder="필요한 경우 실제 발화를 전사하세요.">${esc(rating.transcript || '')}</textarea></div><div class="review-box"><h3>자료 사용 여부</h3><div class="rating-row">${scoreRadio('VALID', rating.itemScore, '사용 가능')}${scoreRadio('UNSCORABLE', rating.itemScore, '채점 불가')}</div></div><div class="review-box"><h3>낭독 구간</h3><div class="mini-fields"><label>시작 ms<input type="number" min="0" id="onset-ms" value="${rating.onsetMs ?? 0}"></label><label>종료 ms<input type="number" min="0" id="speech-end-ms" value="${rating.speechEndMs ?? response.durationMs ?? 0}"></label></div></div><div class="review-box span-two"><h3>사람 확정 원자료</h3><div class="metric-inputs"><label>전체 정확 음절 수<input type="number" min="0" id="accurate-syllables" value="${rating.accurateSyllables ?? ''}"></label><label>전체 시도 음절 수<input type="number" min="0" id="attempted-syllables" value="${rating.attemptedSyllables ?? ''}"></label><label>첫 60초 정확 어절 수<input type="number" min="0" id="accurate-eojeol-60" value="${rating.accurateEojeol60 ?? ''}"></label><label>확인된 오류 수<input type="number" min="0" id="error-count" value="${rating.errorCount ?? ''}"></label></div><p class="quiet">대표 유창성 단위는 아직 확정하지 않았으므로 음절·어절 값을 함께 보존합니다.</p></div><div class="review-box span-two"><h3>확인된 오류·관찰 사건</h3><div class="rating-row">${eventInputs(FLUENCY_EVENTS, rating.events || [])}</div></div>`;
  }
  detail.innerHTML = `${commonTop}<div class="review-grid">${audioAndTarget}${scoring}<div class="review-box span-two"><h3>판정 확신과 메모</h3><label class="inline-check"><input type="checkbox" id="uncertainty" ${rating.uncertainty ? 'checked' : ''}> 이 판정은 불확실함</label><textarea id="rating-notes" placeholder="판정 이유나 모호한 경계를 기록하세요.">${esc(rating.notes || '')}</textarea></div></div><div class="review-actions"><button class="primary" id="save-review">${slot} 독립 채점 저장</button></div><div id="adjudication-panel">${adjudicationHtml(response)}</div>`;
  try {
    const blob = await getBlob(response.audioKey);
    if (blob) {
      $('#review-audio').src = URL.createObjectURL(blob);
      $('#download-audio').onclick = () => downloadBlob(blob, `${session.participant}_${response.stimulusId}.webm`);
    }
  } catch { $('#download-audio').disabled = true; }
  if ($('#compare')) $('#compare').onclick = () => { $('#candidate').innerHTML = candidateText(response.expected, $('#transcript').value); };
  $('#save-review').onclick = () => {
    const actualRaterId = ($('#rater-id')?.value || raterId).trim();
    if (!actualRaterId) return alert('채점자 코드를 입력해 주세요.');
    const itemScore = $('input[name="item-score"]:checked')?.value;
    if (!itemScore) return alert('최종 판정 또는 자료 사용 여부를 선택해 주세요.');
    const base = {
      raterSlot: slot, raterId: actualRaterId, transcript: $('#transcript')?.value || '', itemScore,
      events: $$('input[name="rating-event"]:checked').map(input => input.value), uncertainty: $('#uncertainty').checked,
      notes: $('#rating-notes').value, ratingVersion: RATING_VERSION, createdAt: now()
    };
    if (response.module === 'decoding') Object.assign(base, { firstAttemptCorrect: $('#first-attempt').value, finalAttemptCorrect: $('#final-attempt').value });
    else Object.assign(base, {
      onsetMs: numberOrNull($('#onset-ms').value), speechEndMs: numberOrNull($('#speech-end-ms').value),
      accurateSyllables: numberOrNull($('#accurate-syllables').value), attemptedSyllables: numberOrNull($('#attempted-syllables').value),
      accurateEojeol60: numberOrNull($('#accurate-eojeol-60').value), errorCount: numberOrNull($('#error-count').value)
    });
    response.ratings[slot] = base;
    response.adjudication = compareRatings(response);
    updateSessionStatus(session);
    upsertSession(session);
    alert(`${slot} 독립 채점을 저장했습니다.`);
    redraw();
  };
  bindAdjudication(response, session, redraw);
}

function numberOrNull(value) { return value === '' ? null : Number(value); }
function comparableRating(response, rating) {
  if (!rating) return null;
  const common = { itemScore: rating.itemScore, events: [...(rating.events || [])].sort(), uncertainty: Boolean(rating.uncertainty) };
  if (response.module === 'decoding') return { ...common, transcript: normalize(rating.transcript), firstAttemptCorrect: rating.firstAttemptCorrect || '', finalAttemptCorrect: rating.finalAttemptCorrect || '' };
  return { ...common, onsetMs: rating.onsetMs, speechEndMs: rating.speechEndMs, accurateSyllables: rating.accurateSyllables, attemptedSyllables: rating.attemptedSyllables, accurateEojeol60: rating.accurateEojeol60, errorCount: rating.errorCount };
}
function compareRatings(response) {
  const a = response.ratings?.A, b = response.ratings?.B;
  if (!a || !b) return { status: 'UNPAIRED', comparedAt: now(), finalRating: null };
  const exact = JSON.stringify(comparableRating(response, a)) === JSON.stringify(comparableRating(response, b));
  return exact
    ? { status: a.itemScore === 'UNSCORABLE' ? 'INVALID_AUDIO' : 'AGREE', comparedAt: now(), selectedSlot: 'A', finalRating: { ...a } }
    : { status: 'NEEDS_CONSENSUS', comparedAt: now(), finalRating: null };
}
function ratingSummary(rating, module) {
  if (!rating) return '<p>아직 저장되지 않았습니다.</p>';
  if (module === 'decoding') return `<p><b>${esc(rating.itemScore)}</b> · “${esc(rating.transcript)}”</p><small>${esc((rating.events || []).join(', ') || '오류 사건 없음')}</small>`;
  return `<p><b>${esc(rating.itemScore)}</b> · 정확 음절 ${rating.accurateSyllables ?? '–'} · 첫 60초 정확 어절 ${rating.accurateEojeol60 ?? '–'}</p><small>${esc((rating.events || []).join(', ') || '오류 사건 없음')}</small>`;
}
function adjudicationHtml(response) {
  if (response.practice) return '<div class="adjudication muted-panel"><b>연습 항목</b><p>채점과 원점수에서 제외됩니다.</p></div>';
  const a = response.ratings?.A, b = response.ratings?.B;
  if (!a || !b) return '<div class="adjudication"><b>독립 채점 진행 중</b><p>두 슬롯이 모두 저장되기 전에는 상대 판정을 비교하지 않습니다.</p></div>';
  const status = response.adjudication?.status;
  return `<div class="adjudication"><div class="adjudication-title"><div><p class="eyebrow">잠정 기준 자료</p><h3>${adjudicationLabel(status)}</h3></div><span class="state-pill ${status?.toLowerCase()}">${esc(status)}</span></div><div class="rater-compare"><div><b>채점 A · ${esc(a.raterId)}</b>${ratingSummary(a, response.module)}</div><div><b>채점 B · ${esc(b.raterId)}</b>${ratingSummary(b, response.module)}</div></div>${status === 'NEEDS_CONSENSUS' ? '<p class="notice warning">두 판정이 다릅니다. 원음성과 규칙을 다시 본 뒤 합의해 한 값을 채택하거나 전문가 검토로 보류하세요.</p><div class="button-row compact"><button class="secondary" data-adjudicate="A">합의 후 A 값 채택</button><button class="secondary" data-adjudicate="B">합의 후 B 값 채택</button><button class="secondary danger" data-adjudicate="EXPERT_PENDING">전문가 검토로 보류</button></div>' : '<p class="quiet">일치한 판정은 AGREE, 채점 불가 일치는 INVALID_AUDIO로 저장됩니다.</p>'}</div>`;
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

function exportSession(session) {
  const payload = JSON.parse(JSON.stringify(session));
  payload.exportedAt = now();
  payload.exportNotice = '오디오 바이트는 포함되지 않음. 각 검토 화면에서 원음성을 별도 내려받아 response.audioKey와 함께 보관.';
  downloadBlob(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }), `${session.participant}_${session.id}_research-bundle.json`);
}
function downloadBlob(blob, filename) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

function result() {
  const list = sessions().filter(session => scoredResponses(session).length);
  const select = $('#result-session-select');
  if (!list.length) { $('#result-empty').classList.remove('hidden'); return; }
  select.innerHTML = list.map(session => `<option value="${session.id}">${esc(session.participant)} · ${new Date(session.createdAt).toLocaleDateString('ko-KR')}</option>`).join('');
  const preferred = sessionStorage.getItem('readingResultSession');
  if (preferred && list.some(session => session.id === preferred)) select.value = preferred;
  const draw = () => drawResult(list.find(session => session.id === select.value) || list[0]);
  select.onchange = draw;
  draw();
}

function drawResult(session) {
  const responses = scoredResponses(session);
  const decoding = responses.filter(response => response.module === 'decoding');
  const fluency = responses.filter(response => response.module === 'fluency');
  const usable = response => ['AGREE', 'CONSENSUS'].includes(response.adjudication?.status) && response.adjudication?.finalRating;
  const scoredDecoding = decoding.filter(usable);
  const correct = scoredDecoding.filter(response => response.adjudication.finalRating.itemScore === 'CORRECT').length;
  const invalid = responses.filter(response => response.adjudication?.status === 'INVALID_AUDIO').length;
  const expert = responses.filter(response => response.adjudication?.status === 'EXPERT_PENDING').length;
  const pending = responses.filter(response => !response.adjudication || ['UNPAIRED', 'NEEDS_CONSENSUS'].includes(response.adjudication.status)).length;
  const conditions = [...new Set(decoding.map(response => response.condition))];
  const conditionRows = conditions.map(condition => {
    const group = decoding.filter(response => response.condition === condition && usable(response));
    const groupCorrect = group.filter(response => response.adjudication.finalRating.itemScore === 'CORRECT').length;
    return `<tr><td>${esc(condition)}</td><td>${groupCorrect} / ${group.length}</td></tr>`;
  }).join('');
  const fluencyCards = fluency.map(response => {
    const rating = response.adjudication?.finalRating;
    if (!rating) return `<article class="result-card pending-result"><p class="eyebrow">${esc(response.stimulusId)}</p><h3>${esc(response.kind)}</h3><p>${adjudicationLabel(response.adjudication?.status)}</p></article>`;
    const seconds = Math.max(0, ((rating.speechEndMs ?? response.durationMs) - (rating.onsetMs ?? 0)) / 1000);
    const rate10 = rating.accurateSyllables != null && seconds > 0 ? (rating.accurateSyllables / seconds * 10).toFixed(1) : '–';
    return `<article class="result-card"><p class="eyebrow">${esc(response.stimulusId)} · ${adjudicationLabel(response.adjudication.status)}</p><h3>${esc(response.kind)}</h3><dl><div><dt>실제 낭독 구간</dt><dd>${seconds ? `${seconds.toFixed(1)}초` : '–'}</dd></div><div><dt>전체 정확 음절</dt><dd>${rating.accurateSyllables ?? '–'}</dd></div><div><dt>10초당 정확 음절</dt><dd>${rate10}</dd></div><div><dt>첫 60초 정확 어절</dt><dd>${rating.accurateEojeol60 ?? '–'}</dd></div><div><dt>확인 오류</dt><dd>${rating.errorCount ?? '–'}</dd></div></dl></article>`;
  }).join('');
  $('#result-content').innerHTML = `<div class="notice warning"><b>진단 결과가 아닙니다.</b> 표준점수·백분위·난독증 판정 없이 두 채점자가 확인한 원점수와 보류 상태만 표시합니다.</div><div class="result-meta"><span>참여자 ${esc(session.participant)}</span><span>${esc(session.ageBand)}</span><span>상태 ${esc(session.status)}</span><span>정책 ${esc(session.policyVersion)}</span></div><div class="result-kpis"><article><small>해독 정확</small><b>${correct} / ${scoredDecoding.length}</b><span>잠정 확정 문항만</span></article><article><small>전문가 보류</small><b>${expert}</b><span>점수에서 제외</span></article><article><small>채점 진행 중</small><b>${pending}</b><span>독립 채점 또는 합의 필요</span></article><article><small>무효 음성</small><b>${invalid}</b><span>원점수에서 제외</span></article></div><section class="result-section"><h2>단어 해독 조건별 원점수</h2>${conditionRows ? `<div class="table-wrap"><table><thead><tr><th>조건</th><th>정확 / 채점 가능</th></tr></thead><tbody>${conditionRows}</tbody></table></div>` : '<p class="quiet">확정된 해독 문항이 없습니다.</p>'}</section><section class="result-section"><h2>읽기 유창성 원자료</h2><div class="fluency-results">${fluencyCards || '<p class="quiet">유창성 기록이 없습니다.</p>'}</div></section><section class="evidence-note"><h2>결과 해석 범위</h2><ul><li>문항과 지문은 기능 시험용 후보이며 난이도와 동형성이 확정되지 않았습니다.</li><li>문자열 편집거리는 공학 확인값이며 점수로 사용하지 않습니다.</li><li>AGREE와 CONSENSUS를 구분하여 보존하고 EXPERT_PENDING은 모델 정답으로 사용하지 않습니다.</li></ul></section>`;
}

$('#reset-data').onclick = () => {
  if (confirm('이 기기에 저장된 모든 검사 기록과 원음성을 삭제할까요? 이 작업은 되돌릴 수 없습니다.')) {
    localStorage.removeItem('readingSessions');
    indexedDB.deleteDatabase('ReadingPrototypeDB');
    render('home');
  }
};

render('home');
