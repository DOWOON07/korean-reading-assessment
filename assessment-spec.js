// 검사 제시 조건과 품질 판정의 단일 기준점.
// 브라우저(window.AssessmentSpec)와 Node 테스트(require/import)에서 함께 사용한다.
(function (global) {
  const VERSION = 'assessment-spec-0.4';

  const VISUAL = Object.freeze({
    fontFamily: '"Noto Sans KR","Malgun Gothic",sans-serif',
    intendedFont: 'Noto Sans KR',
    fontStatus: 'PROVISIONAL_FALLBACK_ALLOWED',
    word: { minRem: 4, preferredVw: 10, maxRem: 8, targetMm: 18, weight: 800, letterSpacingEm: 0.04, lineHeight: 1.2 },
    passage: { minRem: 1.3, preferredVw: 2.2, maxRem: 1.75, targetMm: 5.3, weight: 500, lineHeight: 1.7, maxWidthCh: 34 },
    choice: { minRem: 1.05, preferredVw: 1.6, maxRem: 1.25, targetMm: 4.8, lineHeight: 1.65, maxWidthCh: 42 },
    foreground: '#172133',
    background: '#f7f9fc',
    minimumContrast: 'WCAG 2.2 AA 4.5:1 이상',
    alignment: 'left',
    controlTargetCssPx: 44,
    rationaleStatus: '문헌 기반 후보값·한국어 사용자 파일럿 전'
  });

  const PRESENTATION = Object.freeze({
    exposureToleranceMs: 60,
    timedRecordingToleranceMs: 250,
    timedWordGrid: Object.freeze({ columns: 5, rows: 12, requiredVisibleItems: 60 }),
    responseClock: 'performance.now',
    invalidStatuses: ['PRESENTATION_INVALID', 'AUDIO_INVALID'],
    timingPolicy: '늦은 마스킹은 무효, 목표 시간 전 응답은 유효'
  });

  const TTS = Object.freeze({
    engine: 'fixed-audio-preferred/browser-speech-fallback',
    status: 'FIXED_MANIFEST_PENDING_AUDIO_VALIDATION',
    language: 'ko-KR',
    rate: 0.9,
    pitch: 1,
    volume: 1,
    preferredVoiceNames: ['Microsoft SunHi Online (Natural) - Korean (Korea)', 'Microsoft SunHi - Korean (Korea)', 'Microsoft InJoon Online (Natural) - Korean (Korea)', 'Microsoft InJoon - Korean (Korea)'],
    preferredVoiceHints: ['sunhi', 'injoon', 'natural', 'neural', 'premium', 'enhanced'],
    targetSpm: { min: 220, max: 280, status: 'ADULT_CLEAR_SPEECH_PILOT_RANGE_NOT_AGE_NORM' },
    voicePolicy: '전문가가 검증한 고정 음원을 우선한다. 없을 때만 SunHi→InJoon→기타 자연음 계열 한국어 음성을 세션에 고정하고 실제 SPM·청취평가를 기록한다.',
    timeoutBaseMs: 2500,
    timeoutPerCharacterMs: 250
  });

  const CALIBRATION = Object.freeze({ cardWidthMm: 85.6, rulerWidthMm: 100, defaultCssPxPerMm: 96 / 25.4, minReferenceCssPx: 240, maxReferenceCssPx: 480 });

  function applyVisualTokens(root, cssPxPerMm = null) {
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
    set('--control-target-size', `${VISUAL.controlTargetCssPx}px`);
    if (Number.isFinite(cssPxPerMm) && cssPxPerMm > 0) {
      set('--stimulus-word-size', `${(VISUAL.word.targetMm * cssPxPerMm).toFixed(2)}px`);
      set('--stimulus-passage-size', `${(VISUAL.passage.targetMm * cssPxPerMm).toFixed(2)}px`);
      set('--stimulus-choice-size', `${(VISUAL.choice.targetMm * cssPxPerMm).toFixed(2)}px`);
    }
  }

  function calibrationFromReference(cssPx, method = 'card') {
    const width = Number(cssPx);
    const referenceWidthMm = method === 'ruler' ? CALIBRATION.rulerWidthMm : CALIBRATION.cardWidthMm;
    if (!Number.isFinite(width) || width < CALIBRATION.minReferenceCssPx || width > CALIBRATION.maxReferenceCssPx || !['card', 'ruler'].includes(method)) return null;
    return { method, referenceWidthMm, referenceCssPx: Math.round(width), cssPxPerMm: +(width / referenceWidthMm).toFixed(4), status: method === 'card' ? 'USER_ALIGNED_ID1_CARD' : 'USER_ALIGNED_100MM_RULER' };
  }

  function calibrationFromCard(cardCssPx) {
    return calibrationFromReference(cardCssPx, 'card');
  }

  function defaultCalibration() {
    return { method: 'default', referenceWidthMm: null, referenceCssPx: null, cssPxPerMm: null, status: 'UNCALIBRATED_BROWSER_DEFAULT' };
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
      online: nav.onLine !== false,
      visualSpec: {
        fontFamily: VISUAL.fontFamily,
        intendedFont: VISUAL.intendedFont,
        intendedFontReady: source.document?.fonts?.check ? source.document.fonts.check(`16px "${VISUAL.intendedFont}"`) : null,
        computedFontFamily: source.document?.body && source.getComputedStyle ? source.getComputedStyle(source.document.body).fontFamily : null,
        fontStatus: VISUAL.fontStatus,
        rationaleStatus: VISUAL.rationaleStatus
      }
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
      const exactRank = voice => {
        const index = TTS.preferredVoiceNames.indexOf(String(voice.name || ''));
        return index < 0 ? TTS.preferredVoiceNames.length : index;
      };
      const preferred = voice => TTS.preferredVoiceHints.some(hint => String(voice.name || '').toLowerCase().includes(hint));
      const aRank = exactRank(a) * 10 + (preferred(a) ? 0 : a.default ? 2 : 4) + (a.localService ? 1 : 0);
      const bRank = exactRank(b) * 10 + (preferred(b) ? 0 : b.default ? 2 : 4) + (b.localService ? 1 : 0);
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

  function estimateSpm(text, durationMs) {
    if (!(durationMs > 0)) return null;
    const syllables = (String(text || '').match(/[가-힣]/gu) || []).length;
    return syllables ? Math.round(syllables / (durationMs / 60000)) : null;
  }

  function contrastRatio(foreground, background) {
    const luminance = hex => {
      const normalized = String(hex).replace('#', '');
      if (!/^[0-9a-f]{6}$/i.test(normalized)) return null;
      const channels = [0, 2, 4].map(index => parseInt(normalized.slice(index, index + 2), 16) / 255)
        .map(value => value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
      return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
    };
    const a = luminance(foreground), b = luminance(background);
    if (a == null || b == null) return null;
    return +((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)).toFixed(2);
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
      medianTtsWpm: median(successfulTts.map(event => event.wpm).filter(Number.isFinite)),
      medianTtsSpm: median(successfulTts.map(event => event.spm).filter(Number.isFinite))
    };
  }

  function median(values) {
    const sorted = [...values].sort((a, b) => a - b);
    if (!sorted.length) return null;
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[middle] : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
  }

  const api = { VERSION, VISUAL, PRESENTATION, TTS, CALIBRATION, applyVisualTokens, calibrationFromReference, calibrationFromCard, defaultCalibration, environmentSnapshot, selectKoreanVoice, voiceSnapshot, estimateWpm, estimateSpm, contrastRatio, evaluateExposure, isScorable, practiceFeedback, presentationSummary };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else global.AssessmentSpec = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
