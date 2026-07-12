// assets/js/pdf-word.js

// ===============================
// PDF → WORD
// ===============================

const dropBox=document.getElementById("dropBox");

const convertBtn=document.getElementById("convertBtn");

const result=document.getElementById("downloadResult");

const fileInput=document.createElement("input");

fileInput.type="file";

fileInput.accept=".pdf";

fileInput.hidden=true;

document.body.appendChild(fileInput);

let currentFile=null;

// ===============================

dropBox.addEventListener("click",()=>{

fileInput.click();

});

// ===============================

fileInput.addEventListener("change",()=>{

if(fileInput.files.length){

currentFile=fileInput.files[0];

showSelected();

}

});

// ===============================

["dragenter","dragover"].forEach(event=>{

dropBox.addEventListener(event,e=>{

e.preventDefault();

dropBox.classList.add("dragging");

});

});

["dragleave","drop"].forEach(event=>{

dropBox.addEventListener(event,e=>{

e.preventDefault();

dropBox.classList.remove("dragging");

});

});

dropBox.addEventListener("drop",e=>{

const files=e.dataTransfer.files;

if(!files.length)return;

currentFile=files[0];

showSelected();

});

// ===============================

function showSelected(){

dropBox.innerHTML=`

<div class="drop-icon">

✅

</div>

<h2>

${currentFile.name}

</h2>

<p>

${(currentFile.size/1024/1024).toFixed(2)} MB

</p>

`;

}

// ===============================

convertBtn.addEventListener("click",async()=>{

if(!currentFile){

alert("PDF 파일을 선택하세요.");

return;

}

convertBtn.disabled=true;

convertBtn.innerHTML="변환 중...";

await convertPDF();

});

// ===============================

async function convertPDF(){

try{

const arrayBuffer=

await currentFile.arrayBuffer();

const pdf=

await pdfjsLib.getDocument({

data:arrayBuffer

}).promise;

let text="";

for(

let page=1;

page<=pdf.numPages;

page++

){

const p=

await pdf.getPage(page);

const content=

await p.getTextContent();

content.items.forEach(item=>{

text+=item.str+" ";

});

text+="\n\n";

}

downloadWord(text);

}

catch(e){

console.error(e);

alert("변환 실패");

convertBtn.disabled=false;

convertBtn.innerHTML="변환 시작";

}

}

// ===============================

function downloadWord(text){

const blob=new Blob(

[text],

{

type:

"application/msword"

}

);

const url=

URL.createObjectURL(blob);

result.innerHTML=`

<h2>

변환 완료

</h2>

<a

href="${url}"

download="${currentFile.name.replace('.pdf','.doc')}"

class="download-btn"

>

⬇ Word 다운로드

</a>

`;

convertBtn.disabled=false;

convertBtn.innerHTML="변환 시작";

}