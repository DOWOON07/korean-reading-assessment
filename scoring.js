// 채점 보조 계산: 브라우저(window.Scoring)와 Node 테스트(require/import)에서 함께 사용한다.
// 여기의 값은 모두 "후보"를 만드는 공학 계산이며 최종 점수는 사람이 확정한다.
(function (global) {
  const SCORING_CONFIG = {
    version: 'scoring-config-0.3',
    // DIBELS 운영 규칙에서 가져온 초기값. 한국어 전 연령 검증값이 아니므로 설정으로만 둔다.
    selfCorrectionWindowMs: 3000,
    hesitationWindowMs: 3000,
    // 발화 탐지(에너지 기반) 초기값
    vad: { frameMs: 20, minSpeechFrames: 4, noisePercentile: 0.1, noiseMultiplier: 3.5, absoluteFloor: 0.008 },
    longPauseMs: 800,
    // 두 채점자의 시각 입력을 같은 값으로 보는 허용 오차
    timingToleranceMs: 250,
    fluencyWindowMs: 60000
  };

  const CHO = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
  const JUNG = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'];
  const JONG = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

  const isHangulSyllable = char => /[가-힣]/.test(char);
  const syllablesOf = text => [...String(text || '')].filter(isHangulSyllable);
  const countSyllables = text => syllablesOf(text).length;

  function decompose(syllable) {
    const code = syllable.charCodeAt(0) - 0xac00;
    if (code < 0 || code > 11171) return null;
    return { cho: CHO[Math.floor(code / 588)], jung: JUNG[Math.floor((code % 588) / 28)], jong: JONG[code % 28] };
  }

  function jamoDiff(target, actual) {
    const a = decompose(target), b = decompose(actual);
    if (!a || !b) return [];
    return [['cho', '초성'], ['jung', '중성'], ['jong', '받침']]
      .filter(([key]) => a[key] !== b[key])
      .map(([key, label]) => ({ part: key, label, from: a[key] || '없음', to: b[key] || '없음' }));
  }

  // 음절 단위 편집거리 정렬. 대치·생략·삽입이 목표 글자열의 몇 번째 음절에서 일어났는지 돌려준다.
  function alignSyllables(targetText, actualText) {
    const t = syllablesOf(targetText), a = syllablesOf(actualText);
    const d = Array.from({ length: t.length + 1 }, () => new Array(a.length + 1).fill(0));
    for (let i = 0; i <= t.length; i++) d[i][0] = i;
    for (let j = 0; j <= a.length; j++) d[0][j] = j;
    for (let i = 1; i <= t.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (t[i - 1] === a[j - 1] ? 0 : 1));
      }
    }
    const ops = [];
    let i = t.length, j = a.length;
    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && d[i][j] === d[i - 1][j - 1] + (t[i - 1] === a[j - 1] ? 0 : 1)) {
        const same = t[i - 1] === a[j - 1];
        ops.unshift({ op: same ? 'match' : 'sub', position: i, target: t[i - 1], actual: a[j - 1], jamo: same ? [] : jamoDiff(t[i - 1], a[j - 1]) });
        i--; j--;
      } else if (i > 0 && d[i][j] === d[i - 1][j] + 1) {
        ops.unshift({ op: 'del', position: i, target: t[i - 1], actual: '', jamo: [] });
        i--;
      } else {
        ops.unshift({ op: 'ins', position: i, target: '', actual: a[j - 1], jamo: [] });
        j--;
      }
    }
    return { distance: d[t.length][a.length], ops };
  }

  // 전사 규약: "/" 뒤는 다시 읽은 시도(자기수정), "-" 또는 공백은 음절을 나누어 읽음.
  // 예) "꼳닙/꼰닙" = 첫 시도 꼳닙, 최종 시도 꼰닙
  function parseTranscript(transcript) {
    const raw = String(transcript || '').trim();
    const attempts = raw.split('/').map(part => part.trim()).filter(Boolean);
    return {
      raw,
      attempts: attempts.map(part => ({ raw: part, segmented: /[-\s]/.test(part), syllables: syllablesOf(part).join('') })),
      noResponse: !raw || /^(무응답|\(무응답\)|x)$/i.test(raw)
    };
  }

  function bestMatch(accepted, orthography, spoken) {
    const candidates = [...new Set([...(accepted || []), orthography].filter(Boolean))];
    return candidates
      .map(form => ({ form, isAccepted: (accepted || []).includes(form), ...alignSyllables(form, spoken) }))
      .sort((x, y) => x.distance - y.distance || Number(y.isAccepted) - Number(x.isAccepted))[0] || null;
  }

  function hasRepetition(spoken, targetLength) {
    const s = syllablesOf(spoken);
    for (let size = 1; size <= Math.max(1, targetLength); size++) {
      for (let i = 0; i + size * 2 <= s.length; i++) {
        if (s.slice(i, i + size).join('') === s.slice(i + size, i + size * 2).join('')) return true;
      }
    }
    return false;
  }

  // 단어 해독 한 문항의 오류 후보. 사람이 확인하기 전까지는 제안일 뿐이다.
  function decodingCandidate(item, transcript) {
    const accepted = item.accepted?.length ? item.accepted : (item.expected ? [item.expected] : []);
    const parsed = parseTranscript(transcript);
    if (parsed.noResponse) return { status: 'NO_RESPONSE', suggestion: { itemScore: 'INCORRECT', firstAttemptCorrect: 'INCORRECT', finalAttemptCorrect: 'INCORRECT', events: ['무응답'] }, notes: ['무응답 후보'] };
    const orthography = syllablesOf(item.text).join('');
    const judge = attempt => {
      // 허용 발음이 있으면 허용 발음 기준으로 오류 위치를 찾고, 없으면 표기와 비교한다.
      const match = bestMatch(accepted, accepted.length ? null : item.text, attempt.syllables);
      const correct = Boolean(match && match.isAccepted && match.distance === 0);
      const spellingRead = !correct && attempt.syllables === orthography && !accepted.includes(orthography);
      return { ...attempt, match, correct, spellingRead };
    };
    const judged = parsed.attempts.map(judge);
    const first = judged[0], final = judged[judged.length - 1];
    const events = new Set();
    const notes = [];
    const targetLength = syllablesOf(item.text).length;
    for (const attempt of judged) {
      if (attempt.correct || !attempt.match) continue;
      const ops = attempt.match.ops;
      if (ops.some(op => op.op === 'sub')) events.add('대치');
      if (ops.some(op => op.op === 'del')) events.add('생략');
      if (ops.some(op => op.op === 'ins')) events.add('삽입');
      const sortedTarget = [...syllablesOf(attempt.match.form)].sort().join('');
      if (attempt.syllables !== attempt.match.form && [...attempt.syllables].sort().join('') === sortedTarget) {
        events.add('순서 바꿈'); events.delete('대치');
      }
      if (attempt.spellingRead) notes.push(`“${attempt.raw}”: 표기대로 읽음. 음운변동(${item.rule || '규칙'}) 미적용 후보`);
    }
    if (judged.some(attempt => hasRepetition(attempt.syllables, targetLength)) && !judged.every(attempt => attempt.correct)) events.add('반복');
    if (judged.length > 1) events.add('자기수정');
    if (judged.some(attempt => attempt.segmented)) {
      events.add('분절 후 합성');
      if (!final.correct) notes.push('나누어 읽은 뒤 올바르게 합치지 못한 후보');
    }
    if (!accepted.length) notes.push('허용 발음 미확정: 자동 후보는 표기와 비교한 참고값');
    return {
      status: 'CANDIDATE',
      attempts: judged.map(({ raw, syllables, correct, match, segmented, spellingRead }) => ({ raw, syllables, correct, segmented, spellingRead, form: match?.form, distance: match?.distance, ops: match?.ops || [] })),
      suggestion: {
        itemScore: final.correct ? 'CORRECT' : 'INCORRECT',
        firstAttemptCorrect: first.correct ? 'CORRECT' : 'INCORRECT',
        finalAttemptCorrect: final.correct ? 'CORRECT' : 'INCORRECT',
        events: [...events]
      },
      notes
    };
  }

  // ---------- 읽기 유창성 ----------
  function tokenizePassage(text) {
    return String(text || '').split(/\s+/).filter(Boolean).map((surface, index) => ({ index, surface, syllables: countSyllables(surface) }));
  }

  const FLUENCY_MARKS = {
    correct: { label: '정확', error: false },
    sub: { label: '대치', error: true },
    omit: { label: '생략', error: true },
    help: { label: '도움 제공', error: true },
    unclear: { label: '판정 보류', error: false, excluded: true }
  };
  const FLUENCY_FLAGS = { selfcorrect: '자기수정', repeat: '반복', insertAfter: '삽입', pauseBefore: '긴 멈춤', lineSkip: '행 건너뜀', interrupt: '외부 방해' };

  // marks: { [index]: { mark, flags: [] } }, lastIndex: 마지막으로 시도한 어절, sixtyIndex: 60초 시점에 읽고 있던 어절
  function computeFluency({ tokens, marks = {}, lastIndex = null, sixtyIndex = null, onsetMs = 0, endMs = 0 }) {
    const last = lastIndex == null ? tokens.length - 1 : Math.min(lastIndex, tokens.length - 1);
    const seconds = Math.max(0, (Number(endMs) - Number(onsetMs)) / 1000);
    const within = upTo => {
      const acc = { attemptedEojeol: 0, correctEojeol: 0, attemptedSyllables: 0, correctSyllables: 0, errors: 0, excluded: 0 };
      for (const token of tokens.slice(0, upTo + 1)) {
        const mark = FLUENCY_MARKS[marks[token.index]?.mark || 'correct'] || FLUENCY_MARKS.correct;
        if (mark.excluded) { acc.excluded++; continue; }
        acc.attemptedEojeol++; acc.attemptedSyllables += token.syllables;
        if (mark.error) {
          acc.errors++;
          // 대치에서 실제로 읽은 말을 적으면 음절 정렬로 맞게 읽은 음절만 인정한다.
          const actual = marks[token.index]?.actual;
          if (marks[token.index]?.mark === 'sub' && actual) acc.correctSyllables += syllableMatches(token.surface, actual);
        } else { acc.correctEojeol++; acc.correctSyllables += token.syllables; }
      }
      return acc;
    };
    const total = within(last);
    const reachedSixty = seconds * 1000 > SCORING_CONFIG.fluencyWindowMs;
    const first60 = reachedSixty && sixtyIndex != null ? within(Math.min(sixtyIndex, last)) : total;
    const events = {};
    for (const token of tokens.slice(0, last + 1)) {
      const entry = marks[token.index];
      if (!entry) continue;
      if (entry.mark && entry.mark !== 'correct') events[FLUENCY_MARKS[entry.mark].label] = (events[FLUENCY_MARKS[entry.mark].label] || 0) + 1;
      for (const flag of entry.flags || []) events[FLUENCY_FLAGS[flag]] = (events[FLUENCY_FLAGS[flag]] || 0) + 1;
    }
    const round = (value, digits = 1) => Number.isFinite(value) ? +value.toFixed(digits) : null;
    return {
      readingSeconds: round(seconds, 2),
      completed: last === tokens.length - 1,
      ...total,
      accuracyEojeol: total.attemptedEojeol ? round(total.correctEojeol / total.attemptedEojeol * 100) : null,
      accuracySyllable: total.attemptedSyllables ? round(total.correctSyllables / total.attemptedSyllables * 100) : null,
      correctEojeolPerMin: seconds ? round(total.correctEojeol / seconds * 60) : null,
      correctSyllablesPerMin: seconds ? round(total.correctSyllables / seconds * 60) : null,
      first60: { reachedSixty, correctEojeol: first60.correctEojeol, correctSyllables: first60.correctSyllables, attemptedEojeol: first60.attemptedEojeol, errors: first60.errors },
      events,
      configVersion: SCORING_CONFIG.version
    };
  }

  function syllableMatches(target, actual) {
    return alignSyllables(target, actual).ops.filter(op => op.op === 'match').length;
  }

  // ---------- 시각이 있는 관찰 사건 ----------
  const ERROR_EVENT_TYPES = ['첫 오류', '오류', '대치', '생략', '삽입', '순서 바꿈'];
  // timedEvents: [{ type, timeMs }]. 오류 뒤 자기수정까지 걸린 시간을 설정 창과 비교한다.
  function selfCorrectionCheck(timedEvents = [], windowMs = SCORING_CONFIG.selfCorrectionWindowMs) {
    const sorted = [...timedEvents].sort((a, b) => a.timeMs - b.timeMs);
    const pairs = [];
    sorted.forEach((event, index) => {
      if (event.type !== '자기수정') return;
      const error = sorted.slice(0, index).reverse().find(item => ERROR_EVENT_TYPES.includes(item.type));
      if (!error) return pairs.push({ errorMs: null, correctionMs: event.timeMs, gapMs: null, withinWindow: null });
      const gapMs = event.timeMs - error.timeMs;
      pairs.push({ errorMs: error.timeMs, correctionMs: event.timeMs, gapMs, withinWindow: gapMs <= windowMs });
    });
    return { windowMs, pairs };
  }

  function hesitationCheck(onsetLatencyMs, windowMs = SCORING_CONFIG.hesitationWindowMs) {
    if (onsetLatencyMs == null) return null;
    return { onsetLatencyMs, windowMs, exceeded: onsetLatencyMs > windowMs };
  }

  // ---------- 음성인식(ASR) 결과 후처리 ----------
  // 설계도 3.3: 문항에서 가능한 발음만 포함한 제한된 후보 안에서 가장 가까운 것을 고른다.
  // ASR 원문은 그대로 보존하고, 후보와의 거리를 함께 돌려 사람이 판단하게 한다.
  function constrainedDecodingChoice(asrText, item) {
    const heard = syllablesOf(asrText).join('');
    const accepted = item.accepted?.length ? item.accepted : [item.expected].filter(Boolean);
    const orthography = syllablesOf(item.text).join('');
    const candidates = [
      ...accepted.map(form => ({ form, label: '허용 발음' })),
      ...(accepted.includes(orthography) ? [] : [{ form: orthography, label: '표기대로 읽음' }])
    ];
    if (!heard) return { heard, nearest: null, candidates, confident: false, note: '음성인식 결과 없음' };
    const scored = candidates.map(candidate => ({ ...candidate, distance: alignSyllables(candidate.form, heard).distance }))
      .sort((x, y) => x.distance - y.distance);
    const best = scored[0];
    const second = scored[1];
    const confident = best.distance === 0 && (!second || second.distance > 0);
    return {
      heard, nearest: best, candidates: scored, confident,
      note: best.distance === 0 ? `ASR 결과가 ${best.label}과 같음` : `후보와 ${best.distance}음절 차이: 사람이 원음성으로 확인 필요`
    };
  }

  const normalizeWord = text => syllablesOf(text).join('');

  // 유창성: ASR 단어열(시각 포함)을 지문 어절열에 동적계획법으로 맞춘다.
  // 결과는 어절별 후보(일치/대치/생략)와 시각, 그리고 지문에 없는 삽입 후보.
  function alignWordsToPassage(tokens, asrWords, options = {}) {
    // 어긋남 비용(0.75)을 전면 대치 비용(1)보다 작게 두어, 말을 끼워 넣거나 빠뜨린 경우를 연쇄 대치로 잘못 맞추지 않게 한다.
    const gap = options.gapCost ?? 0.75;
    const t = tokens.map(token => normalizeWord(token.surface));
    const w = asrWords.map(word => ({ ...word, norm: normalizeWord(word.text) })).filter(word => word.norm);
    const cost = (a, b) => {
      const d = alignSyllables(a, b).distance;
      return d / Math.max(a.length, b.length, 1);
    };
    const n = t.length, m = w.length;
    const D = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
    const B = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(''));
    for (let i = 1; i <= n; i++) { D[i][0] = i * gap; B[i][0] = 'del'; }
    for (let j = 1; j <= m; j++) { D[0][j] = j * gap; B[0][j] = 'ins'; }
    for (let i = 1; i <= n; i++) {
      for (let j = 1; j <= m; j++) {
        const diag = D[i - 1][j - 1] + cost(t[i - 1], w[j - 1].norm);
        const del = D[i - 1][j] + gap;
        const ins = D[i][j - 1] + gap;
        const best = Math.min(diag, del, ins);
        D[i][j] = best;
        B[i][j] = best === diag ? 'diag' : best === del ? 'del' : 'ins';
      }
    }
    const perToken = new Array(n).fill(null);
    const insertions = [];
    let i = n, j = m;
    while (i > 0 || j > 0) {
      const move = B[i][j];
      if (move === 'diag') {
        const word = w[j - 1];
        const c = cost(t[i - 1], word.norm);
        perToken[i - 1] = { index: i - 1, status: c === 0 ? 'match' : 'sub', heard: word.text.trim(), startMs: word.startMs ?? null, endMs: word.endMs ?? null, cost: +c.toFixed(2) };
        i--; j--;
      } else if (move === 'del') {
        perToken[i - 1] = { index: i - 1, status: 'omit', heard: '', startMs: null, endMs: null, cost: 1 };
        i--;
      } else {
        insertions.unshift({ afterIndex: i - 1, heard: w[j - 1].text.trim(), startMs: w[j - 1].startMs ?? null });
        j--;
      }
    }
    // 뒤쪽 생략이 이어지면 "읽지 않은 부분" 후보로 본다 (지문 미완료).
    let lastRead = n - 1;
    while (lastRead >= 0 && perToken[lastRead].status === 'omit') lastRead--;
    return { tokens: perToken, insertions, lastReadIndex: lastRead, matched: perToken.filter(x => x.status === 'match').length };
  }

  // ---------- 일치도 ----------
  // Cohen (1960) 카파: 두 평정자의 범주 판정 일치도에서 우연 일치를 뺀 값.
  function cohensKappa(pairs) {
    const valid = pairs.filter(([a, b]) => a != null && b != null && a !== '' && b !== '');
    const n = valid.length;
    if (!n) return { n: 0, agreement: null, kappa: null };
    const categories = [...new Set(valid.flat())];
    const observed = valid.filter(([a, b]) => a === b).length / n;
    const expected = categories.reduce((sum, category) => {
      const pa = valid.filter(([a]) => a === category).length / n;
      const pb = valid.filter(([, b]) => b === category).length / n;
      return sum + pa * pb;
    }, 0);
    const kappa = expected === 1 ? (observed === 1 ? 1 : 0) : (observed - expected) / (1 - expected);
    return { n, agreement: +(observed * 100).toFixed(1), expected: +(expected * 100).toFixed(1), kappa: +kappa.toFixed(3) };
  }

  // Landis & Koch (1977)의 해석 구간. 참고용 표기이며 합격 기준이 아니다.
  function kappaLabel(kappa) {
    if (kappa == null) return '–';
    if (kappa < 0) return '우연보다 낮음';
    if (kappa <= 0.2) return '약간';
    if (kappa <= 0.4) return '어느 정도';
    if (kappa <= 0.6) return '중간';
    if (kappa <= 0.8) return '상당';
    return '거의 완전';
  }

  // 녹음 길이 비율로 어절 위치의 시각을 추정한다 (정렬 모델이 붙기 전 임시값).
  function estimateTokenTimes(tokens, onsetMs, endMs) {
    const totalSyllables = tokens.reduce((sum, token) => sum + Math.max(1, token.syllables), 0) || 1;
    const span = Math.max(0, endMs - onsetMs);
    let cursor = 0;
    return tokens.map(token => {
      const start = onsetMs + span * cursor / totalSyllables;
      cursor += Math.max(1, token.syllables);
      return { index: token.index, startMs: Math.round(start), endMs: Math.round(onsetMs + span * cursor / totalSyllables) };
    });
  }

  function tokenAtTime(tokens, onsetMs, endMs, timeMs) {
    const times = estimateTokenTimes(tokens, onsetMs, endMs);
    const hit = times.find(time => timeMs >= time.startMs && timeMs < time.endMs);
    return hit ? hit.index : (timeMs < onsetMs ? 0 : tokens.length - 1);
  }

  // ---------- 발화 탐지 ----------
  function detectSpeech(samples, sampleRate, options = {}) {
    const cfg = { ...SCORING_CONFIG.vad, ...options };
    const frameSize = Math.max(1, Math.round(sampleRate * cfg.frameMs / 1000));
    const energies = [];
    for (let start = 0; start + frameSize <= samples.length; start += frameSize) {
      let sum = 0;
      for (let k = start; k < start + frameSize; k++) sum += samples[k] * samples[k];
      energies.push(Math.sqrt(sum / frameSize));
    }
    if (!energies.length) return { onsetMs: null, offsetMs: null, pauses: [], threshold: null };
    const sorted = [...energies].sort((x, y) => x - y);
    const noise = sorted[Math.floor(sorted.length * cfg.noisePercentile)];
    const threshold = Math.max(cfg.absoluteFloor, noise * cfg.noiseMultiplier);
    const voiced = energies.map(value => value >= threshold);
    const runs = [];
    let runStart = null;
    voiced.forEach((flag, index) => {
      if (flag && runStart == null) runStart = index;
      if ((!flag || index === voiced.length - 1) && runStart != null) {
        const end = flag ? index + 1 : index;
        if (end - runStart >= cfg.minSpeechFrames) runs.push([runStart, end]);
        runStart = null;
      }
    });
    if (!runs.length) return { onsetMs: null, offsetMs: null, pauses: [], threshold: +threshold.toFixed(4) };
    const toMs = frames => Math.round(frames * cfg.frameMs);
    const pauses = [];
    for (let r = 1; r < runs.length; r++) {
      const gap = toMs(runs[r][0] - runs[r - 1][1]);
      if (gap >= (options.longPauseMs ?? SCORING_CONFIG.longPauseMs)) pauses.push({ startMs: toMs(runs[r - 1][1]), endMs: toMs(runs[r][0]), durationMs: gap });
    }
    return { onsetMs: toMs(runs[0][0]), offsetMs: toMs(runs[runs.length - 1][1]), pauses, threshold: +threshold.toFixed(4) };
  }

  function waveformPeaks(samples, buckets = 600) {
    const size = Math.max(1, Math.floor(samples.length / buckets));
    const peaks = [];
    for (let b = 0; b < buckets && b * size < samples.length; b++) {
      let peak = 0;
      for (let k = b * size; k < Math.min(samples.length, (b + 1) * size); k++) peak = Math.max(peak, Math.abs(samples[k]));
      peaks.push(peak);
    }
    return peaks;
  }

  // ---------- 두 채점자 비교 ----------
  function comparableRating(module, rating) {
    if (!rating) return null;
    const common = { itemScore: rating.itemScore, events: [...(rating.events || [])].sort() };
    if (module === 'decoding') return { ...common, firstAttemptCorrect: rating.firstAttemptCorrect || '', finalAttemptCorrect: rating.finalAttemptCorrect || '' };
    const marks = Object.entries(rating.marks || {})
      .filter(([, entry]) => (entry.mark && entry.mark !== 'correct') || entry.flags?.length)
      .map(([index, entry]) => `${index}:${entry.mark || 'correct'}:${[...(entry.flags || [])].sort().join('+')}`).sort();
    return { itemScore: rating.itemScore, marks, lastIndex: rating.lastIndex ?? null, sixtyIndex: rating.sixtyIndex ?? null };
  }

  function ratingsAgree(module, a, b) {
    if (!a || !b) return false;
    if (JSON.stringify(comparableRating(module, a)) !== JSON.stringify(comparableRating(module, b))) return false;
    if (module === 'fluency') {
      const close = (x, y) => x == null || y == null ? x === y : Math.abs(x - y) <= SCORING_CONFIG.timingToleranceMs;
      return close(a.onsetMs, b.onsetMs) && close(a.speechEndMs, b.speechEndMs);
    }
    return true;
  }



  // ---------- 선별 → 모듈과 확인 포인트 추천 ----------
  // 브리핑 v1.2 2장의 선별 중 두 핵심 축(기초 해독 → A, 유창성 → B)만 실시한다.
  // 선별은 "어느 모듈을 실시할지"와 "그 모듈에서 무엇을 중점 확인할지"를 정한다. 진단이 아니다.
  // 기준값은 파일럿 전 임시값이다. 선별은 놓치는 것(위음성)이 더 위험하므로 경계에서는 포함하는 쪽으로 정했다.
  const SCREENING_CONFIG = {
    version: 'screening-rule-0.2-provisional',
    wordMinAccuracy: 100,          // 선별 단어 하나라도 틀리면 A(단어 해독 세부검사)
    sentenceMinAccuracy: 95,       // 문장 낭독 어절 정확도 95% 미만이면 A와 B 모두
    sentenceMinRate: { 아동: 120, 청소년: 200, 성인: 250 } // 분당 정확 음절. 임시값, 연령 규준 아님
  };

  function screeningDecision({ words = [], sentence = null, ageBand = '성인' } = {}, config = SCREENING_CONFIG) {
    const pct = (hit, n) => n ? Math.round(hit / n * 1000) / 10 : null;
    const cell = filter => { const list = words.filter(filter); const hit = list.filter(word => word.correct).length; return { n: list.length, hit, errors: list.length - hit, pct: pct(hit, list.length) }; };
    const all = cell(() => true);
    const real = cell(word => word.lexicality === 'real'), nonword = cell(word => word.lexicality === 'nonword');
    const consistent = cell(word => word.regularity === 'consistent'), phonological = cell(word => word.regularity === 'phonological');
    const spellingReads = words.filter(word => word.spellingRead).length;
    const noResponses = words.filter(word => word.noResponse).length;
    let sentenceAcc = null, sentenceRate = null;
    if (sentence && sentence.attemptedEojeol) {
      sentenceAcc = pct(sentence.correctEojeol, sentence.attemptedEojeol);
      sentenceRate = sentence.seconds > 0 ? Math.round(sentence.correctSyllables / sentence.seconds * 60 * 10) / 10 : null;
    }
    const rateFloor = config.sentenceMinRate[ageBand] ?? config.sentenceMinRate['성인'];
    const accurate = sentenceAcc == null || sentenceAcc >= config.sentenceMinAccuracy;
    const slow = sentenceRate != null && sentenceRate < rateFloor;

    const flags = { A: [], B: [] };
    const focus = [];
    if (all.pct != null && all.pct < config.wordMinAccuracy) flags.A.push(`선별 단어 ${all.hit}/${all.n} 정확`);
    if (!accurate) { flags.A.push(`문장 낭독 정확도 ${sentenceAcc}%`); flags.B.push(`문장 낭독 정확도 ${sentenceAcc}%`); }
    if (slow) flags.B.push(`${accurate ? '정확하지만 느림' : '부정확하고 느림'}: 분당 정확 음절 ${sentenceRate} (임시 기준 ${rateFloor})`);

    // 단어 해독에서 중점 확인할 것 (2×2 조건별)
    if (consistent.errors) focus.push({ module: 'decoding', key: 'consistent', label: '기초 글자-소리 대응', reason: `표기대로 소리 나는 낱말 오류 ${consistent.errors}/${consistent.n}`, check: '표기-발음 일치 조건 정확도와 초성·중성·받침 오류 위치' });
    if (nonword.errors && nonword.errors / nonword.n > (real.n ? real.errors / real.n : 0)) focus.push({ module: 'decoding', key: 'nonword', label: '비단어 해독(어휘 도움 없는 해독)', reason: `비단어 오류 ${nonword.errors}/${nonword.n} · 실제단어 오류 ${real.errors}/${real.n}`, check: '실제단어 대비 비단어 정확도 차이와 반응 시작 시간' });
    if (phonological.errors) focus.push({ module: 'decoding', key: 'phonological', label: '음운변동 규칙 적용', reason: `음운변동 낱말 오류 ${phonological.errors}/${phonological.n}${spellingReads ? ` (표기대로 읽음 ${spellingReads})` : ''}`, check: '음운변동 조건 정확도, 표기대로 읽은 오류 수, 규칙별 오류' });
    if (noResponses) focus.push({ module: 'decoding', key: 'hesitation', label: '머뭇거림·무응답', reason: `무응답 ${noResponses}`, check: '반응 시작 시간과 3초 초과 문항' });
    // 유창성에서 중점 확인할 것
    if (!accurate) focus.push({ module: 'fluency', key: 'accuracy', label: '낭독 정확도', reason: `어절 정확도 ${sentenceAcc}%`, check: '대치·생략·도움 제공의 위치와 어절 안 오류 음절' });
    if (slow) focus.push({ module: 'fluency', key: 'rate', label: accurate ? '속도(정확하지만 느림)' : '속도', reason: `분당 정확 음절 ${sentenceRate}`, check: '분당 정확 음절, 긴 멈춤·반복·자기수정 빈도' });

    const paths = Object.keys(flags).filter(key => flags[key].length);
    return {
      ruleVersion: config.version, ageBand,
      measures: { wordAccuracy: all.pct, wordHit: all.hit, wordN: all.n, cells: { real, nonword, consistent, phonological }, spellingReads, noResponses, sentenceAccuracy: sentenceAcc, sentenceRate, rateFloor },
      flags, focus, paths,
      modules: [paths.includes('A') ? 'decoding' : null, paths.includes('B') ? 'fluency' : null].filter(Boolean)
    };
  }

  // ---------- 음성인식 기반 자동 채점 ----------
  // 사람 채점 없이 녹음 → 음성인식(ASR) → 이 규칙으로 문항 점수를 낸다. 결과지는 이 값을 쓴다.
  // 음성인식 자체의 오인식은 측정 도구의 한계로 결과지 '한계'에 적는다 (사람이 고치지 않는다).
  const AUTO_SCORING_VERSION = 'auto-asr-scoring-0.1';

  // ASR 문자열을 전사 규약으로 바꾼다. 띄어 쓴 조각이 각각 목표 길이에 가까우면 다시 읽은 시도(/)로,
  // 짧은 조각이면 나누어 읽은 것(-)으로 본다. 문장부호는 버린다.
  function asrToTranscript(asrText, targetText) {
    const pieces = String(asrText || '').replace(/[^\uAC00-\uD7A3\s]/g, ' ').split(/\s+/).filter(Boolean);
    if (!pieces.length) return '무응답';
    const targetLength = syllablesOf(targetText).length;
    const whole = pieces.length > 1 && pieces.every(piece => syllablesOf(piece).length >= Math.max(2, Math.ceil(targetLength * 0.6)));
    return pieces.join(whole ? '/' : '-');
  }

  // 단어 해독 한 문항: { itemScore, transcript, firstAttemptCorrect, finalAttemptCorrect, events, errorPositions, spellingRead, noResponse }
  function autoDecodingRating(item, asrText, { speechDetected = true } = {}) {
    const transcript = speechDetected ? asrToTranscript(asrText, item.text) : '무응답';
    const candidate = decodingCandidate(item, transcript);
    const attempts = candidate.attempts || [];
    return {
      source: 'AUTO', scoringVersion: AUTO_SCORING_VERSION, transcript, asrText: String(asrText || ''),
      itemScore: candidate.suggestion.itemScore,
      firstAttemptCorrect: candidate.suggestion.firstAttemptCorrect, finalAttemptCorrect: candidate.suggestion.finalAttemptCorrect,
      events: candidate.suggestion.events,
      errorPositions: attempts.map(attempt => attempt.ops.filter(op => op.op !== 'match').map(op => ({ op: op.op, position: op.position, target: op.target, actual: op.actual, jamo: op.jamo }))),
      spellingRead: Boolean(attempts.length && attempts[attempts.length - 1].spellingRead),
      noResponse: candidate.status === 'NO_RESPONSE',
      notes: candidate.notes || []
    };
  }

  // 읽기 유창성 한 지문: ASR 단어열을 지문에 정렬해 어절 표시(대치·생략·삽입·긴 멈춤)와 지표를 만든다.
  // speech: 에너지 기반 발화 탐지 결과 { onsetMs, offsetMs, pauses }. 없으면 ASR 단어 시각으로 대신한다.
  function autoFluencyRating(tokens, asrWords = [], { speech = null, recordingMs = null, asrText = '' } = {}, config = SCORING_CONFIG) {
    const alignment = alignWordsToPassage(tokens, asrWords);
    const marks = {};
    const add = (index, flag) => { if (index < 0 || index >= tokens.length) return; const entry = marks[index] || { mark: 'correct', flags: [] }; if (!entry.flags.includes(flag)) entry.flags.push(flag); marks[index] = entry; };
    for (const token of alignment.tokens) {
      if (token.index > alignment.lastReadIndex) break;
      if (token.status === 'sub') marks[token.index] = { mark: 'sub', flags: [], actual: token.heard };
      if (token.status === 'omit') marks[token.index] = { mark: 'omit', flags: [] };
    }
    for (const insertion of alignment.insertions) if (insertion.afterIndex >= 0 && insertion.afterIndex <= alignment.lastReadIndex) add(insertion.afterIndex, 'insertAfter');
    const timed = alignment.tokens.filter(token => token.startMs != null);
    const onsetMs = speech?.onsetMs ?? timed[0]?.startMs ?? 0;
    const endMs = speech?.offsetMs ?? timed[timed.length - 1]?.endMs ?? recordingMs ?? 0;
    // 긴 멈춤: 멈춤이 끝난 뒤 처음 시작하는 어절 앞에 표시
    for (const pause of speech?.pauses || []) {
      const next = timed.find(token => token.startMs >= pause.endMs - 50);
      if (next && next.index <= alignment.lastReadIndex) add(next.index, 'pauseBefore');
    }
    let sixtyIndex = null;
    if (endMs - onsetMs > config.fluencyWindowMs) {
      const at = onsetMs + config.fluencyWindowMs;
      const before = timed.filter(token => token.startMs <= at);
      sixtyIndex = before.length ? before[before.length - 1].index : tokenAtTime(tokens, onsetMs, endMs, at);
    }
    const lastIndex = alignment.lastReadIndex;
    const metrics = lastIndex < 0 ? null : computeFluency({ tokens, marks, lastIndex, sixtyIndex, onsetMs, endMs });
    return {
      source: 'AUTO', scoringVersion: AUTO_SCORING_VERSION, transcript: String(asrText || ''),
      itemScore: lastIndex < 0 ? 'UNSCORABLE' : 'VALID',
      marks, lastIndex, sixtyIndex, sixtySource: 'auto', onsetMs, speechEndMs: endMs,
      timing: speech?.onsetMs != null ? 'vad' : timed.length ? 'asr' : 'recording',
      metrics, events: metrics ? Object.keys(metrics.events) : []
    };
  }

  // ---------- 선택형 하위검사 요약 ----------
  // answers: [{ correct, rtMs, type, timedOut, noResponse }] (연습 제외). 시간 초과로 보지 못한 문항은 answers에 없다.
  // efficiency: TOSREC처럼 제한 시간 안의 (정답 수 - 오답 수). 무작위로 누른 점수를 상쇄한다.
  // ---------- 음운규칙 필요 위치 (표준 발음법) ----------
  // 어절 안에서 앞 음절 받침과 뒤 음절 첫소리가 만나 표기와 발음이 달라지는 자리를 찾는다.
  // KOLRA 불일치형 문항의 규칙(된소리되기·비음화·구개음화·유음화·ㅎ탈락·기식음화)에 맞춰 연음은 넣지 않는다.
  const REP_K = ['ㄱ', 'ㄲ', 'ㅋ', 'ㄳ', 'ㄺ'], REP_T = ['ㄷ', 'ㅅ', 'ㅆ', 'ㅈ', 'ㅊ', 'ㅌ'], REP_P = ['ㅂ', 'ㅍ', 'ㄼ', 'ㄿ', 'ㅄ'];
  const OBSTRUENT_CODA = [...REP_K, ...REP_T, ...REP_P];
  function ruleAt(a, b) {
    const { jong } = a, { cho, jung } = b;
    if (!jong) return null;
    if (['ㄷ', 'ㅌ', 'ㄾ'].includes(jong) && cho === 'ㅇ' && jung === 'ㅣ') return '구개음화'; // 제17항
    if (['ㄷ'].includes(jong) && cho === 'ㅎ' && jung === 'ㅣ') return '구개음화';
    if (['ㅎ', 'ㄶ', 'ㅀ'].includes(jong) && cho === 'ㅇ') return 'ㅎ탈락'; // 제12항 4
    if (['ㅎ', 'ㄶ', 'ㅀ'].includes(jong) && ['ㄱ', 'ㄷ', 'ㅈ'].includes(cho)) return '기식음화'; // 제12항 1
    if (OBSTRUENT_CODA.includes(jong) && cho === 'ㅎ') return '기식음화';
    if (OBSTRUENT_CODA.includes(jong) && ['ㄴ', 'ㅁ'].includes(cho)) return '비음화'; // 제18항
    if (['ㅁ', 'ㅇ'].includes(jong) && cho === 'ㄹ') return '비음화'; // 제19항
    if ((['ㄴ'].includes(jong) && cho === 'ㄹ') || (['ㄹ', 'ㄾ', 'ㅀ'].includes(jong) && cho === 'ㄴ')) return '유음화'; // 제20항
    if (OBSTRUENT_CODA.includes(jong) && ['ㄱ', 'ㄷ', 'ㅂ', 'ㅅ', 'ㅈ'].includes(cho)) return '된소리되기'; // 제23항
    return null;
  }
  function ruleSites(word) {
    const syllables = [...String(word)].filter(ch => ch >= '가' && ch <= '힣');
    const sites = [];
    for (let i = 0; i + 1 < syllables.length; i++) {
      const rule = ruleAt(decompose(syllables[i]), decompose(syllables[i + 1]));
      if (rule) sites.push({ index: i, rule, pair: syllables[i] + syllables[i + 1] });
    }
    return sites;
  }

  function choiceSummary(answers = []) {
    const attempted = answers.filter(answer => !answer.noResponse);
    const correct = answers.filter(answer => answer.correct).length;
    const incorrect = attempted.length - correct;
    const rts = answers.filter(answer => answer.correct && answer.rtMs != null).map(answer => answer.rtMs).sort((x, y) => x - y);
    const mid = Math.floor(rts.length / 2);
    const byType = {};
    for (const answer of answers) {
      const key = answer.type || '기타';
      byType[key] ||= { n: 0, correct: 0 };
      byType[key].n++;
      if (answer.correct) byType[key].correct++;
    }
    return {
      n: answers.length, attempted: attempted.length, correct, incorrect, noResponse: answers.length - attempted.length,
      pct: answers.length ? Math.round(correct / answers.length * 1000) / 10 : null,
      medianCorrectRtMs: rts.length ? (rts.length % 2 ? rts[mid] : Math.round((rts[mid - 1] + rts[mid]) / 2)) : null,
      efficiency: correct - incorrect, byType
    };
  }

  // 어휘판단의 민감도 d′ (신호탐지이론; Green & Swets, 1966). 실제단어에 '낱말' = 적중, 비단어에 '낱말' = 오경보.
  // 0·1 비율은 로그선형 보정(각 칸 +0.5, 분모 +1; Hautus, 1995)으로 무한대를 피한다.
  function inverseNormal(p) {
    // Acklam의 유리함수 근사 (상대 오차 < 1.15e-9)
    const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
    const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
    const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
    const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
    const low = 0.02425;
    if (p < low) { const q = Math.sqrt(-2 * Math.log(p)); return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
    if (p > 1 - low) { const q = Math.sqrt(-2 * Math.log(1 - p)); return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
    const q = p - 0.5, r = q * q;
    return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  }
  function dPrime({ hits, signalN, falseAlarms, noiseN }) {
    if (!signalN || !noiseN) return null;
    const hitRate = (hits + 0.5) / (signalN + 1), faRate = (falseAlarms + 0.5) / (noiseN + 1);
    return { hitRate: +(hits / signalN).toFixed(3), falseAlarmRate: +(falseAlarms / noiseN).toFixed(3), dPrime: +(inverseNormal(hitRate) - inverseNormal(faRate)).toFixed(2) };
  }

  // ---------- 비율의 불확실성 ----------
  // Wilson (1927) 점수 신뢰구간. 문항 수가 적을 때 정규근사(Wald)보다 적절하다 (Brown, Cai & DasGupta, 2001).
  function wilsonInterval(hit, n, z = 1.96) {
    if (!n) return null;
    const p = hit / n;
    const denom = 1 + z * z / n;
    const center = (p + z * z / (2 * n)) / denom;
    const half = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / denom;
    return { p: +(p * 100).toFixed(1), low: +(Math.max(0, center - half) * 100).toFixed(1), high: +(Math.min(1, center + half) * 100).toFixed(1) };
  }

  // 두 독립 비율 차이의 신뢰구간: Newcombe (1998) 방법 10 (Wilson 구간 결합).
  // 구간이 0을 포함하면 "이 문항 수로는 두 조건의 차이를 말할 수 없음"으로 보고한다.
  function proportionDifference(hitA, nA, hitB, nB) {
    const a = wilsonInterval(hitA, nA), b = wilsonInterval(hitB, nB);
    if (!a || !b) return null;
    const p1 = hitA / nA, p2 = hitB / nB, l1 = a.low / 100, u1 = a.high / 100, l2 = b.low / 100, u2 = b.high / 100;
    const diff = p1 - p2;
    const low = diff - Math.sqrt((p1 - l1) ** 2 + (u2 - p2) ** 2);
    const high = diff + Math.sqrt((u1 - p1) ** 2 + (p2 - l2) ** 2);
    return { diff: +(diff * 100).toFixed(1), low: +(low * 100).toFixed(1), high: +(high * 100).toFixed(1), excludesZero: low > 0 || high < 0 };
  }

  const api = {
    SCORING_CONFIG, FLUENCY_MARKS, FLUENCY_FLAGS,
    syllablesOf, countSyllables, decompose, jamoDiff, alignSyllables, parseTranscript, decodingCandidate,
    tokenizePassage, computeFluency, estimateTokenTimes, tokenAtTime,
    detectSpeech, waveformPeaks, comparableRating, ratingsAgree, syllableMatches, selfCorrectionCheck, hesitationCheck,
    constrainedDecodingChoice, alignWordsToPassage, cohensKappa, kappaLabel, wilsonInterval, proportionDifference,
    SCREENING_CONFIG, screeningDecision,
    AUTO_SCORING_VERSION, asrToTranscript, autoDecodingRating, autoFluencyRating,
    choiceSummary, inverseNormal, dPrime, ruleSites
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else global.Scoring = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
