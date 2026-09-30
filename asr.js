// 기기 안(브라우저)에서 Whisper 음성인식을 실행한다. 원음성은 외부 서버로 보내지 않는다.
// 라이브러리(jsDelivr)와 모델 가중치(Hugging Face)는 처음 한 번 내려받아 브라우저 캐시에 둔다.
// 결과는 오류 "후보"일 뿐이며 점수는 사람이 확정한다 (설계도 v0.2 6.1 자동 확정 정책).
const LIBRARY = '@huggingface/transformers@3.8.1';
const LIBRARY_URL = `https://cdn.jsdelivr.net/npm/${LIBRARY}`;
// 단어 시각은 교차 어텐션 정렬 헤드가 들어 있는 모델에서만 나온다. 없으면 구간 시각으로 내려간다.
const MODELS = [
  { id: 'onnx-community/whisper-base_timestamped', mode: 'word' },
  { id: 'onnx-community/whisper-base', mode: 'segment' }
];

let loaded = null;

export async function load(onProgress = () => {}) {
  if (loaded) return loaded;
  const { pipeline, env } = await import(LIBRARY_URL);
  env.allowLocalModels = false;
  let lastError;
  for (const model of MODELS) {
    try {
      const transcriber = await pipeline('automatic-speech-recognition', model.id, {
        progress_callback: event => {
          if (event.status === 'progress' && event.total) onProgress(`${model.id} 내려받는 중 ${Math.round(event.loaded / event.total * 100)}% (${event.file})`);
          if (event.status === 'ready') onProgress(`${model.id} 준비됨`);
        }
      });
      loaded = { transcriber, model };
      return loaded;
    } catch (error) { lastError = error; onProgress(`${model.id} 불러오기 실패, 다음 모델 시도`); }
  }
  throw lastError || new Error('음성인식 모델을 불러오지 못했습니다.');
}

async function toMono16k(blob) {
  const context = new AudioContext({ sampleRate: 16000 });
  try {
    const buffer = await context.decodeAudioData(await blob.arrayBuffer());
    if (buffer.numberOfChannels === 1) return buffer.getChannelData(0);
    const mono = new Float32Array(buffer.length);
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < data.length; i++) mono[i] += data[i] / buffer.numberOfChannels;
    }
    return mono;
  } finally { await context.close(); }
}

export async function transcribe(blob, onProgress) {
  const { transcriber, model } = await load(onProgress);
  const audio = await toMono16k(blob);
  const options = { language: 'korean', task: 'transcribe', chunk_length_s: 30, stride_length_s: 5 };
  let output, mode = model.mode;
  try {
    output = await transcriber(audio, { ...options, return_timestamps: mode === 'word' ? 'word' : true });
  } catch (error) {
    // 정렬 헤드가 없다는 오류 등: 구간 시각으로 다시 시도
    mode = 'segment';
    output = await transcriber(audio, { ...options, return_timestamps: true });
  }
  const words = (output.chunks || []).flatMap(chunk => {
    const [start, end] = chunk.timestamp || [];
    const pieces = mode === 'word' ? [chunk.text] : String(chunk.text).trim().split(/\s+/);
    // 구간 시각만 있으면 구간을 단어 수로 나눈 추정 시각을 붙이고 estimated 표시를 남긴다.
    return pieces.filter(Boolean).map((text, index) => {
      const span = (end ?? start ?? 0) - (start ?? 0);
      const s = mode === 'word' ? start : (start ?? 0) + span * index / pieces.length;
      const e = mode === 'word' ? end : (start ?? 0) + span * (index + 1) / pieces.length;
      return { text: text.trim(), startMs: s == null ? null : Math.round(s * 1000), endMs: e == null ? null : Math.round(e * 1000), estimated: mode !== 'word' };
    });
  });
  return { status: 'DONE', text: String(output.text || '').trim(), words, model: model.id, library: LIBRARY, timestampMode: mode, language: 'ko', createdAt: new Date().toISOString() };
}
