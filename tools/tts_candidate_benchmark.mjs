// 사용법: node tools/tts_candidate_benchmark.mjs tts-benchmark.json
// rows: [{candidateId,targetTranscript,asrTranscript,durationMs,syllables,peakDbfs,clipRatio,listeningStatus}]
import { readFileSync } from 'node:fs';
import Scoring from '../scoring.js';

const source = process.argv[2];
if (!source) {
  console.error('사용법: node tools/tts_candidate_benchmark.mjs <tts-benchmark.json>');
  process.exitCode = 2;
} else {
  const input = JSON.parse(readFileSync(source, 'utf8'));
  const rows = input.rows || input;
  const results = rows.map(row => {
    const cer = Scoring.transcriptionError(row.targetTranscript, row.asrTranscript, 'char');
    const durationMs = Number(row.durationMs) || 0;
    const spm = durationMs ? +(Number(row.syllables || 0) / (durationMs / 60000)).toFixed(1) : null;
    const gates = {
      asrBackTranscription: cer.rate === 0,
      targetSpm: spm != null && spm >= 220 && spm <= 280,
      noClipping: Number(row.clipRatio || 0) <= 0.001 && Number(row.peakDbfs ?? -1) <= -1,
      listeningAccepted: row.listeningStatus === 'ACCEPTED'
    };
    return { candidateId: row.candidateId, cer: cer.rate, spm, gates, status: Object.values(gates).every(Boolean) ? 'READY_FOR_FIXED_MANIFEST' : 'REJECT_OR_PENDING' };
  });
  console.log(JSON.stringify({
    generatedAt: new Date().toISOString(), source, results,
    interpretation: 'ASR 역전사·속도·클리핑은 자동 사전필터이며 자연스러움과 최소대립 식별 청취평가를 대신하지 않음'
  }, null, 2));
}
