// 사용법: node tools/public_speech_benchmark.mjs benchmark-rows.json
// rows: [{dataset,model,referenceTranscript,asrTranscript,audioSeconds,elapsedMs,humanScore?,autoScore?}]
import { readFileSync } from 'node:fs';
import Scoring from '../scoring.js';

const source = process.argv[2];
if (!source) {
  console.error('사용법: node tools/public_speech_benchmark.mjs <benchmark-rows.json>');
  process.exitCode = 2;
} else {
  const input = JSON.parse(readFileSync(source, 'utf8'));
  const rows = input.rows || input;
  const groups = {};
  for (const row of rows) {
    const key = `${row.dataset || 'unknown'}::${row.model || 'unknown'}`;
    (groups[key] ||= []).push(row);
  }
  const results = Object.entries(groups).map(([key, groupRows]) => {
    const [dataset, model] = key.split('::');
    return { dataset, model, ...Scoring.asrBenchmarkSummary(groupRows) };
  });
  console.log(JSON.stringify({
    generatedAt: new Date().toISOString(), source, rows: rows.length, results,
    interpretation: '공개 일반음성 기준 모델 비교이며 읽기곤란 대상자의 자동채점 타당도를 의미하지 않음'
  }, null, 2));
}

