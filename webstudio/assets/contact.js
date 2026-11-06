'use strict';
document.getElementById('copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(document.getElementById('address').textContent);document.getElementById('status').textContent='이메일 주소가 복사됐습니다.'}catch{document.getElementById('status').textContent='주소를 직접 선택해 복사해 주세요.'}})
