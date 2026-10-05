// 사용법: node tools/asr_benchmark.mjs benchmark.json
// benchmark.json은 { rows: [...] } 또는 앱에서 내보낸 단일 세션 JSON이다.
import { readFileSync } from 'node:fs';
import Scoring from '../scoring.js';

const path = process.argv[2];
if (!path) {
  console.error('사용법: node tools/asr_benchmark.mjs <benchmark.json>');
  process.exitCode = 2;
} else {
  const input = JSON.parse(readFileSync(path, 'utf8'));
  const humanRating = response => response.adjudication?.finalRating || response.ratings?.A || response.ratings?.B || null;
  const rows = Array.isArray(input.rows) ? input.rows : (input.responses || []).flatMap(response => {
    const asr = response.machineAnalysis?.asr;
    const human = humanRating(response);
    if (!asr || !human?.transcript) return [];
    return [{
      id: response.stimulusId,
      module: response.module,
      referenceTranscript: human.transcript,
      asrTranscript: asr.text || '',
      humanScore: human.itemScore,
      autoScore: response.autoRating?.itemScore,
      audioSeconds: asr.audioSeconds || (response.durationMs ? response.durationMs / 1000 : 0),
      elapsedMs: asr.elapsedMs || 0
    }];
  });
  const summary = Scoring.asrBenchmarkSummary(rows);
  console.log(JSON.stringify({ generatedAt: new Date().toISOString(), source: path, rows: rows.length, summary }, null, 2));
}
