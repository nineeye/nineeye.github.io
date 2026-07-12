const SW_URL = new URL("../../service-worker.js", import.meta.url);
const SW_SCOPE = new URL("../../", import.meta.url).pathname;
const PWA_STATE_KEY = "converter-mall:pwa-state:v2";
const CONVERTER_USAGE_KEY = "converter-mall:converter-usage:v2";
const PWA_PREDICTION_AUDIT_KEY = "converter-mall:pwa-prediction-audit:v1";
const PWA_WEEKLY_PATTERN_KEY = "converter-mall:pwa-weekly-patterns:v1";
const PWA_CACHE_VERSION = "converter-mall-stage100-v3";
const IS_LOCAL_DEVELOPMENT = ["localhost", "127.0.0.1", "::1"].includes(location.hostname);

async function disableLocalServiceWorkerCache() {
  if (!IS_LOCAL_DEVELOPMENT) return false;
  try {
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(registration => registration.unregister()));
    }
    if ("caches" in window) {
      const names = await caches.keys();
      await Promise.all(names.filter(name => name.startsWith("converter-mall-")).map(name => caches.delete(name)));
    }
  } catch (error) {
    console.warn("Converter Mall local cache cleanup skipped:", error);
  }
  return true;
}

const CACHE_PRIORITY_POLICY = Object.freeze({
  halfLifeDays: 14,
  recencyWindowDays: 30,
  countWeight: 10,
  recencyWeight: 1,
  maxConverters: 4,
  hourPatternWeight: 18,
  weekdayPatternWeight: 14,
  adjacentHourWeight: 7,
  minimumPatternSamples: 3,
  minimumAuditSamples: 5,
  targetPredictionAccuracy: 0.65,
  minimumPatternReliability: 0.35,
  predictionWindowHours: 6,
  maxAuditRecords: 120,
  patternRefinementMinSamples: 5,
  patternRefinementLowAccuracy: 0.45,
  patternRefinementGain: 0.10,
  suppressedHourFactor: 0.20,
  lifecycleRetentionDays: 90,
  lifecycleStaleDays: 45,
  lifecycleDecayFactor: 0.60,
  lifecycleMinimumBinCount: 0.25,
  lifecycleMaxAuditRecords: 80,
  weeklyArchiveWeeks: 26,
  seasonalLookbackWeeks: 12,
  seasonalHalfLifeWeeks: 4,
  seasonalPatternWeight: 12
});

let deferredInstallPrompt = null;
let serviceWorkerRegistration = null;
let updateRegistration = null;
let controllerReloaded = false;

function injectPwaStyles() {
  if (document.getElementById("cmPwaStyles")) return;
  const style = document.createElement("style");
  style.id = "cmPwaStyles";
  style.textContent = `
    .cm-pwa-panel{position:fixed;right:18px;bottom:18px;z-index:9998;display:flex;align-items:center;gap:8px;max-width:min(560px,calc(100vw - 36px));padding:10px 12px;border:1px solid rgba(148,163,184,.35);border-radius:16px;background:rgba(255,255,255,.94);box-shadow:0 14px 40px rgba(15,23,42,.18);backdrop-filter:blur(12px);font:600 13px/1.35 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#0f172a}
    .cm-pwa-panel[hidden]{display:none!important}.cm-pwa-status{display:flex;align-items:center;gap:7px;min-width:0}.cm-pwa-dot{width:9px;height:9px;border-radius:999px;background:#22c55e;box-shadow:0 0 0 4px rgba(34,197,94,.14);flex:none}.cm-pwa-panel.is-offline .cm-pwa-dot{background:#f59e0b;box-shadow:0 0 0 4px rgba(245,158,11,.16)}.cm-pwa-panel.is-update .cm-pwa-dot{background:#2563eb;box-shadow:0 0 0 4px rgba(37,99,235,.15)}.cm-pwa-panel.is-error .cm-pwa-dot{background:#ef4444;box-shadow:0 0 0 4px rgba(239,68,68,.15)}.cm-pwa-text{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.cm-pwa-actions{display:flex;gap:6px;margin-left:auto}.cm-pwa-btn{border:0;border-radius:10px;padding:8px 10px;background:#2563eb;color:#fff;font:800 12px/1 system-ui;cursor:pointer}.cm-pwa-btn.secondary{background:#e2e8f0;color:#0f172a}.cm-pwa-btn:focus-visible{outline:3px solid rgba(37,99,235,.3);outline-offset:2px}
    .cm-pwa-diagnostics{position:fixed;inset:0;z-index:10000;display:grid;place-items:center;padding:20px;background:rgba(15,23,42,.58)}.cm-pwa-diagnostics[hidden]{display:none}.cm-pwa-card{width:min(620px,100%);max-height:min(720px,90vh);overflow:auto;border-radius:22px;background:#fff;color:#0f172a;box-shadow:0 30px 90px rgba(15,23,42,.3);padding:22px}.cm-pwa-card h2{margin:0 0 16px}.cm-pwa-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.cm-pwa-metric{padding:12px;border:1px solid #e2e8f0;border-radius:14px;background:#f8fafc}.cm-pwa-metric b{display:block;margin-bottom:4px}.cm-pwa-tools{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}.cm-pwa-list{margin:14px 0 0;padding-left:20px}.cm-pwa-close{float:right}
    @media (prefers-color-scheme:dark){.cm-pwa-panel{background:rgba(15,23,42,.94);color:#e2e8f0;border-color:rgba(148,163,184,.25)}.cm-pwa-btn.secondary{background:#334155;color:#f8fafc}.cm-pwa-card{background:#0f172a;color:#e2e8f0}.cm-pwa-metric{background:#111827;border-color:#334155}}
    @media(max-width:640px){.cm-pwa-panel{left:12px;right:12px;bottom:12px;max-width:none;align-items:flex-start}.cm-pwa-status{flex:1}.cm-pwa-text{white-space:normal}.cm-pwa-actions{flex-wrap:wrap;justify-content:flex-end}.cm-pwa-grid{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);
}

function ensurePwaPanel() {
  let panel = document.getElementById("cmPwaPanel");
  if (panel) return panel;
  injectPwaStyles();
  panel = document.createElement("aside");
  panel.id = "cmPwaPanel";
  panel.className = "cm-pwa-panel";
  panel.setAttribute("role", "status");
  panel.setAttribute("aria-live", "polite");
  panel.hidden = true;
  panel.innerHTML = `<div class="cm-pwa-status"><span class="cm-pwa-dot" aria-hidden="true"></span><span class="cm-pwa-text" id="cmPwaText">앱 상태를 확인하는 중입니다.</span></div><div class="cm-pwa-actions"><button type="button" class="cm-pwa-btn" id="cmPwaPrimary" hidden></button><button type="button" class="cm-pwa-btn secondary" id="cmPwaDiagnostics">진단</button><button type="button" class="cm-pwa-btn secondary" id="cmPwaDismiss" aria-label="알림 닫기">닫기</button></div>`;
  document.body.appendChild(panel);
  panel.querySelector("#cmPwaDismiss")?.addEventListener("click", () => { panel.hidden = true; });
  panel.querySelector("#cmPwaDiagnostics")?.addEventListener("click", openPwaDiagnostics);
  return panel;
}

function showPwaState({ text, mode = "online", actionLabel = "", onAction = null, persistent = false }) {
  const panel = ensurePwaPanel();
  panel.hidden = false;
  panel.classList.toggle("is-offline", mode === "offline");
  panel.classList.toggle("is-update", mode === "update");
  panel.classList.toggle("is-error", mode === "error");
  panel.querySelector("#cmPwaText").textContent = text;
  const primary = panel.querySelector("#cmPwaPrimary");
  primary.hidden = !actionLabel; primary.textContent = actionLabel; primary.onclick = onAction;
  clearTimeout(showPwaState.timer);
  if (!persistent) showPwaState.timer = setTimeout(() => { panel.hidden = true; }, 5200);
}

function isStandalone() { return window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true; }
function formatBytes(bytes=0){ if(!Number.isFinite(bytes)||bytes<=0)return "0 B"; const u=["B","KB","MB","GB"]; const i=Math.min(Math.floor(Math.log(bytes)/Math.log(1024)),u.length-1); return `${(bytes/1024**i).toFixed(i?1:0)} ${u[i]}`; }

async function getCacheDiagnostics(){
  const result={supported:"caches" in window, cacheCount:0, bytes:0, entries:0, names:[], storageUsage:null, storageQuota:null, offlineReady:false};
  if(!result.supported) return result;
  const names=await caches.keys(); result.names=names; result.cacheCount=names.length;
  for(const name of names){ const cache=await caches.open(name); const reqs=await cache.keys(); result.entries+=reqs.length; for(const req of reqs){ const res=await cache.match(req); if(res){ const len=Number(res.headers.get("content-length")); if(Number.isFinite(len)&&len>0) result.bytes+=len; else result.bytes+=(await res.clone().arrayBuffer()).byteLength; } } }
  result.offlineReady=Boolean(await caches.match(new URL("../../offline.html",import.meta.url)));
  if(navigator.storage?.estimate){ const e=await navigator.storage.estimate(); result.storageUsage=e.usage??null; result.storageQuota=e.quota??null; }
  return result;
}

async function clearRuntimeCaches(){
  const names=await caches.keys();
  const targets=names.filter(n=>n.includes("-runtime"));
  await Promise.all(targets.map(n=>caches.delete(n)));
  try{ localStorage.setItem(PWA_STATE_KEY,JSON.stringify({lastCacheClear:new Date().toISOString()})); }catch{}
  return targets.length;
}

function waitForWorkerMessage(expectedType, timeout=10000){
  return new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>{cleanup();reject(new Error("서비스 워커 응답 시간이 초과되었습니다."));},timeout);
    const onMessage=(event)=>{if(event.data?.type!==expectedType)return;cleanup();resolve(event.data);};
    const cleanup=()=>{clearTimeout(timer);navigator.serviceWorker?.removeEventListener("message",onMessage);};
    navigator.serviceWorker?.addEventListener("message",onMessage);
  });
}

async function requestWorkerAction(message, expectedType, timeout=10000){
  const worker=navigator.serviceWorker?.controller||serviceWorkerRegistration?.active;
  if(!worker) throw new Error("활성 서비스 워커가 없습니다.");
  const response=waitForWorkerMessage(expectedType,timeout);
  worker.postMessage(message);
  return response;
}

async function repairCoreCache(){
  return requestWorkerAction({type:"REPAIR_CORE_CACHE"},"CORE_CACHE_REPAIRED",20000);
}

async function retryFailedCacheItems(result){
  const failures=Array.isArray(result?.failures)?result.failures:[];
  if(!failures.length)return {requested:0,cached:0,recovered:0,failures:[],complete:true};
  const urls=failures.map(item=>item.url).filter(Boolean);
  const response=await requestWorkerAction({type:"RETRY_FAILED_URLS",urls,cacheName:result.cacheName},"FAILED_URLS_RETRIED",45000);
  return response.result;
}


async function requestPersistentStorage(){
  if(!navigator.storage?.persist) return {supported:false,persisted:false};
  const persisted=await navigator.storage.persist();
  return {supported:true,persisted};
}

async function recoverStoragePressure(){
  let usage=null, quota=null;
  if(navigator.storage?.estimate){
    const estimate=await navigator.storage.estimate();
    usage=estimate.usage??null; quota=estimate.quota??null;
  }
  return requestWorkerAction({type:"AUTO_RECOVER_STORAGE",usage,quota,targetRatio:.72},"STORAGE_RECOVERY_COMPLETED",30000);
}

async function autoRecoverStorageIfNeeded(){
  if(!navigator.storage?.estimate)return null;
  const estimate=await navigator.storage.estimate();
  const usage=estimate.usage??0, quota=estimate.quota??0;
  if(!quota||usage/quota<.85)return null;
  const response=await recoverStoragePressure();
  const removed=(response.result?.actions||[]).reduce((sum,a)=>sum+(a.removed||0)+(a.deleted?1:0),0);
  showPwaState({text:`저장 공간 사용률이 높아 오래된 캐시 ${removed}개를 자동 정리했습니다.`,mode:"online"});
  return response;
}


function readConverterUsage(){
  try{return JSON.parse(localStorage.getItem(CONVERTER_USAGE_KEY)||"{}");}catch{return {};}
}
function writeConverterUsage(value){
  try{localStorage.setItem(CONVERTER_USAGE_KEY,JSON.stringify(value));}catch{}
}

function getIsoWeekKey(date = new Date()) {
  const utc = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((utc - yearStart) / 86400000) + 1) / 7);
  return `${utc.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}
function readWeeklyPatterns(){
  try{
    const parsed=JSON.parse(localStorage.getItem(PWA_WEEKLY_PATTERN_KEY)||"{}");
    return parsed&&typeof parsed==="object"?parsed:{};
  }catch{return {};}
}
function writeWeeklyPatterns(value){
  try{localStorage.setItem(PWA_WEEKLY_PATTERN_KEY,JSON.stringify(value));}catch{}
}
function recordWeeklyConverterUsage(id, when = new Date()){
  if(!id)return;
  const archive=readWeeklyPatterns();
  const key=getIsoWeekKey(when);
  const week=archive[key]&&typeof archive[key]==="object"?archive[key]:{week:key,updatedAt:0,converters:{}};
  const item=week.converters[id]||{count:0,hours:Array(24).fill(0),weekdays:Array(7).fill(0)};
  item.count=(Number(item.count)||0)+1;
  item.hours=Array.isArray(item.hours)&&item.hours.length===24?item.hours.map(v=>Number(v)||0):Array(24).fill(0);
  item.weekdays=Array.isArray(item.weekdays)&&item.weekdays.length===7?item.weekdays.map(v=>Number(v)||0):Array(7).fill(0);
  item.hours[when.getHours()]+=1; item.weekdays[when.getDay()]+=1;
  week.converters[id]=item; week.updatedAt=when.getTime(); archive[key]=week;
  const keep=Math.max(4,Number(CACHE_PRIORITY_POLICY.weeklyArchiveWeeks)||26);
  const keys=Object.keys(archive).sort();
  while(keys.length>keep){delete archive[keys.shift()];}
  writeWeeklyPatterns(archive);
}
function calculateSeasonalPatternAffinity(id, when = new Date(), policy = CACHE_PRIORITY_POLICY){
  const archive=readWeeklyPatterns();
  const weeks=Object.values(archive).filter(w=>w&&w.converters&&w.converters[id]).sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0));
  const limit=Math.max(1,Number(policy.seasonalLookbackWeeks)||12);
  const selected=weeks.slice(0,limit);
  if(!selected.length)return {seasonalScore:0,seasonalSamples:0,seasonalConfidence:0};
  const now=when.getTime(); const halfLife=Math.max(1,Number(policy.seasonalHalfLifeWeeks)||4);
  let weighted=0,totalWeight=0,samples=0;
  for(const week of selected){
    const stat=week.converters[id]; const ageWeeks=Math.max(0,(now-(Number(week.updatedAt)||now))/(7*86400000));
    const recency=Math.pow(.5,ageWeeks/halfLife);
    const h=Number(stat.hours?.[when.getHours()])||0; const d=Number(stat.weekdays?.[when.getDay()])||0;
    const count=Math.max(1,Number(stat.count)||0);
    const affinity=Math.min(1,((h/count)*.6)+((d/count)*.4));
    weighted+=affinity*recency; totalWeight+=recency; samples+=Number(stat.count)||0;
  }
  const confidence=Math.min(1,samples/12);
  const score=(totalWeight?weighted/totalWeight:0)*(Number(policy.seasonalPatternWeight)||12)*confidence;
  return {seasonalScore:Number(score.toFixed(4)),seasonalSamples:samples,seasonalConfidence:Number(confidence.toFixed(4)),seasonalWeeks:selected.length};
}
function manageWeeklyPatternArchive(now = new Date(), policy = CACHE_PRIORITY_POLICY){
  const archive=readWeeklyPatterns(); const keep=Math.max(4,Number(policy.weeklyArchiveWeeks)||26);
  const keys=Object.keys(archive).sort(); let removedWeeks=0;
  while(keys.length>keep){delete archive[keys.shift()];removedWeeks+=1;}
  writeWeeklyPatterns(archive);
  const result={weeks:Object.keys(archive).length,removedWeeks,currentWeek:getIsoWeekKey(now),ranAt:now.toISOString()};
  try{localStorage.setItem("converter-mall:pwa-weekly-archive:last",JSON.stringify(result));}catch{}
  return result;
}

function readPredictionAudit(){
  try{
    const parsed=JSON.parse(localStorage.getItem(PWA_PREDICTION_AUDIT_KEY)||"[]");
    return Array.isArray(parsed)?parsed:[];
  }catch{return [];}
}
function writePredictionAudit(records){
  try{
    const max=Math.max(20,Number(CACHE_PRIORITY_POLICY.maxAuditRecords)||120);
    localStorage.setItem(PWA_PREDICTION_AUDIT_KEY,JSON.stringify(records.slice(-max)));
  }catch{}
}
function recordPredictionAudit(selected=[], when=new Date()){
  const ids=(Array.isArray(selected)?selected:[]).map(item=>String(item?.id||item)).filter(Boolean);
  if(!ids.length)return null;
  const records=readPredictionAudit();
  const createdAt=when.getTime();
  const windowMs=Math.max(1,Number(CACHE_PRIORITY_POLICY.predictionWindowHours)||6)*3600000;
  const record={id:`${createdAt}-${Math.random().toString(36).slice(2,8)}`,createdAt,expiresAt:createdAt+windowMs,hour:when.getHours(),weekday:when.getDay(),predictedIds:ids,evaluated:false,hit:null,actualId:null};
  records.push(record); writePredictionAudit(records); return record;
}
function evaluatePredictionAudit(actualId, when=new Date()){
  const now=when.getTime();
  const records=readPredictionAudit();
  let changed=false;
  for(let i=records.length-1;i>=0;i-=1){
    const record=records[i];
    if(record.evaluated)continue;
    if(now<Number(record.createdAt)||now>Number(record.expiresAt)){
      if(now>Number(record.expiresAt)){record.evaluated=true;record.hit=false;record.actualId=null;changed=true;}
      continue;
    }
    record.evaluated=true;record.actualId=actualId;record.hit=Array.isArray(record.predictedIds)&&record.predictedIds.includes(actualId);record.evaluatedAt=now;changed=true;break;
  }
  if(changed)writePredictionAudit(records);
}
function getPredictionAuditSummary(when=new Date()){
  const records=readPredictionAudit().filter(item=>item?.evaluated===true);
  const hits=records.filter(item=>item.hit===true).length;
  const total=records.length;
  const hour=when.getHours(), weekday=when.getDay();
  const segment=records.filter(item=>Number(item.hour)===hour&&Number(item.weekday)===weekday);
  const segmentHits=segment.filter(item=>item.hit===true).length;
  return {total,hits,accuracy:total?hits/total:null,segmentTotal:segment.length,segmentHits,segmentAccuracy:segment.length?segmentHits/segment.length:null};
}
function calculatePredictionReliability(summary=getPredictionAuditSummary(), policy=CACHE_PRIORITY_POLICY){
  const samples=Number(summary.segmentTotal)||0;
  const minimum=Math.max(1,Number(policy.minimumAuditSamples)||5);
  if(samples<minimum)return {factor:1,samples,accuracy:summary.segmentAccuracy,status:"learning"};
  const accuracy=Math.max(0,Math.min(1,Number(summary.segmentAccuracy)||0));
  const target=Math.max(.1,Number(policy.targetPredictionAccuracy)||.65);
  const floor=Math.max(.1,Math.min(1,Number(policy.minimumPatternReliability)||.35));
  const factor=Math.max(floor,Math.min(1,accuracy/target));
  return {factor:Number(factor.toFixed(4)),samples,accuracy:Number(accuracy.toFixed(4)),status:factor<1?"reduced":"trusted"};
}
function refinePredictionPattern(when=new Date(), policy=CACHE_PRIORITY_POLICY){
  const records=readPredictionAudit().filter(item=>item?.evaluated===true);
  const weekday=when.getDay(), hour=when.getHours();
  const minimum=Math.max(2,Number(policy.patternRefinementMinSamples)||5);
  const lowAccuracy=Math.max(0,Math.min(1,Number(policy.patternRefinementLowAccuracy)||.45));
  const gain=Math.max(0,Math.min(1,Number(policy.patternRefinementGain)||.10));
  const exact=records.filter(item=>Number(item.weekday)===weekday&&Number(item.hour)===hour);
  const exactHits=exact.filter(item=>item.hit===true).length;
  const exactAccuracy=exact.length?exactHits/exact.length:null;
  if(exact.length<minimum){
    return {mode:"learning",hourFactor:1,samples:exact.length,accuracy:exactAccuracy,windowHours:[hour],reason:`정제 표본 ${exact.length}/${minimum}회`};
  }
  if(exactAccuracy>=lowAccuracy){
    return {mode:"exact",hourFactor:1,samples:exact.length,accuracy:exactAccuracy,windowHours:[hour],reason:"현재 시간대 패턴 유지"};
  }
  const adjacentHours=[(hour+23)%24,hour,(hour+1)%24];
  const merged=records.filter(item=>Number(item.weekday)===weekday&&adjacentHours.includes(Number(item.hour)));
  const mergedHits=merged.filter(item=>item.hit===true).length;
  const mergedAccuracy=merged.length?mergedHits/merged.length:0;
  if(merged.length>=minimum&&mergedAccuracy>=exactAccuracy+gain){
    return {mode:"merged",hourFactor:.72,samples:merged.length,accuracy:mergedAccuracy,windowHours:adjacentHours,reason:"저정확도 시간대를 인접 시간대와 통합"};
  }
  const factor=Math.max(.05,Math.min(1,Number(policy.suppressedHourFactor)||.20));
  return {mode:"suppressed",hourFactor:factor,samples:exact.length,accuracy:exactAccuracy,windowHours:[hour],reason:"반복 실패 시간대 영향 자동 축소"};
}

function managePredictionPatternLifecycle(now = new Date(), policy = CACHE_PRIORITY_POLICY){
  const nowMs=now.getTime();
  const retentionMs=Math.max(7,Number(policy.lifecycleRetentionDays)||90)*86400000;
  const staleMs=Math.max(7,Number(policy.lifecycleStaleDays)||45)*86400000;
  const decay=Math.max(.1,Math.min(1,Number(policy.lifecycleDecayFactor)||.60));
  const minimum=Math.max(0,Number(policy.lifecycleMinimumBinCount)||.25);
  const usage=readConverterUsage();
  let compactedConverters=0, removedBins=0, prunedConverters=0;
  for(const [id,raw] of Object.entries(usage)){
    const item=raw&&typeof raw==="object"?raw:{};
    const lastUsed=Math.max(0,Number(item.lastUsed)||0);
    const age=lastUsed?nowMs-lastUsed:Number.POSITIVE_INFINITY;
    let changed=false;
    if(age>=staleMs){
      const compact=(values,size)=>{
        const source=Array.isArray(values)&&values.length===size?values:Array(size).fill(0);
        return source.map(value=>{
          const before=Math.max(0,Number(value)||0);
          const after=before*decay;
          if(before>0&&after<minimum){removedBins+=1;changed=true;return 0;}
          const rounded=Number(after.toFixed(3));
          if(rounded!==before)changed=true;
          return rounded;
        });
      };
      item.hours=compact(item.hours,24);
      item.weekdays=compact(item.weekdays,7);
      item.count=Number((Math.max(0,Number(item.count)||0)*decay).toFixed(3));
      if(item.count<minimum)item.count=0;
    }
    const noPattern=(item.hours||[]).every(v=>(Number(v)||0)<=0)&&(item.weekdays||[]).every(v=>(Number(v)||0)<=0);
    if(age>=retentionMs&&noPattern&&item.count<=0){delete usage[id];prunedConverters+=1;continue;}
    if(changed){usage[id]=item;compactedConverters+=1;}
  }
  writeConverterUsage(usage);
  const records=readPredictionAudit();
  const maxRecords=Math.max(20,Number(policy.lifecycleMaxAuditRecords)||80);
  const kept=records.filter(record=>{
    const stamp=Math.max(Number(record.evaluatedAt)||0,Number(record.createdAt)||0);
    return stamp&&nowMs-stamp<=retentionMs;
  }).slice(-maxRecords);
  if(kept.length!==records.length)writePredictionAudit(kept);
  const result={compactedConverters,removedBins,prunedConverters,prunedAuditRecords:records.length-kept.length,remainingAuditRecords:kept.length,ranAt:now.toISOString()};
  try{localStorage.setItem("converter-mall:pwa-pattern-lifecycle:last",JSON.stringify(result));}catch{}
  return result;
}

function recordCurrentConverterUsage(now = new Date()){
  const match=location.pathname.match(/\/converters\/([^/]+)\//);
  if(!match)return;
  const id=decodeURIComponent(match[1]);
  const usage=readConverterUsage();
  const item=usage[id]||{count:0,lastUsed:0,hours:Array(24).fill(0),weekdays:Array(7).fill(0)};
  item.count=(Number(item.count)||0)+1;
  item.lastUsed=now.getTime();
  item.hours=Array.isArray(item.hours)&&item.hours.length===24?item.hours.map(v=>Number(v)||0):Array(24).fill(0);
  item.weekdays=Array.isArray(item.weekdays)&&item.weekdays.length===7?item.weekdays.map(v=>Number(v)||0):Array(7).fill(0);
  item.hours[now.getHours()]+=1;
  item.weekdays[now.getDay()]+=1;
  usage[id]=item;
  writeConverterUsage(usage);
  recordWeeklyConverterUsage(id,now);
  evaluatePredictionAudit(id,now);
}
function calculateDecayedPriority({ count = 0, lastUsed = 0 } = {}, now = Date.now(), policy = CACHE_PRIORITY_POLICY){
  const safeCount=Math.max(0,Number(count)||0);
  const safeLastUsed=Math.max(0,Number(lastUsed)||0);
  const ageDays=safeLastUsed?Math.max(0,(now-safeLastUsed)/86400000):3650;
  const halfLife=Math.max(1,Number(policy.halfLifeDays)||14);
  const decayFactor=Math.pow(.5,ageDays/halfLife);
  const effectiveCount=safeCount*decayFactor;
  const recencyWindow=Math.max(1,Number(policy.recencyWindowDays)||30);
  const recencyRatio=Math.max(0,1-ageDays/recencyWindow);
  const score=effectiveCount*(Number(policy.countWeight)||10)+recencyRatio*recencyWindow*(Number(policy.recencyWeight)||1);
  return {score:Number(score.toFixed(4)),ageDays:Number(ageDays.toFixed(2)),decayFactor:Number(decayFactor.toFixed(4)),effectiveCount:Number(effectiveCount.toFixed(3)),recencyRatio:Number(recencyRatio.toFixed(4))};
}

function calculatePatternAffinity(stat = {}, when = new Date(), policy = CACHE_PRIORITY_POLICY){
  const hours=Array.isArray(stat.hours)&&stat.hours.length===24?stat.hours:Array(24).fill(0);
  const weekdays=Array.isArray(stat.weekdays)&&stat.weekdays.length===7?stat.weekdays:Array(7).fill(0);
  const totalHours=hours.reduce((sum,v)=>sum+(Number(v)||0),0);
  const totalWeekdays=weekdays.reduce((sum,v)=>sum+(Number(v)||0),0);
  const samples=Math.max(totalHours,totalWeekdays,Number(stat.count)||0);
  if(samples<Math.max(1,Number(policy.minimumPatternSamples)||3)) return {patternScore:0,hourAffinity:0,weekdayAffinity:0,samples,confidence:0};
  const hour=when.getHours();
  const day=when.getDay();
  const hourPeak=Math.max(1,...hours);
  const weekdayPeak=Math.max(1,...weekdays);
  const hourAffinity=(Number(hours[hour])||0)/hourPeak;
  const adjacent=((Number(hours[(hour+23)%24])||0)+(Number(hours[(hour+1)%24])||0))/(2*hourPeak);
  const weekdayAffinity=(Number(weekdays[day])||0)/weekdayPeak;
  const confidence=Math.min(1,samples/12);
  const hourScore=(hourAffinity*(Number(policy.hourPatternWeight)||18)+adjacent*(Number(policy.adjacentHourWeight)||7))*confidence;
  const weekdayScore=weekdayAffinity*(Number(policy.weekdayPatternWeight)||14)*confidence;
  const raw=hourScore+weekdayScore;
  return {patternScore:Number(raw.toFixed(4)),hourScore:Number(hourScore.toFixed(4)),weekdayScore:Number(weekdayScore.toFixed(4)),hourAffinity:Number(hourAffinity.toFixed(4)),weekdayAffinity:Number(weekdayAffinity.toFixed(4)),samples,confidence:Number(confidence.toFixed(4))};
}

function buildConverterPriority(registry, when = new Date()){
  const usage=readConverterUsage(); const now=when.getTime();
  const auditSummary=getPredictionAuditSummary(when);
  const reliability=calculatePredictionReliability(auditSummary);
  const refinement=refinePredictionPattern(when);
  return registry.map(item=>{
    const stat=usage[item.id]||{};
    const count=Number(stat.count)||0; const lastUsed=Number(stat.lastUsed)||0;
    const decay=calculateDecayedPriority({count,lastUsed},now);
    const pattern=calculatePatternAffinity(stat,when);
    const seasonal=calculateSeasonalPatternAffinity(item.id,when);
    const refinedPatternScore=((Number(pattern.hourScore)||0)*refinement.hourFactor+(Number(pattern.weekdayScore)||0))*reliability.factor;
    return {id:item.id,url:new URL(`../../converters/${item.id}/index.html`,import.meta.url).href,lastUsed,count,...decay,...pattern,...seasonal,rawPatternScore:pattern.patternScore,predictionReliability:reliability.factor,auditSamples:reliability.samples,patternRefinementMode:refinement.mode,patternHourFactor:refinement.hourFactor,patternWindowHours:refinement.windowHours,auditedPatternScore:Number(refinedPatternScore.toFixed(4)),score:Number((decay.score+refinedPatternScore+seasonal.seasonalScore).toFixed(4))};
  }).sort((a,b)=>b.score-a.score||b.patternScore-a.patternScore||b.lastUsed-a.lastUsed);
}
async function prioritizeOfflineConverters(maxConverters=CACHE_PRIORITY_POLICY.maxConverters){
  const registry=await fetch(new URL("../../data/image-converters.json",import.meta.url),{cache:"no-store"}).then(r=>r.json());
  const entries=buildConverterPriority(registry);
  const response=await requestWorkerAction({type:"PRIORITIZE_OFFLINE_CONVERTERS",entries,maxConverters},"OFFLINE_CONVERTERS_PRIORITIZED",45000);
  recordPredictionAudit(response.result?.selected||[],new Date());
  return {...response.result,audit:getPredictionAuditSummary()};
}

async function warmOfflineConverters(){
  const registry=await fetch(new URL("../../data/image-converters.json",import.meta.url),{cache:"no-store"}).then(r=>r.json());
  const urls=["../../","../../offline.html",...registry.map(item=>`../../converters/${item.id}/index.html`)]
    .map(url=>new URL(url,import.meta.url).href);
  const response=await requestWorkerAction({type:"WARM_OFFLINE_URLS",urls},"OFFLINE_URLS_WARMED",30000);
  return response.result;
}

async function openPwaDiagnostics(){
  injectPwaStyles(); let modal=document.getElementById("cmPwaDiagnosticsModal"); if(!modal){ modal=document.createElement("section"); modal.id="cmPwaDiagnosticsModal"; modal.className="cm-pwa-diagnostics"; modal.setAttribute("role","dialog"); modal.setAttribute("aria-modal","true"); document.body.appendChild(modal); }
  modal.hidden=false; modal.innerHTML=`<div class="cm-pwa-card"><button class="cm-pwa-btn secondary cm-pwa-close" id="cmPwaClose">닫기</button><h2>PWA 상태 진단</h2><p>캐시와 설치·오프라인 준비 상태를 확인하는 중입니다.</p></div>`; modal.querySelector("#cmPwaClose").onclick=()=>modal.hidden=true;
  try{
    const d=await getCacheDiagnostics(); const installed=isStandalone();
    modal.querySelector(".cm-pwa-card").innerHTML=`<button class="cm-pwa-btn secondary cm-pwa-close" id="cmPwaClose">닫기</button><h2>PWA 상태 진단</h2><div class="cm-pwa-grid"><div class="cm-pwa-metric"><b>설치 상태</b>${installed?"설치형 앱":"브라우저 실행"}</div><div class="cm-pwa-metric"><b>서비스 워커</b>${navigator.serviceWorker?.controller?"활성":"준비 중"}</div><div class="cm-pwa-metric"><b>캐시</b>${d.cacheCount}개 · ${d.entries}항목</div><div class="cm-pwa-metric"><b>캐시 추정 용량</b>${formatBytes(d.bytes)}</div><div class="cm-pwa-metric"><b>오프라인 폴백</b>${d.offlineReady?"준비 완료":"미준비"}</div><div class="cm-pwa-metric"><b>저장소 사용량</b>${d.storageUsage==null?"브라우저 비공개":`${formatBytes(d.storageUsage)} / ${formatBytes(d.storageQuota)}`}</div><div class="cm-pwa-metric"><b>저장 공간 상태</b>${d.storageUsage==null||!d.storageQuota?"확인 불가":`${Math.round(d.storageUsage/d.storageQuota*100)}% 사용 · ${d.storageUsage/d.storageQuota>=.85?"자동 회복 권장":"안정"}`}</div><div class="cm-pwa-metric"><b>캐시 점수 감쇠</b>${CACHE_PRIORITY_POLICY.halfLifeDays}일 반감기 · 최근 사용 우선</div><div class="cm-pwa-metric"><b>예측 캐시</b>시간대·요일 패턴 분석 · 최소 ${CACHE_PRIORITY_POLICY.minimumPatternSamples}회 학습</div><div class="cm-pwa-metric"><b>예측 적중률</b>${(()=>{const a=getPredictionAuditSummary();return a.total?`${Math.round(a.accuracy*100)}% · ${a.hits}/${a.total}회 적중`:"학습 대기";})()}</div><div class="cm-pwa-metric"><b>패턴 신뢰도</b>${(()=>{const r=calculatePredictionReliability();return r.status==="learning"?`표본 ${r.samples}/${CACHE_PRIORITY_POLICY.minimumAuditSamples}회`: `${Math.round(r.factor*100)}% 반영 · 최근 시간대 ${Math.round((r.accuracy||0)*100)}%`;})()}</div><div class="cm-pwa-metric"><b>패턴 정제</b>${(()=>{const r=refinePredictionPattern();const labels={learning:"학습 중",exact:"시간대 유지",merged:"인접 시간대 통합",suppressed:"저정확도 시간대 축소"};return `${labels[r.mode]||r.mode} · ${Math.round(r.hourFactor*100)}% 반영`;})()}</div><div class="cm-pwa-metric"><b>주간 패턴 아카이브</b>${(()=>{let r=null;try{r=JSON.parse(localStorage.getItem("converter-mall:pwa-weekly-archive:last")||"null");}catch{}return r?`${r.weeks}주 보관 · ${r.currentWeek}`:`최대 ${CACHE_PRIORITY_POLICY.weeklyArchiveWeeks}주 · 계절성 보정`;})()}</div><div class="cm-pwa-metric"><b>패턴 수명 관리</b>${(()=>{let r=null;try{r=JSON.parse(localStorage.getItem("converter-mall:pwa-pattern-lifecycle:last")||"null");}catch{}return r?`정리 ${r.removedBins}개 · 감사 ${r.remainingAuditRecords}건 유지`:`${CACHE_PRIORITY_POLICY.lifecycleRetentionDays}일 보존 · 자동 압축`;})()}</div></div><ul class="cm-pwa-list">${d.names.map(n=>`<li>${n}</li>`).join("")||"<li>생성된 캐시가 없습니다.</li>"}</ul><div class="cm-pwa-tools"><button class="cm-pwa-btn" id="cmWarmOffline">변환기 오프라인 준비</button><button class="cm-pwa-btn" id="cmPrioritizeOffline">사용 시점 예측 저장</button><button class="cm-pwa-btn secondary" id="cmRepairCache">핵심 캐시 복구</button><button class="cm-pwa-btn secondary" id="cmPersistStorage">캐시 보호 강화</button><button class="cm-pwa-btn secondary" id="cmRecoverStorage">저장 공간 자동 회복</button><button class="cm-pwa-btn secondary" id="cmClearRuntime">임시 캐시 정리</button><button class="cm-pwa-btn secondary" id="cmRetryFailures">실패 항목 재시도</button><button class="cm-pwa-btn secondary" id="cmWeeklyArchive">주간 패턴 압축</button><button class="cm-pwa-btn secondary" id="cmPatternLifecycle">패턴 수명 정리</button><button class="cm-pwa-btn secondary" id="cmCheckUpdate">업데이트 확인</button></div>`;
    modal.querySelector("#cmPwaClose").onclick=()=>modal.hidden=true;
    modal.querySelector("#cmRecoverStorage").onclick=async()=>{ const r=await recoverStoragePressure(); const actions=r.result?.actions||[]; const removed=actions.reduce((sum,a)=>sum+(a.removed||0)+(a.deleted?1:0),0); showPwaState({text:`저장 공간 자동 회복을 완료했습니다. 정리 항목 ${removed}개.`,mode:"online"}); openPwaDiagnostics(); };
    modal.querySelector("#cmClearRuntime").onclick=async()=>{ const n=await clearRuntimeCaches(); showPwaState({text:`임시 캐시 ${n}개를 정리했습니다.`}); openPwaDiagnostics(); };
    modal.querySelector("#cmWarmOffline").onclick=async()=>{ const r=await warmOfflineConverters(); try{localStorage.setItem("converter-mall:pwa-last-failures",JSON.stringify(r));}catch{} showPwaState({text:`오프라인 준비 ${r.cached}/${r.requested}개 완료${r.recovered?` · 재시도 복구 ${r.recovered}개`:""}${r.failures.length?` · 실패 ${r.failures.length}개`:""}.`,mode:r.failures.length?"error":"online",persistent:Boolean(r.failures.length)}); openPwaDiagnostics(); };
    modal.querySelector("#cmPrioritizeOffline").onclick=async()=>{ const r=await prioritizeOfflineConverters(4); const names=(r.selected||[]).map(item=>item.id).join(", ")||"기본 도구"; showPwaState({text:`현재 시간대에 필요한 도구 ${r.selected?.length||0}개를 예측 저장했습니다: ${names}`,mode:r.failures?.length?"error":"online",persistent:Boolean(r.failures?.length)}); openPwaDiagnostics(); };
    modal.querySelector("#cmRepairCache").onclick=async()=>{ const r=await repairCoreCache(); const f=r.result.failures.length; try{localStorage.setItem("converter-mall:pwa-last-failures",JSON.stringify(r.result));}catch{} showPwaState({text:`핵심 캐시 복구 ${r.result.cached}/${r.result.requested}개 완료${r.result.recovered?` · 재시도 복구 ${r.result.recovered}개`:""}${f?` · 실패 ${f}개`:""}.`,mode:f?"error":"online",persistent:Boolean(f)}); openPwaDiagnostics(); };
    modal.querySelector("#cmRetryFailures").onclick=async()=>{ let previous=null; try{previous=JSON.parse(localStorage.getItem("converter-mall:pwa-last-failures")||"null");}catch{} if(!previous?.failures?.length){showPwaState({text:"재시도할 실패 항목이 없습니다."});return;} const r=await retryFailedCacheItems(previous); try{localStorage.setItem("converter-mall:pwa-last-failures",JSON.stringify(r));}catch{} showPwaState({text:`실패 항목 재시도 ${r.cached}/${r.requested}개 복구${r.failures.length?` · 남은 실패 ${r.failures.length}개`:""}.`,mode:r.failures.length?"error":"online",persistent:Boolean(r.failures.length)}); openPwaDiagnostics(); };
    modal.querySelector("#cmPersistStorage").onclick=async()=>{ const r=await requestPersistentStorage(); showPwaState({text:!r.supported?"이 브라우저는 영구 저장소 요청을 지원하지 않습니다.":r.persisted?"오프라인 캐시 보호가 강화되었습니다.":"브라우저가 영구 저장소 요청을 허용하지 않았습니다.",mode:r.persisted?"online":"error"}); openPwaDiagnostics(); };
    modal.querySelector("#cmWeeklyArchive").onclick=()=>{ const r=manageWeeklyPatternArchive(new Date()); showPwaState({text:`주간 패턴 아카이브를 정리했습니다. ${r.weeks}주 보관 · ${r.removedWeeks}주 제거.`}); openPwaDiagnostics(); };
    modal.querySelector("#cmPatternLifecycle").onclick=()=>{ const r=managePredictionPatternLifecycle(new Date()); showPwaState({text:`패턴 수명 정리를 완료했습니다. 시간대 ${r.removedBins}개·감사 기록 ${r.prunedAuditRecords}건 정리.`}); openPwaDiagnostics(); };
    modal.querySelector("#cmCheckUpdate").onclick=async()=>{ await serviceWorkerRegistration?.update(); showPwaState({text:"새 버전 확인을 완료했습니다."}); };
  }catch(error){ modal.querySelector(".cm-pwa-card").innerHTML=`<button class="cm-pwa-btn secondary cm-pwa-close" id="cmPwaClose">닫기</button><h2>PWA 상태 진단</h2><p>진단 중 오류가 발생했습니다: ${String(error.message||error)}</p>`; modal.querySelector("#cmPwaClose").onclick=()=>modal.hidden=true; }
}

async function promptInstall(){ if(!deferredInstallPrompt)return; deferredInstallPrompt.prompt(); const result=await deferredInstallPrompt.userChoice.catch(()=>null); deferredInstallPrompt=null; if(result?.outcome==="accepted")showPwaState({text:"Converter Mall 설치가 시작되었습니다."}); }
function applyUpdate(){ const waiting=updateRegistration?.waiting||serviceWorkerRegistration?.waiting; if(!waiting){ serviceWorkerRegistration?.update().finally(()=>location.reload()); return; } waiting.postMessage({type:"SKIP_WAITING"}); setTimeout(()=>{ if(!controllerReloaded) location.reload(); },5000); }
function bindConnectivityStatus(){ const render=()=>{ if(!navigator.onLine)showPwaState({text:"오프라인 상태입니다. 방문했던 변환기는 계속 사용할 수 있습니다.",mode:"offline",persistent:true}); else showPwaState({text:"온라인 연결이 복구되었습니다."}); }; window.addEventListener("offline",render); window.addEventListener("online",render); if(!navigator.onLine)render(); }
function bindInstallPrompt(){ window.addEventListener("beforeinstallprompt",event=>{event.preventDefault();deferredInstallPrompt=event;showPwaState({text:"Converter Mall을 앱처럼 설치할 수 있습니다.",actionLabel:"앱 설치",onAction:promptInstall,persistent:true});}); window.addEventListener("appinstalled",()=>{deferredInstallPrompt=null;showPwaState({text:"Converter Mall 앱 설치가 완료되었습니다."});}); if(isStandalone())document.documentElement.dataset.pwaMode="standalone"; }

export async function registerConverterMallServiceWorker(){ if(!("serviceWorker" in navigator)||location.protocol==="file:")return null; try{ const registration=await navigator.serviceWorker.register(SW_URL,{scope:SW_SCOPE}); serviceWorkerRegistration=registration; registration.addEventListener("updatefound",()=>{ const worker=registration.installing;if(!worker)return; worker.addEventListener("statechange",()=>{if(worker.state==="installed"&&navigator.serviceWorker.controller){updateRegistration=registration;window.dispatchEvent(new CustomEvent("convertermall:update-ready",{detail:registration}));showPwaState({text:"새 버전이 준비되었습니다.",mode:"update",actionLabel:"지금 업데이트",onAction:applyUpdate,persistent:true});}});}); return registration; }catch(error){console.warn("Converter Mall service worker registration failed:",error);showPwaState({text:"오프라인 앱 기능을 준비하지 못했습니다. 온라인 변환 기능은 계속 사용할 수 있습니다.",mode:"error"});return null;} }

managePredictionPatternLifecycle(new Date()); manageWeeklyPatternArchive(new Date()); recordCurrentConverterUsage(); bindConnectivityStatus(); bindInstallPrompt();
navigator.serviceWorker?.addEventListener("controllerchange",()=>{ if(controllerReloaded)return; controllerReloaded=true; location.reload(); });
disableLocalServiceWorkerCache().then(disabled=>{ if(!disabled) registerConverterMallServiceWorker().then(()=>autoRecoverStorageIfNeeded().catch(()=>null)); });
export const PwaUi={promptInstall,applyUpdate,isStandalone,openPwaDiagnostics,getCacheDiagnostics,clearRuntimeCaches,warmOfflineConverters,repairCoreCache,retryFailedCacheItems,requestPersistentStorage,recoverStoragePressure,autoRecoverStorageIfNeeded,prioritizeOfflineConverters,buildConverterPriority,calculateDecayedPriority,recordCurrentConverterUsage,calculatePatternAffinity,recordPredictionAudit,evaluatePredictionAudit,getPredictionAuditSummary,calculatePredictionReliability,refinePredictionPattern,managePredictionPatternLifecycle,manageWeeklyPatternArchive,calculateSeasonalPatternAffinity,recordWeeklyConverterUsage,getIsoWeekKey,CACHE_PRIORITY_POLICY,PWA_CACHE_VERSION};
