(function () {
    'use strict';

    /* ======================================================
       ⚙️ إعدادات
       لو الملفات على Google Drive: حط هنا مفتاح Google API (Drive API فقط)
       عشان القارئ يعرضها بشكله الكامل. من غيره بيعرضها في وضع بديل محدود.
    ====================================================== */
    const GDRIVE_API_KEY = '';

    const PDFJS_BASE = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/';
    const WORKER_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    const MAXW = 1000, GAP = 14, MINZ = 0.5, MAXZ = 4, MAXPX = 16000000;

    const $ = id => document.getElementById(id);
    const reader = $('reader'), scroller = $('scroller'), pagesEl = $('pages');
    const coarse = window.matchMedia('(pointer:coarse)').matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    try { if (localStorage.getItem('son-leader-theme') === 'light') document.body.classList.add('light'); } catch (e) { }
    try { if (localStorage.getItem('pr_night') === '1') reader.classList.add('night'); } catch (e) { }

    /* ---------- أيقونات ---------- */
    const S = (d, extra) => '<svg viewBox="0 0 24 24"' + (extra || '') + '>' + d + '</svg>';
    const stroke = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
    const I = {
        back: S('<path d="M9.3 5.3a1 1 0 0 0 0 1.4l5.3 5.3-5.3 5.3a1 1 0 1 0 1.4 1.4l6-6a1 1 0 0 0 0-1.4l-6-6a1 1 0 0 0-1.4 0z"/>'),
        prev: S('<path d="M9.3 5.3a1 1 0 0 0 0 1.4l5.3 5.3-5.3 5.3a1 1 0 1 0 1.4 1.4l6-6a1 1 0 0 0 0-1.4l-6-6a1 1 0 0 0-1.4 0z"/>'),
        next: S('<path d="M14.7 5.3a1 1 0 0 1 0 1.4L9.4 12l5.3 5.3a1 1 0 0 1-1.4 1.4l-6-6a1 1 0 0 1 0-1.4l6-6a1 1 0 0 1 1.4 0z"/>'),
        up: S('<path d="M5.3 14.7a1 1 0 0 0 1.4 0L12 9.4l5.3 5.3a1 1 0 0 0 1.4-1.4l-6-6a1 1 0 0 0-1.4 0l-6 6a1 1 0 0 0 0 1.4z"/>'),
        down: S('<path d="M5.3 9.3a1 1 0 0 1 1.4 0L12 14.6l5.3-5.3a1 1 0 1 1 1.4 1.4l-6 6a1 1 0 0 1-1.4 0l-6-6a1 1 0 0 1 0-1.4z"/>'),
        search: S('<circle cx="10.5" cy="10.5" r="6.5" ' + stroke + '/><path d="m15.5 15.5 5 5" ' + stroke + '/>'),
        grid: S('<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>'),
        moon: S('<path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a.6.6 0 0 0-.8-.7A9.5 9.5 0 1 0 21.2 15a.6.6 0 0 0-.7-.8z"/>'),
        sun: S('<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6" ' + stroke + '/>'),
        plus: S('<path d="M12 5v14M5 12h14" ' + stroke + '/>'),
        minus: S('<path d="M5 12h14" ' + stroke + '/>'),
        close: S('<path d="m6 6 12 12M18 6 6 18" ' + stroke + '/>'),
        warn: '<svg class="eic" viewBox="0 0 24 24"><path d="M12 2.5a1.6 1.6 0 0 1 1.4.8l9 15.6a1.6 1.6 0 0 1-1.4 2.4H3a1.6 1.6 0 0 1-1.4-2.4l9-15.6A1.6 1.6 0 0 1 12 2.5zm-1 6.5v5h2V9h-2zm0 7v2h2v-2h-2z"/></svg>'
    };
    $('bBack').innerHTML = I.back;
    $('bSearch').innerHTML = I.search;
    $('bThumbs').innerHTML = I.grid;
    $('icSearch').innerHTML = I.search;
    $('sPrev').innerHTML = I.up;
    $('sNext').innerHTML = I.down;
    $('sClose').innerHTML = I.close;
    $('bPrev').innerHTML = I.prev;
    $('bNext').innerHTML = I.next;
    $('bZout').innerHTML = I.minus;
    $('bZin').innerHTML = I.plus;
    $('tClose').innerHTML = I.close;
    const setNightIcon = () => { $('bNight').innerHTML = reader.classList.contains('night') ? I.sun : I.moon; $('bNight').classList.toggle('on', reader.classList.contains('night')); };
    setNightIcon();

    /* ======================================================
       سياق الملف — الرابط بيتفك مرة واحدة وبيتشال من شريط العنوان
    ====================================================== */
    function mask(s) { try { return btoa(unescape(encodeURIComponent(s))).split('').reverse().join(''); } catch (e) { return ''; } }
    function unmask(s) {
        try {
            if (!s) return '';
            if (/^https?:/i.test(s)) return s;
            return decodeURIComponent(escape(atob(s.split('').reverse().join(''))));
        } catch (e) { return ''; }
    }
    let ctx = null;
    (function () {
        const q = new URLSearchParams(location.search);
        if (q.has('url')) {
            ctx = { c: q.get('courseId') || '', t: q.get('title') || '', u: unmask(q.get('url')), w: q.get('vid') || '', l: q.get('vl') || '' };
            try { sessionStorage.setItem('pr_ctx', JSON.stringify({ c: ctx.c, t: ctx.t, k: mask(ctx.u), w: ctx.w, l: ctx.l })); } catch (e) { }
            try { history.replaceState(null, '', location.pathname); } catch (e) { }
        } else {
            try { const s = JSON.parse(sessionStorage.getItem('pr_ctx') || 'null'); if (s) ctx = { c: s.c, t: s.t, u: unmask(s.k), w: s.w || '', l: s.l || '' }; } catch (e) { }
        }
    })();
    const TITLE = (ctx && ctx.t) || 'ملف';
    $('docTitle').textContent = TITLE;
    document.title = TITLE + ' | ابن القائد';

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
    const WM_TEXT = (student.name + (student.phone ? '  ' + student.phone : '')).trim();

    /* ======================================================
       حالات (تحميل / خطأ)
    ====================================================== */
    const state = $('state'), scard = $('scard');
    function showLoading(msg, pct) {
        state.classList.remove('off');
        const spin = pct == null;
        scard.innerHTML = '<div class="ring' + (spin ? ' spin' : '') + '" id="ring" style="--p:' + (pct || 0) + '"><b id="ringTxt">' + (pct || 0) + '%</b></div><h2></h2><p></p>';
        scard.querySelector('h2').textContent = msg || 'جاري فتح الملف…';
    }
    function setProgress(p, msg) {
        const r = $('ring'); if (!r) return;
        r.classList.remove('spin'); r.style.setProperty('--p', p); $('ringTxt').textContent = Math.round(p) + '%';
        if (msg) scard.querySelector('h2').textContent = msg;
    }
    function showError(msg, noRetry) {
        state.classList.remove('off');
        scard.innerHTML = I.warn + '<h2>تعذّر فتح الملف</h2><p></p>' + (noRetry ? '' : '<button class="pill" id="retry">إعادة المحاولة</button>');
        scard.querySelector('p').textContent = msg || 'تأكد من اتصالك بالإنترنت وجرّب تاني.';
        const b = $('retry'); if (b) b.onclick = () => location.reload();
    }
    function hideState() { state.classList.add('off'); }

    let toastT = null;
    function toast(m) { const t = $('toast'); t.textContent = m; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 1700); }

    /* ======================================================
       تحديد مصدر الملف
    ====================================================== */
    function driveId(u) {
        const m = u.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:[^#]*&)?id=)([\w-]{10,})/) || u.match(/docs\.google\.com\/(?:document|presentation)\/d\/([\w-]{10,})/);
        return m ? m[1] : '';
    }

    /* ======================================================
       القارئ
    ====================================================== */
    let doc = null, N = 0, sizes = [], R = [], tops = [], hts = [];
    let z = 1, availW = 0, curPage = 0, firstV = 0, lastV = 0;
    const POS_KEY = 'pr_pos_' + ((ctx && ctx.c) || 'x');

    function calcAvail() {
        const sw = scroller.clientWidth, m = sw < 600 ? 10 : 24;
        availW = Math.max(120, Math.min(sw - 2 * m, MAXW));
        return m;
    }

    function layout(anchor) {
        if (!N) return;
        const m = calcAvail();
        const sw = scroller.clientWidth;
        const w = Math.round(availW * z);
        pagesEl.style.width = Math.max(sw, w + 2 * m) + 'px';
        for (let i = 0; i < N; i++) {
            const h = Math.round(w * sizes[i].h / sizes[i].w);
            const el = R[i].el;
            el.style.width = w + 'px';
            el.style.height = h + 'px';
            hts[i] = h;
        }
        const base = pagesEl.offsetTop;
        for (let i = 0; i < N; i++) tops[i] = base + R[i].el.offsetTop;
        if (anchor) {
            if (anchor.type === 'page') scroller.scrollTop = tops[anchor.i] + anchor.f * hts[anchor.i];
            else { scroller.scrollLeft = anchor.fx * scroller.scrollWidth - anchor.cx; scroller.scrollTop = anchor.fy * scroller.scrollHeight - anchor.cy; }
        }
        onScroll(true);
    }

    function pageAnchor() {
        const i = curPage;
        return { type: 'page', i, f: hts[i] ? (scroller.scrollTop - tops[i]) / hts[i] : 0 };
    }

    function zoomTo(nz, cx, cy) {
        nz = Math.max(MINZ, Math.min(MAXZ, nz));
        if (Math.abs(nz - z) < 0.001) return;
        if (cx == null) { cx = scroller.clientWidth / 2; cy = scroller.clientHeight / 2; }
        const fx = (scroller.scrollLeft + cx) / scroller.scrollWidth, fy = (scroller.scrollTop + cy) / scroller.scrollHeight;
        z = nz;
        layout({ type: 'pt', fx, fy, cx, cy });
        $('zVal').textContent = Math.round(z * 100) + '%';
    }
    const STEPS = [0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4];
    function stepZoom(dir, cx, cy) {
        let t;
        if (dir > 0) t = STEPS.find(s => s > z + 0.01) || MAXZ;
        else t = [...STEPS].reverse().find(s => s < z - 0.01) || MINZ;
        zoomTo(t, cx, cy); toast(Math.round(t * 100) + '%');
    }

    function goPage(i, smooth) {
        i = Math.max(0, Math.min(N - 1, i));
        const padT = parseFloat(getComputedStyle(scroller).paddingTop) || 0;
        scroller.scrollTo({ top: Math.max(0, tops[i] - padT), behavior: smooth ? 'smooth' : 'auto' });
    }

    /* ---------- حساب الصفحة الحالية والمرئية ---------- */
    function findIdx(y) {
        let lo = 0, hi = N - 1, r = 0;
        while (lo <= hi) { const mid = (lo + hi) >> 1; if (tops[mid] <= y) { r = mid; lo = mid + 1; } else hi = mid - 1; }
        return r;
    }

    let lastTop = 0, ticking = false;
    function onScroll(force) {
        if (ticking && !force) return;
        ticking = true;
        requestAnimationFrame(() => {
            ticking = false;
            if (!N) return;
            const st = scroller.scrollTop, vh = scroller.clientHeight;
            curPage = findIdx(st + vh * 0.4);
            firstV = findIdx(st); lastV = findIdx(st + vh);
            $('pgCur').textContent = curPage + 1;
            $('docSub').textContent = 'صفحة ' + (curPage + 1) + ' من ' + N;
            const max = scroller.scrollHeight - vh;
            $('progBar').style.transform = 'scaleX(' + (max > 0 ? Math.min(1, st / max) : 1) + ')';
            markThumb();
            // إخفاء الواجهة أثناء القراءة على اللمس
            if (coarse && !force) {
                const d = st - lastTop;
                if (st < 40 || d < -10) reader.classList.remove('off');
                else if (d > 12 && !panelOpen()) reader.classList.add('off');
            }
            lastTop = st;
            pump();
            saveSoon();
        });
    }
    scroller.addEventListener('scroll', () => onScroll(false), { passive: true });

    let saveT = null;
    function saveSoon() { clearTimeout(saveT); saveT = setTimeout(() => { try { localStorage.setItem(POS_KEY, String(curPage)); } catch (e) { } }, 600); }

    /* ---------- الرسم ---------- */
    let active = 0;
    const MAXACT = 2;
    function keyFor() { return Math.round(availW * z) + '|' + dpr; }

    function pump() {
        if (!N) return;
        const key = keyFor();
        const lo = Math.max(0, firstV - 1), hi = Math.min(N - 1, lastV + 1);
        const todo = [];
        for (let i = lo; i <= hi; i++) if (R[i].key !== key && !(R[i].busy && R[i].bkey === key)) todo.push(i);
        todo.sort((a, b) => Math.abs(a - curPage) - Math.abs(b - curPage));
        for (const i of todo) { if (active >= MAXACT) break; renderPage(i, key); }
        // تحرير الصفحات البعيدة
        for (let i = 0; i < N; i++) {
            if ((i < firstV - 5 || i > lastV + 5) && R[i].canvas) {
                R[i].canvas.remove(); R[i].canvas = null; R[i].key = null; R[i].el.classList.remove('ok');
                if (R[i].task) { try { R[i].task.cancel(); } catch (e) { } }
            }
        }
    }

    function burnWM(c) {
        if (!WM_TEXT) return;
        const g = c.getContext('2d'), W = c.width, H = c.height;
        const fs = Math.max(13, W / 40);
        g.save();
        g.globalAlpha = .11; g.fillStyle = '#444';
        g.font = '700 ' + fs + 'px "IBM Plex Sans Arabic", Cairo, sans-serif';
        g.textAlign = 'center'; g.textBaseline = 'middle';
        const tw = g.measureText(WM_TEXT).width, sx = tw + fs * 3.2, sy = fs * 6;
        g.translate(W / 2, H / 2); g.rotate(-Math.PI / 7);
        const R2 = Math.hypot(W, H) / 2;
        let row = 0;
        for (let y = -R2; y < R2 + sy; y += sy, row++) {
            for (let x = -R2 - (row % 2 ? sx / 2 : 0); x < R2 + sx; x += sx) g.fillText(WM_TEXT, x, y);
        }
        g.restore();
    }

    async function renderPage(i, key) {
        const rec = R[i];
        if (rec.task) { try { rec.task.cancel(); } catch (e) { } }
        const tok = rec.tok = (rec.tok || 0) + 1;
        rec.busy = true; rec.bkey = key; active++;
        try {
            const page = rec.page || (rec.page = await doc.getPage(i + 1));
            const cssW = Math.round(availW * z);
            let sc = cssW / sizes[i].w * dpr;
            const vp0 = page.getViewport({ scale: sc });
            if (vp0.width * vp0.height > MAXPX) sc *= Math.sqrt(MAXPX / (vp0.width * vp0.height));
            const vp = page.getViewport({ scale: sc });
            const c = document.createElement('canvas');
            c.width = Math.floor(vp.width); c.height = Math.floor(vp.height);
            const task = page.render({ canvasContext: c.getContext('2d', { alpha: false }), viewport: vp, background: '#ffffff' });
            rec.task = task;
            await task.promise;
            burnWM(c);
            if (rec.tok !== tok) return;
            if (rec.canvas) rec.canvas.remove();
            rec.el.insertBefore(c, rec.hl);
            rec.canvas = c; rec.key = key;
            rec.el.classList.add('ok');
            drawHL(i);
        } catch (e) {
            /* RenderingCancelledException وغيرها: تجاهل */
        } finally {
            active--;
            if (rec.tok === tok) { rec.busy = false; rec.task = null; }
            pump();
        }
    }

    /* ---------- فتح الملف ---------- */
    async function open() {
        if (!ctx || !ctx.u) { showError('مفيش ملف متاح للدرس ده. كلّم الإدارة.', true); return; }
        if (!window.pdfjsLib) { showError('تعذّر تحميل مكوّن القراءة. تأكد من الإنترنت.'); return; }
        pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER_SRC;

        let url = ctx.u;
        const gid = driveId(url);
        if (gid) {
            if (GDRIVE_API_KEY) url = 'https://www.googleapis.com/drive/v3/files/' + gid + '?alt=media&key=' + encodeURIComponent(GDRIVE_API_KEY);
            else { fallbackDrive(gid); return; }
        }

        showLoading('جاري فتح الملف…');
        let pdfData = null;
        if (!/^https?:/i.test(url)) {
            try {
                const sb = VG.getClient();
                const sg = await sb.storage.from('materials').createSignedUrl(url, 120);
                if (sg.error || !sg.data || !sg.data.signedUrl) throw new Error('denied');
                const resp = await fetch(sg.data.signedUrl);
                if (!resp.ok) throw new Error('denied');
                pdfData = new Uint8Array(await resp.arrayBuffer());
            } catch (e) { showError('معندكش صلاحية فتح الملف ده. تأكد إن اشتراكك في الكورس فعّال.', true); return; }
        }
        try {
            const task = pdfjsLib.getDocument({
                ...(pdfData ? { data: pdfData } : { url, withCredentials: false }),
                cMapUrl: PDFJS_BASE + 'cmaps/', cMapPacked: true,
                standardFontDataUrl: PDFJS_BASE + 'standard_fonts/',
                isEvalSupported: false
            });
            task.onProgress = p => { if (p.total) setProgress(Math.min(95, p.loaded / p.total * 95), 'جاري التحميل…'); };
            doc = await task.promise;
        } catch (e) {
            if (gid) { fallbackDrive(gid); return; }
            const name = (e && e.name) || '';
            showError(name === 'PasswordException' ? 'الملف ده محمي بكلمة سر.' : 'الملف مش بيتحمّل حاليًا. جرّب تاني بعد شوية.');
            return;
        }

        N = doc.numPages;
        $('pgTot').textContent = N;
        setProgress(96, 'جاري تجهيز الصفحات…');

        // أبعاد الصفحات
        sizes = new Array(N); R = new Array(N);
        const limit = N > 400 ? 20 : N;
        for (let s = 0; s < limit; s += 25) {
            const part = [];
            for (let i = s; i < Math.min(limit, s + 25); i++) part.push(doc.getPage(i + 1).then(p => { const v = p.getViewport({ scale: 1 }); sizes[i] = { w: v.width, h: v.height }; R[i] = { page: p }; }));
            await Promise.all(part);
        }
        for (let i = limit; i < N; i++) { sizes[i] = sizes[0]; R[i] = {}; }

        const frag = document.createDocumentFragment();
        for (let i = 0; i < N; i++) {
            const el = document.createElement('div'); el.className = 'page'; el.dataset.i = i;
            const hl = document.createElement('div'); hl.className = 'hl';
            el.appendChild(hl);
            R[i].el = el; R[i].hl = hl; R[i].key = null; tops[i] = 0; hts[i] = 0;
            frag.appendChild(el);
        }
        pagesEl.appendChild(frag);
        layout();

        let start = 0;
        try { start = parseInt(localStorage.getItem(POS_KEY) || '0', 10) || 0; } catch (e) { }
        if (start > 0 && start < N) { goPage(start, false); toast('كملنا من صفحة ' + (start + 1)); }
        onScroll(true);

        $('bSearch').disabled = false; $('bThumbs').disabled = false;
        hideState();
        scroller.focus({ preventScroll: true });
    }

    /* ---------- وضع بديل لـ Google Drive (من غير API key) ---------- */
    function fallbackDrive(id) {
        reader.classList.add('fallback');
        const fb = $('fb');
        fb.style.setProperty('--fbtop', (document.getElementById('top').getBoundingClientRect().bottom + 8) + 'px');
        fb.innerHTML = '<iframe src="https://drive.google.com/file/d/' + id + '/preview" allow="autoplay" referrerpolicy="no-referrer" tabindex="-1"></iframe><div class="blk"></div><div class="wmv" id="wmv"></div>';
        const w = $('wmv');
        const nodes = [0, 1, 2].map(() => { const i = document.createElement('i'); i.textContent = WM_TEXT; w.appendChild(i); return i; });
        const place = () => nodes.forEach(n => { n.style.left = (5 + Math.random() * 60) + '%'; n.style.top = (8 + Math.random() * 78) + '%'; });
        place(); setInterval(place, 8000);
        hideState();
    }

    /* ======================================================
       أزرار التنقل
    ====================================================== */
    $('bPrev').onclick = () => goPage(curPage - 1, true);
    $('bNext').onclick = () => goPage(curPage + 1, true);
    $('bZin').onclick = () => stepZoom(1);
    $('bZout').onclick = () => stepZoom(-1);
    $('zVal').onclick = () => { zoomTo(1); toast('ضبط على العرض'); };
    $('bNight').onclick = () => {
        reader.classList.toggle('night');
        try { localStorage.setItem('pr_night', reader.classList.contains('night') ? '1' : '0'); } catch (e) { }
        setNightIcon();
    };
    $('bBack').onclick = () => {
        try { if (document.referrer && new URL(document.referrer).host === location.host && history.length > 1) { history.back(); return; } } catch (e) { }
        location.href = 'index.html';
    };

    // القفز لصفحة
    $('pgBtn').onclick = () => {
        const b = $('pgBtn'); if (b.querySelector('input')) return;
        const inp = document.createElement('input'); inp.type = 'number'; inp.min = 1; inp.max = N; inp.value = curPage + 1; inp.inputMode = 'numeric';
        const cur = $('pgCur'); cur.style.display = 'none'; b.insertBefore(inp, cur);
        inp.focus(); inp.select();
        const done = go => {
            const v = parseInt(inp.value, 10);
            inp.remove(); cur.style.display = '';
            if (go && v >= 1 && v <= N) goPage(v - 1, true);
        };
        inp.onkeydown = e => { e.stopPropagation(); if (e.key === 'Enter') done(true); else if (e.key === 'Escape') done(false); };
        inp.onblur = () => done(true);
    };

    /* ======================================================
       اللمس: pinch + double-tap + إظهار/إخفاء
    ====================================================== */
    let pin = null;
    const dist = (a, b) => Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    scroller.addEventListener('touchstart', e => {
        if (e.touches.length === 2) {
            const a = e.touches[0], b = e.touches[1], rect = scroller.getBoundingClientRect();
            const cx = (a.clientX + b.clientX) / 2 - rect.left, cy = (a.clientY + b.clientY) / 2 - rect.top;
            pin = { d: dist(a, b), cx, cy, r: 1 };
            pagesEl.style.transformOrigin = (scroller.scrollLeft + cx) + 'px ' + (scroller.scrollTop + cy - pagesEl.offsetTop) + 'px';
        }
    }, { passive: true });
    scroller.addEventListener('touchmove', e => {
        if (pin && e.touches.length === 2) {
            e.preventDefault();
            let r = dist(e.touches[0], e.touches[1]) / pin.d;
            r = Math.max(MINZ / z, Math.min(MAXZ / z, r));
            pin.r = r; pagesEl.style.transform = 'scale(' + r + ')';
        }
    }, { passive: false });
    const endPinch = e => {
        if (pin && e.touches.length < 2) {
            const p = pin; pin = null;
            pagesEl.style.transform = ''; pagesEl.style.transformOrigin = '';
            zoomTo(z * p.r, p.cx, p.cy);
        }
    };
    scroller.addEventListener('touchend', endPinch, { passive: true });
    scroller.addEventListener('touchcancel', endPinch, { passive: true });
    ['gesturestart', 'gesturechange', 'gestureend'].forEach(ev => document.addEventListener(ev, e => e.preventDefault()));

    // ctrl + عجلة الماوس = zoom
    scroller.addEventListener('wheel', e => {
        if (!(e.ctrlKey || e.metaKey)) return;
        e.preventDefault();
        const rect = scroller.getBoundingClientRect();
        zoomTo(z * (e.deltaY < 0 ? 1.12 : 1 / 1.12), e.clientX - rect.left, e.clientY - rect.top);
    }, { passive: false });

    // نقرة واحدة (إظهار/إخفاء) ونقرتين (zoom)
    let lastTap = 0, tapT = null, lx = 0, ly = 0;
    scroller.addEventListener('click', e => {
        if (!N) return;
        const now = Date.now(), rect = scroller.getBoundingClientRect();
        const cx = e.clientX - rect.left, cy = e.clientY - rect.top;
        if (now - lastTap < 300 && Math.hypot(cx - lx, cy - ly) < 40) {
            clearTimeout(tapT); lastTap = 0;
            zoomTo(z > 1.2 ? 1 : 2, cx, cy);
            return;
        }
        lastTap = now; lx = cx; ly = cy;
        closePanels();
        if (coarse) tapT = setTimeout(() => reader.classList.toggle('off'), 290);
    });

    /* ======================================================
       الصفحات المصغّرة
    ====================================================== */
    const thumbs = $('thumbs'), scrim = $('scrim'), tgrid = $('tgrid');
    let thumbsBuilt = false;
    const tq = []; let tbusy = false;
    const panelOpen = () => thumbs.classList.contains('open') || $('search').classList.contains('open');

    function buildThumbs() {
        if (thumbsBuilt) return; thumbsBuilt = true;
        const io = new IntersectionObserver(es => {
            es.forEach(en => { if (en.isIntersecting) { io.unobserve(en.target); tq.push(en.target); thumbPump(); } });
        }, { root: tgrid, rootMargin: '200px 0px' });
        for (let i = 0; i < N; i++) {
            const d = document.createElement('button'); d.className = 'th'; d.dataset.i = i; d.setAttribute('aria-label', 'صفحة ' + (i + 1));
            d.innerHTML = '<div class="box"></div><span>' + (i + 1) + '</span>';
            d.firstChild.style.aspectRatio = sizes[i].w + ' / ' + sizes[i].h;
            d.onclick = () => { goPage(i, false); if (window.innerWidth < 760) closePanels(); };
            tgrid.appendChild(d); io.observe(d);
        }
        markThumb();
    }
    async function thumbPump() {
        if (tbusy) return; tbusy = true;
        while (tq.length) {
            const d = tq.shift(), i = +d.dataset.i;
            try {
                const page = R[i].page || (R[i].page = await doc.getPage(i + 1));
                const bw = d.firstChild.clientWidth || 140;
                const vp = page.getViewport({ scale: bw * dpr / sizes[i].w });
                const c = document.createElement('canvas'); c.width = Math.floor(vp.width); c.height = Math.floor(vp.height);
                await page.render({ canvasContext: c.getContext('2d', { alpha: false }), viewport: vp, background: '#ffffff' }).promise;
                d.firstChild.appendChild(c);
            } catch (e) { }
        }
        tbusy = false;
    }
    let lastMark = -1;
    function markThumb() {
        if (!thumbsBuilt || lastMark === curPage) return;
        lastMark = curPage;
        const prev = tgrid.querySelector('.th.cur'); if (prev) prev.classList.remove('cur');
        const el = tgrid.children[curPage]; if (el) { el.classList.add('cur'); if (thumbs.classList.contains('open')) el.scrollIntoView({ block: 'nearest' }); }
    }
    function openThumbs() { buildThumbs(); closeSearch(); thumbs.classList.add('open'); scrim.classList.add('on'); $('bThumbs').classList.add('on'); reader.classList.remove('off'); const el = tgrid.children[curPage]; if (el) setTimeout(() => el.scrollIntoView({ block: 'center' }), 60); }
    function closeThumbs() { thumbs.classList.remove('open'); scrim.classList.remove('on'); $('bThumbs').classList.remove('on'); }
    $('bThumbs').onclick = () => thumbs.classList.contains('open') ? closeThumbs() : openThumbs();
    $('tClose').onclick = closeThumbs; scrim.onclick = closeThumbs;

    /* ======================================================
       البحث
    ====================================================== */
    const sInput = $('sInput');
    let pageTxt = [], indexed = 0, indexing = false, anyText = false;
    let hits = [], hitK = -1, searchT = null;
    const AR = '٠١٢٣٤٥٦٧٨٩';
    const norm = s => s.replace(/[\u064B-\u065F\u0670\u0640\u200c-\u200f]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/[٠-٩]/g, d => AR.indexOf(d)).replace(/\s+/g, ' ').toLowerCase();

    async function buildIndex() {
        if (indexing || indexed >= N) return;
        indexing = true;
        for (let i = indexed; i < N; i++) {
            try {
                const page = R[i].page || (R[i].page = await doc.getPage(i + 1));
                const tc = await page.getTextContent();
                const items = tc.items.filter(it => typeof it.str === 'string' && it.str.length);
                let joined = '', st = [], ns = [];
                items.forEach(it => { const n = norm(it.str); st.push(joined.length); ns.push(n); joined += n + ' '; });
                if (joined.trim()) anyText = true;
                pageTxt[i] = { items, st, ns, joined };
            } catch (e) { pageTxt[i] = { items: [], st: [], ns: [], joined: '' }; }
            indexed = i + 1;
            if (i % 8 === 0) {
                if ($('search').classList.contains('open') && indexed < N) $('sNote').textContent = 'جاري تجهيز البحث… ' + Math.round(indexed / N * 100) + '%';
                await new Promise(r => setTimeout(r, 0));
                if (sInput.value.trim().length > 1 && i % 24 === 0) runSearch(true);
            }
        }
        indexing = false;
        $('sNote').textContent = anyText ? '' : 'الملف ده صور (مسحوب ضوئيًا) فالبحث النصي مش متاح.';
        if (sInput.value.trim().length > 1) runSearch(true);
    }

    function runSearch(keep) {
        const q = norm(sInput.value.trim());
        const prevHit = hits[hitK];
        hits = [];
        if (q.length > 1) {
            for (let i = 0; i < indexed && hits.length < 800; i++) {
                const j = pageTxt[i] && pageTxt[i].joined; if (!j) continue;
                let p = 0;
                while ((p = j.indexOf(q, p)) >= 0) { hits.push({ p: i, a: p, b: p + q.length }); p += q.length; if (hits.length >= 800) break; }
            }
        }
        if (keep && prevHit) { const k = hits.findIndex(h => h.p === prevHit.p && h.a === prevHit.a); hitK = k >= 0 ? k : Math.min(hitK, hits.length - 1); }
        else { hitK = hits.length ? Math.max(0, hits.findIndex(h => h.p >= curPage)) : -1; if (hits.length && hitK < 0) hitK = 0; }
        updateCount();
        for (let i = 0; i < N; i++) if (R[i].canvas) drawHL(i);
        if (!keep && hitK >= 0) focusHit();
    }
    function updateCount() {
        const has = hits.length > 0;
        $('sCount').textContent = sInput.value.trim().length < 2 ? '' : (has ? (hitK + 1) + ' / ' + hits.length : 'لا نتائج');
        $('sPrev').disabled = $('sNext').disabled = !has;
    }
    function rectsFor(h, vp) {
        const pt = pageTxt[h.p]; if (!pt) return [];
        const out = [];
        for (let k = 0; k < pt.items.length; k++) {
            const s0 = pt.st[k], e0 = s0 + pt.ns[k].length;
            if (e0 <= h.a || s0 >= h.b || !pt.ns[k].length) continue;
            const len = pt.ns[k].length;
            const f0 = (Math.max(h.a, s0) - s0) / len, f1 = (Math.min(h.b, e0) - s0) / len;
            const it = pt.items[k];
            const t = pdfjsLib.Util.transform(vp.transform, it.transform);
            const w = it.width * vp.scale, fh = Math.hypot(t[2], t[3]);
            const rtl = it.dir === 'rtl';
            const left = t[4] + (rtl ? w * (1 - f1) : w * f0);
            out.push({ x: left, y: t[5] - fh * 0.92, w: Math.max(3, w * (f1 - f0)), h: fh * 1.15 });
        }
        return out;
    }
    function drawHL(i) {
        const rec = R[i]; if (!rec.hl) return;
        rec.hl.innerHTML = '';
        if (!hits.length || !rec.page) return;
        const cssW = Math.round(availW * z);
        const vp = rec.page.getViewport({ scale: cssW / sizes[i].w });
        hits.forEach((h, idx) => {
            if (h.p !== i) return;
            rectsFor(h, vp).forEach(r => {
                const d = document.createElement('i');
                d.style.cssText = 'left:' + r.x + 'px;top:' + r.y + 'px;width:' + r.w + 'px;height:' + r.h + 'px';
                if (idx === hitK) d.className = 'cur';
                rec.hl.appendChild(d);
            });
        });
    }
    function focusHit() {
        const h = hits[hitK]; if (!h) return;
        const rec = R[h.p];
        const cssW = Math.round(availW * z);
        const vp = rec.page.getViewport({ scale: cssW / sizes[h.p].w });
        const rs = rectsFor(h, vp);
        const y = rs.length ? rs[0].y : 0;
        const x = rs.length ? rs[0].x : 0;
        scroller.scrollTo({ top: tops[h.p] + y - scroller.clientHeight / 3, left: z > 1.05 ? Math.max(0, rec.el.offsetLeft + x - scroller.clientWidth / 2) : scroller.scrollLeft, behavior: 'smooth' });
        for (let i = 0; i < N; i++) if (R[i].canvas) drawHL(i);
    }
    function stepHit(d) { if (!hits.length) return; hitK = (hitK + d + hits.length) % hits.length; updateCount(); focusHit(); }

    function openSearch() {
        closeThumbs(); $('search').classList.add('open'); $('bSearch').classList.add('on'); reader.classList.remove('off');
        buildIndex(); setTimeout(() => { sInput.focus(); sInput.select(); }, 120);
    }
    function closeSearch() {
        $('search').classList.remove('open'); $('bSearch').classList.remove('on'); sInput.blur();
        hits = []; hitK = -1; updateCount();
        for (let i = 0; i < N; i++) if (R[i] && R[i].hl) R[i].hl.innerHTML = '';
    }
    function closePanels() { closeThumbs(); if ($('search').classList.contains('open')) closeSearch(); }
    $('bSearch').onclick = () => $('search').classList.contains('open') ? closeSearch() : openSearch();
    $('sClose').onclick = closeSearch;
    $('sPrev').onclick = () => stepHit(-1);
    $('sNext').onclick = () => stepHit(1);
    sInput.addEventListener('input', () => { clearTimeout(searchT); searchT = setTimeout(() => runSearch(false), 220); });
    sInput.addEventListener('keydown', e => {
        e.stopPropagation();
        if (e.key === 'Enter') { e.preventDefault(); stepHit(e.shiftKey ? -1 : 1); }
        else if (e.key === 'Escape') closeSearch();
    });

    /* ======================================================
       كيبورد
    ====================================================== */
    document.addEventListener('keydown', e => {
        if (!N) return;
        const c = e.ctrlKey || e.metaKey, k = e.key;
        if (c && (k === 'f' || k === 'F')) { e.preventDefault(); openSearch(); return; }
        if (c && (k === '+' || k === '=')) { e.preventDefault(); stepZoom(1); return; }
        if (c && k === '-') { e.preventDefault(); stepZoom(-1); return; }
        if (c && k === '0') { e.preventDefault(); zoomTo(1); return; }
        if (document.activeElement && document.activeElement.tagName === 'INPUT') return;
        if (k === 'Escape') { closePanels(); return; }
        if (k === '/') { e.preventDefault(); openSearch(); return; }
        if (k === '+' || k === '=') { stepZoom(1); return; }
        if (k === '-') { stepZoom(-1); return; }
        if (k === 'Home') { e.preventDefault(); goPage(0, true); return; }
        if (k === 'End') { e.preventDefault(); goPage(N - 1, true); return; }
        if (z <= 1.05 && k === 'ArrowLeft') { e.preventDefault(); goPage(curPage + 1, true); return; }
        if (z <= 1.05 && k === 'ArrowRight') { e.preventDefault(); goPage(curPage - 1, true); return; }
        if (k === 'n' || k === 'N') { $('bNight').click(); }
    });

    /* ======================================================
       تغيير الحجم / تدوير الشاشة
    ====================================================== */
    let rsT = null, lastSW = 0;
    new ResizeObserver(() => {
        const w = scroller.clientWidth;
        if (!N || !lastSW) { lastSW = w; return; }
        if (w === lastSW) { onScroll(true); return; }
        lastSW = w;
        clearTimeout(rsT);
        rsT = setTimeout(() => layout(pageAnchor()), 120);
    }).observe(scroller);
    // أثناء السحب السريع نضمن الرسم
    window.addEventListener('orientationchange', () => setTimeout(() => N && layout(pageAnchor()), 350));

    /* ======================================================
       حماية (طبقة ردع — الحماية الحقيقية على السيرفر)
    ====================================================== */
    document.addEventListener('contextmenu', e => { if (!(e.target && e.target.tagName === 'INPUT')) e.preventDefault(); });
    document.addEventListener('dragstart', e => e.preventDefault());
    document.addEventListener('copy', e => { if (!(e.target && e.target.tagName === 'INPUT')) e.preventDefault(); });
    document.addEventListener('keydown', e => {
        const c = e.ctrlKey || e.metaKey, s = e.shiftKey, k = (e.key || '').toUpperCase();
        if (e.key === 'F12' || (c && ['U', 'S', 'P'].includes(k)) || (c && s && ['I', 'J', 'C'].includes(k))) {
            e.preventDefault(); e.stopPropagation(); toast('الإجراء ده غير مسموح');
        }
    }, true);
    window.addEventListener('beforeprint', () => { document.body.style.display = 'none'; });
    window.addEventListener('afterprint', () => { document.body.style.display = ''; });
    const fine = window.matchMedia('(pointer:fine)');
    setInterval(() => {
        if (!fine.matches) return;
        const open = (window.outerWidth - window.innerWidth > 220) || (window.outerHeight - window.innerHeight > 260);
        pagesEl.style.filter = open ? 'blur(26px)' : '';
    }, 1000);
    window.addEventListener('pagehide', () => { try { localStorage.setItem(POS_KEY, String(curPage)); } catch (e) { } });

    VG.gate(ctx, {
        notify: toast,
        kick: () => { try { doc && doc.destroy && doc.destroy(); } catch (e) { } try { pagesEl.innerHTML = ''; } catch (e) { } }
    }).then(ok => { if (ok) open(); });
})();
