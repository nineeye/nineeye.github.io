import {reply,configured,schemaReady} from '../../server/inbox-core.mjs';
export async function onRequestGet({env}) {
  if(!configured(env))return reply({ready:false,reason:'not_configured'});
  if(!await schemaReady(env.INQUIRIES_DB))return reply({ready:false,reason:'schema_not_ready'});
  return reply({ready:true,siteKey:env.TURNSTILE_SITE_KEY,retentionDays:90});
}
export function onRequest() {return reply({ok:false,code:'METHOD_NOT_ALLOWED'},405);}
