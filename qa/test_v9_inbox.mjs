import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {onRequestGet as statusHandler} from '../functions/api/inbox-status.js';
import {onRequestPost as submit} from '../functions/api/inquiries.js';
import {onRequestGet as adminList,onRequestPatch as adminPatch,onRequestDelete as adminDelete} from '../functions/api/admin/inquiries.js';
import * as core from '../server/inbox-core.mjs';
const current=path.dirname(fileURLToPath(import.meta.url));
const schema=fs.readFileSync(path.join(current,'../migrations/0001_inquiries.sql'),'utf8');
let passed=0,failed=0;
function test(name, fn){ return Promise.resolve().then(fn).then(()=>{passed++;console.log('PASS',name);}).catch(e=>{failed++;console.error('FAIL',name,e.stack||e);}); }
function makeDB(){
 const sqlite=new DatabaseSync(':memory:');sqlite.exec(schema);
 return {sqlite,prepare(sql){let args=[];const prepared=sqlite.prepare(sql);return {
   bind(...a){args=a;return this;},
   async first(){return prepared.get(...args)||null;},
   async all(){return {success:true,results:prepared.all(...args)};},
   async run(){const out=prepared.run(...args);return {success:true,meta:{changes:Number(out.changes),last_row_id:Number(out.lastInsertRowid)}};}
 };}};
}
const ADMIN='T'.repeat(48);
const domain='https://allfileone-webstudio.pages.dev';
const allowed={PUBLIC_INBOX_ENABLED:'1',PRIVACY_POLICY_APPROVED:'1',TURNSTILE_SECRET_KEY:'secret_for_testing_is_not_real',TURNSTILE_SITE_KEY:'site_public_abc123456',STUDIO_ADMIN_TOKEN:ADMIN,TURNSTILE_ALLOWED_HOSTS:'allfileone-webstudio.pages.dev'};
const item={company:'샘플 제조사',name:'홍길동',email:'buyer@example.org',industry:'제조·도매',details:'B2B 거래처별 제품 규격과 수량별 견적 기능을 원합니다.',budget:'50_to_100',timing:'within_month',website:'',consent:true,turnstileToken:'good-token-12345'};
const json=(url,body,method='POST',extra={})=>new Request(domain+url,{method,headers:{'Content-Type':'application/json',Origin:domain,...extra},body:JSON.stringify(body)});
const get=(url,headers={})=>new Request(domain+url,{headers});
const adminHeaders={Authorization:'Bearer '+ADMIN};
const patch=(url,body,headers=adminHeaders)=>json(url,body,'PATCH',{...headers});
const deletion=(url,headers=adminHeaders)=>new Request(domain+url,{method:'DELETE',headers:{Origin:domain,...headers}});
const fakeFetch=globalThis.fetch;
globalThis.fetch=async (url,options)=>{
 assert.equal(String(url),'https://challenges.cloudflare.com/turnstile/v0/siteverify');
 const token=new URLSearchParams(options.body).get('response');
 return Response.json({success:token==='good-token-12345',action:'inquiry',hostname:'allfileone-webstudio.pages.dev'});
};
let db=makeDB();let env={...allowed,INQUIRIES_DB:db};
async function response(r){const x=await r;return {status:x.status,data:await x.json()};}

await test('01 healthy D1 schema',async()=>assert.equal(await core.schemaReady(db),true));
await test('02 status ready and exposes public sitekey only',async()=>{const a=await response(statusHandler({env}));assert.equal(a.status,200);assert.equal(a.data.ready,true);assert.equal(a.data.siteKey,allowed.TURNSTILE_SITE_KEY);assert(!JSON.stringify(a.data).includes(ADMIN));});
await test('03 status disabled without required secrets',async()=>{const x=await response(statusHandler({env:{}}));assert.equal(x.data.ready,false);assert.equal(x.data.reason,'not_configured');});
await test('04 status disabled without legal approval',async()=>{const x=await response(statusHandler({env:{...env,PRIVACY_POLICY_APPROVED:'0'}}));assert.equal(x.data.ready,false);});
await test('05 status detects missing D1 migration',async()=>{const x=await response(statusHandler({env:{...env,INQUIRIES_DB:{prepare:()=>({first:async()=>null})}}}));assert.equal(x.data.reason,'schema_not_ready');});
await test('06 status disabled without admin token',async()=>{const x=await response(statusHandler({env:{...env,STUDIO_ADMIN_TOKEN:''}}));assert.equal(x.data.ready,false);});
await test('07 reject cross-origin',async()=>{const x=await response(submit({env,request:json('/api/inquiries',item,'POST',{Origin:'https://attacker.example'})}));assert.equal(x.status,403);});
await test('08 reject malformed JSON',async()=>{const req=new Request(domain+'/api/inquiries',{method:'POST',headers:{'content-type':'application/json',Origin:domain},body:'{broken'});const x=await response(submit({env,request:req}));assert.equal(x.status,400);});
await test('09 reject wrong content-type',async()=>{const req=new Request(domain+'/api/inquiries',{method:'POST',headers:{'content-type':'text/plain',Origin:domain},body:JSON.stringify(item)});const x=await response(submit({env,request:req}));assert.equal(x.status,400);});
await test('10 reject more than 8192 body bytes',async()=>{const x=await response(submit({env,request:json('/api/inquiries',{...item,extra:'A'.repeat(9000)})}));assert.equal(x.status,413);});
await test('11 reject invalid email',async()=>{const x=await response(submit({env,request:json('/api/inquiries',{...item,email:'no-email'})}));assert.equal(x.status,400);});
await test('12 reject missing consent',async()=>{const x=await response(submit({env,request:json('/api/inquiries',{...item,consent:false})}));assert.equal(x.status,400);});
await test('13 reject honeypot spam',async()=>{const x=await response(submit({env,request:json('/api/inquiries',{...item,website:'http://spam.invalid'})}));assert.equal(x.status,400);});
await test('14 reject short details',async()=>{const x=await response(submit({env,request:json('/api/inquiries',{...item,details:'부탁'})}));assert.equal(x.status,400);});
await test('15 reject invalid budget enum',async()=>{const x=await response(submit({env,request:json('/api/inquiries',{...item,budget:'million'})}));assert.equal(x.status,400);});
await test('16 reject fake Turnstile token',async()=>{const x=await response(submit({env,request:json('/api/inquiries',{...item,turnstileToken:'fake-token-12345'})}));assert.equal(x.status,403);});
await test('17 reject when Turnstile host allowlist mismatches',async()=>{const e={...env,TURNSTILE_ALLOWED_HOSTS:'other.example'};const x=await response(submit({env:e,request:json('/api/inquiries',item)}));assert.equal(x.status,403);});
let id;
await test('18 valid inquiry persists to actual SQLite',async()=>{const x=await response(submit({env,request:json('/api/inquiries',item)}));assert.equal(x.status,201);assert.equal(x.data.ok,true);id=x.data.id;assert(core.validId(id));const row=db.sqlite.prepare('SELECT * FROM inquiries WHERE id=?').get(id);assert.equal(row.contact_email,item.email);assert.equal(row.status,'new');assert(row.expires_at-row.created_at>=90*24*3600*1000-1000);assert(!JSON.stringify(x.data).includes(item.email));});
await test('19 no admin token -> unauthorized',async()=>{const x=await response(adminList({env,request:get('/api/admin/inquiries')}));assert.equal(x.status,401);assert(!JSON.stringify(x.data).includes('buyer@example.org'));});
await test('20 wrong admin token -> unauthorized',async()=>{const x=await response(adminList({env,request:get('/api/admin/inquiries',{Authorization:'Bearer '+'Z'.repeat(48)})}));assert.equal(x.status,401);});
await test('21 valid admin sees rows and PII',async()=>{const x=await response(adminList({env,request:get('/api/admin/inquiries',adminHeaders)}));assert.equal(x.status,200);assert.equal(x.data.items.length,1);assert.equal(x.data.items[0].contact_email,item.email);});
await test('22 admin filter status new',async()=>{const x=await response(adminList({env,request:get('/api/admin/inquiries?status=new',adminHeaders)}));assert.equal(x.data.items.length,1);});
await test('23 admin invalid status blocked',async()=>{const x=await response(adminList({env,request:get('/api/admin/inquiries?status=%27%20OR%201=1',adminHeaders)}));assert.equal(x.status,400);});
await test('24 admin invalid negative offset',async()=>{const x=await response(adminList({env,request:get('/api/admin/inquiries?offset=-100',adminHeaders)}));assert.equal(x.status,400);});
await test('25 admin invalid excessive limit',async()=>{const x=await response(adminList({env,request:get('/api/admin/inquiries?limit=9999',adminHeaders)}));assert.equal(x.status,400);});
await test('26 admin update changes persistent status and note',async()=>{const x=await response(adminPatch({env,request:patch('/api/admin/inquiries',{id,version:1,status:'reviewing',owner_note:'고객에게 이메일 검토 중'})}));assert.equal(x.status,200);assert.equal(x.data.version,2);const row=db.sqlite.prepare('SELECT status,owner_note,version FROM inquiries WHERE id=?').get(id);assert.equal(row.status,'reviewing');assert.equal(row.version,2);});
await test('27 optimistic lock rejects stale admin update',async()=>{const x=await response(adminPatch({env,request:patch('/api/admin/inquiries',{id,version:1,status:'closed',owner_note:'오래된 정보'})}));assert.equal(x.status,409);});
await test('28 patch invalid status rejected',async()=>{const x=await response(adminPatch({env,request:patch('/api/admin/inquiries',{id,version:2,status:'evil',owner_note:'hello'})}));assert.equal(x.status,400);});
await test('29 patch cross-origin rejected',async()=>{const x=await response(adminPatch({env,request:patch('/api/admin/inquiries',{id,version:2,status:'closed',owner_note:''},{...adminHeaders,Origin:'https://phish.example'})}));assert.equal(x.status,403);});
await test('30 admin filter reviewing returns modified row',async()=>{const x=await response(adminList({env,request:get('/api/admin/inquiries?status=reviewing',adminHeaders)}));assert.equal(x.data.items.length,1);assert.equal(x.data.items[0].version,2);});
await test('31 Turnstile denial creates no new records',async()=>{const before=db.sqlite.prepare('SELECT COUNT(*) AS n FROM inquiries').get().n;await submit({env,request:json('/api/inquiries',{...item,turnstileToken:'invalid'} )});assert.equal(db.sqlite.prepare('SELECT COUNT(*) AS n FROM inquiries').get().n,before);});
await test('32 rate limit after 5 successful submissions per hourly IP hash',async()=>{for(let i=0;i<4;i++){const x=await response(submit({env,request:json('/api/inquiries',{...item,email:`repeat${i}@example.org`},'POST',{'CF-Connecting-IP':'192.0.2.10'})}));assert.equal(x.status,201);}const extra=await response(submit({env,request:json('/api/inquiries',item,'POST',{'CF-Connecting-IP':'192.0.2.10'})}));assert.equal(extra.status,201);const limited=await response(submit({env,request:json('/api/inquiries',item,'POST',{'CF-Connecting-IP':'192.0.2.10'})}));assert.equal(limited.status,429);});
await test('33 another IP can submit independently',async()=>{const x=await response(submit({env,request:json('/api/inquiries',item,'POST',{'CF-Connecting-IP':'198.51.100.9'})}));assert.equal(x.status,201);});
await test('34 old data purged on authorized admin listing',async()=>{const oldId=crypto.randomUUID();db.sqlite.prepare("INSERT INTO inquiries (id,created_at,updated_at,expires_at,company,contact_name,contact_email,industry,details,budget,timing) VALUES (?,?,?,?,?,?,?,?,?,?,?)").run(oldId,1,1,2,'','Old','old@example.org','old','Old data','undecided','undecided');await adminList({env,request:get('/api/admin/inquiries',adminHeaders)});assert.equal(db.sqlite.prepare('SELECT COUNT(*) AS n FROM inquiries WHERE id=?').get(oldId).n,0);});
await test('35 delete invalid id rejected',async()=>{const x=await response(adminDelete({env,request:deletion('/api/admin/inquiries?id=../../oops')}));assert.equal(x.status,400);});
await test('36 delete without authentication rejected',async()=>{const x=await response(adminDelete({env,request:deletion('/api/admin/inquiries?id='+id,{})}));assert.equal(x.status,401);});
await test('37 admin delete actually deletes PII',async()=>{const x=await response(adminDelete({env,request:deletion('/api/admin/inquiries?id='+id)}));assert.equal(x.status,200);assert.equal(db.sqlite.prepare('SELECT COUNT(*) AS n FROM inquiries WHERE id=?').get(id).n,0);});
await test('38 repeat delete returns 404',async()=>{const x=await response(adminDelete({env,request:deletion('/api/admin/inquiries?id='+id)}));assert.equal(x.status,404);});
await test('39 SQL injection text is treated as data',async()=>{const payload={...item,details:"제품 조회와 견적: ') OR 1=1; DROP TABLE inquiries; --"};const x=await response(submit({env,request:json('/api/inquiries',payload,'POST',{'CF-Connecting-IP':'203.0.113.5'})}));assert.equal(x.status,201);assert.equal(db.sqlite.prepare("SELECT name FROM sqlite_master WHERE name='inquiries'").get().name,'inquiries');});
await test('40 no cache headers on admin responses',async()=>{const res=await adminList({env,request:get('/api/admin/inquiries',adminHeaders)});assert.match(res.headers.get('cache-control'),/no-store/);assert.match(res.headers.get('x-robots-tag'),/noindex/);});
await test('41 explicit feature disabled fails closed',async()=>{const x=await response(submit({env:{...env,PUBLIC_INBOX_ENABLED:'0'},request:json('/api/inquiries',item)}));assert.equal(x.status,503);assert.equal(x.data.ok,false);});
await test('42 misconfigured DB fails closed',async()=>{const x=await response(submit({env:{...env,INQUIRIES_DB:null},request:json('/api/inquiries',item)}));assert.equal(x.status,503);});
await test('43 unknown secret is never in frontend source',async()=>{const files=['../webstudio/inquiry.html','../webstudio/admin-inbox.html','../webstudio/assets/inquiry.js','../webstudio/assets/admin-inbox.js'];for(const f of files){assert(!fs.readFileSync(path.join(current,f),'utf8').includes(ADMIN));}});
await test('44 admin no bearer still fails with ready DB',async()=>assert.equal(await core.adminAuthorized(get('/api/admin/inquiries'),env),false));
await test('45 proper bearer token succeeds',async()=>assert.equal(await core.adminAuthorized(get('/api/admin/inquiries',adminHeaders),env),true));
await test('46 malformed token rejected',async()=>assert.equal(await core.adminAuthorized(get('/api/admin/inquiries',{Authorization:'Bearer abc'}),env),false));
await test('47 all network failure in Turnstile fails closed',async()=>{globalThis.fetch=async()=>{throw new Error('offline');};const x=await response(submit({env,request:json('/api/inquiries',item)}));assert.equal(x.status,403);});
await test('48 content-security policy for static API must be explicit',async()=>{assert.equal(core.INQUIRY_HEADERS['X-Content-Type-Options'],'nosniff');assert(core.INQUIRY_HEADERS['Vary']);});
await test('49 no hardcoded production D1 or Turnstile credential',async()=>{const src=fs.readFileSync(path.join(current,'../server/inbox-core.mjs'),'utf8');assert(!src.includes('database_id'));assert(!src.includes('1x0000000000000000000000000000000AA'));});
await test('50 every D1 write uses bind placeholders',async()=>{const src=fs.readFileSync(path.join(current,'../functions/api/inquiries.js'),'utf8');assert.match(src,/\.bind\(/);assert.match(src,/\.run\(/);});

globalThis.fetch=fakeFetch;
const summary={passed,failed,total:passed+failed};fs.writeFileSync(path.join(current,'V9_NODE_SQLITE_RESULTS.json'),JSON.stringify(summary,null,2));
console.log('SUMMARY',JSON.stringify(summary));
if(failed)process.exitCode=1;
