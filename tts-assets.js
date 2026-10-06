// 모든 참여자에게 같은 음성을 들려주기 위한 고정 음원 manifest.
// 검증된 음원이 들어오기 전에는 빈 manifest이며, 앱은 브라우저 음성을 잠정 대체 수단으로 사용하고 그 사실을 기록한다.
(function (global) {
  const VERSION = 'tts-assets-0.1';
  const STATUS = 'MANIFEST_READY_ASSETS_PENDING';
  const FIXED_AUDIO_SPEC = Object.freeze({
    version: 'fixed-audio-spec-0.2',
    preferredFormat: 'audio/ogg; codecs=opus',
    backupFormat: 'audio/mp4',
    sampleRateHz: 48000,
    channels: 1,
    targetSpm: Object.freeze([220, 280]),
    peakDbfsMax: -1,
    listeningCriteria: Object.freeze(['발음 정확성', '낱말 식별 가능성', '속도 적절성', '기계음·왜곡 없음']),
    acceptance: '고정 음원마다 출처·사용권·문장 버전·해시·실측 길이와 연구자 청취 승인 기록이 모두 있어야 READY로 등록'
  });
  const ENTRIES = Object.freeze({});
  const keyOf = context => [context?.kind, context?.sectionId, context?.itemId].filter(Boolean).join(':');
  const resolve = context => ENTRIES[keyOf(context)] || null;
  const coverage = () => ({ ready: Object.keys(ENTRIES).length, status: STATUS, version: VERSION });

  async function preloadAll() {
    const results = await Promise.all(Object.entries(ENTRIES).map(async ([key, entry]) => {
      try {
        const response = await fetch(entry.url, { cache: 'force-cache' });
        if (!response.ok) throw new Error(`HTTP_${response.status}`);
        await response.blob();
        return { key, ok: true };
      } catch (error) { return { key, ok: false, error: String(error?.message || error) }; }
    }));
    return { ...coverage(), results, failures: results.filter(result => !result.ok).length };
  }

  async function play(entry) {
    if (!entry?.url) return { ok: false, error: 'FIXED_ASSET_NOT_FOUND' };
    return new Promise(resolvePlayback => {
      const audio = new Audio(entry.url);
      const done = (ok, error = null) => resolvePlayback({ ok, error, durationMs: Number.isFinite(audio.duration) ? Math.round(audio.duration * 1000) : null });
      audio.onended = () => done(true);
      audio.onerror = () => done(false, 'FIXED_ASSET_PLAYBACK_ERROR');
      audio.play().catch(error => done(false, String(error?.message || error)));
    });
  }

  const api = { VERSION, STATUS, FIXED_AUDIO_SPEC, ENTRIES, keyOf, resolve, coverage, preloadAll, play };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else global.ReadingTtsAssets = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
