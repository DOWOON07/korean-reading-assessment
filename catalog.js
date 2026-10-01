// 전체 검사 플랫폼 구조 (교수님 브리핑 Blueprint v1.2의 세부 경로 A~D).
// status: core = 실제로 실시·채점하는 하위검사, preview = 흐름을 보여주는 화면만 있음(채점·저장 안 함).
// 0.5부터 모든 하위검사를 실시한다. module: 녹음 모듈(decoding·fluency) 또는 선택형 모듈(battery.js)
const PLATFORM_PATHS = [
  {
    id: 'A', title: '글자·소리 처리와 단어 해독', screening: 'decoding', subtests: [
      { id: 'A-phon', title: '음운인식', status: 'core', module: 'phonology', measure: '정답 수 · 정확도 (음절 탈락·음소 탈락·음소 대치)', report: '음운 조작 수행', basis: 'KOLRA 음운처리 영역; CTOPP-2 탈락 과제 형식' },
      { id: 'A-letter', title: '글자-소리 대응', status: 'core', module: 'phonology', measure: '정확도 (초성·받침·모음 최소대립)', report: '글자-소리 대응 수행', basis: '한글 초기 읽기, 글자-소리 대응 원리' },
      { id: 'A-real', title: '실제단어 읽기', status: 'core', module: 'decoding', measure: '단어·음절 정확도', report: '익숙한 단어 해독' },
      { id: 'A-nonword', title: '무의미단어 읽기', status: 'core', module: 'decoding', measure: '단어·음절 정확도', report: '어휘 도움 없는 해독' },
      { id: 'A-rule', title: '일치/불일치(음운변동) 조건', status: 'core', module: 'decoding', measure: '조건별 정확도·오류', report: '음운규칙 필요 조건의 수행 차' }
    ]
  },
  {
    id: 'B', title: '읽기 유창성', screening: 'fluency', subtests: [
      { id: 'B-lexical', title: '단어 재인(어휘판단)', status: 'core', module: 'silent', measure: '정확도 · d′ · 반응 시간', report: '단어 자동 재인', basis: 'ROAR 단어 재인 과제 (Yeatman 외, 2021)' },
      { id: 'B-silent', title: '묵독 효율(문장 참·거짓)', status: 'core', module: 'silent', measure: '제한 시간 안 정답 - 오답', report: '소리 내지 않고 읽는 효율', basis: 'TOSREC 문장 검증 형식 (Wagner 외, 2010)' },
      { id: 'B-oral', title: '연결글 낭독', status: 'core', module: 'fluency', measure: '정확 음절·어절 + 시간', report: '유창성 수준' },
      { id: 'B-error', title: '오류 분석', status: 'core', module: 'fluency', measure: '오류 위치·시각', report: '오류 프로파일' },
      { id: 'B-rule', title: '음운규칙 분석', status: 'core', module: 'decoding', measure: '규칙 필요 위치의 오류', report: '반복되는 조건별 오류' }
    ]
  },
  {
    id: 'C', title: '언어 이해', screening: 'comprehension', subtests: [
      { id: 'C-vocab', title: '어휘', status: 'core', module: 'language', measure: '정답률 (기초·학습·고급 어휘)', report: '어휘 이해', basis: 'Simple View of Reading의 언어이해 요소' },
      { id: 'C-sentence', title: '문장 이해(듣기)', status: 'core', module: 'language', measure: '정답률 · 문장 구조 유형', report: '문장 구조 이해', basis: '피동·사동·관형절·부정 비교 등 문법 구조 이해' },
      { id: 'C-listen', title: '듣기 이해', status: 'core', module: 'language', measure: '정답률 (사실·추론)', report: '해독 부담 없는 이해', basis: 'Simple View of Reading: 듣기 이해 = 언어이해 지표' },
      { id: 'C-morph', title: '형태소 인식', status: 'core', module: 'language', measure: '정답률 (고유어·한자어·접사)', report: '단어 구조 인식', basis: '한국어 형태소 인식과 읽기의 관계' }
    ]
  },
  {
    id: 'D', title: '글 이해', screening: 'comprehension', subtests: [
      { id: 'D-fact', title: '사실 이해', status: 'core', module: 'comprehension', measure: '정답률', report: '글에 드러난 정보 찾기', basis: 'PIRLS 이해 과정: 명시적 정보 찾기' },
      { id: 'D-infer', title: '추론', status: 'core', module: 'comprehension', measure: '정답률', report: '드러나지 않은 내용 추론', basis: 'PIRLS 이해 과정: 직접 추론' },
      { id: 'D-eval', title: '평가·판단', status: 'core', module: 'comprehension', measure: '정답률', report: '글의 목적·인물 평가', basis: 'PIRLS 이해 과정: 내용·형식 평가' },
      { id: 'D-multi', title: '복수 글 비교·출처 평가', status: 'core', module: 'comprehension', measure: '정답률', report: '정보 통합·출처 평가', basis: 'PISA 2018 읽기: 출처 평가·복수 텍스트' }
    ]
  }
];
const PREVIEW_SUBTESTS = PLATFORM_PATHS.flatMap(path => path.subtests.filter(subtest => subtest.status === 'preview').map(subtest => ({ ...subtest, pathId: path.id, pathTitle: path.title })));
