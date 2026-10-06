const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const app = $('#app');

const APP_VERSION = window.ReadingPrototypeVersion.VERSION;
const POLICY_VERSION = 'reading-research-policy-0.2';
const CONTENT_VERSION = 'engineering-form-0.7';
const EXTENSION_POLICY_VERSION = 'core-extension-policy-0.1';
const RATING_VERSION = 'dual-rater-rule-0.3';
// 허용 발음 목록의 버전. 표준 발음법(국립국어원 표준어 규정 제2부)을 적용한 후보이며 전문가 검토 전이다.
const PRONUNCIATION_DICT_VERSION = 'accepted-forms-0.3';
const S = window.Scoring;
const SPEC = window.AssessmentSpec;
const TTS_ASSETS = window.ReadingTtsAssets;
const ITEM_BANK = window.ReadingItemBank;
const EVIDENCE = window.ReadingEvidenceEngine;
SPEC.applyVisualTokens(document.documentElement);
document.title = `읽기지도 · ${window.ReadingPrototypeVersion.LABEL}`;

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
    { id: 'RW-I-01', text: '국물', accepted: ['궁물'], lexicality: 'real', regularity: 'phonological', kind: '실제단어', condition: '실제·음운변동', rule: '비음화 (제18항)' },
    { id: 'RW-I-02', text: '설날', accepted: ['설랄'], lexicality: 'real', regularity: 'phonological', kind: '실제단어', condition: '실제·음운변동', rule: '유음화 (제20항)' },
    { id: 'RW-I-03', text: '같이', accepted: ['가치'], lexicality: 'real', regularity: 'phonological', kind: '실제단어', condition: '실제·음운변동', rule: '구개음화 (제17항)' },
    { id: 'RW-I-04', text: '입학', accepted: ['이팍'], lexicality: 'real', regularity: 'phonological', kind: '실제단어', condition: '실제·음운변동', rule: '기식음화 (제12항)' },
    { id: 'NW-C-01', text: '두버', accepted: ['두버'], lexicality: 'nonword', regularity: 'consistent', kind: '비단어', condition: '비단어·표기-발음 일치', rule: '규칙적' },
    { id: 'NW-C-02', text: '머자', accepted: ['머자'], lexicality: 'nonword', regularity: 'consistent', kind: '비단어', condition: '비단어·표기-발음 일치', rule: '규칙적' },
    { id: 'NW-C-03', text: '바너', accepted: ['바너'], lexicality: 'nonword', regularity: 'consistent', kind: '비단어', condition: '비단어·표기-발음 일치', rule: '규칙적' },
    { id: 'NW-C-04', text: '우덩', accepted: ['우덩'], lexicality: 'nonword', regularity: 'consistent', kind: '비단어', condition: '비단어·표기-발음 일치', rule: '규칙적' },
    { id: 'NW-I-01', text: '덕문', accepted: ['덩문'], lexicality: 'nonword', regularity: 'phonological', kind: '비단어', condition: '비단어·음운변동', rule: '비음화 (제18항)' },
    { id: 'NW-I-02', text: '말논', accepted: ['말론'], lexicality: 'nonword', regularity: 'phonological', kind: '비단어', condition: '비단어·음운변동', rule: '유음화 (제20항)' },
    { id: 'NW-I-03', text: '텥이', accepted: ['테치'], lexicality: 'nonword', regularity: 'phonological', kind: '비단어', condition: '비단어·음운변동', rule: '구개음화 (제17항)' },
    { id: 'NW-I-04', text: '덥한', accepted: ['더판'], lexicality: 'nonword', regularity: 'phonological', kind: '비단어', condition: '비단어·음운변동', rule: '기식음화 (제12항)' },
  ],
  fluencyPractice: [
    { id: 'FP-01', kind: '연습 지문', practice: true, text: '아침이 되자 창문으로 밝은 햇빛이 들어왔습니다.' }
  ],
  fluency: [
    ITEM_BANK.B_WORD_EFFICIENCY,
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
// 검사 분량. 데모는 2×2 조건마다 2문항(선별은 1문항)과 지문 1개로 줄여 5분 안팎에 끝나게 한다.
// 전체는 위 문항 전부. 문항 수는 프로토타입 단계의 기능 확인용이며 신뢰도 확보에 필요한 수가 아니다.
const LENGTHS = {
  demo: { label: '데모', screening: ['S-W1', 'S-W2', 'S-W3', 'S-W4'], decoding: ['RW-C-01', 'RW-C-02', 'RW-I-01', 'RW-I-03', 'NW-C-01', 'NW-C-02', 'NW-I-01', 'NW-I-02'], fluency: ['B-WE-01', 'F-A'] },
  full: { label: '전체' }
};
function itemSet(session, key) {
  let all = key === 'screening' ? stimuli.screening.words : stimuli[key];
  if (key === 'fluency') all = all.map(item => item.taskType === 'timed-word-list' ? ITEM_BANK.wordEfficiencyForParticipant(session?.participant) : item);
  const ids = LENGTHS[session?.length || 'full']?.[key];
  return ids ? all.filter(item => ids.includes(item.id)) : all;
}
// 지문 길이 메타데이터는 본문에서 계산해 버전과 함께 저장한다.
for (const passage of [...stimuli.fluencyPractice, ...stimuli.fluency]) {
  const tokens = S.tokenizePassage(passage.text);
  passage.meta = { eojeol: tokens.length, syllables: S.countSyllables(passage.text), sentences: (passage.text.match(/[.!?]/g) || []).length, contentVersion: CONTENT_VERSION };
}
for (const item of stimuli.decoding) item.sourceMeta = ITEM_BANK.A_REAL_WORDS[item.id]
  ? { ...ITEM_BANK.A_REAL_WORDS[item.id], features: ITEM_BANK.A_WORD_FEATURES[item.id] }
  : { source: 'nikl-2023-collision-and-bigram-audit', audit: ITEM_BANK.A_NONWORD_AUDITS[item.id], validationStatus: 'DIGITAL_PREFILTER_PASS_WITH_ORTHOGRAPHIC_PROXY_PENDING_PRONUNCIATION_CORPUS_AND_PILOT' };
const stimulusById = id => [...stimuli.decodingPractice, ...stimuli.decoding, ...stimuli.fluencyPractice, ...stimuli.fluency].find(item => item.id === id);

// A 경로 문항 청사진. 현재 2×2 구조는 코드에서 강제하지만, 빈도·음절 구조 매칭과
// 전문가 내용타당도·파일럿 문항통계·DIF가 끝나기 전에는 표준화 문항으로 부르지 않는다.
const A_ITEM_BLUEPRINT = Object.freeze({
  version: 'a-decoding-blueprint-0.2',
  design: 'lexicality(real/nonword) × spellingSound(consistent/phonological)',
  requiredPerCell: 4,
  selectionGates: ['official-vocabulary-grade-and-homonym-audit', 'spoken-corpus-frequency-audit', 'paired-syllable-and-coda-match', 'official-lexicon-collision-audit', 'orthographic-syllable-bigram-proxy', 'standard-pronunciation-rule-audit', 'pronunciation-corpus-phonotactic-pending', 'pilot-difficulty-discrimination', 'reliability-and-dif'],
  validationStatus: 'LITERATURE_AND_OFFICIAL_DATA_ENGINEERED_PENDING_PILOT'
});
function auditADecodingBlueprint(items = stimuli.decoding) {
  const counts = {};
  for (const item of items) counts[`${item.lexicality}:${item.regularity}`] = (counts[`${item.lexicality}:${item.regularity}`] || 0) + 1;
  const required = ['real:consistent', 'real:phonological', 'nonword:consistent', 'nonword:phonological'];
  return { version: A_ITEM_BLUEPRINT.version, counts, balanced: required.every(key => counts[key] === A_ITEM_BLUEPRINT.requiredPerCell), validationStatus: A_ITEM_BLUEPRINT.validationStatus };
}
const A_BLUEPRINT_AUDIT = Object.freeze(auditADecodingBlueprint());

// D 경로의 동적평가 후보. 세 조건은 서로 다른 문항을 쓰며 참여자 코드로 문항-조건 조합을 회전한다.
// 동형성이 검증되기 전이므로 기본 글 이해 점수와 절대 합치지 않는다.
const SUPPORT_EXPERIMENT_VERSION = 'support-pilot-0.1';
const SUPPORT_FORMS = [
  { id: 'SUP-A', passage: '학교 옥상에는 빗물을 모으는 통이 있다. 비가 오면 지붕을 따라 흐른 물이 통에 모인다. 학생들은 이 물을 화단에 주어 수돗물 사용을 줄였다.', evidence: '학생들은 이 물을 화단에 주어 수돗물 사용을 줄였다.', question: '빗물 통을 설치한 결과는?', options: ['화단에 쓸 수돗물이 줄었다', '학교에 비가 오지 않았다', '옥상이 더 넓어졌다', '학생 수가 늘었다'], answer: '화단에 쓸 수돗물이 줄었다' },
  { id: 'SUP-B', passage: '마을 도서관은 책을 늦게 반납하는 사람이 많아 고민했다. 반납일 하루 전에 문자로 알려 주기 시작하자 늦게 돌아오는 책이 줄었고, 다른 사람도 책을 제때 빌릴 수 있었다.', evidence: '반납일 하루 전에 문자로 알려 주기 시작하자 늦게 돌아오는 책이 줄었고', question: '문자 안내가 만든 변화는?', options: ['책이 제때 돌아오는 경우가 늘었다', '도서관의 책이 모두 사라졌다', '대출 기간이 없어졌다', '문자를 받는 사람이 줄었다'], answer: '책이 제때 돌아오는 경우가 늘었다' },
  { id: 'SUP-C', passage: '공원 산책로의 밤 조명이 너무 밝아 곤충이 모여들었다. 관리소가 빛을 아래쪽으로 비추고 밝기를 낮추자 길은 계속 보였지만 조명 주변의 곤충은 줄었다.', evidence: '빛을 아래쪽으로 비추고 밝기를 낮추자 길은 계속 보였지만 조명 주변의 곤충은 줄었다.', question: '관리소의 해결 방법이 알맞았던 까닭은?', options: ['길을 보이게 하면서 곤충 피해를 줄여서', '산책로를 완전히 어둡게 해서', '곤충을 더 많이 모아서', '공원을 낮에만 열어서'], answer: '길을 보이게 하면서 곤충 피해를 줄여서' }
];

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
  recordingDeadlineTimer: null,
  seconds: 0, taskQueue: [], taskIndex: 0, currentBlob: null, currentQuality: null,
  shownAt: null, recordingStartedAt: null, recordingStartedPerf: null, currentTaskTiming: null,
  currentPresentationAudit: null, presentationAuditCleanup: null, recordingStopReason: null,
  choiceExposureTimeout: null, preparedChoices: {}, performanceObserver: null
};

const uid = () => crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
const now = () => new Date().toISOString();
const esc = value => String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
const MODULE_NAMES = { decoding: '단어 해독', fluency: '읽기 유창성', phonology: '글자·소리 처리', silent: '디지털 읽기 연구 확장', language: '언어 이해', comprehension: '글 이해' };
const moduleName = module => MODULE_NAMES[module] || module;
// 녹음·음성인식으로 채점하는 모듈과, 보기를 눌러 바로 채점하는 선택형 모듈(battery.js)
const RECORDING_MODULES = ['decoding', 'fluency'];
const isChoiceModule = module => Boolean(CHOICE_MODULES[module]);
// 경로(브리핑 v1.2 A~D)마다 실시하는 모듈
const PATH_MODULES = { A: ['decoding', 'phonology'], B: ['fluency'], C: ['language'], D: ['comprehension'] };
const MODULE_PATH = { decoding: 'A', fluency: 'B', language: 'C', comprehension: 'D', phonology: 'A', silent: 'B' };
// 모듈별 검사 카드는 경로 단위로 실시한다. B의 ROAR/TOSREC 계열 과제는 한국어 규준이
// 없으므로 기본 B에서 제외하고 연구자 설정을 켠 세션에만 추가한다.
const MODULE_GROUP = { decoding: PATH_MODULES.A, fluency: PATH_MODULES.B };
const GROUP_NAMES = { decoding: 'A 글자·소리 처리와 단어 해독', fluency: 'B 읽기 유창성' };
const groupName = module => GROUP_NAMES[module] || moduleName(module);
const modulesForPaths = (paths, options = {}) => {
  const selected = new Set(paths.flatMap(path => PATH_MODULES[path] || []));
  if (paths.includes('B') && options.digitalReadingExtensionEnabled) selected.add('silent');
  return Object.keys(MODULE_NAMES).filter(module => selected.has(module));
};
const extensionEnabledForSubtest = (session, subtest) => subtest.status !== 'research' || ({
  digitalReading: session?.digitalReadingExtensionEnabled,
  morphology: session?.morphologyExtensionEnabled,
  advancedComprehension: session?.advancedComprehensionExtensionEnabled
}[subtest.extension] === true);
const scoredResponses = session => (session.responses || []).filter(response => !response.practice);

function migrateSession(session) {
  session.schemaVersion ||= '0.2';
  session.assessmentSpecVersion ||= 'legacy-unrecorded';
  session.presentationLog ||= [];
  session.ttsEvents ||= [];
  session.performanceLog ||= { supported: false, longTasks: [], frameGaps: [] };
  session.extensionPolicyVersion ||= 'legacy-unrecorded';
  session.evidenceEngineVersion ||= 'legacy-unrecorded';
  session.itemEvidenceVersion ||= 'legacy-unrecorded';
  session.environment ||= session.deviceMetadata ? { ...session.deviceMetadata, legacy: true } : null;
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
const SESSION_VIEWS = new Set(['preflight', 'mic', 'screen', 'route', 'task', 'choice', 'scaffold', 'complete']);
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
  if (view === 'choice' && !state.choiceQueue?.length) return false;
  return true;
}

function render(name, { history: mode = 'push' } = {}) {
  const keepScroll = name === 'choice' && state.view === 'choice';
  const previousScrollY = window.scrollY;
  if (!canShow(name)) {
    // 새로고침 등으로 진행 상태가 사라졌으면 가장 가까운 안전한 화면으로 보낸다.
    name = (name === 'task' || name === 'choice') && state.session ? 'route' : name === 'preview' && state.session ? 'complete' : 'home';
    if (!canShow(name)) name = 'home';
    mode = 'replace';
  }
  const depth = window.history.state?.depth || 0;
  if (mode === 'push' && name !== state.view) window.history.pushState({ view: name, depth: depth + 1 }, '', `#${name}`);
  else if (mode !== 'none') window.history.replaceState({ view: name, depth }, '', `#${name}`);
  if (state.session) sessionStorage.setItem(ACTIVE_KEY, state.session.id);
  state.view = name;
  if (state.choiceTimer) { clearInterval(state.choiceTimer); state.choiceTimer = null; }
  if (state.choiceTimeout) { clearTimeout(state.choiceTimeout); state.choiceTimeout = null; }
  if (state.choiceExposureTimeout) { clearTimeout(state.choiceExposureTimeout); state.choiceExposureTimeout = null; }
  document.onkeydown = null;
  window.speechSynthesis?.cancel();
  const template = $(`#${name}-template`);
  app.innerHTML = '';
  app.append(template.content.cloneNode(true));
  app.focus({ preventScroll: true });
  window.scrollTo(0, keepScroll ? previousScrollY : 0);
  bindCommon();
  ({ home, setup, preflight, mic, screen, route, task, choice, scaffold, complete, review, result, preview, report, 'tts-lab': ttsLab }[name] || (() => {}))();
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
  if (from === 'screen') { if (!confirm('선별을 중단할까요? 진행 중인 선별 응답은 저장되지 않습니다.')) return false; stopStream(); }
  if (from === 'choice' && to !== 'choice') {
    if (!confirm('검사를 중단하고 나갈까요? 지금까지 답한 내용은 남습니다.')) return false;
    if (state.session) { state.session.status = 'INTERRUPTED'; state.session.updatedAt = now(); upsertSession(state.session); }
    state.choiceQueue = null;
  }
  if (from === 'scaffold' && to !== 'scaffold' && to !== 'complete') {
    if (!confirm('추가 읽기 활동을 중단할까요? 지금까지 기록은 남습니다.')) return false;
    if (state.session?.supportExperiment) { state.session.supportExperiment.interruptedAt = now(); upsertSession(state.session); }
  }
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
  $$('[data-app-version]').forEach(element => { element.textContent = window.ReadingPrototypeVersion.LABEL; });
  $$('[data-action="home"]', app).forEach(button => button.onclick = () => { if (leaveGuard(state.view, 'home')) { stopStream(); render('home'); } });
  $$('[data-action="back"]', app).forEach(button => button.onclick = () => goBack());
  $$('[data-action="new-session"]', app).forEach(button => button.onclick = () => { state.setupMode = { mode: 'full' }; render('setup'); });
  $$('[data-action="new-module"]', app).forEach(button => button.onclick = () => { state.setupMode = { mode: 'module', module: button.dataset.module }; render('setup'); });
  $$('[data-action="open-review"]', app).forEach(button => button.onclick = () => render('review'));
  $$('[data-action="open-tts-lab"]', app).forEach(button => button.onclick = () => render('tts-lab'));
  $$('[data-action="open-results"]', app).forEach(button => button.onclick = () => render('result'));
  $$('[data-action="open-report"]', app).forEach(button => button.onclick = () => render('report'));
}

function home() {
  drawAsrState();
  // 음성인식은 연구자가 명시적으로 요청할 때만 받는다. 참여자 흐름과 CPU/GPU·네트워크 경쟁을 만들지 않는다.
  if ($('#preload-asr')) $('#preload-asr').onclick = () => preloadAsr();
  bindImport($('#import-session-home'));
  if ($('#load-demo')) $('#load-demo').onclick = () => {
    const demo = buildDemoSession();
    upsertSession(demo);
    sessionStorage.setItem('readingResultSession', demo.id);
    sessionStorage.setItem('readingReviewSession', demo.id);
    render('report');
  };
}

function savedTtsPreference() {
  try { return JSON.parse(localStorage.getItem('readingTtsPreference') || 'null'); }
  catch { return null; }
}

function ttsLab() {
  const select = $('#tts-voice-select');
  const rate = $('#tts-rate');
  const rateOutput = $('#tts-rate-output');
  const status = $('#tts-lab-status');
  const current = $('#tts-current');
  const saved = savedTtsPreference();
  let lastPreview = null;
  const drawCurrent = () => {
    const preference = savedTtsPreference();
    current.innerHTML = preference ? `<b>현재 연구 후보:</b> ${esc(preference.name)} · 엔진 ${preference.rate}× · 실측 ${preference.measuredSpm || '–'} SPM · ${preference.validationStatus === 'PASS' ? '파일럿 범위 통과' : '추가 검증 필요'} · 자연스러움 ${preference.ratings?.naturalness || '–'}/5 · 명료도 ${preference.ratings?.clarity || '–'}/5` : '<b>아직 고정한 연구 후보가 없습니다.</b>';
  };
  const voices = () => {
    const list = (speechSynthesis.getVoices() || []).filter(voice => /^ko(?:-|$)/i.test(voice.lang || ''));
    const preferred = SPEC.selectKoreanVoice(list);
    return preferred ? [preferred, ...list.filter(voice => voice !== preferred)] : list;
  };
  const drawVoices = () => {
    const list = voices();
    select.innerHTML = list.length ? list.map(voice => `<option value="${esc(voice.name)}">${esc(voice.name)} · ${esc(voice.lang)}${voice.localService ? ' · 로컬' : ' · 온라인'}${SPEC.TTS.preferredVoiceHints.some(hint => voice.name.toLowerCase().includes(hint)) ? ' · 고품질 후보' : ''}</option>`).join('') : '<option value="">한국어 음성을 찾지 못했습니다</option>';
    if (saved?.name && list.some(voice => voice.name === saved.name)) select.value = saved.name;
  };
  drawVoices();
  speechSynthesis.addEventListener?.('voiceschanged', drawVoices, { once: true });
  rate.value = saved?.rate || SPEC.TTS.rate;
  if (saved?.ratings) {
    $('#tts-naturalness').value = saved.ratings.naturalness || '';
    $('#tts-clarity').value = saved.ratings.clarity || '';
    $('#tts-speed-fit').value = saved.ratings.speedFit || '';
  }
  rateOutput.textContent = `${Number(rate.value).toFixed(2)}×`;
  rate.oninput = () => { rateOutput.textContent = `${Number(rate.value).toFixed(2)}×`; };
  $('#tts-play').onclick = () => {
    const voice = voices().find(candidate => candidate.name === select.value);
    if (!voice) { status.textContent = '선택한 한국어 음성을 사용할 수 없습니다.'; return; }
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance($('#tts-sample').value);
    utterance.voice = voice; utterance.lang = 'ko-KR'; utterance.rate = Number(rate.value); utterance.pitch = 1; utterance.volume = 1;
    const started = performance.now();
    utterance.onstart = () => { status.textContent = '재생 중…'; };
    utterance.onend = () => {
      const duration = performance.now() - started;
      const spm = SPEC.estimateSpm(utterance.text, duration);
      const inRange = spm >= SPEC.TTS.targetSpm.min && spm <= SPEC.TTS.targetSpm.max;
      lastPreview = { voiceName: voice.name, rate: Number(rate.value), durationMs: Math.round(duration), spm, wpm: SPEC.estimateWpm(utterance.text, duration), inRange };
      status.textContent = `재생 완료 · ${lastPreview.wpm} WPM / ${spm} SPM · ${inRange ? '속도 후보 범위 안' : '속도 후보 범위 밖'}`;
    };
    utterance.onerror = event => { status.textContent = `재생 실패: ${event.error || 'TTS_ERROR'}`; };
    speechSynthesis.speak(utterance);
  };
  $('#tts-save').onclick = () => {
    const voice = voices().find(candidate => candidate.name === select.value);
    if (!voice) { status.textContent = '먼저 사용할 수 있는 한국어 음성을 선택하세요.'; return; }
    const ratings = { naturalness: numberOrNull($('#tts-naturalness').value), clarity: numberOrNull($('#tts-clarity').value), speedFit: numberOrNull($('#tts-speed-fit').value) };
    if (!lastPreview || lastPreview.voiceName !== voice.name || lastPreview.rate !== Number(rate.value)) { status.textContent = '이 음성과 속도를 먼저 재생해 실제 SPM을 확인하세요.'; return; }
    if (Object.values(ratings).some(value => value == null)) { status.textContent = '자연스러움·명료도·속도 적절성을 모두 평가하세요.'; return; }
    const validationStatus = lastPreview.inRange && ratings.naturalness >= 4 && ratings.clarity >= 4 && ratings.speedFit >= 4 ? 'PASS' : 'REVIEW_REQUIRED';
    const preference = { name: voice.name, lang: voice.lang, localService: Boolean(voice.localService), rate: Number(rate.value), measuredSpm: lastPreview.spm, measuredWpm: lastPreview.wpm, validationStatus,
      ratings,
      sample: $('#tts-sample').value, selectedAt: now(), appVersion: APP_VERSION };
    localStorage.setItem('readingTtsPreference', JSON.stringify(preference));
    status.textContent = validationStatus === 'PASS' ? '파일럿 후보로 저장했습니다. 다음 새 검사부터 우선 사용합니다.' : '후보 기록은 저장했지만 속도 또는 청취평가 기준을 통과하지 않아 자동 선택에는 쓰지 않습니다.';
    drawCurrent();
  };
  drawCurrent();
}

// 두 가지 실시 방식
// - full: 전체 흐름. 짧은 선별 → 경로 추천 → 세부검사 → 결과지 (실제 검사용 설계)
// - module: 모듈별 검사. 선별 없이 단어 해독 또는 읽기 유창성 하나만 실시하고 그 모듈의 결과지만 본다 (시연·모듈 검증용)
function setup() {
  const setupMode = state.setupMode || { mode: 'full' };
  if (setupMode.mode === 'module') {
    $('#setup-title').textContent = `${groupName(setupMode.module)} 검사를 준비합니다`;
    $('#setup-route-note').innerHTML = `선별 없이 <b>${esc(groupName(setupMode.module))}</b>${MODULE_GROUP[setupMode.module] ? ` (${MODULE_GROUP[setupMode.module].map(moduleName).join(' + ')})` : ''}만 실시하고, 끝나면 이 경로의 결과지를 봅니다.${isChoiceModule(setupMode.module) ? ' 녹음 없이 보기를 눌러 답하는 검사입니다.' : ''}`;
    if (isChoiceModule(setupMode.module)) $('#setup-form button[type=submit]').textContent = '검사 환경 확인으로 이동';
    $$('.stepper span').forEach((span, i) => { if (i === 1) span.textContent = isChoiceModule(setupMode.module) ? '검사' : '장치 점검'; });
    if (setupMode.module !== 'decoding') $('#random-order-row').classList.add('hidden');
    if (setupMode.module !== 'comprehension') $('#support-experiment-row').classList.add('hidden');
    if (setupMode.module !== 'fluency') $('#digital-reading-extension-row').classList.add('hidden');
    if (setupMode.module !== 'language') $('#morphology-extension-row').classList.add('hidden');
    if (setupMode.module !== 'comprehension') $('#advanced-comprehension-extension-row').classList.add('hidden');
  }
  $('#setup-form').onsubmit = event => {
    event.preventDefault();
    const form = new FormData(event.target);
    const moduleMode = setupMode.mode === 'module';
    const extensionOptions = {
      digitalReadingExtensionEnabled: form.get('digitalReadingExtension') === 'on',
      morphologyExtensionEnabled: form.get('morphologyExtension') === 'on',
      advancedComprehensionExtensionEnabled: form.get('advancedComprehensionExtension') === 'on'
    };
    const modulePath = MODULE_PATH[setupMode.module];
    // 전체 흐름이면 실시할 모듈과 경로는 선별 결과로 정한다 (screen → route).
    state.session = {
      id: uid(), participant: form.get('participant').trim(), ageBand: form.get('ageBand'), mode: setupMode.mode, modules: moduleMode ? modulesForPaths([modulePath], extensionOptions) : [], orderPolicy: form.get('randomOrder') ? 'random' : 'fixed', previewPaths: [], length: form.get('length') || 'demo', supportExperimentEnabled: form.get('supportExperiment') === 'on', ...extensionOptions,
      createdAt: now(), updatedAt: now(), screening: {}, responses: [], status: 'CREATED',
      appVersion: APP_VERSION, formVersion: CONTENT_VERSION, policyVersion: POLICY_VERSION, ratingVersion: RATING_VERSION, pronunciationDictVersion: PRONUNCIATION_DICT_VERSION,
      sttModelVersion: 'not-connected', schemaVersion: '0.5', assessmentSpecVersion: SPEC.VERSION, extensionPolicyVersion: EXTENSION_POLICY_VERSION,
      evidenceEngineVersion: EVIDENCE.VERSION, itemEvidenceVersion: ITEM_BANK.VERSION,
      aItemBlueprint: A_BLUEPRINT_AUDIT,
      environment: SPEC.environmentSnapshot(window), presentationLog: [], ttsEvents: [],
      performanceLog: { supported: false, longTasks: [], frameGaps: [] },
      deviceMetadata: { userAgent: navigator.userAgent, platform: navigator.platform || 'unknown', language: navigator.language }
    };
    upsertSession(state.session);
    render('preflight');
  };
}

// 화면마다 물리 크기가 달라지는 문제를 줄이기 위한 실시 전 점검.
// 신용카드(ISO/IEC 7810 ID-1, 85.60mm)를 기준으로 사용자가 맞춘 CSS px/mm를 저장하고 자극 크기에 적용한다.
function preflight() {
  const session = state.session;
  const size = $('#calibration-size');
  const ruler = $('#calibration-ruler');
  const output = $('#calibration-output');
  const continueButton = $('#preflight-continue');
  const distance = $('#distance-confirm');
  const display = $('#display-confirm');
  const environment = SPEC.environmentSnapshot(window);
  const viewport = environment.viewport;
  const ttsCoverage = TTS_ASSETS.coverage();
  const selectedVoice = koreanVoice(session);
  const ttsPreference = savedTtsPreference();
  const choiceOnly = session.mode === 'module' && session.modules.every(isChoiceModule);
  const checks = [
    ['화면', `${viewport.width}×${viewport.height} CSS px · scale ${viewport.scale}`],
    ['자극 글꼴', `${SPEC.VISUAL.intendedFont} 우선 · ${environment.visualSpec.intendedFontReady ? '준비됨' : '기기 대체 글꼴 사용 가능'}`],
    ['글자 대비', `${SPEC.contrastRatio(SPEC.VISUAL.foreground, SPEC.VISUAL.background)}:1 · AA 목표 통과`],
    ['조작 영역', `최소 ${SPEC.VISUAL.controlTargetCssPx}px`],
    ['고정 음원', `${ttsCoverage.ready}개 · ${ttsCoverage.status}`]
  ];
  $('#preflight-checks').innerHTML = checks.map(([name, value]) => `<div class="preflight-check"><b>${esc(name)}</b>${esc(value)}</div>`).join('');
  $('#tts-readiness').innerHTML = ttsCoverage.ready
    ? `<b>고정 음원 준비:</b> ${ttsCoverage.ready}개를 미리 불러옵니다.`
    : ttsPreference?.validationStatus === 'PASS' && selectedVoice ? `<b>파일럿 기준을 통과한 TTS 후보:</b> “${esc(selectedVoice.name)}” · 실측 ${ttsPreference.measuredSpm || '–'} SPM · 자연스러움 ${ttsPreference.ratings?.naturalness || '–'}/5 · 명료도 ${ttsPreference.ratings?.clarity || '–'}/5. 실제 사용 조건은 연구 기록에 저장됩니다.`
      : `<b>TTS 청취 검증 필요:</b> 현재는 ${selectedVoice ? `고품질 우선 후보 “${esc(selectedVoice.name)}”` : '사용 가능한 한국어 음성'}을 사용합니다. 검사자·연구자 도구의 TTS 후보 검증에서 직접 듣고 고정할 수 있습니다.`;
  TTS_ASSETS.preloadAll().then(result => { session.ttsAssetPreload = { ...result, checkedAt: now() }; upsertSession(session); });

  const methodInputs = $$('[name=calibrationMethod]');
  const method = () => methodInputs.find(input => input.checked)?.value || 'default';
  const updateRuler = () => {
    const selected = method();
    const uncalibrated = selected === 'default';
    const referenceMm = selected === 'ruler' ? SPEC.CALIBRATION.rulerWidthMm : SPEC.CALIBRATION.cardWidthMm;
    $('#calibration-label').textContent = selected === 'ruler' ? '자에서 0–10 cm 길이' : '카드 긴 변 85.6 mm';
    ruler.style.width = `${size.value}px`;
    ruler.classList.toggle('hidden', uncalibrated);
    size.classList.toggle('hidden', uncalibrated);
    output.textContent = uncalibrated ? '브라우저 기본 크기로 진행합니다' : `${referenceMm} mm 기준 막대 조절`;
    $('#calibration-note').textContent = selected === 'card' ? '카드 번호나 개인정보는 사용하지 않습니다. 카드의 바깥 길이만 비교합니다.' : selected === 'ruler' ? '자의 0 cm부터 10 cm까지를 막대에 맞춥니다.' : '기기마다 실제 글자 크기가 달라질 수 있으며, 이 상태를 연구 기록에 남깁니다.';
  };
  const updateButton = () => {
    continueButton.disabled = !(distance.checked && display.checked);
    continueButton.textContent = '환경 확인 완료';
  };
  size.oninput = updateRuler;
  methodInputs.forEach(input => input.onchange = updateRuler);
  distance.onchange = display.onchange = updateButton;
  updateRuler();
  updateButton();
  $('#asr-state').textContent = choiceOnly ? '이 경로는 음성인식이 필요하지 않습니다.' : '음성인식 모델은 검사 중에 받지 않습니다. 검사 뒤 연구자 자동 분석에서만 준비합니다.';
  continueButton.onclick = async () => {
    continueButton.disabled = true;
    continueButton.textContent = '글꼴과 자산 확인 중…';
    try { await document.fonts?.load?.(`16px "${SPEC.VISUAL.intendedFont}"`); await document.fonts?.ready; } catch {}
    const calibration = method() === 'default' ? SPEC.defaultCalibration() : SPEC.calibrationFromReference(size.value, method());
    SPEC.applyVisualTokens(document.documentElement, calibration?.cssPxPerMm);
    session.environment = { ...SPEC.environmentSnapshot(window), calibration, viewingDistanceCm: 50, viewingDistanceConfirmed: true,
      displayScaleConfirmed: true, visionStatus: $('#vision-status').value, audioOutput: $('#audio-output').value,
      ttsAssetCoverage: ttsCoverage, preflightCompletedAt: now() };
    session.updatedAt = now();
    upsertSession(session);
    beginPerformanceMonitoring(session);
    if (choiceOnly) startTasks(session); else render('mic');
  };
}

function beginPerformanceMonitoring(session) {
  if (state.performanceObserver) state.performanceObserver.disconnect();
  session.performanceLog ||= { supported: false, longTasks: [], frameGaps: [] };
  if (!window.PerformanceObserver?.supportedEntryTypes?.includes('longtask')) return;
  session.performanceLog.supported = true;
  state.performanceObserver = new PerformanceObserver(list => {
    for (const entry of list.getEntries()) {
      session.performanceLog.longTasks.push({ atMs: Math.round(entry.startTime), durationMs: Math.round(entry.duration) });
      if (session.performanceLog.longTasks.length > 100) session.performanceLog.longTasks.shift();
    }
  });
  state.performanceObserver.observe({ type: 'longtask', buffered: true });
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
  if (state.recordingDeadlineTimer) clearTimeout(state.recordingDeadlineTimer);
  state.recordingDeadlineTimer = null;
  if (state.presentationAuditCleanup) state.presentationAuditCleanup();
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
  let lastMeterAt = 0;
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
      analyser.fftSize = 64;
      source.connect(analyser);
      const meterData = new Uint8Array(analyser.frequencyBinCount);
      $('#mic-orb').classList.add('listening');
      const draw = timestamp => {
        if (timestamp - lastMeterAt >= 50) {
          analyser.getByteFrequencyData(meterData);
          const average = meterData.reduce((a, b) => a + b, 0) / meterData.length;
          $('#meter-fill').style.width = `${Math.min(100, average * 1.8)}%`;
          lastMeterAt = timestamp;
        }
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
// 참여자가 혼자 실시한다. 화면에 낱말이 뜨면 바로 녹음이 시작되고, 다 읽으면 '다음'을 누른다.
// 1 단어 읽기(2×2 조건) 2 문장 읽기 → 기기 안 음성인식 → 자동 채점(S.autoDecodingRating·autoFluencyRating)
// → S.screeningDecision 규칙으로 실시할 모듈과 모듈 안에서 중점 확인할 것(확인 포인트)을 정한다.
async function startClip() {
  const stream = await getMic();
  const chunks = [];
  const recorder = new MediaRecorder(stream);
  recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
  const done = new Promise(resolve => recorder.onstop = () => resolve(new Blob(chunks, { type: recorder.mimeType || 'audio/webm' })));
  recorder.start(250);
  state.recorder = recorder;
  const startedAt = now();
  return { startedAt, stop: async () => { if (recorder.state === 'recording') recorder.stop(); return done; } };
}

function screen() {
  const session = state.session;
  const content = { words: itemSet(session, 'screening'), sentence: stimuli.screening.sentence };
  const clips = [];
  const stage = $('#screen-stage');
  $('#screen-steps li[data-step="words"]').textContent = `1 단어 읽기 (${content.words.length}개)`;
  const mark = step => $$('#screen-steps li').forEach(li => li.classList.toggle('current', li.dataset.step === step));
  const failMic = () => { stage.innerHTML = '<p class="notice warning">마이크를 사용할 수 없습니다. 이전 화면에서 마이크를 다시 확인해 주세요.</p>'; };

  const words = async (index = 0) => {
    mark('words');
    if (index >= content.words.length) return sentence();
    const item = content.words[index];
    const shownAt = now();
    drawJourney('screen', index);
    stage.innerHTML = `<p class="eyebrow">선별 1 · 단어 읽기 ${index + 1} / ${content.words.length}</p>
      <p class="task-instruction">낱말을 소리 내어 한 번 읽고 <b>다음</b>을 누르세요. 처음 보는 낱말도 있어요.</p>
      <div class="stimulus word">${esc(item.text)}</div>
      <div class="self-record"><span class="record-dot live"></span><span>녹음 중</span><button class="primary" id="clip-next">다음 →</button></div>`;
    let clip;
    try { clip = await startClip(); } catch { return failMic(); }
    $('#clip-next').onclick = async () => {
      $('#clip-next').disabled = true;
      const done = { item, kind: 'word', shownAt, recordingStartedAt: clip.startedAt, blob: await clip.stop() };
      done.asrPromise = transcribeQueued(done.blob, undefined, WORD_ASR); // 다음 낱말을 읽는 동안 미리 분석
      done.asrPromise.catch(() => {});
      clips.push(done);
      words(index + 1);
    };
  };

  const sentence = async () => {
    mark('sentence');
    drawJourney('screen', content.words.length);
    stage.innerHTML = `<p class="eyebrow">선별 2 · 문장 읽기</p>
      <p class="task-instruction">아래 글을 평소처럼 소리 내어 읽고, 다 읽으면 <b>다 읽었어요</b>를 누르세요.</p>
      <div class="stimulus passage">${esc(content.sentence.text)}</div>
      <div class="self-record"><span class="record-dot live"></span><span>녹음 중</span><button class="primary" id="clip-next">다 읽었어요</button></div>`;
    const shownAt = now();
    let clip;
    try { clip = await startClip(); } catch { return failMic(); }
    $('#clip-next').onclick = async () => {
      $('#clip-next').disabled = true;
      clips.push({ item: content.sentence, kind: 'sentence', shownAt, recordingStartedAt: clip.startedAt, blob: await clip.stop() });
      analyze();
    };
  };

  const analyze = async () => {
    mark('analyze');
    stage.innerHTML = `<p class="eyebrow">선별 결과 분석</p><h2>읽은 소리를 분석하고 있습니다</h2><p class="lead small" id="screen-analyze">음성인식 준비 중…</p><div class="journey-bar"><span id="screen-analyze-bar" style="width:0%"></span></div>`;
    const status = $('#screen-analyze');
    const result = { words: [], sentence: null, startedAt: clips[0]?.shownAt };
    try {
      for (const [i, clip] of clips.entries()) {
        status.textContent = `분석 ${i + 1} / ${clips.length}`;
        $('#screen-analyze-bar').style.width = `${Math.round(i / clips.length * 100)}%`;
        clip.quality = await analyzeAudio(clip.blob);
        clip.audioKey = `${session.id}-screen-${clip.item.id}`;
        await saveBlob(clip.audioKey, clip.blob).catch(() => { clip.audioKey = null; });
        clip.asr = await (clip.asrPromise || transcribeQueued(clip.blob, message => { status.textContent = `분석 ${i + 1} / ${clips.length} · ${message}`; })).catch(() => transcribeQueued(clip.blob, undefined, clip.kind === 'word' ? WORD_ASR : {}));
        noteAsrModel(clip.asr);
      }
    } catch (error) {
      stage.innerHTML = `<p class="notice warning"><b>음성인식을 마치지 못했습니다.</b> ${esc(error.message || error)} · 처음 한 번은 인터넷 연결이 필요합니다(모델 내려받기).</p><button class="primary" id="screen-retry">다시 분석</button>`;
      $('#screen-retry').onclick = analyze;
      return;
    }
    for (const clip of clips) {
      const speech = clip.quality?.speech;
      const latency = speech?.onsetMs != null ? new Date(clip.recordingStartedAt) - new Date(clip.shownAt) + speech.onsetMs : null;
      if (clip.kind === 'word') {
        const auto = S.autoDecodingRating(clip.item, clip.asr.text, { speechDetected: true });
        result.words.push({ id: clip.item.id, text: clip.item.text, lexicality: clip.item.lexicality, regularity: clip.item.regularity, correct: auto.itemScore === 'CORRECT', noResponse: auto.noResponse, spellingRead: auto.spellingRead,
          heard: auto.transcript, responseMs: latency, audioKey: clip.audioKey });
      } else {
        const tokens = S.tokenizePassage(clip.item.text);
        const auto = S.autoFluencyRating(tokens, clip.asr.words, { speech, recordingMs: clip.quality?.durationMs, asrText: clip.asr.text });
        const m = auto.metrics || { attemptedEojeol: 0, correctEojeol: 0, attemptedSyllables: 0, correctSyllables: 0, readingSeconds: 0 };
        result.sentence = { id: clip.item.id, errors: Object.keys(auto.marks).filter(index => S.FLUENCY_MARKS[auto.marks[index].mark]?.error).map(Number), heard: clip.asr.text, seconds: m.readingSeconds,
          attemptedEojeol: m.attemptedEojeol, correctEojeol: m.correctEojeol, attemptedSyllables: m.attemptedSyllables, correctSyllables: m.correctSyllables, audioKey: clip.audioKey };
      }
    }
    const decision = S.screeningDecision({ ...result, ageBand: session.ageBand });
    session.screening = { ...result, finishedAt: now(), contentVersion: 'screening-form-0.3', scoring: S.AUTO_SCORING_VERSION, sttModel: clips[0]?.asr?.modelLabel || clips[0]?.asr?.model, decision };
    session.modules = modulesForPaths(decision.paths, session);
    session.previewPaths = [...decision.paths];
    session.updatedAt = now();
    upsertSession(session);
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
  const stages = session?.mode === 'module' ? [] : [{ key: 'screen', label: '선별', count: itemSet(session, 'screening').length + 1, sec: itemSet(session, 'screening').length * 6 + 30 }];
  if (modules.includes('decoding')) stages.push({ key: 'decoding', label: '단어 해독', count: stimuli.decodingPractice.length + itemSet(session, 'decoding').length, sec: (stimuli.decodingPractice.length + itemSet(session, 'decoding').length) * 6 });
  if (modules.includes('fluency')) stages.push({ key: 'fluency', label: '읽기 유창성', count: stimuli.fluencyPractice.length + itemSet(session, 'fluency').length, sec: 20 + itemSet(session, 'fluency').length * 70 });
  for (const module of modules.filter(isChoiceModule)) {
    const sections = choiceSections(session, module);
    stages.push({ key: module, label: moduleName(module), count: sections.reduce((sum, section) => sum + 1 + (section.practice || []).length + section.items.length, 0), sec: CHOICE_MODULES[module].minutes[session?.length === 'full' ? 'full' : 'demo'] * 60 });
  }
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
    <tr><td>유창성 · 문장 낭독</td><td>${m.sentenceAccuracy != null ? `어절 정확도 ${m.sentenceAccuracy}% · 분당 정확 음절 ${m.sentenceRate}` : '–'}</td><td class="quiet">정확도 ${S.SCREENING_CONFIG.sentenceMinAccuracy}% 미만 → A·B · 속도는 연령 규준 전이라 자동 분기에 사용하지 않음</td><td>${tag(d.flags.B)}</td></tr>
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
        const tag = !on ? '<span class="tag off">건너뜀</span>'
          : subtest.status === 'core' ? '<span class="tag core">핵심 후보 · 실시</span>'
            : subtest.status === 'research' ? (extensionEnabledForSubtest(session, subtest) ? '<span class="tag preview">연구 확장 · 별도 채점</span>' : '<span class="tag off">연구 확장 · 선택 안 함</span>')
              : '<span class="tag preview">화면 미리보기</span>';
        return `<li class="${on ? '' : 'dim'}"><span>${esc(subtest.title)}</span>${tag}</li>`;
      }).join('');
      return `<article class="path-card path-${path.id} ${on ? 'on' : 'off'}"><label class="path-toggle"><input type="checkbox" name="routePath" value="${path.id}" ${on ? 'checked' : ''}> 경로 ${path.id}${recommended.has(path.id) ? ' · <b>선별 추천</b>' : ''}</label><h3>${esc(path.title)}</h3><p class="quiet">${reasons.length ? esc(reasons.join(' / ')) : ['C', 'D'].includes(path.id) ? '이번 선별은 해독·유창성 두 축만 봅니다. 언어·글 이해를 보려면 켜서 실시하세요' : '선별에서 추가 확인 신호 없음'}</p><ul>${subtests}</ul></article>`;
    }).join('');
    $$('[name=routePath]').forEach(box => box.onchange = draw);
    const none = !chosen.size;
    $('#start-assessment').disabled = none;
    $('#start-assessment').textContent = none ? '추가 확인이 필요한 경로 없음' : '세부검사 시작';
  };
  draw();
  if (PREVIEW_SUBTESTS.length) $('#tour-previews').onclick = () => startPreviews(PREVIEW_SUBTESTS, 'route'); else $('#tour-previews').remove();
  $('#start-assessment').onclick = () => {
    const chosen = $$('[name=routePath]:checked').map(box => box.value);
    // 검사자 조정은 추천과 다른 경로만 기록한다.
    session.routing = { recommended: [...recommended], final: chosen,
      added: chosen.filter(id => !recommended.has(id)), removed: [...recommended].filter(id => !chosen.includes(id)), decidedAt: now() };
    session.modules = modulesForPaths(chosen, session);
    session.previewPaths = chosen;
    upsertSession(session);
    startTasks(session);
  };
}

function startTasks(session) {
  if (!state.performanceObserver) beginPerformanceMonitoring(session);
  TTS_ASSETS.preloadAll().then(result => { session.ttsAssetPreload = { ...result, checkedAt: now() }; upsertSession(session); });
  const modules = session.modules;
  state.taskQueue = [];
  // 연습은 항상 먼저. 본검사 순서는 설정에 따라 고정 또는 무작위이며, 실제 제시 순서를 세션에 저장한다.
  const mainItems = [...itemSet(session, 'decoding')];
  const fluencyItems = itemSet(session, 'fluency');
  const timedWordForm = fluencyItems.find(item => item.taskType === 'timed-word-list');
  if (timedWordForm) session.wordEfficiencyForm = { formId: timedWordForm.formId, evidenceVersion: ITEM_BANK.VERSION, audit: EVIDENCE.timedWordFormAudit(timedWordForm) };
  session.randomizationSeed ||= `${session.participant}|${session.createdAt}|${CONTENT_VERSION}`;
  if (session.orderPolicy === 'random') {
    const random = seededRandom(session.randomizationSeed);
    for (let i = mainItems.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [mainItems[i], mainItems[j]] = [mainItems[j], mainItems[i]]; }
  }
  if (modules.includes('decoding')) state.taskQueue.push(...stimuli.decodingPractice.map(item => ({ ...item, module: 'decoding' })), { id: 'decoding-ready', module: 'decoding', ready: true }, ...mainItems.map(item => ({ ...item, module: 'decoding' })));
  if (modules.includes('fluency')) state.taskQueue.push(...stimuli.fluencyPractice.map(item => ({ ...item, module: 'fluency' })), { id: 'fluency-ready', module: 'fluency', ready: true }, ...fluencyItems.map(item => ({ ...item, module: 'fluency' })));
  state.taskIndex = 0;
  session.presentationOrder = state.taskQueue.filter(item => !item.ready).map(item => item.id);
  session.status = 'IN_PROGRESS';
  session.startedAt = now();
  session.batteryVersion = BATTERY_VERSION;
  session.assessmentSpecVersion = SPEC.VERSION;
  session.evidenceEngineVersion = EVIDENCE.VERSION;
  session.itemEvidenceVersion = ITEM_BANK.VERSION;
  session.environment = { ...SPEC.environmentSnapshot(window), ...(session.environment || {}) };
  upsertSession(session);
  // 녹음 과제를 먼저 하고, 선택형 과제는 이어서 한다.
  if (state.taskQueue.length) render('task'); else startChoice(session);
}

// ---------- 선택형 하위검사 (음성인식 없음, battery.js) ----------
// 화면(필요하면 합성 음성)으로 문항을 제시하고, 보기를 누르는 즉시 정오·반응 시간을 저장한다.
function choiceSections(session, module) {
  return CHOICE_MODULES[module].sections
    .filter(section => section.id !== 'C-morph' || session?.morphologyExtensionEnabled)
    .map(section => ({ ...section, items: section.items
      .filter(item => session?.length === 'full' || item.demo)
      .filter(item => !['D-eval', 'D-multi'].includes(item.subtest) || session?.advancedComprehensionExtensionEnabled) }))
    .filter(section => section.items.length);
}

function buildChoiceQueue(session) {
  const queue = [];
  for (const module of session.modules.filter(isChoiceModule)) for (const section of choiceSections(session, module)) {
    queue.push({ kind: 'intro', module, section });
    for (const item of section.practice || []) queue.push({ kind: 'item', module, section, item, practice: true });
    if ((section.practice || []).length) queue.push({ kind: 'ready', module, section });
    for (const item of section.items) queue.push({ kind: 'item', module, section, item });
  }
  return queue;
}

// 문항 자료는 로컬에 있지만 다음 화면의 보기 순서와 텍스트를 미리 계산해, 현재 응답 뒤의
// 동기 작업이 자극 제시 시각을 밀지 않게 한다. 준비 선행시간은 각 문항에 저장한다.
function prepareChoiceStep(index) {
  if (!state.choiceQueue?.[index] || state.preparedChoices?.[index]) return;
  const step = state.choiceQueue[index];
  const item = step.item;
  const options = !item ? null : step.section.format === 'binary'
    ? step.section.binary.map(choice => ({ value: choice.value, label: choice.label, key: choice.key }))
    : fixedOptionOrder(item).map((option, i) => ({ value: option, label: option, key: String(i + 1) }));
  let nodeTemplate = null;
  if (item) {
    const section = step.section;
    const passage = section.passage && !section.listenOnly ? `<div class="choice-passage">${esc(section.passage).replace(/\n/g, '<br>')}</div>` : '';
    const stimulus = section.format === 'binary' ? `<div class="stimulus ${section.id === 'B-lexical' ? 'word' : 'sentence'}">${esc(item.text)}</div>` : `<p class="choice-stem">${esc(item.stem)}</p>`;
    const listen = section.listenOnly ? '<button class="secondary" id="listen-again" type="button">🔊 이야기 다시 듣기 <span id="listen-left"></span></button>' : '';
    nodeTemplate = document.createElement('template');
    nodeTemplate.innerHTML = `${step.practice ? '<div class="practice-banner"><b>연습</b><span>점수에 포함되지 않습니다. 답을 고르면 정답을 알려 드려요.</span></div>' : ''}
      ${passage}${listen}${stimulus}
      ${item.audio ? '<div class="sound-check"><button class="secondary" id="replay" type="button">🔊 다시 듣기</button></div>' : ''}
      <div class="choice-options ${section.format === 'binary' ? 'binary' : ''}">${options.map(option => `<button class="choice-option" type="button" data-value="${esc(option.value)}"><kbd>${esc(option.key)}</kbd>${esc(option.label)}</button>`).join('')}</div>
      <p id="choice-feedback" class="notice hidden"></p>`;
  }
  state.preparedChoices[index] = {
    index, kind: step.kind, itemId: item?.id || null, sectionId: step.section?.id || null,
    preparedAt: now(), preparedPerfMs: performance.now(),
    passage: step.section?.passage ? String(step.section.passage) : '',
    options, nodeTemplate, assets: ['local-text', 'fixed-option-order', ...(nodeTemplate ? ['detached-dom-template'] : [])]
  };
}

function queueChoicePreparation(index) {
  const prepare = () => { prepareChoiceStep(index); prepareChoiceStep(index + 1); };
  if (window.requestIdleCallback) window.requestIdleCallback(prepare, { timeout: 250 });
  else setTimeout(prepare, 0);
}

function startChoice(session) {
  state.choiceQueue = buildChoiceQueue(session);
  state.choiceIndex = 0;
  state.choiceDeadlines = {};
  state.listenPlays = {};
  state.preparedChoices = {};
  session.choiceAnswers ||= [];
  session.choiceSections ||= {};
  if (!state.choiceQueue.length) return finishChoiceSequence(session);
  prepareChoiceStep(0);
  queueChoicePreparation(1);
  render('choice');
}

function finishChoiceSequence(session) {
  if (session.supportExperimentEnabled && session.modules.includes('comprehension') && !session.supportExperiment?.completedAt) return startSupportExperiment(session);
  return finishAssessment(session);
}

function finishAssessment(session) {
  stopStream();
  if (state.performanceObserver) { state.performanceObserver.disconnect(); state.performanceObserver = null; }
  if (session.performanceLog) session.performanceLog.presentationEndedAt = now();
  state.taskQueue = [];
  state.choiceQueue = null;
  const needsAsr = scoredResponses(session).some(response => response.audioKey && !response.autoRating);
  session.status = needsAsr ? 'REVIEW_PENDING' : 'SCORED';
  if (!needsAsr) session.scoredAt = now();
  session.submittedAt = now();
  sessionStorage.setItem('readingResultSession', session.id);
  session.updatedAt = now();
  upsertSession(session);
  render('complete');
}

// 브라우저 내장 음성 합성(ko-KR)은 아직 잠정 제시 수단이다. 한 세션 안에서는 음성을 고정하고,
// 실제 사용 음성·재생시간·추정 WPM·실패를 모두 저장해 기기 차이가 숨지 않게 한다.
function koreanVoice(session = state.session) {
  const preference = savedTtsPreference();
  const voices = window.speechSynthesis?.getVoices() || [];
  const sessionPinned = session?.ttsProfile?.voice?.name;
  if (sessionPinned && sessionPinned !== 'unavailable') return SPEC.selectKoreanVoice(voices, sessionPinned);
  return (preference?.validationStatus === 'PASS' && preference?.name ? SPEC.selectKoreanVoice(voices, preference.name) : null) || SPEC.selectKoreanVoice(voices);
}
function ensureTtsProfile(session = state.session) {
  if (!session) return null;
  const voice = koreanVoice(session);
  const snapshot = SPEC.voiceSnapshot(voice);
  const preference = savedTtsPreference();
  const acceptedPreference = preference?.validationStatus === 'PASS' && preference?.name === snapshot.name;
  const selectedRate = acceptedPreference ? Number(preference.rate) : SPEC.TTS.rate;
  session.ttsProfile ||= { engine: SPEC.TTS.engine, status: acceptedPreference ? 'RESEARCHER_VALIDATED_DEVICE_VOICE' : 'AUTO_SELECTED_PROVISIONAL_DEVICE_VOICE', language: SPEC.TTS.language, rate: selectedRate, pitch: SPEC.TTS.pitch, volume: SPEC.TTS.volume, voice: snapshot,
    candidateEvaluation: acceptedPreference ? { ...preference.ratings, measuredSpm: preference.measuredSpm, validationStatus: preference.validationStatus } : null, selectedAt: now() };
  // 브라우저가 비동기로 음성 목록을 채웠다면 unavailable 상태만 한 번 갱신한다.
  if (session.ttsProfile.voice?.name === 'unavailable' && voice) session.ttsProfile = { ...session.ttsProfile, voice: snapshot, selectedAt: now() };
  return { profile: session.ttsProfile, voice };
}
function recordTtsEvent(event, session = state.session) {
  if (!session) return event;
  session.ttsEvents ||= [];
  session.ttsEvents.push(event);
  session.updatedAt = now();
  upsertSession(session);
  return event;
}
async function speak(text, context = {}) {
  const startedAt = now();
  const started = performance.now();
  const finish = (ok, extra = {}) => {
    const durationMs = Math.round(performance.now() - started);
    return recordTtsEvent({ ok, startedAt, endedAt: now(), durationMs, wpm: ok ? SPEC.estimateWpm(text, durationMs) : null, spm: ok ? SPEC.estimateSpm(text, durationMs) : null,
      textLength: String(text || '').length, context, ...extra });
  };
  if (window.ReadingTtsOverride) {
    try {
      const result = await window.ReadingTtsOverride(text);
      return finish(result !== false, { engine: 'test-override', voice: { name: 'override', lang: 'ko-KR' } });
    } catch (error) { return finish(false, { engine: 'test-override', error: String(error?.message || error) }); }
  }
  const fixedAsset = TTS_ASSETS.resolve(context);
  if (fixedAsset) {
    try {
      const result = await TTS_ASSETS.play(fixedAsset);
      return finish(result.ok, { engine: 'fixed-audio', standardized: true, assetVersion: TTS_ASSETS.VERSION,
        assetKey: TTS_ASSETS.keyOf(context), provider: fixedAsset.provider || 'recorded', ...(result.error ? { error: result.error } : {}) });
    } catch (error) {
      return finish(false, { engine: 'fixed-audio', standardized: true, assetVersion: TTS_ASSETS.VERSION, error: String(error?.message || error) });
    }
  }
  const synth = window.speechSynthesis;
  if (!synth || !text) return finish(false, { engine: 'browser-speech-synthesis', standardized: false, error: !text ? 'EMPTY_TEXT' : 'TTS_UNAVAILABLE' });
  const selected = ensureTtsProfile();
  if (!selected?.voice) return finish(false, { engine: 'browser-speech-synthesis', standardized: false, voice: selected?.profile?.voice, error: 'KOREAN_VOICE_UNAVAILABLE' });
  return new Promise(resolve => {
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = SPEC.TTS.language;
    utterance.rate = selected.profile.rate;
    utterance.pitch = SPEC.TTS.pitch;
    utterance.volume = SPEC.TTS.volume;
    utterance.voice = selected.voice;
    let settled = false;
    const complete = (ok, error = null) => {
      if (settled) return;
      settled = true;
      clearTimeout(guard);
      resolve(finish(ok, { engine: 'browser-speech-synthesis', standardized: false, voice: selected.profile.voice, rate: selected.profile.rate, ...(error ? { error } : {}) }));
    };
    const guard = setTimeout(() => { synth.cancel(); complete(false, 'TTS_TIMEOUT'); }, SPEC.TTS.timeoutBaseMs + text.length * SPEC.TTS.timeoutPerCharacterMs);
    utterance.onend = () => complete(true);
    utterance.onerror = event => complete(false, event.error || 'TTS_ERROR');
    synth.speak(utterance);
  });
}

function choice() {
  const session = state.session;
  const step = state.choiceQueue[state.choiceIndex];
  const { module, section } = step;
  const prepared = state.preparedChoices?.[state.choiceIndex] || null;
  const preloadLeadMs = prepared ? Math.max(0, Math.round(performance.now() - prepared.preparedPerfMs)) : null;
  const info = CHOICE_MODULES[module];
  const moduleSteps = state.choiceQueue.filter(other => other.module === module);
  const mainItems = state.choiceQueue.filter(other => other.section.id === section.id && other.kind === 'item' && !other.practice);
  const limit = section.timeLimitSec ? section.timeLimitSec[session.length === 'full' ? 'full' : 'demo'] : null;
  $('#choice-module').textContent = `경로 ${info.path} · ${info.title}`;
  $('#choice-title').textContent = section.title;
  $('#choice-progress').textContent = step.kind === 'intro' ? '안내' : step.practice ? '연습' : `${mainItems.indexOf(step) + 1} / ${mainItems.length}`;
  drawJourney(module, moduleSteps.indexOf(step));
  $('#choice-quit').onclick = () => { if (leaveGuard('choice', 'home')) render('home'); };
  const stage = $('#choice-stage');
  const advance = () => {
    state.choiceIndex++;
    // 제한 시간이 끝난 하위검사는 남은 문항을 건너뛴다 (시간 안에 본 문항만 채점).
    while (state.choiceIndex < state.choiceQueue.length) {
      const next = state.choiceQueue[state.choiceIndex];
      const deadline = state.choiceDeadlines[next.section.id];
      if (next.kind === 'item' && !next.practice && deadline && performance.now() > deadline) {
        session.choiceSections[next.section.id] = { ...(session.choiceSections[next.section.id] || {}), timedOut: true };
        state.choiceIndex++;
      } else break;
    }
    upsertSession(session);
    if (state.choiceIndex >= state.choiceQueue.length) return finishChoiceSequence(session);
    render('choice', { history: 'replace' });
  };

  if (step.kind === 'ready') {
    stage.innerHTML = `<div class="ready-panel"><p class="eyebrow">연습 끝</p><h1>${esc(section.title)} 본검사를 시작합니다</h1><p>이제부터는 정답을 알려 드리지 않습니다. 첫 문제는 시작을 누른 뒤에 나타납니다.</p><div class="button-row center"><button class="primary" id="choice-main-start" type="button">본검사 시작</button></div></div>`;
    $('#choice-main-start').onclick = advance;
    return;
  }

  if (step.kind === 'intro') {
    const practiceCount = (section.practice || []).length;
    stage.innerHTML = `<p class="eyebrow">${esc(CHOICE_SUBTEST_TITLES[section.subtest] || section.title)}</p>
      <p class="choice-instruction">${esc(section.instruction)}</p>
      <ul class="choice-facts"><li>문항 ${mainItems.length}개${practiceCount ? ` · 먼저 연습 ${practiceCount}개 (점수 제외)` : ''}</li>${limit ? `<li>제한 시간 <b>${limit}초</b> (연습이 끝나면 시작)</li>` : '<li>시간 제한 없음 · 반응 시간은 기록됩니다</li>'}${section.itemTimeoutMs ? `<li>한 문항에 ${section.itemTimeoutMs / 1000}초가 지나면 다음으로 넘어갑니다</li>` : ''}${section.exposureMs ? `<li>글자는 <b>${section.exposureMs / 1000}초</b>만 보였다가 사라집니다. 사라진 뒤에 눌러도 됩니다</li>` : ''}${section.format === 'binary' ? `<li>키보드: <b>${esc(section.binary[0].key)}</b> = ${esc(section.binary[0].label)}, <b>${esc(section.binary[1].key)}</b> = ${esc(section.binary[1].label)}</li>` : '<li>키보드 숫자 1~4로도 고를 수 있어요</li>'}</ul>
      <div class="sound-check"><button class="secondary" id="instruction-audio" type="button">🔊 안내 듣기</button>${section.audio ? '<button class="secondary" id="sound-test" type="button">🔊 소리 확인</button>' : ''}<button class="text-button" id="additional-explanation" type="button">검사자 추가 설명 기록</button><span id="voice-status" class="quiet"></span></div>
      <div class="button-row center"><button class="primary" id="choice-start" type="button">시작</button></div>`;
    const sectionLog = session.choiceSections[section.id] ||= { module, instructionPlays: 0, instructionFailures: 0, audioFailures: 0 };
    const status = () => {
      if (!$('#voice-status')) return;
      const selected = ensureTtsProfile(session);
      $('#voice-status').textContent = window.ReadingTtsOverride ? '시험용 음성' : selected?.voice ? `잠정 음성: ${selected.profile.voice.name} · 속도 ${selected.profile.rate}` : '한국어 음성을 찾지 못했습니다. 음성 안내가 필요한 검사는 시작하지 마세요.';
    };
    status();
    window.speechSynthesis?.addEventListener?.('voiceschanged', status, { once: true });
    $('#instruction-audio').onclick = async () => {
      const outcome = await speak(section.instruction, { kind: 'instruction', module, sectionId: section.id });
      if (outcome.ok) { sectionLog.instructionPlays++; sectionLog.instructionCompletedAt = now(); }
      else sectionLog.instructionFailures++;
      upsertSession(session);
      status();
    };
    if ($('#sound-test')) $('#sound-test').onclick = () => speak('소리가 잘 들리면 시작을 눌러 주세요.', { kind: 'sound-check', module, sectionId: section.id });
    $('#additional-explanation').onclick = () => {
      sectionLog.additionalExplanations = (sectionLog.additionalExplanations || 0) + 1;
      sectionLog.lastAdditionalExplanationAt = now();
      $('#additional-explanation').textContent = `추가 설명 기록됨 (${sectionLog.additionalExplanations}회)`;
      upsertSession(session);
    };
    $('#choice-start').onclick = () => {
      const selected = ensureTtsProfile(session);
      session.choiceSections[section.id] = { ...sectionLog, module, startedAt: now(), timeLimitSec: limit, items: mainItems.length, voice: selected?.profile?.voice || null,
        evidenceAudit: section.evidenceAudit || null, evidenceVersion: EVIDENCE.VERSION, specVersion: SPEC.VERSION };
      advance();
    };
    queueChoicePreparation(state.choiceIndex + 1);
    return;
  }

  // 시간 제한: 첫 본문항이 나올 때 시작한다.
  if (limit && !step.practice && !state.choiceDeadlines[section.id]) state.choiceDeadlines[section.id] = performance.now() + limit * 1000;
  const deadline = state.choiceDeadlines[section.id];
  if (deadline && !step.practice) {
    const tick = () => {
      const left = Math.max(0, Math.ceil((deadline - performance.now()) / 1000));
      $('#choice-timer').textContent = `남은 시간 ${left}초`;
      if (!left) { clearInterval(state.choiceTimer); state.choiceTimer = null; session.choiceSections[section.id].timedOut = true; while (state.choiceIndex + 1 < state.choiceQueue.length && state.choiceQueue[state.choiceIndex + 1].section.id === section.id) state.choiceIndex++; advance(); }
    };
    tick();
    state.choiceTimer = setInterval(tick, 250);
  }

  const item = step.item;
  const options = prepared?.options || (section.format === 'binary' ? section.binary.map(choice => ({ value: choice.value, label: choice.label, key: choice.key })) : fixedOptionOrder(item).map((option, i) => ({ value: option, label: option, key: String(i + 1) })));
  if (prepared?.nodeTemplate) {
    stage.replaceChildren(prepared.nodeTemplate.content.cloneNode(true));
    stage.classList.add('buffered-stage');
  } else {
    const passage = section.passage && !section.listenOnly ? `<div class="choice-passage">${esc(section.passage).replace(/\n/g, '<br>')}</div>` : '';
    const stimulus = section.format === 'binary' ? `<div class="stimulus ${section.id === 'B-lexical' ? 'word' : 'sentence'}">${esc(item.text)}</div>` : `<p class="choice-stem">${esc(item.stem)}</p>`;
    const listen = section.listenOnly ? '<button class="secondary" id="listen-again" type="button">🔊 이야기 다시 듣기 <span id="listen-left"></span></button>' : '';
    stage.innerHTML = `${step.practice ? '<div class="practice-banner"><b>연습</b><span>점수에 포함되지 않습니다. 답을 고르면 정답을 알려 드려요.</span></div>' : ''}
      ${passage}${listen}${stimulus}
      ${item.audio ? '<div class="sound-check"><button class="secondary" id="replay" type="button">🔊 다시 듣기</button></div>' : ''}
      <div class="choice-options ${section.format === 'binary' ? 'binary' : ''}">${options.map(option => `<button class="choice-option" type="button" data-value="${esc(option.value)}"><kbd>${esc(option.key)}</kbd>${esc(option.label)}</button>`).join('')}</div>
      <p id="choice-feedback" class="notice hidden"></p>`;
  }

  let shownAt = performance.now();
  let replays = 0;
  let answered = false;
  let presentation = { status: 'VALID', valid: true, targetMs: section.exposureMs || null, actualMs: null, driftMs: null, endedBy: null, toleranceMs: SPEC.PRESENTATION.exposureToleranceMs, preloadLeadMs };
  const presentedAt = now();
  const setOptionsDisabled = disabled => $$('.choice-option').forEach(button => { button.disabled = disabled; });
  const finishExposure = endedBy => {
    if (!section.exposureMs || presentation.actualMs != null) return presentation;
    if (state.choiceExposureTimeout) { clearTimeout(state.choiceExposureTimeout); state.choiceExposureTimeout = null; }
    presentation = { ...presentation, ...SPEC.evaluateExposure(section.exposureMs, performance.now() - shownAt, endedBy) };
    return presentation;
  };
  const answer = (value, { noResponse = false } = {}) => {
    if (answered) return;
    answered = true;
    if (state.choiceTimeout) { clearTimeout(state.choiceTimeout); state.choiceTimeout = null; }
    finishExposure('response');
    const rawCorrect = !noResponse && value === item.answer;
    const rtMs = noResponse ? null : Math.round(performance.now() - shownAt);
    const responseQuality = section.id === 'B-lexical' ? EVIDENCE.rapidResponseAudit(rtMs) : { status: 'NOT_APPLICABLE', valid: true };
    $$('.choice-option').forEach(button => { button.disabled = true; if (button.dataset.value === value) button.classList.add('chosen'); });
    if (step.practice) {
      const right = section.format === 'binary' ? section.binary.find(choice => choice.value === item.answer).label : item.answer;
      const feedback = $('#choice-feedback');
      feedback.textContent = SPEC.practiceFeedback({ practice: step.practice, correct: rawCorrect, rightAnswer: right });
      feedback.classList.remove('hidden');
      setTimeout(advance, rawCorrect ? 700 : 1600);
      return;
    }
    const scoringStatus = presentation.valid === false ? 'PRESENTATION_INVALID' : 'VALID';
    session.presentationLog ||= [];
    session.presentationLog.push({ itemId: item.id, sectionId: section.id, module, ...presentation, recordedAt: now() });
    session.choiceAnswers.push({ module, sectionId: section.id, subtest: item.subtest || section.subtest, itemId: item.id, type: item.type, response: value, answer: item.answer,
      correct: rawCorrect, rawCorrect, rtMs, noResponse, replays, presentedAt, battery: BATTERY_VERSION, scoringStatus, presentation, responseQuality,
      focusAtResponse: document.hasFocus(), visibilityAtResponse: document.visibilityState, itemEvidenceAudit: item.evidenceAudit || null, evidenceVersion: EVIDENCE.VERSION, specVersion: SPEC.VERSION });
    session.updatedAt = now();
    advance();
  };
  $$('.choice-option').forEach(button => button.onclick = () => answer(button.dataset.value));
  document.onkeydown = event => {
    const option = options.find(choice => choice.key.toLowerCase() === event.key.toLowerCase());
    if (option && !event.repeat && !$$('.choice-option').every(button => button.disabled)) { event.preventDefault(); event.stopPropagation(); answer(option.value); }
  };
  if (section.itemTimeoutMs) state.choiceTimeout = setTimeout(() => answer(null, { noResponse: true }), section.itemTimeoutMs);
  // 첫 paint 경계에서 고해상도 시계를 시작하고 실제 마스킹 시각을 저장한다.
  // 메인 스레드가 막혀 허용 오차보다 오래 보인 문항은 PRESENTATION_INVALID로 남겨 점수에서 제외한다.
  if (section.exposureMs) {
    setOptionsDisabled(true);
    requestAnimationFrame(warmFrameAt => requestAnimationFrame(paintedAt => {
      if (answered) return;
      const warmupFrameGapMs = Math.round(paintedAt - warmFrameAt);
      shownAt = paintedAt;
      presentation.renderedAt = now();
      presentation.renderedPerfMs = Math.round(paintedAt);
      presentation.warmupFrameGapMs = warmupFrameGapMs;
      presentation.longTaskCountAtShow = session.performanceLog?.longTasks?.length || 0;
      session.performanceLog?.frameGaps?.push({ itemId: item.id, gapMs: warmupFrameGapMs, recordedAt: now() });
      setOptionsDisabled(false);
      state.choiceExposureTimeout = setTimeout(() => {
        const shown = $('.choice-stage .stimulus, #choice-stage .stimulus');
        if (shown && !answered) { shown.textContent = '+'; shown.classList.add('masked'); finishExposure('timer'); }
      }, section.exposureMs);
    }));
  }
  // 들려주는 문항: 소리가 끝난 때부터 반응 시간을 잰다 (먼저 눌러도 된다).
  if (item.audio) {
    const play = async () => {
      replays++;
      setOptionsDisabled(true);
      const outcome = await speak(item.audio, { kind: 'item', module, sectionId: section.id, itemId: item.id });
      if (answered) return outcome;
      const feedback = $('#choice-feedback');
      if (!outcome.ok) {
        session.choiceSections[section.id].audioFailures = (session.choiceSections[section.id].audioFailures || 0) + 1;
        feedback.textContent = '음성을 재생하지 못했습니다. 다시 듣기를 눌러 주세요. 이 상태에서는 응답이 저장되지 않습니다.';
        feedback.classList.add('presentation-warning');
        feedback.classList.remove('hidden');
        upsertSession(session);
        return outcome;
      }
      feedback.classList.add('hidden');
      feedback.classList.remove('presentation-warning');
      shownAt = performance.now();
      setOptionsDisabled(false);
      return outcome;
    };
    replays = -1;
    if (!section.listenOnly || state.listenPlays[section.id] != null) play(); else replays = 0;
    $('#replay').onclick = play;
  }
  if (section.listenOnly) {
    // 이야기는 하위검사 첫 문항 앞에서 한 번 들려주고, 두 번까지 다시 들을 수 있다.
    const plays = state.listenPlays;
    const left = () => { $('#listen-left').textContent = `(${Math.max(0, 2 - (plays[section.id] || 0))}번 남음)`; $('#listen-again').disabled = (plays[section.id] || 0) >= 2; };
    const playStory = async () => {
      setOptionsDisabled(true);
      const story = await speak(section.passage, { kind: 'passage', module, sectionId: section.id, itemId: item.id });
      const question = item.audio ? await speak(item.audio, { kind: 'item', module, sectionId: section.id, itemId: item.id }) : { ok: true };
      if (!story.ok || !question.ok) {
        session.choiceSections[section.id].audioFailures = (session.choiceSections[section.id].audioFailures || 0) + 1;
        const feedback = $('#choice-feedback');
        feedback.textContent = '이야기 또는 질문 음성을 재생하지 못했습니다. 다시 듣기를 눌러 주세요. 이 상태에서는 응답이 저장되지 않습니다.';
        feedback.classList.add('presentation-warning');
        feedback.classList.remove('hidden');
        upsertSession(session);
        return;
      }
      setOptionsDisabled(answered);
      shownAt = performance.now();
    };
    if (plays[section.id] == null) { plays[section.id] = 0; playStory(); }
    left();
    $('#listen-again').onclick = () => { plays[section.id] = (plays[section.id] || 0) + 1; session.choiceSections[section.id].storyReplays = plays[section.id]; left(); playStory(); };
  }
  queueChoicePreparation(state.choiceIndex + 1);
}

function rotated(values, offset) { return [...values.slice(offset), ...values.slice(0, offset)]; }

function startSupportExperiment(session) {
  if (!session.supportExperiment) {
    const seed = [...String(session.participant || session.id)].reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const conditionOrder = rotated(['L0', 'L1', 'L2'], seed % 3);
    const formOrder = rotated(SUPPORT_FORMS.map(form => form.id), (seed * 2 + 1) % 3);
    session.supportExperiment = {
      version: SUPPORT_EXPERIMENT_VERSION,
      design: 'THREE_PARALLEL_CANDIDATES_COUNTERBALANCED',
      conditionOrder,
      plan: conditionOrder.map((condition, index) => ({ condition, formId: formOrder[index] })),
      trials: [], startedAt: now(), scorePolicy: 'SEPARATE_FROM_BASELINE'
    };
    upsertSession(session);
  }
  state.scaffoldIndex = session.supportExperiment.trials.length;
  render('scaffold');
}

function scaffoldPassage(form, condition) {
  if (condition === 'L1') {
    const index = form.passage.indexOf(form.evidence);
    if (index >= 0) return `${esc(form.passage.slice(0, index))}<mark>${esc(form.evidence)}</mark>${esc(form.passage.slice(index + form.evidence.length))}`;
  }
  if (condition === 'L2') return form.passage.split(/(?<=\.)\s*/u).filter(Boolean).map((sentence, index) => `<span class="support-segment"><b>${index + 1}</b>${esc(sentence)}</span>`).join('');
  return esc(form.passage);
}

function scaffold() {
  const session = state.session;
  const experiment = session.supportExperiment;
  const plan = experiment.plan[state.scaffoldIndex];
  if (!plan) {
    experiment.completedAt = now();
    upsertSession(session);
    return finishAssessment(session);
  }
  const form = SUPPORT_FORMS.find(candidate => candidate.id === plan.formId);
  const supportLabel = { L0: '도움 없이 읽기', L1: '핵심 문장 표시', L2: '문장 나누기와 듣기' }[plan.condition];
  $('#scaffold-progress').textContent = `${state.scaffoldIndex + 1} / ${experiment.plan.length}`;
  $('#scaffold-instruction').textContent = plan.condition === 'L0' ? '글을 읽고 질문에 답하세요.' : plan.condition === 'L1' ? '표시된 문장을 참고해 질문에 답하세요.' : '문장을 하나씩 확인하세요. 필요하면 글을 들을 수 있습니다.';
  $('#scaffold-passage').innerHTML = scaffoldPassage(form, plan.condition);
  $('#scaffold-question').textContent = form.question;
  const supportOptions = shuffled(form.options, seededRandom(`${form.id}-${plan.condition}`));
  $('#scaffold-options').innerHTML = supportOptions.map((option, index) => `<button class="choice-option" type="button" data-value="${esc(option)}"><kbd>${index + 1}</kbd>${esc(option)}</button>`).join('');
  const audioRow = $('#scaffold-audio-row');
  audioRow.classList.toggle('hidden', plan.condition !== 'L2');
  const supportEvents = [{ type: 'CONDITION_SHOWN', condition: plan.condition, atMs: 0 }];
  const shownAt = performance.now();
  let audioPlays = 0;
  if (plan.condition === 'L2') $('#scaffold-audio').onclick = async () => {
    audioPlays++;
    supportEvents.push({ type: 'AUDIO_REQUESTED', atMs: Math.round(performance.now() - shownAt) });
    $('#scaffold-audio').disabled = true;
    const result = await speak(form.passage, { kind: 'support', sectionId: SUPPORT_EXPERIMENT_VERSION, itemId: form.id, condition: plan.condition });
    $('#scaffold-audio-status').textContent = result.ok ? '재생 완료' : '재생 실패';
    $('#scaffold-audio').disabled = false;
    supportEvents.push({ type: result.ok ? 'AUDIO_COMPLETED' : 'AUDIO_FAILED', atMs: Math.round(performance.now() - shownAt) });
  };
  let answered = false;
  $$('#scaffold-options .choice-option').forEach(button => button.onclick = () => {
    if (answered) return;
    answered = true;
    $$('#scaffold-options .choice-option').forEach(option => { option.disabled = true; if (option === button) option.classList.add('chosen'); });
    experiment.trials.push({ condition: plan.condition, conditionLabel: supportLabel, formId: form.id, response: button.dataset.value, answer: form.answer,
      correct: button.dataset.value === form.answer, rtMs: Math.round(performance.now() - shownAt), audioPlays, supportEvents, recordedAt: now(), scorePolicy: 'EXPLORATORY_SEPARATE' });
    session.updatedAt = now();
    upsertSession(session);
    state.scaffoldIndex++;
    setTimeout(() => {
      if (state.scaffoldIndex >= experiment.plan.length) {
        experiment.completedAt = now(); upsertSession(session); finishAssessment(session);
      } else render('scaffold', { history: 'replace' });
    }, 350);
  });
  document.onkeydown = event => {
    const index = Number(event.key) - 1;
    const button = $$('#scaffold-options .choice-option')[index];
    if (button && !button.disabled) { event.preventDefault(); button.click(); }
  };
  $('#scaffold-quit').onclick = () => {
    if (!confirm('추가 읽기 활동을 중단하고 검사를 마칠까요? 지금까지 기록은 남습니다.')) return;
    experiment.interruptedAt = now();
    upsertSession(session);
    finishAssessment(session);
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

const playbackBoostNodes = new WeakMap();
function connectPlaybackBoost(audio, checkbox) {
  if (!audio || !checkbox || playbackBoostNodes.has(audio)) return;
  try {
    const context = new AudioContext();
    const source = context.createMediaElementSource(audio);
    const gain = context.createGain();
    const limiter = context.createDynamicsCompressor();
    gain.gain.value = checkbox.checked ? 1.6 : 1;
    limiter.threshold.value = -4;
    limiter.knee.value = 2;
    limiter.ratio.value = 12;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.12;
    source.connect(gain).connect(limiter).connect(context.destination);
    checkbox.onchange = () => { gain.gain.setTargetAtTime(checkbox.checked ? 1.6 : 1, context.currentTime, 0.02); };
    audio.onplay = () => context.resume();
    playbackBoostNodes.set(audio, { context, gain, limiter });
  } catch {
    checkbox.checked = false;
    checkbox.disabled = true;
    checkbox.closest('label').title = '이 브라우저에서는 재생 증폭을 사용할 수 없습니다.';
  }
}

function timedWordLayoutAudit(stimulus = $('#stimulus')) {
  const nodes = stimulus ? $$('[data-word-index]', stimulus) : [];
  const viewport = { width: window.innerWidth, height: window.innerHeight, scale: window.visualViewport?.scale || 1 };
  const rects = nodes.map(node => {
    const rect = node.getBoundingClientRect();
    return { index: Number(node.dataset.wordIndex), left: Math.round(rect.left), top: Math.round(rect.top), right: Math.round(rect.right), bottom: Math.round(rect.bottom), width: Math.round(rect.width), height: Math.round(rect.height) };
  });
  const visible = rects.filter(rect => rect.left >= 0 && rect.top >= 0 && rect.right <= viewport.width && rect.bottom <= viewport.height);
  const columns = new Set(rects.map(rect => rect.left)).size;
  const rows = new Set(rects.map(rect => rect.top)).size;
  const required = SPEC.PRESENTATION.timedWordGrid.requiredVisibleItems;
  const valid = nodes.length === required && visible.length === required && columns === SPEC.PRESENTATION.timedWordGrid.columns && rows === SPEC.PRESENTATION.timedWordGrid.rows && document.documentElement.scrollWidth <= window.innerWidth + 1;
  return { valid, itemCount: nodes.length, visibleCount: visible.length, columns, rows, viewport, horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1, scrollX: Math.round(window.scrollX), scrollY: Math.round(window.scrollY), rects, checkedAt: now() };
}

function beginTimedPresentationMonitoring() {
  if (state.presentationAuditCleanup) state.presentationAuditCleanup();
  const audit = state.currentPresentationAudit ||= { events: [] };
  const note = type => audit.events.push({ type, atPerfMs: Math.round(performance.now()), at: now(), viewport: { width: window.innerWidth, height: window.innerHeight, scale: window.visualViewport?.scale || 1 }, scrollX: Math.round(window.scrollX), scrollY: Math.round(window.scrollY) });
  const onVisibility = () => { if (document.visibilityState !== 'visible') note('DOCUMENT_HIDDEN'); };
  const onResize = () => note('VIEWPORT_RESIZED');
  const onScroll = () => note('SCROLLED_DURING_TIMED_TASK');
  const onBlur = () => note('WINDOW_BLURRED');
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', onResize);
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('blur', onBlur);
  state.presentationAuditCleanup = () => {
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('resize', onResize);
    window.removeEventListener('orientationchange', onResize);
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('blur', onBlur);
    state.presentationAuditCleanup = null;
  };
}

function finishTimedPresentationMonitoring(stimulus) {
  if (!state.currentPresentationAudit) return null;
  if (state.presentationAuditCleanup) state.presentationAuditCleanup();
  state.currentPresentationAudit.endLayout = timedWordLayoutAudit(stimulus);
  state.currentPresentationAudit.valid = Boolean(state.currentPresentationAudit.startLayout?.valid && state.currentPresentationAudit.endLayout.valid && !state.currentPresentationAudit.events.length && state.currentTaskTiming?.valid);
  state.currentPresentationAudit.status = state.currentPresentationAudit.valid ? 'VALID' : 'PRESENTATION_INVALID';
  return state.currentPresentationAudit;
}

const nextPaints = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

function task() {
  const item = state.taskQueue[state.taskIndex];
  state.currentBlob = null;
  state.currentQuality = null;
  state.currentTaskTiming = null;
  state.currentPresentationAudit = null;
  state.recordingStartedPerf = null;
  state.recordingStopReason = null;
  state.seconds = 0;
  state.shownAt = now();
  $('#task-name').textContent = `${moduleName(item.module)}${item.practice ? ' · 연습' : ''}`;
  const scoredQueue = state.taskQueue.filter(taskItem => !taskItem.ready);
  const scoredIndex = scoredQueue.indexOf(item);
  $('#task-progress').textContent = item.ready ? '본검사 준비' : `${scoredIndex + 1} / ${scoredQueue.length}`;
  const sameModule = state.taskQueue.filter(task => task.module === item.module);
  drawJourney(item.module, sameModule.indexOf(state.taskQueue[state.taskIndex]));
  if (item.ready) {
    $('.task-stage').innerHTML = `<div class="ready-panel"><p class="eyebrow">연습 끝</p><h1>${esc(moduleName(item.module))} 본검사를 시작합니다</h1><p>이제부터는 정답을 알려 드리지 않습니다. 준비되면 시작을 눌러 주세요.</p><button class="primary" id="task-main-start" type="button">본검사 시작</button></div>`;
    $('#task-main-start').onclick = () => { state.taskIndex++; render('task', { history: 'replace' }); };
    $('#quit-task').onclick = () => {
      if (confirm('검사를 중단하고 나갈까요? 지금까지 저장한 응답은 남습니다.')) {
        state.session.status = 'INTERRUPTED';
        state.session.updatedAt = now();
        upsertSession(state.session);
        stopStream();
        state.taskQueue = [];
        render('home');
      }
    };
    return;
  }
  $('#practice-banner').classList.toggle('hidden', !item.practice);
  $('#task-tags').innerHTML = [item.id, item.kind, item.condition, item.rule].filter(Boolean).map(tag => `<span>${esc(tag)}</span>`).join('');
  const stimulus = $('#stimulus');
  if (item.taskType === 'timed-word-list') {
    stimulus.innerHTML = item.words.map((word, index) => `<span data-word-index="${index}">${esc(word.text)}</span>`).join('');
    stimulus.setAttribute('aria-label', item.text);
  } else {
    stimulus.textContent = item.text;
    stimulus.removeAttribute('aria-label');
  }
  stimulus.className = `stimulus ${item.module === 'decoding' ? 'word' : item.taskType === 'timed-word-list' ? 'word-list' : 'passage'}`;
  const taskInstruction = item.module === 'decoding'
    ? '화면의 글자열을 한 번 소리 내어 읽어주세요.'
    : item.taskType === 'timed-word-list'
      ? `낱말을 왼쪽에서 오른쪽으로 소리 내어 읽어주세요. ${item.timeLimitSec}초가 되면 녹음이 자동으로 끝납니다.`
      : '글을 처음부터 끝까지 소리 내어 읽어주세요. 60초가 지나도 끝까지 계속 읽습니다.';
  $('#task-instruction').textContent = taskInstruction;
  const taskVoice = ensureTtsProfile(state.session);
  $('#task-voice-status').textContent = taskVoice?.voice ? `잠정 음성: ${taskVoice.profile.voice.name}` : '한국어 음성 안내를 사용할 수 없습니다.';
  $('#task-instruction-audio').onclick = async () => {
    const outcome = await speak(taskInstruction, { kind: 'instruction', module: item.module, itemId: item.id });
    $('#task-voice-status').textContent = outcome.ok ? `안내 재생 완료 · ${outcome.voice?.name || '시험용 음성'}` : '안내를 재생하지 못했습니다. 검사자가 같은 내용을 말로 설명해 주세요.';
  };
  $('#task-explanation').onclick = () => {
    state.session.instructionEvents ||= [];
    state.session.instructionEvents.push({ kind: 'ADDITIONAL_EXPLANATION', module: item.module, itemId: item.id, recordedAt: now() });
    $('#task-explanation').textContent = '추가 설명 기록됨';
    upsertSession(state.session);
  };
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
        if (item.taskType === 'timed-word-list') {
          const previousScrollBehavior = document.documentElement.style.scrollBehavior;
          document.documentElement.style.scrollBehavior = 'auto';
          stimulus.scrollIntoView({ block: 'center', inline: 'nearest' });
          await nextPaints();
          document.documentElement.style.scrollBehavior = previousScrollBehavior;
          const startLayout = timedWordLayoutAudit(stimulus);
          if (!startLayout.valid) {
            state.currentPresentationAudit = { startLayout, events: [], valid: false, status: 'PRESENTATION_INVALID', reason: 'ALL_60_WORDS_NOT_VISIBLE_IN_FIXED_5X12_GRID' };
            alert(`45초 낱말 목록 전체가 화면에 보여야 시작할 수 있습니다. 현재 ${startLayout.visibleCount}/${startLayout.itemCount}개가 보입니다. 창을 최대화하거나 화면 배율을 낮춘 뒤 다시 눌러 주세요.`);
            return;
          }
          state.currentPresentationAudit = { startLayout, events: [], formId: item.formId, startedAt: now(), status: 'MONITORING' };
        }
        state.chunks = [];
        state.recorder = new MediaRecorder(stream);
        state.recorder.ondataavailable = event => { if (event.data.size) state.chunks.push(event.data); };
        state.recorder.onstop = async () => {
          state.currentBlob = new Blob(state.chunks, { type: state.recorder.mimeType || 'audio/webm' });
          state.currentQuality = await analyzeAudio(state.currentBlob);
          const playback = $('#playback');
          playback.src = URL.createObjectURL(state.currentBlob);
          playback.classList.remove('hidden');
          $('#playback-boost-row').classList.remove('hidden');
          connectPlaybackBoost(playback, $('#playback-boost'));
          nextButton.classList.remove('hidden');
          retryButton.classList.remove('hidden');
          const quality = $('#quality-summary');
          quality.classList.remove('hidden');
          const needsRetry = state.currentQuality.flags.some(flag => ['지나치게 짧음', '입력 음량 매우 낮음', '발화 미탐지'].includes(flag));
          const invalidPresentation = item.taskType === 'timed-word-list' && state.currentPresentationAudit?.valid === false;
          quality.innerHTML = invalidPresentation
            ? `<b>실시 조건이 바뀌어 점수에서 제외됩니다</b><span>${esc(state.currentPresentationAudit.events.map(event => event.type).join(', ') || '화면 가시성 또는 45초 종료 오차')} · 원음성은 보존됩니다.</span>`
            : needsRetry
            ? '<b>녹음 상태를 확인해 주세요</b><span>아래에서 소리를 들어 보고, 잘 들리지 않으면 다시 녹음해 주세요.</span>'
            : '<b>녹음이 저장되었습니다</b><span>아래에서 소리를 확인하거나 다음 항목으로 이동해 주세요.</span>';
        };
        state.recordingStartedAt = now();
        state.recordingStartedPerf = performance.now();
        state.recordingStopReason = null;
        state.recorder.start(250);
        recording = true;
        if (item.taskType === 'timed-word-list') beginTimedPresentationMonitoring();
        recordButton.classList.add('stop');
        $('#record-dot').classList.add('live');
        $('#record-label').textContent = '녹음 중';
        $('#record-help').textContent = item.taskType === 'timed-word-list' ? `${item.timeLimitSec}초 동안 읽습니다. 끝까지 못 읽어도 괜찮습니다.` : '읽기가 끝나면 버튼을 다시 누르세요.';
        state.timer = setInterval(() => {
          state.seconds++;
          $('#record-time').textContent = formatTime(state.seconds);
          if (item.module === 'fluency' && state.seconds === 60) $('#record-help').textContent = '60초 지점을 기록했습니다. 글 끝까지 계속 읽어주세요.';
        }, 1000);
        if (item.timeLimitSec) {
          const deadlinePerf = state.recordingStartedPerf + item.timeLimitSec * 1000;
          state.recordingDeadlineTimer = setTimeout(() => {
            if (recording) { state.recordingStopReason = 'AUTO_TIME_LIMIT'; recordButton.click(); }
          }, Math.max(0, deadlinePerf - performance.now()));
        }
      } catch {
        alert('마이크 권한이 필요합니다. 장치 권한을 확인한 뒤 다시 시도해 주세요.');
      }
    } else {
      const stoppedPerf = performance.now();
      state.recordingStopReason ||= 'MANUAL_STOP';
      if (item.timeLimitSec && state.recordingStartedPerf != null) {
        const actualMs = Math.round(stoppedPerf - state.recordingStartedPerf);
        const targetMs = item.timeLimitSec * 1000;
        const driftMs = actualMs - targetMs;
        state.currentTaskTiming = { clock: 'performance.now', targetMs, actualMs, driftMs, toleranceMs: SPEC.PRESENTATION.timedRecordingToleranceMs, stopReason: state.recordingStopReason, valid: state.recordingStopReason === 'AUTO_TIME_LIMIT' && Math.abs(driftMs) <= SPEC.PRESENTATION.timedRecordingToleranceMs };
      }
      state.recorder.stop();
      recording = false;
      clearInterval(state.timer);
      state.timer = null;
      clearTimeout(state.recordingDeadlineTimer);
      state.recordingDeadlineTimer = null;
      if (item.taskType === 'timed-word-list') finishTimedPresentationMonitoring(stimulus);
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
    state.recordingStartedPerf = null;
    state.currentTaskTiming = null;
    state.currentPresentationAudit = null;
    state.recordingStopReason = null;
    if (state.presentationAuditCleanup) state.presentationAuditCleanup();
    clearTimeout(state.recordingDeadlineTimer);
    state.recordingDeadlineTimer = null;
    $('#record-time').textContent = '00:00';
    $('#playback').classList.add('hidden');
    $('#playback-boost-row').classList.add('hidden');
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
        presentation: item.taskType === 'timed-word-list'
          ? { ...(state.currentPresentationAudit || {}), status: state.currentPresentationAudit?.valid ? 'VALID' : 'PRESENTATION_INVALID', valid: Boolean(state.currentPresentationAudit?.valid), timing: state.currentTaskTiming, specVersion: SPEC.VERSION, stimulusType: 'word-list', shownAt: state.shownAt }
          : { status: 'VALID', valid: true, specVersion: SPEC.VERSION, stimulusType: item.module === 'decoding' ? 'word' : 'passage', shownAt: state.shownAt },
        stimulusShownAt: state.shownAt, recordingStartedAt: state.recordingStartedAt, recordingStoppedAt: now(),
        durationMs: state.currentQuality?.durationMs || state.seconds * 1000, first60Reached: item.module === 'fluency' && state.seconds >= 60,
        accepted: item.accepted || [], lexicality: item.lexicality || '', regularity: item.regularity || '', reviewNote: item.reviewNote || '', passageMeta: item.meta || null,
        taskType: item.taskType || '', timeLimitSec: item.timeLimitSec || null, formId: item.formId || null, sourceMeta: item.sourceMeta || item.selection || null, itemEvidenceVersion: ITEM_BANK.VERSION,
        quality: state.currentQuality,
        machineAnalysis: {
          status: state.currentQuality?.speech ? 'VAD_ONLY' : 'NOT_CONNECTED', transcript: '', candidate: null, modelVersion: 'energy-vad', configVersion: S.SCORING_CONFIG.version,
          speechOnsetMs: state.currentQuality?.speech?.onsetMs ?? null, speechOffsetMs: state.currentQuality?.speech?.offsetMs ?? null, pauses: state.currentQuality?.speech?.pauses || [],
          // 제시 후 첫 발화까지: (녹음 시작 - 제시) + 녹음 안의 발화 시작
          onsetLatencyMs: state.currentQuality?.speech?.onsetMs != null && state.recordingStartedAt ? new Date(state.recordingStartedAt) - new Date(state.shownAt) + state.currentQuality.speech.onsetMs : null
        },
        ratings: {}, adjudication: null, createdAt: now()
      });
      // GPU/CPU 음성인식은 자극 렌더링·스크롤과 경쟁하므로 참여자 흐름에서는 전혀 실행하지 않는다.
      // 연구자가 검증 화면의 "AI 분석"을 눌렀을 때만 순차 분석한다.
      state.session.responses[state.session.responses.length - 1].machineAnalysis.asrQueueStatus = 'DEFERRED_UNTIL_RESEARCHER_REQUEST';
      state.session.updatedAt = now();
      upsertSession(state.session);
      state.taskIndex++;
      if (state.taskIndex < state.taskQueue.length) render('task');
      else {
        stopStream();
        state.taskQueue = [];
        sessionStorage.setItem('readingReviewSession', state.session.id);
        startChoice(state.session);
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

// ---------- 기기 안 음성인식과 자동 채점 ----------
// 사람 채점 없이 시스템이 녹음을 듣고(ASR) 채점한다. 세부검사 녹음은 저장되는 즉시 뒤에서 분석을 시작하고,
// 검사가 끝나면 남은 분석을 마친 뒤 결과지로 연결한다.
async function getAsr() { return window.ReadingAsrOverride || import('./asr.js'); }
// 낱말 하나를 읽는 녹음: 글자만 필요하므로 단어 시각을 계산하지 않고, 생성 길이를 짧게 막아 환각 반복으로 오래 걸리는 것을 막는다.
const WORD_ASR = { timestamps: false, maxNewTokens: 24 };
// 음성인식은 한 번에 하나씩(GPU·CPU를 나눠 쓰지 않게) 순서대로 돌린다.
let asrChain = Promise.resolve();
function transcribeQueued(blob, onProgress, opts) {
  const run = asrChain.then(async () => (await getAsr()).transcribe(blob, onProgress, opts));
  asrChain = run.catch(() => {});
  return run;
}

const asrState = { status: 'idle', message: '', model: '' };
function drawAsrState() {
  const box = $('#asr-state');
  if (!box) return;
  const text = { idle: '음성인식 모델 준비 전', loading: asrState.message || '음성인식 모델 준비 중…', ready: `음성인식 준비됨 · ${asrState.model}`, error: `음성인식 모델을 불러오지 못했습니다. ${asrState.message}` }[asrState.status];
  box.textContent = text;
  box.className = `asr-state ${asrState.status}`;
}
function noteAsrModel(asr) {
  if (!asr) return;
  asrState.status = 'ready';
  asrState.model = asr.modelLabel || asr.model;
  asrState.device = asr.device || asrState.device;
  if (asr.elapsedMs != null) (asrState.times ||= []).push(asr.elapsedMs);
  drawAsrState();
}
// 채점 화면에 쓰는 속도 정보: 장치(GPU/CPU)와 녹음 하나당 평균 분석 시간
function asrSpeedText() {
  const times = asrState.times || [];
  const avg = times.length ? (times.reduce((a, b) => a + b, 0) / times.length / 1000).toFixed(1) : null;
  const device = asrState.device === 'webgpu' ? 'GPU 가속' : asrState.device ? 'CPU 실행 (GPU 가속 없음, 느림)' : '';
  return [asrState.model, device, avg ? `녹음 하나당 평균 ${avg}초` : ''].filter(Boolean).join(' · ');
}
// 마이크 점검 때 미리 모델을 받아 두면 검사 중·후에 기다리지 않는다.
async function preloadAsr() {
  if (asrState.status === 'ready') return;
  if (asrState.status === 'loading') return asrState.promise;
  asrState.status = 'loading'; drawAsrState();
  asrState.promise = (async () => {
    try {
      const asr = await getAsr();
      const loaded = asr.load ? await asr.load(message => { asrState.message = message; drawAsrState(); }) : null;
      asrState.status = 'ready';
      asrState.model = loaded?.model?.label || loaded?.model?.id || asr.modelLabel || '음성인식';
    } catch (error) {
      asrState.status = 'error';
      asrState.message = `${error.message || error} · 인터넷 연결(jsdelivr.net, huggingface.co)을 확인하세요.`;
    }
    drawAsrState();
  })();
  try { await asrState.promise; } finally { asrState.promise = null; }
}

// 한 응답에 ASR을 돌리고 후처리(제한 후보 선택 또는 지문 정렬)까지 machineAnalysis에 저장한다.
async function analyzeResponseWithAsr(session, response, onProgress) {
  const blob = response.audioKey ? await getBlob(response.audioKey) : null;
  if (!blob) return false;
  const asr = await transcribeQueued(blob, onProgress, response.module === 'decoding' ? WORD_ASR : {});
  noteAsrModel(asr);
  response.machineAnalysis ||= {};
  response.machineAnalysis.asr = asr;
  response.machineAnalysis.status = 'ASR_DONE';
  response.machineAnalysis.modelVersion = `${asr.model} (${asr.library})`;
  if (response.module === 'decoding') {
    response.machineAnalysis.constrained = S.constrainedDecodingChoice(asr.text, { text: response.target, accepted: response.accepted, expected: response.expected });
  } else {
    response.machineAnalysis.alignment = S.alignWordsToPassage(S.tokenizePassage(response.target), asr.words);
  }
  session.sttModelVersion = response.machineAnalysis.modelVersion;
  session.sttModelLabel = asr.modelLabel || asr.model;
  return true;
}

// 자동 채점: ASR 결과 → 문항 점수(autoRating). 결과지는 이 값을 쓴다.
async function autoScoreResponse(session, response, onProgress) {
  if (response.practice || !response.audioKey) return false;
  if (response.presentation?.valid === false) {
    response.autoRating = { itemScore: 'UNSCORABLE', reason: response.presentation.status || 'PRESENTATION_INVALID', scoredAt: now(), model: 'presentation-quality-gate' };
    return true;
  }
  if (response.machineAnalysis?.asr?.status !== 'DONE' && !(await analyzeResponseWithAsr(session, response, onProgress))) return false;
  const asr = response.machineAnalysis.asr;
  const speech = response.quality?.speech;
  response.autoRating = response.module === 'decoding'
    ? S.autoDecodingRating({ text: response.target, accepted: response.accepted?.length ? response.accepted : [response.expected].filter(Boolean), rule: response.rule }, asr.text, { speechDetected: true })
    : S.autoFluencyRating(S.tokenizePassage(response.target), asr.words, { speech, recordingMs: response.durationMs, asrText: asr.text });
  response.autoRating.model = asr.modelLabel || asr.model;
  response.autoRating.scoredAt = now();
  return true;
}

// 아직 자동 채점이 없는 응답을 모두 채점한다 (검사 직후, 또는 결과지에서 다시 시도).
async function autoScoreSession(session, onProgress = () => {}) {
  const targets = scoredResponses(session).filter(response => !response.autoRating && response.audioKey);
  for (const [i, response] of targets.entries()) {
    onProgress(i, targets.length, '');
    await autoScoreResponse(session, response, message => onProgress(i, targets.length, message));
    delete response.autoError;
    upsertSession(session);
  }
  if (scoredResponses(session).every(response => response.autoRating || !response.audioKey)) { session.status = 'SCORED'; session.scoredAt = now(); }
  session.updatedAt = now();
  upsertSession(session);
}

function complete() {
  const session = state.session;
  if (!session) return;
  const pending = scoredResponses(session).filter(response => response.audioKey && !response.autoRating).length;
  $('#complete-status').textContent = pending
    ? `응답 저장 완료 · 녹음 ${pending}개는 아직 자동 분석하지 않았습니다. 참여자는 기다리지 않고 결과 요약을 볼 수 있습니다.`
    : '응답 저장과 채점이 끝났습니다. 참여자용 결과 요약을 볼 수 있습니다.';
  $('#complete-bar').style.width = '100%';
  $('#complete-report').disabled = false;
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
    const targets = session.responses.filter(response => !response.practice && response.audioKey && !response.autoRating);
    status.classList.remove('hidden');
    if (!targets.length) { status.textContent = session.demo ? '예시 기록에는 원음성이 없어 AI 분석을 할 수 없습니다.' : '모든 녹음에 AI 분석이 이미 있습니다.'; return; }
    button.disabled = true;
    let done = 0;
    try {
      for (const response of targets) {
        status.textContent = `AI 분석 ${done + 1} / ${targets.length}: ${response.stimulusId} · 처음 한 번은 Whisper small 모델을 내려받습니다.`;
        await autoScoreResponse(session, response, message => { status.textContent = `AI 분석 ${done + 1} / ${targets.length}: ${message}`; });
        done++;
        upsertSession(session);
      }
      if (scoredResponses(session).every(response => response.autoRating || !response.audioKey)) { session.status = 'SCORED'; session.scoredAt = now(); upsertSession(session); }
      status.textContent = `AI 분석·후보 채점 완료: ${done}개 녹음. 이 값은 연구 후보이며 사람 채점과의 일치도를 검증해야 합니다.`;
    } catch (error) {
      status.textContent = `AI 분석을 마치지 못했습니다 (${done}개 완료). ${error.message || error} · 인터넷 연결(jsdelivr.net, huggingface.co)을 확인하세요.`;
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
  return ({ AGREE: '일치', CONSENSUS: '합의', EXPERT_PENDING: '전문가 보류', INVALID_AUDIO: '음성 무효', NEEDS_CONSENSUS: '불일치', UNPAIRED: '독립 채점 중', PROVISIONAL: '잠정(1인 채점)', AUTO: '자동 채점', AUTO_PENDING: '분석 전' })[status] || '채점 전';
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
  const head = `<h3>자동 채점 근거 · 기기 안 음성인식${asr?.modelLabel ? ` (${esc(asr.modelLabel)})` : ''}</h3>`;
  if (!asr) return `<div class="review-box span-two ai-box">${head}<p class="quiet">아직 AI 분석을 하지 않았습니다. 결과지는 이 분석으로 만든 자동 채점값을 씁니다.</p>${response.audioKey ? '<button class="secondary compact-button" id="ai-run-one" type="button">이 녹음 AI 분석</button>' : '<p class="quiet">원음성이 없는 기록입니다.</p>'}</div>`;
  const meta = `<small>${esc(asr.model)} · ${esc(asr.library)} · 시각 ${asr.timestampMode === 'word' ? '단어 단위' : '구간 단위(단어 시각은 추정)'} · ${new Date(asr.createdAt).toLocaleString('ko-KR')}</small>`;
  if (response.module === 'decoding') {
    const c = machine.constrained;
    return `<div class="review-box span-two ai-box">${head}<div class="ai-line"><span class="ai-heard">“${esc(asr.text || '(인식 없음)')}”</span>${c?.nearest ? `<span class="marker-chip ${c.confident ? 'onset' : 'sixty'}">가장 가까운 후보 [${esc(c.nearest.form)}] ${esc(c.nearest.label)} · 차이 ${c.nearest.distance}</span>` : ''}</div><p class="quiet">${esc(c?.note || '')}. 음성인식은 비단어를 비슷한 실제 단어로 바꿔 들을 수 있습니다(결과지 '한계' 참고).</p>${meta}<button class="secondary compact-button" id="ai-to-transcript" type="button">AI 전사를 전사 칸에 넣기</button></div>`;
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
  payload.versions = { policy: POLICY_VERSION, content: CONTENT_VERSION, extensionPolicy: EXTENSION_POLICY_VERSION, rating: RATING_VERSION, scoringConfig: S.SCORING_CONFIG };
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

  $('#result-content').innerHTML = `<div class="notice warning"><b>표준화 전 연구판입니다.</b> 규준이 없어 표준점수·백분위·난독 위험 판정은 보류하고 두 채점자가 확인한 원점수와 보류 상태만 표시합니다.${session.demo ? ' <b>이 기록은 화면 시연용 예시 자료입니다.</b>' : ''}</div>
  <div class="result-meta"><span>참여자 ${esc(session.participant)}</span><span>${esc(session.ageBand)}</span><span>상태 ${esc(session.status)}</span><span>검사 사양 ${esc(session.assessmentSpecVersion || 'legacy')}</span><span>문항 ${esc(session.formVersion)}</span><span>채점 ${esc(session.ratingVersion)}</span><span>발음 목록 ${esc(session.pronunciationDictVersion || '0.2 이전')}</span><span>음성인식 ${esc(session.sttModelVersion || 'not-run')}</span></div>
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
    createdAt: created, updatedAt: created, startedAt: created, screening: { words, sentence, decision, contentVersion: 'screening-form-0.2', finishedAt: created }, responses: [], status: 'SCORED', length: 'full',
    routing: { recommended: decision.paths, final: decision.paths, added: [], removed: [], decidedAt: created },
    previewPaths: decision.paths, previewLog: PREVIEW_SUBTESTS.filter(subtest => decision.paths.includes(subtest.pathId)).map(subtest => subtest.id), orderPolicy: 'fixed',
    appVersion: APP_VERSION, formVersion: CONTENT_VERSION, policyVersion: POLICY_VERSION, ratingVersion: RATING_VERSION, pronunciationDictVersion: PRONUNCIATION_DICT_VERSION, sttModelVersion: 'not-run', schemaVersion: '0.5',
    assessmentSpecVersion: SPEC.VERSION, extensionPolicyVersion: EXTENSION_POLICY_VERSION, aItemBlueprint: A_BLUEPRINT_AUDIT,
    digitalReadingExtensionEnabled: true, morphologyExtensionEnabled: true, advancedComprehensionExtensionEnabled: true,
    environment: SPEC.environmentSnapshot(window), presentationLog: [], ttsEvents: []
  };
  // 예시 음성인식 결과: [문항 ID, 인식된 말, 반응 시작 ms]. 실제 검사에서는 녹음에서 이 값이 나온다.
  const decodingPlan = [
    ['RW-C-01', '나무', 820], ['RW-C-02', '모자', 760], ['RW-C-03', '바다', 700], ['RW-C-04', '우산', 910],
    ['RW-I-01', '국물', 1350], ['RW-I-02', '설랄', 1120], ['RW-I-03', '가치', 980], ['RW-I-04', '입학 이팍', 1640],
    ['NW-C-01', '가몬', 1210], ['NW-C-02', '파숨', 1580], ['NW-C-03', '버 눅', 1900], ['NW-C-04', '소덥', 1300],
    ['NW-I-01', '덕무', 2100], ['NW-I-02', '물라', 2350], ['NW-I-03', '삭바', 2600], ['NW-I-04', '더푸', 1450]
  ];
  const base = (item, module, durationMs, speech, asrText) => ({
    id: uid(), stimulusId: item.id, module, target: item.text, expected: item.accepted?.[0] || '', accepted: item.accepted || [], kind: item.kind,
    lexicality: item.lexicality || '', regularity: item.regularity || '', reviewNote: item.reviewNote || '', passageMeta: item.meta || null,
    condition: item.condition || '', rule: item.rule || '', practice: false, audioKey: null, durationMs,
    quality: { flags: ['예시 자료 · 음성 없음'] }, machineAnalysis: { status: 'DEMO', modelVersion: 'demo', asr: { status: 'DONE', text: asrText, words: [], model: 'demo', modelLabel: '예시 값' }, ...speech }, ratings: {}, adjudication: null, createdAt: created
  });
  for (const [id, heard, latency] of decodingPlan) {
    const item = stimulusById(id);
    const response = base(item, 'decoding', latency + 1400, { speechOnsetMs: latency - 300, speechOffsetMs: latency + 500, onsetLatencyMs: latency, pauses: [] }, heard);
    response.autoRating = { ...S.autoDecodingRating(item, heard), model: '예시 값', scoredAt: created };
    session.responses.push(response);
  }
  const fluencyPlan = [
    { id: 'F-A', onset: 620, end: 31400, marks: { 6: { mark: 'correct', flags: ['repeat'] }, 18: { mark: 'sub', flags: [], actual: '민주는' }, 25: { mark: 'correct', flags: ['insertAfter'] }, 29: { mark: 'correct', flags: ['pauseBefore'] } }, pauses: [{ startMs: 20400, endMs: 21600, durationMs: 1200 }] },
    { id: 'F-B', onset: 540, end: 36800, marks: { 3: { mark: 'omit', flags: [] }, 11: { mark: 'sub', flags: [], actual: '햇볕을' }, 20: { mark: 'sub', flags: ['pauseBefore'], actual: '저장' }, 27: { mark: 'correct', flags: ['insertAfter'] } }, pauses: [{ startMs: 22100, endMs: 24300, durationMs: 2200 }] }
  ];
  for (const plan of fluencyPlan) {
    const item = stimulusById(plan.id);
    const response = base(item, 'fluency', plan.end + 900, { speechOnsetMs: plan.onset, speechOffsetMs: plan.end, pauses: plan.pauses }, '');
    const tokens = S.tokenizePassage(item.text);
    const metrics = S.computeFluency({ tokens, marks: plan.marks, onsetMs: plan.onset, endMs: plan.end });
    response.autoRating = { source: 'AUTO', scoringVersion: S.AUTO_SCORING_VERSION, transcript: '', itemScore: 'VALID', marks: JSON.parse(JSON.stringify(plan.marks)), lastIndex: tokens.length - 1, sixtyIndex: null, sixtySource: 'auto',
      onsetMs: plan.onset, speechEndMs: plan.end, timing: 'vad', metrics, events: Object.keys(metrics.events), model: '예시 값', scoredAt: created };
    session.responses.push(response);
  }
  // 예시 선택형 응답: 음소 수준 조작과 추론·평가에서 오류, 묵독은 제한 시간 안에 26문장 시도.
  const choiceWrong = new Set(['AP-06', 'AP-08', 'AP-09', 'AL-03', 'BL-06', 'BL-14', 'BL-21', 'BS-05', 'BS-13', 'BS-22', 'CV-09', 'CV-11', 'CS-05', 'CL-04', 'CM-06', 'D1-03', 'D2-03', 'D2-04', 'D3-02', 'D3-03']);
  session.modules = [...session.modules, 'phonology', 'silent', 'language', 'comprehension'];
  session.batteryVersion = BATTERY_VERSION;
  session.choiceAnswers = [];
  session.choiceSections = {};
  let rtSeed = 7;
  for (const module of ['phonology', 'silent', 'language', 'comprehension']) for (const section of choiceSections(session, module)) {
    const items = section.id === 'B-silent' ? section.items.slice(0, 26) : section.items;
    session.choiceSections[section.id] = { module, startedAt: created, timeLimitSec: section.timeLimitSec?.full || null, items: section.items.length, timedOut: section.id === 'B-silent' };
    for (const item of items) {
      rtSeed = (rtSeed * 37 + 11) % 97;
      const wrong = choiceWrong.has(item.id);
      const options = section.format === 'binary' ? section.binary.map(option => option.value) : item.options;
      const response = wrong ? options.find(option => option !== item.answer) : item.answer;
      const rtMs = (section.format === 'binary' ? 900 : 2200) + rtSeed * (section.format === 'binary' ? 12 : 40);
      session.choiceAnswers.push({ module, sectionId: section.id, subtest: item.subtest || section.subtest, itemId: item.id, type: item.type, response, answer: item.answer, correct: !wrong, rawCorrect: !wrong, rtMs, noResponse: false, replays: 0, presentedAt: created, battery: BATTERY_VERSION, scoringStatus: 'VALID', specVersion: SPEC.VERSION,
        presentation: { status: 'VALID', valid: true, targetMs: section.exposureMs || null, actualMs: section.exposureMs || null, driftMs: 0, endedBy: section.exposureMs ? 'timer' : null, toleranceMs: SPEC.PRESENTATION.exposureToleranceMs, preloadLeadMs: 500 } });
    }
  }
  session.supportExperimentEnabled = true;
  session.supportExperiment = {
    version: SUPPORT_EXPERIMENT_VERSION, design: 'THREE_PARALLEL_CANDIDATES_COUNTERBALANCED', conditionOrder: ['L0', 'L1', 'L2'],
    plan: [{ condition: 'L0', formId: 'SUP-A' }, { condition: 'L1', formId: 'SUP-B' }, { condition: 'L2', formId: 'SUP-C' }],
    scorePolicy: 'SEPARATE_FROM_BASELINE', startedAt: created, completedAt: created,
    trials: [
      { condition: 'L0', conditionLabel: '도움 없이 읽기', formId: 'SUP-A', response: SUPPORT_FORMS[0].options[1], answer: SUPPORT_FORMS[0].answer, correct: false, rtMs: 9100, audioPlays: 0, scorePolicy: 'EXPLORATORY_SEPARATE', recordedAt: created },
      { condition: 'L1', conditionLabel: '핵심 문장 표시', formId: 'SUP-B', response: SUPPORT_FORMS[1].answer, answer: SUPPORT_FORMS[1].answer, correct: true, rtMs: 6300, audioPlays: 0, scorePolicy: 'EXPLORATORY_SEPARATE', recordedAt: created },
      { condition: 'L2', conditionLabel: '문장 나누기와 듣기', formId: 'SUP-C', response: SUPPORT_FORMS[2].answer, answer: SUPPORT_FORMS[2].answer, correct: true, rtMs: 5900, audioPlays: 1, scorePolicy: 'EXPLORATORY_SEPARATE', recordedAt: created }
    ]
  };
  session.status = 'SCORED';
  session.sttModelLabel = '예시 값';
  return session;
}

$('#reset-data').onclick = () => {
  if (confirm('이 기기에 저장된 모든 검사 기록과 원음성을 삭제할까요? 이 작업은 되돌릴 수 없습니다.')) {
    localStorage.removeItem('readingSessions');
    localStorage.removeItem('readingTtsPreference');
    indexedDB.deleteDatabase('ReadingPrototypeDB');
    render('home');
  }
};

render(location.hash.slice(1) || 'home', { history: 'replace' });
