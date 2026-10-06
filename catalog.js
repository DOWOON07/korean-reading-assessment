// 전체 검사 플랫폼 구조 (교수님 브리핑 Blueprint v1.2의 세부 경로 A~D).
// status: core = 기본 경로에서 실시하는 핵심 후보, research = 연구자가 명시적으로 켜는 확장 과제,
// preview = 흐름을 보여주는 화면만 있음(채점·저장 안 함).
// `core`도 표준화 완료를 뜻하지 않는다. 현재 문항은 전문가 검토·파일럿·규준화 전 후보이다.
const PLATFORM_PATHS = [
  {
    id: 'A', title: '글자·소리 처리와 단어 해독', screening: 'decoding', subtests: [
      { id: 'A-phon', title: '음운인식', status: 'core', module: 'phonology', measure: '정답 수 · 정확도 (음절 탈락·음소 탈락·음소 대치)', report: '음운 조작 수행', basis: 'KOLRA 음운처리 영역; CTOPP-2 탈락 과제 형식' },
      { id: 'A-letter', title: '글자-소리 대응', status: 'core', module: 'phonology', measure: '정확도 (초성·받침·모음 최소대립)', report: '글자-소리 대응 수행', basis: '한글 초기 읽기, 글자-소리 대응 원리' },
      { id: 'A-real', title: '실제단어 읽기', status: 'core', module: 'decoding', measure: '단어·음절 정확도', report: '익숙한 단어 해독', basis: 'KOLRA 해독 의미낱말 40문항; RA-RCP 단어인지' },
      { id: 'A-nonword', title: '무의미단어 읽기', status: 'core', module: 'decoding', measure: '단어·음절 정확도', report: '어휘 도움 없는 해독', basis: 'KOLRA 무의미낱말 40문항; Rack 외 (1992) 비단어 읽기' },
      { id: 'A-rule', title: '일치/불일치(음운변동) 조건', status: 'core', module: 'decoding', measure: '조건별 정확도·오류', report: '음운규칙 필요 조건의 수행 차', basis: 'KOLRA 일치·불일치형(된소리되기·비음화·구개음화·유음화·ㅎ탈락·기식음화); 표준 발음법' }
    ]
  },
  {
    id: 'B', title: '읽기 유창성', screening: 'fluency', subtests: [
      { id: 'B-word-efficiency', title: '45초 낱말 읽기 (핵심 후보)', status: 'core', module: 'fluency', measure: '45초 안에 정확히 읽은 낱말 수', report: '낱말 읽기 효율 후보값', basis: '한국어 읽기 구성요인 연구의 45초 낱말 읽기 형식; 국립국어원 2023 기초어휘 1~3등급 층화; 연령 규준 없음' },
      { id: 'B-lexical', title: '단어·비단어 판단 (디지털 연구 확장)', status: 'research', extension: 'digitalReading', module: 'silent', measure: '정확도 · d′ · 반응 시간', report: '단어 자동 재인 탐색값', basis: 'ROAR 과제 형식 차용; 한국어 규준 없음·핵심 점수와 분리' },
      { id: 'B-silent', title: '문장 참·거짓 묵독 (디지털 연구 확장)', status: 'research', extension: 'digitalReading', module: 'silent', measure: '제한 시간 안 정답 - 오답', report: '묵독 효율 탐색값', basis: 'TOSREC 형식 차용; 한국어 규준 없음·핵심 점수와 분리' },
      { id: 'B-oral', title: '연결글 낭독', status: 'core', module: 'fluency', measure: '정확 음절·어절 + 시간', report: '유창성 수준', basis: 'KOLRA 문단글 읽기유창성(정확 음절·시간); BASA 1분 읽기; DIBELS 8 ORF' },
      { id: 'B-error', title: '오류 분석', status: 'core', module: 'fluency', measure: '오류 위치·시각', report: '오류 프로파일', basis: 'DIBELS 8 ORF 채점 규칙(대치·생략·삽입·반복·자기수정)' },
      { id: 'B-rule', title: '음운규칙 분석', status: 'core', module: 'fluency', measure: '규칙 필요 위치의 오류', report: '반복되는 조건별 오류', basis: '표준 발음법 제12·17~20·23항; KOLRA 불일치형 규칙' }
    ]
  },
  {
    id: 'C', title: '언어 이해', screening: 'comprehension', subtests: [
      { id: 'C-vocab', title: '어휘', status: 'core', module: 'language', measure: '정답률 (기초·학습·고급 어휘)', report: '어휘 이해', basis: 'Simple View of Reading의 언어이해 요소' },
      { id: 'C-sentence', title: '문장 이해(듣기)', status: 'core', module: 'language', measure: '정답률 · 문장 구조 유형', report: '문장 구조 이해', basis: '피동·사동·관형절·부정 비교 등 문법 구조 이해' },
      { id: 'C-listen', title: '듣기 이해', status: 'core', module: 'language', measure: '정답률 (사실·추론)', report: '해독 부담 없는 이해', basis: 'Simple View of Reading: 듣기 이해 = 언어이해 지표' },
      { id: 'C-morph', title: '낱말 구조 알기 (심화 연구 확장)', status: 'research', extension: 'morphology', module: 'language', measure: '정답률 (합성어·파생어 결합/분해)', report: '형태소 결합·분해 탐색값', basis: '형태소 인식과 읽기의 종단 연구 근거; 연령 공통 핵심 규준은 없어 기본 점수와 분리' }
    ]
  },
  {
    id: 'D', title: '글 이해', screening: 'comprehension', subtests: [
      { id: 'D-fact', title: '사실 이해', status: 'core', module: 'comprehension', measure: '정답률', report: '글에 드러난 정보 찾기', basis: 'PIRLS 이해 과정: 명시적 정보 찾기' },
      { id: 'D-infer', title: '추론', status: 'core', module: 'comprehension', measure: '정답률', report: '드러나지 않은 내용 추론', basis: 'PIRLS 이해 과정: 직접 추론' },
      { id: 'D-eval', title: '평가·판단 (고차 문해 확장)', status: 'research', extension: 'advancedComprehension', module: 'comprehension', measure: '정답률', report: '글의 목적·인물 평가 탐색값', basis: 'PIRLS 이해 과정; 연령·난이도 동등화 전에는 핵심 점수와 분리' },
      { id: 'D-multi', title: '복수 글 비교·출처 평가 (고차 문해 확장)', status: 'research', extension: 'advancedComprehension', module: 'comprehension', measure: '정답률', report: '정보 통합·출처 평가 탐색값', basis: 'PISA 2018 읽기 틀; 아동~성인 공통 핵심으로 쓰지 않고 선택 실시' }
    ]
  }
];
const PREVIEW_SUBTESTS = PLATFORM_PATHS.flatMap(path => path.subtests.filter(subtest => subtest.status === 'preview').map(subtest => ({ ...subtest, pathId: path.id, pathTitle: path.title })));
const subtestDefinition = id => PLATFORM_PATHS.flatMap(path => path.subtests).find(subtest => subtest.id === id) || null;
const assessmentRoleForSubtest = id => subtestDefinition(id)?.status || 'candidate';
