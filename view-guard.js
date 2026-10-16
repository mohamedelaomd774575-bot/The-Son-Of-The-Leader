/* ViewGuard — حارس المشاهدة: بيتأكد كل 30 ثانية تقريباً إن الجلسة لسه هي الجلسة النشطة (طرد فوري لو دخل حد بنفس الحساب من جهاز تاني) */
window.VG = (function () {
  const SB_URL = 'https://yxhajhwdbsxblbcpjtci.supabase.co', SB_KEY = 'sb_publishable_ipr1S60Tq_u3pJQOqgvgNw_o1FMkGeX';
  const MSG = {
    session: 'تم تسجيل الدخول بحسابك من جهاز آخر، فاتقفل الدرس هنا.',
    banned: 'تم حظر هذا الحساب.',
    auth: 'انتهت جلستك. سجّل الدخول من جديد.',
    expired: 'انتهت مدة المشاهدة. افتح الدرس من جديد.',
    novid: 'افتح الدرس من صفحة الكورس.',
    unknown: 'افتح الدرس من صفحة الكورس.',
    revoked: 'تم إلغاء اشتراكك في هذا الكورس.',
    hidden: 'الدرس ده مش متاح حالياً.',
    net: 'الاتصال انقطع. افتح الدرس من جديد.'
  };
  let client = null, timer = null, vid = '', kick = null, dead = false, fails = 0;
  function getClient() {
    if (client) return client;
    try { client = window.supabase.createClient(SB_URL, SB_KEY); } catch (e) { client = null; }
    return client;
  }
  function overlay(reason) {
    if (document.getElementById('vgOverlay')) return;
    const d = document.createElement('div'); d.id = 'vgOverlay';
    d.setAttribute('style', 'position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.94);color:#fff;font-family:system-ui,"IBM Plex Sans Arabic",Tahoma,sans-serif;padding:24px;text-align:center;direction:rtl');
    d.innerHTML = '<div style="max-width:420px"><div style="font-size:42px;margin-bottom:12px">🔒</div><div style="font-size:18px;font-weight:700;line-height:1.8;margin-bottom:18px"></div><button style="background:#0a84ff;color:#fff;border:0;border-radius:999px;padding:11px 26px;font-size:15px;font-weight:700;cursor:pointer">الرجوع للمنصة</button></div>';
    d.querySelector('div>div:nth-child(2)').textContent = MSG[reason] || MSG.unknown;
    d.querySelector('button').onclick = go;
    try { const fsEl = document.fullscreenElement || document.webkitFullscreenElement; (fsEl || document.body).appendChild(d); } catch (e) { document.body.appendChild(d); }
    setTimeout(go, 6000);
  }
  let outP = null;
  function localSignOut(reason) {
    if (reason !== 'session' && reason !== 'banned' && reason !== 'auth') return;
    try { const c = getClient(); if (c) outP = Promise.race([Promise.resolve(c.auth.signOut({ scope: 'local' })).catch(function () { }), new Promise(function (r) { setTimeout(r, 1500); })]); } catch (e) { }
    try { localStorage.removeItem('son_sid'); localStorage.removeItem('studentData'); localStorage.removeItem('leader_user'); } catch (e) { }
  }
  function go() { const r = function () { try { location.replace('index.html'); } catch (e) { location.href = 'index.html'; } }; if (outP) outP.then(r, r); else r(); }
  function stop() { clearInterval(timer); timer = null; }
  function die(reason) { if (dead) return; dead = true; stop(); try { kick && kick(reason); } catch (e) { } localSignOut(reason); overlay(reason); }
  async function check() {
    const c = getClient();
    if (!c) { fails++; return fails >= 3 ? 'net' : 'ok'; }
    try {
      let r = await c.rpc('view_heartbeat', { p_view_id: vid });
      // 401/403 = الجلسة اتمسحت من السيرفر (اتطردت من جهاز/تبويب تاني) — مش مشكلة شبكة
      if (r.error && (r.status === 401 || r.status === 403)) {
        let ok = false;
        try { const rf = await c.auth.refreshSession(); ok = !!(rf && !rf.error && rf.data && rf.data.session); } catch (e) { ok = false; }
        if (!ok) return 'auth';
        r = await c.rpc('view_heartbeat', { p_view_id: vid });
        if (r.error && (r.status === 401 || r.status === 403)) return 'auth';
      }
      if (r.error) { fails++; return fails >= 5 ? 'net' : 'ok'; }
      fails = 0;
      const data = r.data;
      return data && data.ok === false ? (data.reason || 'unknown') : 'ok';
    } catch (e) { fails++; return fails >= 5 ? 'net' : 'ok'; }
  }
  async function beat() { if (dead) return; const r = await check(); if (r !== 'ok') die(r); }
  async function gate(ctx, o) {
    o = o || {}; kick = o.kick || null;
    if (!ctx || !ctx.w) { die('novid'); return false; }
    vid = ctx.w;
    const r = await check();
    if (r !== 'ok') { die(r); return false; }
    timer = setInterval(beat, 30000 + Math.floor(Math.random() * 6000));
    document.addEventListener('visibilitychange', () => { if (!document.hidden) beat(); });
    window.addEventListener('online', beat);
    window.addEventListener('storage', function (e) { if (e.key && /^sb-.*-auth-token/.test(e.key)) beat(); });
    return true;
  }
  return { gate, getClient, overlay };
})();
