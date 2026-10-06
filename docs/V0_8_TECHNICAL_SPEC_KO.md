# v0.8 기술 사양서

작성일: 2026-10-06  
대상: 연구자·개발자  
주의: 이 문서는 참여자 화면에 표시하지 않는다.

## 1. 버전

| 항목 | 값 |
|---|---|
| 앱 | `0.8.0` |
| 검사 제시 사양 | `assessment-spec-0.3` |
| 문항 | `engineering-form-0.4` |
| 정책 | `reading-research-policy-0.2` |
| 독립 채점 | `dual-rater-rule-0.3` |
| 자동 채점 | `auto-asr-scoring-0.1` |
| Transformers.js | `@huggingface/transformers@3.8.1` |

## 2. 실행 구조

```text
server.mjs (127.0.0.1 정적 파일 서버)
  └─ 브라우저
      ├─ HTML/CSS/JS 실행
      ├─ localStorage: 세션·응답·채점 메타데이터
      ├─ IndexedDB: 녹음 Blob
      ├─ Web Speech: 임시 TTS
      └─ 연구자 요청 시에만 Transformers.js + Whisper 추론
```

- 별도의 ASR 백엔드가 없다.
- 원음성은 자동으로 외부 서버에 업로드하지 않는다.
- 처음 AI 분석할 때 라이브러리는 jsDelivr, 모델은 Hugging Face에서 받는다. 이후 브라우저 캐시를 사용할 수 있다.
- GitHub Pages에서도 같은 클라이언트 구조이며 다기관 자료수집 서버는 제공하지 않는다.

## 3. ASR

### 기본 계획

| 우선 | 조건 | 모델/장치 | 목적 |
|---:|---|---|---|
| 1 | WebGPU | `onnx-community/whisper-small_timestamped`, q4/q4f16 | 다운로드·초기화·추론 부담 절감 후보 |
| 2 | WebGPU 실패/없음 | 같은 small, WASM q8 | CPU 호환 |
| 3 | small 실패 | `whisper-base_timestamped`, WASM q8 | 최소 대체 |
| 선택 | `readingAsrProfile=accuracy` + WebGPU | `whisper-large-v3-turbo_timestamped`, q4/q4f16 | 정확도 비교 실험 |

### 실행 시점

- 환경 확인: 실행 안 함
- 마이크 점검: 실행 안 함
- A/B 검사: 실행 안 함
- 완료 화면: 실행 안 함
- `자동 채점 검증 → AI 분석`: 연구자 클릭 때 순차 실행

### 낱말 최적화

- `return_timestamps=false`
- `max_new_tokens=24`
- 제한 후보 후처리: ASR 문자열을 표기·허용발음 후보와 음절 단위 비교

### 유창성

- 단어 타임스탬프 요청
- 지문 어절열과 동적계획법 정렬
- 대치/생략/삽입, 분당 정확 어절·음절, 첫 60초 후보 계산

### 타당성 상태

모델은 공학 후보이고 임상적으로 검증되지 않았다. 사람 축어 전사 대비 CER/WER, real-time factor, 문항 정오 일치율과 Cohen's κ를 수집해야 한다.

## 4. TTS

| 항목 | 사양 |
|---|---|
| 우선 | 검수된 고정 음원 manifest |
| 현재 고정 음원 | 0개 |
| 임시 엔진 | 브라우저 Web Speech API |
| 언어 | `ko-KR` |
| 음성 우선순위 | Microsoft SunHi Natural → InJoon Natural → Natural/Neural/Premium/Enhanced 이름 후보 → 기본 한국어 음성 |
| 엔진 속도 시작값 | `0.90×` |
| 실측 속도 파일럿 범위 | 220–280 SPM |
| pitch/volume | `1.0 / 1.0` |
| 후보 통과 | 실제 SPM 범위 + 자연스러움·명료도·속도 적절성 모두 4/5 이상 |

세션에는 음성명, 언어, localService, rate, pitch, volume, 재생 성공, 실제 시간, WPM, SPM, 문맥과 문항 ID를 저장한다. 고정 음원이 없는 점수용 최소대립 문항은 아직 표준화되지 않았다.

## 5. 화면 사양

| 항목 | 값 |
|---|---|
| 글꼴 | Noto Sans KR → Malgun Gothic → sans-serif |
| 본문/배경 | `#172133` / `#f7f9fc`, 15.3:1 |
| 주 버튼 | `#16365d` / white, 12.21:1 |
| 강조 | `#0f766e` / white, 5.47:1 |
| 최소 조작 영역 | 44 CSS px |
| 낱말 | 4–8rem, 10vw; 보정 시 18 mm |
| 지문 | 1.3–1.75rem; 보정 시 5.3 mm; 행간 1.7; 34ch |
| 질문/보기 | 1.05–1.25rem; 보정 시 4.8 mm; 행간 1.65; 42ch |

## 6. 화면 보정

| 방식 | 기준 | 상태 코드 |
|---|---:|---|
| ID-1 카드 | 85.6 mm | `USER_ALIGNED_ID1_CARD` |
| 자 | 100 mm | `USER_ALIGNED_100MM_RULER` |
| 생략 | 없음 | `UNCALIBRATED_BROWSER_DEFAULT` |

보정값은 `cssPxPerMm`으로 저장하며 시거리 50 cm 확인, viewport, devicePixelRatio, 브라우저 scale, 실제 글꼴 준비 상태도 기록한다.

## 7. 시간 제시와 성능

- 단어 자동성 목표 노출은 문항 정의의 `exposureMs`(현재 350 ms).
- 첫 paint를 두 번 지난 시점부터 `performance.now()`로 측정한다.
- 목표보다 60 ms 넘게 늦게 가려진 문항은 `PRESENTATION_INVALID`로 보존하되 점수에서 제외한다.
- 다음 두 문항의 DOM과 보기 순서를 유휴시간에 준비한다.
- 지원 브라우저에서 Long Task와 워밍업 프레임 간격을 세션에 기록한다.
- 마이크 레벨 시각화는 FFT 64, 약 20 fps로 제한한다.

## 8. 오디오

- 녹음: `MediaRecorder`; 마이크 요청은 echo cancellation, noise suppression 켜짐, auto gain control 꺼짐.
- 음질 후보: 길이, RMS, peak, clipping ratio, 에너지 기반 발화 시작·끝/긴 멈춤.
- 재생: 원본 Blob은 바꾸지 않고 Web Audio `GainNode`로 사용자 재생만 기본 1.6×, `DynamicsCompressorNode`로 출력 피크를 제한한다. 체크를 끄면 1.0×.
- 연구 결과에는 증폭되지 않은 원음성과 분석값을 쓴다.

## 9. 저장·개인정보

- 참여자 이름이 아니라 코드를 입력한다.
- 세션: `localStorage(readingSessions)`.
- 음성: `IndexedDB(ReadingPrototypeDB/audio)`.
- 브라우저 자료 삭제 시 사라질 수 있다.
- JSON 내보내기와 음성 파일 보존은 연구계획의 암호화·보관·폐기 규칙을 따라야 한다.

## 10. 알려진 기술 한계

1. 기기별 Web Speech 음성이 다르다.
2. 고정 TTS 음원 manifest가 비어 있다.
3. small 모델도 첫 다운로드·초기화 시간이 길 수 있다.
4. WASM에서는 실시간보다 느릴 수 있다.
5. ASR이 비단어를 실제단어로 바꿔 인식할 수 있다.
6. 정적 서버는 인증, 중앙 저장, 동시 연구 운영을 제공하지 않는다.
7. 브라우저 화면·음성·성능은 실제 대상 기기 파일럿이 필요하다.

## 11. 재현 명령

```powershell
npm start
npm run check
```

로컬 주소: `http://localhost:8080`  
서버 종료: 실행한 터미널에서 `Ctrl+C`
