// 화면, 세션, 결과지가 같은 버전을 쓰도록 한 곳에서 관리한다.
(function (global) {
  const VERSION = '0.15.0';
  const api = Object.freeze({ VERSION, LABEL: `연구용 프로토타입 v${VERSION}` });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else global.ReadingPrototypeVersion = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
