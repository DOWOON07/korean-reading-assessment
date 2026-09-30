// 전문 결과지: 교수님 브리핑 Blueprint v1.2 8장의 10개 층 구조를 따른다.
// 단어 해독(A)과 읽기 유창성(B)만 실제 원점수로 채우고, 나머지 영역은 '미실시' 공란으로 둔다.
// 규준·진단 문구는 만들지 않는다 (설계도 v0.2 1장 "금지하는 주장").

function report() {
  const list = sessions().filter(session => scoredResponses(session).length);
  const select = $('#report-session-select');
  if (!list.length) { $('#report-empty').classList.remove('hidden'); return; }
  select.innerHTML = list.map(session => `<option value="${session.id}">${esc(session.participant)}${session.demo ? ' (예시)' : ''} · ${new Date(session.createdAt).toLocaleDateString('ko-KR')}</option>`).join('');
  const preferred = sessionStorage.getItem('readingResultSession');
  if (preferred && list.some(session => session.id === preferred)) select.value = preferred;
  const draw = () => { sessionStorage.setItem('readingResultSession', select.value); drawReport(list.find(session => session.id === select.value) || list[0]); };
  select.onchange = draw;
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
function barRow(label, value, { max = 100, unit = '%', note = '', empty = false } = {}) {
  if (empty || value == null) return `<div class="bar-row bar-empty"><span class="bar-label">${label}</span><div class="bar-track"></div><span class="bar-value">${blank}</span></div>`;
  const width = Math.max(0, Math.min(100, value / max * 100));
  return `<div class="bar-row" title="${esc(`${label}: ${value}${unit}${note ? ` · ${note}` : ''}`)}"><span class="bar-label">${label}</span><div class="bar-track"><span class="bar-fill" style="width:${width}%"></span></div><span class="bar-value">${value}${unit}${note ? `<small>${esc(note)}</small>` : ''}</span></div>`;
}

function decodingStats(session) {
  const decoding = scoredResponses(session).filter(response => response.module === 'decoding');
  const usable = decoding.filter(response => ['AGREE', 'CONSENSUS'].includes(response.adjudication?.status) && response.adjudication.finalRating);
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
    pending: decoding.filter(response => !response.adjudication || ['UNPAIRED', 'NEEDS_CONSENSUS'].includes(response.adjudication.status))
  };
}

function fluencyStats(session) {
  const fluency = scoredResponses(session).filter(response => response.module === 'fluency');
  const passages = fluency.map(response => {
    const final = ['AGREE', 'CONSENSUS'].includes(response.adjudication?.status) ? response.adjudication.finalRating : null;
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
    lines.push(`단어 해독: 확정된 ${d.all.n}문항 중 ${d.all.hit}문항을 정확히 읽었습니다(${d.all.pct}%).`);
    if (d.consistent.n && d.phonological.n) {
      const gap = d.consistent.pct - d.phonological.pct;
      lines.push(`표기대로 소리 나는 조건 ${d.consistent.pct}%, 음운변동이 필요한 조건 ${d.phonological.pct}%로 ${Math.abs(gap) >= 20 ? `음운변동 조건에서 ${gap > 0 ? '정확도가 낮았습니다' : '정확도가 오히려 높았습니다'}(차이 ${Math.abs(gap)}%p).` : '두 조건의 차이는 크지 않았습니다.'}`);
    }
    if (d.real.n && d.nonword.n) lines.push(`실제단어 ${d.real.pct}%, 비단어 ${d.nonword.pct}%${d.real.pct - d.nonword.pct >= 20 ? '로, 처음 보는 글자열에서 정확도가 낮았습니다.' : '입니다.'}`);
    if (d.spellingReads) lines.push(`음운변동 문항 중 ${d.spellingReads}문항을 표기대로 읽었습니다(규칙 미적용 오류).`);
    if (d.firstWrongFinalRight) lines.push(`${d.firstWrongFinalRight}문항은 첫 시도 오류 후 자기수정으로 최종 정답이었습니다.`);
  } else lines.push('단어 해독: 두 채점자가 확정한 문항이 아직 없습니다.');
  if (f.done.length) {
    lines.push(`읽기 유창성: 지문 ${f.done.length}개, 총 ${f.seconds}초 낭독. 정확도 어절 ${f.accuracyEojeol}% · 음절 ${f.accuracySyllable}%, 분당 정확 어절 ${f.eojeolPerMin} · 음절 ${f.syllablesPerMin}.`);
    const top = Object.entries(f.events).sort((x, y) => y[1] - x[1]).slice(0, 3).map(([name, count]) => `${name} ${count}`).join(', ');
    if (top) lines.push(`유창성에서 기록된 주요 사건: ${top}.`);
  } else lines.push('읽기 유창성: 두 채점자가 확정한 지문이 아직 없습니다.');
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
  design: '설계도 v0.2 (팀 설계, 검증 대상)'
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
    '비단어를 읽기 전 준비 시간이 더 길면 글자를 하나씩 소리로 바꾸는 부담이 크다는 보조 신호일 수 있습니다. 발화 탐지값은 사람이 확인하지 않은 자동 추정이므로 탐색 지표로만 씁니다.',
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

function reliabilityFindings(agreement) {
  const list = [];
  const describe = (label, stat, unit) => {
    if (!stat.n) return;
    const agreeHit = Math.round(stat.agreement / 100 * stat.n);
    list.push(finding(label, `${stat.n}${unit}, 일치율 ${stat.agreement}% (${ciText(agreeHit, stat.n)}), κ = ${stat.kappa} (${S.kappaLabel(stat.kappa)})`,
      stat.n < 30 ? `표본(${stat.n}${unit})이 작아 κ와 일치율의 불확실성이 큽니다. 파일럿에서 표본을 늘려 다시 추정해야 합니다.` : '우연 일치를 제외한 일치도입니다.',
      `${REFS.kappa}; Wilson (1927)`, stat.kappa != null && stat.kappa < 0.6 ? 'attention' : 'info'));
  };
  describe('채점자 A↔B · 해독', agreement.raterDecoding, '문항');
  describe('채점자 A↔B · 유창성 어절', agreement.raterFluency, '어절');
  describe('AI 후보↔사람 · 해독', agreement.aiDecoding, '문항');
  describe('AI 후보↔사람 · 유창성 어절', agreement.aiFluency, '어절');
  if (agreement.aiDecoding.n || agreement.aiFluency.n) list.push(finding('자동 채점의 위치', 'AI 결과는 후보 칸에만 표시되고 점수에는 사람이 확정한 값만 들어갑니다.',
    '선행 연구에서 자동 읽기평가와 사람 채점의 일치도는 과제에 따라 중간 수준이었으므로(단어 해독 MCC 0.43, 글 읽기 0.55) 사람 확정을 유지합니다.', REFS.asr));
  return list;
}

function findingsHtml(list, title = '분석') {
  if (!list.length) return '';
  return `<div class="analysis"><h4>${title}</h4>${list.map(item => `<div class="finding ${item.level}"><p class="finding-title">${esc(item.title)}</p><p><span class="k">관찰</span>${esc(item.observed)}</p><p><span class="k">해석</span>${esc(item.meaning)}</p><p class="basis"><span class="k">근거</span>${esc(item.basis)}</p></div>`).join('')}</div>`;
}

function overallStatement(d, f, agreement) {
  const lines = [];
  const lex = d.real.n && d.nonword.n ? S.proportionDifference(d.real.hit, d.real.n, d.nonword.hit, d.nonword.n) : null;
  const reg = d.consistent.n && d.phonological.n ? S.proportionDifference(d.consistent.hit, d.consistent.n, d.phonological.hit, d.phonological.n) : null;
  const sure = [lex?.excludesZero && lex.diff > 0 ? '비단어 조건' : null, reg?.excludesZero && reg.diff > 0 ? '음운변동 조건' : null].filter(Boolean);
  if (d.all.n) lines.push(sure.length
    ? `단어 해독은 ${sure.join('과 ')}에서 정확도가 낮았고, 차이의 95% 신뢰구간이 0을 포함하지 않았습니다. 이 조건을 겨냥한 문항을 늘려 재확인할 것을 권합니다.`
    : `단어 해독 정확도는 ${d.all.pct}%(${ciText(d.all.hit, d.all.n)})이며, 현재 문항 수로는 조건 간 차이를 확정할 수 없습니다. 오류 위치와 유형은 아래 5층에서 문항 단위로 확인할 수 있습니다.`);
  if (f.done.length) lines.push(`읽기 유창성은 어절 정확도 ${f.accuracyEojeol}%, 분당 정확 음절 ${f.syllablesPerMin}입니다. 한국어 규준이 없어 수준 판정 대신 오류 구성과 위치를 기술합니다.`);
  const rel = [agreement.raterDecoding, agreement.raterFluency].filter(stat => stat.n);
  if (rel.length) lines.push(`점수는 두 채점자의 독립 채점에서 일치 또는 합의한 값만 썼으며, 채점자 간 κ는 ${rel.map(stat => stat.kappa).join(' / ')}입니다.`);
  return lines;
}

function metricGlossary() {
  const rows = [
    ['단어 해독 정확도', '확정 정답 문항 / 확정 문항 (자기수정은 정답)', REFS.dibels],
    ['조건별 정확도 (2×2)', '실제단어·비단어 × 표기-발음 일치·음운변동 필요', `${REFS.lex}; ${REFS.rule}`],
    ['오류 위치', '음절 편집거리 정렬 후 대치된 음절의 초성·중성·받침 차이', 'Levenshtein (1966); 한글 음절 구조'],
    ['반응 시작 시간', '문항 제시부터 발화 시작까지(자동 추정, 탐색 지표)', 'Rabiner & Sambur (1975)'],
    ['어절·음절 정확도', '정확 어절(음절) / 시도 어절(음절), 판정 보류 제외', `${REFS.cbm}; BASA 읽기`],
    ['분당 정확 어절·음절', '정확 어절(음절) ÷ 첫 발화~끝 시간 × 60', `${REFS.cbm}; ${REFS.dibels}`],
    ['95% 신뢰구간', '비율은 Wilson 구간, 조건 차이는 Newcombe 방법 10', REFS.ci],
    ["일치율·Cohen's κ", '두 채점자(또는 AI↔사람)의 문항·어절 판정 일치', REFS.kappa]
  ];
  return `<div class="table-wrap"><table class="item-table"><thead><tr><th>지표</th><th>정의</th><th>근거</th></tr></thead><tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${esc(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="quiet">전체 문헌 목록과 확인 수준은 docs/DESIGN_EVIDENCE_KO.md에 있습니다.</p>`;
}

function drawReport(session) {
  const d = decodingStats(session);
  const f = fluencyStats(session);
  const agreement = agreementSummary(session);
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
      default: return blank;
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

  const agreementRows = `${agreementRow('채점 A ↔ B · 해독 최종 판정', agreement.raterDecoding, '문항')}${agreementRow('채점 A ↔ B · 유창성 어절 정오', agreement.raterFluency, '어절')}${agreementRow('AI 후보 ↔ 사람 확정 · 해독', agreement.aiDecoding, '문항')}${agreementRow('AI 후보 ↔ 사람 확정 · 유창성 어절', agreement.aiFluency, '어절')}`;

  $('#report-content').innerHTML = `
  <header class="report-head">
    <div><p class="eyebrow">연구용 읽기 프로파일 · 진단 아님</p><h2>한국어 읽기평가 결과지</h2><p class="quiet">Blueprint v1.2 결과지 구조 · 핵심 모듈(A 해독, B 유창성)만 원점수 제공</p></div>
    <dl class="report-id"><div><dt>참여자</dt><dd>${esc(session.participant)}${session.demo ? ' (예시 자료)' : ''}</dd></div><div><dt>연령 구간</dt><dd>${esc(session.ageBand)}</dd></div><div><dt>검사일</dt><dd>${date}</dd></div><div><dt>상태</dt><dd>${esc(session.status)}</dd></div></dl>
  </header>
  ${session.demo ? '<p class="notice warning">이 결과지는 화면 시연용 예시 채점값으로 만든 것이며 실제 참여자 자료가 아닙니다.</p>' : ''}

  <section class="report-layer"><h3><span>1</span>검사 품질과 기본 정보</h3>
    <div class="report-grid four"><div><small>실시 모듈</small><b>${session.modules.map(moduleName).join(', ')}</b></div><div><small>채점 확정 / 전체</small><b>${d.usable.length + f.done.length} / ${scored.length}</b></div><div><small>전문가 보류 · 무효 음성</small><b>${d.expert.length} · ${d.invalid.length}</b></div><div><small>장치 점검</small><b>${esc(session.deviceCheck?.quality?.flags?.join(', ') || (session.demo ? '예시 자료' : '기록 없음'))}</b></div></div>
    <p class="quiet">버전: 문항 ${esc(session.formVersion)} · 채점 ${esc(session.ratingVersion)} · 발음 목록 ${esc(session.pronunciationDictVersion || '–')} · 음성인식 ${esc(session.sttModelVersion || 'not-run')} · 설정 ${esc(S.SCORING_CONFIG.version)} · 문항 순서 ${session.orderPolicy === 'random' ? '무작위' : '고정'}</p>
  </section>

  <section class="report-layer"><h3><span>2</span>핵심 요약</h3>
    <div class="overall">${overallStatement(d, f, agreement).map(line => `<p>${esc(line)}</p>`).join('')}</div>
    <ul class="summary-list">${summarySentences(d, f).map(line => `<li>${esc(line)}</li>`).join('')}</ul>
    <p class="quiet">강점·상대적 취약 영역 판단은 영역별 신뢰도와 규준이 확보된 뒤 제공합니다. 현재는 두 핵심 모듈 안의 조건 비교만 기술합니다. 추가 확인이 필요한 영역: 글자·소리(음운인식, 자모), 언어 이해, 글 이해 (미실시).</p>
  </section>

  <section class="report-layer"><h3><span>3</span>5영역 프로파일</h3>
    <div class="bars">${barRow('글자·소리', null, { empty: true })}${barRow('해독', d.all.pct, { note: d.all.n ? `${d.all.hit}/${d.all.n}문항` : '' })}${barRow('유창성', f.accuracyEojeol, { note: f.done.length ? `어절 정확도 · 분당 ${f.eojeolPerMin}어절` : '' })}${barRow('언어 이해', null, { empty: true })}${barRow('글 이해', null, { empty: true })}</div>
    <p class="quiet">막대는 원점수 정확도(%)이며 연령 규준상의 위치가 아닙니다. 공란은 이번 검사에서 실시하지 않은 영역입니다.</p>
  </section>

  <section class="report-layer"><h3><span>4</span>하위검사 결과</h3>
    <div class="table-wrap"><table class="grid-2x2"><thead><tr><th>단어 해독</th><th>표기-발음 일치</th><th>음운변동 필요</th></tr></thead><tbody><tr><th>실제단어</th><td>${cellHtml('real', 'consistent')}</td><td>${cellHtml('real', 'phonological')}</td></tr><tr><th>비단어</th><td>${cellHtml('nonword', 'consistent')}</td><td>${cellHtml('nonword', 'phonological')}</td></tr></tbody></table></div>
    <div class="table-wrap spaced"><table class="item-table"><thead><tr><th>경로</th><th>하위검사</th><th>측정</th><th>원점수</th><th>실시</th></tr></thead><tbody>${subtestRows}</tbody></table></div>
    ${findingsHtml(decodingFindings(d).slice(0, 3), '분석 · 단어 해독 조건 비교')}
  </section>

  <section class="report-layer"><h3><span>5</span>오류 프로파일</h3>
    <div class="report-grid two">
      <div><h4>단어 해독 오류 사건</h4><div class="bars">${eventBars(d.events, d.usable.length)}</div>
        <h4>대치된 자리 (음절 안 위치)</h4><div class="bars">${positionTotal ? `${barRow('초성', d.positions.cho, { max: positionTotal, unit: '회' })}${barRow('중성', d.positions.jung, { max: positionTotal, unit: '회' })}${barRow('받침', d.positions.jong, { max: positionTotal, unit: '회' })}${barRow('음절 생략·삽입', d.positions.whole, { max: positionTotal, unit: '회' })}` : '<p class="quiet">기록된 위치 없음</p>'}</div></div>
      <div><h4>읽기 유창성 오류·사건</h4><div class="bars">${eventBars(f.events)}</div></div>
    </div>
    ${f.done.map(passage => `<h4>오류 지도 · ${esc(passage.response.stimulusId)} ${esc(passage.response.kind)}</h4><div class="passage-map static">${passageMapHtml(passage.tokens, { marks: passage.final.marks || {}, lastIndex: passage.final.lastIndex, sixtyIndex: passage.final.sixtyIndex }, { interactive: false })}</div>`).join('')}
    <p class="quiet">범례: 노란 물결 밑줄 대치(작은 글씨는 실제로 읽은 말) · 빨간 취소선 생략 · 보라 도움 제공 · 회색 판정 보류 · R 반복 · SC 자기수정 · 오른쪽 파란 선 삽입 · 왼쪽 점선 긴 멈춤</p>
    ${findingsHtml([...decodingFindings(d).filter(item => ['오류가 난 자리', '자기수정'].includes(item.title)), ...fluencyFindings(f).filter(item => ['어절 안의 오류 위치', '오류 구성'].includes(item.title))], '분석 · 오류 양상')}
  </section>

  <section class="report-layer"><h3><span>6</span>수행 효율</h3>
    <div class="report-grid two">
      <div><h4>단어 해독 반응 시작 시간 (중앙값)</h4><div class="bars">${[['실제·일치', d.cell('real', 'consistent')], ['실제·음운변동', d.cell('real', 'phonological')], ['비단어·일치', d.cell('nonword', 'consistent')], ['비단어·음운변동', d.cell('nonword', 'phonological')]].map(([label, c]) => barRow(label, c.latency != null ? +(c.latency / 1000).toFixed(2) : null, { max: 4, unit: '초', empty: c.latency == null })).join('')}</div><p class="quiet">머뭇거림 창(${S.SCORING_CONFIG.hesitationWindowMs / 1000}초) 초과 ${d.hesitations}문항. 탐색 지표이며 해석 기준은 아직 없습니다.</p></div>
      <div><h4>읽기 유창성 정확도와 속도</h4><div class="table-wrap"><table class="item-table"><thead><tr><th>지문</th><th>낭독</th><th>정확도</th><th>분당 정확 어절</th><th>분당 정확 음절</th><th>첫 60초</th><th>긴 멈춤</th></tr></thead><tbody>${f.passages.map(passage => passage.final ? `<tr><td>${esc(passage.response.stimulusId)}</td><td>${passage.metrics.readingSeconds}초</td><td>${passage.metrics.accuracyEojeol}%</td><td>${passage.metrics.correctEojeolPerMin}</td><td>${passage.metrics.correctSyllablesPerMin}</td><td>${passage.metrics.first60.correctEojeol}어절</td><td>${passage.pauses}회</td></tr>` : `<tr><td>${esc(passage.response.stimulusId)}</td><td colspan="6" class="quiet">${adjudicationLabel(passage.response.adjudication?.status)}</td></tr>`).join('')}</tbody></table></div></div>
    </div>
    ${findingsHtml([...decodingFindings(d).filter(item => item.title === '반응 시작 시간'), ...fluencyFindings(f).filter(item => ['정확도와 속도', '첫 60초와 전체'].includes(item.title))], '분석 · 수행 효율')}
  </section>

  <section class="report-layer"><h3><span>7</span>근거 추적</h3>
    <p class="quiet">모든 점수는 문항 → 전사 → 오류 위치 → 원음성 → 채점 상태로 거꾸로 따라갈 수 있습니다. 원음성은 검토 화면에서 재생·내려받기 할 수 있습니다.</p>
    <div class="table-wrap"><table class="item-table"><thead><tr><th>문항</th><th>표기 [허용 발음]</th><th>확정 전사</th><th>판정</th><th>오류 위치</th><th>반응 시작</th><th>원음성</th><th>상태</th></tr></thead><tbody>${itemRows}</tbody></table></div>
    <h4>채점 신뢰도</h4><div class="table-wrap"><table class="item-table"><thead><tr><th>비교</th><th>표본</th><th>일치율</th><th>Cohen's κ</th></tr></thead><tbody>${agreementRows}</tbody></table></div>
    ${findingsHtml(reliabilityFindings(agreement), '분석 · 채점 신뢰도')}
  </section>

  <section class="report-layer muted-layer"><h3><span>8</span>규준 위치 *</h3>
    <div class="report-grid three"><div><small>표준점수</small><b>${blank}</b></div><div><small>백분위</small><b>${blank}</b></div><div><small>필요 지원 수준</small><b>${blank}</b></div></div>
    <p class="quiet">대표 표본 규준과 신뢰도·타당도 자료가 없어 제공하지 않습니다.</p>
  </section>

  <section class="report-layer muted-layer"><h3><span>9</span>변화 추적 *</h3>
    <p>${blank}</p><p class="quiet">동형 검사 또는 공통 척도와 측정의 표준오차(SEM)가 확보된 뒤 재검사 변화를 보고합니다.</p>
  </section>

  <section class="report-layer"><h3><span>10</span>해석 주의</h3>
    <ul class="summary-list">
      <li>이 결과지는 연구용 원점수이며 난독증 등 어떤 진단도 의미하지 않습니다.</li>
      <li>문항과 지문은 기능 시험용 후보이며 난이도·동형성·비단어 적절성이 검증되지 않았습니다.</li>
      <li>점수는 두 채점자가 독립 채점 후 일치(AGREE)하거나 합의(CONSENSUS)한 값만 사용하며, 전문가 보류(EXPERT_PENDING)와 무효 음성은 제외했습니다.</li>
      <li>음절 정렬·발화 탐지·음성인식은 오류 후보를 만드는 보조 계산이며 최종 판정은 사람이 했습니다.</li>
      <li>미실시 영역(글자·소리 일부, 언어 이해, 글 이해)은 평가하지 않았으므로 결과가 없다는 것이 수행에 문제가 없다는 뜻은 아닙니다.</li>
      <li>조건 비교는 95% 신뢰구간이 0을 포함하지 않을 때만 "차이가 있다"고 적었습니다. 문항 수가 적어 대부분의 차이는 방향만 참고해야 합니다.</li>
    </ul>
  </section>

  <section class="report-layer appendix"><h3><span>부록</span>지표 정의와 근거</h3>${metricGlossary()}</section>`;
}
