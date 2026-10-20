// Run against a DISPOSABLE test project with three real test accounts.
// deno test --allow-env --allow-net tests/booking.integration.test.ts
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { assert, assertEquals } from 'jsr:@std/assert@1';
const env=(name:string)=>Deno.env.get(name)??'';
const configured=['TEST_BACKEND_URL','TEST_ANON_KEY','TEST_MERCHANT_EMAIL','TEST_MERCHANT_PASSWORD','TEST_DRIVER_A_EMAIL','TEST_DRIVER_A_PASSWORD','TEST_DRIVER_B_EMAIL','TEST_DRIVER_B_PASSWORD'].every((key)=>!!env(key));
const sleep=(ms:number)=>new Promise((resolve)=>setTimeout(resolve,ms));
async function login(prefix:string,role:string):Promise<SupabaseClient> {
  const client=createClient(env('TEST_BACKEND_URL'),env('TEST_ANON_KEY'),{auth:{persistSession:false,autoRefreshToken:false}});
  const result=await client.auth.signInWithPassword({email:env(`TEST_${prefix}_EMAIL`),password:env(`TEST_${prefix}_PASSWORD`)});
  if(result.error)throw result.error;
  assert(result.data.user);
  const setup=await client.rpc('bazgo_setup_account',{p_role:role,p_name:`Integration ${prefix}`,p_profile:{}});
  if(setup.error)throw setup.error;
  return client;
}
async function rpc(client:SupabaseClient,name:string,args:Record<string,unknown>={}) {
  const {data,error}=await client.rpc(name,args);
  if(error)throw error;
  if(data?.error)throw new Error(data.error);
  return data;
}
async function createLoad(merchant:SupabaseClient) {
  return await rpc(merchant,'bazgo_create_load',{p_payload:{pickupProvince:'بغداد',deliveryProvince:'البصرة',pickupAddress:'TEST ONLY',deliveryAddress:'TEST ONLY',weightTons:5,cargoType:'Integration test',vehicleType:'truck25',priceIQD:100000,pickupDate:new Date().toISOString(),cargoImage:'',notes:`TEST ONLY ${crypto.randomUUID()}`,pickupArea:'',deliveryArea:'',cargoDescription:'Disposable test fixture',distanceKm:500}}) as string;
}
async function expectDenied(client:SupabaseClient,id:string,action:string,value:Record<string,unknown>={}) {
  const response=await client.rpc('bazgo_negotiation_action',{p_id:id,p_action:action,p_value:value});
  assert(!!response.error||!!response.data?.error,`Expected ${action} to be rejected`);
}
async function initialize(merchant:SupabaseClient) {
  const {data,error}=await merchant.functions.invoke('bazgo-scheduler',{body:{}});
  if(error)throw error;
  assertEquals(data?.ready,true,'Autonomous expiry must be configured before any booking test');
}
Deno.test({name:'Secure booking: concurrent acceptance, cancellation, confirmation, chat, delivery and optional ratings',ignore:!configured,fn:async()=>{
  const merchant=await login('MERCHANT','merchant');
  const a=await login('DRIVER_A','driver');
  const b=await login('DRIVER_B','driver');
  await initialize(merchant);
  const loadId=await createLoad(merchant);
  // Genuine concurrent network requests from different authenticated driver identities.
  const attempts=await Promise.all([a,b].map((client)=>client.rpc('bazgo_reserve_load',{p_load_id:loadId})));
  assertEquals(attempts.filter((result)=>!result.error).length,1);
  const winnerIndex=attempts.findIndex((result)=>!result.error);
  const winner=[a,b][winnerIndex],loser=[a,b][1-winnerIndex];
  const negotiation=attempts[winnerIndex].data;
  const retry=await rpc(winner,'bazgo_reserve_load',{p_load_id:loadId});
  assertEquals(retry.id,negotiation.id,'Reservation retries must reuse one negotiation');
  const minutes=(new Date(negotiation.expires_at).getTime()-new Date(negotiation.created_at).getTime())/60000;
  assert(minutes>=14.9&&minutes<=15.1,'Server must start a 15-minute window');
  await expectDenied(loser,negotiation.id,'cancel');
  await expectDenied(winner,negotiation.id,'confirm',{price:100000});
  await expectDenied(merchant,negotiation.id,'confirm',{price:100000});
  await expectDenied(winner,negotiation.id,'rate',{stars:5});
  await rpc(winner,'bazgo_negotiation_action',{p_id:negotiation.id,p_action:'cancel'});
  const available=await rpc(merchant,'bazgo_snapshot');
  assertEquals(available.loads.find((l:any)=>l.id===loadId).status,'available');
  assert(available.notifications.some((n:any)=>n.negotiation_id===negotiation.id&&n.title.includes('إلغاء')));
  // The previously losing driver can acquire a newly released load.
  const newNegotiation=await rpc(loser,'bazgo_reserve_load',{p_load_id:loadId});
  await expectDenied(winner,newNegotiation.id,'message',{kind:'text',text:'intrusion',clientId:crypto.randomUUID()});
  await expectDenied(loser,negotiation.id,'confirm',{price:100000});
  await rpc(loser,'bazgo_negotiation_action',{p_id:newNegotiation.id,p_action:'propose',p_value:{price:120000}});
  await expectDenied(merchant,newNegotiation.id,'confirm',{price:100000});
  const messageId=crypto.randomUUID();
  const message={p_id:newNegotiation.id,p_action:'message',p_value:{kind:'text',text:'Agreed price: 120000 IQD',clientId:messageId}};
  await rpc(loser,'bazgo_negotiation_action',message);await rpc(loser,'bazgo_negotiation_action',message);
  const chat=await rpc(merchant,'bazgo_snapshot');
  assertEquals(chat.messages.filter((m:any)=>m.negotiation_id===newNegotiation.id).length,1,'Retry must not duplicate a message');
  await expectDenied(loser,newNegotiation.id,'message',{kind:'voice',audioPath:'forged/attachment.m4a',durationMs:1000,clientId:crypto.randomUUID()});
  await rpc(merchant,'bazgo_negotiation_action',{p_id:newNegotiation.id,p_action:'confirm',p_value:{price:120000}});
  const booked=await rpc(merchant,'bazgo_snapshot');
  assertEquals(booked.loads.find((l:any)=>l.id===loadId).status,'confirmed');
  assertEquals(Number(booked.negotiations.find((n:any)=>n.id===newNegotiation.id).agreed_price),120000);
  const blocked=await winner.rpc('bazgo_reserve_load',{p_load_id:loadId});assert(blocked.error);
  await expectDenied(loser,newNegotiation.id,'cancel');
  await expectDenied(merchant,newNegotiation.id,'start');
  await rpc(loser,'bazgo_negotiation_action',{p_id:newNegotiation.id,p_action:'start'});
  await expectDenied(loser,newNegotiation.id,'deliver');
  await rpc(merchant,'bazgo_negotiation_action',{p_id:newNegotiation.id,p_action:'deliver'});
  await expectDenied(merchant,newNegotiation.id,'rate',{stars:6});
  await rpc(merchant,'bazgo_negotiation_action',{p_id:newNegotiation.id,p_action:'rate',p_value:{stars:5,comment:'Optional comment'}});
  await rpc(loser,'bazgo_negotiation_action',{p_id:newNegotiation.id,p_action:'rate',p_value:{stars:1,comment:''}});
  await expectDenied(merchant,newNegotiation.id,'rate',{stars:3});
  const rated=await rpc(merchant,'bazgo_snapshot');assertEquals(rated.ratings.filter((r:any)=>r.negotiation_id===newNegotiation.id).length,2);
  // Simultaneous final confirmation and early cancellation: only one transition succeeds.
  const raceLoad=await createLoad(merchant);
  const race=await rpc(a,'bazgo_reserve_load',{p_load_id:raceLoad});
  await rpc(a,'bazgo_negotiation_action',{p_id:race.id,p_action:'propose',p_value:{price:100000}});
  const transitions=await Promise.all([
    merchant.rpc('bazgo_negotiation_action',{p_id:race.id,p_action:'confirm',p_value:{price:100000}}),
    a.rpc('bazgo_negotiation_action',{p_id:race.id,p_action:'cancel',p_value:{}}),
  ]);
  assertEquals(transitions.filter((t)=>!t.error&&!t.data?.error).length,1);
  const raceSnapshot=await rpc(merchant,'bazgo_snapshot');
  const raceState=raceSnapshot.negotiations.find((n:any)=>n.id===race.id).status;
  assert(['confirmed','cancelled'].includes(raceState));
  assertEquals(raceSnapshot.loads.find((l:any)=>l.id===raceLoad).status,raceState==='confirmed'?'confirmed':'available');
  await Promise.all([merchant,a,b].map((client)=>client.auth.signOut()));
}});
Deno.test({name:'Autonomous 15-minute expiry with no app polling, then rebooking and late-confirmation rejection',ignore:!configured||env('TEST_FULL_EXPIRY')!=='true',sanitizeResources:false,sanitizeOps:false,fn:async()=>{
  const merchant=await login('MERCHANT','merchant'),a=await login('DRIVER_A','driver'),b=await login('DRIVER_B','driver');
  await initialize(merchant);
  const loadId=await createLoad(merchant);
  const n=await rpc(a,'bazgo_reserve_load',{p_load_id:loadId});
  await rpc(a,'bazgo_negotiation_action',{p_id:n.id,p_action:'propose',p_value:{price:100000}});
  // Do not call snapshot during this wait: pg_cron, not a client, must release the reservation.
  await sleep(Math.max(1,new Date(n.expires_at).getTime()-Date.now()+75000));
  const raw=await merchant.from('bazgo_loads').select('status,active_negotiation_id').eq('id',loadId).single();
  if(raw.error)throw raw.error;
  assertEquals(raw.data.status,'available');assertEquals(raw.data.active_negotiation_id,null);
  await expectDenied(merchant,n.id,'confirm',{price:100000});
  const next=await rpc(b,'bazgo_reserve_load',{p_load_id:loadId});assert(next.id!==n.id);
  await rpc(b,'bazgo_negotiation_action',{p_id:next.id,p_action:'cancel'});
  await Promise.all([merchant,a,b].map((client)=>client.auth.signOut()));
}});
