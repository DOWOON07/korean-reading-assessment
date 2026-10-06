# v0.15 코드 구조 안내

목적: 화면을 고치는 파일, 검사 규칙을 고치는 파일, 분석 규칙을 고치는 파일을 구분하고 한 응답이 어디를 거쳐 결과가 되는지 추적한다.

## 1. 전체 구조 한눈에 보기

```text
index.html + styles.css
        │ 화면 템플릿과 모양
        ▼
app.js ──────────────── 사용자 흐름·녹음·저장·제시 품질
 │   │   │
 │   │   ├─ item-bank.js ─ 문항 출처·특징·B 병렬형
 │   │   ├─ battery.js ─── A의 선택형, B 확장, C·D 문항
 │   │   └─ assessment-spec.js ─ 글꼴·크기·시간·TTS 사양
 │   ▼
 │ scoring.js ───────── 해독·유창성·신뢰구간·ASR 지표 계산
 │   ▲
 │ asr.js ───────────── 연구자 요청 때만 Whisper 로드·추론
 ▼
localStorage + IndexedDB
        │
        ▼
report.js ───────────── 참여자 결과 / 연구자 결과 / 품질 감사

evidence-engine.js ─ item-bank·battery·파일럿 도구가 함께 쓰는 감사 계산
tools/*.mjs ─────── 브라우저 밖에서 음원·ASR·파일럿 자료를 일괄 검증
```

의존성 방향은 위에서 아래가 아니라 “규칙 파일 → 흐름 → 결과”로 생각하면 쉽다. `app.js`나 `report.js`에 문항 목록을 다시 복사하지 않는 것이 중요하다.

## 2. 브라우저가 파일을 읽는 순서

`index.html` 마지막의 순서는 다음과 같다.

1. `version.js`
2. `evidence-engine.js`
3. `item-bank.js`
4. `tts-assets.js`
5. `assessment-spec.js`
6. `scoring.js`
7. `catalog.js`
8. `battery.js`
9. `report.js`
10. `app.js`

앞 파일이 만든 전역 객체를 뒤 파일이 사용한다. 예를 들어 `item-bank.js`는 `ReadingEvidenceEngine`을, `app.js`는 `ReadingItemBank`, `AssessmentSpec`, `Scoring`을 사용한다. 순서를 바꾸면 화면이 뜨기 전에 참조 오류가 날 수 있다.

## 3. 파일별 책임

| 파일 | 바꿔야 할 때 | 바꾸면 안 되는 것 |
|---|---|---|
| `version.js` | 사용자에게 보이는 릴리스 버전을 바꿀 때 | 문항·사양의 세부 버전 |
| `index.html` | 화면의 의미 구조, 버튼·폼·템플릿을 바꿀 때 | 채점 규칙·문항 내용 |
| `styles.css` | 색·간격·반응형 배치를 바꿀 때 | 검사 수치 기준 |
| `assessment-spec.js` | 자극 글꼴·크기·행간·폭, 시간 허용오차, TTS 정책을 바꿀 때 | 개별 문항 |
| `item-bank.js` | A 실제단어 메타데이터, 비단어 짝, B 낱말 목록·병렬형을 바꿀 때 | 화면 전환 |
| `battery.js` | 선택형 문항과 핵심/연구 확장 역할을 바꿀 때 | 녹음 저장 방식 |
| `evidence-engine.js` | 문항/지문/반응 품질 감사와 파일럿 통계를 바꿀 때 | 참가자 화면 |
| `app.js` | 검사 순서, 제시, 녹음, 세션 저장, TTS 실행, 무효 처리 | 통계 공식을 중복 작성 |
| `scoring.js` | 해독·유창성·CER/WER·κ·신뢰구간 계산을 바꿀 때 | UI 문구 |
| `asr.js` | Whisper 모델 선택·로드·추론을 바꿀 때 | 사람 검증 결과 |
| `report.js` | 참여자/연구자 결과 표현과 해석 제한을 바꿀 때 | 원자료 자체 |
| `tts-assets.js` | 검증된 고정 음원 manifest와 재생 정책을 바꿀 때 | 검증 전 음원을 READY로 표시 |
| `catalog.js` | A~D 경로와 하위검사 설명을 바꿀 때 | 실제 문항 |

## 4. 세션 데이터의 큰 모양

새 세션은 `schemaVersion: 0.5`다. 핵심 필드는 다음과 같다.

```text
session
├─ id, participant, ageBand, createdAt
├─ appVersion, formVersion, itemEvidenceVersion, assessmentSpecVersion
├─ mode, modules, extension 설정
├─ randomizationSeed
├─ wordEfficiencyForm { formId, audit... }
├─ environment, calibration, deviceCheck, ttsEvents
├─ responses[]             녹음형 A/B
│  ├─ stimulusId, module, taskType, target
│  ├─ audioKey             IndexedDB 음성과 연결
│  ├─ durationMs, presentation
│  ├─ machineAnalysis      ASR 출력
│  ├─ autoRating           자동 채점
│  └─ ratings/adjudication 사람 검증과 합의
├─ choiceAnswers[]         A 선택형·B 확장·C·D
│  ├─ itemId, response, answer, correct, rtMs
│  ├─ scoringStatus, presentation
│  ├─ responseQuality
│  └─ itemEvidenceAudit
└─ presentationLog[]       제시 시작·종료·프레임·실패 근거
```

텍스트·수치 세션은 `localStorage`의 `readingSessions`에 저장되고, 큰 음성 Blob은 IndexedDB `ReadingPrototypeDB`에 저장된다. `audioKey`가 둘을 연결한다. 브라우저 저장소를 지우면 둘 다 사라질 수 있으므로 실제 자료는 JSON과 음성을 내보내 별도로 보관해야 한다.

## 5. 한 선택형 응답을 따라가기

예: C 어휘 문제 한 개를 푼 경우.

1. `battery.js`가 문항, 정답, 보기, 핵심/확장 역할을 제공한다.
2. 파일이 로드될 때 `evidence-engine.js`의 `choiceItemAudit()`이 정답 중복·보기 길이 단서를 계산해 문항에 붙인다.
3. `app.js`가 고정된 보기 순서를 만들고 화면에 렌더링한다.
4. 두 번의 animation frame 뒤 자극 노출 시각을 `performance.now()`로 기록한다.
5. 사용자가 누르면 응답·정답·반응시간·초점·가시성·감사 결과를 `choiceAnswers[]`에 저장한다.
6. `scoringStatus === VALID`인 응답만 핵심 원점수에 사용한다.
7. `report.js`가 참여자에게는 쉬운 영역 점수만, 연구자에게는 문항 근거와 품질 감사를 같이 보여준다.

중요: `item.answer`는 브라우저에 있으므로 이 앱은 감독 없는 고위험 시험 보안 구조가 아니다. 현재 목적은 연구용 실시·UI·채점 파이프라인 검증이다.

## 6. B 45초 낱말 한 회를 따라가기

1. `item-bank.js`의 `wordEfficiencyForParticipant()`가 참여자 코드로 A/B/C형을 고른다.
2. `app.js`의 `startTasks()`가 형식 ID와 목록 감사를 세션에 저장한다.
3. 목록 화면에서 `timedWordLayoutAudit()`이 60개, 5열, 12행, 전체 가시성, 가로 넘침을 검사한다.
4. 합격한 경우에만 녹음과 `performance.now()` 시계가 같이 시작된다.
5. 시작 중 `visibilitychange`, `resize`, `scroll`, `blur`를 감시한다.
6. 목표 45,000ms에 자동 종료하고 실제 경과시간·오차를 계산한다.
7. 레이아웃·창 이벤트·시간 오차 중 하나라도 실패하면 `PRESENTATION_INVALID`로 저장한다.
8. `report.js`는 이 시행을 0점으로 만들지 않고 “점수 제외”로 보여준다.

화면 폭 자동 검사는 `tools/visual_harness.html`을 실제 headless Chrome/Edge에서 열어 `tools/browser_matrix_audit.mjs`가 판정한다.

## 7. 녹음과 자동 채점 흐름

```text
MediaRecorder 녹음
   ├─ Blob → IndexedDB
   └─ response 메타데이터 → localStorage
                 │
검사 종료 ───────┘  (여기서는 Whisper를 받지 않음)
                 │
연구자 자동 분석 버튼
   ▼
asr.js: Whisper small 준비·전사
   ▼
app.js: autoScoreResponse()
   ├─ A: 허용 발음과 전사 비교
   └─ B: 어절 정렬·정확도·속도 계산
   ▼
사람 A/B 채점과 비교 → 일치/합의/보류
   ▼
report.js: CER/WER/RTF/κ와 원점수 표시
```

Whisper를 검사 전이나 A/B 화면 진입 때 로드하지 않는 이유는 모델 다운로드·초기화가 스크롤과 화면 반응을 막았던 문제를 피하기 위해서다.

## 8. 근거 엔진이 하는 일과 하지 않는 일

`evidence-engine.js`의 역할은 세 층이다.

### 문항 제작 전

- `wordFeatures()` — 음절·받침·자모·등급 특징
- `auditNonword()` — 사전 충돌, 실제단어 짝 조건, 철자 음절 bigram 대리지표와 발음 말뭉치 한계
- `timedWordFormAudit()` — 60개·등급 20/20/20·5×12

### 실시 중

- `rapidResponseAudit()` — 너무 빠르거나 느린 연구용 응답 플래그
- `textMetrics()` — 지문 길이·어휘등급 가용률·문법 표지
- `choiceItemAudit()` — 정답/보기 형식 단서

### 자료 수집 후

- `classicalItemAnalysis()` — 난이도 p, 수정 문항-총점 상관, 가능한 경우 α
- `groupItemGapScreen()` — 집단별 원시 p 차이

하지 않는 일은 난독증 진단, 학년 예측, 절단점 결정, IRT 보정, 정식 DIF 검정, 내용타당도 판정이다.

## 9. 외부 분석 도구

```powershell
# 전체 코드·화면 검증
npm run check

# 앱에서 내보낸 세션 묶음의 문항 통계
node tools/pilot_analysis.mjs <sessions.json>

# 공개/실제 음성의 ASR 모델별 CER·WER·RTF
node tools/public_speech_benchmark.mjs <benchmark-rows.json>

# TTS 후보의 역전사·속도·클리핑·청취 관문
node tools/tts_candidate_benchmark.mjs <tts-benchmark.json>

# 공식 표제어 한 줄 목록에서 비단어 철자 음절 bigram 재계산
node tools/lexicon_phonotactic_audit.mjs <nikl-headwords.txt>

# 고정 음원 manifest 완결성
node tools/validate_audio_manifest.mjs
```

각 도구는 JSON을 stdout에 내보낸다. 파일로 남기고 싶으면 PowerShell에서 `> 결과.json`을 붙일 수 있다.

## 10. 코드를 읽는 추천 순서

처음부터 `app.js` 2,500줄을 순서대로 읽지 않는다.

1. `version.js` — 현재 버전
2. `assessment-spec.js` — 화면·시간·음성 기준
3. `item-bank.js` — A/B 문항 데이터와 출처
4. `battery.js` — 선택형 A~D 문항과 역할
5. `evidence-engine.js` — 자동 감사 공식
6. `index.html` — 화면 템플릿과 script 순서
7. `app.js`에서 `startTasks`, `timedWordLayoutAudit`, `task`, `autoScoreResponse`만 먼저 읽기
8. `scoring.js` — 실제 점수 계산
9. `report.js`의 `participantDomainRows`, `drawParticipantReport`, `drawReport`
10. `tests/` — 각 설계 약속이 어떤 문자열·값으로 고정됐는지 확인

## 11. 변경할 때 지켜야 할 체크

- 문항을 바꾸면 `item-bank.js` 또는 `battery.js`의 버전을 올린다.
- 화면·시간 기준을 바꾸면 `assessment-spec.js` 버전을 올린다.
- 저장 필드를 바꾸면 신규 세션 `schemaVersion`을 올리고 `migrateSession()`에서 과거 자료를 보완한다.
- 사용자에게 보이는 릴리스를 바꾸면 `version.js`와 `package.json`을 같이 맞춘다.
- 모든 변경 뒤 `npm run check`를 실행한다.
- 자동 검사가 통과해도 직접 눈검사와 실제 마이크·TTS 청취는 별도로 한다.
