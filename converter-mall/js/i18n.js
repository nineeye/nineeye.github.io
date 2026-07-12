/**
 * i18n.js
 * ------------------------------------------------------------------
 * 하드코딩된 문자열을 피하기 위한 최소 다국어 골격.
 * 지금은 ko/en 두 언어만 채워져 있지만, 새 언어는 DICT 에 키만
 * 추가하면 된다. 플러그인 manifest.json 의 name/description 도
 * { "ko": "...", "en": "..." } 형태를 사용해 이 구조와 일관성을 맞춘다.
 * ------------------------------------------------------------------
 */

const DICT = {
  ko: {
    'app.title': '변환기 종합 백화점',
    'app.tagline': '브라우저 안에서 끝나는 파일 변환. 서버 업로드 없음.',
    'search.placeholder': '변환기 검색 (예: pdf, 압축, csv)',
    'privacy.notice': '모든 작업은 귀하의 브라우저 내에서 처리되며, 파일은 외부 서버로 전송되지 않습니다.',
    'nav.favorites': '즐겨찾기',
    'nav.recent': '최근 사용',
    'nav.allTools': '전체 도구',
    'action.convert': '변환하기',
    'action.download': '다운로드',
    'action.reset': '초기화',
    'action.cancel': '취소',
    'state.empty.favorites': '즐겨찾기한 도구가 없습니다. 카드의 ☆ 를 눌러 추가하세요.',
    'state.empty.recent': '아직 사용한 도구가 없습니다.',
    'state.empty.search': '검색 결과가 없습니다.',
  },
  en: {
    'app.title': 'Converter Department Store',
    'app.tagline': 'File conversion that never leaves your browser.',
    'search.placeholder': 'Search converters (e.g. pdf, compress, csv)',
    'privacy.notice': 'Everything runs locally in your browser. Files are never uploaded to a server.',
    'nav.favorites': 'Favorites',
    'nav.recent': 'Recent',
    'nav.allTools': 'All tools',
    'action.convert': 'Convert',
    'action.download': 'Download',
    'action.reset': 'Reset',
    'action.cancel': 'Cancel',
    'state.empty.favorites': 'No favorites yet — tap ☆ on a card to add one.',
    'state.empty.recent': 'No tools used yet.',
    'state.empty.search': 'No results found.',
  },
};

let currentLang = (navigator.language || 'ko').startsWith('ko') ? 'ko' : 'en';

function t(key) {
  return DICT[currentLang]?.[key] ?? DICT.ko[key] ?? key;
}
function setLang(lang) {
  if (DICT[lang]) currentLang = lang;
}
function getLang() {
  return currentLang;
}
function pick(localizedObj) {
  // manifest 안의 {ko:"", en:""} 객체에서 현재 언어 값을 꺼냄
  if (!localizedObj) return '';
  if (typeof localizedObj === 'string') return localizedObj;
  return localizedObj[currentLang] ?? localizedObj.ko ?? Object.values(localizedObj)[0] ?? '';
}

export default { t, setLang, getLang, pick };
