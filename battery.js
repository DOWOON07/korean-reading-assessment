// 음성인식 없이 실시하는 선택형 하위검사 (브리핑 v1.2 경로 A~D의 나머지 하위검사).
// 참여자가 화면을 보고(필요하면 합성 음성으로 듣고) 보기를 누르면 바로 정오와 반응 시간이 저장된다.
// 과제 형식은 공인 검사의 형식을 따르고(근거: docs/DESIGN_EVIDENCE_KO.md 9장), 문항은 이 연구에서 새로 만든 후보 문항이다.
// 문항은 쉬운 것부터 어려운 것 순서이며, demo: true인 문항이 데모 분량이다. 전문가 검토·예비검사 전이다.
const BATTERY_VERSION = 'battery-items-0.1';

const CHOICE_MODULES = {
  phonology: {
    title: '글자·소리 처리', path: 'A', minutes: { demo: 2, full: 4 },
    sections: [
      {
        id: 'A-phon', subtest: 'A-phon', title: '음운인식', audio: true,
        instruction: '말소리를 잘 듣고, 질문에 맞는 소리를 고르세요. 🔊 버튼으로 다시 들을 수 있어요.',
        practice: [{ id: 'AP-P1', type: '음절 탈락', audio: '나무에서 나를 빼면 무엇이 남을까요?', stem: '“나무”에서 “나”를 빼면?', options: ['무', '나', '모', '누'], answer: '무' }],
        items: [
          { id: 'AP-01', type: '음절 탈락', audio: '사과에서 사를 빼면 무엇이 남을까요?', stem: '“사과”에서 “사”를 빼면?', options: ['과', '사', '가', '고'], answer: '과', demo: true },
          { id: 'AP-02', type: '음절 탈락', audio: '자동차에서 동을 빼면 무엇이 남을까요?', stem: '“자동차”에서 “동”을 빼면?', options: ['자차', '동차', '자동', '차자'], answer: '자차' },
          { id: 'AP-03', type: '음절 탈락', audio: '무지개에서 개를 빼면 무엇이 남을까요?', stem: '“무지개”에서 “개”를 빼면?', options: ['무지', '지개', '무개', '개무'], answer: '무지' },
          { id: 'AP-04', type: '음소 탈락', audio: '발에서 첫소리를 빼면 어떤 소리가 남을까요?', stem: '“발”에서 첫소리를 빼면?', options: ['알', '발', '팔', '말'], answer: '알', demo: true },
          { id: 'AP-05', type: '음소 탈락', audio: '눈에서 첫소리를 빼면 어떤 소리가 남을까요?', stem: '“눈”에서 첫소리를 빼면?', options: ['운', '눈', '누', '은'], answer: '운' },
          { id: 'AP-06', type: '음소 탈락', audio: '감에서 끝소리를 빼면 어떤 소리가 남을까요?', stem: '“감”에서 끝소리를 빼면?', options: ['가', '감', '암', '갑'], answer: '가', demo: true },
          { id: 'AP-07', type: '음소 대치', audio: '달의 첫소리를 미음으로 바꾸면 어떤 소리가 될까요?', stem: '“달”의 첫소리를 ㅁ으로 바꾸면?', options: ['말', '달', '살', '맏'], answer: '말' },
          { id: 'AP-08', type: '음소 대치', audio: '공의 가운데 소리를 아로 바꾸면 어떤 소리가 될까요?', stem: '“공”의 가운데 소리를 ㅏ로 바꾸면?', options: ['강', '공', '곰', '궁'], answer: '강', demo: true },
          { id: 'AP-09', type: '음소 대치', audio: '산의 끝소리를 미음으로 바꾸면 어떤 소리가 될까요?', stem: '“산”의 끝소리를 ㅁ으로 바꾸면?', options: ['삼', '산', '상', '감'], answer: '삼' }
        ]
      },
      {
        id: 'A-letter', subtest: 'A-letter', title: '글자-소리 대응', audio: true,
        instruction: '들려주는 낱말과 같은 글자를 고르세요. 보기들은 소리가 비슷하니 잘 들어 보세요.',
        practice: [{ id: 'AL-P1', type: '초성', audio: '물', stem: '들은 낱말은?', options: ['물', '불', '풀', '뿔'], answer: '물' }],
        items: [
          { id: 'AL-01', type: '초성(평음·격음·경음)', audio: '달', stem: '들은 낱말은?', options: ['달', '탈', '딸', '날'], answer: '달', demo: true },
          { id: 'AL-02', type: '초성(평음·격음·경음)', audio: '풀', stem: '들은 낱말은?', options: ['풀', '불', '뿔', '물'], answer: '풀', demo: true },
          { id: 'AL-03', type: '초성(평음·격음·경음)', audio: '짐', stem: '들은 낱말은?', options: ['짐', '침', '찜', '김'], answer: '짐' },
          { id: 'AL-04', type: '초성(평음·격음·경음)', audio: '쌀', stem: '들은 낱말은?', options: ['쌀', '살', '잘', '찰'], answer: '쌀' },
          { id: 'AL-05', type: '받침', audio: '곰', stem: '들은 낱말은?', options: ['곰', '공', '곤', '골'], answer: '곰', demo: true },
          { id: 'AL-06', type: '받침', audio: '강', stem: '들은 낱말은?', options: ['강', '감', '간', '각'], answer: '강' },
          { id: 'AL-07', type: '모음', audio: '귤', stem: '들은 낱말은?', options: ['귤', '굴', '길', '걸'], answer: '귤', demo: true },
          { id: 'AL-08', type: '모음', audio: '귀', stem: '들은 낱말은?', options: ['귀', '기', '구', '게'], answer: '귀' }
        ]
      }
    ]
  },
  silent: {
    title: '단어 재인·묵독 효율', path: 'B', minutes: { demo: 3, full: 5 },
    sections: [
      {
        // ROAR 단어 재인(어휘판단) 형식 (Yeatman 외, 2021; ROAR 기술 매뉴얼): 글자열을 350ms 보여 주고 실제 낱말인지 판단. 응답 시간 제한 없음. 정확도·d′와 반응 시간을 함께 본다.
        id: 'B-lexical', subtest: 'B-lexical', title: '단어 재인 (진짜 낱말 찾기)', format: 'binary', exposureMs: 350,
        binary: [{ value: 'word', label: '진짜 낱말', key: 'F' }, { value: 'nonword', label: '없는 낱말', key: 'J' }],
        instruction: '화면에 나오는 글자가 진짜 있는 낱말이면 “진짜 낱말”(F키), 없는 낱말이면 “없는 낱말”(J키)을 최대한 빠르고 정확하게 누르세요. 소리 내어 읽지 않아도 됩니다.',
        practice: [{ id: 'BL-P1', text: '가방', answer: 'word', type: '실제단어' }, { id: 'BL-P2', text: '도무', answer: 'nonword', type: '비단어' }],
        items: [
          { id: 'BL-01', text: '학교', answer: 'word', type: '실제단어', demo: true },
          { id: 'BL-02', text: '나쿠', answer: 'nonword', type: '비단어', demo: true },
          { id: 'BL-03', text: '사람', answer: 'word', type: '실제단어' },
          { id: 'BL-04', text: '도럼', answer: 'nonword', type: '비단어', demo: true },
          { id: 'BL-05', text: '의자', answer: 'word', type: '실제단어', demo: true },
          { id: 'BL-06', text: '거투', answer: 'nonword', type: '비단어' },
          { id: 'BL-07', text: '바람', answer: 'word', type: '실제단어' },
          { id: 'BL-08', text: '파논', answer: 'nonword', type: '비단어', demo: true },
          { id: 'BL-09', text: '시간', answer: 'word', type: '실제단어' },
          { id: 'BL-10', text: '차두', answer: 'nonword', type: '비단어' },
          { id: 'BL-11', text: '계단', answer: 'word', type: '실제단어' },
          { id: 'BL-12', text: '헤바', answer: 'nonword', type: '비단어' },
          { id: 'BL-13', text: '도서관', answer: 'word', type: '실제단어', demo: true },
          { id: 'BL-14', text: '미자골', answer: 'nonword', type: '비단어', demo: true },
          { id: 'BL-15', text: '소나기', answer: 'word', type: '실제단어', demo: true },
          { id: 'BL-16', text: '소무개', answer: 'nonword', type: '비단어' },
          { id: 'BL-17', text: '거북이', answer: 'word', type: '실제단어' },
          { id: 'BL-18', text: '버미당', answer: 'nonword', type: '비단어' },
          { id: 'BL-19', text: '허수아비', answer: 'word', type: '실제단어', demo: true },
          { id: 'BL-20', text: '투라기모', answer: 'nonword', type: '비단어', demo: true },
          { id: 'BL-21', text: '미끄럼틀', answer: 'word', type: '실제단어', demo: true },
          { id: 'BL-22', text: '가도리손', answer: 'nonword', type: '비단어', demo: true },
          { id: 'BL-23', text: '소용돌이', answer: 'word', type: '실제단어' },
          { id: 'BL-24', text: '마누레지', answer: 'nonword', type: '비단어' }
        ]
      },
      {
        // TOSREC 형식: 짧은 문장을 소리 내지 않고 읽고 맞는지 판단, 제한 시간 안의 (정답 - 오답)이 효율 점수.
        id: 'B-silent', subtest: 'B-silent', title: '묵독 효율 (문장 참·거짓)', format: 'binary', timeLimitSec: { demo: 90, full: 180 },
        binary: [{ value: 'true', label: '맞아요 ⭕', key: 'F' }, { value: 'false', label: '틀려요 ❌', key: 'J' }],
        instruction: '문장을 소리 내지 않고 읽고, 내용이 맞으면 “맞아요”(F키), 틀리면 “틀려요”(J키)를 누르세요. 제한 시간 안에 최대한 많이, 정확하게 푸세요. 다 풀지 못해도 괜찮아요.',
        practice: [{ id: 'BS-P1', text: '공은 둥글다.', answer: 'true', type: '연습' }, { id: 'BS-P2', text: '개는 하늘을 난다.', answer: 'false', type: '연습' }],
        items: [
          ['눈은 하얗다.', true], ['물고기는 하늘을 난다.', false], ['불은 차갑다.', false], ['사과는 먹을 수 있다.', true], ['고양이는 날개가 있다.', false],
          ['겨울에는 날씨가 춥다.', true], ['자동차에는 바퀴가 있다.', true], ['밤에는 해가 뜬다.', false], ['우리는 귀로 소리를 듣는다.', true], ['얼음은 뜨거운 물에 넣으면 녹는다.', true],
          ['연필은 글씨를 쓸 때 쓴다.', true], ['바닷물은 단맛이 난다.', false], ['일주일은 열흘이다.', false], ['비가 오면 우산을 쓴다.', true], ['코끼리는 개미보다 작다.', false],
          ['책은 종이로 만들 수 있다.', true], ['의사는 아픈 사람을 치료한다.', true], ['봄 다음에는 겨울이 온다.', false], ['시계는 날씨를 알려 준다.', false], ['나무는 뿌리로 물을 빨아들인다.', true],
          ['신발은 손에 끼는 물건이다.', false], ['기차는 철길 위를 달린다.', true], ['달걀은 소에서 얻는다.', false], ['냉장고는 음식을 차갑게 보관한다.', true], ['한 시간은 육십 분이다.', true],
          ['거북이는 토끼보다 훨씬 빠르게 달린다.', false], ['도서관에서는 책을 빌릴 수 있다.', true], ['소방관은 불을 끄는 일을 한다.', true], ['한여름에는 눈사람을 만들기 쉽다.', false], ['비행기를 타면 하늘을 날아 다른 나라에 갈 수 있다.', true],
          ['물은 아주 뜨거워지면 얼음이 된다.', false], ['사람은 숨을 쉬지 않고도 하루 종일 살 수 있다.', false], ['우체국에서는 편지와 소포를 보낼 수 있다.', true], ['꽃이 자라려면 햇빛과 물이 필요하다.', true], ['글씨를 쓰기에는 연필보다 지우개가 더 알맞다.', false],
          ['지구는 태양 주위를 돈다.', true], ['박쥐는 낮에만 활동하는 새이다.', false], ['소금을 물에 넣고 저으면 녹는다.', true], ['겨울잠을 자는 동물은 겨울 동안 거의 움직이지 않는다.', true], ['자석은 나무 조각을 강하게 끌어당긴다.', false]
        ].map(([text, truth], index) => ({ id: `BS-${String(index + 1).padStart(2, '0')}`, text, answer: String(truth), type: truth ? '참 문장' : '거짓 문장', demo: true }))
      }
    ]
  },
  language: {
    title: '언어 이해', path: 'C', minutes: { demo: 4, full: 8 },
    sections: [
      {
        id: 'C-vocab', subtest: 'C-vocab', title: '어휘', audio: true,
        instruction: '낱말을 듣고 보면서, 뜻이 가장 비슷한 것을 고르세요.',
        practice: [{ id: 'CV-P1', type: '기초 어휘', audio: '기쁘다', stem: '“기쁘다”', options: ['즐겁다', '슬프다', '무섭다', '배고프다'], answer: '즐겁다' }],
        items: [
          { id: 'CV-01', type: '기초 어휘', audio: '커다랗다', stem: '“커다랗다”', options: ['크다', '작다', '빠르다', '조용하다'], answer: '크다', demo: true },
          { id: 'CV-02', type: '기초 어휘', audio: '시작', stem: '“시작”', options: ['처음', '끝', '중간', '휴식'], answer: '처음' },
          { id: 'CV-03', type: '기초 어휘', audio: '살피다', stem: '“살피다”', options: ['자세히 보다', '빨리 달리다', '크게 웃다', '몰래 숨다'], answer: '자세히 보다' },
          { id: 'CV-04', type: '학습 어휘', audio: '정직하다', stem: '“정직하다”', options: ['거짓이 없다', '힘이 세다', '말이 많다', '겁이 많다'], answer: '거짓이 없다', demo: true },
          { id: 'CV-05', type: '학습 어휘', audio: '모으다', stem: '“모으다”', options: ['한데 합치다', '나누어 주다', '내다 버리다', '몰래 숨기다'], answer: '한데 합치다' },
          { id: 'CV-06', type: '학습 어휘', audio: '예상하다', stem: '“예상하다”', options: ['미리 짐작하다', '뒤늦게 후회하다', '크게 소리치다', '서로 돕다'], answer: '미리 짐작하다' },
          { id: 'CV-07', type: '학습 어휘', audio: '협력하다', stem: '“협력하다”', options: ['힘을 합하다', '서로 다투다', '혼자 쉬다', '먼저 떠나다'], answer: '힘을 합하다', demo: true },
          { id: 'CV-08', type: '고급 어휘', audio: '신속하다', stem: '“신속하다”', options: ['매우 빠르다', '매우 느리다', '매우 무겁다', '매우 조용하다'], answer: '매우 빠르다' },
          { id: 'CV-09', type: '고급 어휘', audio: '번거롭다', stem: '“번거롭다”', options: ['귀찮고 복잡하다', '쉽고 간단하다', '밝고 환하다', '춥고 어둡다'], answer: '귀찮고 복잡하다' },
          { id: 'CV-10', type: '고급 어휘', audio: '간과하다', stem: '“간과하다”', options: ['대수롭지 않게 보아 넘기다', '꼼꼼히 따지다', '크게 칭찬하다', '서둘러 끝내다'], answer: '대수롭지 않게 보아 넘기다', demo: true },
          { id: 'CV-11', type: '고급 어휘', audio: '함축하다', stem: '“함축하다”', options: ['속에 뜻을 담다', '겉으로 드러내다', '길게 늘이다', '여럿으로 나누다'], answer: '속에 뜻을 담다' }
        ]
      },
      {
        id: 'C-sentence', subtest: 'C-sentence', title: '문장 이해 (듣기)', audio: true,
        instruction: '문장을 잘 듣고 질문에 답하세요. 문장은 화면에 나오지 않아요. 🔊 버튼으로 한 번 더 들을 수 있어요.',
        practice: [{ id: 'CS-P1', type: '기본 문장', audio: '아기가 우유를 마신다. 우유를 마시는 것은 누구일까요?', stem: '우유를 마시는 것은?', options: ['아기', '엄마', '강아지'], answer: '아기' }],
        items: [
          { id: 'CS-01', type: '피동', audio: '강아지가 고양이에게 쫓기고 있다. 도망가고 있는 것은 누구일까요?', stem: '도망가고 있는 것은?', options: ['강아지', '고양이', '둘 다 아니다'], answer: '강아지', demo: true },
          { id: 'CS-02', type: '사동', audio: '엄마가 아이에게 밥을 먹였다. 밥을 먹은 사람은 누구일까요?', stem: '밥을 먹은 사람은?', options: ['아이', '엄마', '둘 다'], answer: '아이', demo: true },
          { id: 'CS-03', type: '시간 순서', audio: '민수는 숙제를 하기 전에 저녁을 먹었다. 민수가 먼저 한 일은 무엇일까요?', stem: '민수가 먼저 한 일은?', options: ['저녁 먹기', '숙제하기', '둘을 동시에 했다'], answer: '저녁 먹기' },
          { id: 'CS-04', type: '관형절', audio: '빨간 모자를 쓴 아이가 파란 공을 찼다. 공은 무슨 색일까요?', stem: '공의 색은?', options: ['파란색', '빨간색', '알 수 없다'], answer: '파란색' },
          { id: 'CS-05', type: '부정·비교', audio: '형은 동생보다 키가 크지 않다. 다음 중 맞는 것은 무엇일까요?', stem: '맞는 것은?', options: ['동생이 형보다 크거나 둘이 같다', '형이 동생보다 크다', '알 수 없다'], answer: '동생이 형보다 크거나 둘이 같다', demo: true },
          { id: 'CS-06', type: '관형절', audio: '경찰이 도둑을 잡은 사람에게 상을 주었다. 상을 받은 사람은 누구일까요?', stem: '상을 받은 사람은?', options: ['도둑을 잡은 사람', '경찰', '도둑'], answer: '도둑을 잡은 사람', demo: true },
          { id: 'CS-07', type: '인과', audio: '비가 왔기 때문에 소풍이 취소되었다. 소풍이 취소된 까닭은 무엇일까요?', stem: '소풍이 취소된 까닭은?', options: ['비가 와서', '소풍을 다녀와서', '알 수 없다'], answer: '비가 와서' },
          { id: 'CS-08', type: '사동', audio: '할머니께서 손자에게 책을 읽히셨다. 책을 읽은 사람은 누구일까요?', stem: '책을 읽은 사람은?', options: ['손자', '할머니', '둘 다'], answer: '손자' }
        ]
      },
      {
        id: 'C-listen', subtest: 'C-listen', title: '듣기 이해', audio: true, listenOnly: true,
        passage: '지호는 토요일 아침에 할아버지와 함께 산에 올랐다. 산 중턱에서 지호는 다리가 아프다며 바위에 앉았다. 할아버지는 가방에서 오이를 꺼내 지호에게 건넸다. 오이를 먹고 힘을 낸 지호는 정상까지 올라갔다. 정상에서 내려다본 마을은 장난감처럼 작아 보였다. 집에 돌아온 지호는 일기장에 “다음에는 내가 할아버지 가방을 들어 드려야지.”라고 적었다.',
        instruction: '짧은 이야기를 들려줍니다. 이야기는 화면에 나오지 않아요. 잘 듣고 질문에 답하세요. 이야기는 두 번까지 다시 들을 수 있어요.',
        items: [
          { id: 'CL-01', type: '사실', audio: '지호는 누구와 산에 올랐나요?', stem: '지호는 누구와 산에 올랐나요?', options: ['할아버지', '아버지', '친구', '선생님'], answer: '할아버지', demo: true },
          { id: 'CL-02', type: '사실', audio: '할아버지가 지호에게 준 것은 무엇인가요?', stem: '할아버지가 지호에게 준 것은?', options: ['오이', '물', '사과', '초콜릿'], answer: '오이', demo: true },
          { id: 'CL-03', type: '추론', audio: '정상에서 본 마을이 작아 보인 까닭은 무엇일까요?', stem: '정상에서 본 마을이 작아 보인 까닭은?', options: ['높은 곳에서 멀리 내려다보아서', '마을이 원래 작아서', '안개가 끼어서', '지호가 피곤해서'], answer: '높은 곳에서 멀리 내려다보아서', demo: true },
          { id: 'CL-04', type: '추론', audio: '일기 내용으로 보아 지호는 어떤 마음일까요?', stem: '일기로 보아 지호의 마음은?', options: ['할아버지께 고맙고 도와 드리고 싶다', '산에 다시는 가기 싫다', '오이가 맛이 없었다', '혼자 산에 가고 싶다'], answer: '할아버지께 고맙고 도와 드리고 싶다', demo: true }
        ]
      },
      {
        id: 'C-morph', subtest: 'C-morph', title: '형태소 인식',
        instruction: '낱말 속의 같은 글자가 같은 뜻으로 쓰였는지 생각하며 답하세요.',
        practice: [{ id: 'CM-P1', type: '고유어 형태소', stem: '“밤”의 뜻이 다른 하나는?', options: ['밤송이', '밤하늘', '밤길', '밤새'], answer: '밤송이' }],
        items: [
          { id: 'CM-01', type: '고유어 형태소', stem: '“눈”의 뜻이 다른 하나는?', options: ['눈물', '눈사람', '눈썰매', '눈보라'], answer: '눈물', demo: true },
          { id: 'CM-02', type: '고유어 형태소', stem: '“먹”의 뜻이 다른 하나는?', options: ['먹물', '먹이', '먹보', '먹성'], answer: '먹물' },
          { id: 'CM-03', type: '고유어 형태소', stem: '“손”의 뜻이 다른 하나는?', options: ['손님', '손목', '손등', '손톱'], answer: '손님', demo: true },
          { id: 'CM-04', type: '접사', stem: '“-개”가 ‘무엇을 하는 도구’라는 뜻이 아닌 것은?', options: ['무지개', '지우개', '덮개', '베개'], answer: '무지개' },
          { id: 'CM-05', type: '접사', stem: '“-질”이 ‘어떤 행동을 함’이라는 뜻이 아닌 것은?', options: ['질문', '가위질', '걸레질', '바느질'], answer: '질문' },
          { id: 'CM-06', type: '한자어 형태소', stem: '“소방관”의 “관”과 같은 뜻으로 쓰인 것은?', options: ['경찰관', '도서관', '영화관', '체육관'], answer: '경찰관', demo: true },
          { id: 'CM-07', type: '한자어 형태소', stem: '“불가능”의 “불”과 같은 뜻으로 쓰인 것은?', options: ['불공평', '불꽃', '불고기', '불빛'], answer: '불공평', demo: true },
          { id: 'CM-08', type: '접두사', stem: '“풋-”이 ‘덜 익은, 처음 나온’이라는 뜻이 아닌 것은?', options: ['풋볼', '풋사과', '풋고추', '풋내기'], answer: '풋볼' }
        ]
      }
    ]
  },
  comprehension: {
    title: '글 이해', path: 'D', minutes: { demo: 4, full: 8 },
    sections: [
      {
        id: 'D-p1', title: '글 읽고 답하기 ① 설명글', demo: true,
        passage: '꿀벌은 꽃에서 꽃가루와 꿀을 모은다. 꿀벌이 이 꽃 저 꽃으로 날아다니는 동안 몸에 묻은 꽃가루가 다른 꽃으로 옮겨진다. 이렇게 꽃가루가 옮겨져야 많은 식물이 열매를 맺을 수 있다. 우리가 먹는 사과, 딸기, 호박도 꿀벌의 도움을 받는다. 그런데 최근 여러 나라에서 꿀벌의 수가 크게 줄었다는 보고가 이어지고 있다. 과학자들은 농약 사용과 기후 변화를 주요 원인으로 꼽는다.',
        instruction: '글을 읽고 질문에 답하세요. 글은 답하는 동안 계속 볼 수 있어요.',
        items: [
          { id: 'D1-01', subtest: 'D-fact', type: '사실', stem: '꿀벌이 꽃에서 모으는 것은?', options: ['꽃가루와 꿀', '물과 흙', '씨앗과 잎', '열매와 줄기'], answer: '꽃가루와 꿀', demo: true },
          { id: 'D1-02', subtest: 'D-fact', type: '사실', stem: '과학자들이 꼽은 꿀벌 감소의 주요 원인은?', options: ['농약 사용과 기후 변화', '꽃이 너무 많아짐', '사과를 많이 심음', '꿀을 많이 먹음'], answer: '농약 사용과 기후 변화' },
          { id: 'D1-03', subtest: 'D-infer', type: '추론', stem: '꿀벌이 계속 줄어든다면 일어날 수 있는 일은?', options: ['사과 같은 열매를 얻기 어려워진다', '꽃이 더 많이 핀다', '비가 더 자주 온다', '농약이 필요 없어진다'], answer: '사과 같은 열매를 얻기 어려워진다', demo: true },
          { id: 'D1-04', subtest: 'D-eval', type: '평가', stem: '이 글을 쓴 목적으로 가장 알맞은 것은?', options: ['꿀벌의 역할과 위기를 알리려고', '꿀을 팔려고', '꿀벌을 무서워하게 하려고', '사과 기르는 법을 가르치려고'], answer: '꿀벌의 역할과 위기를 알리려고', demo: true }
        ]
      },
      {
        id: 'D-p2', title: '글 읽고 답하기 ② 이야기글',
        passage: '비가 그친 오후, 서윤이는 놀이터 구석에서 젖은 새끼 고양이를 발견했다. 서윤이는 입고 있던 겉옷을 벗어 고양이를 감쌌다. 집에 데려가고 싶었지만, 엄마가 고양이 털 때문에 기침을 한다는 것이 떠올랐다. 서윤이는 잠시 고민하다가 동물 병원으로 발걸음을 옮겼다. 의사 선생님은 “네 덕분에 이 녀석이 감기에 걸리지 않겠구나.” 하며 웃었다.',
        instruction: '글을 읽고 질문에 답하세요.',
        items: [
          { id: 'D2-01', subtest: 'D-fact', type: '사실', stem: '서윤이가 고양이를 감싼 것은?', options: ['겉옷', '수건', '우산', '가방'], answer: '겉옷' },
          { id: 'D2-02', subtest: 'D-infer', type: '추론', stem: '서윤이가 고양이를 집에 데려가지 않은 까닭은?', options: ['엄마가 고양이 털 때문에 기침을 해서', '고양이가 싫어서', '비가 다시 와서', '집이 멀어서'], answer: '엄마가 고양이 털 때문에 기침을 해서' },
          { id: 'D2-03', subtest: 'D-infer', type: '추론', stem: '의사 선생님의 말로 보아 서윤이의 행동은?', options: ['고양이에게 도움이 되었다', '고양이를 아프게 했다', '쓸데없는 일이었다', '위험한 일이었다'], answer: '고양이에게 도움이 되었다' },
          { id: 'D2-04', subtest: 'D-eval', type: '평가', stem: '서윤이에 대한 평가로 가장 알맞은 것은?', options: ['어려운 상황에서도 책임감 있게 행동했다', '엄마 말을 듣지 않았다', '고양이를 무서워했다', '친구를 기다리기만 했다'], answer: '어려운 상황에서도 책임감 있게 행동했다' }
        ]
      },
      {
        id: 'D-p3', title: '두 글 비교하기', demo: true,
        passage: '[글 가] 개인 블로그 (2019년)\n아침밥을 거르면 무조건 살이 찐대요! 제 친구도 아침을 안 먹더니 살이 쪘어요.\n\n[글 나] 보건 기관 안내문 (2024년)\n아침 식사와 체중의 관계는 연구마다 결과가 다르다. 아침을 먹는지보다 하루 전체의 식사량과 식사의 질이 더 중요하다는 연구가 많다.',
        instruction: '두 글을 읽고 질문에 답하세요.',
        items: [
          { id: 'D3-01', subtest: 'D-multi', type: '출처 평가', stem: '두 글 중 더 믿을 만한 글과 그 까닭은?', options: ['글 나: 기관이 여러 연구를 근거로 썼다', '글 가: 친구의 실제 경험이다', '글 가: 더 짧고 분명하다', '두 글의 믿을 만한 정도가 같다'], answer: '글 나: 기관이 여러 연구를 근거로 썼다', demo: true },
          { id: 'D3-02', subtest: 'D-multi', type: '주장 평가', stem: '글 가의 주장에서 문제가 되는 점은?', options: ['한 사람의 사례로 모두가 그렇다고 단정했다', '아침밥 이야기를 했다', '날짜를 밝혔다', '높임말을 썼다'], answer: '한 사람의 사례로 모두가 그렇다고 단정했다', demo: true },
          { id: 'D3-03', subtest: 'D-multi', type: '정보 통합', stem: '두 글을 종합한 결론으로 가장 알맞은 것은?', options: ['아침 식사만으로 체중 변화를 단정하기 어렵다', '아침을 먹으면 반드시 살이 빠진다', '아침을 거르면 반드시 살이 찐다', '체중은 식사와 관계가 없다'], answer: '아침 식사만으로 체중 변화를 단정하기 어렵다' }
        ]
      }
    ]
  }
};

// 하위검사 이름 (경로 카드·결과지 공통)
const CHOICE_SUBTEST_TITLES = {
  'A-phon': '음운인식', 'A-letter': '글자-소리 대응', 'B-lexical': '단어 자동성 (단어 재인)', 'B-silent': '묵독 효율(문장 참·거짓)',
  'C-vocab': '어휘', 'C-sentence': '문장 이해', 'C-listen': '듣기 이해', 'C-morph': '형태소 인식',
  'D-fact': '사실 이해', 'D-infer': '추론', 'D-eval': '평가·판단', 'D-multi': '복수 글 비교·출처 평가'
};

// 보기 순서: 모든 참여자에게 같은 순서(표준화)이되, 정답 위치가 고르게 퍼지도록 정한다.
// 하위검사마다 보기 수만큼의 위치를 한 묶음씩 섞어(블록 무작위화) 정답 위치를 배정하고, 오답 보기 순서도 섞는다. 난수는 ID로 고정한다.
function seededRandom(text) {
  let seed = [...text].reduce((hash, char) => Math.imul(hash ^ char.charCodeAt(0), 2654435761) >>> 0, 2166136261);
  return () => { seed = (seed + 0x6D2B79F5) >>> 0; let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function shuffled(list, random) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; }
  return copy;
}
const OPTION_ORDERS = {};
for (const module of Object.values(CHOICE_MODULES)) for (const section of module.sections) {
  const random = seededRandom(section.id);
  const blocks = {};
  for (const item of [...(section.practice || []), ...section.items]) {
    if (!item.options) continue;
    const n = item.options.length;
    if (!blocks[n]?.length) blocks[n] = shuffled([...Array(n).keys()], random);
    const position = blocks[n].pop();
    const others = shuffled(item.options.filter(option => option !== item.answer), random);
    others.splice(position, 0, item.answer);
    OPTION_ORDERS[item.id] = others;
  }
}
const fixedOptionOrder = item => OPTION_ORDERS[item.id] || item.options;
