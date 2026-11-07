// Allfileone Web Studio V9 — shared, dependency-free Cloudflare Pages Functions logic.
// This source never hardcodes admin tokens, DB identifiers, or Turnstile secrets.
const enc = new TextEncoder();
const PRIVATE_HEADERS = Object.freeze({
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store, private, max-age=0',
  'Pragma': 'no-cache',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'X-Robots-Tag': 'noindex, nofollow',
  'Vary': 'Authorization',
});
export const STATES = Object.freeze(['new', 'reviewing', 'quoted', 'closed']);
const BUDGETS = Object.freeze(['undecided', 'under_50', '50_to_100', '100_to_300', '300_plus']);
const TIMINGS = Object.freeze(['undecided', 'asap', 'within_month', 'later']);
const MAX_REQUEST_BYTES = 8192;
const NINETY_DAYS = 90 * 24 * 3600 * 1000;

export function reply(payload, status=200) {
  return new Response(JSON.stringify(payload), {status, headers: PRIVATE_HEADERS});
}
export function failure(code, status=400) {return reply({ok:false, code}, status);}
export function configured(env) {
  return !!(env?.PUBLIC_INBOX_ENABLED === '1' && env?.PRIVACY_POLICY_APPROVED === '1'
     && env?.INQUIRIES_DB?.prepare && typeof env?.TURNSTILE_SECRET_KEY === 'string'
     && env.TURNSTILE_SECRET_KEY.length >= 12
     && typeof env?.TURNSTILE_SITE_KEY === 'string' && env.TURNSTILE_SITE_KEY.length >= 12
     && typeof env?.STUDIO_ADMIN_TOKEN === 'string' && env.STUDIO_ADMIN_TOKEN.length >= 43);
}
export function adminConfigured(env) {
  return !!(env?.INQUIRIES_DB?.prepare && typeof env?.STUDIO_ADMIN_TOKEN === 'string'
    && env.STUDIO_ADMIN_TOKEN.length >= 43);
}
export async function schemaReady(db) {
  try {
    const row = await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='inquiries'").first();
    const rate = await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='inbox_rate_limits'").first();
    return !!(row?.name === 'inquiries' && rate?.name === 'inbox_rate_limits');
  } catch {return false;}
}
export function sameOrigin(request) {
  try {
    const origin = request.headers.get('Origin');
    return !origin || origin === new URL(request.url).origin;
  } catch {return false;}
}
async function bodyJson(request) {
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type')||'')) throw new Error('CONTENT_TYPE');
  const rawLength = Number(request.headers.get('content-length') || 0);
  if (rawLength > MAX_REQUEST_BYTES) throw new Error('TOO_LARGE');
  if (!request.body) throw new Error('EMPTY_BODY');
  const reader = request.body.getReader();
  const parts=[]; let sum=0;
  try {
    while(true){
      const {done,value}=await reader.read(); if(done) break;
      sum+=value.byteLength;
      if(sum > MAX_REQUEST_BYTES){await reader.cancel();throw new Error('TOO_LARGE');}
      parts.push(value);
    }
    const bytes = new Uint8Array(sum); let offset=0;
    for(const part of parts){bytes.set(part,offset);offset+=part.length;}
    return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
  } catch (error) {
    if (error.message === 'TOO_LARGE') throw error;
    throw new Error('INVALID_JSON');
  }
}
export {bodyJson};
function field(value, max, required=false) {
  if(typeof value!=='string') throw new Error('INVALID_FIELDS');
  const s=value.trim().replace(/\r\n?/g,'\n');
  if((required&&!s) || s.length>max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(s)) throw new Error('INVALID_FIELDS');
  return s;
}
export function validateInquiry(p) {
  if(!p || typeof p !== 'object' || Array.isArray(p)) throw new Error('INVALID_FIELDS');
  const data={
    company:field(p.company??'',80),
    name:field(p.name,60,true),
    email:field(p.email,254,true),
    industry:field(p.industry,70,true),
    details:field(p.details,2000,true),
    budget:field(p.budget,30,true),
    timing:field(p.timing,30,true),
    website:field(p.website??'',80)
  };
  if(data.details.length<20 || !/^[^\s@<>]{1,64}@[^\s@<>]{1,190}\.[^\s@<>]{2,24}$/.test(data.email)
    || !BUDGETS.includes(data.budget) || !TIMINGS.includes(data.timing)
    || !/^.{1,70}$/u.test(data.industry) || !p.consent || p.consent !== true || data.website) {
    throw new Error('INVALID_FIELDS');
  }
  const token=field(p.turnstileToken,2048,true);
  if(token.length<10) throw new Error('INVALID_FIELDS');
  return {...data,turnstileToken:token};
}
export async function verifyTurnstile({token,env,request}) {
  try {
    const payload=new URLSearchParams({secret:env.TURNSTILE_SECRET_KEY,response:token});
    const response=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{
      method:'POST',body:payload,signal:AbortSignal.timeout(5000)
    });
    if(!response.ok) return false;
    const result=await response.json();
    const hostname=String(result.hostname||'').toLowerCase();
    const requestedHost=new URL(request.url).hostname.toLowerCase();
    const allowed=(env.TURNSTILE_ALLOWED_HOSTS || '').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);
    return result.success===true && result.action==='inquiry' && hostname===requestedHost
      && (!allowed.length || allowed.includes(hostname));
  } catch {return false;}
}
async function sha(value) {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(value)));
}
export async function adminAuthorized(request,env) {
  if(!adminConfigured(env))return false;
  const match=/^Bearer ([A-Za-z0-9_-]{43,256})$/.exec(request.headers.get('Authorization')||'');
  const given=match?.[1] || 'invalid-admin-token-placeholder';
  const [a,b]=await Promise.all([sha(given),sha(env.STUDIO_ADMIN_TOKEN)]);
  let diff=0; for(let i=0;i<32;i++) diff|=a[i]^b[i];
  return !!match && diff===0;
}
export async function limitSubmission(db,request,env,now=Date.now()) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const bucket=Math.floor(now/3600000);
  const hash=await sha(`${env.STUDIO_ADMIN_TOKEN}:${ip}:${bucket}`);
  const key=Array.from(hash).map(b=>b.toString(16).padStart(2,'0')).join('');
  const res=await db.prepare(`INSERT INTO inbox_rate_limits(key_hash,bucket_hour,hits)
     VALUES (?,?,1) ON CONFLICT(key_hash,bucket_hour) DO UPDATE SET hits=hits+1 WHERE hits<5`)
    .bind(key,bucket).run();
  return (res?.meta?.changes || 0)>0;
}
export async function purgeExpired(db,now=Date.now()) {
  await db.prepare('DELETE FROM inquiries WHERE expires_at <= ?').bind(now).run();
  // remove counters for prior hours; not a promise of independent scheduled deletion.
  await db.prepare('DELETE FROM inbox_rate_limits WHERE bucket_hour < ?').bind(Math.floor(now/3600000)-1).run();
}
export function parseLimit(raw, fallback=30,max=50) {
  const n=Number(raw??fallback); if(!Number.isInteger(n)||n<1||n>max)throw new Error('BAD_LIMIT');return n;
}
export function cleanStatus(s){if(!STATES.includes(s))throw new Error('BAD_STATUS');return s;}
export function validId(s){return typeof s==='string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);}
export const INQUIRY_HEADERS=PRIVATE_HEADERS;
export const NINETY_DAYS_MS=NINETY_DAYS;
