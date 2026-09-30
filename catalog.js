// 전체 검사 플랫폼 구조 (교수님 브리핑 Blueprint v1.2의 세부 경로 A~D).
// status: core = 실제로 실시·채점하는 핵심 모듈, preview = 흐름을 보여주는 화면만 있음(채점·저장 안 함).
// preview 문항은 화면 예시이며 검토·타당화된 문항이 아니다.
const PLATFORM_PATHS = [
  {
    id: 'A', title: '글자·소리 처리와 단어 해독', screening: 'decoding', subtests: [
      { id: 'A-phon', title: '음운인식', status: 'preview', measure: '정답 수 · 정확도', report: '음절·음소 조작 수행', basis: 'KOLRA 음운인식 영역',
        sample: { instruction: '들려주는 말에서 첫소리를 빼면 무엇이 남을까요?', prompt: '🔊 “사과”에서 /사/를 빼면?', options: ['과', '사', '가', '모르겠어요'] } },
      { id: 'A-letter', title: '자모·음절 지식', status: 'preview', measure: '정확도', report: '글자-소리 대응 수행', basis: '한글 초기 읽기, 글자-소리 대응 원리',
        sample: { instruction: '들려주는 소리에 맞는 글자를 고르세요.', prompt: '🔊 /브/', options: ['ㅂ', 'ㅍ', 'ㅁ', 'ㅃ'] } },
      { id: 'A-real', title: '실제단어 읽기', status: 'core', module: 'decoding', measure: '단어·음절 정확도', report: '익숙한 단어 해독' },
      { id: 'A-nonword', title: '무의미단어 읽기', status: 'core', module: 'decoding', measure: '단어·음절 정확도', report: '어휘 도움 없는 해독' },
      { id: 'A-rule', title: '일치/불일치(음운변동) 조건', status: 'core', module: 'decoding', measure: '조건별 정확도·오류', report: '음운규칙 필요 조건의 수행 차' }
    ]
  },
  {
    id: 'B', title: '읽기 유창성', screening: 'fluency', subtests: [
      { id: 'B-auto', title: '단어 자동성', status: 'preview', measure: '정오 + 시간', report: '정확하지만 느린지', basis: '브리핑 v1.2 B 경로 (ROAR 효율 과제 참고)',
        sample: { instruction: '단어를 보이는 대로 빠르고 정확하게 읽으세요. (60초)', prompt: '학교 · 바다 · 연필 · 구름 · 시장 · 달력 · 우유 · 편지', options: ['시작', '중지'] } },
      { id: 'B-oral', title: '연결글 낭독', status: 'core', module: 'fluency', measure: '정확 음절·어절 + 시간', report: '유창성 수준' },
      { id: 'B-error', title: '오류 분석', status: 'core', module: 'fluency', measure: '오류 위치·시각', report: '오류 프로파일' },
      { id: 'B-rule', title: '음운규칙 분석', status: 'core', module: 'decoding', measure: '규칙 필요 위치의 오류', report: '반복되는 조건별 오류' }
    ]
  },
  {
    id: 'C', title: '언어 이해', screening: 'comprehension', subtests: [
      { id: 'C-vocab', title: '어휘', status: 'preview', measure: '정답률', report: '어휘 이해', basis: 'Simple View of Reading의 언어이해 요소',
        sample: { instruction: '뜻이 가장 비슷한 말을 고르세요.', prompt: '“커다란”', options: ['큰', '작은', '빠른', '조용한'] } },
      { id: 'C-sentence', title: '문장·구문 이해', status: 'preview', measure: '정답률 · 문장 유형', report: '문장 이해', basis: '브리핑 v1.2 C 경로 (문장 구조 이해)',
        sample: { instruction: '문장을 듣고 맞는 그림(설명)을 고르세요.', prompt: '🔊 “고양이가 강아지에게 쫓기고 있다.”', options: ['고양이가 도망간다', '강아지가 도망간다', '둘 다 잔다'] } },
      { id: 'C-listen', title: '듣기 이해', status: 'preview', measure: '정답률 · 문항 유형', report: '듣기 이해', basis: '해독 부담 없이 언어이해 확인',
        sample: { instruction: '이야기를 듣고 질문에 답하세요.', prompt: '🔊 (짧은 이야기 재생) · 민지는 왜 강아지를 도와주었나요?', options: ['비를 맞고 있어서', '배가 고파서', '길을 잃어서'] } },
      { id: 'C-morph', title: '형태소 인식*', status: 'preview', measure: '정답률', report: '보조 프로파일', basis: '한국어 단어 구조 정보 (후보·보조 모듈)',
        sample: { instruction: '뜻이 다른 하나를 고르세요.', prompt: '먹이 · 먹보 · 먹물 · 머리', options: ['먹이', '먹보', '먹물', '머리'] } }
    ]
  },
  {
    id: 'D', title: '글 이해', screening: 'comprehension', subtests: [
      { id: 'D-fact', title: '사실정보', status: 'preview', measure: '정답률 + 근거 문항', report: '사실정보 이해', basis: '브리핑 v1.2 D 경로 (정보 찾기)',
        sample: { instruction: '글을 읽고 답하세요.', prompt: '나무는 뿌리로 땅속의 물을 빨아들인다. — 나무는 무엇으로 물을 빨아들이나요?', options: ['뿌리', '잎', '줄기'] } },
      { id: 'D-infer', title: '추론', status: 'preview', measure: '정답률 + 문항 난이도', report: '추론 수행', basis: '여러 단서로 드러나지 않은 내용 도출',
        sample: { instruction: '글에 직접 나오지 않은 내용을 짐작해 보세요.', prompt: '주인이 달려와 민지에게 고맙다고 말했다. — 강아지는 누구의 것이었나요?', options: ['주인', '민지', '가게'] } },
      { id: 'D-eval', title: '평가·판단', status: 'preview', measure: '정답률', report: '평가적 이해', basis: '주장·근거·출처 판단',
        sample: { instruction: '주장을 가장 잘 뒷받침하는 근거를 고르세요.', prompt: '주장: 나무를 더 심어야 한다.', options: ['나무는 그늘과 보금자리를 준다', '나무는 봄에 새잎이 난다', '나무는 키가 크다'] } },
      { id: 'D-advanced', title: '고급 읽기', status: 'preview', measure: '정답률 + 근거 선택', report: '정보통합·출처평가', basis: 'OECD PIAAC 복수 텍스트 처리',
        sample: { instruction: '두 글을 비교해 더 믿을 만한 쪽과 그 이유를 고르세요.', prompt: '글 1: 개인 블로그 · 글 2: 기관 보고서', options: ['글 1', '글 2', '판단할 수 없음'] } }
    ]
  }
];
const PREVIEW_SUBTESTS = PLATFORM_PATHS.flatMap(path => path.subtests.filter(subtest => subtest.status === 'preview').map(subtest => ({ ...subtest, pathId: path.id, pathTitle: path.title })));
