function csvCell(value){
  const text=String(value??"");
  return /[",\r\n]/.test(text)?`"${text.replace(/"/g,'""')}"`:text;
}

async function sha256Hex(blob){
  if(!globalThis.crypto?.subtle)return null;
  const hash=await crypto.subtle.digest("SHA-256",await blob.arrayBuffer());
  return Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,"0")).join("");
}

export function createDownloadManager({saveBlob,makeZipFromBlobs,verifyZipBlob,verifyOutput,fmt,sum,target={}}){
  let zipAbortController=null;
  const targetFormat=String(target.format||"OUTPUT").toUpperCase();
  const targetExtension=String(target.extension||"").replace(/^\./,"").toLowerCase();
  const targetMime=String(target.mimeType||"").toLowerCase();
  const extensionPattern=targetExtension?new RegExp(`\\.${targetExtension.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}$`,"i"):null;

  async function auditConvertedResults(items=[]){
    const issues=[];
    for(const item of items){
      try{
        await verifyOutput(item.blob);
        if(!item.name||(extensionPattern&&!extensionPattern.test(item.name)))issues.push(`${item.file?.name||"알 수 없는 파일"}: 출력 파일명 확장자 오류`);
        if(targetMime&&item.blob.type&&item.blob.type.toLowerCase()!==targetMime)issues.push(`${item.name}: MIME 형식 ${item.blob.type} 확인 필요`);
      }catch(error){
        issues.push(`${item.name||item.file?.name||"결과"}: ${error.message||error}`);
      }
    }
    return issues;
  }

  async function downloadVerificationReport({e,converted,renderErrors,showToast,stamp,version="stage42"}){
    if(!converted.length)return;
    e.verifyReportBtn.disabled=true;
    e.downloadNote.textContent="결과 무결성 및 SHA-256 계산 중...";
    try{
      const issues=await auditConvertedResults(converted),files=[];
      for(let i=0;i<converted.length;i++){
        const item=converted[i];
        e.downloadNote.textContent=`검증 리포트 준비 ${i+1}/${converted.length}`;
        files.push({sourceName:item.file.name,outputName:item.name,sourceBytes:item.file.size,outputBytes:item.blob.size,mime:item.blob.type||"image/jpeg",integrity:"passed",sha256:await sha256Hex(item.blob)});
      }
      const report={tool:`Converter Mall ${targetFormat} Converter`,version,createdAt:new Date().toISOString(),resultCount:converted.length,issues,files};
      saveBlob(new Blob([JSON.stringify(report,null,2)],{type:"application/json;charset=utf-8"}),`${targetExtension||"output"}-verification-${stamp()}.json`);
      e.downloadNote.textContent=issues.length?`검증 완료 · 주의 ${issues.length}건`:`검증 완료 · ${converted.length}개 정상`;
      renderErrors(e,issues);
      showToast(e,issues.length?"검증 리포트를 저장했습니다. 주의 항목을 확인해 주세요.":`모든 ${targetFormat} 무결성 검증을 통과했습니다.`);
    }catch(error){
      renderErrors(e,[`검증 리포트 생성 실패: ${error.message||error}`]);
      e.downloadNote.textContent="검증 리포트 생성 실패";
    }finally{
      e.verifyReportBtn.disabled=false;
    }
  }

  async function downloadEach({e,converted,renderErrors,showToast,recordDownloadReceipt,updateSessionSummary,scheduleAutoCleanup}){
    const issues=await auditConvertedResults(converted);
    if(issues.length){renderErrors(e,issues);showToast(e,"다운로드 전 검증에서 문제가 발견되었습니다.");return;}
    converted.forEach((item,i)=>setTimeout(()=>saveBlob(item.blob,item.name),i*160));
    e.downloadNote.textContent=`${converted.length}개 다운로드 요청 완료`;
    showToast(e,`개별 ${targetFormat} 다운로드를 시작했습니다.`);
    recordDownloadReceipt(e,`개별 ${targetFormat}`,converted.length,sum(converted.map(x=>x.blob.size)));
    updateSessionSummary(e,{downloaded:converted.length,state:"개별 다운로드 완료"});
    scheduleAutoCleanup(e,Math.max(15000,converted.length*180+5000));
  }

  function cancelZipDownload(){
    if(!zipAbortController)return false;
    zipAbortController.abort(new DOMException("사용자가 ZIP 생성을 취소했습니다.","AbortError"));
    return true;
  }

  async function downloadZip({e,converted,renderErrors,showToast,recordDownloadReceipt,updateSessionSummary,scheduleAutoCleanup,yieldToBrowser,sanitizeName,stamp}){
    if(!converted.length||zipAbortController)return;
    const issues=await auditConvertedResults(converted);
    if(issues.length){renderErrors(e,issues);showToast(e,"ZIP 생성 전 결과 검증에 실패했습니다.");return;}
    const total=sum(converted.map(x=>x.blob.size)),memoryGB=Number(navigator.deviceMemory||4),safeLimit=Math.min(1500*1024*1024,Math.max(180*1024*1024,memoryGB*220*1024*1024));
    if(total>0xffffffff){renderErrors(e,["ZIP64가 필요한 4GB 초과 묶음은 브라우저에서 지원하지 않습니다. 파일을 나누어 다운로드해 주세요."]);return;}
    if(total>safeLimit&&!confirm(`예상 ZIP 데이터가 ${fmt(total)}입니다. 이 기기에서는 메모리 사용량이 클 수 있습니다. 계속할까요?`))return;
    zipAbortController=new AbortController();
    e.zipDownloadBtn.disabled=true;
    if(e.zipCancelBtn)e.zipCancelBtn.hidden=false;
    e.downloadNote.textContent="ZIP 구조 준비 중...";await yieldToBrowser();
    try{
      const blob=await makeZipFromBlobs(converted,(done,all)=>{e.downloadNote.textContent=`ZIP 준비 ${done}/${all} · ${Math.round(done/all*100)}%`;},{signal:zipAbortController.signal});
      await verifyZipBlob(blob,converted.length);
      saveBlob(blob,`${sanitizeName(e.zipName?.value||"converter-mall")}-${stamp()}.zip`);
      e.downloadNote.textContent=`ZIP 검증 완료 · ${fmt(blob.size)}`;
      showToast(e,"검증된 전체 ZIP 다운로드를 시작했습니다.");
      recordDownloadReceipt(e,"ZIP",converted.length,blob.size);
      updateSessionSummary(e,{downloaded:converted.length,state:"ZIP 다운로드 완료"});
      scheduleAutoCleanup(e,15000);
    }catch(error){
      if(error?.name==="AbortError"){
        e.downloadNote.textContent="ZIP 생성 취소됨";
        showToast(e,"ZIP 생성을 취소했습니다. 변환 결과는 그대로 유지됩니다.");
      }else{
        e.downloadNote.textContent="ZIP 생성 실패";
        renderErrors(e,[`ZIP 생성 실패: ${error.message||error}`]);
      }
    }finally{
      zipAbortController=null;
      e.zipDownloadBtn.disabled=false;
      if(e.zipCancelBtn)e.zipCancelBtn.hidden=true;
    }
  }

  function downloadCsv({e,converted,settingsFor,showToast,stamp}){
    if(!converted.length)return;
    const rows=[["원본 파일명","출력 파일명","원본 바이트","결과 바이트","절감 바이트","절감률(%)","품질(%)","배경색","리사이즈 방식","리사이즈 값"]];
    for(const item of converted){
      const settings=settingsFor(item.file,e),saved=item.file.size-item.blob.size,rate=item.file.size?saved/item.file.size*100:0;
      rows.push([item.file.name,item.name,item.file.size,item.blob.size,saved,rate.toFixed(2),Math.round(settings.quality*100),settings.background,settings.resizeMode,settings.resizeValue]);
    }
    const csv="\uFEFF"+rows.map(row=>row.map(csvCell).join(",")).join("\r\n");
    saveBlob(new Blob([csv],{type:"text/csv;charset=utf-8"}),`${targetExtension||"output"}-report-${stamp()}.csv`);
    e.downloadNote.textContent="CSV 리포트 다운로드 완료";
    showToast(e,"변환 결과 CSV 리포트를 저장했습니다.");
  }

  return{auditConvertedResults,downloadVerificationReport,downloadEach,downloadZip,downloadCsv,cancelZipDownload,isZipRunning:()=>Boolean(zipAbortController)};
}
