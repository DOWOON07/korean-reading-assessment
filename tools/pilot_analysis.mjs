// 사용법: node tools/pilot_analysis.mjs exported-sessions.json
// 앱 내보내기 또는 { sessions:[...] }를 읽어 고전검사이론의 기술통계를 만든다.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Evidence = require('../evidence-engine.js');
const source = process.argv[2];

if (!source) {
  console.error('사용법: node tools/pilot_analysis.mjs <sessions.json>');
  process.exitCode = 2;
} else {
  const input = JSON.parse(readFileSync(source, 'utf8'));
  const sessions = Array.isArray(input) ? input : Array.isArray(input.sessions) ? input.sessions : [input];
  const rows = [];
  const invalidReasons = {};
  const forms = {};
  for (const session of sessions) {
    const participantId = session.participant || session.id;
    const formId = session.wordEfficiencyForm?.formId;
    if (formId) forms[formId] = (forms[formId] || 0) + 1;
    for (const response of session.responses || []) {
      if (response.practice) continue;
      if (response.presentation?.valid === false) {
        const reason = response.presentation.status || 'PRESENTATION_INVALID';
        invalidReasons[reason] = (invalidReasons[reason] || 0) + 1;
        continue;
      }
      const rating = response.autoRating || response.adjudication?.finalRating;
      if (!['CORRECT', 'INCORRECT'].includes(rating?.itemScore)) continue;
      rows.push({ participantId, group: session.ageBand || 'unknown', itemId: response.stimulusId, score: rating.itemScore === 'CORRECT' ? 1 : 0, module: response.module, formId: response.formId || null });
    }
    for (const answer of session.choiceAnswers || []) {
      if (answer.scoringStatus !== 'VALID') {
        invalidReasons[answer.scoringStatus || 'CHOICE_INVALID'] = (invalidReasons[answer.scoringStatus || 'CHOICE_INVALID'] || 0) + 1;
        continue;
      }
      rows.push({ participantId, group: session.ageBand || 'unknown', itemId: answer.itemId, score: answer.correct ? 1 : 0, module: answer.module, subtest: answer.subtest, rtMs: answer.rtMs, responseQuality: answer.responseQuality?.status || null });
    }
  }
  const analysis = Evidence.classicalItemAnalysis(rows);
  const groupGapScreen = Evidence.groupItemGapScreen(rows, 'group', 5);
  console.log(JSON.stringify({
    generatedAt: new Date().toISOString(), source, sessions: sessions.length, rows: rows.length,
    forms, invalidReasons, analysis, groupGapScreen,
    interpretation: '기술통계·문항 선별용 결과이며 규준, 절단점, 진단 정확도가 아니다.'
  }, null, 2));
}

