// 공개자료 기반 문항·지문·파일럿 자료의 재현 가능한 자동 감사를 제공한다.
// 자동 감사는 후보 탈락·검토 우선순위 지정 도구이며, 내용타당도나 규준을 대신하지 않는다.
(function (global) {
  const VERSION = 'evidence-engine-0.1';
  const HANGUL_BASE = 0xAC00;
  const HANGUL_LAST = 0xD7A3;
  const INITIALS = 19;
  const MEDIALS = 21;
  const FINALS = 28;
  const SOURCES = Object.freeze({
    corpus: '국립국어원 모두의 말뭉치·국어 기초 어휘 2023',
    readability: '이보미(2020), 한국어 읽기 텍스트 난이도 측정 공식 연구',
    digitalQc: 'ROAR 웹검사 품질관리 절차',
    accessibility: 'WCAG 2.2',
    status: 'AUTOMATED_PREFILTER_NOT_PSYCHOMETRIC_VALIDATION'
  });

  const koreanTokens = text => String(text || '').normalize('NFC').match(/[가-힣]+/gu) || [];
  const syllableCount = text => koreanTokens(text).reduce((sum, token) => sum + [...token].length, 0);
  const decomposeSyllable = char => {
    const code = char.codePointAt(0);
    if (code < HANGUL_BASE || code > HANGUL_LAST) return null;
    const offset = code - HANGUL_BASE;
    return {
      initial: Math.floor(offset / (MEDIALS * FINALS)),
      medial: Math.floor((offset % (MEDIALS * FINALS)) / FINALS),
      final: offset % FINALS
    };
  };
  const decomposeWord = word => [...String(word || '')].map(decomposeSyllable).filter(Boolean);
  const finalConsonantCount = word => decomposeWord(word).filter(unit => unit.final > 0).length;
  const jamoSignature = word => decomposeWord(word).flatMap(unit => [unit.initial, unit.medial, unit.final]);

  function sequenceDistance(reference, hypothesis) {
    const a = [...reference], b = [...hypothesis];
    const previous = [...Array(b.length + 1).keys()];
    for (let i = 1; i <= a.length; i++) {
      const current = [i];
      for (let j = 1; j <= b.length; j++) current[j] = a[i - 1] === b[j - 1] ? previous[j - 1] : 1 + Math.min(previous[j], current[j - 1], previous[j - 1]);
      previous.splice(0, previous.length, ...current);
    }
    return previous[b.length];
  }

  const syllableNeighbors = (word, lexicon = []) => lexicon.filter(candidate => candidate !== word && [...candidate].length === [...word].length && sequenceDistance([...word], [...candidate]) === 1).length;

  function wordFeatures(word, metadata = {}, lexicon = []) {
    const units = decomposeWord(word);
    return Object.freeze({
      word,
      syllables: units.length,
      finalConsonants: units.filter(unit => unit.final > 0).length,
      openSyllables: units.filter(unit => unit.final === 0).length,
      jamoUnits: units.length * 2 + units.filter(unit => unit.final > 0).length,
      syllableNeighborCount: lexicon.length ? syllableNeighbors(word, lexicon) : null,
      niklGrade: metadata.niklGrade ?? null,
      homonymNo: metadata.homonymNo ?? null,
      origin: metadata.origin || null,
      pos: metadata.pos || null,
      phonologicalRuleCount: Array.isArray(metadata.rules) ? metadata.rules.length : metadata.rule ? 1 : 0,
      corpusFrequency: metadata.corpusFrequency ?? null,
      corpusLog10: metadata.corpusLog10 ?? null,
      corpusFrequencySource: metadata.corpusFrequencySource || null,
      corpusFrequencyStatus: metadata.corpusFrequency == null ? 'NOT_AVAILABLE_USE_GRADE_AS_PROXY_ONLY' : 'OBSERVED',
      source: metadata.source || null,
      featureVersion: VERSION
    });
  }

  function auditNonword(word, options = {}) {
    const lexicon = options.lexicon || [];
    const reference = options.referenceWord || '';
    const collision = typeof options.officialLexiconCollision === 'boolean' ? options.officialLexiconCollision : lexicon.includes(word);
    const decomposed = decomposeWord(word);
    const legalHangul = decomposed.length === [...word].length && decomposed.length > 0;
    const referenceMatch = reference ? {
      syllables: [...word].length === [...reference].length,
      finalConsonants: finalConsonantCount(word) === finalConsonantCount(reference),
      syllableDistance: sequenceDistance([...word], [...reference]),
      jamoDistance: sequenceDistance(jamoSignature(word), jamoSignature(reference))
    } : null;
    const flags = [];
    if (!legalHangul) flags.push('NON_HANGUL_OR_EMPTY');
    if (collision) flags.push('OFFICIAL_LEXICON_COLLISION');
    if (referenceMatch && !referenceMatch.syllables) flags.push('LENGTH_MISMATCH');
    if (referenceMatch && !referenceMatch.finalConsonants) flags.push('CODA_COUNT_MISMATCH');
    if (options.phonotacticProbability == null) flags.push('PHONOTACTIC_PROBABILITY_PENDING');
    if (options.phonotacticMethod === 'ORTHOGRAPHIC_SYLLABLE_BIGRAM_PROXY') flags.push('ORTHOGRAPHIC_BIGRAM_PROXY_ONLY');
    const severeFlags = flags.filter(flag => !['PHONOTACTIC_PROBABILITY_PENDING', 'ORTHOGRAPHIC_BIGRAM_PROXY_ONLY'].includes(flag));
    return Object.freeze({
      word,
      legalHangul,
      officialLexiconCollision: collision,
      referenceWord: reference || null,
      referenceMatch,
      phonotacticProbability: options.phonotacticProbability ?? null,
      phonotacticPercentile: options.phonotacticPercentile ?? null,
      phonotacticMethod: options.phonotacticMethod || null,
      status: severeFlags.length ? 'REJECT_OR_REVIEW' : flags.includes('PHONOTACTIC_PROBABILITY_PENDING') ? 'DIGITAL_PREFILTER_PASS_PENDING_PHONOTACTICS' : flags.includes('ORTHOGRAPHIC_BIGRAM_PROXY_ONLY') ? 'DIGITAL_PREFILTER_PASS_WITH_ORTHOGRAPHIC_PROXY' : 'DIGITAL_PREFILTER_PASS',
      flags,
      version: VERSION
    });
  }

  const CONNECTIVE_PATTERNS = [/그러나/gu, /그래서/gu, /따라서/gu, /때문/gu, /동안/gu, /하지만/gu, /그런데/gu, /그러므로/gu];
  const EMBEDDING_PATTERNS = [/[는은을ㄴ]지/gu, /다고/gu, /라는/gu, /는데/gu, /도록/gu, /면서/gu, /지만/gu];
  const PASSIVE_CAUSATIVE_PATTERNS = [/[이가히리]어(?:지|졌|진)/gu, /시키/gu, /당하/gu];
  const NEGATION_PATTERNS = [/않/gu, /못/gu, /아니/gu, /없/gu];
  const countMatches = (text, patterns) => patterns.reduce((sum, pattern) => sum + (String(text || '').match(pattern) || []).length, 0);

  function textMetrics(text, gradeLookup = {}) {
    const normalized = String(text || '').trim();
    const tokens = koreanTokens(normalized);
    const sentences = normalized.split(/[.!?]+/u).map(sentence => sentence.trim()).filter(Boolean);
    const sentenceLengths = sentences.map(sentence => koreanTokens(sentence).length);
    const grades = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, unknown: 0 };
    for (const token of tokens) {
      const grade = gradeLookup[token];
      if (Number.isInteger(grade) && grade >= 1 && grade <= 5) grades[grade]++;
      else grades.unknown++;
    }
    const known = tokens.length - grades.unknown;
    return Object.freeze({
      eojeol: tokens.length,
      syllables: syllableCount(normalized),
      sentences: sentences.length,
      meanEojeolPerSentence: sentences.length ? +(tokens.length / sentences.length).toFixed(2) : null,
      maxEojeolPerSentence: sentenceLengths.length ? Math.max(...sentenceLengths) : null,
      meanSyllablesPerEojeol: tokens.length ? +(syllableCount(normalized) / tokens.length).toFixed(2) : null,
      vocabularyGrades: grades,
      vocabularyCoveragePct: tokens.length ? +(known / tokens.length * 100).toFixed(1) : null,
      connectiveMarkers: countMatches(normalized, CONNECTIVE_PATTERNS),
      embeddingMarkers: countMatches(normalized, EMBEDDING_PATTERNS),
      passiveCausativeMarkers: countMatches(normalized, PASSIVE_CAUSATIVE_PATTERNS),
      negationMarkers: countMatches(normalized, NEGATION_PATTERNS),
      alignment: 'LEFT_NOT_JUSTIFIED',
      readabilityStatus: 'DESCRIPTIVE_FEATURE_PROFILE_NOT_GRADE_PREDICTION',
      version: VERSION
    });
  }

  function choiceItemAudit(item, passage = '') {
    const options = item.options || [];
    const answerMatches = options.filter(option => option === item.answer).length;
    const lengths = options.map(option => syllableCount(option));
    const sorted = [...lengths].sort((a, b) => a - b);
    const median = sorted.length ? (sorted[Math.floor((sorted.length - 1) / 2)] + sorted[Math.ceil((sorted.length - 1) / 2)]) / 2 : 0;
    const answerLength = syllableCount(item.answer);
    const flags = [];
    if (answerMatches !== 1) flags.push('ANSWER_NOT_EXACTLY_ONCE');
    if (new Set(options).size !== options.length) flags.push('DUPLICATE_OPTIONS');
    if (median && answerLength > median * 1.8) flags.push('ANSWER_LENGTH_CUE');
    if (lengths.length && Math.max(...lengths) - Math.min(...lengths) >= 10) flags.push('OPTION_LENGTH_SPREAD');
    const evidenceRequired = ['사실', '어휘', '문장 구조'].includes(item.type);
    const answerVerbatimInPassage = Boolean(passage && passage.includes(item.answer));
    if (evidenceRequired && passage && !answerVerbatimInPassage) flags.push('FACT_ANSWER_NOT_VERBATIM_IN_PASSAGE_REVIEW');
    return Object.freeze({
      itemId: item.id,
      answerMatches,
      optionCount: options.length,
      answerDeclaredIndex: options.indexOf(item.answer),
      optionSyllableLengths: lengths,
      answerVerbatimInPassage,
      flags,
      status: flags.length ? 'REVIEW' : 'AUTOMATED_PREFILTER_PASS',
      version: VERSION
    });
  }

  function choiceSectionAudit(section) {
    const items = section.items || [];
    const itemAudits = items.map(item => choiceItemAudit(item, section.passage || ''));
    const positions = {};
    for (const audit of itemAudits) positions[audit.answerDeclaredIndex] = (positions[audit.answerDeclaredIndex] || 0) + 1;
    return Object.freeze({
      sectionId: section.id,
      passage: section.passage ? textMetrics(section.passage, section.vocabularyGradeLookup || {}) : null,
      itemAudits,
      declaredAnswerPositions: positions,
      flaggedItems: itemAudits.filter(audit => audit.flags.length).map(audit => audit.itemId),
      status: itemAudits.some(audit => audit.status === 'REVIEW') ? 'REVIEW' : 'AUTOMATED_PREFILTER_PASS',
      version: VERSION
    });
  }

  function timedWordFormAudit(form) {
    const words = form.words || [];
    const gradeCounts = words.reduce((counts, item) => ({ ...counts, [item.niklGrade]: (counts[item.niklGrade] || 0) + 1 }), {});
    const rows = Array.from({ length: 12 }, (_, row) => words.slice(row * 5, row * 5 + 5).map(item => item.niklGrade));
    return Object.freeze({
      formId: form.formId,
      n: words.length,
      gradeCounts,
      unique: new Set(words.map(item => item.text)).size === words.length,
      fixedGrid: rows.length === 12 && rows.every(row => row.length === 5),
      rowGradePatterns: rows,
      balanced: [1, 2, 3].every(grade => gradeCounts[grade] === 20),
      version: VERSION
    });
  }

  function rapidResponseAudit(rtMs, bounds = { minMs: 200, maxMs: 5000 }) {
    const value = Number(rtMs);
    if (!Number.isFinite(value)) return { status: 'NO_RESPONSE', valid: false, reason: 'RT_MISSING', bounds };
    if (value < bounds.minMs) return { status: 'RAPID_GUESS_FLAG', valid: false, reason: 'BELOW_RESEARCH_QC_BOUND', bounds };
    if (value > bounds.maxMs) return { status: 'EXTREME_SLOW_FLAG', valid: false, reason: 'ABOVE_RESEARCH_QC_BOUND', bounds };
    return { status: 'WITHIN_RESEARCH_QC_BOUND', valid: true, reason: null, bounds };
  }

  const mean = values => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
  function pearson(xs, ys) {
    if (xs.length !== ys.length || xs.length < 3) return null;
    const mx = mean(xs), my = mean(ys);
    const numerator = xs.reduce((sum, x, index) => sum + (x - mx) * (ys[index] - my), 0);
    const dx = Math.sqrt(xs.reduce((sum, x) => sum + (x - mx) ** 2, 0));
    const dy = Math.sqrt(ys.reduce((sum, y) => sum + (y - my) ** 2, 0));
    return dx && dy ? +(numerator / (dx * dy)).toFixed(3) : null;
  }

  function classicalItemAnalysis(rows = []) {
    const usable = rows.filter(row => row.participantId && row.itemId && [0, 1].includes(Number(row.score)));
    const byParticipant = {};
    for (const row of usable) (byParticipant[row.participantId] ||= {})[row.itemId] = Number(row.score);
    const totals = Object.fromEntries(Object.entries(byParticipant).map(([id, scores]) => [id, Object.values(scores).reduce((sum, score) => sum + score, 0)]));
    const byItem = {};
    for (const row of usable) (byItem[row.itemId] ||= []).push(row);
    const items = Object.entries(byItem).map(([itemId, itemRows]) => {
      const scores = itemRows.map(row => Number(row.score));
      const restTotals = itemRows.map(row => totals[row.participantId] - Number(row.score));
      return { itemId, n: scores.length, difficultyP: +mean(scores).toFixed(3), correctedItemTotalCorrelation: pearson(scores, restTotals) };
    });
    const participantIds = Object.keys(byParticipant);
    const itemIds = Object.keys(byItem);
    let alpha = null;
    if (participantIds.length >= 3 && itemIds.length >= 2 && participantIds.every(id => itemIds.every(itemId => byParticipant[id][itemId] != null))) {
      const itemVariances = itemIds.map(itemId => {
        const values = participantIds.map(id => byParticipant[id][itemId]);
        const m = mean(values);
        return values.reduce((sum, value) => sum + (value - m) ** 2, 0) / (values.length - 1);
      });
      const totalValues = participantIds.map(id => totals[id]);
      const totalMean = mean(totalValues);
      const totalVariance = totalValues.reduce((sum, value) => sum + (value - totalMean) ** 2, 0) / (totalValues.length - 1);
      if (totalVariance) alpha = +(itemIds.length / (itemIds.length - 1) * (1 - itemVariances.reduce((a, b) => a + b, 0) / totalVariance)).toFixed(3);
    }
    return Object.freeze({
      participants: participantIds.length,
      items,
      cronbachAlpha: alpha,
      status: participantIds.length ? 'OBSERVED_SAMPLE_DESCRIPTIVE_NOT_NORM' : 'AWAITING_PILOT_DATA',
      version: VERSION
    });
  }

  function groupItemGapScreen(rows = [], groupField = 'group', minimumPerGroup = 5) {
    const usable = rows.filter(row => row.itemId && row[groupField] != null && [0, 1].includes(Number(row.score)));
    const grouped = {};
    for (const row of usable) {
      grouped[row.itemId] ||= {};
      (grouped[row.itemId][row[groupField]] ||= []).push(Number(row.score));
    }
    const items = Object.entries(grouped).map(([itemId, groups]) => {
      const summaries = Object.fromEntries(Object.entries(groups).map(([group, scores]) => [group, { n: scores.length, p: +mean(scores).toFixed(3) }]));
      const eligible = Object.values(summaries).filter(summary => summary.n >= minimumPerGroup).map(summary => summary.p);
      const maxGap = eligible.length >= 2 ? +(Math.max(...eligible) - Math.min(...eligible)).toFixed(3) : null;
      return { itemId, groups: summaries, maxRawDifficultyGap: maxGap, flag: maxGap != null && maxGap >= 0.2 ? 'GROUP_GAP_REVIEW' : maxGap == null ? 'INSUFFICIENT_GROUP_N' : 'NO_LARGE_RAW_GAP' };
    });
    return Object.freeze({ groupField, minimumPerGroup, items, status: 'RAW_GROUP_GAP_SCREEN_NOT_DIF_MODEL', version: VERSION });
  }

  const api = Object.freeze({
    VERSION, SOURCES, koreanTokens, syllableCount, decomposeSyllable, decomposeWord, finalConsonantCount,
    sequenceDistance, wordFeatures, auditNonword, textMetrics, choiceItemAudit, choiceSectionAudit,
    timedWordFormAudit, rapidResponseAudit, classicalItemAnalysis, groupItemGapScreen
  });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else global.ReadingEvidenceEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
