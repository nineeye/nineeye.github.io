'use strict';
/* AllFileOne WebStudio V33: the same static example pricing for main + consultation.
 * This is a design planning guide, not a contract or actual payment quote.
 * No traffic, tracking, user storage, accounts or API calls.
 */
(() => {
  const plans=Object.freeze({basic:290000,business:590000,advanced:990000});
  const addons=Object.freeze({catalog:250000,reservation:120000,languages:200000,cms:350000,seo:100000});
  const planLabels=Object.freeze({basic:'기본 소개형',business:'업종 맞춤형',advanced:'업무 기능형'});
  const addonLabels=Object.freeze({catalog:'제품·서비스 카탈로그',reservation:'외부 예약 서비스 연결',languages:'영문 페이지 구성',cms:'콘텐츠 수정 관리 기능',seo:'검색 노출 구조 정리'});
  const allowedThemes=Object.freeze(['modern','premium','editorial']);
  const own=(obj,key)=>Object.prototype.hasOwnProperty.call(obj,key);
  function calculate(plan,keys){
    if(!own(plans,plan)||!Array.isArray(keys)||keys.length>5||keys.some(k=>!own(addons,k)))return null;
    const distinct=[...new Set(keys)];
    return Object.freeze({plan,addons:Object.freeze(distinct),total:plans[plan]+distinct.reduce((v,k)=>v+addons[k],0)});
  }
  function parse(search,validIndustries){
    const q=new URLSearchParams(search);
    if(q.get('source')!=='estimate')return null;
    const industry=q.get('industry'),theme=q.get('theme'),plan=q.get('plan'),raw=q.get('addons')||'';
    if(!Array.isArray(validIndustries)||!validIndustries.includes(industry)||
      !allowedThemes.includes(theme)||!own(plans,plan)||
      raw.length>80||!(/^(?:|(?:catalog|reservation|languages|cms|seo)(?:,(?:catalog|reservation|languages|cms|seo)){0,4})$/).test(raw))return null;
    const pricing=calculate(plan,raw?raw.split(','):[]);
    return pricing?Object.freeze({...pricing,industry,theme}):null;
  }
  window.WEBSTUDIO_ESTIMATE_MODEL=Object.freeze({plans,addons,planLabels,addonLabels,allowedThemes,calculate,parse});
})();
