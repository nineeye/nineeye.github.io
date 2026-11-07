import {reply,failure,adminConfigured,adminAuthorized,schemaReady,bodyJson,parseLimit,cleanStatus,validId,purgeExpired,sameOrigin} from '../../../server/inbox-core.mjs';
async function check(ctx, mutates=false){
 if(!adminConfigured(ctx.env))return failure('INBOX_DISABLED',503);
 if(mutates&&!sameOrigin(ctx.request))return failure('ORIGIN_MISMATCH',403);
 if(!await adminAuthorized(ctx.request,ctx.env))return failure('UNAUTHORIZED',401);
 if(!await schemaReady(ctx.env.INQUIRIES_DB))return failure('SCHEMA_NOT_READY',503);
 return null;
}
export async function onRequestGet(ctx){
 const fail=await check(ctx);if(fail)return fail;
 try {
   const url=new URL(ctx.request.url);
   const status=url.searchParams.get('status')||'all';
   if(status!=='all')cleanStatus(status);
   const limit=parseLimit(url.searchParams.get('limit'),30,50);
   const offset=Number(url.searchParams.get('offset')||'0');
   if(!Number.isInteger(offset)||offset<0||offset>10000)return failure('INVALID_PAGE',400);
   const db=ctx.env.INQUIRIES_DB;const now=Date.now();
   await purgeExpired(db,now);
   const stmt=db.prepare(`SELECT id,created_at,updated_at,company,contact_name,contact_email,industry,
      details,budget,timing,status,owner_note,version FROM inquiries
      WHERE expires_at>? AND (?='all' OR status=?) ORDER BY created_at DESC LIMIT ? OFFSET ?`)
      .bind(now,status,status,limit,offset);
   const r=await stmt.all();
   if(r?.success===false)throw new Error('DB_LIST_ERROR');
   return reply({ok:true,items:r.results||[],nextOffset:(r.results||[]).length===limit?offset+limit:null});
 }catch(e){return failure(['BAD_LIMIT','BAD_STATUS'].includes(e.message)?'INVALID_FILTER':'SERVICE_UNAVAILABLE', ['BAD_LIMIT','BAD_STATUS'].includes(e.message)?400:503);}
}
export async function onRequestPatch(ctx){
 const fail=await check(ctx,true);if(fail)return fail;
 let p;
 try{p=await bodyJson(ctx.request);}catch{return failure('INVALID_JSON',400);}
 if(!validId(p?.id)||!Number.isInteger(p?.version)||p.version<1||p.version>1000000
   || typeof p?.owner_note!=='string'||p.owner_note.length>1000)return failure('INVALID_INPUT',400);
 let status;try{status=cleanStatus(p.status);}catch{return failure('INVALID_STATUS',400);}
 try{
  const db=ctx.env.INQUIRIES_DB;
  const r=await db.prepare(`UPDATE inquiries SET status=?,owner_note=?,updated_at=?,version=version+1
     WHERE id=? AND version=? AND expires_at>?`).bind(status,p.owner_note.trim(),Date.now(),p.id,p.version,Date.now()).run();
  if(!r?.meta?.changes)return failure('CONFLICT_OR_NOT_FOUND',409);
  return reply({ok:true,id:p.id,version:p.version+1});
 }catch{return failure('SERVICE_UNAVAILABLE',503);}
}
export async function onRequestDelete(ctx){
 const fail=await check(ctx,true);if(fail)return fail;
 const id=new URL(ctx.request.url).searchParams.get('id');
 if(!validId(id))return failure('INVALID_ID',400);
 try{
  const r=await ctx.env.INQUIRIES_DB.prepare('DELETE FROM inquiries WHERE id=?').bind(id).run();
  if(!r?.meta?.changes)return failure('NOT_FOUND',404);
  return reply({ok:true,deletedId:id});
 }catch{return failure('SERVICE_UNAVAILABLE',503);}
}
export function onRequest() {return failure('METHOD_NOT_ALLOWED',405);}
