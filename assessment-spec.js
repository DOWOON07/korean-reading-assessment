// 검사 제시 조건과 품질 판정의 단일 기준점.
// 브라우저(window.AssessmentSpec)와 Node 테스트(require/import)에서 함께 사용한다.
(function (global) {
  const VERSION = 'assessment-spec-0.1';

  const VISUAL = Object.freeze({
    fontFamily: '"Pretendard","Noto Sans KR",system-ui,-apple-system,sans-serif',
    word: { minRem: 4, preferredVw: 10, maxRem: 8, weight: 900, letterSpacingEm: 0.05, lineHeight: 1.2 },
    passage: { minRem: 1.35, preferredVw: 2.5, maxRem: 2, weight: 500, lineHeight: 1.9, maxWidthCh: 34 },
    choice: { minRem: 1.05, preferredVw: 1.8, maxRem: 1.35, lineHeight: 1.7, maxWidthCh: 42 },
    foreground: '#172133',
    background: '#f7f9fc',
    minimumContrast: 'WCAG AA 후보 기준(정식 접근성 점검 전)'
  });

  const PRESENTATION = Object.freeze({
    exposureToleranceMs: 60,
    responseClock: 'performance.now',
    invalidStatuses: ['PRESENTATION_INVALID', 'AUDIO_INVALID'],
    timingPolicy: '늦은 마스킹은 무효, 목표 시간 전 응답은 유효'
  });

  const TTS = Object.freeze({
    engine: 'browser-speech-synthesis',
    status: 'PROVISIONAL_DEVICE_VOICE',
    language: 'ko-KR',
    rate: 0.9,
    pitch: 1,
    volume: 1,
    voicePolicy: '세션에서 선택한 한국어 음성을 고정하고 이름·언어·로컬 여부를 기록',
    timeoutBaseMs: 2500,
    timeoutPerCharacterMs: 250
  });

  function applyVisualTokens(root) {
    if (!root?.style?.setProperty) return;
    const set = (name, value) => root.style.setProperty(name, String(value));
    set('--assessment-font', VISUAL.fontFamily);
    set('--assessment-ink', VISUAL.foreground);
    set('--assessment-bg', VISUAL.background);
    set('--stimulus-word-size', `clamp(${VISUAL.word.minRem}rem,${VISUAL.word.preferredVw}vw,${VISUAL.word.maxRem}rem)`);
    set('--stimulus-word-weight', VISUAL.word.weight);
    set('--stimulus-word-spacing', `${VISUAL.word.letterSpacingEm}em`);
    set('--stimulus-passage-size', `clamp(${VISUAL.passage.minRem}rem,${VISUAL.passage.preferredVw}vw,${VISUAL.passage.maxRem}rem)`);
    set('--stimulus-passage-leading', VISUAL.passage.lineHeight);
    set('--stimulus-passage-width', `${VISUAL.passage.maxWidthCh}ch`);
    set('--stimulus-choice-size', `clamp(${VISUAL.choice.minRem}rem,${VISUAL.choice.preferredVw}vw,${VISUAL.choice.maxRem}rem)`);
    set('--stimulus-choice-leading', VISUAL.choice.lineHeight);
    set('--stimulus-choice-width', `${VISUAL.choice.maxWidthCh}ch`);
  }

  function environmentSnapshot(source = global) {
    const nav = source.navigator || {};
    const screen = source.screen || {};
    const viewport = source.visualViewport || {};
    return {
      capturedAt: new Date().toISOString(),
      userAgent: nav.userAgent || 'unknown',
      platform: nav.userAgentData?.platform || nav.platform || 'unknown',
      language: nav.language || 'unknown',
      viewport: {
        width: Math.round(viewport.width || source.innerWidth || 0),
        height: Math.round(viewport.height || source.innerHeight || 0),
        scale: Number(viewport.scale || 1)
      },
      screen: { width: screen.width || null, height: screen.height || null, colorDepth: screen.colorDepth || null },
      devicePixelRatio: Number(source.devicePixelRatio || 1),
      webgpu: Boolean(nav.gpu),
      online: nav.onLine !== false
    };
  }

  function selectKoreanVoice(voices, pinnedName = '') {
    const korean = [...(voices || [])].filter(voice => /^ko(?:-|$)/i.test(voice.lang || ''));
    if (!korean.length) return null;
    if (pinnedName) {
      const pinned = korean.find(voice => voice.name === pinnedName);
      return pinned || null;
    }
    return korean.sort((a, b) => {
      const aRank = (a.default ? 0 : 2) + (a.localService ? 1 : 0);
      const bRank = (b.default ? 0 : 2) + (b.localService ? 1 : 0);
      return aRank - bRank || String(a.name).localeCompare(String(b.name), 'ko');
    })[0];
  }

  function voiceSnapshot(voice) {
    return voice ? { name: voice.name || 'unknown', lang: voice.lang || TTS.language, localService: Boolean(voice.localService), default: Boolean(voice.default) }
      : { name: 'unavailable', lang: TTS.language, localService: null, default: null };
  }

  function estimateWpm(text, durationMs) {
    if (!(durationMs > 0)) return null;
    const words = String(text || '').trim().split(/\s+/u).filter(Boolean).length;
    return words ? Math.round(words / (durationMs / 60000)) : null;
  }

  // 응답이 목표 노출시간 전에 일어나 자극이 먼저 사라진 것은 유효하다.
  // 메인 스레드 지연으로 목표보다 오래 노출된 경우만 허용 오차를 적용해 무효화한다.
  function evaluateExposure(targetMs, actualMs, endedBy = 'timer', toleranceMs = PRESENTATION.exposureToleranceMs) {
    if (!Number.isFinite(targetMs) || !(targetMs > 0) || !Number.isFinite(actualMs) || actualMs < 0) return { valid: false, status: 'PRESENTATION_INVALID', reason: 'TIMING_MISSING', targetMs, actualMs: actualMs ?? null, driftMs: null, toleranceMs, endedBy };
    const driftMs = Math.round(actualMs - targetMs);
    const earlyResponse = endedBy === 'response' && actualMs <= targetMs + toleranceMs;
    const valid = earlyResponse || driftMs <= toleranceMs;
    return {
      valid,
      status: valid ? 'VALID' : 'PRESENTATION_INVALID',
      reason: valid ? null : 'EXPOSURE_OVERRUN',
      targetMs: Math.round(targetMs), actualMs: Math.round(actualMs), driftMs, toleranceMs, endedBy
    };
  }

  function isScorable(answer) {
    return !PRESENTATION.invalidStatuses.includes(answer?.scoringStatus);
  }

  function practiceFeedback({ practice, correct, rightAnswer }) {
    if (!practice) return null;
    return correct ? '맞았어요!' : `정답은 “${rightAnswer}”예요.`;
  }

  function presentationSummary(session) {
    const answers = session?.choiceAnswers || [];
    const timed = answers.filter(answer => answer.presentation?.targetMs);
    const invalid = answers.filter(answer => !isScorable(answer));
    const drifts = timed.map(answer => answer.presentation?.driftMs).filter(Number.isFinite);
    const tts = session?.ttsEvents || [];
    const successfulTts = tts.filter(event => event.ok);
    return {
      totalAnswers: answers.length,
      timedItems: timed.length,
      invalidItems: invalid.length,
      maxLateDriftMs: drifts.length ? Math.max(0, ...drifts) : null,
      ttsPlays: tts.length,
      ttsFailures: tts.filter(event => !event.ok).length,
      medianTtsWpm: median(successfulTts.map(event => event.wpm).filter(Number.isFinite))
    };
  }

  function median(values) {
    const sorted = [...values].sort((a, b) => a - b);
    if (!sorted.length) return null;
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[middle] : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
  }

  const api = { VERSION, VISUAL, PRESENTATION, TTS, applyVisualTokens, environmentSnapshot, selectKoreanVoice, voiceSnapshot, estimateWpm, evaluateExposure, isScorable, practiceFeedback, presentationSummary };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else global.AssessmentSpec = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
