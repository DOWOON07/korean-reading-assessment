// 사용법: node tools/lexicon_phonotactic_audit.mjs nikl-headwords.txt
// UTF-8 한 줄 한 표제어 목록으로 현재 비단어의 철자 음절 bigram 대리지표를 재계산한다.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const bank = require('../item-bank.js');
const source = process.argv[2];

if (!source) {
  console.error('사용법: node tools/lexicon_phonotactic_audit.mjs <utf8-headwords.txt>');
  process.exitCode = 2;
} else {
  const words = [...new Set(readFileSync(source, 'utf8').split(/\r?\n/u).map(word => word.trim()).filter(word => word && /^[가-힣]+$/u.test(word)))];
  const syllables = new Set(words.flatMap(word => [...word]));
  const vocabularySize = syllables.size + 1;
  const bigrams = new Map();
  const contexts = new Map();
  const increment = (map, key) => map.set(key, (map.get(key) || 0) + 1);
  for (const word of words) {
    const sequence = ['^', ...word, '$'];
    for (let i = 0; i < sequence.length - 1; i++) {
      increment(bigrams, `${sequence[i]}\u0000${sequence[i + 1]}`);
      increment(contexts, sequence[i]);
    }
  }
  const score = word => {
    const sequence = ['^', ...word, '$'];
    let total = 0;
    for (let i = 0; i < sequence.length - 1; i++) {
      const count = bigrams.get(`${sequence[i]}\u0000${sequence[i + 1]}`) || 0;
      const context = contexts.get(sequence[i]) || 0;
      total += Math.log10((count + 1) / (context + vocabularySize));
    }
    return total / (sequence.length - 1);
  };
  const referenceDistribution = words.filter(word => [...word].length === 2).map(score).sort((a, b) => a - b);
  const percentile = value => {
    let low = 0, high = referenceDistribution.length;
    while (low < high) {
      const middle = (low + high) >> 1;
      if (referenceDistribution[middle] <= value) low = middle + 1; else high = middle;
    }
    return referenceDistribution.length ? +(low / referenceDistribution.length * 100).toFixed(2) : null;
  };
  const rows = Object.entries(bank.A_NONWORDS).map(([itemId, item]) => {
    const referenceWord = bank.A_REAL_WORDS[item.pairId].word;
    const meanLog10 = +score(item.word).toFixed(6);
    const referenceMeanLog10 = +score(referenceWord).toFixed(6);
    return {
      itemId, word: item.word, referenceWord, meanLog10,
      percentile2Syllable: percentile(meanLog10), referenceMeanLog10,
      differenceFromReference: +(meanLog10 - referenceMeanLog10).toFixed(6)
    };
  });
  console.log(JSON.stringify({
    source, uniqueHeadwords: words.length, uniqueSyllables: syllables.size,
    model: 'add-one-smoothed-boundary-syllable-bigram-types-0.1', rows,
    interpretation: '철자 표제어 배열의 대리지표이며 발음 말뭉치 기반 음운확률 또는 문항 타당도가 아니다.'
  }, null, 2));
}
