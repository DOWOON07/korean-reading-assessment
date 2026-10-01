# 설계 근거서: 단어 해독·읽기 유창성 모듈 (v0.4)

이 문서는 프로토타입의 설계 결정마다 **무엇을 만들었는지(코드 위치)**와 **왜 그렇게 만들었는지(근거)**를 짝지어 기록한다.
근거는 2026-09-30에 원문 또는 공식 서지 레코드를 직접 열어 확인했다. 확인 수준은 다음과 같이 표시한다.

- ✅ 확인: 원문이나 공식 서지에서 해당 사실을 직접 확인함
- 🔶 부분 확인: 출처는 확인했으나 일부만 확인했거나 2차 문헌을 통해 확인함 (논문에 인용하기 전 원문 대조 필요)
- 📐 우리 설계: 문헌 근거가 아니라 팀의 설계 판단이며, 검증 대상임

프로젝트 내부 기준 문서: 「한국어 디지털 읽기평가 핵심 두 모듈 설계도 v0.2」(이하 설계도), 「교수님 브리핑 Blueprint v1.2」(이하 브리핑), `IMPLEMENTATION_PLAN.md`.

---

## 1. 전체 원칙

| 설계 결정 | 구현 | 근거 | 확인 |
|---|---|---|---|
| 해독과 언어이해를 나눠 측정하고, 먼저 해독·유창성을 깊게 만든다 | `catalog.js` 경로 A~D, 핵심은 A·B | Simple View of Reading: Gough & Tunmer (1986); Hoover & Gough (1990) | ✅ |
| 한국어 검사에서 해독·음운처리·유창성·이해를 핵심 영역으로 둔다 | 경로 구조 | KOLRA(배소영 외, 2015)의 소검사 구성 — 이은주(2021) 및 인천시교육청 가이드북(2025) p.17을 통해 확인 | 🔶 |
| **시스템이 듣고 자동 채점한다 (사람 채점 없음)** | 녹음 → 기기 안 음성인식 → `autoDecodingRating`·`autoFluencyRating` → 결과지 (`app.js` `autoScoreResponse`) | 목적: 누구나 디지털로 쉽게 접근해 자신의 읽기 능력을 평가받고, 필요하면 대면 심층 검사로 이어지게 함 (사용자 결정, 2026-10-01). 자동 읽기평가 선행 사례: FLORA (Bolaños et al., 2011), van der Velde et al. (2025) | 📐 / ✅ |
| 음성인식 오류는 측정 도구의 한계로 결과지에 밝힌다 | 결과지 '이 결과의 한계' | 자동-사람 일치도는 과제에 따라 중간 수준: 단어 해독 MCC 0.43, 글 읽기 MCC 0.55 (van der Velde et al., 2025). 아동 음성의 단어 오류율은 성인의 2~5배 (Potamianos & Narayanan, 2003). 일치도는 연구용 검증 화면에서 따로 측정 | ✅ |
| 결과에 따라 대면 심층 읽기검사를 안내한다 | 결과지 '다음 단계 안내' (해독 정확도 90% 미만, 음운변동 표기대로 읽음, 낭독 정확도·속도 임시 기준 미만) | 브리핑 v1.2 1장 (선별 → 필요한 정밀 평가로 안내). 기준값은 임시값 | 📐 |
| 진단·표준점수·백분위를 제공하지 않는다 | 결과지 8·9층 공란, "진단 아님" 문구 | 규준은 대표 표본과 신뢰도·타당도 증거가 있어야 함 — AERA·APA·NCME (2014) *Standards* (해당 조항 문구는 원문 대조 필요) | 🔶 |

## 1-1. 짧은 선별검사와 경로 추천

| 설계 결정 | 구현 | 근거 | 확인 |
|---|---|---|---|
| 짧은 공통 선별 → 필요한 세부 경로로 안내, 복수 경로 허용 | `screen()`, `S.screeningDecision` | 브리핑 v1.2 1·2장 (선별은 진단이 아니라 "어디를 더 볼지" 정하는 입구) | 📐 |
| 이번 버전의 선별은 기초 해독(→A)과 유창성(→B) 두 축만 실시 | 단어 8개 + 문장 낭독 1편 | 브리핑 2장 선별 축 중 두 핵심 모듈 우선 (사용자 결정, 2026-10-01) | 📐 |
| 선별 단어를 세부검사와 같은 2×2에서 칸마다 2개씩 뽑아 "모듈 안 중점 확인 포인트"를 정함 | `focus` (음운변동 규칙, 비단어 해독, 기초 대응, 머뭇거림, 낭독 정확도, 속도) | 해독 2×2 설계의 근거와 동일 (2장) | 📐 |
| "정확하지만 느림 → B", "부정확 → A" | 문장 낭독 정확도와 분당 정확 음절 | 브리핑 2장 표 "정확하지만 느림 → B 유창성" | 📐 |
| 선별도 참여자가 혼자 읽고 시스템이 자동 채점 | 낱말이 뜨면 바로 녹음, '다음'으로 넘김 → 음성인식 → 자동 채점 → `screeningDecision` | 혼자 실시하는 온라인 읽기평가 선례: Yeatman et al. (2021) ROAR | 📐 / ✅ |
| 검사 분량: 데모(선별 단어 4·해독 8문항·지문 1편)와 전체(8·16·2) | 정보 입력 화면 `length`, `LENGTHS` | 프로토타입 시연용 축소. 2×2 칸마다 2문항(선별은 1문항)을 남겨 조건 비교 구조는 유지 | 📐 |
| 기준값은 임시값, 경계에서는 경로를 포함 (위음성 회피) | `SCREENING_CONFIG` (`screening-rule-0.2-provisional`) | 선별 도구는 민감도를 우선한다는 권고: Jenkins, Hudson & Johnson (2007) — 원문 대조 필요. 브리핑 10장: cutoff는 민감도·특이도로 파일럿 검증 후 확정 | 🔶 |
| 추천 경로를 바꿀 수 있고 바꾼 내역을 기록 | `session.routing` (recommended/final/added/removed) | 추천 근거와 사람 판단을 모두 남기는 원칙 (설계도 6장) | 📐 |
| 결과지에서 선별 신호와 세부검사 결과를 나란히 비교 | 결과지 2층 연결표 | 선별 기준 검증 자료(브리핑 10장 "선별이 필요한 세부검사를 잘 찾아내는가?") | 📐 |

## 2. 단어 해독 모듈

| 설계 결정 | 구현 | 근거 | 확인 |
|---|---|---|---|
| 실제단어와 비단어를 나눈다 | `stimuli.decoding[].lexicality` | 비단어 읽기는 음운 해독을 가장 직접적으로 보여준다: Rack, Snowling & Olson (1992); 이중경로 관점 Castles & Coltheart (1993) | ✅ |
| 표기-발음 일치 / 음운변동 필요 조건을 나눈다 (2×2) | `regularity`, 결과지 4층 2×2 표 | KOLRA 해독 문항은 의미·무의미 단어 각 40문항, 자소-음소 일치형·불일치형 각 20문항, 불일치형에 된소리되기·비음화·구개음화·설측음화 등 적용 (이은주, 2021) | 🔶 |
| 허용 발음을 **목록**으로 저장 (`accepted: []`) | `app.js` 문항 정의 | 설계도 3.4·4.4 "허용 발음 변이는 정답" | 📐 |
| 허용 발음은 표준 발음법으로 만든다 | 국물[궁물] 제18항 비음화, 꽃잎[꼰닙] 제29항 ㄴ첨가, 옷리→[온니] 제9·18항, 같이[가치] 제17항 구개음화 적용, 설날[설랄] 제20항 유음화 적용 | 「표준어 규정」 제2부 표준 발음법 (문교부 고시 제88-2호, 1988). 국물·꽃잎은 조항 예시에 있음. 같이·설날은 규칙 적용 결과이며 조항 예시는 아님(예시: 굳이[구지], 칼날[칼랄]) | 🔶 (미러 원문 확인, 공식 사이트 재대조 필요) |
| 비단어의 문제 표시: 각물[강물]·밭문[반문]은 실제 단어 발음과 같음, 두밋[두믿]은 받침 중화로 '일치' 조건에 부적합, 가눔은 '가누다' 명사형 | `reviewNote` → 검토 화면·결과지 | 표준 발음법 제9항(대표음), 제18항(비음화)을 적용한 결과 | 📐 (규칙 적용은 🔶) |
| 전사를 음절 단위로 정렬해 대치·생략·삽입의 **위치**와 초성·중성·받침 차이를 찾는다 | `scoring.js` `alignSyllables`, `jamoDiff` | 편집거리: Levenshtein (1966). 한글 음절 = 초성·중성·종성 조합 (유니코드 한글 음절 배열) | ✅ |
| 첫 시도와 최종 시도를 나누고 3초 안 자기수정은 정답 | 전사 규약 `/`, 시각 사건, `selfCorrectionCheck` | DIBELS 8 가이드 p.76: "Words self-corrected within three seconds are scored as accurate" | ✅ |
| 3초 값은 **설정값**으로 둔다 (`SCORING_CONFIG.selfCorrectionWindowMs`) | `scoring.js` | DIBELS는 영어 검사이며 한국어 전 연령 검증값이 아님 (설계도 3.5) | 📐 |
| 3초 넘게 반응이 없으면 "머뭇거림 후보"로만 표시하고 단어는 알려주지 않음 | `hesitationCheck` | DIBELS 8 NWF: 3초 머뭇거리면 오류로 표시하고 다음 항목으로 넘어감(단어를 알려주지 않음). ORF는 단어를 알려줌 — 해독 과제는 NWF 방식을 따름 | ✅ |
| 반응 시작 시간(onset latency)을 자동 추정 | `detectSpeech` (에너지 기반), 제시 시각 + 녹음 내 발화 시작 | 에너지 기반 발화 끝점 검출: Rabiner & Sambur (1975). 설계도 3.4 "탐색 지표" | ✅ |

## 3. 읽기 유창성 모듈

| 설계 결정 | 구현 | 근거 | 확인 |
|---|---|---|---|
| 소리 내어 읽기의 정확도와 속도를 핵심 지표로 | 정확도, 분당 정확 어절·음절 | CBM 읽기유창성: Deno (1985); 읽기 능력 지표로서의 타당성: Fuchs, Fuchs, Hosp & Jenkins (2001) | ✅ (서지) |
| 첫 60초 값을 따로 저장 | `first60`, 60초 마커 | DIBELS 8 ORF는 1분 동안 정확히 읽은 단어 수 (가이드 p.76). WCPM 규준 예: Hasbrouck & Tindal (2017) | ✅ |
| 지문 전체도 끝까지 녹음 | 녹음은 60초 뒤에도 계속 | 설계도 4.2 | 📐 |
| 생략·대치·도움 제공은 오답, 삽입은 점수 없이 기록, 반복은 한 번만 인정, 자기수정은 정답 | `computeFluency` | DIBELS 8 ORF 채점 연습 자료: 삽입·반복 "Ignore, and do not give credit", 생략·대치 오류, 3초 머뭇거림은 단어를 알려주고 오답, 자기수정 "SC" 정답 | ✅ |
| 음절과 어절을 **둘 다** 계산 | `correctSyllables`, `correctEojeol` | 국내 BASA 읽기는 제한 시간 안에 정확히 읽은 글자 수로 측정 (인천시교육청 가이드북 2025 p.22). 한국어 대표 단위는 아직 합의 안 됨 (설계도 4.3) | 🔶 |
| 대치 어절은 실제로 읽은 말을 적으면 음절 단위로 부분 인정 | `syllableMatches` | 음절 기준 값 보존 (설계도 4.3) | 📐 |
| 타이머는 첫 발화부터 | 자동 발화 시작 + 사람이 마커 수정, 둘 다 저장 | 설계도 4.2, 계획서 단계 3 완료 기준 | 📐 |
| 판단이 어려운 어절은 보류, 분자·분모에서 제외 | `unclear` 표시 | 설계도 4.4 "사투리 또는 오류가 불명확 → 자동 확정 금지" | 📐 |

## 4. 기기 안 음성인식과 자동 채점

| 설계 결정 | 구현 | 근거 | 확인 |
|---|---|---|---|
| Whisper를 쓴다 | `asr.js`, Transformers.js 3.8.1 | 68만 시간 다국어 약지도 학습, 한국어 포함: Radford et al. (2023) | ✅ |
| 기본 모델은 **Whisper large-v3-turbo** (WebGPU, 4비트 양자화, 약 0.6~0.8GB 1회 다운로드). WebGPU가 없으면 Whisper small, 그다음 base | `onnx-community/whisper-large-v3-turbo_timestamped` → `whisper-small_timestamped` → `whisper-base_timestamped` | turbo는 large-v3의 디코더를 32층에서 4층으로 줄인 809M 모델로 "약간의 품질 저하로 훨씬 빠름"(OpenAI 모델 카드). 2024-10-01 공개, 다국어 성능은 large-v2와 비슷(OpenAI whisper Discussion #2363). 한국어는 CER로 평가 | ✅ |
| 음성은 브라우저 밖으로 보내지 않는다 | 브라우저 안(WebGPU/WebAssembly)에서 실행 | 개인 음성 보호 (설계도 6장 데이터 원칙). 클라우드 STT(예: 한국어 특화 상용 API)는 정확도가 더 높을 수 있으나 음성 외부 전송과 키 관리가 필요해 이번 버전에서 제외 | 📐 |
| 마이크 점검 때 모델을 미리 받는다 | `preloadAsr()`, 첫 화면 '음성인식 모델 미리 받기' | 검사 중·후 대기 시간 줄이기 | 📐 |
| 단어 단위 시각 | `return_timestamps: 'word'`, 실패 시 구간 시각으로 내려감 | Whisper 교차 어텐션 정렬 헤드 + DTW: OpenAI `whisper/timing.py`; Louradour (2023) whisper-timestamped; Transformers.js 문서 | ✅ |
| 해독 자동 채점: 인식 문자열을 전사 규약으로 바꾸고(띄어 쓴 조각이 목표 길이에 가까우면 다시 읽기 `/`, 짧으면 나누어 읽기 `-`) 허용 발음과 음절 정렬해 정오·오류 위치·표기대로 읽음 판정 | `asrToTranscript`, `autoDecodingRating` | 편집거리 정렬 (Levenshtein, 1966); 설계도 3장 채점 규칙 | ✅ / 📐 |
| 유창성 자동 채점: 인식 단어열을 지문 어절열에 동적계획법으로 정렬해 대치·생략·삽입을 표시하고, 발화 탐지의 긴 멈춤을 다음 어절에 붙이며, 시간은 발화 시작~끝 | `alignWordsToPassage` (어긋남 비용 0.75 < 전면 대치 1), `autoFluencyRating` | 자동 WCPM이 사람 채점과 3~4단어 이내 (FLORA; Bolaños et al., 2011) | ✅ |
| 알려진 음성인식 한계를 결과지에 밝힌다 | '이 결과의 한계' | ASR은 반복·군말 같은 비유창성을 지우도록 학습되어 축어 전사가 드묾 (Dietz et al., 2025). 환각 약 1% (Koenecke et al., 2024). 비단어를 실제 단어로 바꿔 듣는다는 직접 정량 연구는 **원문 확인 못 함** | ✅ / 🔶 |

## 5. 자동 채점 검증 (연구용)

| 설계 결정 | 구현 | 근거 | 확인 |
|---|---|---|---|
| 사람 채점은 점수에 쓰지 않고 자동 채점 정확도를 검증하는 데만 쓴다 | 연구용 검증 화면(기존 검토 화면), 결과지 '자동 채점 검증' 표 | 브리핑 10장 "자동채점 일치도" 검증 단계; van der Velde et al. (2025)의 인간-자동 일치도 보고 방식 | ✅ |
| 일치율과 Cohen's κ를 보고 | `cohensKappa`, `autoVerification` | Cohen (1960) | ✅ |
| κ 해석 구간(약간·어느 정도·중간·상당·거의 완전) | `kappaLabel` | Landis & Koch (1977) — 관례적 구간이며 합격 기준이 아님 | ✅ (구간 표는 2차 문헌 경유) |

## 6. 결과지의 분석 방법

| 설계 결정 | 구현 | 근거 | 확인 |
|---|---|---|---|
| 모든 비율에 95% 신뢰구간을 붙인다 | `wilsonInterval` | Wilson (1927) 점수 구간. 문항 수가 적을 때 Wald 구간보다 적절 (Brown, Cai & DasGupta, 2001). 단위 테스트: 8/10 → 49.0~94.3% | ✅ |
| 조건 차이(실제−비단어, 일치−음운변동)는 차이의 신뢰구간이 0을 포함하지 않을 때만 "차이가 있다"고 쓴다 | `proportionDifference`, 결과지 4층 분석 | Newcombe (1998) 방법 10. 단위 테스트: 논문 예 56/70 vs 48/80 → 5.24~33.36%p 재현 | ✅ |
| 구간 끝이 0에서 5%p 안이면 "경계선, 재확인 필요"를 덧붙인다 | `compareConditions` | 적은 문항 수에서 과잉 해석을 막는 보수적 규칙 | 📐 |
| 분석 문장은 관찰(숫자) → 해석(가설 수준) → 근거 순서로 쓴다 | `findingsHtml` | 결과지는 진단이 아니라 근거 추적 가능한 기술 (브리핑 8장, 설계도 1장) | 📐 |
| 한국어 규준이 없으므로 속도 수준(느림/빠름) 판정을 하지 않는다 | 결과지 6층 분석 | 규준에는 대표 표본이 필요 (AERA 외, 2014) | 🔶 |
| 어절 끝 음절만 다른 대치를 따로 센다 (조사·어미 자리) | `fluencyFindings` | 한국어 어절 = 어간 + 조사·어미 구조. 해석은 가설로만 표기 | 📐 |

## 7. 결과지 구조

결과지(`report.js`)는 브리핑 v1.2 8장의 10개 층을 그대로 따른다: 1 검사 품질/기본정보, 2 핵심 요약, 3 5영역 프로파일, 4 하위검사 결과, 5 오류 프로파일, 6 수행 효율, 7 근거 추적, 8 규준 위치*, 9 변화 추적*, 10 해석 주의.
두 핵심 모듈만 원점수로 채우고, 실시하지 않은 영역과 규준·변화 추적은 공란으로 둔다. 📐

## 8. 이번 버전에서 확인하지 못한 것 (정직하게 밝힐 부분)

1. 실제 사람 목소리로 발화 탐지와 음성인식을 시험하지 않았다 (가상 마이크와 대체 모듈로만 흐름을 확인).
2. Whisper 모델(large-v3-turbo 포함)은 개발 환경의 네트워크 정책 때문에 내려받지 못해, 실제 한국어 인식 품질과 자동 채점 정확도는 확인하지 못했다(대체 모듈로 흐름만 확인).
3. BASA 읽기의 "1분·음절" 채점 방식, AERA 표준의 조항 문구, 표준 발음법의 공식 사이트 원문은 2차 자료나 미러로만 확인했다.
4. 문항·지문은 기능 시험용 후보이며 전문가 검토와 파일럿 자료가 없다.

---

## 참고문헌

- AERA, APA, & NCME. (2014). *Standards for Educational and Psychological Testing.* AERA. https://www.testingstandards.net/uploads/7/6/6/4/76643089/standards_2014edition.pdf
- Bolaños, D., Cole, R. A., Ward, W., Borts, E., & Svirsky, E. (2011). FLORA: Fluent oral reading assessment of children's speech. *ACM Transactions on Speech and Language Processing, 7*(4), 16. https://doi.org/10.1145/1998384.1998390
- Brown, L. D., Cai, T. T., & DasGupta, A. (2001). Interval estimation for a binomial proportion. *Statistical Science, 16*(2), 101–133. https://doi.org/10.1214/ss/1009213286
- Castles, A., & Coltheart, M. (1993). Varieties of developmental dyslexia. *Cognition, 47*(2), 149–180. https://doi.org/10.1016/0010-0277(93)90003-E
- Cohen, J. (1960). A coefficient of agreement for nominal scales. *Educational and Psychological Measurement, 20*(1), 37–46. https://doi.org/10.1177/001316446002000104
- Deno, S. L. (1985). Curriculum-based measurement: The emerging alternative. *Exceptional Children, 52*(3), 219–232. https://doi.org/10.1177/001440298505200303
- Dietz, G., Yee, D., Chen, J. K., & Findlater, L. (2025). Prompting Whisper for improved verbatim transcription and end-to-end miscue detection. *Interspeech 2025.* https://arxiv.org/abs/2505.23627
- Fuchs, L. S., Fuchs, D., Hosp, M. K., & Jenkins, J. R. (2001). Oral reading fluency as an indicator of reading competence. *Scientific Studies of Reading, 5*(3), 239–256. https://doi.org/10.1207/S1532799XSSR0503_3
- Gough, P. B., & Tunmer, W. E. (1986). Decoding, reading, and reading disability. *Remedial and Special Education, 7*(1), 6–10. https://doi.org/10.1177/074193258600700104
- Hasbrouck, J., & Tindal, G. (2017). *An update to compiled ORF norms* (Tech. Rep. No. 1702). University of Oregon. https://files.eric.ed.gov/fulltext/ED594994.pdf
- Hoover, W. A., & Gough, P. B. (1990). The simple view of reading. *Reading and Writing, 2*(2), 127–160. https://doi.org/10.1007/BF00401799
- Jenkins, J. R., Hudson, R. F., & Johnson, E. S. (2007). Screening for at-risk readers in a response to intervention framework. *School Psychology Review, 36*(4), 582–600. (서지 확인 필요)
- Koenecke, A., Choi, A. S. G., Mei, K. X., Schellmann, H., & Sloane, M. (2024). Careless Whisper: Speech-to-text hallucination harms. *FAccT '24.* https://doi.org/10.1145/3630106.3658996
- Landis, J. R., & Koch, G. G. (1977). The measurement of observer agreement for categorical data. *Biometrics, 33*(1), 159–174. https://doi.org/10.2307/2529310
- Levenshtein, V. I. (1966). Binary codes capable of correcting deletions, insertions, and reversals. *Soviet Physics Doklady, 10*(8), 707–710.
- Louradour, J. (2023). *whisper-timestamped* [Software]. https://github.com/linto-ai/whisper-timestamped
- Newcombe, R. G. (1998). Interval estimation for the difference between independent proportions: Comparison of eleven methods. *Statistics in Medicine, 17*(8), 873–890. https://doi.org/10.1002/(SICI)1097-0258(19980430)17:8<873::AID-SIM779>3.0.CO;2-I
- OpenAI. *whisper* — `whisper/timing.py` [Software]. https://github.com/openai/whisper/blob/main/whisper/timing.py
- Potamianos, A., & Narayanan, S. (2003). Robust recognition of children's speech. *IEEE Transactions on Speech and Audio Processing, 11*(6), 603–616.
- Rabiner, L. R., & Sambur, M. R. (1975). An algorithm for determining the endpoints of isolated utterances. *Bell System Technical Journal, 54*(2), 297–315.
- Rack, J. P., Snowling, M. J., & Olson, R. K. (1992). The nonword reading deficit in developmental dyslexia: A review. *Reading Research Quarterly, 27*(1), 28–53. https://doi.org/10.2307/747832
- OpenAI. (2024). *whisper-large-v3-turbo* [Model card]. https://huggingface.co/openai/whisper-large-v3-turbo ; Release discussion #2363. https://github.com/openai/whisper/discussions/2363
- Radford, A., Kim, J. W., Xu, T., Brockman, G., McLeavey, C., & Sutskever, I. (2023). Robust speech recognition via large-scale weak supervision. *ICML 2023*, PMLR 202, 28492–28518. https://proceedings.mlr.press/v202/radford23a.html
- University of Oregon. (2023). *DIBELS 8th Edition Administration and Scoring Guide.* https://dibels.uoregon.edu/sites/default/files/2024-01/dibels8_admin_scoring_guide.pdf
- University of Oregon. (2021). *DIBELS 8 vs Previous Editions: Administration and Scoring.* https://dibels.uoregon.edu/sites/default/files/2021-06/DIBELS-8-vs-Previous-Editions-Admin-Scoring.pdf
- University of Oregon. (2025). *DIBELS 8 ORF scoring practice materials.* https://dibels.uoregon.edu/sites/default/files/2025-02/orf-all-scoring-practice-materials.pdf
- van der Velde, M., Harmsen, W., Veldkamp, B. P., Feskens, R., Keuning, J., & Swart, N. (2025). Speech enabled reading fluency assessment: A validation study. *International Journal of Artificial Intelligence in Education.* https://doi.org/10.1007/s40593-025-00480-y
- Wilson, E. B. (1927). Probable inference, the law of succession, and statistical inference. *Journal of the American Statistical Association, 22*(158), 209–212. https://doi.org/10.1080/01621459.1927.10502953
- Yeatman, J. D., et al. (2021). Rapid online assessment of reading ability. *Scientific Reports, 11*, 6396. https://www.nature.com/articles/s41598-021-85907-x
- 문교부. (1988). 「표준어 규정」 제2부 표준 발음법 (고시 제88-2호). 국립국어원 어문 규범. https://korean.go.kr/kornorms/regltn/regltnView.do?regltn_code=0001&regltn_no=327
- 배소영, 김미배, 윤효진, 장승민. (2015). *KOLRA 한국어 읽기검사.* 학지사.
- 이은주. (2021). 읽기장애 아동의 한글 단어 해독 특성. *Communication Sciences & Disorders, 26*(4), 797–819. https://doi.org/10.12963/csd.21853
- 김동일. *BASA:R 기초학습기능 수행평가체제: 읽기검사.* 인싸이트. http://inpsyt.co.kr/psy/item/view/BASAR_CO_TG
- 인천광역시교육청 기초학력지원센터. (2025). *난독증 진단과 지도 가이드북(입문용).*
