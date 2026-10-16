(function () {
    'use strict';

    /* ======================================================
       أدوات صغيرة
    ====================================================== */
    const $ = id => document.getElementById(id);
    const stage = $('stage');

    try { if (localStorage.getItem('son-leader-theme') === 'light') document.body.classList.add('light'); } catch (e) { }

    // ---- أيقونات SVG (من غير أي مكتبة خارجية) ----
    const I = {
        play: '<svg viewBox="0 0 24 24"><path d="M8 5.2v13.6a1 1 0 0 0 1.5.86l11-6.8a1 1 0 0 0 0-1.72l-11-6.8A1 1 0 0 0 8 5.2z"/></svg>',
        pause: '<svg viewBox="0 0 24 24"><rect x="6" y="4.5" width="4.2" height="15" rx="1.4"/><rect x="13.8" y="4.5" width="4.2" height="15" rx="1.4"/></svg>',
        vol: '<svg viewBox="0 0 24 24"><path d="M3 9.5v5a1 1 0 0 0 1 1h3l4.3 3.6a1 1 0 0 0 1.7-.77V5.67a1 1 0 0 0-1.7-.77L7 8.5H4a1 1 0 0 0-1 1z"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
        mute: '<svg viewBox="0 0 24 24"><path d="M3 9.5v5a1 1 0 0 0 1 1h3l4.3 3.6a1 1 0 0 0 1.7-.77V5.67a1 1 0 0 0-1.7-.77L7 8.5H4a1 1 0 0 0-1 1z"/><path d="m16 9.5 5 5m0-5-5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
        gear: '<svg viewBox="0 0 24 24"><path d="M19.4 13a7.7 7.7 0 0 0 0-2l2-1.6a.5.5 0 0 0 .1-.6l-1.9-3.3a.5.5 0 0 0-.6-.2l-2.4 1a7.4 7.4 0 0 0-1.7-1l-.4-2.5a.5.5 0 0 0-.5-.4h-3.8a.5.5 0 0 0-.5.4l-.4 2.5a7.4 7.4 0 0 0-1.7 1l-2.4-1a.5.5 0 0 0-.6.2L2.5 8.8a.5.5 0 0 0 .1.6l2 1.6a7.7 7.7 0 0 0 0 2l-2 1.6a.5.5 0 0 0-.1.6l1.9 3.3c.1.2.4.3.6.2l2.4-1c.5.4 1.1.7 1.7 1l.4 2.5c0 .2.2.4.5.4h3.8c.3 0 .5-.2.5-.4l.4-2.5c.6-.3 1.2-.6 1.7-1l2.4 1c.2.1.5 0 .6-.2l1.9-3.3a.5.5 0 0 0-.1-.6l-2-1.6zM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z"/></svg>',
        fs: '<svg viewBox="0 0 24 24"><path d="M4 9V5.5A1.5 1.5 0 0 1 5.5 4H9M15 4h3.5A1.5 1.5 0 0 1 20 5.5V9M20 15v3.5a1.5 1.5 0 0 1-1.5 1.5H15M9 20H5.5A1.5 1.5 0 0 1 4 18.5V15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
        fsx: '<svg viewBox="0 0 24 24"><path d="M9 4v3.5A1.5 1.5 0 0 1 7.5 9H4M20 9h-3.5A1.5 1.5 0 0 1 15 7.5V4M15 20v-3.5a1.5 1.5 0 0 1 1.5-1.5H20M4 15h3.5A1.5 1.5 0 0 1 9 16.5V20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
        chev: '<svg viewBox="0 0 24 24"><path d="M14.7 5.3a1 1 0 0 1 0 1.4L9.4 12l5.3 5.3a1 1 0 0 1-1.4 1.4l-6-6a1 1 0 0 1 0-1.4l6-6a1 1 0 0 1 1.4 0z"/></svg>',
        chevr: '<svg viewBox="0 0 24 24"><path d="M9.3 5.3a1 1 0 0 0 0 1.4l5.3 5.3-5.3 5.3a1 1 0 1 0 1.4 1.4l6-6a1 1 0 0 0 0-1.4l-6-6a1 1 0 0 0-1.4 0z"/></svg>',
        check: '<svg viewBox="0 0 24 24"><path d="M9.5 17.2 4.8 12.5l1.4-1.4 3.3 3.3 8.3-8.3 1.4 1.4z"/></svg>',
        replay: '<svg viewBox="0 0 24 24"><path d="M12 5V2.2a.5.5 0 0 0-.8-.4L7 5.3a.5.5 0 0 0 0 .8l4.2 3.5a.5.5 0 0 0 .8-.4V7a5.5 5.5 0 1 1-5.5 5.5 1 1 0 1 0-2 0A7.5 7.5 0 1 0 12 5z"/></svg>',
        warn: '<svg class="ico-err" viewBox="0 0 24 24"><path d="M12 2.5a1.6 1.6 0 0 1 1.4.8l9 15.6a1.6 1.6 0 0 1-1.4 2.4H3a1.6 1.6 0 0 1-1.4-2.4l9-15.6A1.6 1.6 0 0 1 12 2.5zm-1 6.5v5h2V9h-2zm0 7v2h2v-2h-2z"/></svg>'
    };

    /* ======================================================
       سياق الدرس — الرابط بيتفك مرة واحدة، وبيتشال من شريط العنوان
       ومن الـ history، وبيفضل جوه الـ closure بس (مش global)
    ====================================================== */
    function mask(s) { try { return btoa(unescape(encodeURIComponent(s))).split('').reverse().join(''); } catch (e) { return ''; } }
    function unmask(s) {
        try {
            if (!s) return '';
            if (/^https?:/i.test(s)) return s;
            return decodeURIComponent(escape(atob(s.split('').reverse().join(''))));
        } catch (e) { return ''; }
    }
    function ytId(u) {
        if (!u) return '';
        if (/^[\w-]{11}$/.test(u)) return u;
        const m = u.match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/|\/live\/)([\w-]{11})/);
        return m ? m[1] : '';
    }

    let ctx = null;
    (function loadCtx() {
        const q = new URLSearchParams(location.search);
        if (q.has('url') || q.has('videoId')) {
            const vid = ytId(q.get('videoId') || '') || ytId(unmask(q.get('url') || ''));
            ctx = { c: q.get('courseId') || '', t: q.get('title') || '', v: vid, w: q.get('vid') || '', l: q.get('vl') || '' };
            try { sessionStorage.setItem('vp_ctx', JSON.stringify({ c: ctx.c, t: ctx.t, k: mask(vid), w: ctx.w, l: ctx.l })); } catch (e) { }
            try { history.replaceState(null, '', location.pathname); } catch (e) { }
        } else {
            try {
                const s = JSON.parse(sessionStorage.getItem('vp_ctx') || 'null');
                if (s) ctx = { c: s.c, t: s.t, v: ytId(unmask(s.k)), w: s.w || '', l: s.l || '' };
            } catch (e) { }
        }
    })();

    const TITLE = (ctx && ctx.t) || 'الدرس';
    $('lessonTitle').textContent = TITLE;
    $('infoTitle').textContent = TITLE;
    $('topTitle').textContent = TITLE;
    document.title = TITLE + ' | ابن القائد';

    /* ---- الطالب ---- */
    const student = (function () {
        for (const k of ['studentData', 'leader_user', 'userData', 'student']) {
            try {
                const raw = localStorage.getItem(k);
                if (!raw || raw[0] !== '{') continue;
                const o = JSON.parse(raw);
                const name = o.name || o.studentName || o.fullName || '';
                const phone = (o.phone || o.studentPhone || o.mobile || '').toString().replace(/\D/g, '');
                if (name || phone) return { name: name || 'طالب', phone };
            } catch (e) { }
        }
        return { name: 'طالب', phone: '' };
    })();
    $('stuName').textContent = student.name;
    $('stuAv').textContent = (student.name.trim().charAt(0)) || 'ط';
    $('tagStuTxt').textContent = student.name;

    /* ======================================================
       أيقونات الأزرار
    ====================================================== */
    const bCenter = $('bCenter'), bPlay = $('bPlay'), bMute = $('bMute'), bSet = $('bSet'), bFs = $('bFs');
    bSet.innerHTML = I.gear;
    bFs.innerHTML = I.fs;
    bMute.innerHTML = I.vol;

    /* ======================================================
       الغلاف (cover)
    ====================================================== */
    const cover = $('cover');
    let coverMode = 'start';
    function setCover(mode) {
        coverMode = mode;
        stage.classList.toggle('cov', mode !== 'off');
        if (mode === 'off') { cover.classList.add('off'); return; }
        cover.classList.remove('off');
        if (mode === 'start') {
            cover.innerHTML = '<button class="big-play glass" id="cvPlay" aria-label="تشغيل">' + I.play + '</button><h2></h2>';
            cover.querySelector('h2').textContent = TITLE;
            $('cvPlay').onclick = e => { e.stopPropagation(); play(); };
        } else if (mode === 'end') {
            cover.innerHTML = '<button class="big-play glass" id="cvPlay" aria-label="إعادة">' + I.replay + '</button><h2>انتهى الدرس</h2><p>اضغط لإعادة المشاهدة</p>';
            $('cvPlay').onclick = e => { e.stopPropagation(); seek(0); play(); };
        } else if (mode === 'load') {
            cover.innerHTML = '<h2>جاري تجهيز الدرس…</h2>';
        } else if (mode === 'err') {
            cover.innerHTML = I.warn + '<h2>تعذّر تشغيل الفيديو</h2><p id="errMsg"></p><button class="pill-btn glass" id="cvRetry">إعادة المحاولة</button>';
            $('errMsg').textContent = cover.dataset.msg || 'تأكد من اتصالك بالإنترنت وجرّب تاني. لو المشكلة فضلت كلّم الدعم.';
            $('cvRetry').onclick = e => { e.stopPropagation(); location.reload(); };
        }
    }

    /* ======================================================
       مشغّل YouTube (بدون أي واجهة من يوتيوب)
    ====================================================== */
    let yt = null, ready = false, dur = 0, st = -2, speed = 1;
    let started = false, dragging = false, tickTimer = null, lastSave = 0;
    let ifr = null;

    const POS_KEY = 'vp_pos_' + ((ctx && ctx.c) || (ctx && ctx.v) || 'x');

    function fitFrame() {
        if (!ifr) return;
        const w = stage.clientWidth, h = stage.clientHeight;
        if (!w || !h) return;
        const vh = Math.min(h, w * 9 / 16), vw = vh * 16 / 9;
        const e = Math.max(110, Math.round(vw * 0.16));   // هامش أمان فوق وتحت: شريط يوتيوب بيقع جواه
        // القص بقى على حدود الفيديو بالظبط (مش الشاشة كلها) — فالفل سكرين على الموبايل مبيبينش أي شريط
        const clip = $('ytClip');
        if (clip) {
            clip.style.right = 'auto'; clip.style.bottom = 'auto';
            clip.style.left = Math.floor((w - vw) / 2) + 'px';
            clip.style.top = Math.floor((h - vh) / 2) + 'px';
            clip.style.width = Math.ceil(vw) + 'px';
            clip.style.height = Math.ceil(vh) + 'px';
        }
        ifr.style.width = Math.ceil(vw) + 'px';
        ifr.style.height = Math.ceil(vh + e * 2) + 'px';
        ifr.style.left = '0px';
        ifr.style.top = (-e) + 'px';
    }
    new ResizeObserver(fitFrame).observe(stage);

    function loadAPI() {
        return new Promise((res, rej) => {
            if (window.YT && YT.Player) return res();
            const prev = window.onYouTubeIframeAPIReady;
            window.onYouTubeIframeAPIReady = () => { try { prev && prev(); } catch (e) { } res(); };
            const s = document.createElement('script');
            s.src = 'https://www.youtube.com/iframe_api';
            s.onerror = () => rej(new Error('net'));
            document.head.appendChild(s);
            setTimeout(() => { if (!(window.YT && YT.Player)) rej(new Error('timeout')); }, 15000);
        });
    }

    function init() {
        if (!ctx || !ctx.v) {
            cover.dataset.msg = 'مفيش فيديو متاح للدرس ده. كلّم الإدارة.';
            setCover('err');
            $('cvRetry') && ($('cvRetry').style.display = 'none');
            return;
        }
        setCover('load');
        loadAPI().then(() => {
            const vars = { controls: 0, disablekb: 1, fs: 0, modestbranding: 1, rel: 0, iv_load_policy: 3, cc_load_policy: 0, playsinline: 1, enablejsapi: 1, autoplay: 0 };
            if (/^https?:$/.test(location.protocol)) vars.origin = location.origin;
            yt = new YT.Player('ytMount', {
                host: 'https://www.youtube-nocookie.com',
                width: '100%', height: '100%', videoId: ctx.v, playerVars: vars,
                events: { onReady, onStateChange, onError, onPlaybackRateChange: () => { try { speed = yt.getPlaybackRate(); $('bSpd').textContent = fmtSpeed(speed); } catch (e) { } } }
            });
        }).catch(() => { cover.dataset.msg = 'تعذّر الاتصال بخدمة الفيديو. تأكد من الإنترنت.'; setCover('err'); });
    }

    function onReady() {
        ready = true;
        ifr = stage.querySelector('iframe');
        if (ifr) {
            ifr.removeAttribute('title');
            ifr.setAttribute('tabindex', '-1');
            ifr.setAttribute('aria-hidden', 'true');
            ifr.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
        }
        fitFrame();
        try { dur = yt.getDuration() || 0; } catch (e) { }
        try { const v = yt.getVolume(); $('vol').value = v; } catch (e) { }
        setCover('start');
        renderPlayIcons();
        tick();
    }

    function onStateChange(e) {
        st = e.data;
        if (st === 1) {            // playing
            started = true;
            setCover('off');
            spin(false);
            stage.classList.remove('paused');
            try { dur = yt.getDuration() || dur; } catch (_) { }
            if (!resumed) { resumed = true; resumeFromSaved(); }
            startTick();
            showUI();
        } else if (st === 2) {     // paused
            stage.classList.add('paused');
            spin(false);
            stopTick(); tick(); saveNow();
        } else if (st === 3) {     // buffering
            if (started) spin(true);
        } else if (st === 0) {     // ended
            stopTick(); tick();
            try { localStorage.removeItem(POS_KEY); } catch (_) { }
            stage.classList.remove('paused');
            setCover('end');
            closeMenu();
        }
        renderPlayIcons();
    }

    function onError(e) {
        const c = e.data;
        cover.dataset.msg = (c === 100 || c === 105)
            ? 'الفيديو ده مش متاح حاليًا. كلّم الإدارة.'
            : 'الفيديو مش بيشتغل هنا حاليًا. جرّب تاني بعد شوية.';
        setCover('err');
        spin(false);
    }

    let resumed = false;
    function resumeFromSaved() {
        try {
            const t = parseFloat(localStorage.getItem(POS_KEY) || '0');
            if (t > 8 && dur && t < dur - 12) { seek(t); toast('كملنا من آخر مكان وقفت عنده'); }
        } catch (e) { }
    }

    function saveNow() {
        try { if (ready && st !== 0) { const t = yt.getCurrentTime(); if (t > 3) localStorage.setItem(POS_KEY, String(Math.floor(t))); } } catch (e) { }
    }

    /* ---------- أفعال ---------- */
    function play() { if (ready) { try { yt.playVideo(); } catch (e) { } } }
    function pause() { if (ready) { try { yt.pauseVideo(); } catch (e) { } } }
    function isPlaying() { return st === 1 || st === 3; }
    function togglePlay() { isPlaying() ? pause() : play(); }
    function seek(t) { if (!ready) return; t = Math.max(0, Math.min(dur || 1e9, t)); try { yt.seekTo(t, true); } catch (e) { } tick(t); }
    function skip(d) {
        if (!ready) return;
        let c = 0; try { c = yt.getCurrentTime(); } catch (e) { }
        seek(c + d);
        const el = d > 0 ? $('fxR') : $('fxL');
        el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
    }
    function setVol(v) { if (!ready) return; try { yt.setVolume(v); v > 0 ? yt.unMute() : yt.mute(); } catch (e) { } $('vol').value = v; renderVol(); }
    function toggleMute() { if (!ready) return; try { if (yt.isMuted()) { yt.unMute(); if (yt.getVolume() === 0) yt.setVolume(60); } else yt.mute(); } catch (e) { } renderVol(); }
    function renderVol() { try { const m = yt.isMuted() || yt.getVolume() === 0; bMute.innerHTML = m ? I.mute : I.vol; $('vol').value = m ? 0 : yt.getVolume(); } catch (e) { } }

    function renderPlayIcons() {
        const p = isPlaying();
        bCenter.innerHTML = p ? I.pause : I.play;
        bPlay.innerHTML = p ? I.pause : I.play;
    }

    function spin(on) { $('spinner').classList.toggle('on', !!on); }

    /* ---------- progress ---------- */
    const fmt = s => { s = Math.max(0, Math.floor(s || 0)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(x).padStart(2, '0'); };
    const fmtSpeed = r => (r === 1 ? '1' : String(r)) + '×';

    function tick(forceT) {
        if (!ready || dragging) return;
        let c = 0, buf = 0;
        try { c = typeof forceT === 'number' ? forceT : yt.getCurrentTime(); buf = yt.getVideoLoadedFraction(); if (!dur) dur = yt.getDuration() || 0; } catch (e) { }
        const f = dur ? Math.min(1, c / dur) : 0;
        paintProgress(f, buf);
        $('time').innerHTML = fmt(c) + ' <b>/ ' + fmt(dur) + '</b>';
        if (isPlaying() && Date.now() - lastSave > 5000) { lastSave = Date.now(); saveNow(); }
    }
    function paintProgress(f, buf) {
        $('sCur').style.width = (f * 100) + '%';
        $('sBuf').style.width = ((buf || 0) * 100) + '%';
        $('sKnob').style.left = (f * 100) + '%';
    }
    function startTick() { stopTick(); tickTimer = setInterval(tick, 250); }
    function stopTick() { clearInterval(tickTimer); tickTimer = null; }

    /* ---------- scrubber (سحب بالماوس واللمس) ---------- */
    const scrub = $('scrub');
    function fracFrom(e) { const r = scrub.getBoundingClientRect(); return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)); }
    function scrubMove(e) {
        const f = fracFrom(e);
        paintProgress(f, 0);
        const tip = $('sTip');
        tip.style.left = Math.max(26, Math.min(scrub.clientWidth - 26, f * scrub.clientWidth)) + 'px';
        tip.textContent = fmt(f * dur);
        $('time').innerHTML = fmt(f * dur) + ' <b>/ ' + fmt(dur) + '</b>';
        return f;
    }
    scrub.addEventListener('pointerdown', e => {
        if (!ready || !dur) return;
        dragging = true; scrub.classList.add('drag');
        scrub.setPointerCapture(e.pointerId);
        scrubMove(e); showUI(true);
    });
    scrub.addEventListener('pointermove', e => { if (dragging) scrubMove(e); });
    const endDrag = e => {
        if (!dragging) return;
        const f = fracFrom(e);
        dragging = false; scrub.classList.remove('drag');
        seek(f * dur); showUI();
    };
    scrub.addEventListener('pointerup', endDrag);
    scrub.addEventListener('pointercancel', () => { dragging = false; scrub.classList.remove('drag'); });

    /* ---------- إظهار / إخفاء الواجهة ---------- */
    let hideT = null;
    function showUI(keep) {
        stage.classList.add('show');
        clearTimeout(hideT);
        if (!keep) hideT = setTimeout(() => { if (isPlaying() && !menuOpen && !dragging) stage.classList.remove('show'); }, 3200);
    }
    function hideUI() { if (isPlaying() && !menuOpen) stage.classList.remove('show'); }
    stage.addEventListener('pointermove', e => { if (e.pointerType === 'mouse') showUI(); });
    stage.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') hideT = setTimeout(hideUI, 800); });
    $('ui').addEventListener('pointerdown', () => showUI());

    /* ---------- النقر على الشاشة ---------- */
    let lastTap = 0, tapT = null;
    $('surface').addEventListener('pointerup', e => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        if (coverMode !== 'off') return;
        if (menuOpen) { closeMenu(); return; }
        const now = Date.now();
        const r = stage.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        if (now - lastTap < 300) {
            clearTimeout(tapT);
            if (e.pointerType === 'mouse') { lastTap = 0; toggleFS(); }
            else {
                lastTap = now;
                if (x < .38) skip(-10); else if (x > .62) skip(10);
            }
            return;
        }
        lastTap = now;
        tapT = setTimeout(() => {
            if (e.pointerType === 'mouse') { togglePlay(); showUI(); }
            else { stage.classList.contains('show') ? (isPlaying() ? stage.classList.remove('show') : 0) : showUI(); }
        }, 290);
    });

    /* ---------- الأزرار ---------- */
    bCenter.onclick = e => { e.stopPropagation(); togglePlay(); showUI(); };
    bPlay.onclick = e => { e.stopPropagation(); togglePlay(); showUI(); };
    $('bBack').onclick = e => { e.stopPropagation(); skip(-10); showUI(); };
    $('bFwd').onclick = e => { e.stopPropagation(); skip(10); showUI(); };
    bMute.onclick = e => { e.stopPropagation(); toggleMute(); };
    $('vol').addEventListener('input', e => setVol(parseInt(e.target.value, 10)));
    bFs.onclick = e => { e.stopPropagation(); toggleFS(); };
    bSet.onclick = e => { e.stopPropagation(); menuOpen ? closeMenu() : openMenu('main'); };
    $('bSpd').onclick = e => { e.stopPropagation(); menuOpen && menuPage === 'speed' ? closeMenu() : openMenu('speed'); };
    $('menu').addEventListener('pointerdown', e => e.stopPropagation());
    $('dock').addEventListener('pointerdown', e => e.stopPropagation());

    /* ---------- ملء الشاشة (مع بديل لـ iPhone) ---------- */
    function isFS() { return document.fullscreenElement === stage || document.webkitFullscreenElement === stage || stage.classList.contains('pfs'); }
    function updateFS() {
        const f = isFS();
        bFs.innerHTML = f ? I.fsx : I.fs;
        stage.classList.toggle('isfs', f);
        setTimeout(fitFrame, 60);
    }
    async function toggleFS() {
        if (isFS()) {
            if (stage.classList.contains('pfs')) { stage.classList.remove('pfs'); document.body.classList.remove('noscroll'); }
            else if (document.exitFullscreen) { try { await document.exitFullscreen(); } catch (e) { } }
            else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
            try { screen.orientation && screen.orientation.unlock && screen.orientation.unlock(); } catch (e) { }
        } else {
            try {
                if (stage.requestFullscreen) await stage.requestFullscreen({ navigationUI: 'hide' });
                else if (stage.webkitRequestFullscreen) stage.webkitRequestFullscreen();
                else throw new Error('nofs');
                try { screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape').catch(() => { }); } catch (e) { }
            } catch (e) {
                stage.classList.add('pfs'); document.body.classList.add('noscroll');
            }
        }
        updateFS(); showUI();
    }
    document.addEventListener('fullscreenchange', updateFS);
    document.addEventListener('webkitfullscreenchange', updateFS);

    /* ---------- قائمة الإعدادات ---------- */
    const menu = $('menu');
    let menuOpen = false, menuPage = 'main';
    const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
    const QLBL = { highres: '4K+', hd2160: '4K', hd1440: '1440p', hd1080: '1080p', hd720: '720p', large: '480p', medium: '360p', small: '240p', tiny: '144p', auto: 'تلقائي' };
    let curQ = 'auto';

    function openMenu(page) { menuPage = page; renderMenu(); menu.classList.add('open'); menuOpen = true; showUI(true); }
    function closeMenu() { menu.classList.remove('open'); menuOpen = false; showUI(); }

    function renderMenu() {
        let h = '';
        if (menuPage === 'main') {
            h += '<button class="mrow" data-go="speed"><span>سرعة التشغيل</span><span class="v">' + fmtSpeed(speed) + I.chev + '</span></button>';
            h += '<button class="mrow" data-go="quality"><span>الجودة</span><span class="v">' + (QLBL[curQ] || curQ) + I.chev + '</span></button>';
        } else if (menuPage === 'speed') {
            h += '<div class="mhead"><button data-go="main" aria-label="رجوع">' + I.chevr + '</button>سرعة التشغيل</div>';
            SPEEDS.forEach(s => { h += '<button class="mrow' + (s === speed ? ' sel' : '') + '" data-speed="' + s + '"><span>' + (s === 1 ? 'عادية' : fmtSpeed(s)) + '</span><span class="ck">' + I.check + '</span></button>'; });
        } else if (menuPage === 'quality') {
            h += '<div class="mhead"><button data-go="main" aria-label="رجوع">' + I.chevr + '</button>الجودة</div>';
            let lv = []; try { lv = (yt.getAvailableQualityLevels() || []).filter(l => l !== 'auto'); } catch (e) { }
            if (!lv.length) h += '<div class="mnote">الجودة بتظهر بعد ما الفيديو يشتغل.</div>';
            ['auto'].concat(lv).forEach(l => { h += '<button class="mrow' + (l === curQ ? ' sel' : '') + '" data-q="' + l + '"><span>' + (QLBL[l] || l) + '</span><span class="ck">' + I.check + '</span></button>'; });
            h += '<div class="mnote">الجودة التلقائية بتتظبط حسب سرعة الإنترنت عندك.</div>';
        }
        menu.innerHTML = h;
        menu.querySelectorAll('[data-go]').forEach(b => b.onclick = e => { e.stopPropagation(); menuPage = b.dataset.go; renderMenu(); });
        menu.querySelectorAll('[data-speed]').forEach(b => b.onclick = e => {
            e.stopPropagation();
            speed = parseFloat(b.dataset.speed);
            try { yt.setPlaybackRate(speed); } catch (_) { }
            $('bSpd').textContent = fmtSpeed(speed);
            toast('السرعة ' + fmtSpeed(speed)); closeMenu();
        });
        menu.querySelectorAll('[data-q]').forEach(b => b.onclick = e => {
            e.stopPropagation();
            const q = b.dataset.q; curQ = q;
            try { yt.setPlaybackQuality(q); if (q !== 'auto' && yt.setPlaybackQualityRange) yt.setPlaybackQualityRange(q, q); } catch (_) { }
            closeMenu();
            if (q !== 'auto') {
                setTimeout(() => {
                    let now = ''; try { now = yt.getPlaybackQuality(); } catch (_) { }
                    if (now && now !== q) { curQ = 'auto'; toast('الجودة بتتحدد تلقائي حسب اتصالك'); }
                    else toast('الجودة ' + (QLBL[q] || q));
                }, 1600);
            } else toast('الجودة تلقائية');
        });
    }

    /* ---------- toast ---------- */
    let toastT = null;
    function toast(msg) {
        const t = $('toast'); t.textContent = msg; t.classList.add('on');
        clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 1900);
    }

    /* ---------- كيبورد ---------- */
    document.addEventListener('keydown', e => {
        if (!ready || coverMode === 'err') return;
        const tag = (document.activeElement && document.activeElement.tagName) || '';
        if (tag === 'INPUT' && document.activeElement.type !== 'range') return;
        const k = e.key.toLowerCase();
        const acts = {
            ' ': () => togglePlay(), 'k': () => togglePlay(),
            'arrowright': () => skip(10), 'l': () => skip(10),
            'arrowleft': () => skip(-10), 'j': () => skip(-10),
            'arrowup': () => { let v = 0; try { v = yt.getVolume(); } catch (_) { } setVol(Math.min(100, v + 10)); toast('الصوت ' + Math.min(100, v + 10) + '%'); },
            'arrowdown': () => { let v = 0; try { v = yt.getVolume(); } catch (_) { } setVol(Math.max(0, v - 10)); toast('الصوت ' + Math.max(0, v - 10) + '%'); },
            'm': () => toggleMute(), 'f': () => toggleFS(),
            'escape': () => { if (menuOpen) closeMenu(); else if (stage.classList.contains('pfs')) toggleFS(); }
        };
        if (acts[k]) { e.preventDefault(); acts[k](); showUI(); }
    });

    /* ---------- علامة مائية متحركة ---------- */
    (function watermark() {
        const wm = $('wm');
        const txt = (student.name + (student.phone ? '  ' + student.phone : '')).trim();
        const nodes = [0, 1, 2].map(() => { const i = document.createElement('i'); i.textContent = txt; wm.appendChild(i); return i; });
        const place = () => nodes.forEach((n, idx) => {
            n.style.left = (6 + Math.random() * 62) + '%';
            n.style.top = (8 + Math.random() * 78) + '%';
            n.style.opacity = idx === 0 ? 1 : (.55 + Math.random() * .4);
        });
        place(); setInterval(place, 8000);
    })();

    /* ======================================================
       حماية (طبقة ردع — الحماية الحقيقية على السيرفر)
    ====================================================== */
    document.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('dragstart', e => e.preventDefault());
    document.addEventListener('selectstart', e => e.preventDefault());
    document.addEventListener('keydown', e => {
        const c = e.ctrlKey || e.metaKey, s = e.shiftKey, k = e.key.toUpperCase();
        if (e.key === 'F12' || (c && ['U', 'S', 'P'].includes(k)) || (c && s && ['I', 'J', 'C'].includes(k))) {
            e.preventDefault(); e.stopPropagation(); toast('الإجراء ده غير مسموح');
        }
    }, true);

    // كشف DevTools المثبّتة على الجنب (للكمبيوتر بس عشان مفيش false positives على الموبايل)
    const fine = window.matchMedia('(pointer:fine)');
    setInterval(() => {
        if (!fine.matches) return;
        const open = (window.outerWidth - window.innerWidth > 220) || (window.outerHeight - window.innerHeight > 260);
        if (open && !stage.classList.contains('locked')) { stage.classList.add('locked'); pause(); }
        else if (!open && stage.classList.contains('locked')) stage.classList.remove('locked');
    }, 1000);

    window.addEventListener('beforeunload', saveNow);
    window.addEventListener('pagehide', saveNow);

    /* ---------- رجوع ---------- */
    $('backBtn').onclick = () => {
        try {
            if (document.referrer && new URL(document.referrer).host === location.host && history.length > 1) { history.back(); return; }
        } catch (e) { }
        location.href = 'index.html';
    };

    /* ---------- ابدأ ---------- */
    renderPlayIcons();
    VG.gate(ctx, {
        anchorId: 'infoTitle',
        kick: () => { try { yt && yt.destroy && yt.destroy(); } catch (e) { } try { stage.innerHTML = ''; } catch (e) { } }
    }).then(ok => { if (ok) init(); });
})();
