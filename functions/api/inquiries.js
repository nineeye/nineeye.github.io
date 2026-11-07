import {reply,failure,configured,schemaReady,sameOrigin,bodyJson,validateInquiry,verifyTurnstile,limitSubmission,purgeExpired,NINETY_DAYS_MS} from '../../server/inbox-core.mjs';
export async function onRequestPost({request,env}) {
  if(!configured(env))return failure('INBOX_DISABLED',503);
  if(!sameOrigin(request))return failure('ORIGIN_MISMATCH',403);
  if(!await schemaReady(env.INQUIRIES_DB))return failure('SCHEMA_NOT_READY',503);
  let data;
  try {data=validateInquiry(await bodyJson(request));}
  catch(error){return failure(error.message==='TOO_LARGE'?'PAYLOAD_TOO_LARGE':'INVALID_INPUT',error.message==='TOO_LARGE'?413:400);}
  if(!await verifyTurnstile({token:data.turnstileToken,env,request}))return failure('BOT_CHECK_FAILED',403);
  try {
    const now=Date.now();
    if(!await limitSubmission(env.INQUIRIES_DB,request,env,now))return failure('RATE_LIMITED',429);
    const id=crypto.randomUUID();
    const result=await env.INQUIRIES_DB.prepare(`INSERT INTO inquiries
      (id,created_at,updated_at,expires_at,company,contact_name,contact_email,industry,details,budget,timing,status,version)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,'new',1)`)
      .bind(id,now,now,now+NINETY_DAYS_MS,data.company,data.name,data.email,data.industry,data.details,data.budget,data.timing).run();
    if(result?.success===false)throw new Error('D1_INSERT_ERROR');
    // No PII or Turnstile token in the public response.
    return reply({ok:true,id,receivedAt:new Date(now).toISOString()},201);
  } catch {return failure('SERVICE_UNAVAILABLE',503);}
}
// Reject GET/PUT/etc rather than silently routing them to a static fallback.
export function onRequest() {return failure('METHOD_NOT_ALLOWED',405);}
