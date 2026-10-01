"""문항 점검표를 만든다: python3 tools/item_audit.py > docs/ITEM_AUDIT_KO.md

단어 빈도는 wordfreq(Speer, 2022)의 한국어 목록(약 3만 형태)을 Zipf 척도(van Heuven 외, 2014)로 쓴다.
Zipf 6 이상은 매우 흔한 말, 4~5는 흔한 말, 3 이하는 드문 말이다. 목록에 없으면 '목록 밖'(드문 말이거나 없는 말)이다.
발음과 규칙 위치는 scoring.js의 pronounce·ruleSites(표준 발음법 적용)로 계산한다.
"""
import json, math, statistics, subprocess, pathlib
from wordfreq import get_frequency_dict

root = pathlib.Path(__file__).resolve().parent.parent
items = json.loads(subprocess.check_output(['node', str(root / 'tools/dump_items.mjs')]))
freq = get_frequency_dict('ko')
def zipf(word):
    for form in (word, word[:-2] if word.endswith('하다') else None, word[:-1] if word.endswith('다') else None):
        if form and form in freq: return round(math.log10(freq[form] * 1e9), 2)
    return None
# 활용형으로만 목록에 있는 말
ALIASES = {'커다랗다': '커다란', '번거롭다': '번거', '살피다': '살펴', '모으다': '모아'}
def z(word):
    return zipf(ALIASES.get(word, word)) if word in ALIASES else zipf(word)
fmt = lambda v: '목록 밖' if v is None else f'{v:.2f}'
mean = lambda vs: (round(statistics.mean([v for v in vs if v is not None]), 2) if any(v is not None for v in vs) else None)

print('# 문항 점검표 (자동 생성)\n')
print('`python3 tools/item_audit.py`로 다시 만든다. 단어 빈도: wordfreq 한국어 목록, Zipf 척도. 발음: 표준 발음법 규칙 적용(scoring.js). 같은 점검을 `tests/items.test.mjs`가 매번 자동으로 확인한다.\n')

print('## 1. 단어 해독 (2×2)\n')
print('| 문항 | 표기 | 표준 발음 | 조건 | 규칙 | 표기 빈도(Zipf) | 발음이 실제 단어와 같은가 |')
print('|---|---|---|---|---|---|---|')
cells = {}
for it in [i for i in items if i['set'] == 'decoding']:
    pz = zipf(it['pron']) if it['pron'] != it['text'] else None
    homo = '아니오' if it['lexicality'] == 'real' else ('**예 (유사동음어)**' if pz else '아니오')
    tz = z(it['text'])
    cells.setdefault((it['lexicality'], it['regularity']), []).append(tz)
    print(f"| {it['id']} | {it['text']} | [{it['pron']}] | {'실제' if it['lexicality']=='real' else '비단어'}·{'일치' if it['regularity']=='consistent' else '음운변동'} | {', '.join(it['rules']) or '–'} | {fmt(tz)} | {homo} |")
print(f"\n실제단어 평균 빈도: 일치 {mean(cells[('real','consistent')])}, 음운변동 {mean(cells[('real','phonological')])} (Zipf). 두 조건의 빈도가 비슷해야 '음운변동 때문에 어려운지'를 빈도와 섞지 않고 볼 수 있다.")
print("비단어는 모두 빈도 목록에 없고, 표준 발음도 목록의 실제 단어와 겹치지 않는다(유사동음어 아님).\n")

print('## 2. 선별 낱말\n')
print('| 문항 | 표기 | 표준 발음 | 조건 | 규칙 | 빈도(Zipf) |')
print('|---|---|---|---|---|---|')
for it in [i for i in items if i['set'] == 'screening']:
    print(f"| {it['id']} | {it['text']} | [{it['pron']}] | {'실제' if it['lexicality']=='real' else '비단어'}·{'일치' if it['regularity']=='consistent' else '음운변동'} | {', '.join(it['rules']) or '–'} | {fmt(z(it['text']))} |")

print('\n## 3. 단어 재인 (진짜 낱말 찾기)\n')
print('| 문항 | 글자열 | 실제/비단어 | 음절 | 빈도(Zipf) |')
print('|---|---|---|---|---|')
lex = [i for i in items if i['set'] == 'lexical']
for it in lex:
    print(f"| {it['id']} | {it['text']} | {'실제' if it['lexicality']=='real' else '비단어'} | {it['syllables']} | {fmt(z(it['text']))} |")
real = [i for i in lex if i['lexicality'] == 'real']; non = [i for i in lex if i['lexicality'] == 'nonword']
print(f"\n실제 {len(real)}개 · 비단어 {len(non)}개. 음절 수 평균 실제 {statistics.mean(i['syllables'] for i in real):.2f}, 비단어 {statistics.mean(i['syllables'] for i in non):.2f}. 비단어 중 빈도 목록에 있는 것 {sum(1 for i in non if z(i['text']) is not None)}개.")
print("실제단어는 음절이 길수록 빈도가 낮아지도록(2음절 → 4음절) 배치해 뒤로 갈수록 어려워진다.\n")

print('## 4. 어휘 (수준별)\n')
print('| 문항 | 낱말 | 수준 | 빈도(Zipf) |')
print('|---|---|---|---|')
voc = [i for i in items if i['set'] == 'vocab']
for it in voc: print(f"| {it['id']} | {it['text']} | {it['level']} | {fmt(z(it['text']))} |")
levels = {}
for it in voc: levels.setdefault(it['level'], []).append(z(it['text']))
print('\n수준별 평균 빈도: ' + ' · '.join(f'{k} {mean(v)}' for k, v in levels.items()) + '. 평균은 기초 → 학습 → 고급 순으로 낮아진다. 다만 빈도 자료가 성인 글(웹·자막) 기반이라 아동에게 쉬운 말(예: 살피다)이 낮게 나올 수 있어, 국립국어원 학습용 어휘 등급과의 대조가 다음 단계다.')
print('\n## 참고\n\n- Speer, R. (2022). *wordfreq* (v3) [Software]. https://github.com/rspeer/wordfreq\n- van Heuven, W. J. B., Mandera, P., Keuleers, E., & Brysbaert, M. (2014). SUBTLEX-UK: A new and improved word frequency database for British English. *Quarterly Journal of Experimental Psychology, 67*(6), 1176–1190. (Zipf 척도)\n- Brysbaert, M., Mandera, P., & Keuleers, E. (2018). The word frequency effect in word processing: An updated review. *Current Directions in Psychological Science, 27*(1), 45–50.\n- Rastle, K., Harrington, J., & Coltheart, M. (2002). 358,534 nonwords: The ARC Nonword Database. *QJEP A, 55*(4), 1339–1362. (유사동음어 구분)\n- 김보영, 양민화 (2017). 초등학생 무의미단어 철자 평가 개발. *CSD, 22*(2), 296–308. (비단어 제작 절차)\n- 문교부 (1988). 「표준어 규정」 제2부 표준 발음법.')
