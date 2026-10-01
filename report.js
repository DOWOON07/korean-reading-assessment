// 전문 결과지: 교수님 브리핑 Blueprint v1.2 8장의 10개 층 구조를 따른다.
// 단어 해독(A)과 읽기 유창성(B)만 실제 원점수로 채우고, 나머지 영역은 '미실시' 공란으로 둔다.
// 규준·진단 문구는 만들지 않는다 (설계도 v0.2 1장 "금지하는 주장").

const USABLE = ['AUTO'];

// 결과지 점수는 시스템이 녹음을 듣고(음성인식) 매긴 자동 채점값(response.autoRating)이다.
// 연구용 검증 화면에서 사람이 매긴 채점은 점수에 쓰지 않고, 자동 채점의 정확도를 계산하는 데만 쓴다.
function withAuto(session) {
  const copy = { ...session, responses: session.responses.map(response => {
    if (response.practice) return response;
    const auto = response.autoRating;
    if (!auto) return { ...response, adjudication: { status: 'AUTO_PENDING', finalRating: null } };
    return { ...response, adjudication: { status: auto.itemScore === 'UNSCORABLE' ? 'INVALID_AUDIO' : 'AUTO', finalRating: auto } };
  }) };
  copy.pendingCount = copy.responses.filter(response => response.adjudication?.status === 'AUTO_PENDING').length;
  return copy;
}

// 자동 채점 ↔ 사람 검증. 사람 값은 두 채점자 일치·합의값, 없으면 한 사람의 채점값을 쓴다.
function autoVerification(session) {
  const human = response => ['AGREE', 'CONSENSUS'].includes(response.adjudication?.status) ? response.adjudication.finalRating : (response.ratings?.A || response.ratings?.B || null);
  const isError = entry => Boolean(entry && S.FLUENCY_MARKS[entry.mark]?.error);
  const list = scoredResponses(session).filter(response => response.autoRating && human(response) && human(response).itemScore !== 'UNSCORABLE' && response.autoRating.itemScore !== 'UNSCORABLE');
  const decoding = S.cohensKappa(list.filter(r => r.module === 'decoding').map(r => [r.autoRating.itemScore, human(r).itemScore]));
  const fluency = S.cohensKappa(list.filter(r => r.module === 'fluency').flatMap(r => S.tokenizePassage(r.target)
    .filter(token => token.index <= Math.min(r.autoRating.lastIndex ?? Infinity, human(r).lastIndex ?? Infinity))
    .map(token => [isError(r.autoRating.marks?.[token.index]) ? 'E' : 'C', isError(human(r).marks?.[token.index]) ? 'E' : 'C'])));
  return { decoding, fluency };
}

function report() {
  const list = sessions().filter(session => scoredResponses(session).length || session.choiceAnswers?.length);
  const select = $('#report-session-select');
  const scope = $('#report-scope');
  if (!list.length) { $('#report-empty').classList.remove('hidden'); return; }
  select.innerHTML = list.map(session => `<option value="${session.id}">${esc(session.participant)}${session.demo ? ' (예시)' : ''}${session.mode === 'module' ? ` · ${moduleName(session.modules[0])}` : ''} · ${new Date(session.createdAt).toLocaleDateString('ko-KR')}</option>`).join('');
  const preferred = sessionStorage.getItem('readingResultSession');
  if (preferred && list.some(session => session.id === preferred)) select.value = preferred;
  const current = () => list.find(session => session.id === select.value) || list[0];
  // 모듈별 검사 기록은 그 모듈 결과지를 기본으로 연다.
  const defaultScope = session => session.modules.length === 1 ? session.modules[0] : 'all';
  scope.value = defaultScope(current());
  const draw = () => { sessionStorage.setItem('readingResultSession', select.value); drawReport(current(), scope.value); };
  select.onchange = () => { scope.value = defaultScope(current()); draw(); };
  scope.onchange = draw;
  $('#print-report').onclick = () => window.print();
  draw();
}

const median = values => {
  const sorted = values.filter(value => value != null).sort((x, y) => x - y);
  if (!sorted.length) return null;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
};
const blank = '<span class="blank">— 미실시</span>';

// 단일 계열 가로 막대. 값은 원점수 비율이며 규준 위치가 아니다.
function barRow(label, value, { max = 100, unit = '%', note = '', empty = false, emptyText = null } = {}) {
  if (empty || value == null) return `<div class="bar-row bar-empty"><span class="bar-label">${label}</span><div class="bar-track"></div><span class="bar-value">${emptyText ? `<span class="blank">${emptyText}</span>` : blank}</span></div>`;
  const width = Math.max(0, Math.min(100, value / max * 100));
  return `<div class="bar-row" title="${esc(`${label}: ${value}${unit}${note ? ` · ${note}` : ''}`)}"><span class="bar-label">${label}</span><div class="bar-track"><span class="bar-fill" style="width:${width}%"></span></div><span class="bar-value">${value}${unit}${note ? `<small>${esc(note)}</small>` : ''}</span></div>`;
}

function decodingStats(session) {
  const decoding = scoredResponses(session).filter(response => response.module === 'decoding');
  const usable = decoding.filter(response => USABLE.includes(response.adjudication?.status) && response.adjudication.finalRating);
  const correct = response => response.adjudication.finalRating.itemScore === 'CORRECT';
  const group = filter => {
    const items = usable.filter(filter);
    const hit = items.filter(correct).length;
    return { n: items.length, hit, total: decoding.filter(filter).length, pct: items.length ? Math.round(hit / items.length * 100) : null, latency: median(items.map(response => response.machineAnalysis?.onsetLatencyMs)) };
  };
  const events = {};
  const positions = { cho: 0, jung: 0, jong: 0, whole: 0 };
  for (const response of usable) {
    const final = response.adjudication.finalRating;
    for (const event of final.events || []) events[event] = (events[event] || 0) + 1;
    for (const op of (final.errorPositions || []).flat()) {
      if (op.op === 'sub') for (const diff of op.jamo || []) positions[diff.part]++;
      else positions.whole++;
    }
  }
  const firstWrongFinalRight = usable.filter(response => response.adjudication.finalRating.firstAttemptCorrect === 'INCORRECT' && correct(response)).length;
  const hesitations = usable.filter(response => S.hesitationCheck(response.machineAnalysis?.onsetLatencyMs)?.exceeded).length;
  return {
    decoding, usable,
    all: group(() => true),
    real: group(response => lexicalityOf(response) === 'real'), nonword: group(response => lexicalityOf(response) === 'nonword'),
    consistent: group(response => regularityOf(response) === 'consistent'), phonological: group(response => regularityOf(response) === 'phonological'),
    cell: (lex, reg) => group(response => lexicalityOf(response) === lex && regularityOf(response) === reg),
    spellingReads: usable.filter(response => regularityOf(response) === 'phonological' && response.adjudication.finalRating.itemScore === 'INCORRECT'
      && S.syllablesOf(response.adjudication.finalRating.transcript?.split('/').pop() || '').join('') === S.syllablesOf(response.target).join('')).length,
    events, positions, firstWrongFinalRight, hesitations,
    expert: decoding.filter(response => response.adjudication?.status === 'EXPERT_PENDING'),
    invalid: decoding.filter(response => response.adjudication?.status === 'INVALID_AUDIO'),
    pending: decoding.filter(response => response.adjudication?.status === 'AUTO_PENDING')
  };
}

function fluencyStats(session) {
  const fluency = scoredResponses(session).filter(response => response.module === 'fluency');
  const passages = fluency.map(response => {
    const final = USABLE.includes(response.adjudication?.status) ? response.adjudication.finalRating : null;
    if (!final) return { response, final: null };
    const tokens = S.tokenizePassage(response.target);
    const metrics = S.computeFluency({ tokens, marks: final.marks, lastIndex: final.lastIndex, sixtyIndex: final.sixtyIndex, onsetMs: final.onsetMs, endMs: final.speechEndMs });
    return { response, final, tokens, metrics, pauses: (response.machineAnalysis?.pauses || []).length };
  });
  const done = passages.filter(passage => passage.final);
  const sum = key => done.reduce((total, passage) => total + (passage.metrics[key] || 0), 0);
  const seconds = done.reduce((total, passage) => total + (passage.metrics.readingSeconds || 0), 0);
  const events = {};
  for (const passage of done) for (const [name, count] of Object.entries(passage.metrics.events)) events[name] = (events[name] || 0) + count;
  return {
    passages, done, events,
    accuracyEojeol: sum('attemptedEojeol') ? +(sum('correctEojeol') / sum('attemptedEojeol') * 100).toFixed(1) : null,
    accuracySyllable: sum('attemptedSyllables') ? +(sum('correctSyllables') / sum('attemptedSyllables') * 100).toFixed(1) : null,
    eojeolPerMin: seconds ? +(sum('correctEojeol') / seconds * 60).toFixed(1) : null,
    syllablesPerMin: seconds ? +(sum('correctSyllables') / seconds * 60).toFixed(1) : null,
    seconds: +seconds.toFixed(1)
  };
}

function summarySentences(d, f) {
  const lines = [];
  if (d.all.n) {
    lines.push(`단어 해독: 채점된 ${d.all.n}문항 중 ${d.all.hit}문항을 정확히 읽었습니다(${d.all.pct}%).`);
    if (d.consistent.n && d.phonological.n) {
      const gap = d.consistent.pct - d.phonological.pct;
      lines.push(`표기대로 소리 나는 조건 ${d.consistent.pct}%, 음운변동이 필요한 조건 ${d.phonological.pct}%로 ${Math.abs(gap) >= 20 ? `음운변동 조건에서 ${gap > 0 ? '정확도가 낮았습니다' : '정확도가 오히려 높았습니다'}(차이 ${Math.abs(gap)}%p).` : '두 조건의 차이는 크지 않았습니다.'}`);
    }
    if (d.real.n && d.nonword.n) lines.push(`실제단어 ${d.real.pct}%, 비단어 ${d.nonword.pct}%${d.real.pct - d.nonword.pct >= 20 ? '로, 처음 보는 글자열에서 정확도가 낮았습니다.' : '입니다.'}`);
    if (d.spellingReads) lines.push(`음운변동 문항 중 ${d.spellingReads}문항을 표기대로 읽었습니다(규칙 미적용 오류).`);
    if (d.firstWrongFinalRight) lines.push(`${d.firstWrongFinalRight}문항은 첫 시도 오류 후 자기수정으로 최종 정답이었습니다.`);
  } else lines.push('단어 해독: 자동 채점된 문항이 아직 없습니다.');
  if (f.done.length) {
    lines.push(`읽기 유창성: 지문 ${f.done.length}개, 총 ${f.seconds}초 낭독. 정확도 어절 ${f.accuracyEojeol}% · 음절 ${f.accuracySyllable}%, 분당 정확 어절 ${f.eojeolPerMin} · 음절 ${f.syllablesPerMin}.`);
    const top = Object.entries(f.events).sort((x, y) => y[1] - x[1]).slice(0, 3).map(([name, count]) => `${name} ${count}`).join(', ');
    if (top) lines.push(`유창성에서 기록된 주요 사건: ${top}.`);
  } else lines.push('읽기 유창성: 자동 채점된 지문이 아직 없습니다.');
  return lines;
}


// ---------- 분석 문장 ----------
// 각 문장은 "관찰(숫자) → 해석(가설 수준) → 근거"로 쓴다. 신뢰구간이 0을 포함하면 차이를 주장하지 않는다.
const REFS = {
  lex: 'Rack, Snowling & Olson (1992); Castles & Coltheart (1993)',
  rule: '표준 발음법 제9·17·18·20·29항; 이은주 (2021)',
  ci: 'Wilson (1927); Newcombe (1998)',
  dibels: 'DIBELS 8 채점 안내 p.76',
  cbm: 'Deno (1985); Fuchs 외 (2001)',
  kappa: 'Cohen (1960); Landis & Koch (1977)',
  asr: 'van der Velde 외 (2025); Bolaños 외 (2011)',
  whisper: 'Radford 외 (2023), Whisper',
  design: '설계도 v0.2 (팀 설계, 검증 대상)',
  roar: 'Yeatman 외 (2021) ROAR 단어 재인',
  tosrec: 'Wagner 외 (2010) TOSREC',
  ctopp: 'Wagner 외 (2013) CTOPP-2; KOLRA 음운처리',
  sdt: 'Green & Swets (1966); Hautus (1995)',
  svr: 'Gough & Tunmer (1986); Hoover & Gough (1990)',
  pirls: 'IEA PIRLS 2021 평가 틀 (Mullis & Martin, 2019)',
  pisa: 'OECD (2019) PISA 2018 읽기 평가 틀',
  chance: '선택형 검사의 우연 정답률 (보기 수의 역수)'
};
const ciText = (hit, n) => { const w = S.wilsonInterval(hit, n); return w ? `95% CI ${w.low}~${w.high}%` : ''; };

function compareConditions(labelA, a, labelB, b) {
  if (!a.n || !b.n) return null;
  const nd = S.proportionDifference(a.hit, a.n, b.hit, b.n);
  const observed = `${labelA} ${a.hit}/${a.n}(${a.pct}%) vs ${labelB} ${b.hit}/${b.n}(${b.pct}%), 차이 ${nd.diff > 0 ? '+' : ''}${nd.diff}%p [95% CI ${nd.low}~${nd.high}]`;
  const nearZero = nd.excludesZero && Math.min(Math.abs(nd.low), Math.abs(nd.high)) < 5;
  return { nd, observed, caution: nearZero ? ' 다만 구간 끝이 0에 가까워(경계선) 문항을 늘려 재확인해야 합니다.' : '' };
}

function finding(title, observed, meaning, basis, level = 'info') {
  return { title, observed, meaning, basis, level };
}

function decodingFindings(d) {
  const list = [];
  const lex = compareConditions('실제단어', d.real, '비단어', d.nonword);
  if (lex) list.push(finding('어휘성 효과 (실제단어 − 비단어)', lex.observed,
    lex.nd.excludesZero && lex.nd.diff > 0 ? '비단어에서 정확도가 낮고 차이의 신뢰구간이 0을 포함하지 않습니다. 비단어는 어휘 지식의 도움 없이 글자-소리 대응만으로 읽어야 하므로, 이 차이는 음운 해독 경로의 부담을 보여줄 수 있습니다.' + lex.caution
      : lex.nd.excludesZero ? '비단어 정확도가 오히려 높습니다. 실제단어 문항 난이도나 음운변동 문항 배치를 먼저 점검해야 합니다.'
      : `신뢰구간이 0을 포함하므로 이 문항 수(${d.real.n}+${d.nonword.n})로는 두 조건의 차이를 말할 수 없습니다. 방향만 참고합니다.`,
    `${REFS.lex}; ${REFS.ci}`, lex.nd.excludesZero ? 'attention' : 'info'));
  const reg = compareConditions('표기-발음 일치', d.consistent, '음운변동 필요', d.phonological);
  if (reg) list.push(finding('음운규칙 효과 (일치 − 음운변동)', reg.observed,
    reg.nd.excludesZero && reg.nd.diff > 0 ? '글자와 소리가 다른 단어(비음화·구개음화 등 적용)에서 정확도가 낮고 차이의 신뢰구간이 0을 포함하지 않습니다. 표기-발음 대응은 되지만 음운규칙 적용 단계에서 막히는 양상인지 규칙별 문항으로 확인이 필요합니다.' + reg.caution
      : reg.nd.excludesZero ? '음운변동 조건 정확도가 오히려 높습니다. 일치 조건 문항(특히 비단어)의 적절성을 점검해야 합니다.'
      : `신뢰구간이 0을 포함하므로 이 문항 수(${d.consistent.n}+${d.phonological.n})로는 음운규칙 조건의 효과를 말할 수 없습니다.`,
    `${REFS.rule}; ${REFS.ci}`, reg.nd.excludesZero ? 'attention' : 'info'));
  const ruleErrors = d.phonological.n - d.phonological.hit;
  if (ruleErrors) list.push(finding('음운변동 문항의 오류 유형', `음운변동 문항 오류 ${ruleErrors}건 중 표기대로 읽음 ${d.spellingReads}건`,
    d.spellingReads ? `표기대로 읽은 오류는 글자-소리 대응은 수행했으나 음운규칙(예: 국물→[궁물])을 적용하지 않은 형태입니다. ${d.spellingReads === ruleErrors ? '이 조건의 오류가 모두 이 유형입니다.' : '나머지는 다른 소리로 바꿔 읽은 오류입니다.'}`
      : '음운변동 문항의 오류는 표기대로 읽은 형태가 아니라 다른 소리로 바꿔 읽은 형태입니다. 규칙 미적용보다 해독 자체의 오류일 수 있습니다.',
    REFS.rule));
  const posTotal = Object.values(d.positions).reduce((a, b) => a + b, 0);
  if (posTotal) {
    const parts = [['초성', d.positions.cho], ['중성', d.positions.jung], ['받침', d.positions.jong], ['음절 생략·삽입', d.positions.whole]].sort((x, y) => y[1] - x[1]);
    const [topName, topCount] = parts[0];
    list.push(finding('오류가 난 자리', parts.filter(([, c]) => c).map(([name, c]) => `${name} ${c}`).join(', ') + ` (총 ${posTotal})`,
      posTotal >= 3 && topCount / posTotal >= 0.5 ? `오류의 ${Math.round(topCount / posTotal * 100)}%가 ${topName}에 모여 있습니다. ${topName === '받침' ? '받침은 대표음·연음·음운변동이 일어나는 자리이므로 이 위치를 겨냥한 문항으로 추가 확인할 가치가 있습니다.' : `${topName} 처리 오류가 반복되는지 추가 문항으로 확인할 가치가 있습니다.`}`
        : '오류가 특정 자리에 몰려 있지 않거나 건수가 적어 위치 패턴을 말하기 어렵습니다.',
      `한글 음절 구조(초성·중성·종성); ${REFS.design}`));
  }
  if (d.firstWrongFinalRight) list.push(finding('자기수정', `첫 시도 오류 후 최종 정답 ${d.firstWrongFinalRight}문항`,
    '3초 안에 스스로 고친 반응은 채점 규칙상 정답입니다. 첫 시도 정확도와 최종 정확도를 함께 저장했으므로 자기 점검 행동의 빈도를 따로 볼 수 있습니다(해석 가설).', REFS.dibels));
  const lexLat = d.real.latency != null && d.nonword.latency != null ? d.nonword.latency - d.real.latency : null;
  if (lexLat != null) list.push(finding('반응 시작 시간', `중앙값 실제단어 ${seconds1(d.real.latency)} · 비단어 ${seconds1(d.nonword.latency)} (차이 ${(lexLat / 1000).toFixed(2)}초) · ${S.SCORING_CONFIG.hesitationWindowMs / 1000}초 초과 ${d.hesitations}문항`,
    '비단어를 읽기 전 준비 시간이 더 길면 글자를 하나씩 소리로 바꾸는 부담이 크다는 보조 신호일 수 있습니다. 발화 탐지값은 자동 추정이므로 탐색 지표로만 씁니다.',
    `에너지 기반 발화 탐지 Rabiner & Sambur (1975); ${REFS.design}`));
  return list;
}

function fluencyFindings(f) {
  const list = [];
  if (!f.done.length) return list;
  const attempted = f.done.reduce((sum, passage) => sum + passage.metrics.attemptedEojeol, 0);
  const correct = f.done.reduce((sum, passage) => sum + passage.metrics.correctEojeol, 0);
  list.push(finding('정확도와 속도', `어절 정확도 ${correct}/${attempted}(${f.accuracyEojeol}%, ${ciText(correct, attempted)}) · 음절 정확도 ${f.accuracySyllable}% · 분당 정확 어절 ${f.eojeolPerMin} · 분당 정확 음절 ${f.syllablesPerMin}`,
    '정확도와 속도를 따로 봅니다. 한국어 연령 규준이 없으므로 속도가 "느리다/빠르다"는 판정은 하지 않고, 같은 사람의 재검사나 지문 간 비교에만 씁니다.',
    `${REFS.cbm}; ${REFS.dibels}`));
  if (f.accuracySyllable != null && f.accuracyEojeol != null && f.accuracySyllable - f.accuracyEojeol >= 1) {
    let endErrors = 0, subs = 0;
    for (const passage of f.done) for (const [index, entry] of Object.entries(passage.final.marks || {})) {
      if (entry.mark !== 'sub' || !entry.actual) continue;
      subs++;
      const target = S.syllablesOf(passage.tokens[index]?.surface || '').join('');
      const ops = S.alignSyllables(target, S.syllablesOf(entry.actual).join('')).ops.filter(op => op.op !== 'match');
      const last = S.syllablesOf(target).length;
      if (ops.length && ops.every(op => op.position >= last)) endErrors++;
    }
    list.push(finding('어절 안의 오류 위치', `음절 정확도가 어절 정확도보다 ${(f.accuracySyllable - f.accuracyEojeol).toFixed(1)}%p 높음${subs ? ` · 실제 읽은 말이 적힌 대치 ${subs}건 중 어절 끝 음절만 다른 경우 ${endErrors}건` : ''}`,
      `어절 전체를 틀리기보다 어절 안 일부 음절에서 오류가 났다는 뜻입니다.${subs && endErrors ? ' 어절 끝 음절은 조사·어미가 오는 자리이므로 문법 형태를 바꿔 읽는 경향인지 추가 확인할 수 있습니다(해석 가설).' : ''} 그래서 한국어에서는 음절과 어절 값을 함께 봅니다.`,
      `BASA 읽기(정확히 읽은 글자 수); ${REFS.design}`));
  }
  const errors = ['대치', '생략', '도움 제공'].map(name => [name, f.events[name] || 0]).filter(([, c]) => c);
  const total = errors.reduce((sum, [, c]) => sum + c, 0);
  if (total) list.push(finding('오류 구성', errors.map(([name, c]) => `${name} ${c}`).join(', ') + `${f.events['자기수정'] ? ` · 자기수정 ${f.events['자기수정']}` : ''}${f.events['반복'] ? ` · 반복 ${f.events['반복']}` : ''}`,
    '대치·생략·도움 제공은 오답으로, 반복·삽입은 점수에 반영하지 않고 기록만, 3초 안 자기수정은 정답으로 처리했습니다. 반복과 긴 멈춤은 정확도에는 영향이 없지만 속도를 낮추므로 따로 표시했습니다.',
    REFS.dibels));
  const multi = f.done.filter(passage => passage.metrics.first60?.reachedSixty);
  if (multi.length) list.push(finding('첫 60초와 전체', multi.map(passage => `${passage.response.stimulusId}: 첫 60초 ${passage.metrics.first60.correctEojeol}어절`).join(' · '),
    '국제 검사와 비교할 수 있게 첫 60초 값을 따로 두고, 지문 끝까지의 값도 함께 저장했습니다.', REFS.dibels));
  return list;
}

function reliabilityFindings(verify) {
  const list = [];
  const describe = (label, stat, unit) => {
    if (!stat.n) return;
    const agreeHit = Math.round(stat.agreement / 100 * stat.n);
    list.push(finding(label, `${stat.n}${unit}, 일치율 ${stat.agreement}% (${ciText(agreeHit, stat.n)}), κ = ${stat.kappa} (${S.kappaLabel(stat.kappa)})`,
      stat.n < 30 ? `표본(${stat.n}${unit})이 작아 일치도의 불확실성이 큽니다. 파일럿에서 표본을 늘려 다시 추정해야 합니다.` : '우연 일치를 제외한 일치도입니다.',
      `${REFS.kappa}; Wilson (1927)`, stat.kappa != null && stat.kappa < 0.6 ? 'attention' : 'info'));
  };
  describe('자동 채점 ↔ 사람 검증 · 해독', verify.decoding, '문항');
  describe('자동 채점 ↔ 사람 검증 · 유창성 어절', verify.fluency, '어절');
  return list;
}

function findingsHtml(list, title = '분석') {
  if (!list.length) return '';
  return `<div class="analysis"><h4>${title}</h4>${list.map(item => `<div class="finding ${item.level}"><p class="finding-title">${esc(item.title)}</p><p><span class="k">관찰</span>${esc(item.observed)}</p><p><span class="k">해석</span>${esc(item.meaning)}</p><p class="basis"><span class="k">근거</span>${esc(item.basis)}</p></div>`).join('')}</div>`;
}

function overallStatement(d, f, session, scope = 'all') {
  const lines = [];
  const lex = d.real.n && d.nonword.n ? S.proportionDifference(d.real.hit, d.real.n, d.nonword.hit, d.nonword.n) : null;
  const reg = d.consistent.n && d.phonological.n ? S.proportionDifference(d.consistent.hit, d.consistent.n, d.phonological.hit, d.phonological.n) : null;
  const sure = [lex?.excludesZero && lex.diff > 0 ? '비단어 조건' : null, reg?.excludesZero && reg.diff > 0 ? '음운변동 조건' : null].filter(Boolean);
  if (d.all.n && scope !== 'fluency') lines.push(sure.length
    ? `단어 해독은 ${sure.join('과 ')}에서 정확도가 낮았고, 차이의 95% 신뢰구간이 0을 포함하지 않았습니다. 이 조건을 겨냥한 문항을 늘려 재확인할 것을 권합니다.`
    : `단어 해독 정확도는 ${d.all.pct}%(${ciText(d.all.hit, d.all.n)})이며, 현재 문항 수로는 조건 간 차이를 확정할 수 없습니다. 오류 위치와 유형은 아래 오류 프로파일과 근거 추적에서 문항 단위로 확인할 수 있습니다.`);
  if (f.done.length && scope !== 'decoding') lines.push(`읽기 유창성은 어절 정확도 ${f.accuracyEojeol}%, 분당 정확 음절 ${f.syllablesPerMin}입니다. 한국어 규준이 없어 수준 판정 대신 오류 구성과 위치를 기술합니다.`);
  if (lines.length) lines.push(`점수는 시스템이 녹음을 듣고(음성인식: ${session.sttModelLabel || '기기 안 Whisper'}) 자동으로 채점한 값입니다. 음성인식 오류의 영향은 '이 결과의 한계'를 참고하세요.`);
  return lines;
}

function metricGlossary(scope = 'all') {
  const decodingOnly = ['단어 해독 정확도', '조건별 정확도 (2×2)', '오류 위치', '반응 시작 시간'], fluencyOnly = ['어절·음절 정확도', '분당 정확 어절·음절'];
  const rows = [
    ['단어 해독 정확도', '정답 문항 / 자동 채점된 문항 (자기수정은 정답)', REFS.dibels],
    ['조건별 정확도 (2×2)', '실제단어·비단어 × 표기-발음 일치·음운변동 필요', `${REFS.lex}; ${REFS.rule}`],
    ['오류 위치', '음절 편집거리 정렬 후 대치된 음절의 초성·중성·받침 차이', 'Levenshtein (1966); 한글 음절 구조'],
    ['반응 시작 시간', '문항 제시부터 발화 시작까지(자동 추정, 탐색 지표)', 'Rabiner & Sambur (1975)'],
    ['어절·음절 정확도', '정확 어절(음절) / 시도 어절(음절), 판정 보류 제외', `${REFS.cbm}; BASA 읽기`],
    ['분당 정확 어절·음절', '정확 어절(음절) ÷ 첫 발화~끝 시간 × 60', `${REFS.cbm}; ${REFS.dibels}`],
    ['95% 신뢰구간', '비율은 Wilson 구간, 조건 차이는 Newcombe 방법 10', REFS.ci],
    ['자동 채점', '음성인식 문자열을 허용 발음·지문과 음절 단위로 정렬해 정오와 오류 위치를 판정', `${REFS.whisper}; Levenshtein (1966)`],
    ["일치율·Cohen's κ", '자동 채점과 사람 검증(연구용)의 문항·어절 판정 일치', REFS.kappa]
  ];
  const shown = rows.filter(([name]) => !(scope === 'fluency' && decodingOnly.includes(name)) && !(scope === 'decoding' && fluencyOnly.includes(name)));
  return `<div class="table-wrap"><table class="item-table"><thead><tr><th>지표</th><th>정의</th><th>근거</th></tr></thead><tbody>${shown.map(row => `<tr>${row.map(cell => `<td>${esc(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="quiet">전체 문헌 목록과 확인 수준은 docs/DESIGN_EVIDENCE_KO.md에 있습니다.</p>`;
}

// 선별에서 지정한 확인 포인트를 세부검사 결과와 나란히 놓는다. 판정은 기술적이며, 조건 차이는 신뢰구간 규칙을 따른다.
function screeningLinkRows(session, d, f) {
  const decision = session.screening?.decision;
  if (!decision?.focus) return '';
  const rows = decision.focus.map(item => {
    let detail = '–', verdict = '세부검사 미실시';
    if (item.module === 'decoding' && d.all.n) {
      if (item.key === 'consistent') { detail = `표기-발음 일치 ${d.consistent.hit}/${d.consistent.n} (${ciText(d.consistent.hit, d.consistent.n)})`; verdict = d.consistent.n - d.consistent.hit ? '오류 확인됨' : '세부검사에서는 오류 없음'; }
      if (item.key === 'nonword') { const c = compareConditions('실제', d.real, '비단어', d.nonword); detail = c ? c.observed : '–'; verdict = !c ? '–' : c.nd.excludesZero && c.nd.diff > 0 ? '확인됨' : c.nd.diff > 0 ? '방향은 같으나 차이 확정 못 함' : '확인되지 않음'; }
      if (item.key === 'phonological') { const c = compareConditions('일치', d.consistent, '음운변동', d.phonological); detail = `${c ? c.observed : `음운변동 ${d.phonological.hit}/${d.phonological.n}`} · 표기대로 읽음 ${d.spellingReads}`; verdict = c && c.nd.excludesZero && c.nd.diff > 0 ? '확인됨' : d.phonological.n - d.phonological.hit ? '오류 있음, 조건 차이는 확정 못 함' : '확인되지 않음'; }
      if (item.key === 'hesitation') { detail = `3초 초과 ${d.hesitations}문항 · 무응답 ${d.events['무응답'] || 0}`; verdict = d.hesitations || d.events['무응답'] ? '확인됨' : '확인되지 않음'; }
    }
    if (item.module === 'fluency' && f.done.length) {
      if (item.key === 'accuracy') { detail = `어절 정확도 ${f.accuracyEojeol}%`; verdict = f.accuracyEojeol < S.SCREENING_CONFIG.sentenceMinAccuracy ? '확인됨' : '세부검사 지문에서는 기준 이상'; }
      if (item.key === 'rate') { const floor = decision.measures.rateFloor; detail = `분당 정확 음절 ${f.syllablesPerMin} (임시 기준 ${floor}) · 긴 멈춤 ${f.events['긴 멈춤'] || 0} · 반복 ${f.events['반복'] || 0}`; verdict = f.syllablesPerMin < floor ? '확인됨' : '세부검사 지문에서는 기준 이상'; }
    }
    return `<tr><td><b>${esc(item.label)}</b><br><span class="quiet">${item.module === 'decoding' ? 'A 단어 해독' : 'B 유창성'}</span></td><td>${esc(item.reason)}</td><td>${esc(detail)}</td><td><b>${esc(verdict)}</b></td></tr>`;
  }).join('');
  return `<h4>선별 확인 포인트 → 세부검사 결과</h4><div class="table-wrap"><table class="item-table"><thead><tr><th>확인 포인트</th><th>선별 신호</th><th>세부검사 결과</th><th>연결</th></tr></thead><tbody>${rows || '<tr><td colspan="4" class="quiet">선별에서 지정한 확인 포인트 없음</td></tr>'}</tbody></table></div>
  <p class="quiet">선별과 세부검사 모두 음성인식 자동 채점값입니다. 두 결과가 다르면 선별 기준(임시값)을 조정할 근거 자료가 됩니다. 선별이 세부검사 결과를 얼마나 잘 찾아내는지(민감도·특이도)는 파일럿에서 검증합니다(브리핑 v1.2 10장).</p>`;
}

// ---------- 선택형 하위검사 (battery.js) ----------
const CHOICE_SCOPES = ['phonology', 'silent', 'language', 'comprehension'];
const CHOICE_REFER_PCT = 70; // 추가 확인 권고 임시 기준 (규준 없음)
const medianOf = values => { const v = values.filter(x => x != null).sort((x, y) => x - y); if (!v.length) return null; const m = Math.floor(v.length / 2); return v.length % 2 ? v[m] : Math.round((v[m - 1] + v[m]) / 2); };

function choiceItemOf(answer) {
  for (const module of Object.values(CHOICE_MODULES)) for (const section of module.sections) {
    const item = section.items.find(candidate => candidate.id === answer.itemId);
    if (item) return { item, section };
  }
  return {};
}
// 보기 수로 우연 정답률을 정한다 (2지선다 50%, 3지선다 33%, 4지선다 25%).
function chanceOf(answer) { const { item, section } = choiceItemOf(answer); return section?.format === 'binary' ? 0.5 : item?.options ? 1 / item.options.length : null; }

function choiceStats(session) {
  const answers = session.choiceAnswers || [];
  const bySubtest = {};
  for (const id of Object.keys(CHOICE_SUBTEST_TITLES)) {
    const list = answers.filter(answer => answer.subtest === id);
    if (!list.length) continue;
    const summary = S.choiceSummary(list);
    const chance = list.reduce((sum, answer) => sum + (chanceOf(answer) ?? 0), 0) / list.length;
    const ci = S.wilsonInterval(summary.correct, summary.n);
    bySubtest[id] = { ...summary, answers: list, chance: Math.round(chance * 1000) / 10, aboveChance: ci ? ci.low > chance * 100 : false };
  }
  const lex = answers.filter(answer => answer.subtest === 'B-lexical');
  const words = lex.filter(answer => answer.answer === 'word'), non = lex.filter(answer => answer.answer === 'nonword');
  const lexical = lex.length ? { ...S.dPrime({ hits: words.filter(answer => answer.response === 'word').length, signalN: words.length, falseAlarms: non.filter(answer => answer.response === 'word').length, noiseN: non.length }),
    wordRt: medianOf(words.filter(answer => answer.correct).map(answer => answer.rtMs)), nonwordRt: medianOf(non.filter(answer => answer.correct).map(answer => answer.rtMs)), timeouts: lex.filter(answer => answer.noResponse).length } : null;
  const silentInfo = session.choiceSections?.['B-silent'];
  const silent = bySubtest['B-silent'] ? { ...bySubtest['B-silent'], limit: silentInfo?.timeLimitSec, timedOut: Boolean(silentInfo?.timedOut), total: silentInfo?.items } : null;
  const modules = {};
  for (const module of CHOICE_SCOPES) { const list = answers.filter(answer => answer.module === module); if (list.length) modules[module] = S.choiceSummary(list); }
  return { answers, bySubtest, lexical, silent, modules };
}

function choiceTableHtml(c, modules) {
  const rows = modules.flatMap(module => CHOICE_MODULES[module].sections.flatMap(section => {
    const ids = [...new Set(section.items.map(item => item.subtest || section.subtest))];
    return ids;
  })).filter((id, i, list) => list.indexOf(id) === i).map(id => {
    const r = c.bySubtest[id];
    const module = Object.keys(CHOICE_MODULES).find(key => CHOICE_MODULES[key].sections.some(section => (section.subtest || '') === id || section.items.some(item => item.subtest === id)));
    if (!r) return `<tr><td>${CHOICE_MODULES[module].path}</td><td>${esc(CHOICE_SUBTEST_TITLES[id])}</td><td colspan="5">${blank}</td></tr>`;
    const types = Object.entries(r.byType).map(([type, v]) => `${type} ${v.correct}/${v.n}`).join(' · ');
    const extra = id === 'B-silent' ? `효율 점수 ${r.efficiency} (정답 ${r.correct} − 오답 ${r.incorrect}) · ${r.n}문항 시도${c.silent?.limit ? ` / ${c.silent.limit}초` : ''}` : id === 'B-lexical' && c.lexical ? `d′ ${c.lexical.dPrime} · 무응답 ${c.lexical.timeouts}` : types;
    return `<tr><td>${CHOICE_MODULES[module].path}</td><td><b>${esc(CHOICE_SUBTEST_TITLES[id])}</b></td><td>${r.correct}/${r.n}</td><td>${r.pct}% <small class="quiet">${ciText(r.correct, r.n)}</small></td><td>${r.chance}%${r.aboveChance ? '' : ' <span class="tag off">우연 수준과 구별 안 됨</span>'}</td><td>${r.medianCorrectRtMs != null ? `${(r.medianCorrectRtMs / 1000).toFixed(2)}초` : '–'}</td><td>${esc(extra)}</td></tr>`;
  }).join('');
  return `<div class="table-wrap"><table class="item-table"><thead><tr><th>경로</th><th>하위검사</th><th>정답/문항</th><th>정확도 (95% CI)</th><th>우연 정답률</th><th>정답 반응 시간(중앙값)</th><th>세부</th></tr></thead><tbody>${rows}</tbody></table></div>
  <p class="quiet">정확도는 원점수 비율이며 규준상의 위치가 아닙니다. 신뢰구간의 아래 끝이 우연 정답률보다 높지 않으면 “우연 수준과 구별 안 됨”으로 표시합니다.</p>`;
}

function choiceFindings(c, module) {
  const list = [];
  const r = id => c.bySubtest[id];
  const typeLine = id => Object.entries(r(id).byType).map(([type, v]) => `${type} ${v.correct}/${v.n}`).join(' · ');
  const wrongItems = id => r(id).answers.filter(answer => !answer.correct).map(answer => { const { item } = choiceItemOf(answer); return `${answer.subtest === 'A-letter' ? `들은 말 “${item?.audio}”` : item?.stem || item?.text || answer.itemId}${answer.noResponse ? ' (무응답)' : ` → “${answer.response}”`}`; });
  if (module === 'phonology') {
    if (r('A-phon')) list.push(finding('음운인식: 조작 수준별', typeLine('A-phon'),
      '음절 단위보다 음소 단위 조작이 어려운 것이 일반적 발달 순서입니다. 음소 탈락·대치에서만 오류가 몰리면 음소 수준 인식이 아직 불안정하다는 가설을 세울 수 있습니다(문항 수가 적어 확정 아님).', REFS.ctopp));
    if (r('A-letter')) list.push(finding('글자-소리 대응: 헷갈린 대비', wrongItems('A-letter').join(' · ') || '오류 없음',
      '보기는 평음·격음·경음, 받침, 모음의 최소대립으로 만들었습니다. 같은 대비에서 반복되는 오류는 그 소리-글자 대응을 따로 확인할 근거가 됩니다. 합성 음성의 발음이 원인일 수 있어 한계에 적었습니다.', '최소대립 설계; 표준 발음법'));
  }
  if (module === 'silent') {
    if (c.lexical) list.push(finding('단어 재인: 민감도', `실제단어를 ‘진짜’로 고른 비율 ${Math.round(c.lexical.hitRate * 100)}% · 비단어를 ‘진짜’로 잘못 고른 비율 ${Math.round(c.lexical.falseAlarmRate * 100)}% · d′ = ${c.lexical.dPrime} · 정답 반응 시간 실제단어 ${c.lexical.wordRt != null ? (c.lexical.wordRt / 1000).toFixed(2) : '–'}초, 비단어 ${c.lexical.nonwordRt != null ? (c.lexical.nonwordRt / 1000).toFixed(2) : '–'}초`,
      'd′는 “모두 진짜”처럼 한쪽으로 답하는 경향을 빼고 실제단어와 비단어를 구별하는 능력만 나타냅니다(0이면 구별 못 함). 소리 내지 않고 단어를 빠르게 알아보는 자동 재인의 지표입니다.', `${REFS.roar}; ${REFS.sdt}`));
    if (c.silent) list.push(finding('묵독 효율', `${c.silent.limit}초 동안 ${c.silent.n}문장 판단 · 정답 ${c.silent.correct} · 오답 ${c.silent.incorrect} · 효율 점수 ${c.silent.efficiency}${c.silent.timedOut ? '' : ' · 제한 시간 전에 모두 완료'}`,
      '효율 점수(정답 − 오답)는 TOSREC의 채점 방식으로, 빨리 읽으면서 이해도 하는지를 함께 봅니다. 마구 눌러 맞힌 점수를 오답으로 상쇄합니다. 한국어 규준이 없어 원점수만 보고합니다.', REFS.tosrec));
  }
  if (module === 'language') {
    for (const id of ['C-vocab', 'C-sentence', 'C-listen', 'C-morph']) if (r(id)) list.push(finding(CHOICE_SUBTEST_TITLES[id], `${typeLine(id)}${wrongItems(id).length ? ` · 틀린 문항: ${wrongItems(id).slice(0, 4).join(' / ')}` : ''}`,
      { 'C-vocab': '어휘는 기초 → 학습 → 고급 순서로 배치했습니다. 어느 수준부터 틀리는지가 어휘 지식의 범위를 보여 줍니다.', 'C-sentence': '문장은 화면에 보이지 않고 듣기만 하므로 해독과 무관한 문법 구조 이해를 봅니다. 피동·사동·관형절처럼 어순만으로 풀 수 없는 구조에서의 오류를 확인하세요.', 'C-listen': '듣기 이해는 해독 부담이 없는 언어이해 지표입니다. 글 이해(D)와 함께 보면 이해 어려움이 해독 때문인지 언어이해 때문인지 가를 수 있습니다.', 'C-morph': '같은 글자가 다른 뜻으로 쓰이는 경우(동음 형태소)를 구별하는 과제입니다. 한국어는 한자어 형태소가 많아 어휘 학습과 관련됩니다.' }[id],
      { 'C-vocab': REFS.svr, 'C-sentence': REFS.svr, 'C-listen': REFS.svr, 'C-morph': 'Carlisle (2000); 한국어 형태 인식 연구' }[id], r(id).pct < CHOICE_REFER_PCT ? 'attention' : 'info'));
  }
  if (module === 'comprehension') {
    const parts = ['D-fact', 'D-infer', 'D-eval', 'D-multi'].filter(r).map(id => `${CHOICE_SUBTEST_TITLES[id]} ${r(id).correct}/${r(id).n}`);
    if (parts.length) list.push(finding('이해 과정별 정답', parts.join(' · '),
      '사실 → 추론 → 평가 → 복수 글 통합 순서로 요구 수준이 높아집니다. 사실 문항은 맞히고 추론·평가에서 틀리면 글에 드러나지 않은 연결을 만드는 데 어려움이 있다는 가설을 세울 수 있습니다. 과정별 문항이 2~4개라 차이는 방향만 참고하세요.', `${REFS.pirls}; ${REFS.pisa}`));
  }
  return list;
}

// Simple View of Reading (Gough & Tunmer, 1986): 해독 × 언어이해 두 축으로 이해 어려움의 출처를 기술한다.
// KOLRA 해석 방식(Lee & Kim, 2020)처럼 해독과 '듣기 이해'를 교차해 유형 가능성을 말하되, 규준이 없어 판정이 아니라 가설로 제시한다.
function svrFinding(d, c) {
  const listen = c.bySubtest['C-listen'] || c.modules.language, decodingPct = d.all.n ? d.all.pct : null;
  if (!listen || decodingPct == null) return null;
  const axis = c.bySubtest['C-listen'] ? '듣기 이해' : '언어 이해(C)';
  const low = value => value < CHOICE_REFER_PCT;
  const label = low(decodingPct) && low(listen.pct) ? '해독과 언어이해 모두 낮음 (KOLRA의 혼합형에 해당하는 양상)' : low(decodingPct) ? '해독만 낮음 (KOLRA의 난독증 가능성에 해당하는 양상)' : low(listen.pct) ? '언어이해만 낮음 (KOLRA의 특정이해결함에 해당하는 양상)' : '두 축 모두 임시 기준 이상';
  return finding('읽기 단순 관점(SVR) 두 축', `해독 정확도 ${decodingPct}% · ${axis} 정확도 ${listen.pct}% → ${label}`,
    '읽기 이해는 해독과 언어이해의 곱으로 설명된다는 모형입니다. KOLRA도 해독과 듣기이해를 교차해 유형을 해석합니다. 어느 축이 약한지에 따라 지원 방향이 달라집니다(해독 중심 vs 어휘·언어 중심). 이 프로토타입은 규준이 없어 70% 임시 기준으로 양상만 기술하며 유형 진단이 아닙니다.', `${REFS.svr}; 배소영 외 (2015) KOLRA 해석 (Lee & Kim, 2020)`, label.includes('낮') ? 'attention' : 'info');
}

function choiceTraceHtml(c, module) {
  const rows = c.answers.filter(answer => answer.module === module).map(answer => {
    const { item, section } = choiceItemOf(answer);
    const label = value => section?.binary?.find(option => option.value === value)?.label.replace(/\s*[⭕❌]/u, '') ?? value;
    return `<tr><td>${esc(answer.itemId)}</td><td>${esc(CHOICE_SUBTEST_TITLES[answer.subtest] || '')}</td><td>${esc(answer.type || '')}</td><td>${esc(item?.stem || item?.text || '')}</td><td>${answer.noResponse ? '<span class="quiet">무응답</span>' : esc(label(answer.response))}</td><td>${esc(label(answer.answer))}</td><td>${answer.correct ? '정답' : '<b>오답</b>'}</td><td>${answer.rtMs != null ? `${(answer.rtMs / 1000).toFixed(2)}초` : '–'}</td></tr>`;
  }).join('');
  return `<div class="table-wrap"><table class="item-table"><thead><tr><th>문항</th><th>하위검사</th><th>유형</th><th>문항</th><th>응답</th><th>정답</th><th>정오</th><th>반응 시간</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

function choiceNextStep(c, modules) {
  const low = Object.entries(c.bySubtest).filter(([id, r]) => modules.some(module => r.answers[0]?.module === module) && r.pct < CHOICE_REFER_PCT);
  if (!low.length) return `<div class="next-step"><p><b>이번 검사 범위에서는 뚜렷한 어려움 신호가 보이지 않았습니다.</b></p><p class="quiet">그래도 어려움을 느낀다면 전문가의 대면 심층 검사를 받아 볼 수 있습니다.</p></div>`;
  return `<div class="next-step"><p><b>다음 영역은 대면 심층 검사에서 더 자세히 확인해 보기를 권합니다.</b></p><ul class="summary-list">${low.map(([id, r]) => `<li>${esc(CHOICE_SUBTEST_TITLES[id])}: 정확도 ${r.pct}% (임시 기준 ${CHOICE_REFER_PCT}% 미만)</li>`).join('')}</ul><p class="quiet">기준은 검증 전 임시값이며 진단 기준이 아닙니다.</p></div>`;
}

const CHOICE_LIMITS = ['<li><b>문항:</b> 과제 형식은 공인 검사를 따랐지만 문항은 이 연구에서 새로 만든 후보이며, 전문가 검토·예비검사(난이도·변별도)를 거치지 않았습니다. 하위검사당 문항이 4~12개로 적어 신뢰구간이 넓습니다.</li>',
  '<li><b>규준 없음:</b> 연령 규준이 없어 백분위·표준점수를 제공하지 않습니다. 추가 확인 권고 기준(70%)은 임시값입니다.</li>',
  '<li><b>우연 정답:</b> 선택형은 찍어서 맞힐 수 있습니다(2지선다 50%, 4지선다 25%). 결과표에 우연 정답률을 함께 적었습니다.</li>',
  '<li><b>합성 음성:</b> 듣기 문항은 브라우저 음성 합성으로 제시해 기기마다 목소리가 다를 수 있습니다. 표준화하려면 녹음한 음성 파일로 바꿔야 합니다.</li>',
  '<li><b>형식 차이:</b> 단어 재인은 ROAR처럼 350ms 노출을 썼지만, 묵독 효율의 데모 분량(90초)은 TOSREC(3분)보다 짧습니다. ROAR 기술 매뉴얼은 90초로 줄여도 신뢰도·타당도 변화가 매우 작다고 보고했으나 한국어에서는 확인되지 않았습니다.</li>',
  '<li><b>읽기 부담:</b> 듣기 과제(A, C)도 보기는 글자로 제시되어 보기를 읽는 능력이 일부 섞입니다. 어린 아동용은 그림 보기로 바꾸는 것이 바람직합니다.</li>',
  '<li><b>진단 아님:</b> 이 결과지는 읽기 관련 능력을 빠르게 살펴보는 자료이며 어떤 진단도 의미하지 않습니다.</li>'];

function drawChoiceReport(original, scope) {
  const session = original;
  const c = choiceStats(session);
  const info = CHOICE_MODULES[scope];
  const date = new Date(session.startedAt || session.createdAt).toLocaleDateString('ko-KR');
  const r = c.modules[scope];
  const sections = [];
  const add = (title, html, cls = '') => sections.push({ title, html, cls });
  add('검사 정보', `<div class="report-grid four"><div><small>실시 방식 · 모듈</small><b>${session.mode === 'module' ? '모듈별 검사' : '전체 흐름'} · ${esc(info.title)}</b></div><div><small>채점 방식</small><b>응답 즉시 자동 채점 (녹음 없음)</b></div><div><small>검사 분량</small><b>${session.length === 'full' ? '전체' : '데모'}</b></div><div><small>문항 버전</small><b>${esc(session.batteryVersion || BATTERY_VERSION)}</b></div></div>`);
  add('핵심 요약', r ? `<div class="overall"><p>${esc(info.title)} 전체 정답 ${r.correct}/${r.n} (${r.pct}%, ${ciText(r.correct, r.n)}).</p></div>${findingsHtml(choiceFindings(c, scope), '분석')}` : '<p class="quiet">이 기록에는 이 모듈의 응답이 없습니다.</p>');
  add('하위검사 결과', choiceTableHtml(c, [scope]));
  add('문항별 근거 추적', choiceTraceHtml(c, scope));
  add('규준 위치 *', `<div class="report-grid three"><div><small>표준점수</small><b>${blank}</b></div><div><small>백분위</small><b>${blank}</b></div><div><small>필요 지원 수준</small><b>${blank}</b></div></div><p class="quiet">대표 표본 규준과 신뢰도·타당도 자료가 없어 제공하지 않습니다.</p>`, 'muted-layer');
  add('다음 단계 안내', choiceNextStep(c, [scope]));
  add('이 결과의 한계', `<ul class="summary-list limits">${CHOICE_LIMITS.join('')}</ul>`);
  $('#report-content').innerHTML = `
  <header class="report-head">
    <div><p class="eyebrow">디지털 읽기 평가 · 경로 ${info.path} · 진단 아님</p><h2>${esc(info.title)} 결과지</h2><p class="quiet">${esc(info.sections.map(section => CHOICE_SUBTEST_TITLES[section.subtest] || section.title).join(' · '))}</p></div>
    <dl class="report-id"><div><dt>참여자</dt><dd>${esc(session.participant)}${session.demo ? ' (예시 자료)' : ''}</dd></div><div><dt>연령 구간</dt><dd>${esc(session.ageBand)}</dd></div><div><dt>검사일</dt><dd>${date}</dd></div><div><dt>상태</dt><dd>채점 완료</dd></div></dl>
  </header>
  ${session.demo ? '<p class="notice warning">이 결과지는 화면 시연용 예시 응답으로 만든 것이며 실제 참여자 자료가 아닙니다.</p>' : ''}
  ${sections.map((section, i) => `<section class="report-layer ${section.cls}"><h3><span>${i + 1}</span>${section.title}</h3>${section.html}</section>`).join('\n')}
  <section class="report-layer appendix"><h3><span>부록</span>지표 정의와 근거</h3>${choiceGlossary()}</section>`;
}

function choiceGlossary() {
  const rows = [
    ['정확도', '정답 문항 / 제시 문항 (무응답은 오답)', REFS.ci],
    ['우연 정답률', '보기 수의 역수. 신뢰구간 아래 끝이 이보다 높아야 우연과 구별', REFS.chance],
    ['정답 반응 시간', '문항 제시(듣기 문항은 소리 끝) ~ 응답, 정답 문항의 중앙값', 'ROAR·TOSREC의 효율 측정'],
    ['d′ (단어 재인)', 'z(적중률) − z(오경보율), 로그선형 보정', REFS.sdt],
    ['효율 점수 (묵독)', '제한 시간 안 정답 수 − 오답 수', REFS.tosrec],
    ['과제 형식', '음운 탈락·대치, 최소대립 글자 고르기, 어휘판단, 문장 참·거짓, 듣기·글 이해 선택형', `${REFS.ctopp}; ${REFS.roar}; ${REFS.tosrec}; ${REFS.pirls}`]
  ];
  return `<div class="table-wrap"><table class="item-table"><thead><tr><th>지표</th><th>정의</th><th>근거</th></tr></thead><tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${esc(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="quiet">전체 문헌 목록과 확인 수준은 docs/DESIGN_EVIDENCE_KO.md에 있습니다.</p>`;
}

// 결과에 따라 대면 심층 읽기검사를 권할지 안내한다. 기준은 선별과 같은 임시값이며 진단 기준이 아니다.
const DECODING_REFER_PCT = 90;
function nextStepHtml(session, d, f, showD, showF) {
  const reasons = [];
  if (showD && d.all.n && d.all.pct < DECODING_REFER_PCT) reasons.push(`단어 해독 정확도 ${d.all.pct}% (임시 기준 ${DECODING_REFER_PCT}% 미만)`);
  if (showD && d.spellingReads) reasons.push(`음운변동 낱말을 표기대로 읽음 ${d.spellingReads}문항`);
  const floor = S.SCREENING_CONFIG.sentenceMinRate[session.ageBand] ?? S.SCREENING_CONFIG.sentenceMinRate['성인'];
  if (showF && f.done.length && f.accuracyEojeol < S.SCREENING_CONFIG.sentenceMinAccuracy) reasons.push(`낭독 정확도 ${f.accuracyEojeol}% (임시 기준 ${S.SCREENING_CONFIG.sentenceMinAccuracy}% 미만)`);
  if (showF && f.done.length && f.syllablesPerMin < floor) reasons.push(`분당 정확 음절 ${f.syllablesPerMin} (${session.ageBand} 임시 기준 ${floor} 미만)`);
  const scored = (showD ? d.all.n : 0) + (showF ? f.done.length : 0);
  if (!scored) return '<p class="quiet">자동 채점이 끝나면 다음 단계를 안내합니다.</p>';
  return reasons.length
    ? `<div class="next-step"><p><b>전문가의 대면 심층 읽기검사를 받아 보기를 권합니다.</b></p><ul class="summary-list">${reasons.map(reason => `<li>${esc(reason)}</li>`).join('')}</ul><p class="quiet">이 결과지를 가져가면 검사자가 어떤 영역부터 자세히 볼지 정하는 데 도움이 됩니다. 기준은 검증 전 임시값입니다.</p></div>`
    : `<div class="next-step"><p><b>이번 검사 범위에서는 뚜렷한 어려움 신호가 보이지 않았습니다.</b></p><p class="quiet">그래도 읽기에 계속 어려움을 느낀다면 전문가의 대면 심층 읽기검사를 받아 볼 수 있습니다. 이 검사는 일부 영역만 짧게 본 것입니다.</p></div>`;
}

function drawReport(original, scope = 'all') {
  if (CHOICE_SCOPES.includes(scope)) return drawChoiceReport(original, scope);
  const session = withAuto(original);
  const showD = scope !== 'fluency', showF = scope !== 'decoding', full = scope === 'all';
  const d = decodingStats(session);
  const f = fluencyStats(session);
  const c = choiceStats(original);
  const verify = autoVerification(original);
  const scored = scoredResponses(session);
  const previewed = new Set(session.previewLog || []);
  const date = new Date(session.startedAt || session.createdAt).toLocaleDateString('ko-KR');
  const cellHtml = (lex, reg) => { const c = d.cell(lex, reg); return c.n ? `<b>${c.hit}/${c.n}</b> <span class="quiet">${c.pct}%</span><small>${ciText(c.hit, c.n)}</small>${c.total > c.n ? `<small>보류·미확정 ${c.total - c.n}</small>` : ''}` : blank; };

  const subtestResult = subtest => {
    switch (subtest.id) {
      case 'A-real': return d.real.n ? `${d.real.hit}/${d.real.n} (${d.real.pct}%)` : blank;
      case 'A-nonword': return d.nonword.n ? `${d.nonword.hit}/${d.nonword.n} (${d.nonword.pct}%)` : blank;
      case 'A-rule': return d.consistent.n || d.phonological.n ? `일치 ${d.consistent.pct ?? '–'}% · 음운변동 ${d.phonological.pct ?? '–'}%` : blank;
      case 'B-oral': return f.done.length ? `정확도 ${f.accuracyEojeol}% · 분당 정확 음절 ${f.syllablesPerMin}` : blank;
      case 'B-error': return f.done.length ? Object.entries(f.events).map(([name, count]) => `${name} ${count}`).join(', ') || '오류 없음' : blank;
      case 'B-rule': return d.phonological.n ? `음운변동 문항 오류 ${d.phonological.n - d.phonological.hit} · 표기대로 읽음 ${d.spellingReads}` : blank;
      default: {
        const r = c.bySubtest[subtest.id];
        if (!r) return blank;
        if (subtest.id === 'B-silent') return `효율 점수 ${r.efficiency} (정답 ${r.correct} − 오답 ${r.incorrect})`;
        if (subtest.id === 'B-lexical' && c.lexical) return `${r.correct}/${r.n} (${r.pct}%) · d′ ${c.lexical.dPrime}`;
        return `${r.correct}/${r.n} (${r.pct}%)`;
      }
    }
  };
  const subtestRows = PLATFORM_PATHS.flatMap(path => path.subtests.map(subtest => `<tr class="${subtest.status === 'core' ? '' : 'dim-row'}"><td>${path.id}</td><td>${esc(subtest.title)}</td><td>${esc(subtest.measure)}</td><td>${subtestResult(subtest)}</td><td>${subtest.status === 'core' ? '<span class="tag core">실시·채점</span>' : `<span class="tag ${previewed.has(subtest.id) ? 'preview' : 'off'}">${previewed.has(subtest.id) ? '화면만 진행' : '미실시'}</span>`}</td></tr>`)).join('');

  const eventBars = (events, total) => {
    const entries = Object.entries(events).sort((x, y) => y[1] - x[1]);
    if (!entries.length) return '<p class="quiet">기록된 오류 사건 없음</p>';
    const max = Math.max(...entries.map(([, count]) => count));
    return entries.map(([name, count]) => barRow(esc(name), count, { max, unit: '회', note: total ? `${Math.round(count / total * 100)}%` : '' })).join('');
  };
  const positionTotal = Object.values(d.positions).reduce((a, b) => a + b, 0);

  const itemRows = d.decoding.map(response => {
    const final = response.adjudication?.finalRating;
    const positions = (final?.errorPositions || []).flat().map(op => op.op === 'sub' ? `${op.position}음절 ${op.target}→${op.actual}` : op.op === 'del' ? `${op.position}음절 생략` : `삽입 ${op.actual}`).join(', ');
    return `<tr><td>${esc(response.stimulusId)}</td><td><b>${esc(response.target)}</b> [${esc((response.accepted || [response.expected]).join(', '))}]</td><td>${final ? `“${esc(final.transcript || '')}”` : '–'}</td><td>${final ? (final.itemScore === 'CORRECT' ? '정확' : final.itemScore === 'INCORRECT' ? '오류' : '채점 불가') : '–'}</td><td>${esc(positions || '–')}</td><td>${seconds1(response.machineAnalysis?.onsetLatencyMs)}</td><td>${response.audioKey ? '있음' : '없음'}</td><td>${adjudicationLabel(response.adjudication?.status)}</td></tr>`;
  }).join('');


  const title = scope === 'decoding' ? '단어 해독 결과지' : scope === 'fluency' ? '읽기 유창성 결과지' : '한국어 읽기평가 결과지';
  const subtitle = scope === 'all' ? 'Blueprint v1.2 결과지 구조 · 핵심 모듈(A 해독, B 유창성)만 원점수 제공' : `모듈별 결과지 · ${scope === 'decoding' ? 'A 경로 단어 해독(실제단어·비단어 × 표기 일치·음운변동)' : 'B 경로 연결글 낭독(정확도·속도·오류)'}`;
  const hasData = (showD && d.decoding.length) || (showF && f.passages.length);
  const filterLines = lines => lines.filter(line => (showD || !line.startsWith('단어 해독')) && (showF || !line.startsWith('읽기 유창성') && !line.startsWith('유창성')));
  const decodingErrors = `<div><h4>단어 해독 오류 사건</h4><div class="bars">${eventBars(d.events, d.usable.length)}</div>
        <h4>대치된 자리 (음절 안 위치)</h4><div class="bars">${positionTotal ? `${barRow('초성', d.positions.cho, { max: positionTotal, unit: '회' })}${barRow('중성', d.positions.jung, { max: positionTotal, unit: '회' })}${barRow('받침', d.positions.jong, { max: positionTotal, unit: '회' })}${barRow('음절 생략·삽입', d.positions.whole, { max: positionTotal, unit: '회' })}` : '<p class="quiet">기록된 위치 없음</p>'}</div></div>`;
  const fluencyErrors = `<div><h4>읽기 유창성 오류·사건</h4><div class="bars">${eventBars(f.events)}</div></div>`;
  const latency = `<div><h4>단어 해독 반응 시작 시간 (중앙값)</h4><div class="bars">${[['실제·일치', d.cell('real', 'consistent')], ['실제·음운변동', d.cell('real', 'phonological')], ['비단어·일치', d.cell('nonword', 'consistent')], ['비단어·음운변동', d.cell('nonword', 'phonological')]].map(([label, c]) => barRow(label, c.latency != null ? +(c.latency / 1000).toFixed(2) : null, { max: 4, unit: '초', empty: c.latency == null, emptyText: c.n ? '— 발화 미탐지' : '— 확정 문항 없음' })).join('')}</div><p class="quiet">머뭇거림 창(${S.SCORING_CONFIG.hesitationWindowMs / 1000}초) 초과 ${d.hesitations}문항. 탐색 지표이며 해석 기준은 아직 없습니다.</p></div>`;
  const fluencyTable = `<div><h4>읽기 유창성 정확도와 속도</h4><div class="table-wrap"><table class="item-table"><thead><tr><th>지문</th><th>낭독</th><th>정확도</th><th>분당 정확 어절</th><th>분당 정확 음절</th><th>첫 60초</th><th>긴 멈춤</th></tr></thead><tbody>${f.passages.map(passage => passage.final ? `<tr><td>${esc(passage.response.stimulusId)}</td><td>${passage.metrics.readingSeconds}초</td><td>${passage.metrics.accuracyEojeol}%</td><td>${passage.metrics.correctEojeolPerMin}</td><td>${passage.metrics.correctSyllablesPerMin}</td><td>${passage.metrics.first60.correctEojeol}어절</td><td>${passage.pauses}회</td></tr>` : `<tr><td>${esc(passage.response.stimulusId)}</td><td colspan="6" class="quiet">${adjudicationLabel(passage.response.adjudication?.status)}</td></tr>`).join('')}</tbody></table></div></div>`;
  const fluencyRows = f.passages.map(passage => `<tr><td>${esc(passage.response.stimulusId)}</td><td>${esc(passage.response.kind || '')}</td><td>${passage.final ? `${passage.metrics.correctEojeol}/${passage.metrics.attemptedEojeol}어절` : '–'}</td><td>${passage.final ? Object.entries(passage.metrics.events).map(([k, v]) => `${k} ${v}`).join(', ') || '오류 없음' : '–'}</td><td>${passage.response.audioKey ? '있음' : '없음'}</td><td>${adjudicationLabel(passage.response.adjudication?.status)}</td></tr>`).join('');
  const verifyRows = `${showD ? agreementRow('자동 채점 ↔ 사람 검증 · 해독 정오', verify.decoding, '문항') : ''}${showF ? agreementRow('자동 채점 ↔ 사람 검증 · 유창성 어절 정오', verify.fluency, '어절') : ''}`;
  const hasVerify = (showD && verify.decoding.n) || (showF && verify.fluency.n);
  const reliabilityScoped = reliabilityFindings(verify).filter(item => (showD || !item.title.includes('해독')) && (showF || !item.title.includes('유창성')));
  const dFind = decodingFindings(d), fFind = fluencyFindings(f);

  const sections = [];
  const add = (title, html, cls = '') => sections.push({ title, html, cls });
  add('검사 품질과 기본 정보', `
    <div class="report-grid four"><div><small>실시 방식 · 모듈</small><b>${session.mode === 'module' ? '모듈별 검사' : '전체 흐름'} · ${session.modules.map(moduleName).join(', ') || '–'}</b></div><div><small>채점 방식</small><b>자동 채점 · ${esc(session.sttModelLabel || '음성인식')}</b></div><div><small>채점 반영 / 전체 (무효 음성)</small><b>${(showD ? d.usable.length : 0) + (showF ? f.done.length : 0)} / ${(showD ? d.decoding.length : 0) + (showF ? f.passages.length : 0)} (${d.invalid.length + (showF ? f.passages.filter(p => p.response.adjudication?.status === 'INVALID_AUDIO').length : 0)})</b></div><div><small>장치 점검</small><b>${esc(session.deviceCheck?.quality?.flags?.join(', ') || (session.demo ? '예시 자료' : '기록 없음'))}</b></div></div>
    ${full && session.screening?.decision ? `<h4>선별 결과와 경로</h4>${screeningSummaryHtml(session.screening)}${session.routing && (session.routing.added.length || session.routing.removed.length) ? `<p class="notice">추천 경로 조정: 추가 ${esc(session.routing.added.join(', ') || '없음')} · 제외 ${esc(session.routing.removed.join(', ') || '없음')}</p>` : ''}` : ''}
    <p class="quiet">버전: 문항 ${esc(session.formVersion)} · 채점 ${esc(S.AUTO_SCORING_VERSION)} · 발음 목록 ${esc(session.pronunciationDictVersion || '–')} · 음성인식 ${esc(session.sttModelVersion || 'not-run')} · 설정 ${esc(S.SCORING_CONFIG.version)}${showD ? ` · 문항 순서 ${session.orderPolicy === 'random' ? '무작위' : '고정'}` : ''}${full ? ` · 선별 규칙 ${esc(session.screening?.decision?.ruleVersion || '–')}` : ''}</p>`);
  add('핵심 요약', `
    <div class="overall">${overallStatement(d, f, session, scope).map(line => `<p>${esc(line)}</p>`).join('') || '<p>자동 채점된 응답이 아직 없습니다.</p>'}</div>
    <ul class="summary-list">${filterLines(summarySentences(d, f)).map(line => `<li>${esc(line)}</li>`).join('')}</ul>
    ${full ? screeningLinkRows(session, d, f) : ''}
    <p class="quiet">${full ? '강점·상대적 취약 영역 판단은 영역별 신뢰도와 규준이 확보된 뒤 제공합니다. 현재는 두 핵심 모듈 안의 조건 비교만 기술합니다. 추가 확인이 필요한 영역: 글자·소리(음운인식, 자모), 언어 이해, 글 이해 (미실시).' : '이 결과지는 한 모듈의 원점수와 오류 근거만 보여 줍니다. 다른 영역의 수행은 평가하지 않았습니다.'}</p>`);
  const mod = key => c.modules[key];
  if (full) add('5영역 프로파일', `
    <div class="bars">${barRow('글자·소리', mod('phonology')?.pct, { note: mod('phonology') ? `${mod('phonology').correct}/${mod('phonology').n}문항` : '' })}${barRow('해독', d.all.pct, { note: d.all.n ? `${d.all.hit}/${d.all.n}문항` : '' })}${barRow('유창성', f.accuracyEojeol, { note: f.done.length ? `낭독 어절 정확도 · 분당 ${f.eojeolPerMin}어절` : (c.silent ? `묵독 효율 ${c.silent.efficiency}` : '') })}${barRow('언어 이해', mod('language')?.pct, { note: mod('language') ? `${mod('language').correct}/${mod('language').n}문항` : '' })}${barRow('글 이해', mod('comprehension')?.pct, { note: mod('comprehension') ? `${mod('comprehension').correct}/${mod('comprehension').n}문항` : '' })}</div>
    <p class="quiet">막대는 원점수 정확도(%)이며 연령 규준상의 위치가 아닙니다. 공란은 이번 검사에서 실시하지 않은 영역입니다.</p>`);
  if (showD) add(full ? '하위검사 결과' : '조건별 결과 (2×2)', `
    <div class="table-wrap"><table class="grid-2x2"><thead><tr><th>단어 해독</th><th>표기-발음 일치</th><th>음운변동 필요</th></tr></thead><tbody><tr><th>실제단어</th><td>${cellHtml('real', 'consistent')}</td><td>${cellHtml('real', 'phonological')}</td></tr><tr><th>비단어</th><td>${cellHtml('nonword', 'consistent')}</td><td>${cellHtml('nonword', 'phonological')}</td></tr></tbody></table></div>
    ${full ? `<div class="table-wrap spaced"><table class="item-table"><thead><tr><th>경로</th><th>하위검사</th><th>측정</th><th>원점수</th><th>실시</th></tr></thead><tbody>${subtestRows}</tbody></table></div>` : ''}
    ${findingsHtml(dFind.slice(0, 3), '분석 · 단어 해독 조건 비교')}`);
  else if (full) add('하위검사 결과', `<div class="table-wrap"><table class="item-table"><thead><tr><th>경로</th><th>하위검사</th><th>측정</th><th>원점수</th><th>실시</th></tr></thead><tbody>${subtestRows}</tbody></table></div>`);
  const choiceModules = CHOICE_SCOPES.filter(module => c.modules[module]);
  if (full && choiceModules.length) {
    const svr = svrFinding(d, c);
    add('선택형 하위검사 결과 (녹음 없음)', `${choiceTableHtml(c, choiceModules)}${findingsHtml([...choiceModules.flatMap(module => choiceFindings(c, module)), ...(svr ? [svr] : [])], '분석 · 선택형 하위검사')}`);
  }
  add('오류 프로파일', `
    <div class="report-grid ${showD && showF ? 'two' : 'one'}">${showD ? decodingErrors : ''}${showF ? fluencyErrors : ''}</div>
    ${showF ? f.done.map(passage => `<h4>오류 지도 · ${esc(passage.response.stimulusId)} ${esc(passage.response.kind)}</h4><div class="passage-map static">${passageMapHtml(passage.tokens, { marks: passage.final.marks || {}, lastIndex: passage.final.lastIndex, sixtyIndex: passage.final.sixtyIndex }, { interactive: false })}</div>`).join('') : ''}
    ${showF ? '<p class="quiet">범례: 노란 물결 밑줄 대치(작은 글씨는 실제로 읽은 말) · 빨간 취소선 생략 · 보라 도움 제공 · 회색 판정 보류 · R 반복 · SC 자기수정 · 오른쪽 파란 선 삽입 · 왼쪽 점선 긴 멈춤</p>' : ''}
    ${findingsHtml([...(showD ? dFind.filter(item => ['오류가 난 자리', '자기수정'].includes(item.title)) : []), ...(showF ? fFind.filter(item => ['어절 안의 오류 위치', '오류 구성'].includes(item.title)) : [])], '분석 · 오류 양상')}`);
  add('수행 효율', `
    <div class="report-grid ${showD && showF ? 'two' : 'one'}">${showD ? latency : ''}${showF ? fluencyTable : ''}</div>
    ${findingsHtml([...(showD ? dFind.filter(item => item.title === '반응 시작 시간') : []), ...(showF ? fFind.filter(item => ['정확도와 속도', '첫 60초와 전체'].includes(item.title)) : [])], '분석 · 수행 효율')}`);
  add('근거 추적', `
    <p class="quiet">모든 점수는 문항 → 음성인식 결과 → 오류 위치 → 원음성으로 거꾸로 따라갈 수 있습니다. 원음성은 연구용 검증 화면에서 재생·내려받기 할 수 있습니다.</p>
    ${showD ? `<div class="table-wrap"><table class="item-table"><thead><tr><th>문항</th><th>표기 [허용 발음]</th><th>음성인식</th><th>판정</th><th>오류 위치</th><th>반응 시작</th><th>원음성</th><th>상태</th></tr></thead><tbody>${itemRows}</tbody></table></div>` : ''}
    ${showF ? `<div class="table-wrap spaced"><table class="item-table"><thead><tr><th>지문</th><th>종류</th><th>정확 어절</th><th>기록된 사건</th><th>원음성</th><th>상태</th></tr></thead><tbody>${fluencyRows}</tbody></table></div>` : ''}
    <h4>자동 채점 검증</h4>${hasVerify ? `<div class="table-wrap"><table class="item-table"><thead><tr><th>비교</th><th>표본</th><th>일치율</th><th>Cohen's κ</th></tr></thead><tbody>${verifyRows}</tbody></table></div>${findingsHtml(reliabilityScoped, '분석 · 자동 채점 정확도')}` : '<p class="quiet">이 기록에는 사람 검증 자료가 없습니다. 자동 채점의 정확도는 연구 단계에서 일부 녹음을 전문가가 채점해 일치율·κ로 따로 검증합니다(연구용 검증 화면).</p>'}`);
  add('규준 위치 *', `
    <div class="report-grid three"><div><small>표준점수</small><b>${blank}</b></div><div><small>백분위</small><b>${blank}</b></div><div><small>필요 지원 수준</small><b>${blank}</b></div></div>
    <p class="quiet">대표 표본 규준과 신뢰도·타당도 자료가 없어 제공하지 않습니다.</p>`, 'muted-layer');
  if (full) add('변화 추적 *', `<p>${blank}</p><p class="quiet">동형 검사 또는 공통 척도와 측정의 표준오차(SEM)가 확보된 뒤 재검사 변화를 보고합니다.</p>`, 'muted-layer');
  add('다음 단계 안내', `${nextStepHtml(session, d, f, showD, showF)}${full && choiceModules.length ? choiceNextStep(c, choiceModules) : ''}`);
  add('이 결과의 한계', `
    <ul class="summary-list limits">
      <li><b>음성인식 정확도:</b> 점수는 ${esc(session.sttModelLabel || '기기 안 Whisper')} 음성인식 결과로 자동 채점했습니다. 음성인식은 비단어를 비슷한 실제 단어로 바꿔 듣거나, 아동 음성·사투리·잡음에서 틀릴 수 있어 실제보다 오류가 많거나 적게 잡힐 수 있습니다. 이는 측정 도구의 한계이며, 자동 채점과 전문가 채점의 일치도는 파일럿에서 따로 검증합니다(${REFS.asr}).</li>
      <li><b>진단 아님:</b> 이 결과지는 읽기 능력을 디지털로 빠르게 살펴보는 자료이며 난독증 등 어떤 진단도 의미하지 않습니다.</li>
      <li><b>규준 없음:</b> 한국어 연령 규준이 없어 백분위·표준점수를 제공하지 않습니다. 기준값은 모두 임시값입니다.</li>
      <li><b>문항:</b> 문항과 지문은 기능 시험용 후보이며 난이도·동형성${showD ? '·비단어 적절성' : ''}이 검증되지 않았습니다.${session.length === 'demo' ? ' 이번 검사는 데모 분량(문항 수 축소)이라 결과의 불확실성이 더 큽니다.' : ''}</li>
      <li><b>시간 지표:</b> 반응 시작 시간과 낭독 구간은 에너지 기반 발화 탐지로 추정했습니다. 잡음이 크면 구간이 어긋날 수 있습니다.</li>
      ${full ? '<li><b>미실시 영역:</b> 글자·소리 일부, 언어 이해, 글 이해는 평가하지 않았으므로 결과가 없다는 것이 수행에 문제가 없다는 뜻은 아닙니다.</li>' : ''}
      <li><b>조건 비교:</b> 95% 신뢰구간이 0을 포함하지 않을 때만 "차이가 있다"고 적었습니다. 문항 수가 적어 대부분의 차이는 방향만 참고해야 합니다.</li>
    </ul>`);

  $('#report-content').innerHTML = `
  <header class="report-head">
    <div><p class="eyebrow">디지털 읽기 평가 · 자동 채점 · 진단 아님</p><h2>${title}</h2><p class="quiet">${subtitle}</p></div>
    <dl class="report-id"><div><dt>참여자</dt><dd>${esc(session.participant)}${session.demo ? ' (예시 자료)' : ''}</dd></div><div><dt>연령 구간</dt><dd>${esc(session.ageBand)}</dd></div><div><dt>검사일</dt><dd>${date}</dd></div><div><dt>상태</dt><dd>${esc(({ SCORED: '자동 채점 완료', ANALYZING: '분석 중', IN_PROGRESS: '검사 중', INTERRUPTED: '중단됨' })[session.status] || session.status)}</dd></div></dl>
  </header>
  ${session.demo ? '<p class="notice warning">이 결과지는 화면 시연용 예시 채점값으로 만든 것이며 실제 참여자 자료가 아닙니다.</p>' : ''}
  ${session.pendingCount ? `<p class="notice warning"><b>분석 전 응답 ${session.pendingCount}개:</b> 아직 자동 채점하지 않은 녹음이 있습니다. <button class="secondary compact-button" id="report-run-auto" type="button">지금 자동 채점</button> <span id="report-auto-status" class="quiet"></span></p>` : ''}
  ${showF && f.done.some(passage => passage.metrics.correctSyllablesPerMin > 600) ? '<p class="notice warning"><b>시간 확인 필요:</b> 분당 600음절(초당 10음절)을 넘는 지문이 있습니다. 사람이 소리 내어 읽기 어려운 속도이므로 발화 구간 탐지가 어긋났을 수 있습니다(이 결과의 한계 참고).</p>' : ''}
  ${!hasData ? `<p class="notice">이 기록에는 ${esc(title.replace(' 결과지', ''))} 응답이 없습니다. 위에서 다른 범위를 고르세요.</p>` : ''}
  ${sections.map((section, i) => `<section class="report-layer ${section.cls}"><h3><span>${i + 1}</span>${section.title}</h3>${section.html}</section>`).join('\n')}
  <section class="report-layer appendix"><h3><span>부록</span>지표 정의와 근거</h3>${metricGlossary(scope)}</section>`;
  if ($('#report-run-auto')) $('#report-run-auto').onclick = async () => {
    const button = $('#report-run-auto'), status = $('#report-auto-status');
    button.disabled = true;
    try {
      await autoScoreSession(original, (i, n, message) => { status.textContent = `${i + 1} / ${n}${message ? ` · ${message}` : ''}`; });
      drawReport(original, scope);
    } catch (error) { status.textContent = `실패: ${error.message || error}`; button.disabled = false; }
  };
}
