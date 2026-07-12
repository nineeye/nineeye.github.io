/**
 * Shared image converter application runtime.
 * Converter pages provide only a definition and output verifier.
 */
import { UploadManager } from "../upload/UploadManager.js";
import { saveBlob, changeExt, uniqueName, sum, fmt, esc } from "./utils/file-utils.js";
import { makeZipFromBlobs, verifyZipBlob, makeZip } from "./core/ZipBuilder.js";
import { decodeImage, decodeBlobDimensions, transformImage, transformWithRetry } from "./core/ImageEngine.js";
import { mapPool } from "./core/TaskScheduler.js";
import { createResultCache } from "./core/ResultCache.js";
import { createJsonStore, probeStorage } from "./core/PersistenceStore.js";
import { createDiagnosticsManager } from "./core/DiagnosticsManager.js";
import { createConverterState } from "./core/ConverterState.js";
import { fileKey as key, matchesAcceptedFile, removeSelectedFiles, sortFileList } from "./core/FileController.js";
import { createUploadController } from "./core/UploadController.js";
import { renderSummaryResult, renderResultReport, renderErrors, updateWorkflow as renderWorkflow, setProgress, resetProgress } from "./ui/ProgressView.js";
import { bindSettingsView, syncSettingsView, readSettingsView, restoreSettingsView, buildOutputNameView } from "./ui/SettingsView.js";
import { createDownloadManager } from "./ui/DownloadManager.js";
import { createModalManager } from "./ui/ModalManager.js";
import { createOptimizationAdvisor } from "./core/OptimizationAdvisor.js";
import { createConversionController } from "./core/ConversionController.js";
import { createPreviewEstimator } from "./core/PreviewEstimator.js";
import { createSessionManager } from "./core/SessionManager.js";
import { createOptimizationView } from "./ui/OptimizationView.js";
import { createAppController } from "./ui/AppController.js";
import { createWorkspaceController } from "./core/WorkspaceController.js";
import { createFileWorkspaceView } from "./ui/FileWorkspaceView.js";
import { collectConverterElements, installRuntimeDiagnostics } from "./core/Bootstrap.js";
import { createConverterApp } from "./core/ConverterAppFactory.js";
import { QualityVolumePredictor } from "../upload/QualityVolumePredictor.js";

export function createImageConverterApplication({ converterDefinition, verifyOutput }) {
  if (!converterDefinition) throw new TypeError("converterDefinition is required");
  if (typeof verifyOutput !== "function") throw new TypeError("verifyOutput must be a function");

  const appRuntime=createConverterApp({
    definition:converterDefinition,
    createJsonStore,createConverterState,createOptimizationAdvisor,createDownloadManager,
    createSessionManager,createWorkspaceController,createFileWorkspaceView,createOptimizationView,
    createResultCache,keyOf:key,mapPool,sum,formatSize:fmt,renderWorkflow,saveBlob,makeZipFromBlobs,
    verifyZipBlob,verifyOutput,escapeHtml:esc,showToast
  });
  const qualityVolumePredictor=new QualityVolumePredictor();
  const {config}=appRuntime;
  const isAcceptedFile=file=>matchesAcceptedFile(file,{mimeTypes:converterDefinition.source.mimeTypes,extensions:converterDefinition.source.extensions});
  const {settingsStore,historyStore,themeStore,downloadReceiptStore,sessionStore}=appRuntime.stores;
  const {converterState,estimateCache,optimizationAdvisor,downloadManager,sessionManager,workspaceController,fileWorkspaceView,optimizationView}=appRuntime.services;
  const MAX_FILES=config.maxFiles,MAX_FILE_SIZE=config.maxFileSize,MAX_PIXELS=config.maxPixels,MAX_ESTIMATE_CACHE_BYTES=config.maxEstimateCacheBytes,CPU_COUNT=config.cpuCount,ESTIMATE_CONCURRENCY=config.estimateConcurrency,CONVERT_CONCURRENCY=config.convertConcurrency;
  let uploadController=null;let files=[];let originalOrder=converterState.originalOrder;let selected=converterState.selected;let converted=[];let dimensionCache=new Map();let perFile=converterState.perFile;let cancelRequested=false;let smartRecommendation=null;let toastTimer=null;let modalManager=null;let diagnosticsManager=null;let appController=null;let previewUrls=new Set();let isConverting=false;let currentElements=null;
  const previewEstimator=createPreviewEstimator({mapPool,transformImage,transformWithRetry,resultCache:estimateCache,getFiles:()=>files,getSelectedKeys:()=>selected,getFileKey:key,getSettings:(file,e)=>settingsFor(file,e),getCacheKey:resultCacheKey,findCard,formatSize:fmt,renderSummary:renderSummaryResult,updateBalance:updateBalanceScore,concurrency:ESTIMATE_CONCURRENCY,maxPixels:MAX_PIXELS,outputMimeType:converterDefinition.target.mimeType,preserveAlpha:Boolean(converterDefinition.features?.preserveAlpha)});
  const estimates=previewEstimator.estimates;
  const conversionController=createConversionController({
   mapPool,transformWithRetry,verifyOutput,getAdaptivePlan:buildAdaptivePlan,
   getFallbackProfile:()=>optimizationAdvisor.getDeviceProfile(),yieldToMainThread:yieldToBrowser,
   getCache:k=>estimateCache.get(k),getCacheKey:resultCacheKey,getSettings:f=>settingsFor(f,currentElements),
   getFileKey:key,buildOutputName:(f,i)=>buildOutputName(f,i,currentElements),uniqueName,maxPixels:MAX_PIXELS,
   outputMimeType:converterDefinition.target.mimeType,preserveAlpha:Boolean(converterDefinition.features?.preserveAlpha),maxAttempts:2
  });

  function updateBalanceScore(e, originalBytes, convertedBytes){
    if(!e?.balanceScore||!e?.balanceMeter||!e?.balanceMeta)return;
    if(!originalBytes||!convertedBytes){
      e.balanceScore.textContent="-";
      e.balanceMeter.style.width="0%";
      e.balanceMeta.textContent="파일을 선택하면 현재 설정을 평가합니다.";
      return;
    }
    const quality=Math.max(1,Math.min(100,Number(e.qualityRange?.value||85)));
    const savingRate=Math.max(-100,Math.min(100,(originalBytes-convertedBytes)/originalBytes*100));
    const savingScore=Math.max(0,Math.min(100,savingRate));
    const score=Math.round(Math.max(0,Math.min(100,quality*0.58+savingScore*0.42)));
    e.balanceScore.textContent=`${score}점`;
    e.balanceMeter.style.width=`${score}%`;
    e.balanceMeta.textContent=score>=90?"화질과 용량의 균형이 매우 훌륭합니다.":score>=80?"화질과 용량의 균형이 좋습니다.":score>=65?"용도에 따라 품질이나 크기를 조금 조정해 보세요.":"화질 또는 용량 설정을 다시 확인하는 것을 권장합니다.";
  }
  function formatEta(seconds){
    if(!Number.isFinite(seconds)||seconds<0)return "계산중";
    const total=Math.max(0,Math.ceil(seconds));
    if(total<60)return `${total}초`;
    const minutes=Math.floor(total/60),remain=total%60;
    return remain?`${minutes}분 ${remain}초`:`${minutes}분`;
  }
  function qualityGrade(quality,savingRate,failed){
    if(failed>0)return{label:"B · 일부 점검 필요",className:"grade-b"};
    const score=Math.round(Math.max(0,Math.min(100,quality*0.62+Math.max(0,savingRate)*0.38)));
    if(score>=92)return{label:"A+ · 전문가급",className:"grade-aplus"};
    if(score>=84)return{label:"A · 매우 우수",className:"grade-a"};
    if(score>=72)return{label:"B · 균형 우수",className:"grade-b"};
    if(score>=58)return{label:"C · 용량 우선",className:"grade-c"};
    return{label:"D · 재조정 권장",className:"grade-d"};
  }
  function syncStateRefs(){originalOrder=converterState.originalOrder;selected=converterState.selected;perFile=converterState.perFile}
  function replaceSelection(keys,reason){converterState.replaceSelection(keys,reason);syncStateRefs()}
  function replaceOrder(keys,reason){converterState.replaceOrder(keys,reason);syncStateRefs()}
  function replacePerFile(entries,reason){converterState.replacePerFile(entries,reason);syncStateRefs()}
  async function start(){const e=collectConverterElements();currentElements=e;diagnosticsManager=createDiagnosticsManager({version:converterDefinition.runtimeVersion,saveBlob,makeZipFromBlobs,verifyZipBlob,verifyOutput,outputMimeType:converterDefinition.target.mimeType,outputExtension:converterDefinition.target.extension,decodeBlobDimensions,changeExt,uniqueName,sanitizeName,sum,esc,probeStorage,showToast});installRuntimeDiagnostics({diagnosticsManager,elements:e,showToast});restoreSettingsView(e,settingsStore.read()||{});applyPlannerHandoff(e);if(!("createImageBitmap" in window)||!("toBlob" in HTMLCanvasElement.prototype))renderErrors(e,["브라우저 호환성 안내: 최신 Chrome, Edge, Firefox, Safari 사용을 권장합니다."]);sessionManager.renderHistory(e);sessionManager.restoreDownloadReceipt(e);sessionManager.restoreSession(e);bind(e);runSystemCheck(e,false);setWorkflow(e,"upload");const saved=Array.from(await UploadManager.get()||[]).filter(isAcceptedFile);if(saved.length){files=saved;replaceOrder(files.map(key),"restore-upload-order");replaceSelection(files.map(key),"restore-upload-selection");show(e);await render(e)}syncSettingsView(e)}
  function bind(e){modalManager=createModalManager(e);uploadController=createUploadController({dropZone:e.dropZone,fileInput:e.fileInput,selectButton:e.selectFileBtn,getFiles:()=>files,setFiles:value=>{files=value},persistFiles:value=>UploadManager.set(value),maxFiles:MAX_FILES,maxFileSize:MAX_FILE_SIZE,acceptedEmptyMessage:converterDefinition.source.emptyMessage,accepts:isAcceptedFile,formatLabel:converterDefinition.source.label||converterDefinition.source.extensions?.join(", ")||"지원 형식",onRejected:items=>renderErrors(e,items),onFilesAdded:result=>handleFilesAdded(result,e)});uploadController.bind();
  const invalidate=()=>{converted=[];e.successCount.textContent="0개";e.convertStatus.textContent="대기중";e.downloadBtn.disabled=e.zipDownloadBtn.disabled=e.csvDownloadBtn.disabled=e.verifyReportBtn.disabled=true;e.downloadNote.textContent="";e.reportSection.hidden=true;scheduleEstimate(e)};bindSettingsView(e,{onInvalidate:invalidate,onPersist:()=>persistSettings(e),onPurposeApplied:preset=>showToast(e,`${preset.label} 프리셋을 적용했습니다.`)});
  fileWorkspaceView.bindToolbar({e,getFiles:()=>files,getSelected:()=>selected,onReplaceSelection:keys=>replaceSelection(keys,"toggle-select-all"),onSelectionSynced:()=>{syncSelection(e);scheduleEstimate(e)},onDeleteSelected:async()=>{files=removeSelectedFiles(files,selected);converterState.clearSelection("delete-selected");syncStateRefs();await UploadManager.set(files);converted=[];files.length?await render(e):await reset(e)},onSort:()=>sortFiles(e)});e.convertBtn.onclick=()=>convertAll(e);e.cancelBtn.onclick=()=>{cancelRequested=true;conversionController.requestCancel();e.statusText.textContent="취소 요청을 처리하고 있습니다..."};e.downloadBtn.onclick=()=>downloadManager.downloadEach({e,converted,renderErrors,showToast,recordDownloadReceipt:sessionManager.recordDownloadReceipt,updateSessionSummary:sessionManager.updateSession,scheduleAutoCleanup});e.zipDownloadBtn.onclick=()=>downloadManager.downloadZip({e,converted,renderErrors,showToast,recordDownloadReceipt:sessionManager.recordDownloadReceipt,updateSessionSummary:sessionManager.updateSession,scheduleAutoCleanup,yieldToBrowser,sanitizeName,stamp});e.zipCancelBtn.onclick=()=>downloadManager.cancelZipDownload();e.csvDownloadBtn.onclick=()=>downloadManager.downloadCsv({e,converted,settingsFor,showToast,stamp});e.verifyReportBtn.onclick=()=>downloadManager.downloadVerificationReport({e,converted,renderErrors,showToast,stamp,version:converterDefinition.runtimeVersion});e.autoCleanup.onchange=()=>persistSettings(e);e.sortMode.onchange=()=>sortFiles(e);e.analyzeBtn.onclick=()=>analyzeSmart(e);e.applySmartBtn.onclick=()=>applySmart(e);e.diagnoseBtn.onclick=()=>diagnoseFiles(e,true);e.resetBtn.onclick=()=>reset(e);e.recoverBtn.onclick=()=>recoverLastWork(e);e.releaseResultsBtn.onclick=()=>releaseResults(e);e.filenameMode.onchange=()=>{syncSettingsView(e);persistSettings(e)};e.filenameText.oninput=()=>persistSettings(e);e.zipName.oninput=()=>persistSettings(e);e.systemCheckBtn.onclick=()=>{modalManager.open("system",{trigger:e.systemCheckBtn,focusTarget:e.closeSystemCheckBtn});runSystemCheck(e,true)};e.rerunSystemCheckBtn.onclick=()=>runSystemCheck(e,true);e.downloadSystemReportBtn.onclick=()=>downloadSystemReport(e);e.shortcutBtn.onclick=()=>modalManager.open("shortcut",{trigger:e.shortcutBtn,focusTarget:e.closeShortcutBtn});e.helpBtn.onclick=()=>modalManager.open("help",{trigger:e.helpBtn,focusTarget:e.closeHelpBtn});e.clearHistoryBtn.onclick=()=>sessionManager.clearHistory(e);appController=createAppController({themeStore,modalManager,showToast,isConverting:()=>isConverting,onConvert:()=>{if(!e.convertBtn.disabled&&!conversionController.isRunning())convertAll(e);else showToast(e,conversionController.isRunning()?"이미 변환 중입니다.":`변환할 ${converterDefinition.source.format} 파일을 선택해 주세요.`)},onPageHide:()=>{cancelAutoCleanup(e);releaseTransientMemory()},onHidden:()=>{if(converted.length===0&&estimateCache.bytes>MAX_ESTIMATE_CACHE_BYTES/2)estimateCache.clear()}});appController.bind(e)}
  async function handleFilesAdded({added,rejected},e){for(const f of added){converterState.appendOrder(f,"add-file-order");converterState.addSelected(f,"add-file-selection")}syncStateRefs();show(e);converted=[];renderErrors(e,rejected);await render(e);updateMemoryStatus(e);setWorkflow(e,"settings");sessionManager.updateSession(e,{uploaded:added.length,state:"설정 확인"})}
  function show(e){[e.summarySection,e.optionSection,e.previewSection,e.actionSection,e.statusSection].forEach(x=>x.hidden=false)}
  async function render(e){
   releasePreviewUrls();
   files.forEach(f=>{if(!selected.has(key(f)))converterState.addSelected(f,"render-auto-select")});
   syncStateRefs();
   await fileWorkspaceView.render({
    e,files,selected,perFile,dimensions,escapeHtml:esc,registerPreviewUrl:url=>previewUrls.add(url),convertedCount:converted.length,setWorkflow:(stage)=>setWorkflow(e,stage),
    onSelectionChange:(f,checked)=>{checked?converterState.addSelected(f,"card-select"):converterState.removeSelected(f,"card-deselect");syncStateRefs();syncSelection(e);scheduleEstimate(e)},
    onDelete:async(f)=>{files=files.filter(item=>key(item)!==key(f));converterState.deleteFileState(f,"delete-card");syncStateRefs();clearFileCaches(f);await UploadManager.set(files);files.length?await render(e):await reset(e)},
    onConfigChange:(f,config)=>{converterState.setFileConfig(f,config,"file-settings");syncStateRefs();converted=[];clearFileCaches(f);e.downloadBtn.disabled=e.zipDownloadBtn.disabled=true;scheduleEstimate(e)},
    onCompare:f=>compare(f,e)
   });
   scheduleEstimate(e);diagnoseFiles(e,false)
  }
  function syncSelection(e){fileWorkspaceView.syncSelection({e,files,selected,convertedCount:converted.length,setWorkflow:stage=>setWorkflow(e,stage)})}
  function updateSummary(e){fileWorkspaceView.updateSummary(e,files)}
  function scheduleEstimate(e){previewEstimator.schedule(e)}
  async function estimate(e){return previewEstimator.run(e)}
  function settingsFor(f,e){const local=perFile.get(key(f))||{};const alphaMode=e.formatAlphaMode?.value||"preserve";const preserveAlpha=Boolean(converterDefinition.features?.preserveAlpha)&&alphaMode!=="flatten";return{quality:(local.quality||Number(e.qualityRange.value))/100,background:(alphaMode==="flatten"||["JPG","JPEG"].includes(String(converterDefinition.target.format).toUpperCase()))?(e.formatBackgroundColor?.value||bg(e)):bg(e),preserveAlpha,resizeMode:local.width?"width":e.resizeMode.value,resizeValue:local.width||Number(e.resizeValue.value),contentMode:e.formatContentMode?.value||"default",colorMode:e.formatColorMode?.value||"color",sharpen:e.formatSharpen?.value||"off",alphaMode,trimTransparent:Boolean(e.formatTrimTransparent?.checked),trimThreshold:Number(e.formatTrimThreshold?.value||0),gifFrameMode:e.formatGifFrameMode?.value||"first",gifFrameIndex:Number(e.formatGifFrameIndex?.value||1),sourceScale:Number(e.formatSvgScale?.value||1),bmpAlphaMode:e.formatBmpAlphaMode?.value||"auto",artifactMode:e.formatArtifactMode?.value||"off",sourceFrameMode:e.formatSourceFrameMode?.value||"first",sourceFrameIndex:Number(e.formatSourceFrameIndex?.value||1)}}
  function bg(e){return e.backgroundMode.value==="black"?"#000000":e.backgroundMode.value==="custom"?e.backgroundColor.value:"#ffffff"}
  async function buildAdaptivePlan(targets){return optimizationAdvisor.buildAdaptivePlan(targets,dimensions)}
  async function convertAll(e){
   cancelAutoCleanup(e);setWorkflow(e,"convert","변환 엔진을 준비하고 있습니다.");
   if(conversionController.isRunning())return;
   const targets=files.filter(f=>selected.has(key(f)));if(!targets.length)return;
   isConverting=true;cancelRequested=false;converted=[];
   const summary=await conversionController.run(targets,{
    onStart:()=>{e.convertBtn.disabled=true;e.cancelBtn.hidden=false;document.body.classList.add("busy");e.errorList.hidden=true;e.errorList.innerHTML="";e.downloadBtn.disabled=e.zipDownloadBtn.disabled=e.csvDownloadBtn.disabled=e.verifyReportBtn.disabled=true;e.downloadNote.textContent="";e.convertStatus.textContent="적응형 엔진 준비중";e.reportSection.hidden=true},
    onPlan:plan=>{e.statusText.textContent=`기기 성능에 맞춰 ${plan.workers}개 병렬 · ${plan.batchSize}개씩 분할 처리합니다.`},
    onProgress:p=>{const eta=p.remainingSeconds==null?"계산중":formatEta(p.remainingSeconds);setProgress(e,p.percent,`적응형 터보 ${p.done}/${p.total} · ${p.speed.toFixed(1)}개/초 · 남은 시간 ${eta} · ${p.workers}개 병렬 · 묶음 ${p.batchNumber}/${p.batchCount}`)},
    onBatchComplete:p=>{e.statusText.textContent=`메모리 정리 후 다음 묶음 준비 · ${p.batchIndex+1}/${p.batchCount}`},
    onItemError:({error})=>console.error(error),
   });
   converted=summary.results||[];
   if(converted.length){qualityVolumePredictor.recordBatch({sourceFormat:converterDefinition.source.format,targetFormat:converterDefinition.target.format,results:converted})}
   cancelRequested=Boolean(summary.cancelled);isConverting=false;
   const failed=summary.failed||0,errors=summary.errors||[],elapsed=(summary.elapsedMs||0)/1000,plan=summary.plan||optimizationAdvisor.getDeviceProfile();
   setProgress(e,cancelRequested?Math.round((summary.done||0)/Math.max(1,summary.total||1)*100):100);e.convertBtn.disabled=false;e.cancelBtn.hidden=true;document.body.classList.remove("busy");e.downloadBtn.disabled=e.zipDownloadBtn.disabled=e.csvDownloadBtn.disabled=e.verifyReportBtn.disabled=converted.length===0;e.successCount.textContent=converted.length+"개";e.convertStatus.textContent=cancelRequested?"취소됨":failed?"일부 완료":"완료";e.statusText.textContent=cancelRequested?`변환 취소: ${converted.length}개 완료 · ${failed}개 실패`:`적응형 터보 완료: ${converted.length}개 · 실패 ${failed}개 · ${elapsed.toFixed(2)}초 · ${plan.workers||1}개 병렬`;renderErrors(e,errors);const o=sum(converted.map(x=>x.file.size)),n=sum(converted.map(x=>x.blob.size));renderSummaryResult(e,o,n);const result={success:converted.length,failed,original:o,converted:n,time:summary.elapsedMs||0};renderResultReport(e,result);sessionManager.saveHistory(e,result);sessionManager.updateSession(e,{converted:converted.length,saved:Math.max(0,o-n),state:cancelRequested?"변환 취소":"다운로드 준비"});updateMemoryStatus(e);if(!cancelRequested){setWorkflow(e,"download",`${converted.length}개 변환과 무결성 검사가 끝났습니다.`);showToast(e,`⚡ ${converted.length}개 적응형 변환 완료 · ${elapsed.toFixed(2)}초`)}else setWorkflow(e,"settings","변환이 취소되었습니다. 설정을 확인하고 다시 시작하세요.")
  }
  function renderSummaryResult(e,o,n){const d=o-n,r=o?d/o*100:0;e.convertedSize.textContent=fmt(n);e.savedSize.textContent=d>=0?fmt(d):"+"+fmt(-d);e.compressionRate.textContent=r.toFixed(1)+"%";e.savedSize.className=d>=0?"saving-positive":"saving-negative";e.compressionRate.className=r>=0?"saving-positive":"saving-negative"}
  function renderResultReport(e,x){e.reportSuccess.textContent=x.success+"개";e.reportFailed.textContent=x.failed+"개";e.reportOriginal.textContent=fmt(x.original);e.reportConverted.textContent=fmt(x.converted);const saving=x.original?((x.original-x.converted)/x.original*100):0;e.reportRate.textContent=saving.toFixed(1)+"%";e.reportTime.textContent=(x.time/1000).toFixed(2)+"초";const q=Number(e.qualityRange.value),grade=qualityGrade(q,saving,x.failed);e.reportQuality.textContent=grade.label;e.reportQuality.className=`quality-grade ${grade.className}`;const stability=Math.max(0,100-x.failed*18-(x.time>30000?10:0));e.reportStability.textContent=stability>=90?"매우 안정":stability>=75?"안정":"점검 권장";e.reportSection.hidden=false}
  function renderErrors(e,items=[]){if(!e.errorList)return;e.errorList.innerHTML="";for(const item of items){const li=document.createElement("li");li.textContent=item;e.errorList.appendChild(li)}e.errorList.hidden=!items.length}function yieldToBrowser(){return new Promise(r=>setTimeout(r,0))}function persistSettings(e){settingsStore.write(readSettingsView(e))}async function compare(f,e){const originalUrl=URL.createObjectURL(f);try{const {blob,settings}=await previewEstimator.createComparison(f,e,2);const jpgUrl=URL.createObjectURL(blob);modalManager?.openCompare({title:f.name,originalUrl,convertedUrl:jpgUrl,originalMeta:`${converterDefinition.source.format} · ${fmt(f.size)}`,convertedMeta:`${converterDefinition.target.format} · ${fmt(blob.size)}${converterDefinition.features?.quality===false?"":` · 품질 ${Math.round(settings.quality*100)}%`} · 무결성 확인`})}catch(error){URL.revokeObjectURL(originalUrl);throw error}}
  async function reset(e){cancelAutoCleanup(e);conversionController.requestCancel();if(files.length||converted.length){workspaceController.capture({files,selected,converted,perFile,originalOrder});e.recoverBtn.hidden=false}updateBalanceScore(e,0,0);e.purposeButtons.forEach(b=>b.classList.remove("active"));cancelRequested=true;releasePreviewUrls();files=[];selected.clear();converted=[];previewEstimator.clear();estimateCache.clear();dimensionCache.clear();perFile.clear();converterState.reset("reset-workspace");syncStateRefs();smartRecommendation=null;await UploadManager.clear?.();await UploadManager.set([]);[e.summarySection,e.optionSection,e.previewSection,e.actionSection,e.statusSection,e.reportSection].forEach(x=>x.hidden=true);e.previewList.innerHTML="";resetProgress(e);e.errorList.hidden=true;e.errorList.innerHTML="";e.fileInput.value="";updateMemoryStatus(e);setWorkflow(e,"upload",`새 ${converterDefinition.source.format} 파일을 선택해 주세요.`);sessionManager.updateSession(e,{state:"대기"});showToast(e,"작업을 초기화했습니다. 필요하면 이전 작업 복구를 누르세요.")}
  async function recoverLastWork(e){cancelAutoCleanup(e);const snap=workspaceController.consumeRecovery();if(!snap)return;files=[...snap.files];replaceSelection(snap.selected,"recover-selection");converted=[...snap.converted];replacePerFile(snap.perFile,"recover-file-config");replaceOrder(snap.originalOrder,"recover-order");await UploadManager.set(files);show(e);await render(e);e.downloadBtn.disabled=e.zipDownloadBtn.disabled=e.csvDownloadBtn.disabled=e.verifyReportBtn.disabled=converted.length===0;e.successCount.textContent=converted.length+"개";e.convertStatus.textContent=converted.length?"복구됨":"대기중";if(converted.length){const o=sum(converted.map(x=>x.file.size)),n=sum(converted.map(x=>x.blob.size));renderSummaryResult(e,o,n);e.statusSection.hidden=false;e.statusText.textContent=`이전 작업 복구 완료 · ${converted.length}개 결과 재사용 가능`}e.recoverBtn.hidden=true;updateMemoryStatus(e);setWorkflow(e,converted.length?"download":"settings",converted.length?"복구된 변환 결과를 바로 다운로드할 수 있습니다.":"복구된 파일 설정을 확인해 주세요.");showToast(e,"이전 작업을 복구했습니다.")}
  function cancelAutoCleanup(e){workspaceController.cancelCleanup(e)}
  function scheduleAutoCleanup(e,delay=15000){return workspaceController.scheduleCleanup(e,{enabled:Boolean(e.autoCleanup?.checked),hasResults:converted.length>0,delay,onCleanup:()=>releaseResults(e),onNotify:message=>showToast(e,message)})}
  function releaseResults(e){cancelAutoCleanup(e);if(!converted.length&&!estimateCache.blobs.size){showToast(e,"정리할 변환 결과가 없습니다.");return}const released=sum(converted.map(x=>x.blob?.size||0))+estimateCache.bytes;converted=[];estimateCache.clear();e.downloadBtn.disabled=e.zipDownloadBtn.disabled=e.csvDownloadBtn.disabled=e.verifyReportBtn.disabled=true;e.successCount.textContent="0개";e.convertStatus.textContent="결과 정리됨";e.downloadNote.textContent=`메모리 ${fmt(released)} 정리`;e.reportSection.hidden=true;updateMemoryStatus(e);showToast(e,`변환 결과 메모리 ${fmt(released)}를 정리했습니다.`)}
  function updateMemoryStatus(e){if(!e?.memoryStatus)return;const memory=workspaceController.getMemorySummary(converted,estimateCache.bytes);e.memoryStatus.textContent=memory.label;e.releaseResultsBtn.disabled=memory.totalBytes===0;e.recoverBtn.hidden=!workspaceController.hasRecovery()}
  function buildOutputName(f,index,e){return buildOutputNameView(f,index,e,{sanitizeName,sanitizeAffix,outputExtension:converterDefinition.target.extension})}
  function sanitizeName(v){return String(v||'').replace(/[\/:*?"<>|\x00-\x1F]/g,'-').replace(/\s+/g,' ').replace(/[. ]+$/g,'').slice(0,80)||'converter-mall'}
  function sanitizeAffix(v){return String(v||'').replace(/[\/:*?"<>|\x00-\x1F]/g,'-').replace(/\s+/g,' ').slice(0,40)}
  function stamp(){const d=new Date(),p=n=>String(n).padStart(2,'0');return`${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`}
  async function sortFiles(e){files=await sortFileList(files,e.sortMode.value,{originalOrder,estimates,getDimensions:dimensions});await render(e)}
  async function diagnoseFiles(e,notify=false){return optimizationView.diagnose({e,files,selectedKeys:selected,keyOf:key,getDimensions:dimensions,notify})}
  async function analyzeSmart(e){smartRecommendation=await optimizationView.analyze({e,files,selectedKeys:selected,keyOf:key,getDimensions:dimensions,estimates})}
  function applySmart(e){return optimizationView.apply({e,recommendation:smartRecommendation,syncSettings:syncSettingsView,persistSettings,invalidateResults:()=>{converted=[];e.downloadBtn.disabled=e.zipDownloadBtn.disabled=e.csvDownloadBtn.disabled=e.verifyReportBtn.disabled=true},scheduleEstimate})}
  function releasePreviewUrls(){for(const u of previewUrls)URL.revokeObjectURL(u);previewUrls.clear()}
  function releaseTransientMemory(){releasePreviewUrls();estimateCache.clear();dimensionCache.clear();converted=[]}

  async function runSystemCheck(e,notify=true){return diagnosticsManager.runSystemCheck(e,notify)}
  async function downloadSystemReport(e){return diagnosticsManager.downloadSystemReport(e)}
  function setWorkflow(e,stage,message=""){
    const features=converterDefinition.features||{};
    const optionLabels=[];
    if(features.quality!==false)optionLabels.push("품질");
    if(features.background===true)optionLabels.push("배경");
    if(features.resize!==false)optionLabels.push("크기");
    renderWorkflow(e,stage,{
      message,
      selectedCount:selected.size,
      fileCount:files.length,
      sourceFormat:converterDefinition.source.format,
      targetFormat:converterDefinition.target.format,
      optionLabels,
    })
  }
  function applyPlannerHandoff(e){try{const raw=sessionStorage.getItem("converterMall.smartPlanner.handoff");if(!raw)return;const plan=JSON.parse(raw);const fresh=Date.now()-Number(plan.createdAt||0)<10*60*1000;const source=String(plan.sourceFormat||"").toUpperCase(),target=String(plan.targetFormat||"").toUpperCase();if(!fresh||source!==String(converterDefinition.source.format||"").toUpperCase()||target!==String(converterDefinition.target.format||"").toUpperCase())return;if(plan.quality!=null&&e.qualityRange)e.qualityRange.value=String(plan.quality);if(plan.resizeMode&&e.resizeMode)e.resizeMode.value=plan.resizeMode;if(plan.resizeValue&&e.resizeValue)e.resizeValue.value=String(plan.resizeValue);if(plan.backgroundMode&&e.backgroundMode)e.backgroundMode.value=plan.backgroundMode;syncSettingsView(e);settingsStore.write(readSettingsView(e));sessionStorage.removeItem("converterMall.smartPlanner.handoff");setTimeout(()=>showToast(e,`🧠 스마트 추천 설정을 자동 적용했습니다${plan.score?` · ${plan.score}점`:""}`),250)}catch{}}
  function showToast(e,message){if(!e.toast)return;clearTimeout(toastTimer);e.toast.textContent=message;e.toast.classList.add("show");toastTimer=setTimeout(()=>e.toast.classList.remove("show"),2600)}
  function findCard(e,f){return [...e.previewList.children].find(c=>c.dataset.fileKey===key(f))}async function dimensions(f){const k=key(f);if(dimensionCache.has(k))return dimensionCache.get(k);try{const src=await decodeImage(f),d={w:src.width||src.naturalWidth,h:src.height||src.naturalHeight};src.close?.();dimensionCache.set(k,d);return d}catch{return{w:"-",h:"-"}}}function settingsSignature(s){return`${Math.round(s.quality*1000)}|${s.background}|${s.resizeMode}|${s.resizeValue}|${s.contentMode}|${s.colorMode}|${s.sharpen}|${s.alphaMode}|${s.trimTransparent?1:0}|${s.trimThreshold||0}|${s.gifFrameMode||"first"}|${s.gifFrameIndex||1}|${s.sourceScale||1}|${s.bmpAlphaMode||"auto"}`}function resultCacheKey(f,s){return`${key(f)}::${settingsSignature(s)}`}function clearFileCaches(f){estimateCache.deletePrefix(key(f)+"::");previewEstimator.deleteFile(f);dimensionCache.delete(key(f))}
  return Object.freeze({ start });
}
