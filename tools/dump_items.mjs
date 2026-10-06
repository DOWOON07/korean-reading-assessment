// 문항 점검용: 해독·선별·단어 재인·어휘 문항을 JSON으로 내보낸다 (tools/item_audit.py가 읽음).
import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const S = require('../scoring.js');
const ITEM_BANK = require('../item-bank.js');
const app = fs.readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const stimuli = eval('(' + app.slice(app.indexOf('const stimuli = {') + 'const stimuli = '.length, app.indexOf('\n};', app.indexOf('const stimuli = {')) + 2) + ')');
const battery = fs.readFileSync(new URL('../battery.js', import.meta.url), 'utf8');
const CHOICE_MODULES = eval('(' + battery.slice(battery.indexOf('const CHOICE_MODULES = {') + 'const CHOICE_MODULES = '.length, battery.indexOf('\n};', battery.indexOf('const CHOICE_MODULES = {')) + 2) + ')');
const word = (set, item, extra = {}) => ({ set, id: item.id, text: item.text, pron: S.pronounce(item.text), rules: S.ruleSites(item.text).map(r => r.rule), syllables: S.countSyllables(item.text), ...extra });
const out = [
  ...stimuli.decoding.map(item => word('decoding', item, { lexicality: item.lexicality, regularity: item.regularity, accepted: item.accepted })),
  ...stimuli.screening.words.map(item => word('screening', item, { lexicality: item.lexicality, regularity: item.regularity, accepted: item.accepted })),
  ...CHOICE_MODULES.silent.sections[0].items.map(item => word('lexical', item, { lexicality: item.answer === 'word' ? 'real' : 'nonword' })),
  ...CHOICE_MODULES.language.sections[0].items.map(item => ({ set: 'vocab', id: item.id, text: item.audio, level: item.type }))
];
console.log(JSON.stringify(out));
