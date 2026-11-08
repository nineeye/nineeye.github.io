/* AllFileOne WebStudio V55. Six-sector quick inquiry data, original authorship.
 * No network, tracking, storage, external assets, or personal-data collection.
 * Loaded before v49-quick-inquiry.js / v51-quick-handoff.js.
 */
(()=>{'use strict';
const source={
 restaurant:{name:'음식점 · 카페',features:[['menu','메뉴·가격·식단 안내 중심'],['visit','방문 문의·예약 연결 중심'],['group','단체·행사 상담 중심'],['brand','브랜드·매장 소개 중심']],scopes:[['small','메뉴 1~10종'],['medium','메뉴 11~40종'],['large','메뉴 41종 이상'],['unknown','메뉴 수 미정']],handoff:{menu:['메뉴·가격·식단 안내 중심','catalog','showcase'],visit:['방문 문의·예약 연결 중심','booking','booking'],group:['단체·행사 상담 중심','quote','lead'],brand:['브랜드·매장 소개 중심','location','brand']}},
 beauty:{name:'뷰티 · 미용',features:[['services','시술·가격·소요시간 안내 중심'],['consult','스타일 상담 문의 중심'],['booking','예약 링크·일정 연결 중심'],['gallery','스타일·시술 사례 갤러리 중심']],scopes:[['small','시술·서비스 1~10종'],['medium','시술·서비스 11~30종'],['large','시술·서비스 31종 이상'],['unknown','서비스 수 미정']],handoff:{services:['시술·가격·소요시간 안내 중심','catalog','showcase'],consult:['스타일 상담 문의 중심','booking','lead'],booking:['예약 링크·일정 연결 중심','booking','booking'],gallery:['스타일·시술 사례 갤러리 중심','portfolio','showcase']}},
 logistics:{name:'물류 · 운송',features:[['spec','포장 규격·중량 계산 중심'],['quote','기업 견적·거래 문의 중심'],['tracking','배송 조회 연동 검토 중심'],['guide','출고 절차·운영 안내 중심']],scopes:[['small','월 출고 1~100건'],['medium','월 출고 101~1000건'],['large','월 출고 1001건 이상'],['unknown','출고량 미정']],handoff:{spec:['포장 규격·중량 계산 중심','catalog','information'],quote:['기업 견적·거래 문의 중심','quote','lead'],tracking:['배송 조회 연동 검토 중심',null,'information'],guide:['출고 절차·운영 안내 중심','cms','information']}}
};
const quick={},handoff={},scopes={};
for(const [id,info] of Object.entries(source)){
 quick[id]=Object.freeze({name:info.name,features:info.features.map(a=>Object.freeze(a.slice())),scopes:info.scopes.map(a=>Object.freeze(a.slice()))});
 handoff[id]=Object.freeze(Object.fromEntries(Object.entries(info.handoff).map(([key,val])=>[key,Object.freeze(val.slice())])));
 scopes[id]=Object.freeze(Object.fromEntries(info.scopes.map(([key,label])=>[key,label])));
}
window.AFO_V55_QUICK_DATA=Object.freeze(quick);
window.AFO_V55_HANDOFF_SECTORS=Object.freeze(handoff);
window.AFO_V55_HANDOFF_SCOPES=Object.freeze(scopes);
})();
