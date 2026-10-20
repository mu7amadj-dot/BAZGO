import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as Crypto from 'expo-crypto';
import { useAlert } from '@/template';
import { useBooking } from './useBooking';
import { useVoiceRecorder } from './useVoiceRecorder';
import { sendServerText, sendServerVoice } from '@/services/bookingService';
import type { NegotiationAction } from '@/services/bookingTypes';
import { formatIQD } from '@/services/format';
export function useNegotiationChat(id: string) {
  const booking = useBooking();
  const { showAlert } = useAlert();
  const voice = useVoiceRecorder();
  const [text, setText] = useState('');
  const [price, setPrice] = useState('');
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const sending = useRef(false);
  const retry = useRef<{ content: string; id: string } | null>(null);
  const negotiation = booking.negotiations.find((n) => n.id === id);
  const load = booking.loads.find((r) => r.id === negotiation?.load_id);
  const thread = useMemo(() => booking.messages.filter((m) => m.negotiation_id === id), [booking.messages,id]);
  const myRating = booking.ratings.find((r) => r.negotiation_id === id && r.user_id === booking.userId);
  const remaining = negotiation ? Math.max(0, Math.ceil((new Date(negotiation.expires_at).getTime() - booking.now) / 1000)) : 0;
  const negotiating = negotiation?.status === 'negotiating' && remaining > 0;
  const expired = negotiation?.status === 'negotiating' && remaining <= 0;
  const closed = expired || negotiation?.status === 'expired' || negotiation?.status === 'cancelled';
  const isMerchant = negotiation?.user_id === booking.userId;
  const canChat = !!negotiation && !closed;
  useEffect(() => { if (negotiation?.initial_price) setPrice(String(negotiation.proposed_price ?? negotiation.initial_price)); }, [id, negotiation?.initial_price]);
  useEffect(() => { if (!canChat && voice.isRecording) void voice.stop(); }, [canChat, voice.isRecording, voice.stop]);
  const run = useCallback(async (action: NegotiationAction, value: Record<string, unknown> = {}) => {
    if (sending.current) return;
    sending.current = true; setBusy(true);
    try { await booking.act(id,action,value); }
    catch(error) { showAlert('تعذر إكمال العملية', error instanceof Error ? error.message : 'حاول مجدداً.'); }
    finally { sending.current=false; setBusy(false); }
  }, [booking.act,id,showAlert]);
  const send = useCallback(async () => {
    if (sending.current || !booking.userId || !canChat || voice.isRecording) return;
    const content = voice.draft?.uri ?? text.trim();
    if (!content) return;
    const clientId = retry.current?.content === content ? retry.current.id : Crypto.randomUUID();
    retry.current = { content,id:clientId };
    sending.current=true;setBusy(true);
    try {
      if (voice.draft) await sendServerVoice(id,booking.userId,voice.draft.uri,voice.draft.durationMs,voice.draft.mime,clientId);
      else await sendServerText(id,text.trim(),clientId);
      retry.current=null;
      if (voice.draft) voice.discard(); else setText('');
      await booking.reload();
    } catch(error) { showAlert('تعذر إرسال الرسالة',error instanceof Error ? error.message : 'حاول مجدداً.'); }
    finally {sending.current=false;setBusy(false);}
  }, [booking.userId,booking.reload,canChat,voice.draft,voice.discard,voice.isRecording,text,id,showAlert]);
  const propose = useCallback(() => {
    const number = Number(price);
    if (!Number.isSafeInteger(number) || number <= 0) { showAlert('سعر غير صالح','أدخل سعراً صحيحاً أكبر من صفر.'); return; }
    void run('propose',{price:number});
  }, [price,run,showAlert]);
  const confirm = useCallback(() => {
    if (!negotiation?.proposed_price) return;
    const proposed = negotiation.proposed_price;
    showAlert('تأكيد الاتفاق النهائي',`هل توافق على حجز الحمولة بالسعر ${formatIQD(proposed)}؟ لن يتمكن أي سائق آخر من قبولها.`,[
      {text:'مراجعة',style:'cancel'}, {text:'Confirm Final Agreement',onPress:() => { void run('confirm',{price:proposed}); }},
    ]);
  }, [negotiation?.proposed_price,run,showAlert]);
  const cancel = useCallback(() => showAlert('إلغاء التفاوض؟','سيتم تحرير الحجز المؤقت وإتاحة الحمولة للسائقين الآخرين.',[
    {text:'متابعة التفاوض',style:'cancel'}, {text:'إلغاء التفاوض',style:'destructive',onPress:() => {void run('cancel');}},
  ]), [run,showAlert]);
  const rate = useCallback(() => { if (stars >= 1 && stars <= 5) void run('rate',{stars,comment:comment.trim()}); }, [run,stars,comment]);
  return { ...booking, negotiation, load, thread, myRating, remaining, negotiating, closed, isMerchant, canChat, voice,
    text,setText,price,setPrice,stars,setStars,comment,setComment,busy,send,propose,confirm,cancel,rate,
    startTransport:()=>{void run('start');},confirmDelivery:()=>showAlert('تأكيد استلام الحمولة','هل اكتمل النقل وتم استلام الحمولة؟',[
      {text:'رجوع',style:'cancel'},{text:'تأكيد التسليم',onPress:()=>{void run('deliver');}},
    ]),
  };
}
