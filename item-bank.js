// 문항 출처와 선정 규칙을 코드와 함께 버전 관리한다.
// 이 메타데이터는 후보 문항의 재현성을 높이기 위한 것이며, 규준·타당도·난이도를 대신하지 않는다.
(function (global) {
  const VERSION = 'item-evidence-0.2';
  const EVIDENCE = global.ReadingEvidenceEngine || (typeof require === 'function' ? require('./evidence-engine.js') : null);

  const SOURCES = Object.freeze({
    niklBasicVocabulary2023: Object.freeze({
      title: '국어 기초 어휘 선정 및 어휘 등급화 연구(국립국어원, 2023)',
      url: 'https://www.korean.go.kr/front/reportData/reportDataView.do?mn_id=207&report_seq=1160',
      dataUrl: 'https://www.korean.go.kr/common/download.do?c_file_name=1d6d75b9-45cb-49d4-989f-1483c332573a.xlsx&file_path=reportData',
      license: '공공누리 제1유형(출처표시)',
      retrievedAt: '2026-10-06',
      use: '실제단어 친숙도 층화와 동형어·품사 점검을 위한 공식 어휘등급 자료'
    }),
    kofren2024: Object.freeze({
      title: 'KoFREN: Comprehensive Korean Word Frequency Norms Derived from Large Scale Free Speech Corpora',
      url: 'https://aclanthology.org/2024.lrec-main.866/',
      dataUrl: 'https://github.com/jinseo0904/korean_frequency',
      retrievedAt: '2026-10-06',
      use: '41M어절 한국어 자발화의 동일 품사 원빈도·조정빈도 log10으로 A 실제단어 친숙도 혼입을 기술'
    }),
    koreanReadingEfficiency: Object.freeze({
      title: 'Korean elementary reading component study: 45-second word reading and 1-minute passage reading',
      url: 'https://files.eric.ed.gov/fulltext/EJ1270114.pdf',
      use: '시간제한 낱말 읽기 후보의 45초 실시 형식 근거'
    }),
    testingStandards: Object.freeze({
      title: 'Standards for Educational and Psychological Testing (AERA, APA, NCME)',
      url: 'https://www.testingstandards.net/uploads/7/6/6/4/76643089/9780935302356.pdf',
      use: '검사 용도, 문항 청사진, 타당도 근거와 제한의 명시'
    }),
    morphologyLongitudinal: Object.freeze({
      title: 'Morphological awareness and reading development: a longitudinal study',
      url: 'https://doi.org/10.1080/10888438.2010.487143',
      use: '형태소 결합·분해 과제를 읽기 연구 확장으로 유지하는 근거'
    })
  });

  const A_REAL_WORDS = Object.freeze({
    'RW-C-01': Object.freeze({ word: '나무', niklGrade: 1, origin: '고유어', pos: '명사', source: 'niklBasicVocabulary2023', corpusFrequency: 12531, corpusLog10: 4.182794, corpusFrequencySource: 'kofren2024:all:NNG' }),
    'RW-C-02': Object.freeze({ word: '모자', niklGrade: 1, origin: '한자어', pos: '명사', source: 'niklBasicVocabulary2023', corpusFrequency: 6867, corpusLog10: 3.921575, corpusFrequencySource: 'kofren2024:all:NNG', caution: '동형어가 있으므로 뜻 맥락 없는 낭독에서 친숙도 혼입을 파일럿으로 확인' }),
    'RW-C-03': Object.freeze({ word: '바다', niklGrade: 1, origin: '고유어', pos: '명사', source: 'niklBasicVocabulary2023', corpusFrequency: 18959, corpusLog10: 4.362623, corpusFrequencySource: 'kofren2024:all:NNG' }),
    'RW-C-04': Object.freeze({ word: '우산', niklGrade: 1, origin: '한자어', pos: '명사', source: 'niklBasicVocabulary2023', corpusFrequency: 5192, corpusLog10: 3.800142, corpusFrequencySource: 'kofren2024:all:NNG' }),
    'RW-I-01': Object.freeze({ word: '국물', niklGrade: 1, origin: '고유어', pos: '명사', source: 'niklBasicVocabulary2023', corpusFrequency: 4800, corpusLog10: 3.766049, corpusFrequencySource: 'kofren2024:all:NNG' }),
    'RW-I-02': Object.freeze({ word: '설날', niklGrade: 1, origin: '고유어', pos: '명사', source: 'niklBasicVocabulary2023', corpusFrequency: 2528, corpusLog10: 3.487585, corpusFrequencySource: 'kofren2024:all:NNG' }),
    'RW-I-03': Object.freeze({ word: '같이', niklGrade: 1, origin: '고유어', pos: '부사', source: 'niklBasicVocabulary2023', corpusFrequency: 91810, corpusLog10: 5.047698, corpusFrequencySource: 'kofren2024:all:MAG' }),
    'RW-I-04': Object.freeze({ word: '입학', niklGrade: 1, origin: '한자어', pos: '명사', source: 'niklBasicVocabulary2023', corpusFrequency: 773, corpusLog10: 2.972987, corpusFrequencySource: 'kofren2024:all:NNG' })
  });

  // 국립국어원 2023 기초어휘 40,000개 전체표와 2026-10-06 대조해 표제어 충돌이 없는 후보만 남겼다.
  // 실제단어와 문항별로 음절 수·받침 수·음운규칙을 맞추고 공식 40,000 표제어의 철자 음절 bigram을 계산했다.
  // 이 값은 발음 말뭉치 기반 음운확률이 아니므로 대리지표로만 쓰며 파일럿에서 난이도 효과를 확인한다.
  const bigram = (meanLog10, percentile2Syllable, referenceMeanLog10) => Object.freeze({
    meanLog10, percentile2Syllable, referenceMeanLog10,
    differenceFromReference: +(meanLog10 - referenceMeanLog10).toFixed(6),
    source: 'niklBasicVocabulary2023', lexiconUniqueHeadwords: 37720,
    model: 'add-one-smoothed-boundary-syllable-bigram-types-0.1',
    interpretation: '공식 표제어 철자 배열의 대리지표이며 발음 말뭉치 기반 음운확률이 아님'
  });
  const A_NONWORDS = Object.freeze({
    'NW-C-01': Object.freeze({ word: '두버', accepted: '두버', pairId: 'RW-C-01', officialLexiconCollision: false, rules: [], orthographicBigram: bigram(-2.720695, 4.85, -1.621838) }),
    'NW-C-02': Object.freeze({ word: '머자', accepted: '머자', pairId: 'RW-C-02', officialLexiconCollision: false, rules: [], orthographicBigram: bigram(-2.298565, 42.36, -1.750915) }),
    'NW-C-03': Object.freeze({ word: '바너', accepted: '바너', pairId: 'RW-C-03', officialLexiconCollision: false, rules: [], orthographicBigram: bigram(-2.522836, 14.12, -1.529720) }),
    'NW-C-04': Object.freeze({ word: '우덩', accepted: '우덩', pairId: 'RW-C-04', officialLexiconCollision: false, rules: [], orthographicBigram: bigram(-2.594670, 9.61, -1.991598) }),
    'NW-I-01': Object.freeze({ word: '덕문', accepted: '덩문', pairId: 'RW-I-01', officialLexiconCollision: false, rules: ['비음화'], orthographicBigram: bigram(-2.579239, 10.51, -2.071453) }),
    'NW-I-02': Object.freeze({ word: '말논', accepted: '말론', pairId: 'RW-I-02', officialLexiconCollision: false, rules: ['유음화'], orthographicBigram: bigram(-2.731651, 4.63, -2.377402) }),
    'NW-I-03': Object.freeze({ word: '텥이', accepted: '테치', pairId: 'RW-I-03', officialLexiconCollision: false, rules: ['구개음화'], orthographicBigram: bigram(-2.796248, 3.16, -2.129695) }),
    'NW-I-04': Object.freeze({ word: '덥한', accepted: '더판', pairId: 'RW-I-04', officialLexiconCollision: false, rules: ['기식음화'], orthographicBigram: bigram(-2.905961, 1.65, -2.014349) })
  });

  const A_WORD_FEATURES = Object.freeze(Object.fromEntries(Object.entries(A_REAL_WORDS).map(([id, item]) => [id, EVIDENCE.wordFeatures(item.word, item)])));
  const A_NONWORD_AUDITS = Object.freeze(Object.fromEntries(Object.entries(A_NONWORDS).map(([id, item]) => {
    const reference = A_REAL_WORDS[item.pairId];
    return [id, EVIDENCE.auditNonword(item.word, {
      referenceWord: reference.word,
      officialLexiconCollision: item.officialLexiconCollision,
      phonotacticProbability: item.orthographicBigram.meanLog10,
      phonotacticPercentile: item.orthographicBigram.percentile2Syllable,
      phonotacticMethod: 'ORTHOGRAPHIC_SYLLABLE_BIGRAM_PROXY'
    })];
  })));

  const WORDS_BY_GRADE = Object.freeze({
    1: Object.freeze(['가게', '겨울', '구름', '국물', '글자', '나물', '냄비', '달력', '도둑', '동네', '모래', '바늘', '벌레', '봉투', '신발', '연필', '과학', '교실', '기둥', '약속']),
    2: Object.freeze(['갯벌', '곡식', '관객', '교육', '균형', '농민', '답변', '등교', '매력', '모집', '변화', '복습', '상점', '예보', '위생', '체력', '감탄', '격려', '고통', '공감']),
    3: Object.freeze(['가뭄', '갑옷', '객석', '견학', '결말', '결합', '고난', '곡물', '국립', '국토', '권한', '낭송', '농약', '농업', '번식', '번역', '겸손', '공터', '광경', '끈기'])
  });

  const timedWords = Object.entries(WORDS_BY_GRADE).flatMap(([grade, words]) => words.map(word => Object.freeze({
    text: word,
    niklGrade: Number(grade),
    syllables: Array.from(word).length,
    pos: '명사',
    homonymNo: 0,
    field: '일반어',
    source: 'niklBasicVocabulary2023'
  })));
  const VOCABULARY_GRADE_LOOKUP = Object.freeze(Object.fromEntries([
    ...Object.values(A_REAL_WORDS).map(item => [item.word, item.niklGrade]),
    ...timedWords.map(item => [item.text, item.niklGrade])
  ]));

  const FORM_GRADE_PATTERN = Object.freeze([
    1, 1, 2, 2, 3, 2, 2, 3, 3, 1, 3, 3, 1, 1, 2,
    1, 1, 2, 2, 3, 2, 2, 3, 3, 1, 3, 3, 1, 1, 2,
    1, 1, 2, 2, 3, 2, 2, 3, 3, 1, 3, 3, 1, 1, 2,
    1, 1, 2, 2, 3, 2, 2, 3, 3, 1, 3, 3, 1, 1, 2
  ]);
  const arrangedWords = offsets => {
    const cursors = { 1: 0, 2: 0, 3: 0 };
    return FORM_GRADE_PATTERN.map(grade => {
      const pool = WORDS_BY_GRADE[grade];
      const index = (cursors[grade]++ + offsets[grade]) % pool.length;
      return timedWords.find(item => item.text === pool[index]);
    });
  };
  const makeWordEfficiencyForm = (formId, offsets) => {
    const words = Object.freeze(arrangedWords(offsets));
    return Object.freeze({
      id: 'B-WE-01', formId, taskType: 'timed-word-list', timeLimitSec: 45,
      kind: `45초 낱말 읽기 후보 · ${formId}`,
      condition: '국립국어원 1·2·3등급 각 20개 · 행별 난이도 층화',
      words, text: words.map(item => item.text).join(' '),
      selection: Object.freeze({
        source: 'niklBasicVocabulary2023',
        rule: '등급별 20개, 2음절 일반어 명사, 표준동형어번호 0, 중복 없음, 5열×12행의 등급 위치 패턴 고정',
        presentationOrder: `stratified-grid-${formId}`,
        interpretation: '45초 안에 정확히 읽은 낱말 수를 기록하는 후보 지표; 연령 규준과 절단점 없음',
        validationStatus: 'OFFICIAL_VOCABULARY_ENGINEERED_PENDING_PILOT'
      })
    });
  };
  const B_WORD_EFFICIENCY_FORMS = Object.freeze({
    A: makeWordEfficiencyForm('Form A', { 1: 0, 2: 0, 3: 0 }),
    B: makeWordEfficiencyForm('Form B', { 1: 7, 2: 7, 3: 7 }),
    C: makeWordEfficiencyForm('Form C', { 1: 13, 2: 13, 3: 13 })
  });
  const B_WORD_EFFICIENCY = B_WORD_EFFICIENCY_FORMS.A;
  const stableHash = value => [...String(value || '')].reduce((hash, char) => Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0, 2166136261);
  const wordEfficiencyForParticipant = participant => B_WORD_EFFICIENCY_FORMS[['A', 'B', 'C'][stableHash(participant) % 3]];

  const C_MORPHOLOGY_BLUEPRINT = Object.freeze({
    version: 'morphology-blueprint-0.2',
    role: 'research-extension',
    constructs: Object.freeze(['합성어 결합', '합성어 분해', '파생어 결합', '파생어 분해']),
    rationale: '동형 글자 찾기가 아니라 실제 낱말을 구성 요소로 합치고 나누는 능력을 탐색',
    interpretation: '정답률은 탐색값이며 핵심 언어이해 점수·연령 규준과 합치지 않음',
    validationStatus: 'LITERATURE_ENGINEERED_PENDING_PILOT'
  });

  function auditTimedWordList(list = B_WORD_EFFICIENCY.words) {
    const gradeCounts = list.reduce((counts, item) => ({ ...counts, [item.niklGrade]: (counts[item.niklGrade] || 0) + 1 }), {});
    const unique = new Set(list.map(item => item.text)).size === list.length;
    return Object.freeze({
      version: VERSION,
      n: list.length,
      gradeCounts,
      unique,
      allTwoSyllable: list.every(item => item.syllables === 2),
      allNouns: list.every(item => item.pos === '명사'),
      allUnambiguousEntries: list.every(item => item.homonymNo === 0),
      balanced: [1, 2, 3].every(grade => gradeCounts[grade] === 20)
    });
  }

  const api = Object.freeze({ VERSION, SOURCES, A_REAL_WORDS, A_WORD_FEATURES, A_NONWORDS, A_NONWORD_AUDITS, WORDS_BY_GRADE, VOCABULARY_GRADE_LOOKUP, FORM_GRADE_PATTERN, B_WORD_EFFICIENCY, B_WORD_EFFICIENCY_FORMS, wordEfficiencyForParticipant, C_MORPHOLOGY_BLUEPRINT, auditTimedWordList });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else global.ReadingItemBank = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
