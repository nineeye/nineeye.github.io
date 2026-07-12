const PDFToolApp = (() => {
  const fmt = n => n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1048576).toFixed(2)} MB`;
  const base = n => n.replace(/\.[^.]+$/, '');
  const html = s => String(s).replace(/[&<>\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const save = (blob, name) => { const a = document.createElement('a'); const u = URL.createObjectURL(blob); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 1500); };

  function page(def) {
    const featureItems = (def.specialization?.features || []).map(x => `<li>${html(x)}</li>`).join('');
    const cautionItems = (def.specialization?.cautions || []).map(x => `<li>${html(x)}</li>`).join('');
    return `
    <header class="site-header"><a href="../../index.html" class="brand">Converter Mall</a><a href="../../all-tools/" class="home-btn">전체 도구</a></header>
    <main class="special-shell">
      <section class="hero-card"><span class="eyebrow">PDF WORKSPACE · ${def.accessLevel === 'pro' ? 'PRO' : 'FREE'}</span><h1>${html(def.title)}</h1><p>${html(def.description)}</p><div class="trust-row"><span>🔒 브라우저 내부 처리</span><span>✓ 원본 파일 미업로드</span><span>${def.accessLevel === 'pro' ? '◆ 전문가 기능' : '● 무료 도구'}</span></div></section>
      ${def.specialization ? `<section class="workspace-card format-guide"><div><span class="section-kicker">FORMAT-AWARE</span><h2>${html(def.specialization.heading)}</h2><p>${html(def.specialization.summary)}</p></div><div class="guide-grid"><div><h3>이 도구의 핵심</h3><ul>${featureItems}</ul></div><div><h3>주의할 점</h3><ul>${cautionItems}</ul></div></div></section>` : ''}
      <section class="stepper"><div class="step active" data-step="upload"><b>1</b><span>파일 선택</span></div><div class="step" data-step="settings"><b>2</b><span>전용 설정</span></div><div class="step" data-step="convert"><b>3</b><span>처리·검증</span></div><div class="step" data-step="download"><b>4</b><span>다운로드</span></div></section>
      <section class="workspace-card">
        <input id="pdfInput" type="file" accept="application/pdf,.pdf" ${def.multiple ? 'multiple' : ''} hidden>
        <div id="drop" class="drop-zone" tabindex="0" role="button" aria-label="PDF 파일 선택"><div class="drop-icon">PDF</div><h2>PDF 파일을 여기에 놓으세요</h2><p>${def.multiple ? '여러 PDF를 선택하고 순서를 바꿀 수 있습니다.' : 'PDF 한 개를 선택하세요.'}</p><button id="pick" class="primary-btn" type="button">파일 선택</button></div>
        <div id="message" class="note">처리는 사용자의 브라우저에서 진행됩니다.</div>
      </section>
      <section id="filesPanel" class="workspace-card hidden"><div class="section-head"><div><span class="section-kicker">INPUT</span><h2>${def.mode === 'merge' ? '합칠 순서와 페이지 범위' : '선택한 파일'}</h2></div><button id="clear" class="ghost-btn" type="button">초기화</button></div><div id="files" class="file-list"></div><div id="fileSummary" class="summary-strip"></div></section>
      <section id="pagePanel" class="workspace-card hidden"><div class="section-head"><div><span class="section-kicker">PAGES</span><h2>페이지 선택 작업대</h2></div><strong id="pageSelectionSummary">0페이지 선택</strong></div><div class="page-toolbar"><button data-page-preset="all" class="ghost-btn" type="button">전체</button><button data-page-preset="odd" class="ghost-btn" type="button">홀수</button><button data-page-preset="even" class="ghost-btn" type="button">짝수</button><button data-page-preset="clear" class="ghost-btn" type="button">선택 해제</button></div><div id="pageSelector" class="page-selector"></div><p class="action-copy">페이지 번호를 클릭해 개별 선택할 수 있습니다. 선택 결과는 아래 설정에 자동 반영됩니다.</p></section>
      <section id="optionsPanel" class="workspace-card hidden"><div class="section-head"><div><span class="section-kicker">SETTINGS</span><h2>${html(def.optionsTitle || '작업 설정')}</h2></div></div><div id="options" class="options-grid"></div><div id="optionHint" class="note compact"></div></section>
      <section id="actionPanel" class="workspace-card hidden"><button id="convert" class="convert-btn" type="button">${html(def.actionLabel || 'PDF 처리 시작')}</button><p class="action-copy">암호화되었거나 손상된 PDF는 처리되지 않을 수 있습니다.</p></section>
      <section id="resultPanel" class="workspace-card hidden"><div class="section-head"><div><span class="section-kicker">RESULT</span><h2>작업 결과</h2></div><strong id="status">대기</strong></div><div id="resultActions" class="result-actions hidden"><button id="downloadAll" class="primary-btn" type="button">결과 전체 ZIP 다운로드</button></div><div id="results" class="result-list"></div></section>
    </main>`;
  }

  async function mount(def) {
    document.title = `${def.title} | Converter Mall`;
    document.body.innerHTML = page(def);
    const $ = id => document.getElementById(id);
    let files = [];
    let results = [];
    let dragIndex = -1;
    let selectedPages = new Set();
    const setStep = s => document.querySelectorAll('.step').forEach(x => x.classList.toggle('active', x.dataset.step === s));
    const msg = (t, e = false) => { $('message').textContent = t; $('message').className = e ? 'note error' : 'note'; };

    const renderOptions = () => {
      const box = $('options'); box.innerHTML = '';
      for (const o of def.options || []) {
        const f = document.createElement('div'); f.className = 'field'; f.dataset.optionId = o.id;
        if (o.showWhen) f.dataset.showWhen = JSON.stringify(o.showWhen);
        const help = o.help ? `<small>${html(o.help)}</small>` : '';
        if (o.type === 'select') {
          f.innerHTML = `<label for="${o.id}">${html(o.label)}</label><select id="${o.id}">${o.values.map(v => `<option value="${html(v.value)}" ${String(v.value) === String(o.value ?? '') ? 'selected' : ''}>${html(v.label)}</option>`).join('')}</select>${help}`;
        } else if (o.type === 'checkbox') {
          f.classList.add('field-check');
          f.innerHTML = `<label><input id="${o.id}" type="checkbox" ${o.value ? 'checked' : ''}> <span>${html(o.label)}</span></label>${help}`;
        } else {
          f.innerHTML = `<label for="${o.id}">${html(o.label)}</label><input id="${o.id}" type="${o.type || 'text'}" value="${html(o.value ?? '')}" ${o.placeholder ? `placeholder="${html(o.placeholder)}"` : ''} ${o.min != null ? `min="${o.min}"` : ''} ${o.max != null ? `max="${o.max}"` : ''} ${o.step != null ? `step="${o.step}"` : ''}>${help}`;
        }
        box.append(f);
      }
      if (!(def.options || []).length) box.innerHTML = '<div class="no-options">별도 설정 없이 안전한 기본값으로 처리합니다.</div>';
      box.querySelectorAll('input,select').forEach(el => el.addEventListener('change', updateConditionalOptions));
      updateConditionalOptions();
    };

    const settings = () => Object.fromEntries((def.options || []).map(o => [o.id, o.type === 'checkbox' ? Boolean($(o.id)?.checked) : $(o.id)?.value]));
    function updateConditionalOptions() {
      const current = settings();
      document.querySelectorAll('[data-show-when]').forEach(node => {
        const rule = JSON.parse(node.dataset.showWhen);
        node.classList.toggle('hidden', String(current[rule.id]) !== String(rule.equals));
      });
      const mode = current.splitMode;
      if ($('optionHint')) $('optionHint').textContent = optionHint(def.mode, mode, current);
    }

    const move = (from, to) => {
      if (to < 0 || to >= files.length || from === to) return;
      const [item] = files.splice(from, 1); files.splice(to, 0, item); render();
    };

    const render = () => {
      const has = files.length > 0;
      ['filesPanel', 'optionsPanel', 'actionPanel'].forEach(id => $(id).classList.toggle('hidden', !has));
      const pageAware = ['rotate','delete','extract','reorder','duplicate','watermark','page-numbers','resize-pages','margins','remove-blank','extract-images','header-footer','crop-pages','insert-blank','grayscale','remove-links','remove-annotations'].includes(def.mode);
      $('pagePanel').classList.toggle('hidden', !(has && pageAware));
      $('files').innerHTML = '';
      files.forEach((entry, i) => {
        const row = document.createElement('article'); row.className = 'pdf-file-row'; row.draggable = def.multiple;
        row.innerHTML = `<div class="order-badge">${i + 1}</div><div class="file-main"><strong>${html(entry.file.name)}</strong><span>${fmt(entry.file.size)} · ${entry.pageCount || '?'}페이지</span>${def.mode === 'merge' ? `<label class="range-label">포함할 페이지 <input data-range type="text" value="${html(entry.range || '')}" placeholder="전체 또는 1-3,5"></label>` : ''}</div><div class="file-actions">${def.multiple ? `<button data-act="up" class="icon-btn" type="button" aria-label="위로">↑</button><button data-act="down" class="icon-btn" type="button" aria-label="아래로">↓</button>` : ''}<button data-act="delete" class="ghost-btn" type="button">삭제</button></div>`;
        row.querySelector('[data-range]')?.addEventListener('input', e => { entry.range = e.target.value; updateSummary(); });
        row.querySelector('[data-act="up"]')?.addEventListener('click', () => move(i, i - 1));
        row.querySelector('[data-act="down"]')?.addEventListener('click', () => move(i, i + 1));
        row.querySelector('[data-act="delete"]').addEventListener('click', () => { files.splice(i, 1); render(); });
        if (def.multiple) {
          row.addEventListener('dragstart', () => { dragIndex = i; row.classList.add('dragging'); });
          row.addEventListener('dragend', () => row.classList.remove('dragging'));
          row.addEventListener('dragover', e => e.preventDefault());
          row.addEventListener('drop', e => { e.preventDefault(); move(dragIndex, i); dragIndex = -1; });
        }
        $('files').append(row);
      });
      updateSummary();
      if (has && ['rotate','delete','extract','reorder','duplicate','watermark','page-numbers','resize-pages','margins','remove-blank','extract-images','header-footer','crop-pages','insert-blank','grayscale','remove-links','remove-annotations'].includes(def.mode)) renderPageSelector();
      setStep(has ? 'settings' : 'upload');
    };


    function pagesToText(set) {
      return [...set].sort((a,b)=>a-b).map(i=>i+1).join(',');
    }
    function syncSelectedPages() {
      const text = pagesToText(selectedPages);
      ['pages','targetPages','duplicatePages'].forEach(id => { const el=$(id); if (el) el.value=text; });
      if ($('pageSelectionSummary')) $('pageSelectionSummary').textContent = `${selectedPages.size}페이지 선택`;
    }
    function renderPageSelector() {
      const total = files[0]?.pageCount || 0;
      const box = $('pageSelector'); if (!box) return; box.innerHTML='';
      selectedPages = new Set([...selectedPages].filter(i=>i<total));
      for (let i=0;i<total;i++) {
        const b=document.createElement('button'); b.type='button'; b.className='page-chip'; b.textContent=String(i+1);
        b.classList.toggle('selected', selectedPages.has(i));
        b.setAttribute('aria-pressed', selectedPages.has(i) ? 'true' : 'false');
        b.onclick=()=>{ selectedPages.has(i)?selectedPages.delete(i):selectedPages.add(i); renderPageSelector(); syncSelectedPages(); };
        box.append(b);
      }
      syncSelectedPages();
    }
    document.querySelectorAll('[data-page-preset]').forEach(btn => btn.addEventListener('click', () => {
      const total=files[0]?.pageCount||0; const type=btn.dataset.pagePreset; selectedPages.clear();
      if(type==='all') for(let i=0;i<total;i++) selectedPages.add(i);
      if(type==='odd') for(let i=0;i<total;i+=2) selectedPages.add(i);
      if(type==='even') for(let i=1;i<total;i+=2) selectedPages.add(i);
      renderPageSelector(); syncSelectedPages();
    }));

    function updateSummary() {
      const pages = files.reduce((sum, x) => sum + selectedCount(x.range, x.pageCount), 0);
      $('fileSummary').textContent = files.length ? `${files.length}개 파일 · 현재 설정 기준 총 ${pages}페이지` : '';
    }

    async function add(fs) {
      const pdf = fs.filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
      if (!pdf.length) return msg('PDF 파일만 선택할 수 있습니다.', true);
      const incoming = def.multiple ? pdf : [pdf[0]];
      const meta = [];
      for (const file of incoming) {
        try {
          const doc = await requirePdfLib().PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: false });
          meta.push({ file, pageCount: doc.getPageCount(), range: '' });
        } catch (error) {
          throw new Error(`${file.name}: 암호화되었거나 읽을 수 없는 PDF입니다.`);
        }
      }
      files = def.multiple ? [...files, ...meta] : meta;
      selectedPages = new Set();
      render(); msg(`${meta.length}개 PDF를 불러왔습니다.`);
    }

    $('pick').onclick = e => { e.stopPropagation(); $('pdfInput').click(); };
    $('drop').onclick = e => { if (!e.target.closest('button')) $('pdfInput').click(); };
    $('drop').onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $('pdfInput').click(); } };
    $('pdfInput').onchange = async () => { try { await add([...$('pdfInput').files]); } catch (e) { msg(e.message, true); } $('pdfInput').value = ''; };
    $('drop').ondragover = e => { e.preventDefault(); $('drop').classList.add('drag'); };
    $('drop').ondragleave = () => $('drop').classList.remove('drag');
    $('drop').ondrop = async e => { e.preventDefault(); $('drop').classList.remove('drag'); try { await add([...e.dataTransfer.files]); } catch (err) { msg(err.message, true); } };
    $('clear').onclick = () => { files = []; results = []; render(); $('resultPanel').classList.add('hidden'); msg('초기화했습니다.'); };
    $('downloadAll').onclick = async () => {
      if (results.length < 2) return;
      const { makeZipFromBlobs } = await import('../../assets/js/image-platform/core/ZipBuilder.js');
      const blob = await makeZipFromBlobs(results.map(r => ({ name: r.name, blob: r.blob })));
      save(blob, `${def.id}-results.zip`);
    };

    renderOptions(); render();
    $('convert').onclick = async () => {
      if (!files.length) return;
      $('convert').disabled = true; $('resultPanel').classList.remove('hidden'); $('status').textContent = '처리중'; $('results').innerHTML = ''; $('resultActions').classList.add('hidden'); setStep('convert');
      try {
        results = await process(def, files, settings());
        renderResults(results, $('results'));
        $('status').textContent = '완료'; setStep('download'); msg(`${results.length}개 결과가 생성되었습니다.`);
        $('resultActions').classList.toggle('hidden', results.length < 2);
      } catch (e) {
        console.error(e); $('status').textContent = '오류'; msg(e.message || String(e), true); setStep('settings');
      } finally { $('convert').disabled = false; }
    };

    function renderResults(items, box) {
      box.innerHTML = '';
      items.forEach(r => {
        const row = document.createElement('article'); row.className = 'result-item';
        row.innerHTML = `<div><strong>${html(r.name)}</strong><span>${fmt(r.blob.size)}${r.detail ? ` · ${html(r.detail)}` : ''}</span></div><button class="primary-btn" type="button">다운로드</button>`;
        row.querySelector('button').onclick = () => save(r.blob, r.name); box.append(row);
      });
    }
  }

  function optionHint(mode, splitMode, opt) {
    if (mode === 'merge') return '목록의 순서가 결과 PDF의 순서가 됩니다. 각 파일에서 필요한 페이지만 골라 합칠 수 있습니다.';
    if (mode === 'split') {
      if (splitMode === 'each') return 'PDF의 모든 페이지를 각각 하나의 PDF 파일로 분리합니다.';
      if (splitMode === 'ranges') return '예: 1-3,4-6,7 입력 시 세 개의 PDF로 분리합니다.';
      if (splitMode === 'oddEven') return '홀수 페이지와 짝수 페이지를 각각 별도 PDF로 만듭니다.';
      return `선택한 페이지 수 단위로 연속 분할합니다.`;
    }
    if (mode === 'jpg' || mode === 'png') return '출력 크기, 여백 제거, 회전, 선명도와 결과 구성 방식을 실제 이미지에 적용합니다.';
    if (mode === 'watermark') return '선택한 페이지에 워터마크 문구·위치·투명도·회전을 적용합니다.';
    if (mode === 'page-numbers') return '선택한 페이지에 시작 번호와 위치를 적용해 페이지 번호를 넣습니다.';
    if (mode.startsWith('metadata-')) return '문서 속성은 PDF 뷰어와 검색 시스템에서 표시될 수 있습니다. 중요한 파일은 원본을 보관하세요.';
    if (mode === 'compress') return '무손실 구조 최적화 또는 페이지 이미지 재구성 방식 중 목적에 맞는 압축 방식을 선택하세요.';
    if (mode === 'resize-pages') return '대상 용지와 배치 방식을 선택하면 원본 페이지 내용을 새 페이지 크기에 맞춰 재배치합니다.';
    if (mode === 'margins') return '균등·개별·제본용 거울 여백을 선택할 수 있습니다. 음수 값은 실제 내용을 잘라낼 수 있으므로 미리보기용 복사본으로 확인하세요.';
    if (mode === 'remove-blank') return '저해상도 분석으로 빈 페이지를 찾습니다. 희미한 스캔은 민감도를 낮춰 확인하세요.';
    if (mode === 'extract-images') return '내부 래스터 이미지를 추출하고 중복 제거·알파 감지·페이지 위치 보고서를 함께 만들 수 있습니다. 벡터 그림은 포함되지 않습니다.';
    if (mode === 'header-footer') return '머리글·바닥글에 페이지 번호, 전체 페이지 수, 날짜 같은 변수를 조합할 수 있습니다.';
    if (mode === 'crop-pages') return '위·아래·왼쪽·오른쪽 재단값은 실제 페이지 영역을 줄입니다. 내용이 잘리지 않도록 작은 값부터 확인하세요.';
    if (mode === 'flatten-forms') return '입력 가능한 양식 필드를 현재 표시 상태로 고정합니다. 처리 후에는 해당 필드를 다시 편집하기 어렵습니다.';
    if (mode === 'insert-blank') return '표지, 메모, 양면 인쇄를 위해 지정 위치에 빈 페이지를 삽입합니다.';
    if (mode === 'grayscale') return '선택한 페이지를 이미지로 다시 구성해 흑백 PDF로 만듭니다. 검색 가능한 텍스트는 이미지가 될 수 있습니다.';
    if (mode === 'security-audit') return '활성 콘텐츠·첨부파일·양식·주석·링크 존재 여부를 검사해 보고서로 저장합니다. 검사 결과는 위험 확정이 아니라 검토 기준입니다.';
    if (mode === 'sanitize') return '모든 페이지를 새 이미지 기반 PDF로 재구성해 링크·주석·양식·첨부파일·스크립트 같은 상호작용 요소를 제거합니다.';
    if (mode === 'remove-links') return '선택한 페이지의 클릭 가능한 링크 주석만 제거하고 나머지 페이지 내용은 유지합니다.';
    if (mode === 'remove-annotations') return '선택한 페이지의 메모·강조·도형 등 주석을 제거합니다. 링크와 양식 필드는 옵션에 따라 유지할 수 있습니다.';
    if (mode === 'remove-form-fields') return '입력 가능한 AcroForm 필드를 문서에서 제거합니다. 입력값을 보존하려면 먼저 양식 평탄화를 사용하세요.';
    if (mode === 'page-size-report') return '페이지별 용지 크기, 방향, 회전값과 규격 추정 결과를 TXT 또는 JSON 보고서로 만듭니다.';
    if (mode === 'font-report') return 'PDF 페이지 리소스에서 글꼴 이름, 종류, 인코딩과 포함 가능성을 점검합니다.';
    if (mode === 'annotation-report') return '페이지별 링크·메모·강조·양식 위젯 등 주석 유형을 집계해 보고서로 정리합니다.';
    if (mode === 'form-report') return 'AcroForm 필드의 이름, 종류, 값과 읽기 전용 여부를 확인합니다.';
    if (mode === 'accessibility-audit') return '문서 언어, 제목, 태그 구조, MarkInfo와 북마크 존재 여부를 기초 점검합니다.';
    if (mode === 'bookmark-report') return 'PDF 북마크 계층과 제목을 분석합니다. 비표준 목적지와 손상된 연결은 제한적으로 표시될 수 있습니다.';
    if (mode === 'attachment-report') return '문서에 내장된 첨부파일 이름 트리와 파일 명세를 점검합니다. 실제 악성 여부를 판정하지는 않습니다.';
    if (mode === 'page-resource-report') return '페이지별 글꼴·이미지·폼 XObject·주석·콘텐츠 스트림 수를 집계합니다.';
    if (mode === 'image-resource-report') return 'PDF 페이지 리소스에 등록된 래스터 이미지의 크기·색상 공간·필터·사용 페이지를 분석합니다.';
    if (mode === 'document-structure-report') return '카탈로그·페이지 트리·태그·양식·북마크·첨부파일 등 문서 수준 구조를 요약합니다.';
    if (mode === 'document-statistics-report') return '페이지, 용지, 텍스트, 이미지, 글꼴, 주석, 북마크와 첨부파일을 한 번에 요약합니다.';
    if (mode === 'text-density-report') return '페이지별 추출 가능한 글자 수와 면적 대비 텍스트 밀도를 분석합니다. 스캔 문서는 낮게 표시될 수 있습니다.';
    if (mode === 'scan-page-report') return '텍스트 항목과 이미지 리소스를 함께 확인해 스캔형·텍스트형·혼합형 페이지를 추정합니다.';
    if (mode === 'link-domain-report') return '링크 주석에서 외부 URL과 도메인을 추출해 페이지별·도메인별로 정리합니다.';
    if (mode === 'page-complexity-report') return '텍스트 항목, 이미지, 글꼴, 주석과 콘텐츠 스트림을 조합해 페이지 복잡도를 상대 점수로 계산합니다.';
    if (mode === 'keyword-frequency-report') return '문서에서 반복되는 핵심어를 추출해 페이지별 출현 위치와 빈도를 정리합니다.';
    if (mode === 'sensitive-pattern-report') return '이메일·전화번호·식별번호·카드번호·URL처럼 민감할 수 있는 문자열 패턴을 마스킹해 점검합니다.';
    if (mode === 'language-script-report') return '한글·라틴 문자·한자·가나·숫자 비율을 페이지별로 분석해 문서의 문자 구성을 파악합니다.';
    if (mode === 'duplicate-page-report') return '페이지 텍스트와 구조 지문을 비교해 완전히 같거나 매우 유사한 페이지 후보를 찾습니다.';
    if (mode === 'heading-outline-report') return '글자 크기와 배치 정보를 이용해 제목·소제목 후보를 추출하고 문서 개요 초안을 만듭니다.';
    if (mode === 'page-compare-report') return '같은 PDF 안의 두 페이지를 텍스트·크기·리소스 기준으로 비교합니다.';
    if (mode === 'document-diff-report') return 'PDF 두 파일의 페이지 수·텍스트·구조 차이를 비교해 변경 요약을 만듭니다.';
    if (mode === 'ocr-readiness-report') return '스캔형 페이지, 이미지 크기와 예상 해상도를 분석해 OCR 준비 상태를 점검합니다.';
    if (mode === 'text-quality-report') return '깨진 문자·과도한 공백·짧은 조각·줄 분절을 분석해 텍스트 추출 품질을 점검합니다.';
    if (mode === 'print-preflight-report') return '페이지 크기·글꼴 포함·이미지 해상도·색상 공간을 점검해 인쇄 전 위험 요소를 정리합니다.';
    if (mode === 'repeated-header-footer-report') return '페이지 위·아래에서 반복되는 문구를 찾아 머리글·바닥글 후보를 정리합니다.';
    if (mode === 'table-candidate-report') return '텍스트의 행·열 정렬과 간격을 분석해 표 구조일 가능성이 높은 영역을 찾습니다.';
    if (mode === 'numeric-pattern-report') return '금액·백분율·일반 숫자·단위 표현을 페이지별로 집계합니다.';
    if (mode === 'date-period-report') return '날짜·연월·기간 표현을 찾아 문서의 일정과 유효기간 후보를 정리합니다.';
    if (mode === 'acronym-term-report') return '대문자 약어와 괄호 정의 패턴을 찾아 용어집 후보를 만듭니다.';
    return '설정을 확인한 뒤 작업을 시작하세요.';
  }

  async function process(def, entries, opt) {
    if (['merge','split','rotate','delete','extract','reorder','duplicate','watermark','page-numbers','metadata-view','metadata-edit','metadata-remove','compress','resize-pages','margins','header-footer','crop-pages','flatten-forms','insert-blank','security-audit','remove-links','remove-annotations','remove-form-fields','page-size-report','font-report','annotation-report','form-report','accessibility-audit','bookmark-report','attachment-report','page-resource-report','image-resource-report','document-structure-report'].includes(def.mode)) return editPdf(def.mode, entries, opt);
    if (def.mode === 'document-diff-report') return analyzePdfPair(entries, opt);
    if (['document-statistics-report','text-density-report','scan-page-report','link-domain-report','page-complexity-report','keyword-frequency-report','sensitive-pattern-report','language-script-report','duplicate-page-report','heading-outline-report','page-compare-report','ocr-readiness-report','text-quality-report','print-preflight-report','repeated-header-footer-report','table-candidate-report','numeric-pattern-report','date-period-report','acronym-term-report'].includes(def.mode)) return analyzePdfContent(def.mode, entries[0].file, opt);
    if (['png','jpg','txt','remove-blank','extract-images','grayscale','sanitize'].includes(def.mode)) return renderPdf(def.mode, entries[0].file, opt);
    throw new Error('지원하지 않는 PDF 작업입니다.');
  }

  function requirePdfLib() { if (!window.PDFLib) throw new Error('PDF 처리 엔진을 불러오지 못했습니다. 인터넷 연결 후 새로고침하세요.'); return window.PDFLib; }
  function requirePdfJs() { if (!window.pdfjsLib) throw new Error('PDF 렌더링 엔진을 불러오지 못했습니다. 인터넷 연결 후 새로고침하세요.'); window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'; return window.pdfjsLib; }

  function parsePages(input, total, fallbackAll = false) {
    if (!String(input || '').trim()) return fallbackAll ? Array.from({ length: total }, (_, i) => i) : [];
    const result = [];
    const seen = new Set();
    String(input).split(',').forEach(part => {
      part = part.trim(); if (!part) return;
      if (part.includes('-')) {
        let [a, b] = part.split('-').map(Number); if (!a || !b) return; if (a > b) [a, b] = [b, a];
        for (let i = a; i <= b; i++) if (i >= 1 && i <= total && !seen.has(i - 1)) { seen.add(i - 1); result.push(i - 1); }
      } else { const n = Number(part); if (n >= 1 && n <= total && !seen.has(n - 1)) { seen.add(n - 1); result.push(n - 1); } }
    });
    return result;
  }
  function selectedCount(range, total) { return String(range || '').trim() ? parsePages(range, total).length : (total || 0); }
  function parseRangeGroups(input, total) {
    const groups = String(input || '').split(',').map(x => x.trim()).filter(Boolean).map(x => parsePages(x, total));
    if (!groups.length || groups.some(x => !x.length)) throw new Error('분할 범위를 올바르게 입력하세요. 예: 1-3,4-6,7');
    return groups;
  }

  async function editPdf(mode, entries, opt) {
    const { PDFDocument, degrees } = requirePdfLib();
    if (mode === 'merge') {
      const out = await PDFDocument.create(); let totalAdded = 0; let firstDoc = null;
      for (let entryIndex = 0; entryIndex < entries.length; entryIndex++) {
        const entry = entries[entryIndex];
        const src = await PDFDocument.load(await entry.file.arrayBuffer());
        if (!firstDoc) firstDoc = src;
        const idx = parsePages(entry.range, src.getPageCount(), true);
        if (!idx.length) throw new Error(`${entry.file.name}: 선택된 페이지가 없습니다.`);
        if (entryIndex > 0) {
          if (opt.duplexStartRight && out.getPageCount() % 2 === 1) { out.addPage(); totalAdded++; }
          else if (opt.insertBlankBetween) { out.addPage(); totalAdded++; }
        }
        if (opt.insertDividerPages) {
          const sample=src.getPage(idx[0]), divider=out.addPage([sample.getWidth(),sample.getHeight()]);
          const label=String(opt.dividerTemplate||'{filename}').replace(/\{filename\}/g,base(entry.file.name)).replace(/\{index\}/g,String(entryIndex+1));
          const png=await makeLabelPng(label,opt.dividerColor||'#26364d',Math.max(18,Math.min(72,Number(opt.dividerFontSize||34))));
          const image=await out.embedPng(png), maxW=divider.getWidth()*.78, scale=Math.min(1,maxW/image.width), w=image.width*scale,h=image.height*scale;
          divider.drawImage(image,{x:(divider.getWidth()-w)/2,y:(divider.getHeight()-h)/2,width:w,height:h}); totalAdded++;
        }
        (await out.copyPages(src, idx)).forEach(page => out.addPage(page)); totalAdded += idx.length;
      }
      if (opt.metadataMode === 'first' && firstDoc) {
        if (firstDoc.getTitle()) out.setTitle(firstDoc.getTitle());
        if (firstDoc.getAuthor()) out.setAuthor(firstDoc.getAuthor());
        if (firstDoc.getSubject()) out.setSubject(firstDoc.getSubject());
      } else if (opt.metadataMode === 'clean') {
        out.setTitle(''); out.setAuthor(''); out.setSubject(''); out.setKeywords([]);
      } else {
        out.setTitle(opt.title || 'Merged PDF');
        if (opt.author) out.setAuthor(opt.author);
        if (opt.subject) out.setSubject(opt.subject);
      }
      out.setCreator('Converter Mall');
      if (opt.addPageNumbers) {
        const font = await out.embedFont(PDFLib.StandardFonts.Helvetica);
        const startNo = Math.max(1, Number(opt.pageNumberStart || 1));
        out.getPages().forEach((page, i) => {
          const label = String(startNo + i), size = 9, width = font.widthOfTextAtSize(label, size);
          page.drawText(label, { x:(page.getWidth()-width)/2, y:10, size, font, color:PDFLib.rgb(.35,.35,.35) });
        });
      }
      return [{ name: sanitizeName(opt.outputName || 'merged') + '.pdf', blob: new Blob([await out.save()], { type: 'application/pdf' }), detail: `${totalAdded}페이지` }];
    }
    const file = entries[0].file;
    const src = await PDFDocument.load(await file.arrayBuffer()); const total = src.getPageCount();

    const targetIndices = (targetMode, pagesText) => {
      if (targetMode === 'odd') return src.getPageIndices().filter(i => i % 2 === 0);
      if (targetMode === 'even') return src.getPageIndices().filter(i => i % 2 === 1);
      if (targetMode === 'custom') return parsePages(pagesText, total);
      return src.getPageIndices();
    };

    if (mode === 'watermark') {
      const indices = targetIndices(opt.targetMode || 'all', opt.targetPages);
      if (!indices.length) throw new Error('워터마크를 넣을 페이지를 선택하세요.');
      const template = String(opt.text || '').trim(); if (!template) throw new Error('워터마크 문구를 입력하세요.');
      const opacity = Math.max(0.05, Math.min(1, Number(opt.opacity || 25) / 100));
      const rotation = Number(opt.rotation || -35); const scale = Math.max(0.1, Math.min(1.5, Number(opt.scale || 55) / 100));
      const layout=opt.layout||'single', dateText=new Date().toLocaleDateString('ko-KR'), filename=base(file.name);
      for (const i of indices) {
        const page = src.getPage(i), pw = page.getWidth(), ph = page.getHeight();
        const text=template.replace(/\{(page|pages|date|filename)\}/g,(_,k)=>({page:String(i+1),pages:String(total),date:dateText,filename})[k]);
        const pngBytes = await makeWatermarkPng(text, opt.color || '#777777');
        const image = await src.embedPng(pngBytes);
        const targetW = Math.min(pw * scale, image.width), ratio = targetW / image.width, targetH = image.height * ratio;
        if(layout==='tile'){
          const gap=Math.max(10,Math.min(300,Number(opt.tileGap||80))), stepX=targetW+gap, stepY=targetH+gap;
          for(let y=-targetH;y<ph+targetH;y+=stepY) for(let x=-targetW;x<pw+targetW;x+=stepX) page.drawImage(image,{x,y,width:targetW,height:targetH,opacity,rotate:degrees(rotation)});
        } else {
          let x=(pw-targetW)/2, y=(ph-targetH)/2; const pos=opt.position||'center', pad=24;
          if(pos.includes('left')) x=pad; if(pos.includes('right')) x=pw-targetW-pad;
          if(pos.includes('top')) y=ph-targetH-pad; if(pos.includes('bottom')) y=pad;
          page.drawImage(image,{x,y,width:targetW,height:targetH,opacity,rotate:degrees(rotation)});
        }
      }
      return [{name:`${base(file.name)}_watermarked.pdf`,blob:new Blob([await src.save()],{type:'application/pdf'}),detail:`${indices.length}페이지 · ${layout==='tile'?'반복 타일':'단일 배치'}`}];
    }

    if (mode === 'page-numbers') {
      let indices = targetIndices(opt.targetMode || 'all', opt.targetPages);
      const skip=Math.max(0,Number(opt.skipFirstPages||0)); indices=indices.filter(i=>i>=skip);
      if (!indices.length) throw new Error('번호를 넣을 페이지를 선택하세요.');
      const font = await src.embedFont(PDFLib.StandardFonts.Helvetica);
      const size=Math.max(6,Math.min(36,Number(opt.fontSize||10))), startNumber=Math.max(1,Number(opt.startNumber||1));
      const prefix=String(opt.prefix||''), suffix=String(opt.suffix||''), color=hexToPdfRgb(opt.color||'#555555'), opacity=Math.max(.1,Math.min(1,Number(opt.opacity||100)/100));
      indices.forEach((pageIndex, order)=>{
        const raw=(opt.numberBasis||'sequence')==='physical'?startNumber+pageIndex-skip:startNumber+order;
        const label=`${prefix}${formatPageNumber(raw,opt.numberStyle||'decimal')}${suffix}`;
        const page=src.getPage(pageIndex), width=font.widthOfTextAtSize(label,size), pad=Number(opt.margin||18);
        let pos=opt.position||'bottom-center';
        if(opt.mirrorOddEven && pageIndex%2===1){pos=pos.replace('left','__tmp__').replace('right','left').replace('__tmp__','right');}
        let x=(page.getWidth()-width)/2, y=pad;
        if(pos.includes('left')) x=pad; if(pos.includes('right')) x=page.getWidth()-width-pad;
        if(pos.includes('top')) y=page.getHeight()-size-pad;
        page.drawText(label,{x,y,size,font,color,opacity});
      });
      return [{name:`${base(file.name)}_numbered.pdf`,blob:new Blob([await src.save()],{type:'application/pdf'}),detail:`${indices.length}페이지 · ${opt.numberStyle||'decimal'} · ${startNumber}부터`}];
    }

    if (mode === 'metadata-view') {
      const info = [
        `파일명: ${file.name}`,`파일 크기: ${fmt(file.size)}`,`페이지 수: ${total}`,
        `제목: ${src.getTitle()||'(없음)'}`,`작성자: ${src.getAuthor()||'(없음)'}`,`주제: ${src.getSubject()||'(없음)'}`,
        `키워드: ${(src.getKeywords()||'').toString()||'(없음)'}`,`제작 프로그램: ${src.getProducer()||'(없음)'}`,`생성 도구: ${src.getCreator()||'(없음)'}`,
        `생성일: ${src.getCreationDate()?.toISOString?.()||'(없음)'}`,`수정일: ${src.getModificationDate()?.toISOString?.()||'(없음)'}`
      ].join('\n');
      return [{name:`${base(file.name)}_metadata.txt`,blob:new Blob([info+'\n'],{type:'text/plain;charset=utf-8'}),detail:'문서 속성 보고서'}];
    }

    if (mode === 'metadata-edit') {
      src.setTitle(String(opt.title||'')); src.setAuthor(String(opt.author||'')); src.setSubject(String(opt.subject||''));
      src.setKeywords(String(opt.keywords||'').split(',').map(x=>x.trim()).filter(Boolean));
      src.setCreator(String(opt.creator||'Converter Mall')); src.setProducer(String(opt.producer||'Converter Mall'));
      if (opt.updateModifiedDate) src.setModificationDate(new Date());
      return [{name:`${base(file.name)}_metadata-edited.pdf`,blob:new Blob([await src.save()],{type:'application/pdf'}),detail:'제목·작성자·주제·키워드 수정'}];
    }

    if (mode === 'metadata-remove') {
      src.setTitle(''); src.setAuthor(''); src.setSubject(''); src.setKeywords([]); src.setCreator(''); src.setProducer('');
      if (opt.clearDates) { src.setCreationDate(new Date(0)); src.setModificationDate(new Date(0)); }
      return [{name:`${base(file.name)}_metadata-clean.pdf`,blob:new Blob([await src.save()],{type:'application/pdf'}),detail:'일반 문서 속성 제거'}];
    }

    if (mode === 'compress') {
      const preset=opt.preset||'custom';
      const presetMap={screen:{method:'raster',dpi:96,quality:.58,color:'color'},email:{method:'raster',dpi:120,quality:.72,color:'color'},print:{method:'raster',dpi:200,quality:.88,color:'color'}};
      const mapped=presetMap[preset]; const method = mapped?.method || opt.method || 'lossless';
      if(opt.removeMetadata){src.setTitle('');src.setAuthor('');src.setSubject('');src.setKeywords([]);src.setCreator('');src.setProducer('');}
      if (method === 'lossless') {
        const bytes = await src.save({ useObjectStreams: true, addDefaultPage: false, objectsPerTick: 50 });
        const saved=file.size-bytes.length, rate=file.size?Math.round(saved/file.size*1000)/10:0;
        return [{ name:`${base(file.name)}_optimized.pdf`, blob:new Blob([bytes],{type:'application/pdf'}), detail:`구조 최적화 · ${fmt(file.size)} → ${fmt(bytes.length)} · ${rate>=0?rate+'% 절감':'용량 증가'}` }];
      }
      const pdfjs=requirePdfJs(); const pdf=await pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise;
      const out=await PDFDocument.create(); const dpi=Math.max(72,Math.min(240,Number(mapped?.dpi||opt.rasterDpi||120))); const quality=Math.max(.35,Math.min(.95,Number(mapped?.quality||Number(opt.imageQuality||72)/100)));
      const colorMode=mapped?.color||opt.colorMode||'color';
      for(let n=1;n<=pdf.numPages;n++){
        const page=await pdf.getPage(n), baseViewport=page.getViewport({scale:1}), viewport=page.getViewport({scale:dpi/72});
        if(viewport.width*viewport.height>50000000) throw new Error(`페이지 ${n}가 너무 큽니다. DPI를 낮춰 주세요.`);
        const canvas=document.createElement('canvas'); canvas.width=Math.ceil(viewport.width); canvas.height=Math.ceil(viewport.height);
        const ctx=canvas.getContext('2d',{alpha:false}); ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height); await page.render({canvasContext:ctx,viewport,background:'#fff'}).promise;
        if(colorMode==='grayscale') applyGrayscale(ctx,canvas.width,canvas.height);
        const jpg=await canvasToBlob(canvas,'image/jpeg',quality), image=await out.embedJpg(await jpg.arrayBuffer());
        const op=out.addPage([baseViewport.width,baseViewport.height]); op.drawImage(image,{x:0,y:0,width:baseViewport.width,height:baseViewport.height});
      }
      if(opt.removeMetadata){out.setTitle('');out.setAuthor('');out.setSubject('');out.setKeywords([]);out.setCreator('');out.setProducer('');}
      const bytes=await out.save({useObjectStreams:true}), saved=file.size-bytes.length, rate=file.size?Math.round(saved/file.size*1000)/10:0;
      return [{name:`${base(file.name)}_compressed.pdf`,blob:new Blob([bytes],{type:'application/pdf'}),detail:`${preset!=='custom'?preset+' 프리셋 · ':''}${dpi} DPI · ${fmt(file.size)} → ${fmt(bytes.length)} · ${rate>=0?rate+'% 절감':'용량 증가'}`}];
    }

    if (mode === 'resize-pages' || mode === 'margins') {
      const out=await PDFDocument.create(); const indices=parsePages(opt.targetPages,total,true); const selectedSet=new Set(indices);
      const sizes={a4:[595.28,841.89],letter:[612,792],legal:[612,1008],a3:[841.89,1190.55]};
      const unitScale=(opt.unit||'pt')==='mm'?72/25.4:1;
      const clampMargin=v=>Math.max(-200,Math.min(500,Number(v||0)*unitScale));
      for(let i=0;i<total;i++){
        const page=src.getPage(i), sw=page.getWidth(), sh=page.getHeight();
        if(!selectedSet.has(i)){ (await out.copyPages(src,[i])).forEach(p=>out.addPage(p)); continue; }
        let tw=sw,th=sh,offsetX=0,offsetY=0,drawW=sw,drawH=sh;
        if(mode==='resize-pages'){
          const preset=opt.pageSize||'a4'; const pageUnitScale=(opt.pageUnit||'mm')==='mm'?72/25.4:(opt.pageUnit||'mm')==='in'?72:1; [tw,th]=sizes[preset]||[Number(opt.customWidth||210)*pageUnitScale,Number(opt.customHeight||297)*pageUnitScale];
          if((opt.orientation||'auto')==='landscape' && th>tw) [tw,th]=[th,tw]; if((opt.orientation||'auto')==='portrait' && tw>th) [tw,th]=[th,tw];
          const fit=opt.fitMode||'fit'; let scale=fit==='fill'?Math.max(tw/sw,th/sh):fit==='none'?1:Math.min(tw/sw,th/sh); if(opt.preventUpscale&&fit==='fit') scale=Math.min(1,scale); drawW=sw*scale;drawH=sh*scale; const anchor=opt.anchor||'center'; offsetX=anchor.includes('left')?0:anchor.includes('right')?tw-drawW:(tw-drawW)/2; offsetY=anchor.includes('top')?th-drawH:anchor.includes('bottom')?0:(th-drawH)/2;
        } else {
          const layout=opt.marginLayout||'uniform'; let left,right,top,bottom;
          if(layout==='uniform') left=right=top=bottom=clampMargin(opt.margin||24);
          else {
            top=clampMargin(layout==='mirror'?opt.mirrorTop:opt.top); right=clampMargin(opt.right); bottom=clampMargin(layout==='mirror'?opt.mirrorBottom:opt.bottom); left=clampMargin(opt.left);
            if(layout==='mirror'){
              const inner=clampMargin(opt.inner), outer=clampMargin(opt.outer), odd=(i%2===0), bind=(opt.bindingSide||'left');
              if(bind==='left'){ left=odd?inner:outer; right=odd?outer:inner; }
              else { right=odd?inner:outer; left=odd?outer:inner; }
            }
          }
          tw=Math.max(36,sw+left+right);th=Math.max(36,sh+top+bottom);offsetX=left;offsetY=bottom;
        }
        const embedded=await out.embedPage(page); const np=out.addPage([tw,th]);
        if(mode==='resize-pages' && opt.backgroundColor){ try{np.drawRectangle({x:0,y:0,width:tw,height:th,color:hexToPdfRgb(opt.backgroundColor)});}catch{} }
        if(mode==='margins' && opt.backgroundColor){ try{np.drawRectangle({x:0,y:0,width:tw,height:th,color:hexToPdfRgb(opt.backgroundColor)});}catch{} }
        np.drawPage(embedded,{x:offsetX,y:offsetY,width:drawW,height:drawH});
      }
      const suffix=mode==='resize-pages'?'resized':'margins'; return [{name:`${base(file.name)}_${suffix}.pdf`,blob:new Blob([await out.save({useObjectStreams:true})],{type:'application/pdf'}),detail:`${indices.length}페이지 적용${mode==='margins'?` · ${opt.marginLayout||'uniform'} 방식`:''}`}];
    }

    if (mode === 'header-footer') {
      let indices = targetIndices(opt.targetMode || 'all', opt.targetPages);
      if(opt.skipFirstPage) indices=indices.filter(i=>i!==0);
      if (!indices.length) throw new Error('머리글·바닥글을 넣을 페이지를 선택하세요.');
      const headerTemplate=String(opt.headerText||'').trim(), footerTemplate=String(opt.footerText||'').trim();
      if(!headerTemplate && !footerTemplate) throw new Error('머리글 또는 바닥글 문구를 입력하세요.');
      const color=opt.color||'#555555', fontSize=Math.max(7,Math.min(32,Number(opt.fontSize||10))), margin=Math.max(6,Math.min(100,Number(opt.margin||18)));
      const dateText=new Date().toLocaleDateString('ko-KR'), filename=file.name;
      for (const i of indices) {
        const page=src.getPage(i), vars={page:String(i+1),pages:String(total),title:src.getTitle()||base(file.name),date:dateText,filename};
        for (const [kind,template] of [['header',headerTemplate],['footer',footerTemplate]]) {
          if(!template) continue;
          const text=template.replace(/\{(page|pages|title|date|filename)\}/g,(_,k)=>vars[k]);
          const png=await makeLabelPng(text,color,fontSize); const image=await src.embedPng(png);
          const maxW=Math.max(40,page.getWidth()-margin*2), scale=Math.min(1,maxW/image.width), w=image.width*scale,h=image.height*scale;
          let align=kind==='header'?(opt.headerAlign||'center'):(opt.footerAlign||'center');
          if(opt.mirrorOddEven&&i%2===1){if(align==='left')align='right';else if(align==='right')align='left';}
          let x=(page.getWidth()-w)/2; if(align==='left') x=margin; if(align==='right') x=page.getWidth()-w-margin;
          const y=kind==='header'?page.getHeight()-h-margin:margin;
          page.drawImage(image,{x,y,width:w,height:h,opacity:Math.max(.1,Math.min(1,Number(opt.opacity||100)/100))});
          if(opt.separatorLine){const ly=kind==='header'?y-3:y+h+3;page.drawLine({start:{x:margin,y:ly},end:{x:page.getWidth()-margin,y:ly},thickness:Math.max(.2,Math.min(4,Number(opt.lineThickness||.7))),color:hexToPdfRgb(opt.lineColor||'#cccccc')});}
        }
      }
      return [{name:`${base(file.name)}_header-footer.pdf`,blob:new Blob([await src.save()],{type:'application/pdf'}),detail:`${indices.length}페이지 · 머리글/바닥글 개별 정렬`}];
    }

    if (mode === 'crop-pages') {
      const out=await PDFDocument.create(), selected=new Set(targetIndices(opt.targetMode||'all',opt.targetPages));
      if(!selected.size) throw new Error('재단할 페이지를 선택하세요.');
      const auto=(opt.cropMode||'manual')==='auto'; let autoPdf=null;
      if(auto) autoPdf=await requirePdfJs().getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise;
      for(let i=0;i<total;i++){
        const page=src.getPage(i); if(!selected.has(i)){(await out.copyPages(src,[i])).forEach(p=>out.addPage(p));continue;}
        const sw=page.getWidth(),sh=page.getHeight(); let left=Math.max(0,Number(opt.left||0)),right=Math.max(0,Number(opt.right||0)),top=Math.max(0,Number(opt.top||0)),bottom=Math.max(0,Number(opt.bottom||0));
        if(auto){
          const rp=await autoPdf.getPage(i+1), vp=rp.getViewport({scale:.6}), canvas=document.createElement('canvas');canvas.width=Math.ceil(vp.width);canvas.height=Math.ceil(vp.height);const ctx=canvas.getContext('2d',{alpha:false});ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);await rp.render({canvasContext:ctx,viewport:vp,background:'#fff'}).promise;
          const b=findContentBounds(canvas,Number(opt.autoTolerance||18)); if(b){const pad=Math.max(0,Number(opt.autoPadding||8));left=Math.max(0,b.left/canvas.width*sw-pad);right=Math.max(0,(canvas.width-1-b.right)/canvas.width*sw-pad);top=Math.max(0,b.top/canvas.height*sh-pad);bottom=Math.max(0,(canvas.height-1-b.bottom)/canvas.height*sh-pad);}
        }
        if(left+right+top+bottom===0 && !auto) throw new Error('한 방향 이상의 재단값을 입력하세요.');
        const tw=sw-left-right,th=sh-top-bottom;if(tw<36||th<36) throw new Error(`${i+1}페이지의 재단값이 너무 큽니다.`);
        const embedded=await out.embedPage(page); const np=out.addPage([tw,th]); np.drawPage(embedded,{x:-left,y:-bottom,width:sw,height:sh});
      }
      return [{name:`${base(file.name)}_cropped.pdf`,blob:new Blob([await out.save({useObjectStreams:true})],{type:'application/pdf'}),detail:`${selected.size}페이지 · ${auto?'흰 여백 자동 감지':'수동 재단'}`}];
    }

    if (mode === 'flatten-forms') {
      let form, fields=[];
      try { form=src.getForm(); fields=form.getFields(); } catch { throw new Error('PDF 양식 구조를 읽지 못했습니다.'); }
      if(!fields.length) throw new Error('이 PDF에서 편집 가능한 양식 필드를 찾지 못했습니다.');
      const rows=fields.map((field,index)=>{let value='';try{value=field.getText?.()??field.getSelected?.()?.join(', ')??field.isChecked?.()??'';}catch{}return {index:index+1,name:field.getName?.()||`field-${index+1}`,type:field.constructor?.name||'Unknown',value:String(value??'')};});
      const report=['Converter Mall PDF 양식 필드 보고서','================================',`파일명: ${file.name}`,`필드 수: ${rows.length}`,'',...rows.map(r=>`${r.index}. ${r.name} · ${r.type} · 값: ${r.value||'(비어 있음)'}`),'','주의: 전자서명·XFA 양식은 일반 AcroForm과 다르게 처리될 수 있습니다.'].join('\n')+'\n';
      if((opt.actionMode||'flatten')==='report') return [{name:`${base(file.name)}_form-fields.txt`,blob:new Blob([report],{type:'text/plain;charset=utf-8'}),detail:`양식 필드 ${rows.length}개`}];
      try { form.flatten(); } catch { throw new Error('양식 필드를 평탄화하지 못했습니다. PDF 양식 구조를 확인하세요.'); }
      const outputName=sanitizeName(opt.outputName||base(file.name)+'_flattened');
      const results=[{name:`${outputName}.pdf`,blob:new Blob([await src.save({useObjectStreams:true})],{type:'application/pdf'}),detail:`양식 필드 ${rows.length}개 고정`}];
      if(opt.includeReport) results.push({name:`${outputName}_report.txt`,blob:new Blob([report],{type:'text/plain;charset=utf-8'}),detail:'필드 감사 보고서'});
      return results;
    }

    if (mode === 'insert-blank') {
      const out=await PDFDocument.create(); const where=opt.position||'end', count=Math.max(1,Math.min(50,Number(opt.count||1)));
      const refPage=src.getPage(Math.min(total-1,Math.max(0,Number(opt.referencePage||1)-1))); const sizes={a4:[595.28,841.89],letter:[612,792]};
      let size=(opt.pageSize||'match')==='match'?[refPage.getWidth(),refPage.getHeight()]:(sizes[opt.pageSize]||sizes.a4); if((opt.orientation||'auto')==='landscape'&&size[1]>size[0]) size=[size[1],size[0]];
      const addBlanks=()=>{for(let k=0;k<count;k++) out.addPage(size)}; const target=Math.min(total,Math.max(1,Number(opt.referencePage||1)));
      if(where==='start') addBlanks();
      for(let i=0;i<total;i++){
        if(where==='before'&&i===target-1) addBlanks();
        (await out.copyPages(src,[i])).forEach(p=>out.addPage(p));
        if(where==='after'&&i===target-1) addBlanks();
        if(where==='every' && (i+1)%Math.max(1,Number(opt.interval||1))===0 && i<total-1) addBlanks();
      }
      if(where==='end') addBlanks();
      return [{name:`${base(file.name)}_with-blank-pages.pdf`,blob:new Blob([await out.save({useObjectStreams:true})],{type:'application/pdf'}),detail:`빈 페이지 ${count}${where==='every'?'개씩 반복':'개 삽입'}`}];
    }

    if (mode === 'security-audit') {
      const report = inspectPdfSecurity(src, file);
      const format = opt.reportFormat || 'txt';
      if (format === 'json') {
        const text = JSON.stringify(report, null, 2) + '\n';
        return [{name:`${base(file.name)}_security-audit.json`,blob:new Blob([text],{type:'application/json;charset=utf-8'}),detail:`검사 항목 ${report.summary.totalSignals}개`}];
      }
      const lines = [
        'Converter Mall PDF 배포 안전 검사','================================',
        `파일명: ${report.file.name}`,`파일 크기: ${report.file.size}`,`페이지 수: ${report.file.pages}`,'','[검사 결과]',
        `JavaScript 이름 트리: ${report.document.javascriptNameTree ? '감지' : '없음'}`,
        `문서 열기 동작(OpenAction): ${report.document.openAction ? '감지' : '없음'}`,
        `문서 추가 동작(AA): ${report.document.additionalActions ? '감지' : '없음'}`,
        `내장 첨부파일 이름 트리: ${report.document.embeddedFiles ? '감지' : '없음'}`,
        `양식 필드: ${report.document.formFields}개`,`XFA 양식: ${report.document.xfa ? '감지' : '없음'}`,
        `링크 주석: ${report.annotations.links}개`,`파일 첨부 주석: ${report.annotations.fileAttachments}개`,
        `양식 위젯: ${report.annotations.widgets}개`,`기타 주석: ${report.annotations.other}개`,`페이지 추가 동작: ${report.annotations.pageActions}개`,
        '','[판정]',report.summary.totalSignals ? '검토가 필요한 상호작용 요소가 감지되었습니다.' : '검사 범위에서 상호작용 요소를 찾지 못했습니다.',
        '','[주의]','이 검사는 PDF 구조의 대표 항목을 점검하는 보조 기능입니다.',
        '악성 여부를 확정하거나 전자서명·암호·모든 비표준 객체를 완전 검증하지 않습니다.','중요 문서는 보안 제품과 전용 PDF 검사 도구로 추가 확인하세요.'
      ];
      return [{name:`${base(file.name)}_security-audit.txt`,blob:new Blob([lines.join('\n')+'\n'],{type:'text/plain;charset=utf-8'}),detail:`검사 항목 ${report.summary.totalSignals}개`}];
    }

    if (['page-size-report','font-report','annotation-report','form-report','accessibility-audit','bookmark-report','attachment-report','page-resource-report','image-resource-report','document-structure-report'].includes(mode)) {
      const format = opt.reportFormat || 'txt';
      const report = buildPdfAnalysisReport(mode, src, file);
      const suffixMap = { 'page-size-report':'page-sizes', 'font-report':'fonts', 'annotation-report':'annotations', 'form-report':'forms', 'accessibility-audit':'accessibility-audit', 'bookmark-report':'bookmarks', 'attachment-report':'attachments', 'page-resource-report':'page-resources', 'image-resource-report':'image-resources', 'document-structure-report':'document-structure' };
      const suffix = suffixMap[mode] || 'report';
      if (format === 'json') {
        const text = JSON.stringify(report, null, 2) + '\n';
        return [{name:`${base(file.name)}_${suffix}.json`,blob:new Blob([text],{type:'application/json;charset=utf-8'}),detail:report.summary}];
      }
      const text = analysisReportToText(mode, report);
      return [{name:`${base(file.name)}_${suffix}.txt`,blob:new Blob([text],{type:'text/plain;charset=utf-8'}),detail:report.summary}];
    }

    if (mode === 'remove-links' || mode === 'remove-annotations') {
      const indices = targetIndices(opt.targetMode || 'all', opt.targetPages);
      if (!indices.length) throw new Error('작업할 페이지를 선택하세요.');
      let removed = 0;
      for (const index of indices) {
        removed += filterPageAnnotations(src, index, annotation => {
          const subtype = annotationSubtype(src, annotation);
          if (mode === 'remove-links') return subtype !== '/Link';
          if (subtype === '/Link' && opt.keepLinks) return true;
          if (subtype === '/Widget' && opt.keepFormFields) return true;
          return false;
        });
      }
      if (!removed) throw new Error(mode === 'remove-links' ? '선택한 페이지에서 제거할 링크를 찾지 못했습니다.' : '선택한 페이지에서 제거할 주석을 찾지 못했습니다.');
      const suffix = mode === 'remove-links' ? 'links-removed' : 'annotations-removed';
      return [{name:`${base(file.name)}_${suffix}.pdf`,blob:new Blob([await src.save({useObjectStreams:true})],{type:'application/pdf'}),detail:`${removed}개 제거 · ${indices.length}페이지 검사`}];
    }

    if (mode === 'remove-form-fields') {
      let count = 0;
      try {
        const form = src.getForm(); const fields = form.getFields(); count = fields.length;
        if (!count) throw new Error('이 PDF에서 제거할 양식 필드를 찾지 못했습니다.');
        for (const field of [...fields].reverse()) form.removeField(field);
        try { src.catalog.delete(PDFLib.PDFName.of('AcroForm')); } catch {}
      } catch (error) {
        if (String(error.message || error).includes('찾지 못했습니다')) throw error;
        throw new Error('양식 필드를 제거하지 못했습니다. 입력값을 먼저 평탄화하거나 다른 PDF를 확인하세요.');
      }
      return [{name:`${base(file.name)}_form-fields-removed.pdf`,blob:new Blob([await src.save({useObjectStreams:true})],{type:'application/pdf'}),detail:`양식 필드 ${count}개 제거`}];
    }

    if (mode === 'split') {
      const splitMode = opt.splitMode || 'unit'; const groups = [];
      if (splitMode === 'each') for (let i = 0; i < total; i++) groups.push([i]);
      else if (splitMode === 'ranges') {
        const parts=String(opt.ranges||'').split(',').map(x=>x.trim()).filter(Boolean);
        for(const part of parts){ const eq=part.indexOf('='); const expr=eq>=0?part.slice(eq+1).trim():part; const label=eq>=0?sanitizeName(part.slice(0,eq).trim()):''; const pages=parsePages(expr,total); if(!pages.length) throw new Error(`분할 범위를 확인하세요: ${part}`); groups.push(Object.assign(pages,{label})); }
      }
      else if (splitMode === 'oddEven') { const odd = [], even = []; for (let i = 0; i < total; i++) (i % 2 === 0 ? odd : even).push(i); if (odd.length) groups.push(odd); if (even.length) groups.push(even); }
      else { const unit = Math.max(1, Number(opt.unit || 1)); for (let i = 0; i < total; i += unit) groups.push(Array.from({ length: Math.min(unit, total - i) }, (_, k) => i + k)); }
      const maxOutputs = Math.max(1, Math.min(1000, Number(opt.maxOutputs || 200)));
      if (groups.length > maxOutputs) throw new Error(`예상 결과 ${groups.length}개가 안전 제한 ${maxOutputs}개를 초과합니다.`);
      const prefix = sanitizeName(opt.outputPrefix || base(file.name)); const arr = [];
      for (let g = 0; g < groups.length; g++) {
        const sourceGroup = groups[g].slice();
        const outputGroup = opt.repeatCover && !sourceGroup.includes(0) ? [0, ...sourceGroup] : sourceGroup;
        const out = await PDFDocument.create(); (await out.copyPages(src, outputGroup)).forEach(p => out.addPage(p));
        let suffix;
        if (splitMode === 'oddEven') suffix = g === 0 ? 'odd' : 'even';
        else if ((opt.nameMode || 'sequence') === 'custom' && sourceGroup.label) suffix=sourceGroup.label;
        else if ((opt.nameMode || 'sequence') === 'range') {
          const first = Math.min(...sourceGroup) + 1, last = Math.max(...sourceGroup) + 1;
          suffix = first === last ? `p${String(first).padStart(3,'0')}` : `p${String(first).padStart(3,'0')}-p${String(last).padStart(3,'0')}`;
        } else suffix = String(g + 1).padStart(3, '0');
        arr.push({ name: `${prefix}_${suffix}.pdf`, blob: new Blob([await out.save()], { type: 'application/pdf' }), detail: `${outputGroup.length}페이지${opt.repeatCover && !sourceGroup.includes(0) ? ' · 표지 포함' : ''}` });
      }
      return arr;
    }
    if (mode === 'rotate') {
      const angle = Number(opt.angle || 90); const targetMode = opt.targetMode || 'all'; let idx = [];
      if (targetMode === 'all') idx = src.getPageIndices();
      else if (targetMode === 'odd') idx = src.getPageIndices().filter(i => i % 2 === 0);
      else if (targetMode === 'even') idx = src.getPageIndices().filter(i => i % 2 === 1);
      else if (targetMode === 'landscape') idx = src.getPages().map((p,i)=>({p,i})).filter(x=>x.p.getWidth()>x.p.getHeight()).map(x=>x.i);
      else if (targetMode === 'portrait') idx = src.getPages().map((p,i)=>({p,i})).filter(x=>x.p.getHeight()>=x.p.getWidth()).map(x=>x.i);
      else idx = parsePages(opt.targetPages, total);
      if (!idx.length) throw new Error('회전할 페이지가 선택되지 않았습니다.');
      idx.forEach(i => { const p=src.getPage(i); const next = opt.resetRotation ? 0 : (p.getRotation().angle + angle) % 360; p.setRotation(degrees(next)); });
      return [{ name: `${base(file.name)}_rotated.pdf`, blob: new Blob([await src.save()], { type: 'application/pdf' }), detail: `${idx.length}페이지 회전` }];
    }
    if (mode === 'delete') { const del = parsePages(opt.pages, total).sort((a,b) => b - a); if (!del.length) throw new Error('삭제할 페이지 번호를 입력하세요.'); if (del.length >= total) throw new Error('모든 페이지를 삭제할 수는 없습니다.'); del.forEach(i => src.removePage(i)); return [{ name: `${base(file.name)}_deleted.pdf`, blob: new Blob([await src.save()], { type: 'application/pdf' }) }]; }
    if (mode === 'extract') { const idx = parsePages(opt.pages, total); if (!idx.length) throw new Error('추출할 페이지 번호를 입력하세요.'); if ((opt.outputMode||'combined')==='each') { const arr=[]; for (const i of idx) { const out=await PDFDocument.create(); (await out.copyPages(src,[i])).forEach(p=>out.addPage(p)); arr.push({name:`${base(file.name)}_page-${String(i+1).padStart(3,'0')}.pdf`,blob:new Blob([await out.save()],{type:'application/pdf'}),detail:'1페이지'}); } return arr; } const out = await PDFDocument.create(); (await out.copyPages(src, idx)).forEach(p => out.addPage(p)); return [{ name: `${base(file.name)}_extracted.pdf`, blob: new Blob([await out.save()], { type: 'application/pdf' }), detail: `${idx.length}페이지` }]; }
    if (mode === 'reorder') { let idx=[]; const method=opt.reorderMode||'manual'; if(method==='reverse') idx=src.getPageIndices().slice().reverse(); else if(method==='oddFirst') idx=[...src.getPageIndices().filter(i=>i%2===0),...src.getPageIndices().filter(i=>i%2===1)]; else if(method==='evenFirst') idx=[...src.getPageIndices().filter(i=>i%2===1),...src.getPageIndices().filter(i=>i%2===0)]; else idx=parsePages(opt.order,total); if (idx.length !== total) throw new Error(`전체 ${total}페이지를 빠짐없이 순서대로 입력하세요.`); const out = await PDFDocument.create(); (await out.copyPages(src, idx)).forEach(p => out.addPage(p)); return [{ name: `${base(file.name)}_reordered.pdf`, blob: new Blob([await out.save()], { type: 'application/pdf' }), detail: `${total}페이지 재배치` }]; }
    if (mode === 'duplicate') { const chosen=parsePages(opt.duplicatePages||opt.page,total); if(!chosen.length) throw new Error('복제할 페이지를 선택하세요.'); const count=Math.max(1,Math.min(50,Number(opt.count||1))); const out=await PDFDocument.create(); const atEnd=(opt.insertMode||'after')==='end'; for(const i of src.getPageIndices()){ (await out.copyPages(src,[i])).forEach(p=>out.addPage(p)); if(!atEnd && chosen.includes(i)) for(let k=0;k<count;k++) (await out.copyPages(src,[i])).forEach(p=>out.addPage(p)); } if(atEnd) for(let k=0;k<count;k++) for(const i of chosen) (await out.copyPages(src,[i])).forEach(p=>out.addPage(p)); return [{name:`${base(file.name)}_duplicated.pdf`,blob:new Blob([await out.save()],{type:'application/pdf'}),detail:`${chosen.length}페이지 × ${count}회 복제`}]; }
    throw new Error('지원하지 않는 PDF 편집 작업입니다.');
  }

  async function renderPdf(mode, file, opt) {
    const pdfjs = requirePdfJs(); const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
    const selected = parsePages(opt.pages, pdf.numPages, true); if (!selected.length) throw new Error('변환할 페이지가 없습니다.');
    if (mode === 'sanitize') {
      const {PDFDocument}=requirePdfLib(); const out=await PDFDocument.create();
      const chosen=parsePages(opt.pages,pdf.numPages,true); if(!chosen.length) throw new Error('배포본에 포함할 페이지를 선택하세요.');
      const dpi=Math.max(72,Math.min(300,Number(opt.dpi||150))), quality=Math.max(.45,Math.min(.98,Number(opt.quality||82)/100));
      const colorMode=opt.colorMode||'color', imageFormat=opt.imageFormat||'jpeg', bg=opt.backgroundColor||'#ffffff';
      for(const idx of chosen){
        const n=idx+1, page=await pdf.getPage(n), baseVp=page.getViewport({scale:1}), vp=page.getViewport({scale:dpi/72});
        if(vp.width*vp.height>50000000) throw new Error(`${n}페이지가 너무 큽니다. DPI를 낮춰 주세요.`);
        const canvas=document.createElement('canvas');canvas.width=Math.ceil(vp.width);canvas.height=Math.ceil(vp.height);
        const ctx=canvas.getContext('2d',{alpha:false});ctx.fillStyle=bg;ctx.fillRect(0,0,canvas.width,canvas.height);
        await page.render({canvasContext:ctx,viewport:vp,background:bg,annotationMode:0}).promise;
        if(colorMode==='grayscale') applyGrayscale(ctx,canvas.width,canvas.height);
        let image;
        if(imageFormat==='png'){const png=await canvasToBlob(canvas,'image/png',1);image=await out.embedPng(await png.arrayBuffer());}
        else {const jpg=await canvasToBlob(canvas,'image/jpeg',quality);image=await out.embedJpg(await jpg.arrayBuffer());}
        const np=out.addPage([baseVp.width,baseVp.height]);np.drawImage(image,{x:0,y:0,width:baseVp.width,height:baseVp.height});
      }
      if(opt.preserveMetadata){try{const original=await PDFDocument.load(await file.arrayBuffer());if(original.getTitle())out.setTitle(original.getTitle());if(original.getAuthor())out.setAuthor(original.getAuthor());if(original.getSubject())out.setSubject(original.getSubject());}catch{}}
      else{out.setTitle('');out.setAuthor('');out.setSubject('');out.setKeywords([]);}
      out.setCreator('Converter Mall Safe Distribution');out.setProducer('Converter Mall');
      const results=[{name:`${base(file.name)}_safe-copy.pdf`,blob:new Blob([await out.save({useObjectStreams:true})],{type:'application/pdf'}),detail:`${chosen.length}페이지 · ${dpi} DPI · ${imageFormat.toUpperCase()} 재구성`}];
      if(opt.includeReport){const report=['Converter Mall PDF 안전 배포 처리 보고서','================================',`원본 파일: ${file.name}`,`처리 페이지: ${chosen.map(i=>i+1).join(', ')}`,`출력 방식: ${imageFormat.toUpperCase()} · ${dpi} DPI · ${colorMode}`,`메타데이터 유지: ${opt.preserveMetadata?'예':'아니오'}`,'','새 PDF에는 원본의 링크·주석·양식·첨부파일·JavaScript·전자서명이 포함되지 않습니다.','텍스트 검색·선택과 벡터 구조는 유지되지 않습니다.'].join('\n')+'\n';results.push({name:`${base(file.name)}_safe-copy-report.txt`,blob:new Blob([report],{type:'text/plain;charset=utf-8'}),detail:'안전 처리 보고서'});}
      return results;
    }
    if (mode === 'grayscale') {
      const {PDFDocument}=requirePdfLib(); const sourceBytes=await file.arrayBuffer(); const original=await PDFDocument.load(sourceBytes); const out=await PDFDocument.create();
      const chosen=new Set(parsePages(opt.pages,pdf.numPages,true)); const dpi=Math.max(72,Math.min(300,Number(opt.dpi||150))), quality=Math.max(.4,Math.min(.98,Number(opt.quality||82)/100)), outputMode=opt.outputMode||'grayscale';
      for(let i=0;i<pdf.numPages;i++){
        if(!chosen.has(i)){(await out.copyPages(original,[i])).forEach(p=>out.addPage(p));continue;}
        const page=await pdf.getPage(i+1), baseVp=page.getViewport({scale:1}), vp=page.getViewport({scale:dpi/72});
        if(vp.width*vp.height>50000000) throw new Error(`${i+1}페이지가 너무 큽니다. DPI를 낮춰 주세요.`);
        const canvas=document.createElement('canvas');canvas.width=Math.ceil(vp.width);canvas.height=Math.ceil(vp.height);const ctx=canvas.getContext('2d',{alpha:false});ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);await page.render({canvasContext:ctx,viewport:vp,background:'#fff'}).promise;applyGrayscale(ctx,canvas.width,canvas.height);
        if(opt.whitenBackground) whitenLightBackground(ctx,canvas.width,canvas.height,225);
        if(opt.contrast==='high') applyContrast(ctx,canvas.width,canvas.height,1.22); else if(opt.contrast==='soft') applyContrast(ctx,canvas.width,canvas.height,.9);
        if(outputMode==='binary') applyBinaryThreshold(ctx,canvas.width,canvas.height,Number(opt.threshold||180),Boolean(opt.despeckle));
        const jpg=await canvasToBlob(canvas,'image/jpeg',outputMode==='binary'?.92:quality), image=await out.embedJpg(await jpg.arrayBuffer()), np=out.addPage([baseVp.width,baseVp.height]);np.drawImage(image,{x:0,y:0,width:baseVp.width,height:baseVp.height});
      }
      return [{name:`${base(file.name)}_${outputMode==='binary'?'black-white':'grayscale'}.pdf`,blob:new Blob([await out.save({useObjectStreams:true})],{type:'application/pdf'}),detail:`${chosen.size}페이지 · ${dpi} DPI · ${outputMode==='binary'?'1비트 흑백':'그레이스케일'}`}];
    }

    if (mode === 'remove-blank') {
      const threshold=Math.max(0.0001,Math.min(.2,Number(opt.inkThreshold||0.004))), sensitivity=Math.max(5,Math.min(80,Number(opt.whiteTolerance||24))), border=Math.max(0,Math.min(.2,Number(opt.ignoreBorder||3)/100));
      const protectedPages=new Set(parsePages(opt.keepPages,pdf.numPages,false)); const blank=[], rows=[];
      for(let n=1;n<=pdf.numPages;n++){
        const page=await pdf.getPage(n), vp=page.getViewport({scale:.35}), text=opt.protectText?await page.getTextContent():null; const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.ceil(vp.width));canvas.height=Math.max(1,Math.ceil(vp.height));
        const ctx=canvas.getContext('2d',{alpha:false});ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);await page.render({canvasContext:ctx,viewport:vp,background:'#fff'}).promise;
        const d=ctx.getImageData(0,0,canvas.width,canvas.height).data, x0=Math.floor(canvas.width*border),x1=Math.ceil(canvas.width*(1-border)),y0=Math.floor(canvas.height*border),y1=Math.ceil(canvas.height*(1-border));let ink=0,pixels=0;
        for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const i=(y*canvas.width+x)*4;pixels++;if(255-Math.min(d[i],d[i+1],d[i+2])>sensitivity)ink++;}
        const ratio=pixels?ink/pixels:0, hasText=Boolean(text?.items?.some(x=>String(x.str||'').trim())), protectedPage=protectedPages.has(n-1), candidate=ratio<threshold&&!hasText&&!protectedPage;
        if(candidate)blank.push(n-1);rows.push({page:n,inkRatio:Number((ratio*100).toFixed(4)),hasText,protected:protectedPage,candidate});
      }
      if((opt.actionMode||'report')==='report'){
        const lines=['Converter Mall 빈 페이지 후보 보고서','================================',`파일명: ${file.name}`,`전체 페이지: ${pdf.numPages}`,`후보 페이지: ${blank.length?blank.map(i=>i+1).join(', '):'없음'}`,'','[페이지별 분석]',...rows.map(r=>`${r.page}페이지 · 내용 ${r.inkRatio}% · 텍스트 ${r.hasText?'있음':'없음'} · 보호 ${r.protected?'예':'아니오'} · ${r.candidate?'빈 페이지 후보':'유지'}`),'','중요 문서는 후보 페이지를 눈으로 확인한 뒤 제거하세요.'];
        return [{name:`${base(file.name)}_blank-page-report.txt`,blob:new Blob([lines.join('\n')+'\n'],{type:'text/plain;charset=utf-8'}),detail:`빈 페이지 후보 ${blank.length}개`}];
      }
      if(!blank.length) throw new Error('설정 기준에서 빈 페이지를 찾지 못했습니다.'); if(blank.length>=pdf.numPages) throw new Error('모든 페이지가 빈 페이지로 판정되었습니다. 민감도를 조절하세요.');
      const {PDFDocument}=requirePdfLib(); const src=await PDFDocument.load(await file.arrayBuffer()); blank.sort((a,b)=>b-a).forEach(i=>src.removePage(i));
      return [{name:`${base(file.name)}_blank-removed.pdf`,blob:new Blob([await src.save({useObjectStreams:true})],{type:'application/pdf'}),detail:`빈 페이지 ${blank.length}개 제거 · ${pdf.numPages-blank.length}페이지 유지`}];
    }

    if (mode === 'extract-images') {
      const chosen=parsePages(opt.pages,pdf.numPages,true), minW=Math.max(1,Number(opt.minWidth||64)), minH=Math.max(1,Number(opt.minHeight||64)), minArea=Math.max(1,Number(opt.minArea||4096));
      const found=[], seenObjects=new Set(), seenHashes=new Set(), manifest=[];
      const quickHash=arr=>{let h=2166136261;const step=Math.max(1,Math.floor(arr.length/2048));for(let i=0;i<arr.length;i+=step){h^=arr[i];h=Math.imul(h,16777619);}return (h>>>0).toString(16)};
      for(const pi of chosen){ const page=await pdf.getPage(pi+1); const ops=await page.getOperatorList();
        for(let k=0;k<ops.fnArray.length;k++){
          const fn=ops.fnArray[k], name=ops.argsArray[k]?.[0]; if(fn!==pdfjs.OPS.paintImageXObject || !name || seenObjects.has(`${pi}-${name}`)) continue; seenObjects.add(`${pi}-${name}`);
          const img=await new Promise(resolve=>{try{page.objs.get(name,resolve)}catch{resolve(null)}}); if(!img||!img.width||!img.height||img.width<minW||img.height<minH||img.width*img.height<minArea) continue;
          const canvas=document.createElement('canvas');canvas.width=img.width;canvas.height=img.height;const ctx=canvas.getContext('2d');
          let rgba=null;
          try{ if(img.bitmap){ctx.drawImage(img.bitmap,0,0);rgba=ctx.getImageData(0,0,img.width,img.height).data;} else if(img.data){ const arr=img.data instanceof Uint8ClampedArray?img.data:new Uint8ClampedArray(img.data); rgba=arr.length===img.width*img.height*4?arr:expandImageData(arr,img.width,img.height);ctx.putImageData(new ImageData(rgba,img.width,img.height),0,0);} else continue; }catch{continue;}
          const hash=`${img.width}x${img.height}:${quickHash(rgba)}`; if(opt.deduplicate&&seenHashes.has(hash)) continue; seenHashes.add(hash);
          let hasAlpha=false; for(let ai=3;ai<rgba.length;ai+=4){if(rgba[ai]<255){hasAlpha=true;break;}}
          const blob=await canvasToBlob(canvas,'image/png',1), seq=found.length+1, nameMode=opt.nameMode||'page';
          const filename=nameMode==='sequence'?`${base(file.name)}_img${String(seq).padStart(3,'0')}.png`:`${base(file.name)}_p${String(pi+1).padStart(3,'0')}_img${String(seq).padStart(3,'0')}.png`;
          found.push({name:filename,blob,detail:`${img.width}×${img.height}${hasAlpha?' · 알파':''}`}); manifest.push({file:filename,page:pi+1,width:img.width,height:img.height,alpha:hasAlpha,bytes:blob.size,hash});
        }
      }
      if(!found.length) throw new Error('추출 가능한 래스터 이미지를 찾지 못했습니다. 벡터 도형이나 페이지 전체 렌더링은 PDF → PNG 도구를 사용하세요.');
      if(opt.includeManifest){const report={source:file.name,generatedAt:new Date().toISOString(),count:manifest.length,images:manifest};found.push({name:`${base(file.name)}_image-manifest.json`,blob:new Blob([JSON.stringify(report,null,2)+'\n'],{type:'application/json;charset=utf-8'}),detail:`이미지 ${manifest.length}개 보고서`});}
      return found;
    }

    if (mode === 'txt') {
      const pages = [];
      for (const index of selected) {
        const page = await pdf.getPage(index + 1), content = await page.getTextContent();
        pages.push({ number:index + 1, lines:extractTextLines(content.items, opt) });
      }
      if (opt.removeRepeatingHeadersFooters && pages.length >= 3) removeRepeatedEdges(pages);
      if (opt.removePageNumbers) pages.forEach(page => { page.lines = page.lines.filter(line => !/^\s*(?:-\s*)?\d{1,5}(?:\s*-)?\s*$/.test(line)); });
      const makeText = page => normalizeExtractedText(page.lines, opt);
      const prefix = sanitizeName(opt.outputName || base(file.name));
      const bom = opt.bom ? '\ufeff' : '';
      if ((opt.outputMode || 'combined') === 'each') {
        return pages.map(page => ({ name:`${prefix}_page-${String(page.number).padStart(3,'0')}.txt`, blob:new Blob([bom + makeText(page)],{type:'text/plain;charset=utf-8'}), detail:`${page.lines.length}줄` }));
      }
      const chunks = pages.map(page => {
        const separator = opt.pageSeparator === 'none' ? '' : opt.pageSeparator === 'line' ? '──────────' : `[Page ${page.number}]`;
        return `${separator}${separator ? '\n' : ''}${makeText(page)}`.trim();
      });
      const all = chunks.join('\n\n');
      if (!all.trim()) throw new Error('추출할 텍스트가 없습니다. 스캔 PDF라면 OCR 기능이 필요합니다.');
      return [{ name:`${prefix}.txt`, blob:new Blob([bom + all + '\n'],{type:'text/plain;charset=utf-8'}), detail:`${pages.length}페이지` }];
    }

    const colorMode = opt.colorMode || 'color';
    const bg = opt.background || '#ffffff';
    const quality = Math.max(.1, Math.min(1, Number(opt.quality || 90) / 100));
    const prefix = sanitizeName(opt.outputPrefix || base(file.name));
    const digits = Math.max(2, Math.min(4, Number(opt.pageDigits || 3)));
    const canvases = [];

    for (const index of selected) {
      const page = await pdf.getPage(index + 1);
      const baseViewport = page.getViewport({ scale: 1 });
      let scale;
      if ((opt.sizeMode || 'dpi') === 'width') scale = Math.max(0.1, Number(opt.targetWidth || 1600) / baseViewport.width);
      else if ((opt.sizeMode || 'dpi') === 'longEdge') scale = Math.max(0.1, Number(opt.targetLongEdge || 2000) / Math.max(baseViewport.width, baseViewport.height));
      else scale = Math.max(72, Math.min(600, Number(opt.dpi || 150))) / 72;
      const viewport = page.getViewport({ scale });
      if (viewport.width * viewport.height > 80000000) throw new Error(`페이지 ${index + 1}의 해상도가 너무 큽니다. 출력 크기를 낮춰 주세요.`);
      let canvas = document.createElement('canvas'); canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
      let ctx = canvas.getContext('2d', { alpha: false }); ctx.fillStyle = bg; ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport, background: bg }).promise;
      if (colorMode === 'grayscale') applyGrayscale(ctx, canvas.width, canvas.height);
      if (opt.autoCrop) canvas = cropWhiteMargins(canvas, Number(opt.cropTolerance || 12), bg);
      const rotation = Number(opt.rotation || 0); if (rotation) canvas = rotateCanvas(canvas, rotation, bg);
      if ((opt.sharpen || 'none') !== 'none') applySharpen(canvas, opt.sharpen === 'strong' ? 0.9 : 0.45);
      canvases.push({ canvas, pageNumber:index + 1 });
    }

    if ((opt.outputMode || 'pages') === 'stitch') {
      const gap = Math.max(0, Math.min(200, Number(opt.gap || 12)));
      const width = Math.max(...canvases.map(x => x.canvas.width));
      const height = canvases.reduce((sum, x) => sum + x.canvas.height, 0) + gap * Math.max(0, canvases.length - 1);
      if (width * height > 80000000) throw new Error('이어붙인 이미지가 너무 큽니다. 페이지 수나 출력 크기를 낮춰 주세요.');
      const joined = document.createElement('canvas'); joined.width = width; joined.height = height;
      const jctx = joined.getContext('2d', { alpha:false }); jctx.fillStyle = bg; jctx.fillRect(0,0,width,height);
      let y=0; for (const item of canvases) { const x=Math.round((width-item.canvas.width)/2); jctx.drawImage(item.canvas,x,y); y += item.canvas.height + gap; }
      const type = mode === 'png' ? 'image/png' : 'image/jpeg';
      const blob = await canvasToBlob(joined, type, quality);
      return [{ name:`${prefix}_stitched.${mode}`, blob, detail:`${canvases.length}페이지 · ${joined.width}×${joined.height}` }];
    }

    const results=[];
    for (const item of canvases) {
      const type = mode === 'png' ? 'image/png' : 'image/jpeg';
      const blob = await canvasToBlob(item.canvas, type, quality);
      const pageNo = String(item.pageNumber).padStart(digits, '0');
      results.push({ name:`${prefix}_page-${pageNo}.${mode}`, blob, detail:`${item.canvas.width}×${item.canvas.height}` });
    }
    return results;
  }

  async function makeWatermarkPng(text, color) {
    const canvas=document.createElement('canvas'), ctx=canvas.getContext('2d');
    const fontSize=72; ctx.font=`700 ${fontSize}px sans-serif`; const metrics=ctx.measureText(text);
    canvas.width=Math.max(320,Math.ceil(metrics.width+80)); canvas.height=130;
    const draw=canvas.getContext('2d'); draw.clearRect(0,0,canvas.width,canvas.height); draw.font=`700 ${fontSize}px sans-serif`; draw.textAlign='center'; draw.textBaseline='middle'; draw.fillStyle=color||'#777777'; draw.fillText(text,canvas.width/2,canvas.height/2);
    return new Uint8Array(await (await canvasToBlob(canvas,'image/png',1)).arrayBuffer());
  }
  function hexToPdfRgb(hex) { const c=hexToRgb(hex); return PDFLib.rgb(c.r/255,c.g/255,c.b/255); }

  async function makeLabelPng(text, color, fontSize) {
    const canvas=document.createElement('canvas'), ctx=canvas.getContext('2d'); const px=Math.max(14,Math.min(64,Number(fontSize||10)*2));
    ctx.font=`600 ${px}px sans-serif`; const metrics=ctx.measureText(text); canvas.width=Math.max(80,Math.ceil(metrics.width+24));canvas.height=Math.ceil(px*1.7);
    const draw=canvas.getContext('2d');draw.clearRect(0,0,canvas.width,canvas.height);draw.font=`600 ${px}px sans-serif`;draw.textAlign='center';draw.textBaseline='middle';draw.fillStyle=color||'#555555';draw.fillText(text,canvas.width/2,canvas.height/2);
    return new Uint8Array(await (await canvasToBlob(canvas,'image/png',1)).arrayBuffer());
  }
  function applyContrast(ctx,w,h,factor){const image=ctx.getImageData(0,0,w,h),d=image.data;for(let i=0;i<d.length;i+=4){for(let c=0;c<3;c++)d[i+c]=Math.max(0,Math.min(255,(d[i+c]-128)*factor+128));}ctx.putImageData(image,0,0);}

  function resolvePdfObject(doc, value) { if (!value) return null; try { return doc.context.lookup(value); } catch { return value; } }
  function pdfDictHas(dict, key) { if (!dict) return false; try { return Boolean(dict.get(PDFLib.PDFName.of(key))); } catch { return false; } }
  function annotationSubtype(doc, value) { const dict=resolvePdfObject(doc,value); if(!dict) return ''; try { const raw=dict.get(PDFLib.PDFName.of('Subtype')); return String(resolvePdfObject(doc,raw)||''); } catch { return ''; } }
  function pageAnnotationRefs(doc, pageIndex) { const page=doc.getPage(pageIndex); let arr; try { arr=resolvePdfObject(doc,page.node.get(PDFLib.PDFName.of('Annots'))); } catch { arr=null; } if(!arr||typeof arr.size!=='function')return[]; const refs=[];for(let i=0;i<arr.size();i++)refs.push(arr.get(i));return refs; }
  function filterPageAnnotations(doc,pageIndex,keepPredicate){const page=doc.getPage(pageIndex),refs=pageAnnotationRefs(doc,pageIndex);if(!refs.length)return 0;const kept=refs.filter(ref=>{try{return keepPredicate(ref);}catch{return true;}}),removed=refs.length-kept.length;if(!removed)return 0;if(kept.length)page.node.set(PDFLib.PDFName.of('Annots'),doc.context.obj(kept));else page.node.delete(PDFLib.PDFName.of('Annots'));return removed;}
  function inspectPdfSecurity(doc,file){const catalog=doc.catalog;let names=null,acro=null;try{names=resolvePdfObject(doc,catalog.get(PDFLib.PDFName.of('Names')));}catch{}try{acro=resolvePdfObject(doc,catalog.get(PDFLib.PDFName.of('AcroForm')));}catch{}const annotations={links:0,fileAttachments:0,widgets:0,other:0,pageActions:0};for(let i=0;i<doc.getPageCount();i++){const page=doc.getPage(i);if(pdfDictHas(page.node,'AA'))annotations.pageActions++;for(const ref of pageAnnotationRefs(doc,i)){const subtype=annotationSubtype(doc,ref);if(subtype==='/Link')annotations.links++;else if(subtype==='/FileAttachment')annotations.fileAttachments++;else if(subtype==='/Widget')annotations.widgets++;else annotations.other++;}}let fields=0;try{fields=doc.getForm().getFields().length;}catch{}const documentInfo={javascriptNameTree:pdfDictHas(names,'JavaScript'),embeddedFiles:pdfDictHas(names,'EmbeddedFiles'),openAction:pdfDictHas(catalog,'OpenAction'),additionalActions:pdfDictHas(catalog,'AA'),formFields:fields,xfa:pdfDictHas(acro,'XFA')};const totalSignals=(documentInfo.javascriptNameTree?1:0)+(documentInfo.embeddedFiles?1:0)+(documentInfo.openAction?1:0)+(documentInfo.additionalActions?1:0)+(documentInfo.xfa?1:0)+fields+annotations.links+annotations.fileAttachments+annotations.widgets+annotations.other+annotations.pageActions;return{generatedAt:new Date().toISOString(),file:{name:file.name,size:fmt(file.size),bytes:file.size,pages:doc.getPageCount()},document:documentInfo,annotations,summary:{totalSignals,status:totalSignals?'review':'clear-in-scope'}};}

  function pdfValueText(doc, value) {
    const obj = resolvePdfObject(doc, value); if (obj == null) return '';
    try { if (typeof obj.decodeText === 'function') return obj.decodeText(); } catch {}
    let text = String(obj);
    if (text.startsWith('/') ) text = text.slice(1);
    return text;
  }
  function pageSizeName(width, height) {
    const portrait=[Math.min(width,height),Math.max(width,height)];
    const sizes=[['A5',419.53,595.28],['A4',595.28,841.89],['A3',841.89,1190.55],['Letter',612,792],['Legal',612,1008],['Tabloid',792,1224]];
    let best=null;
    for (const [name,w,h] of sizes) { const diff=Math.abs(portrait[0]-w)+Math.abs(portrait[1]-h); if(!best||diff<best.diff) best={name,diff}; }
    return best && best.diff < 12 ? best.name : '사용자 지정';
  }
  function listPdfFonts(doc) {
    const map=new Map();
    for(let i=0;i<doc.getPageCount();i++){
      const page=doc.getPage(i); let resources=null, fonts=null;
      try{resources=resolvePdfObject(doc,page.node.get(PDFLib.PDFName.of('Resources')));fonts=resources&&resolvePdfObject(doc,resources.get(PDFLib.PDFName.of('Font')));}catch{}
      if(!fonts||typeof fonts.keys!=='function') continue;
      for(const key of fonts.keys()){
        let font=null;try{font=resolvePdfObject(doc,fonts.get(key));}catch{}
        if(!font)continue;
        const baseName=pdfValueText(doc,font.get(PDFLib.PDFName.of('BaseFont')))||String(key);
        const subtype=pdfValueText(doc,font.get(PDFLib.PDFName.of('Subtype')))||'Unknown';
        const encoding=pdfValueText(doc,font.get(PDFLib.PDFName.of('Encoding')))||'';
        const descriptor=resolvePdfObject(doc,font.get(PDFLib.PDFName.of('FontDescriptor')));
        const embedded=Boolean(descriptor&&(pdfDictHas(descriptor,'FontFile')||pdfDictHas(descriptor,'FontFile2')||pdfDictHas(descriptor,'FontFile3')));
        const id=`${baseName}|${subtype}|${encoding}|${embedded}`;
        if(!map.has(id)) map.set(id,{name:baseName,subtype,encoding:encoding||'기본/미표시',embedded,pages:[]});
        map.get(id).pages.push(i+1);
      }
    }
    return [...map.values()].map(x=>({...x,pages:[...new Set(x.pages)]}));
  }
  function listPdfAnnotations(doc) {
    const pages=[];const totals={};
    for(let i=0;i<doc.getPageCount();i++){
      const types={};
      for(const ref of pageAnnotationRefs(doc,i)){const subtype=annotationSubtype(doc,ref).replace(/^\//,'')||'Unknown';types[subtype]=(types[subtype]||0)+1;totals[subtype]=(totals[subtype]||0)+1;}
      pages.push({page:i+1,total:Object.values(types).reduce((a,b)=>a+b,0),types});
    }
    return {pages,totals,total:Object.values(totals).reduce((a,b)=>a+b,0)};
  }
  function listPdfForms(doc) {
    const fields=[];try{for(const field of doc.getForm().getFields()){
      const type=field.constructor?.name||'PDFField';let value='';
      try{if(typeof field.getText==='function')value=field.getText()||'';else if(typeof field.isChecked==='function')value=field.isChecked()?'checked':'unchecked';else if(typeof field.getSelected==='function')value=(field.getSelected()||[]).join(', ');else if(typeof field.getOptions==='function')value=`options: ${(field.getOptions()||[]).join(', ')}`;}catch{}
      let readOnly=false;try{readOnly=field.isReadOnly();}catch{}
      fields.push({name:field.getName(),type,value:String(value),readOnly});
    }}catch{}
    return fields;
  }
  function pdfDictKeys(dict){try{return dict&&typeof dict.keys==='function'?[...dict.keys()].map(k=>String(k).replace(/^\//,'')):[];}catch{return[];}}
  function pdfArrayItems(arr){const out=[];try{if(arr&&typeof arr.size==='function')for(let i=0;i<arr.size();i++)out.push(arr.get(i));}catch{}return out;}
  function listPdfBookmarks(doc){
    const results=[];let root=null;try{root=resolvePdfObject(doc,doc.catalog.get(PDFLib.PDFName.of('Outlines')));}catch{}
    if(!root)return results;const seen=new Set();let count=0;
    const walk=(node,depth)=>{while(node&&count<500){let key='';try{key=String(node.ref||node)}catch{}if(key&&seen.has(key))break;if(key)seen.add(key);count++;const title=pdfValueText(doc,node.get(PDFLib.PDFName.of('Title')))||'(제목 없음)';const dest=node.get(PDFLib.PDFName.of('Dest'));const action=resolvePdfObject(doc,node.get(PDFLib.PDFName.of('A')));let target='';if(dest)target=pdfValueText(doc,dest)||String(dest);else if(action){const subtype=pdfValueText(doc,action.get(PDFLib.PDFName.of('S')));const d=action.get(PDFLib.PDFName.of('D'));target=[subtype,pdfValueText(doc,d)||String(d||'')].filter(Boolean).join(' ');}results.push({title,depth,target:target||'미확인'});const first=resolvePdfObject(doc,node.get(PDFLib.PDFName.of('First')));if(first)walk(first,depth+1);node=resolvePdfObject(doc,node.get(PDFLib.PDFName.of('Next')));}}
    const first=resolvePdfObject(doc,root.get(PDFLib.PDFName.of('First')));if(first)walk(first,0);return results;
  }
  function listEmbeddedFiles(doc){
    const files=[];let names=null,tree=null;try{names=resolvePdfObject(doc,doc.catalog.get(PDFLib.PDFName.of('Names')));tree=names&&resolvePdfObject(doc,names.get(PDFLib.PDFName.of('EmbeddedFiles')));}catch{}
    const visit=node=>{if(!node)return;const pairs=resolvePdfObject(doc,node.get&&node.get(PDFLib.PDFName.of('Names')));const items=pdfArrayItems(pairs);for(let i=0;i+1<items.length;i+=2){const label=pdfValueText(doc,items[i]);const spec=resolvePdfObject(doc,items[i+1]);if(!spec)continue;const filename=pdfValueText(doc,spec.get(PDFLib.PDFName.of('UF')))||pdfValueText(doc,spec.get(PDFLib.PDFName.of('F')))||label||'(이름 없음)';const desc=pdfValueText(doc,spec.get(PDFLib.PDFName.of('Desc')));const ef=resolvePdfObject(doc,spec.get(PDFLib.PDFName.of('EF')));const stream=ef&&resolvePdfObject(doc,ef.get(PDFLib.PDFName.of('F'))||ef.get(PDFLib.PDFName.of('UF')));let size=null,subtype='';try{const params=stream&&resolvePdfObject(doc,stream.dict?.get(PDFLib.PDFName.of('Params')));const raw=params&&params.get(PDFLib.PDFName.of('Size'));size=raw?Number(String(resolvePdfObject(doc,raw))):null;subtype=stream?pdfValueText(doc,stream.dict?.get(PDFLib.PDFName.of('Subtype'))):'';}catch{}files.push({name:filename,label:label||'',description:desc||'',size:Number.isFinite(size)?size:null,subtype:subtype||''});}const kids=resolvePdfObject(doc,node.get&&node.get(PDFLib.PDFName.of('Kids')));for(const kid of pdfArrayItems(kids))visit(resolvePdfObject(doc,kid));};
    visit(tree);return files;
  }
  function pageResourceStats(doc){
    const pages=[];for(let i=0;i<doc.getPageCount();i++){const page=doc.getPage(i);let res=null;try{res=resolvePdfObject(doc,page.node.get(PDFLib.PDFName.of('Resources')));}catch{}const fonts=resolvePdfObject(doc,res&&res.get(PDFLib.PDFName.of('Font')));const xobjs=resolvePdfObject(doc,res&&res.get(PDFLib.PDFName.of('XObject')));let images=0,forms=0,other=0;for(const key of (xobjs&&typeof xobjs.keys==='function'?[...xobjs.keys()]:[])){const obj=resolvePdfObject(doc,xobjs.get(key));const subtype=pdfValueText(doc,obj?.dict?.get(PDFLib.PDFName.of('Subtype'))||obj?.get?.(PDFLib.PDFName.of('Subtype')));if(subtype==='Image')images++;else if(subtype==='Form')forms++;else other++;}const contents=resolvePdfObject(doc,page.node.get(PDFLib.PDFName.of('Contents')));const contentStreams=contents&&typeof contents.size==='function'?contents.size():(contents?1:0);const annotations=pageAnnotationRefs(doc,i).length;pages.push({page:i+1,fonts:fonts&&typeof fonts.keys==='function'?[...fonts.keys()].length:0,images,formXObjects:forms,otherXObjects:other,annotations,contentStreams});}return pages;
  }
  function listImageResources(doc){
    const map=new Map();for(let i=0;i<doc.getPageCount();i++){const page=doc.getPage(i);let res=null,xobjs=null;try{res=resolvePdfObject(doc,page.node.get(PDFLib.PDFName.of('Resources')));xobjs=resolvePdfObject(doc,res&&res.get(PDFLib.PDFName.of('XObject')));}catch{}if(!xobjs||typeof xobjs.keys!=='function')continue;for(const key of xobjs.keys()){const obj=resolvePdfObject(doc,xobjs.get(key));const dict=obj?.dict||obj;if(!dict)continue;const subtype=pdfValueText(doc,dict.get(PDFLib.PDFName.of('Subtype')));if(subtype!=='Image')continue;const width=Number(String(resolvePdfObject(doc,dict.get(PDFLib.PDFName.of('Width')))||0));const height=Number(String(resolvePdfObject(doc,dict.get(PDFLib.PDFName.of('Height')))||0));const bits=Number(String(resolvePdfObject(doc,dict.get(PDFLib.PDFName.of('BitsPerComponent')))||0));const colorSpace=pdfValueText(doc,dict.get(PDFLib.PDFName.of('ColorSpace')))||String(resolvePdfObject(doc,dict.get(PDFLib.PDFName.of('ColorSpace')))||'');const filter=pdfValueText(doc,dict.get(PDFLib.PDFName.of('Filter')))||String(resolvePdfObject(doc,dict.get(PDFLib.PDFName.of('Filter')))||'');const id=`${String(key)}|${width}|${height}|${bits}|${colorSpace}|${filter}`;if(!map.has(id))map.set(id,{name:String(key).replace(/^\//,''),width,height,bits,colorSpace:colorSpace||'미표시',filter:filter||'미표시',pages:[]});map.get(id).pages.push(i+1);}}
    return [...map.values()].map(x=>({...x,pages:[...new Set(x.pages)]}));
  }
  function documentStructure(doc){const catalog=doc.catalog;let names=null,acro=null,viewer=null;try{names=resolvePdfObject(doc,catalog.get(PDFLib.PDFName.of('Names')));}catch{}try{acro=resolvePdfObject(doc,catalog.get(PDFLib.PDFName.of('AcroForm')));}catch{}try{viewer=resolvePdfObject(doc,catalog.get(PDFLib.PDFName.of('ViewerPreferences')));}catch{}const bookmarks=listPdfBookmarks(doc),attachments=listEmbeddedFiles(doc);let fields=0;try{fields=doc.getForm().getFields().length}catch{}return{catalogKeys:pdfDictKeys(catalog),pageCount:doc.getPageCount(),language:pdfValueText(doc,catalog.get(PDFLib.PDFName.of('Lang')))||'',tagged:pdfDictHas(catalog,'StructTreeRoot'),markInfo:pdfDictHas(catalog,'MarkInfo'),bookmarks:bookmarks.length,attachments:attachments.length,formFields:fields,xfa:pdfDictHas(acro,'XFA'),openAction:pdfDictHas(catalog,'OpenAction'),additionalActions:pdfDictHas(catalog,'AA'),javascriptNameTree:pdfDictHas(names,'JavaScript'),embeddedFilesNameTree:pdfDictHas(names,'EmbeddedFiles'),viewerPreferenceKeys:pdfDictKeys(viewer)};}
  function extractLinkAnnotations(doc){
    const rows=[];
    for(let i=0;i<doc.getPageCount();i++){
      for(const ref of pageAnnotationRefs(doc,i)){
        const annot=resolvePdfObject(doc,ref); if(!annot) continue;
        const subtype=pdfValueText(doc,annot.get(PDFLib.PDFName.of('Subtype')));
        if(subtype!=='Link') continue;
        let uri=''; let action=resolvePdfObject(doc,annot.get(PDFLib.PDFName.of('A')));
        if(action){ const kind=pdfValueText(doc,action.get(PDFLib.PDFName.of('S'))); if(kind==='URI') uri=pdfValueText(doc,action.get(PDFLib.PDFName.of('URI')))||''; }
        const dest=annot.get(PDFLib.PDFName.of('Dest'));
        rows.push({page:i+1,uri,internal:Boolean(dest&&!uri),domain:uriDomain(uri)});
      }
    }
    return rows;
  }
  function uriDomain(uri){
    try{return new URL(uri).hostname.toLowerCase();}catch{return uri? '(해석 불가)':'';}
  }
  async function pdfJsPageMetrics(file){
    const pdfjs=requirePdfJs(); const pdf=await pdfjs.getDocument({data:await file.arrayBuffer()}).promise; const pages=[];
    for(let n=1;n<=pdf.numPages;n++){
      const page=await pdf.getPage(n); const viewport=page.getViewport({scale:1}); const content=await page.getTextContent();
      const items=content.items||[]; const chars=items.reduce((a,x)=>a+String(x.str||'').replace(/\s/g,'').length,0); const words=items.reduce((a,x)=>a+(String(x.str||'').trim().match(/\S+/g)||[]).length,0);
      pages.push({page:n,widthPt:Number(viewport.width.toFixed(2)),heightPt:Number(viewport.height.toFixed(2)),areaSqIn:Number((viewport.width*viewport.height/5184).toFixed(2)),textItems:items.length,characters:chars,words});
    }
    return pages;
  }
  async function pdfJsTextPages(file){
    const pdfjs=requirePdfJs(); const pdf=await pdfjs.getDocument({data:await file.arrayBuffer()}).promise; const pages=[];
    for(let n=1;n<=pdf.numPages;n++){
      const page=await pdf.getPage(n); const viewport=page.getViewport({scale:1}); const content=await page.getTextContent();
      const items=(content.items||[]).map(x=>({text:String(x.str||''),x:Number(x.transform?.[4]||0),y:Number(x.transform?.[5]||0),size:Number(Math.max(Math.abs(x.transform?.[0]||0),Math.abs(x.transform?.[3]||0)).toFixed(2)),width:Number(x.width||0),fontName:String(x.fontName||'')}));
      pages.push({page:n,widthPt:viewport.width,heightPt:viewport.height,text:items.map(x=>x.text).join(' '),items});
    }
    return pages;
  }
  function normalizeFingerprintText(text){return String(text||'').normalize('NFKC').toLowerCase().replace(/\s+/g,' ').replace(/[\u200b-\u200d\ufeff]/g,'').trim();}
  function fnv1a(text){let h=0x811c9dc5;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,0x01000193);}return ('00000000'+(h>>>0).toString(16)).slice(-8);}
  function maskValue(value,type){const v=String(value||'');if(type==='email'){const [a,b='']=v.split('@');return `${a.slice(0,2)}***@${b}`;}if(type==='url'){try{const u=new URL(v);return `${u.protocol}//${u.hostname}/…`;}catch{return v.slice(0,12)+'…';}}const digits=v.replace(/\D/g,'');return digits.length<=4?'****':`${digits.slice(0,2)}***${digits.slice(-2)}`;}
  function luhnLike(value){const d=String(value).replace(/\D/g,'');if(d.length<13||d.length>19)return false;let sum=0,alt=false;for(let i=d.length-1;i>=0;i--){let n=Number(d[i]);if(alt){n*=2;if(n>9)n-=9;}sum+=n;alt=!alt;}return sum%10===0;}
  function tokenizeDocument(text,minLength,ignoreNumbers){const pattern=/[가-힣]{2,}|[A-Za-zÀ-ÿ]{2,}|[一-龥々〆ヵヶ]{1,}|\d+(?:[.,]\d+)*/g;const stop=new Set(['그리고','그러나','또한','대한','위한','에서','으로','에게','the','and','for','with','from','that','this','are','was','were','have','has','pdf','page']);return (String(text||'').match(pattern)||[]).map(x=>x.toLowerCase()).filter(x=>x.length>=minLength&&!stop.has(x)&&!(ignoreNumbers&&/^\d/.test(x)));}

  function jaccardSimilarity(a,b){const A=new Set(tokenizeDocument(a,2,false)),B=new Set(tokenizeDocument(b,2,false));if(!A.size&&!B.size)return 100;let inter=0;A.forEach(x=>{if(B.has(x))inter++;});const union=new Set([...A,...B]).size;return Number((100*inter/Math.max(1,union)).toFixed(1));}
  function estimatePageDpi(pageMetric,res){if(!res||!res.images)return null;const px=Math.max(1,res.images)*1200;const inches=Math.max(pageMetric.widthPt,pageMetric.heightPt)/72;return Math.round(px/Math.max(.1,inches));}
  async function analyzePdfPair(entries,opt){
    if(entries.length!==2)throw new Error('비교할 PDF 파일을 정확히 2개 선택하세요.');
    const a=entries[0].file,b=entries[1].file;const [ap,bp]=await Promise.all([pdfJsTextPages(a),pdfJsTextPages(b)]);const A=ap.map(x=>normalizeFingerprintText(x.text)),B=bp.map(x=>normalizeFingerprintText(x.text));
    const max=Math.max(A.length,B.length),pages=[];let same=0,changed=0,added=0,removed=0;
    for(let i=0;i<max;i++){if(i>=A.length){added++;pages.push({page:i+1,status:'두 번째 문서에만 존재',similarity:0});continue;}if(i>=B.length){removed++;pages.push({page:i+1,status:'첫 번째 문서에만 존재',similarity:0});continue;}const sim=jaccardSimilarity(A[i],B[i]);const status=sim>=99?'동일 추정':sim>=70?'유사하지만 변경':'변경 큼';if(status==='동일 추정')same++;else changed++;pages.push({page:i+1,status,similarity:sim,charsA:A[i].length,charsB:B[i].length});}
    const report={generatedAt:new Date().toISOString(),fileA:{name:a.name,pages:A.length,bytes:a.size},fileB:{name:b.name,pages:B.length,bytes:b.size},summary:`동일 ${same} · 변경 ${changed} · 추가 ${added} · 제거 ${removed}`,counts:{same,changed,added,removed},pages};
    const format=opt.reportFormat||'txt';if(format==='json')return[{name:`${base(a.name)}_vs_${base(b.name)}_diff.json`,blob:new Blob([JSON.stringify(report,null,2)+'\n'],{type:'application/json;charset=utf-8'}),detail:report.summary}];
    const out=['Converter Mall PDF 문서 비교 보고서','==============================',`기준 문서: ${a.name}`,`비교 문서: ${b.name}`,`생성 시각: ${report.generatedAt}`,'','[요약]',report.summary,'','[페이지별 비교]'];pages.forEach(x=>out.push(`${x.page}페이지: ${x.status}${x.similarity!=null?` · 유사도 ${x.similarity}%`:''}`));out.push('','[주의]','이 비교는 추출 가능한 텍스트와 페이지 위치를 기반으로 한 보조 분석입니다. 이미지·도형·레이아웃의 미세한 차이는 별도 시각 비교가 필요합니다.');return[{name:`${base(a.name)}_vs_${base(b.name)}_diff.txt`,blob:new Blob([out.join('\n')+'\n'],{type:'text/plain;charset=utf-8'}),detail:report.summary}];
  }

  async function analyzePdfContent(mode,file,opt){
    const {PDFDocument}=requirePdfLib(); const doc=await PDFDocument.load(await file.arrayBuffer(),{ignoreEncryption:false}); const metrics=await pdfJsPageMetrics(file); const resources=pageResourceStats(doc);
    const common={generatedAt:new Date().toISOString(),file:{name:file.name,size:fmt(file.size),bytes:file.size,pages:doc.getPageCount()}};
    let report={...common}; let suffix='report';
    if(mode==='document-statistics-report'){
      const fonts=listPdfFonts(doc), annotations=listPdfAnnotations(doc), bookmarks=listPdfBookmarks(doc), attachments=listEmbeddedFiles(doc), images=listImageResources(doc), structure=documentStructure(doc);
      const layouts=[...new Set(doc.getPages().map(p=>`${Math.round(p.getWidth())}x${Math.round(p.getHeight())}`))];
      report={...common,summary:`${doc.getPageCount()}페이지 · 글자 ${metrics.reduce((a,p)=>a+p.characters,0).toLocaleString()}자 · 이미지 리소스 ${images.length}개`,statistics:{pages:doc.getPageCount(),layouts:layouts.length,totalCharacters:metrics.reduce((a,p)=>a+p.characters,0),totalWords:metrics.reduce((a,p)=>a+p.words,0),fonts:fonts.length,imageResources:images.length,annotations:annotations.total,bookmarks:bookmarks.length,attachments:attachments.length,formFields:structure.formFields,tagged:structure.tagged},pages:metrics}; suffix='document-statistics';
    }
    if(mode==='text-density-report'){
      const pages=metrics.map(p=>({...p,charactersPerSqIn:Number((p.characters/Math.max(.01,p.areaSqIn)).toFixed(1)),classification:p.characters===0?'텍스트 없음':p.characters<80?'매우 낮음':p.characters<400?'낮음':p.characters<1500?'보통':'높음'}));
      report={...common,pages,totals:{characters:pages.reduce((a,p)=>a+p.characters,0),words:pages.reduce((a,p)=>a+p.words,0),pagesWithoutText:pages.filter(p=>p.characters===0).length},summary:`총 ${pages.reduce((a,p)=>a+p.characters,0).toLocaleString()}자 · 텍스트 없는 페이지 ${pages.filter(p=>p.characters===0).length}개`}; suffix='text-density';
    }
    if(mode==='scan-page-report'){
      const pages=metrics.map((p,i)=>{const r=resources[i]||{};let classification='혼합형';if(p.characters<20&&(r.images||0)>0)classification='스캔형 추정';else if(p.characters>=100&&(r.images||0)===0)classification='텍스트형';else if(p.characters===0&&(r.images||0)===0)classification='빈 페이지 가능';return{...p,images:r.images||0,fonts:r.fonts||0,classification};});
      const counts={}; pages.forEach(p=>counts[p.classification]=(counts[p.classification]||0)+1); report={...common,pages,counts,summary:Object.entries(counts).map(([k,v])=>`${k} ${v}`).join(' · ')}; suffix='scan-page-analysis';
    }
    if(mode==='link-domain-report'){
      const links=extractLinkAnnotations(doc); const domains={};links.forEach(x=>{if(x.domain)domains[x.domain]=(domains[x.domain]||0)+1;}); report={...common,links,domains,summary:`링크 ${links.length}개 · 외부 도메인 ${Object.keys(domains).length}개`}; suffix='link-domains';
    }
    if(mode==='page-complexity-report'){
      const pages=metrics.map((p,i)=>{const r=resources[i]||{};const raw=p.textItems*.08+(r.images||0)*8+(r.fonts||0)*3+(r.formXObjects||0)*7+(r.annotations||0)*4+(r.contentStreams||0)*2;const score=Math.min(100,Math.round(raw));return{page:p.page,score,grade:score<20?'낮음':score<45?'보통':score<70?'높음':'매우 높음',textItems:p.textItems,characters:p.characters,images:r.images||0,fonts:r.fonts||0,formXObjects:r.formXObjects||0,annotations:r.annotations||0,contentStreams:r.contentStreams||0};});
      report={...common,pages:[...pages].sort((a,b)=>b.score-a.score),averageScore:Number((pages.reduce((a,p)=>a+p.score,0)/Math.max(1,pages.length)).toFixed(1)),summary:`평균 복잡도 ${Number((pages.reduce((a,p)=>a+p.score,0)/Math.max(1,pages.length)).toFixed(1))}점 · 최고 ${Math.max(0,...pages.map(p=>p.score))}점`}; suffix='page-complexity';
    }
    if(mode==='keyword-frequency-report'){
      const textPages=await pdfJsTextPages(file); const minLength=Math.max(1,Number(opt.minLength||2)); const topN=Math.max(10,Math.min(200,Number(opt.topN||50))); const ignoreNumbers=opt.ignoreNumbers!==false;
      const map=new Map(); textPages.forEach(p=>{const pageCounts=new Map();tokenizeDocument(p.text,minLength,ignoreNumbers).forEach(w=>pageCounts.set(w,(pageCounts.get(w)||0)+1));pageCounts.forEach((count,word)=>{const row=map.get(word)||{word,count:0,pages:[]};row.count+=count;row.pages.push({page:p.page,count});map.set(word,row);});});
      const keywords=[...map.values()].sort((a,b)=>b.count-a.count||a.word.localeCompare(b.word)).slice(0,topN); report={...common,settings:{minLength,topN,ignoreNumbers},keywords,summary:`핵심어 ${keywords.length}개 · 최다 ${keywords[0]?.word||'없음'} ${keywords[0]?.count||0}회`}; suffix='keyword-frequency';
    }
    if(mode==='sensitive-pattern-report'){
      const textPages=await pdfJsTextPages(file); const patterns=[
        {type:'email',label:'이메일',re:/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi},
        {type:'phone',label:'전화번호',re:/(?:\+?82[- .]?)?(?:0\d{1,2}[- .]?)?\d{3,4}[- .]?\d{4}/g},
        {type:'residentLike',label:'주민등록번호 형태',re:/\b\d{6}[- ]?[1-8]\d{6}\b/g},
        {type:'cardLike',label:'카드번호 후보',re:/\b(?:\d[ -]*?){13,19}\b/g},
        {type:'url',label:'URL',re:/https?:\/\/[^\s<>()]+/gi}
      ]; const findings=[]; const totals={};
      textPages.forEach(p=>patterns.forEach(pt=>{for(const m of p.text.matchAll(pt.re)){const raw=m[0];if(pt.type==='cardLike'&&!luhnLike(raw))continue;totals[pt.label]=(totals[pt.label]||0)+1;findings.push({page:p.page,type:pt.label,sample:maskValue(raw,pt.type)});}}));
      report={...common,totals,findings:findings.slice(0,500),truncated:findings.length>500,summary:`민감 패턴 후보 ${findings.length}개 · 유형 ${Object.keys(totals).length}종`}; suffix='sensitive-patterns';
    }
    if(mode==='language-script-report'){
      const textPages=await pdfJsTextPages(file); const classify=text=>{const c={hangul:0,latin:0,cjk:0,kana:0,digits:0,otherLetters:0};for(const ch of String(text||'')){if(/[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(ch))c.hangul++;else if(/[A-Za-zÀ-ÿ]/.test(ch))c.latin++;else if(/[一-龥々〆ヵヶ]/.test(ch))c.cjk++;else if(/[ぁ-ゟ゠-ヿ]/.test(ch))c.kana++;else if(/\d/.test(ch))c.digits++;else if(/\p{L}/u.test(ch))c.otherLetters++;}const letters=c.hangul+c.latin+c.cjk+c.kana+c.otherLetters;const dominant=[['한글',c.hangul],['라틴 문자',c.latin],['한자',c.cjk],['가나',c.kana],['기타 문자',c.otherLetters]].sort((a,b)=>b[1]-a[1])[0];return{...c,letters,dominant:dominant[1]?dominant[0]:'문자 없음'};};
      const pages=textPages.map(p=>({page:p.page,...classify(p.text)}));const totals=pages.reduce((a,p)=>{for(const k of ['hangul','latin','cjk','kana','digits','otherLetters','letters'])a[k]+=p[k];return a;},{hangul:0,latin:0,cjk:0,kana:0,digits:0,otherLetters:0,letters:0});const dominant=[['한글',totals.hangul],['라틴 문자',totals.latin],['한자',totals.cjk],['가나',totals.kana],['기타 문자',totals.otherLetters]].sort((a,b)=>b[1]-a[1])[0][0];report={...common,pages,totals,dominant,summary:`주요 문자 ${dominant} · 문자 ${totals.letters.toLocaleString()}개`};suffix='language-script';
    }
    if(mode==='duplicate-page-report'){
      const textPages=await pdfJsTextPages(file); const sensitivity=opt.sensitivity||'normal'; const rows=textPages.map((p,i)=>{let normalized=normalizeFingerprintText(p.text);if(sensitivity==='normal')normalized=normalized.replace(/\b\d+\b/g,'#');const r=resources[i]||{};const signature=`${Math.round(p.widthPt)}x${Math.round(p.heightPt)}|${r.images||0}|${r.fonts||0}|${normalized}`;return{page:p.page,characters:normalized.length,hash:fnv1a(signature),signature};});const groups={};rows.forEach(r=>(groups[r.hash]||(groups[r.hash]=[])).push(r.page));const duplicates=Object.entries(groups).filter(([,pages])=>pages.length>1).map(([hash,pages])=>({hash,pages,count:pages.length}));report={...common,sensitivity,duplicates,duplicatePages:duplicates.reduce((a,x)=>a+x.count,0),summary:`중복 후보 그룹 ${duplicates.length}개 · 관련 페이지 ${duplicates.reduce((a,x)=>a+x.count,0)}개`};suffix='duplicate-pages';
    }
    if(mode==='heading-outline-report'){
      const textPages=await pdfJsTextPages(file); const maxItems=Math.max(10,Math.min(300,Number(opt.maxItems||100))); const minChars=Math.max(1,Number(opt.minChars||3)); const allSizes=textPages.flatMap(p=>p.items.filter(x=>x.text.trim()).map(x=>x.size)).filter(x=>x>0).sort((a,b)=>a-b);const median=allSizes[Math.floor(allSizes.length*.5)]||10;const threshold=Math.max(median*1.25,Number(opt.minFontSize||0));const candidates=[];
      textPages.forEach(p=>{const byLine=[];p.items.filter(x=>x.text.trim()).forEach(it=>{let line=byLine.find(l=>Math.abs(l.y-it.y)<2.5);if(!line){line={y:it.y,items:[]};byLine.push(line);}line.items.push(it);});byLine.forEach(line=>{line.items.sort((a,b)=>a.x-b.x);const text=line.items.map(x=>x.text).join(' ').replace(/\s+/g,' ').trim();const size=Math.max(...line.items.map(x=>x.size));if(text.length>=minChars&&text.length<=180&&size>=threshold&&!/[.!?。]$/.test(text))candidates.push({page:p.page,text,size:Number(size.toFixed(1)),level:size>=median*1.8?1:size>=median*1.45?2:3});});});candidates.sort((a,b)=>a.page-b.page||b.size-a.size);report={...common,baselineFontSize:Number(median.toFixed(1)),threshold:Number(threshold.toFixed(1)),candidates:candidates.slice(0,maxItems),truncated:candidates.length>maxItems,summary:`제목 후보 ${Math.min(candidates.length,maxItems)}개 · 본문 기준 ${median.toFixed(1)}pt`};suffix='heading-outline';
    }
    if(mode==='repeated-header-footer-report'){
      const textPages=await pdfJsTextPages(file); const topLines=new Map(), bottomLines=new Map();
      const norm=x=>String(x||'').replace(/\s+/g,' ').replace(/\b\d+\b/g,'#').trim();
      textPages.forEach(p=>{const items=(p.items||[]).filter(x=>x.text&&x.text.trim()); if(!items.length)return; const maxY=Math.max(...items.map(x=>x.y)), minY=Math.min(...items.map(x=>x.y));
        const top=items.filter(x=>x.y>=maxY-40).sort((a,b)=>b.y-a.y||a.x-b.x).map(x=>x.text).join(' '); const bottom=items.filter(x=>x.y<=minY+40).sort((a,b)=>b.y-a.y||a.x-b.x).map(x=>x.text).join(' ');
        if(norm(top).length>2){const k=norm(top); const r=topLines.get(k)||{samples:new Set(),pages:[]};r.samples.add(top.trim());r.pages.push(p.page);topLines.set(k,r);} if(norm(bottom).length>2){const k=norm(bottom); const r=bottomLines.get(k)||{samples:new Set(),pages:[]};r.samples.add(bottom.trim());r.pages.push(p.page);bottomLines.set(k,r);}
      });
      const minRepeat=Math.max(2,Math.ceil(textPages.length*0.3)); const make=m=>[...m.values()].filter(x=>x.pages.length>=minRepeat).map(x=>({text:[...x.samples][0],pages:x.pages,count:x.pages.length})).sort((a,b)=>b.count-a.count);
      const headers=make(topLines),footers=make(bottomLines); report={...common,settings:{minimumRepeatPages:minRepeat},headers,footers,summary:`반복 머리글 후보 ${headers.length}개 · 바닥글 후보 ${footers.length}개`};suffix='repeated-header-footer';
    }
    if(mode==='table-candidate-report'){
      const textPages=await pdfJsTextPages(file); const pages=[];
      textPages.forEach(p=>{const lines=[];(p.items||[]).filter(x=>x.text&&x.text.trim()).forEach(it=>{let line=lines.find(l=>Math.abs(l.y-it.y)<3);if(!line){line={y:it.y,items:[]};lines.push(line);}line.items.push(it);});
        let candidates=0,strong=0;const examples=[];lines.forEach(l=>{l.items.sort((a,b)=>a.x-b.x);const gaps=[];for(let i=1;i<l.items.length;i++)gaps.push(l.items[i].x-(l.items[i-1].x+(l.items[i-1].width||0)));const wide=gaps.filter(g=>g>18).length;if(l.items.length>=3&&wide>=2){candidates++;if(l.items.length>=4&&wide>=3)strong++;if(examples.length<5)examples.push(l.items.map(x=>x.text.trim()).filter(Boolean).join(' | '));}});
        const score=Math.min(100,candidates*12+strong*10);pages.push({page:p.page,candidateRows:candidates,strongRows:strong,score,classification:score>=60?'표 가능성 높음':score>=25?'표 후보':'낮음',examples});
      });report={...common,pages,tableCandidatePages:pages.filter(x=>x.score>=25).length,summary:`표 후보 페이지 ${pages.filter(x=>x.score>=25).length}개 · 가능성 높음 ${pages.filter(x=>x.score>=60).length}개`};suffix='table-candidates';
    }
    if(mode==='numeric-pattern-report'){
      const textPages=await pdfJsTextPages(file);const totals={amount:0,percent:0,number:0,unit:0};const pages=[];const money=/((?:₩|\$|€|¥)\s?[\d,]+(?:\.\d+)?|[\d,]+(?:\.\d+)?\s?(?:원|달러|유로|엔))/g;const percent=/\b\d+(?:\.\d+)?\s?%/g;const unit=/\b\d+(?:\.\d+)?\s?(?:kg|g|mg|km|m|cm|mm|GB|MB|KB|시간|분|초|개|명|건)\b/gi;const number=/\b\d[\d,]*(?:\.\d+)?\b/g;
      textPages.forEach(p=>{const t=p.text||'';const a=[...t.matchAll(money)],pc=[...t.matchAll(percent)],u=[...t.matchAll(unit)],n=[...t.matchAll(number)];totals.amount+=a.length;totals.percent+=pc.length;totals.unit+=u.length;totals.number+=n.length;pages.push({page:p.page,amounts:a.length,percentages:pc.length,units:u.length,numbers:n.length,samples:[...a,...pc,...u].slice(0,8).map(x=>x[0])});});report={...common,totals,pages,summary:`금액 ${totals.amount}개 · 백분율 ${totals.percent}개 · 단위 표현 ${totals.unit}개`};suffix='numeric-patterns';
    }
    if(mode==='date-period-report'){
      const textPages=await pdfJsTextPages(file);const re=/(?:\b\d{4}[.\/-]\d{1,2}[.\/-]\d{1,2}\b|\b\d{4}년\s?\d{1,2}월(?:\s?\d{1,2}일)?|\b\d{1,2}월\s?\d{1,2}일|\b\d{4}[.\/-]\d{1,2}\b|\b\d{1,4}\s?(?:일|주|개월|년)\s?(?:간|이내|이상|미만)?)/g;const findings=[];const counts={};
      textPages.forEach(p=>{for(const m of (p.text||'').matchAll(re)){const value=m[0].trim();findings.push({page:p.page,value});counts[value]=(counts[value]||0)+1;}});const unique=Object.entries(counts).sort((a,b)=>b[1]-a[1]).map(([value,count])=>({value,count}));report={...common,findings:findings.slice(0,1000),unique:unique.slice(0,300),truncated:findings.length>1000,summary:`날짜·기간 표현 ${findings.length}개 · 고유 표현 ${unique.length}개`};suffix='date-periods';
    }
    if(mode==='acronym-term-report'){
      const textPages=await pdfJsTextPages(file);const acronyms=new Map(),definitions=[];const acro=/\b[A-Z][A-Z0-9-]{1,9}\b/g;const def1=/([가-힣A-Za-z][가-힣A-Za-z0-9\s·&/-]{2,50})\s*\(([A-Z][A-Z0-9-]{1,9})\)/g;const def2=/\b([A-Z][A-Z0-9-]{1,9})\s*\(([가-힣A-Za-z][가-힣A-Za-z0-9\s·&/-]{2,50})\)/g;
      textPages.forEach(p=>{const t=p.text||'';for(const m of t.matchAll(acro)){const k=m[0];const r=acronyms.get(k)||{term:k,count:0,pages:new Set()};r.count++;r.pages.add(p.page);acronyms.set(k,r);}for(const m of t.matchAll(def1))definitions.push({page:p.page,term:m[2],meaning:m[1].trim()});for(const m of t.matchAll(def2))definitions.push({page:p.page,term:m[1],meaning:m[2].trim()});});const terms=[...acronyms.values()].map(x=>({term:x.term,count:x.count,pages:[...x.pages]})).sort((a,b)=>b.count-a.count||a.term.localeCompare(b.term)).slice(0,300);report={...common,terms,definitions:definitions.slice(0,300),summary:`약어 후보 ${terms.length}개 · 정의 패턴 ${definitions.length}개`};suffix='acronym-terms';
    }
    if(mode==='page-compare-report'){
      const pages=await pdfJsTextPages(file);const a=Math.max(1,Math.min(pages.length,Number(opt.pageA)||1));const b=Math.max(1,Math.min(pages.length,Number(opt.pageB)||Math.min(2,pages.length)));const pa=pages[a-1],pb=pages[b-1],ra=resources[a-1]||{},rb=resources[b-1]||{};const sim=jaccardSimilarity(pa.text,pb.text);report={...common,pageA:a,pageB:b,similarity:sim,text:{charactersA:normalizeFingerprintText(pa.text).length,charactersB:normalizeFingerprintText(pb.text).length},size:{a:`${Math.round(pa.widthPt)}x${Math.round(pa.heightPt)}`,b:`${Math.round(pb.widthPt)}x${Math.round(pb.heightPt)}`},resources:{a:ra,b:rb},summary:`${a}페이지와 ${b}페이지 텍스트 유사도 ${sim}%`};suffix=`page-${a}-vs-${b}`;
    }
    if(mode==='ocr-readiness-report'){
      const pages=metrics.map((p,i)=>{const r=resources[i]||{};const scan=p.characters<30&&r.images>0;const dpi=estimatePageDpi(p,r);let grade='OCR 불필요 가능';if(scan&&dpi&&dpi<150)grade='낮은 해상도';else if(scan&&dpi&&dpi<300)grade='보통 해상도';else if(scan)grade='OCR 적합 추정';return{page:p.page,characters:p.characters,images:r.images||0,estimatedDpi:dpi,classification:grade};});const need=pages.filter(p=>p.classification!=='OCR 불필요 가능').length;report={...common,pages,summary:`OCR 검토 대상 ${need}페이지 · 전체 ${pages.length}페이지`};suffix='ocr-readiness';
    }
    if(mode==='text-quality-report'){
      const pages=await pdfJsTextPages(file);const rows=pages.map(p=>{const t=p.text||'';const replacement=(t.match(/�/g)||[]).length;const oddSpaces=(t.match(/\s{3,}/g)||[]).length;const tiny=p.items.filter(x=>String(x.text||'').trim().length===1).length;const fragments=p.items.filter(x=>String(x.text||'').trim().length>0&&String(x.text||'').trim().length<=2).length;const score=Math.max(0,100-replacement*15-oddSpaces*3-Math.min(40,tiny)-Math.min(30,Math.floor(fragments/3)));return{page:p.page,score,grade:score>=90?'양호':score>=70?'보통':'점검 필요',replacementCharacters:replacement,longSpaceRuns:oddSpaces,singleCharacterItems:tiny,shortFragments:fragments};});report={...common,pages:rows,averageScore:Number((rows.reduce((a,x)=>a+x.score,0)/Math.max(1,rows.length)).toFixed(1)),summary:`평균 텍스트 품질 ${Number((rows.reduce((a,x)=>a+x.score,0)/Math.max(1,rows.length)).toFixed(1))}점`};suffix='text-quality';
    }
    if(mode==='print-preflight-report'){
      const fonts=listPdfFonts(doc),images=listImageResources(doc),pageSizes=doc.getPages().map((p,i)=>({page:i+1,widthPt:p.getWidth(),heightPt:p.getHeight(),size:pageSizeName(p.getWidth(),p.getHeight())}));
      const profile=opt.profile||'commercial', minPixels=Math.max(300,Number(opt.minPixels||1200)); const unembedded=fonts.filter(f=>!f.embedded); const lowRes=images.filter(x=>Math.min(x.width,x.height)<minPixels); const rgb=images.filter(x=>/RGB/i.test(x.colorSpace)); const risks=[];
      const mixed=new Set(pageSizes.map(x=>`${Math.round(x.widthPt)}x${Math.round(x.heightPt)}`)).size>1;
      if(mixed&&opt.checkUniformSize!==false)risks.push('혼합 페이지 크기'); if(unembedded.length)risks.push(`글꼴 미포함 추정 ${unembedded.length}종`); if(lowRes.length)risks.push(`저해상도 이미지 후보 ${lowRes.length}개`); if(rgb.length&&profile==='commercial'&&opt.warnRgb!==false)risks.push(`RGB 이미지 ${rgb.length}개`);
      report={...common,profile,settings:{minPixels,checkUniformSize:opt.checkUniformSize!==false,warnRgb:opt.warnRgb!==false},pageSizes,fonts:{total:fonts.length,unembedded},images:{total:images.length,lowResolution:lowRes,rgb},risks,summary:risks.length?`점검 항목 ${risks.length}개`:'선택한 프로필의 기초 점검에서 큰 위험 요소 없음'};suffix='print-preflight';
    }
    const format=opt.reportFormat||'txt'; if(format==='json')return[{name:`${base(file.name)}_${suffix}.json`,blob:new Blob([JSON.stringify(report,null,2)+'\n'],{type:'application/json;charset=utf-8'}),detail:report.summary}];
    return[{name:`${base(file.name)}_${suffix}.txt`,blob:new Blob([contentAnalysisToText(mode,report)],{type:'text/plain;charset=utf-8'}),detail:report.summary}];
  }
  function contentAnalysisToText(mode,r){
    const out=['Converter Mall PDF 분석 보고서','==============================',`파일명: ${r.file.name}`,`파일 크기: ${r.file.size}`,`페이지 수: ${r.file.pages}`,`생성 시각: ${r.generatedAt}`,''];
    if(mode==='document-statistics-report'){const x=r.statistics;out.push('[문서 통계]',`페이지: ${x.pages}`,`페이지 레이아웃: ${x.layouts}종`,`추출 글자: ${x.totalCharacters.toLocaleString()}자`,`추출 단어: ${x.totalWords.toLocaleString()}개`,`글꼴: ${x.fonts}종`,`이미지 리소스: ${x.imageResources}개`,`주석: ${x.annotations}개`,`북마크: ${x.bookmarks}개`,`첨부파일: ${x.attachments}개`,`양식 필드: ${x.formFields}개`,`태그 구조: ${x.tagged?'있음':'없음'}`);}
    if(mode==='text-density-report'){out.push('[페이지별 텍스트 밀도]');r.pages.forEach(p=>out.push(`${p.page}페이지: ${p.characters}자 · ${p.words}단어 · ${p.charactersPerSqIn}자/제곱인치 · ${p.classification}`));out.push('',`텍스트 없는 페이지: ${r.totals.pagesWithoutText}개`);}
    if(mode==='scan-page-report'){out.push('[페이지 유형 추정]');r.pages.forEach(p=>out.push(`${p.page}페이지: ${p.classification} · 글자 ${p.characters} · 이미지 ${p.images} · 글꼴 ${p.fonts}`));out.push('','[주의]','페이지 유형은 텍스트 항목과 이미지 리소스를 기반으로 한 추정치이며 OCR 여부를 확정하지 않습니다.');}
    if(mode==='link-domain-report'){out.push('[도메인별 링크]');if(!Object.keys(r.domains).length)out.push('외부 URL 도메인을 찾지 못했습니다.');Object.entries(r.domains).sort((a,b)=>b[1]-a[1]).forEach(([d,c])=>out.push(`${d}: ${c}개`));out.push('','[페이지별 링크]');r.links.forEach((x,i)=>out.push(`${i+1}. ${x.page}페이지 · ${x.uri||'내부 이동 링크'}`));}
    if(mode==='page-complexity-report'){out.push('[복잡도 높은 순]');r.pages.forEach(p=>out.push(`${p.page}페이지: ${p.score}점 (${p.grade}) · 텍스트 항목 ${p.textItems} · 이미지 ${p.images} · 글꼴 ${p.fonts} · Form ${p.formXObjects} · 주석 ${p.annotations}`));out.push('','[주의]','복잡도 점수는 문서 간 절대 성능이 아니라 같은 PDF 안에서 상대적으로 무거운 페이지를 찾기 위한 추정치입니다.');}
    if(mode==='keyword-frequency-report'){out.push('[핵심어 빈도]');r.keywords.forEach((x,i)=>out.push(`${i+1}. ${x.word}: ${x.count}회 · 페이지 ${x.pages.map(p=>p.page).join(',')}`));}
    if(mode==='sensitive-pattern-report'){out.push('[유형별 후보]');if(!Object.keys(r.totals).length)out.push('민감 문자열 패턴 후보를 찾지 못했습니다.');Object.entries(r.totals).forEach(([k,v])=>out.push(`${k}: ${v}개`));out.push('','[페이지별 마스킹 표본]');r.findings.forEach((x,i)=>out.push(`${i+1}. ${x.page}페이지 · ${x.type} · ${x.sample}`));out.push('','[주의]','이 보고서는 정규식 기반 후보 탐지이며 개인정보 존재를 확정하거나 완전 제거하지 않습니다.');}
    if(mode==='language-script-report'){out.push('[전체 문자 구성]',`주요 문자: ${r.dominant}`,`한글: ${r.totals.hangul}`,`라틴 문자: ${r.totals.latin}`,`한자: ${r.totals.cjk}`,`가나: ${r.totals.kana}`,`숫자: ${r.totals.digits}`,`기타 문자: ${r.totals.otherLetters}`,'','[페이지별]');r.pages.forEach(p=>out.push(`${p.page}페이지: ${p.dominant} · 한글 ${p.hangul} · 라틴 ${p.latin} · 한자 ${p.cjk} · 가나 ${p.kana}`));}
    if(mode==='duplicate-page-report'){out.push('[중복 페이지 후보]');if(!r.duplicates.length)out.push('중복 후보를 찾지 못했습니다.');r.duplicates.forEach((x,i)=>out.push(`${i+1}. 페이지 ${x.pages.join(', ')} · 지문 ${x.hash}`));out.push('','[주의]','텍스트와 기본 구조 지문을 비교한 후보 결과입니다. 이미지 전용 페이지는 오탐 가능성이 있습니다.');}
    if(mode==='heading-outline-report'){out.push('[제목·소제목 후보]');if(!r.candidates.length)out.push('설정 기준에 맞는 제목 후보를 찾지 못했습니다.');r.candidates.forEach((x,i)=>out.push(`${i+1}. ${x.page}페이지 · H${x.level} · ${x.size}pt · ${x.text}`));out.push('','[주의]','글자 크기와 줄 배치를 이용한 자동 추정이며 실제 문서 구조 태그와 다를 수 있습니다.');}
    if(mode==='page-compare-report'){out.push('[페이지 비교]',`${r.pageA}페이지 ↔ ${r.pageB}페이지`,`텍스트 유사도: ${r.similarity}%`,`글자 수: ${r.text.charactersA} / ${r.text.charactersB}`,`페이지 크기: ${r.size.a} / ${r.size.b}`,`이미지: ${r.resources.a.images||0} / ${r.resources.b.images||0}`,`글꼴: ${r.resources.a.fonts||0} / ${r.resources.b.fonts||0}`);}
    if(mode==='ocr-readiness-report'){out.push('[OCR 준비 상태]');r.pages.forEach(p=>out.push(`${p.page}페이지: ${p.classification} · 글자 ${p.characters} · 이미지 ${p.images}${p.estimatedDpi?` · 예상 ${p.estimatedDpi} DPI`:''}`));out.push('','[주의]','DPI는 페이지 구조를 이용한 추정값이며 실제 스캔 해상도와 다를 수 있습니다.');}
    if(mode==='text-quality-report'){out.push('[텍스트 품질]');r.pages.forEach(p=>out.push(`${p.page}페이지: ${p.score}점 (${p.grade}) · 대체문자 ${p.replacementCharacters} · 긴 공백 ${p.longSpaceRuns} · 한 글자 조각 ${p.singleCharacterItems}`));}
    if(mode==='print-preflight-report'){out.push('[인쇄 전 점검]');if(!r.risks.length)out.push('기초 검사에서 큰 위험 요소를 찾지 못했습니다.');r.risks.forEach((x,i)=>out.push(`${i+1}. ${x}`));out.push('',`글꼴: ${r.fonts.total}종 · 미포함 추정 ${r.fonts.unembedded.length}종`,`이미지: ${r.images.total}개 · 저해상도 후보 ${r.images.lowResolution.length}개 · RGB ${r.images.rgb.length}개`,'','[주의]','이 결과는 전문 PDF/X 프리플라이트 인증을 대신하지 않습니다.');}
    if(mode==='repeated-header-footer-report'){out.push('[반복 머리글 후보]');if(!r.headers.length)out.push('반복 머리글 후보 없음');r.headers.forEach((x,i)=>out.push(`${i+1}. ${x.text} · ${x.count}페이지 · ${x.pages.join(',')}`));out.push('','[반복 바닥글 후보]');if(!r.footers.length)out.push('반복 바닥글 후보 없음');r.footers.forEach((x,i)=>out.push(`${i+1}. ${x.text} · ${x.count}페이지 · ${x.pages.join(',')}`));out.push('','[주의]','페이지 번호처럼 숫자만 달라지는 문구는 같은 패턴으로 묶일 수 있습니다.');}
    if(mode==='table-candidate-report'){out.push('[페이지별 표 후보]');r.pages.filter(x=>x.score>=25).forEach(x=>{out.push(`${x.page}페이지: ${x.classification} · 점수 ${x.score} · 후보 행 ${x.candidateRows}`);x.examples.forEach(e=>out.push(`  - ${e}`));});if(!r.tableCandidatePages)out.push('표 후보 페이지를 찾지 못했습니다.');out.push('','[주의]','텍스트 좌표 기반 추정이며 이미지로 된 표는 감지되지 않습니다.');}
    if(mode==='numeric-pattern-report'){out.push('[전체 집계]',`금액 ${r.totals.amount}개`,`백분율 ${r.totals.percent}개`,`단위 표현 ${r.totals.unit}개`,`일반 숫자 ${r.totals.number}개`,'','[페이지별]');r.pages.filter(x=>x.amounts+x.percentages+x.units).forEach(x=>out.push(`${x.page}페이지: 금액 ${x.amounts} · 백분율 ${x.percentages} · 단위 ${x.units}${x.samples.length?` · 예: ${x.samples.join(', ')}`:''}`));out.push('','[주의]','숫자 패턴 기반 집계이며 실제 의미나 계산 정확성을 검증하지 않습니다.');}
    if(mode==='date-period-report'){out.push('[날짜·기간 후보]');if(!r.unique.length)out.push('날짜·기간 표현을 찾지 못했습니다.');r.unique.slice(0,100).forEach((x,i)=>out.push(`${i+1}. ${x.value} · ${x.count}회`));out.push('','[주의]','날짜 형식 후보를 찾는 기능이며 실제 유효한 날짜인지 확인하지 않습니다.');}
    if(mode==='acronym-term-report'){out.push('[괄호 정의 후보]');if(!r.definitions.length)out.push('괄호 정의 패턴을 찾지 못했습니다.');r.definitions.forEach((x,i)=>out.push(`${i+1}. ${x.term} = ${x.meaning} · ${x.page}페이지`));out.push('','[반복 약어 후보]');r.terms.slice(0,100).forEach((x,i)=>out.push(`${i+1}. ${x.term} · ${x.count}회 · 페이지 ${x.pages.join(',')}`));out.push('','[주의]','대문자 패턴 기반 후보이므로 제품명·코드·일반 단어가 포함될 수 있습니다.');}
    out.push('','[요약]',r.summary);return out.join('\n')+'\n';
  }

  function buildPdfAnalysisReport(mode,doc,file){
    const common={generatedAt:new Date().toISOString(),file:{name:file.name,size:fmt(file.size),bytes:file.size,pages:doc.getPageCount()}};
    if(mode==='bookmark-report'){const bookmarks=listPdfBookmarks(doc);return{...common,bookmarks,summary:`북마크 ${bookmarks.length}개`};}
    if(mode==='attachment-report'){const attachments=listEmbeddedFiles(doc);return{...common,attachments,totalBytes:attachments.reduce((a,x)=>a+(x.size||0),0),summary:`내장 첨부파일 ${attachments.length}개`};}
    if(mode==='page-resource-report'){const pages=pageResourceStats(doc);const totals=pages.reduce((a,p)=>({fonts:a.fonts+p.fonts,images:a.images+p.images,formXObjects:a.formXObjects+p.formXObjects,annotations:a.annotations+p.annotations,contentStreams:a.contentStreams+p.contentStreams}),{fonts:0,images:0,formXObjects:0,annotations:0,contentStreams:0});return{...common,pages,totals,summary:`${pages.length}페이지 · 이미지 참조 ${totals.images}개 · 글꼴 참조 ${totals.fonts}개`};}
    if(mode==='image-resource-report'){const images=listImageResources(doc);return{...common,images,summary:`고유 이미지 리소스 ${images.length}개`};}
    if(mode==='document-structure-report'){const structure=documentStructure(doc);return{...common,structure,summary:`페이지 ${structure.pageCount} · 북마크 ${structure.bookmarks} · 첨부 ${structure.attachments} · 양식 ${structure.formFields}`};}
    if(mode==='page-size-report'){
      const pages=doc.getPages().map((p,i)=>{const w=p.getWidth(),h=p.getHeight(),rotation=p.getRotation()?.angle||0;return{page:i+1,widthPt:Number(w.toFixed(2)),heightPt:Number(h.toFixed(2)),widthMm:Number((w*25.4/72).toFixed(1)),heightMm:Number((h*25.4/72).toFixed(1)),orientation:w>h?'landscape':'portrait',rotation,estimatedSize:pageSizeName(w,h)};});
      const unique=[...new Set(pages.map(p=>`${p.estimatedSize} ${p.orientation}`))];return{...common,pages,uniqueLayouts:unique,summary:`${pages.length}페이지 · ${unique.length}개 레이아웃`};
    }
    if(mode==='font-report'){const fonts=listPdfFonts(doc);return{...common,fonts,embeddedCount:fonts.filter(x=>x.embedded).length,notEmbeddedCount:fonts.filter(x=>!x.embedded).length,summary:`글꼴 ${fonts.length}종 · 포함 ${fonts.filter(x=>x.embedded).length}종`};}
    if(mode==='annotation-report'){const data=listPdfAnnotations(doc);return{...common,...data,summary:`주석 ${data.total}개 · 유형 ${Object.keys(data.totals).length}종`};}
    if(mode==='form-report'){const fields=listPdfForms(doc);const typeCounts={};fields.forEach(x=>typeCounts[x.type]=(typeCounts[x.type]||0)+1);return{...common,fields,typeCounts,summary:`양식 필드 ${fields.length}개`};}
    const catalog=doc.catalog;let info={};try{info={title:doc.getTitle()||'',author:doc.getAuthor()||'',subject:doc.getSubject()||''};}catch{}
    const lang=pdfValueText(doc,catalog.get(PDFLib.PDFName.of('Lang')));const markInfo=resolvePdfObject(doc,catalog.get(PDFLib.PDFName.of('MarkInfo')));const marked=Boolean(markInfo&&String(resolvePdfObject(doc,markInfo.get(PDFLib.PDFName.of('Marked'))))==='true');const structTree=pdfDictHas(catalog,'StructTreeRoot');const outlines=pdfDictHas(catalog,'Outlines');const displayTitle=(()=>{try{const vp=resolvePdfObject(doc,catalog.get(PDFLib.PDFName.of('ViewerPreferences')));return Boolean(vp&&String(resolvePdfObject(doc,vp.get(PDFLib.PDFName.of('DisplayDocTitle'))))==='true');}catch{return false;}})();
    const checks={documentTitle:Boolean(info.title),documentLanguage:Boolean(lang),taggedStructure:structTree&&marked,markInfoMarked:marked,structTreeRoot:structTree,bookmarks:outlines,displayDocumentTitle:displayTitle};const passed=Object.values(checks).filter(Boolean).length;
    return{...common,document:{...info,language:lang||''},checks,score:{passed,total:Object.keys(checks).length},summary:`기초 점검 ${passed}/${Object.keys(checks).length} 통과`};
  }
  function analysisReportToText(mode,r){
    const head=['Converter Mall PDF 분석 보고서','==============================',`파일명: ${r.file.name}`,`파일 크기: ${r.file.size}`,`페이지 수: ${r.file.pages}`,`생성 시각: ${r.generatedAt}`,''];
    if(mode==='page-size-report'){head.push('[페이지 크기]');r.pages.forEach(p=>head.push(`${p.page}페이지: ${p.widthPt} × ${p.heightPt} pt · ${p.widthMm} × ${p.heightMm} mm · ${p.estimatedSize} · ${p.orientation==='landscape'?'가로':'세로'} · 회전 ${p.rotation}°`));head.push('','[요약]',r.summary);}
    if(mode==='font-report'){head.push('[글꼴]');if(!r.fonts.length)head.push('페이지 리소스에서 글꼴을 찾지 못했습니다.');r.fonts.forEach((f,i)=>head.push(`${i+1}. ${f.name} · ${f.subtype} · ${f.encoding} · ${f.embedded?'파일 포함 가능':'포함 확인 안 됨'} · 페이지 ${f.pages.join(',')}`));head.push('','[주의]','부분 포함 글꼴과 복합 글꼴은 포함 여부가 제한적으로 판정될 수 있습니다.','정확한 인쇄·출판 검증은 전용 preflight 도구가 필요합니다.');}
    if(mode==='annotation-report'){head.push('[유형별 합계]');Object.entries(r.totals).forEach(([k,v])=>head.push(`${k}: ${v}개`));head.push('','[페이지별]');r.pages.filter(p=>p.total).forEach(p=>head.push(`${p.page}페이지: ${p.total}개 · ${Object.entries(p.types).map(([k,v])=>`${k} ${v}`).join(', ')}`));if(!r.total)head.push('주석을 찾지 못했습니다.');}
    if(mode==='form-report'){head.push('[양식 필드]');if(!r.fields.length)head.push('AcroForm 필드를 찾지 못했습니다.');r.fields.forEach((f,i)=>head.push(`${i+1}. ${f.name} · ${f.type} · ${f.readOnly?'읽기 전용':'편집 가능'}${f.value?` · 값: ${f.value}`:''}`));head.push('','[주의]','XFA 및 비표준 양식은 이 보고서에서 완전히 표시되지 않을 수 있습니다.');}
    if(mode==='accessibility-audit'){head.push('[문서 속성]',`제목: ${r.document.title||'없음'}`,`언어: ${r.document.language||'없음'}`,`작성자: ${r.document.author||'없음'}`,'','[기초 검사]');const labels={documentTitle:'문서 제목',documentLanguage:'문서 언어',taggedStructure:'태그 구조',markInfoMarked:'MarkInfo /Marked',structTreeRoot:'StructTreeRoot',bookmarks:'북마크',displayDocumentTitle:'문서 제목 표시 설정'};Object.entries(r.checks).forEach(([k,v])=>head.push(`${v?'통과':'확인 필요'}: ${labels[k]||k}`));head.push('','[판정]',r.summary,'','[주의]','이 검사는 PDF/UA 적합성을 인증하지 않는 기초 점검입니다.','읽기 순서, 대체 텍스트, 표 구조, 색상 대비는 전용 접근성 검사와 수동 검토가 필요합니다.');}
    if(mode==='bookmark-report'){head.push('[북마크 계층]');if(!r.bookmarks.length)head.push('북마크를 찾지 못했습니다.');r.bookmarks.forEach((b,i)=>head.push(`${i+1}. ${'  '.repeat(b.depth)}${b.title}${b.target&&b.target!=='미확인'?` · ${b.target}`:''}`));head.push('','[요약]',r.summary);}
    if(mode==='attachment-report'){head.push('[내장 첨부파일]');if(!r.attachments.length)head.push('내장 첨부파일을 찾지 못했습니다.');r.attachments.forEach((a,i)=>head.push(`${i+1}. ${a.name}${a.size!=null?` · ${fmt(a.size)}`:''}${a.subtype?` · ${a.subtype}`:''}${a.description?` · ${a.description}`:''}`));head.push('','[주의]','첨부파일 존재 여부와 파일 명세를 분석하는 도구이며 악성 여부를 판정하지 않습니다.');}
    if(mode==='page-resource-report'){head.push('[페이지별 리소스]');r.pages.forEach(p=>head.push(`${p.page}페이지: 글꼴 ${p.fonts} · 이미지 ${p.images} · Form XObject ${p.formXObjects} · 주석 ${p.annotations} · 콘텐츠 스트림 ${p.contentStreams}`));head.push('','[합계]',`글꼴 참조 ${r.totals.fonts} · 이미지 참조 ${r.totals.images} · Form XObject ${r.totals.formXObjects} · 주석 ${r.totals.annotations} · 콘텐츠 스트림 ${r.totals.contentStreams}`);}
    if(mode==='image-resource-report'){head.push('[이미지 리소스]');if(!r.images.length)head.push('페이지 리소스에서 래스터 이미지를 찾지 못했습니다.');r.images.forEach((x,i)=>head.push(`${i+1}. ${x.name} · ${x.width}×${x.height} · ${x.bits||'?'}bit · ${x.colorSpace} · ${x.filter} · 페이지 ${x.pages.join(',')}`));head.push('','[주의]','폼 XObject 내부에 중첩된 이미지와 비표준 리소스는 일부 누락될 수 있습니다.');}
    if(mode==='document-structure-report'){const x=r.structure;head.push('[문서 구조]',`카탈로그 키: ${x.catalogKeys.join(', ')||'없음'}`,`문서 언어: ${x.language||'없음'}`,`태그 구조: ${x.tagged?'있음':'없음'}`,`MarkInfo: ${x.markInfo?'있음':'없음'}`,`북마크: ${x.bookmarks}개`,`내장 첨부파일: ${x.attachments}개`,`양식 필드: ${x.formFields}개`,`XFA: ${x.xfa?'감지':'없음'}`,`OpenAction: ${x.openAction?'감지':'없음'}`,`추가 동작(AA): ${x.additionalActions?'감지':'없음'}`,`JavaScript 이름 트리: ${x.javascriptNameTree?'감지':'없음'}`,`EmbeddedFiles 이름 트리: ${x.embeddedFilesNameTree?'감지':'없음'}`,`ViewerPreferences: ${x.viewerPreferenceKeys.join(', ')||'없음'}`,'','[요약]',r.summary);}
    return head.join('\n')+'\n';
  }


  function findContentBounds(canvas,tolerance){
    const ctx=canvas.getContext('2d'),{data}=ctx.getImageData(0,0,canvas.width,canvas.height),w=canvas.width,h=canvas.height;let left=w,right=-1,top=h,bottom=-1;
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4;if(255-Math.min(data[i],data[i+1],data[i+2])>tolerance){if(x<left)left=x;if(x>right)right=x;if(y<top)top=y;if(y>bottom)bottom=y;}}
    return right<left||bottom<top?null:{left,right,top,bottom};
  }
  function whitenLightBackground(ctx,w,h,cutoff){const image=ctx.getImageData(0,0,w,h),d=image.data;for(let i=0;i<d.length;i+=4){if(d[i]>=cutoff&&d[i+1]>=cutoff&&d[i+2]>=cutoff)d[i]=d[i+1]=d[i+2]=255;}ctx.putImageData(image,0,0);}
  function applyBinaryThreshold(ctx,w,h,threshold,despeckle){const image=ctx.getImageData(0,0,w,h),d=image.data,out=new Uint8ClampedArray(d);for(let i=0;i<d.length;i+=4){const v=d[i]<threshold?0:255;out[i]=out[i+1]=out[i+2]=v;out[i+3]=255;}if(despeckle&&w>2&&h>2){const copy=new Uint8ClampedArray(out);for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const i=(y*w+x)*4;if(copy[i]!==0)continue;let black=0;for(let yy=-1;yy<=1;yy++)for(let xx=-1;xx<=1;xx++)if(copy[((y+yy)*w+x+xx)*4]===0)black++;if(black<=2)out[i]=out[i+1]=out[i+2]=255;}}image.data.set(out);ctx.putImageData(image,0,0);}

  function canvasToBlob(canvas, type, quality) {
    return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('이미지 생성 실패')), type, quality));
  }

  function rotateCanvas(source, degreesValue, background) {
    const angle=((degreesValue%360)+360)%360; if (!angle) return source;
    const swap=angle===90||angle===270; const out=document.createElement('canvas'); out.width=swap?source.height:source.width; out.height=swap?source.width:source.height;
    const ctx=out.getContext('2d',{alpha:false}); ctx.fillStyle=background||'#ffffff'; ctx.fillRect(0,0,out.width,out.height); ctx.translate(out.width/2,out.height/2); ctx.rotate(angle*Math.PI/180); ctx.drawImage(source,-source.width/2,-source.height/2); return out;
  }

  function cropWhiteMargins(source, tolerance, background) {
    const ctx=source.getContext('2d'); const {data}=ctx.getImageData(0,0,source.width,source.height); const bg=hexToRgb(background||'#ffffff'); const w=source.width,h=source.height;
    const isBg=(x,y)=>{const i=(y*w+x)*4; return Math.abs(data[i]-bg.r)<=tolerance && Math.abs(data[i+1]-bg.g)<=tolerance && Math.abs(data[i+2]-bg.b)<=tolerance;};
    const rowIsBg=y=>{for(let x=0;x<w;x++) if(!isBg(x,y)) return false; return true;};
    const colIsBg=(x,top,bottom)=>{for(let y=top;y<=bottom;y++) if(!isBg(x,y)) return false; return true;};
    let left=0,right=w-1,top=0,bottom=h-1;
    while(top<bottom && rowIsBg(top)) top++;
    while(bottom>top && rowIsBg(bottom)) bottom--;
    while(left<right && colIsBg(left,top,bottom)) left++;
    while(right>left && colIsBg(right,top,bottom)) right--;
    if(left===0&&right===w-1&&top===0&&bottom===h-1) return source;
    const out=document.createElement('canvas'); out.width=Math.max(1,right-left+1); out.height=Math.max(1,bottom-top+1); out.getContext('2d').drawImage(source,left,top,out.width,out.height,0,0,out.width,out.height); return out;
  }

  function hexToRgb(hex) { const value=String(hex||'#ffffff').replace('#',''); const full=value.length===3?value.split('').map(x=>x+x).join(''):value.padEnd(6,'f'); return {r:parseInt(full.slice(0,2),16),g:parseInt(full.slice(2,4),16),b:parseInt(full.slice(4,6),16)}; }

  function applySharpen(canvas, amount) {
    const ctx=canvas.getContext('2d'); const image=ctx.getImageData(0,0,canvas.width,canvas.height); const src=image.data, out=new Uint8ClampedArray(src); const w=canvas.width,h=canvas.height;
    for(let y=1;y<h-1;y++) for(let x=1;x<w-1;x++) { const i=(y*w+x)*4; for(let c=0;c<3;c++){ const center=src[i+c]*5-src[i-4+c]-src[i+4+c]-src[i-w*4+c]-src[i+w*4+c]; out[i+c]=Math.max(0,Math.min(255,src[i+c]*(1-amount)+center*amount)); }}
    image.data.set(out); ctx.putImageData(image,0,0);
  }

  function extractTextLines(items, opt) {
    const tokens = items.filter(item => String(item.str || '').trim()).map(item => ({ text:String(item.str), x:Number(item.transform?.[4] || 0), y:Number(item.transform?.[5] || 0), w:Number(item.width || 0) }));
    tokens.sort((a,b) => Math.abs(b.y-a.y) > 2 ? b.y-a.y : a.x-b.x);
    const lines=[];
    for (const token of tokens) {
      let line = lines.find(row => Math.abs(row.y-token.y) <= 2.2);
      if (!line) { line={y:token.y,tokens:[]}; lines.push(line); }
      line.tokens.push(token);
    }
    lines.sort((a,b)=>b.y-a.y);
    return lines.map(line => {
      line.tokens.sort((a,b)=>a.x-b.x); let out='', previous=null;
      for (const token of line.tokens) { if (previous && token.x > previous.x + previous.w + 1.5) out += ' '; out += token.text; previous=token; }
      return opt.normalizeSpaces ? out.replace(/[\t ]+/g,' ').trim() : out.trim();
    }).filter(Boolean);
  }
  function removeRepeatedEdges(pages) {
    const normalize = text => String(text||'').toLowerCase().replace(/\d+/g,'#').replace(/\s+/g,' ').trim();
    for (const edge of ['first','last']) {
      const counts=new Map();
      pages.forEach(page=>{const line=edge==='first'?page.lines[0]:page.lines[page.lines.length-1]; if(line){const key=normalize(line); counts.set(key,(counts.get(key)||0)+1);}});
      const repeated=new Set([...counts].filter(([,count])=>count>=Math.ceil(pages.length*.6)).map(([key])=>key));
      pages.forEach(page=>{if(!page.lines.length)return; const index=edge==='first'?0:page.lines.length-1; if(repeated.has(normalize(page.lines[index]))) page.lines.splice(index,1);});
    }
  }
  function normalizeExtractedText(lines, opt) {
    let text = lines.join((opt.layoutMode || 'paragraph') === 'preserve' ? '\n' : ' ');
    if (opt.dehyphenate) text = text.replace(/([A-Za-zÀ-ÿ가-힣])-\s+([A-Za-zÀ-ÿ가-힣])/g,'$1$2');
    if (opt.normalizeSpaces) text = text.replace(/[ \t]+/g,' ').replace(/\n[ \t]+/g,'\n');
    if ((opt.layoutMode || 'paragraph') === 'paragraph') text = text.replace(/\s+/g,' ').trim();
    return text.trim();
  }

  function applyGrayscale(ctx, w, h) { const image = ctx.getImageData(0, 0, w, h); const d = image.data; for (let i = 0; i < d.length; i += 4) { const y = Math.round(d[i] * .2126 + d[i + 1] * .7152 + d[i + 2] * .0722); d[i] = d[i + 1] = d[i + 2] = y; } ctx.putImageData(image, 0, 0); }
  function formatPageNumber(value, style='decimal') {
    const n=Math.max(1,Math.floor(Number(value)||1));
    if(style==='roman-upper'||style==='roman-lower'){
      const pairs=[[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']];let x=n,out='';for(const [v,s] of pairs){while(x>=v){out+=s;x-=v;}}return style==='roman-lower'?out.toLowerCase():out;
    }
    if(style==='alpha-upper'||style==='alpha-lower'){let x=n,out='';while(x>0){x--;out=String.fromCharCode(65+(x%26))+out;x=Math.floor(x/26);}return style==='alpha-lower'?out.toLowerCase():out;}
    return String(n);
  }

  function sanitizeName(name) { return String(name || 'output').trim().replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, ' ').slice(0, 120) || 'output'; }


  function expandImageData(src,w,h){
    const pixels=w*h,out=new Uint8ClampedArray(pixels*4); if(src.length===pixels*3){for(let i=0,j=0;i<pixels;i++,j+=3){out[i*4]=src[j];out[i*4+1]=src[j+1];out[i*4+2]=src[j+2];out[i*4+3]=255;}} else if(src.length===pixels){for(let i=0;i<pixels;i++){out[i*4]=out[i*4+1]=out[i*4+2]=src[i];out[i*4+3]=255;}} return out;
  }

  return { mount };
})();
window.PDFToolApp = PDFToolApp;
