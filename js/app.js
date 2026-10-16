/* ===== data-cache ===== */
/* كاش في المتصفح: بيحمّل من Supabase مرة واحدة ويخزّن، وما يطلبش تاني إلا لو student_sync قال إن في تغيير.
   توكن 'c' = نسخة الكورسات (courses_v)، توكن 'p' = حالة اشتراكات الطالب. */
window.DataCache=(function(){
  var PFX='lc_',TOKK='lc_tok',TTL=24*3600*1000,mem={},inflight={},T={c:null,p:null};
  try{var t=JSON.parse(localStorage.getItem(TOKK)||'null');if(t){T.c=t.c==null?null:t.c;T.p=t.p==null?null:t.p;}}catch(e){}
  function saveTok(){try{localStorage.setItem(TOKK,JSON.stringify(T));}catch(e){}}
  function read(k){
    if(mem[k])return mem[k];
    try{var r=localStorage.getItem(PFX+k);if(r){var e=JSON.parse(r);mem[k]=e;return e;}}catch(x){}
    return null;
  }
  function valid(e){return e&&e.c===T.c&&(e.s==='c'||e.p===T.p)&&(Date.now()-e.t)<TTL;}
  function retag(f,v){
    Object.keys(mem).forEach(function(k){if(mem[k][f]===null)mem[k][f]=v;});
    try{for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);
      if(k&&k.indexOf(PFX)===0&&k!==TOKK){var e=JSON.parse(localStorage.getItem(k));
        if(e&&e[f]===null){e[f]=v;localStorage.setItem(k,JSON.stringify(e));}}}}catch(x){}
  }
  function purge(){try{var ks=[];for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(k&&k.indexOf(PFX)===0&&k!==TOKK)ks.push(k);}ks.forEach(function(k){localStorage.removeItem(k);});}catch(x){}}
  var C={
    get:function(scope,key){var e=read(key);return valid(e)?e.d:undefined;},
    set:function(scope,key,d){
      var e={t:Date.now(),s:scope,c:T.c,d:d};if(scope==='p')e.p=T.p;
      mem[key]=e;
      try{localStorage.setItem(PFX+key,JSON.stringify(e));}catch(x){purge();try{localStorage.setItem(PFX+key,JSON.stringify(e));}catch(y){}}
    },
    /* بيرجع true لو التوكن اتغيّر عن قيمة قديمة معروفة (يعني الكاش القديم بقى باطل) */
    setToken:function(f,v){
      if(v===undefined||v===null)return false;v=String(v);
      var old=T[f];if(old===v)return false;
      T[f]=v;saveTok();
      if(old===null){retag(f,v);return false;}
      return true;
    },
    /* بعد أي إجراء محلي بيغيّر الاشتراكات (شراء/كود/طلب) */
    bump:function(f){T[f]='b'+Date.now()+Math.random().toString(36).slice(2,6);saveTok();},
    /* q: يرجّع {data,error} من الكاش لو صالح، وإلا ينفّذ الطلب ويخزّن النتيجة لو مفيش خطأ */
    q:function(scope,key,fn){
      var hit=C.get(scope,key);
      if(hit!==undefined)return Promise.resolve({data:hit,error:null});
      if(inflight[key])return inflight[key];
      var pr=Promise.resolve(fn()).then(function(r){
        if(r&&!r.error&&r.data)C.set(scope,key,r.data);
        return r;
      }).finally(function(){delete inflight[key];});
      inflight[key]=pr;return pr;
    },
    clear:function(){mem={};inflight={};T={c:null,p:null};purge();try{localStorage.removeItem(TOKK);}catch(x){}}
  };
  return C;
})();

/* ===== placeholder-img ===== */
        // صورة بديلة محلية (بدل via.placeholder.com اللي بيفشل ويتكرر)
        window.__PH = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="180" viewBox="0 0 300 180">' +
            '<rect width="300" height="180" fill="#0f172a"/>' +
            '<text x="150" y="98" font-family="Arial,sans-serif" font-size="22" font-weight="700" fill="#2563eb" text-anchor="middle">The Leader</text></svg>');
    

/* ===== esc-helper ===== */
window.escH=function(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})};
/* يمسح مفاتيح التطبيق بس عند الخروج (مش كل localStorage للدومين) */
window.clearAppStorage=function(){try{var ks=[];for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(k==='studentData'||/^(leader_|avatar_url_|notes_|lc_)/.test(k))ks.push(k)}ks.forEach(function(k){localStorage.removeItem(k)})}catch(e){}try{window.DataCache&&DataCache.clear();}catch(e){}};

/* ===== script ===== */
        window.PayHUD = (function () {
            const el = () => document.getElementById('payHud');
            const tx = () => document.getElementById('payHudText');
            let t0 = 0, timer = null, nextTimer = null, showing = false, curText = '';
            const queue = [];   // رسائل notify مستنية دورها
            const sleep = (ms) => new Promise(r => setTimeout(r, ms));
            function set(state, text) {
                const h = el(); if (!h) return;
                clearTimeout(timer); clearTimeout(nextTimer);
                h.dataset.state = state;
                tx().textContent = text || '';
                h.classList.add('active');
            }
            // حالات الدفع (loading/success/error/pending) ليها الأولوية وبتفضّي طابور الرسائل
            function takeOver() { showing = false; queue.length = 0; }
            function showNext() {
                const item = queue.shift();
                if (!item) { showing = false; return; }
                showing = true; curText = item.text;
                set(item.type, item.text);
                timer = setTimeout(() => {
                    const h = el(); if (h) h.classList.remove('active');
                    if (queue.length) nextTimer = setTimeout(showNext, 250);
                    else showing = false;
                }, item.ms);
            }
            return {
                show(text) { t0 = Date.now(); takeOver(); set('loading', text || 'جاري المعالجة...'); },
                // يستنى شوية لو الـ loading ظهر لحظة بس عشان ما يبقاش فلاش
                async success(text) { const w = 650 - (Date.now() - t0); if (w > 0) await sleep(w); takeOver(); set('success', text || 'تم الدفع بنجاح'); },
                // للرسائل العامة: success | error | warning | info — لو في رسالة معروضة الرسالة الجديدة بتستنى دورها
                notify(type, text, ms) {
                    const item = { type, text, ms: ms || (type === 'error' ? 3500 : 3000) };
                    if (showing) {
                        const last = queue[queue.length - 1];
                        if (text === curText || (last && last.text === text)) return;
                        if (queue.length < 4) queue.push(item);
                        return;
                    }
                    queue.push(item);
                    showNext();
                },
                async error(text, ms) {
                    const w = 650 - (Date.now() - t0); if (w > 0) await sleep(w);
                    takeOver();
                    set('error', text || 'حدث خطأ');
                    timer = setTimeout(() => { const h = el(); if (h) h.classList.remove('active'); }, ms || 3500);
                },
                async pending(text) { const w = 650 - (Date.now() - t0); if (w > 0) await sleep(w); takeOver(); set('pending', text || 'تم إرسال الطلب'); },
                hide(delay) {
                    const h = el(); if (!h) return;
                    takeOver();
                    clearTimeout(timer); clearTimeout(nextTimer);
                    timer = setTimeout(() => h.classList.remove('active'), delay || 0);
                }
            };
        })();
    

/* ===== script ===== */
/* بعد تغيير مفاتيح Supabase: تنظيف مرة واحدة لأي جلسة قديمة محفوظة في المتصفح (بتخلي الاتصال يفشل) */
try{var V='keys-2026-09';if(localStorage.getItem('sb_key_ver')!==V){Object.keys(localStorage).forEach(function(k){if(/^sb-.*-auth-token/.test(k))localStorage.removeItem(k)});localStorage.setItem('sb_key_ver',V)}}catch(e){}

/* ===== script ===== */
        // ═══════════════════════════════════════════════════════════════
        //  GLOBAL SEARCH SYSTEM
        // ═══════════════════════════════════════════════════════════════
        // ═══════════════════════════════════════════════════════════════
        //  GLOBAL SEARCH — Professional Edition
        //  يجيب كل البيانات من Supabase مرة واحدة ويبحث في كل الأقسام
        // ═══════════════════════════════════════════════════════════════

        let currentHighlightedElement = null;

        const GlobalSearch = {
            _index: [],          // كل الكورسات من Supabase
            _loaded: false,
            _loading: false,
            _debounceTimer: null,

            // جيب كل الكورسات من Supabase مرة واحدة وخزنها
            async buildIndex() {
                if (this._loaded || this._loading) return;
                this._loading = true;
                try {
                    const grade = (StudentApp?.state?.currentUser?.grade || '').trim();
                    let query = StudentApp.client.from('courses_public').select('id, title, description, instructor, type, grade');
                    if (grade) query = query.eq('grade', grade);
                    const { data, error } = await DataCache.q('c', 'si:' + grade, () => query.order('sort_order', { ascending: true }));
                    if (error || !data) return;
                    this._index = data.map(c => {
                        let type = 'كورس', icon = 'fas fa-play-circle', tab = 'courses';
                        if (c.type === 'pdf') { type = 'مذكرة PDF'; icon = 'fas fa-file-pdf'; tab = 'notes'; }
                        else if (c.type === 'playlist') { type = 'قائمة تشغيل'; icon = 'fas fa-list'; tab = 'playlists'; }
                        return {
                            id: c.id,
                            title: (c.title || '').trim(),
                            description: (c.description || '').trim(),
                            instructor: (c.instructor || '').trim(),
                            courseType: c.type || 'video',
                            type, icon, tab,
                        };
                    }).filter(c => c.title);
                    this._loaded = true;
                } catch (e) { console.error('[Search] buildIndex error:', e); }
                finally { this._loading = false; }
            },

            // ربط الأحداث مرة واحدة (بدل onclick جوه الـ HTML)
            init() {
                const box = document.getElementById('searchResults');
                if (!box || box._bound) return;
                box._bound = true;
                box.addEventListener('click', (e) => {
                    const el = e.target.closest('.search-result-item');
                    if (!el) return;
                    if (el.hasAttribute('data-teacher')) this.navigateToTeacher(el.getAttribute('data-teacher'));
                    else if (el.dataset.id) this.navigateTo(el.dataset.id, el.dataset.tab);
                });
            },

            // بحث بـ debounce 200ms
            async search(rawQuery) {
                clearTimeout(this._debounceTimer);
                this._debounceTimer = setTimeout(() => this._doSearch(rawQuery), 200);
            },

            async _doSearch(rawQuery) {
                const box = document.getElementById('searchResults');
                const clearBtn = document.getElementById('clearSearchBtn');
                const q = (rawQuery || '').trim();

                if (!q) {
                    box.style.display = 'none';
                    clearBtn.style.display = 'none';
                    clearCurrentHighlight();
                    return;
                }
                clearBtn.style.display = 'block';

                // أول بحث — ابني الـ index
                if (!this._loaded) {
                    box.innerHTML = '<div class="search-no-results"><i class="fas fa-spinner fa-spin"></i><p>جاري التحميل...</p></div>';
                    box.style.display = 'block';
                    await this.buildIndex();
                }

                //  لو الطالب في تبويب "مدرسينك" — البحث بيبقى بأسماء المدرسين بس
                const activeBtn = document.querySelector('.tab-btn.active');
                const currentTab = activeBtn?.getAttribute('onclick')?.match(/switchTab\('(\w+)'\)/)?.[1];
                if (currentTab === 'teachers') {
                    this._doTeacherSearch(q, box);
                    return;
                }

                const terms = q.toLowerCase().split(/\s+/).filter(Boolean);

                // Score: كلما زادت الكلمات المطابقة كلما ارتفع الـ score
                const scored = this._index.map(item => {
                    const haystack = [item.title, item.description, item.instructor].join(' ').toLowerCase();
                    let score = 0;
                    for (const t of terms) {
                        if (item.title.toLowerCase().includes(t)) score += 10;
                        if (item.instructor.toLowerCase().includes(t)) score += 5;
                        if (item.description.toLowerCase().includes(t)) score += 2;
                    }
                    return { ...item, score };
                }).filter(i => i.score > 0).sort((a, b) => b.score - a.score).slice(0, 20);

                if (!scored.length) {
                    box.innerHTML = `<div class="search-no-results">
                        <i class="fas fa-search"></i>
                        <p>لم نجد نتائج تطابق "<strong>${escH(q)}</strong>"</p>
                        <small>حاول البحث عن كلمات مختلفة</small>
                    </div>`;
                    box.style.display = 'block';
                    return;
                }

                // عرض النتائج مع badge للقسم
                const tabLabels = { courses: 'كورسات', notes: 'مذكرات', playlists: 'قوائم تشغيل' };
                box.innerHTML = scored.map(item => {
                    const tabBadge = `<span style="font-size:0.7rem;background:rgba(37,99,235,0.15);color:var(--primary);border-radius:5px;padding:2px 7px;margin-inline-start:6px;">${tabLabels[item.tab]}</span>`;
                    const instructorHtml = item.instructor ? `<span style="opacity:.7"> — ${escH(item.instructor)}</span>` : '';
                    return `<div class="search-result-item" data-id="${escH(item.id)}" data-tab="${escH(item.tab)}" style="cursor:pointer;">
                        <div class="search-result-icon"><i class="${item.icon}"></i></div>
                        <div class="search-result-content">
                            <div class="search-result-title">${escH(item.title)}${tabBadge}</div>
                            <div class="search-result-type">${item.type}${instructorHtml}</div>
                        </div>
                        <div style="color:var(--primary);font-size:0.8rem;opacity:0.6;"><i class="fas fa-arrow-left"></i></div>
                    </div>`;
                }).join('');
                box.style.display = 'block';
            },

            //  بحث مخصص بأسماء المدرسين فقط (يُستخدم وقت ما الطالب يكون في تبويب "مدرسينك")
            _doTeacherSearch(q, box) {
                const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
                const teachersMap = {};
                this._index.forEach(item => {
                    const key = StudentApp.ui.normalizeTeacherName(item.instructor);
                    if (!key) return;
                    if (!teachersMap[key]) teachersMap[key] = { name: item.instructor, count: 0 };
                    teachersMap[key].count += 1;
                });
                const scored = Object.values(teachersMap).map(t => {
                    let score = 0;
                    const nameLower = t.name.toLowerCase();
                    for (const term of terms) if (nameLower.includes(term)) score += 10;
                    return { ...t, score };
                }).filter(t => t.score > 0).sort((a, b) => b.score - a.score).slice(0, 20);

                if (!scored.length) {
                    box.innerHTML = `<div class="search-no-results">
                        <i class="fas fa-search"></i>
                        <p>لم نجد مدرس باسم "<strong>${escH(q)}</strong>"</p>
                        <small>جرّب اسم مدرس مختلف</small>
                    </div>`;
                    box.style.display = 'block';
                    return;
                }

                box.innerHTML = scored.map(t => {
                    const countLabel = t.count === 1 ? 'محتوى واحد' : `${t.count} محتوى`;
                                        return `<div class="search-result-item" data-teacher="${escH(t.name)}" style="cursor:pointer;">
                        <div class="search-result-icon"><i class="fas fa-chalkboard-teacher"></i></div>
                        <div class="search-result-content">
                            <div class="search-result-title">${escH(t.name)}</div>
                            <div class="search-result-type">${countLabel}</div>
                        </div>
                        <div style="color:var(--primary);font-size:0.8rem;opacity:0.6;"><i class="fas fa-arrow-left"></i></div>
                    </div>`;
                }).join('');
                box.style.display = 'block';
            },

            // فتح بروفايل المدرس من نتيجة البحث
            navigateToTeacher(teacherName) {
                const box = document.getElementById('searchResults');
                const input = document.getElementById('globalSearch');
                box.style.display = 'none';
                input.value = '';
                document.getElementById('clearSearchBtn').style.display = 'none';
                StudentApp.actions.openTeacherProfile(teacherName);
            },

            // الانتقال للقسم الصحيح وتمييز الكارد
            async navigateTo(itemId, targetTab) {
                const box = document.getElementById('searchResults');
                const input = document.getElementById('globalSearch');
                box.style.display = 'none';
                input.value = '';
                document.getElementById('clearSearchBtn').style.display = 'none';
                clearCurrentHighlight();

                const activeBtn = document.querySelector('.tab-btn.active');
                const currentTab = activeBtn?.getAttribute('onclick')?.match(/switchTab\('(\w+)'\)/)?.[1];

                const scrollAndHighlight = () => {
                    const el = document.querySelector(`.course-card[data-course-id="${(window.CSS && CSS.escape) ? CSS.escape(String(itemId)) : itemId}"]`);
                    if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); applyHighlight(el); }
                };

                if (currentTab === targetTab) {
                    setTimeout(scrollAndHighlight, 100);
                } else {
                    await StudentApp.ui.switchTab(targetTab);
                    setTimeout(scrollAndHighlight, 300);
                }
            },

            // إعادة بناء الـ index لو تغيرت بيانات الطالب (مثلاً تغير الصف)
            invalidate() { this._loaded = false; this._index = []; },
        };

        // بناء الـ index بيتم من showDashboard (بعد تسجيل الدخول) أو أول مرة الطالب يبحث

        function performGlobalSearch(query) { GlobalSearch.search(query); }

        function applyHighlight(element) {
            clearCurrentHighlight();
            element.classList.add('search-highlight');
            currentHighlightedElement = element;
            setTimeout(() => { if (element === currentHighlightedElement) { element.classList.remove('search-highlight'); currentHighlightedElement = null; } }, 5000);
        }

        function clearCurrentHighlight() { if (currentHighlightedElement) { currentHighlightedElement.classList.remove('search-highlight'); currentHighlightedElement = null; } }
        function clearGlobalSearch(noFocus) { document.getElementById('globalSearch').value = ''; document.getElementById('searchResults').style.display = 'none'; document.getElementById('searchResults').innerHTML = ''; document.getElementById('clearSearchBtn').style.display = 'none'; clearCurrentHighlight(); if (!noFocus) document.getElementById('globalSearch').focus(); }
    

/* ===== script ===== */
        // ═══════════════════════════════════════════════════════════════
        //  STUDENT APP — ALL 6 FIXES APPLIED
        // ═══════════════════════════════════════════════════════════════

        const StudentApp = {
            config: {
                supabaseUrl: "https://yxhajhwdbsxblbcpjtci.supabase.co",
                supabaseKey: "sb_publishable_ipr1S60Tq_u3pJQOqgvgNw_o1FMkGeX"
            },
            client: null,
            state: {
                currentUser: null,
                purchasedIds: [],
                playlistChildIds: [],
                openPlaylistId: null,
                _playlistReturnTeacher: null,
                directPurchasedIds: [],
                pendingIds: [],
                isRecoveryMode: false,
                currentCourse: null,
                selectedPaymentMethod: null,
                alertTimeout: null,
                _channels: [],
                _channelNames: [],
                //  FIX #3 — flag لمنع الإرسال المتكرر
                _isSubmitting: false,
                // 🆕 منع فتح نفس الحساب على أكتر من جهاز في نفس الوقت
                mySessionId: null,
                _justLoggedIn: false,
            },

            init: function () {
                this.client = supabase.createClient(this.config.supabaseUrl, this.config.supabaseKey);
                if (window.location.hash.includes('type=recovery')) this.state.isRecoveryMode = true;
                this.setupEventListeners();
                this.client.auth.onAuthStateChange((event, session) => {
                    if (event === 'PASSWORD_RECOVERY') this.handlePasswordRecovery();
                    else if (event === 'SIGNED_OUT' || !session) {
                        if (this.state.currentUser) window.location.reload();
                    }
                });
                this.handleSession();
            },

            //  FIX #1 — setupEventListeners بدون أي تكرار
            // الـ paymentForm بيتضاف هنا فقط — مفيش onsubmit في الـ HTML
            setupEventListeners: function () {
                document.getElementById('registerForm').addEventListener('submit', (e) => this.actions.register(e));
                document.getElementById('loginForm').addEventListener('submit', (e) => this.actions.login(e));
                document.getElementById('forgotPasswordForm').addEventListener('submit', (e) => this.actions.requestPasswordReset(e));
                document.getElementById('updatePasswordForm').addEventListener('submit', (e) => this.actions.updatePassword(e));
                //  FIX #1 — listener واحد بس هنا، مفيش onsubmit في الـ HTML
                document.getElementById('paymentForm').addEventListener('submit', (e) => this.actions.submitPayment(e));
            },

            handlePasswordRecovery: function () {
                this.state.isRecoveryMode = true;
                this.ui.hideAll();
                document.getElementById('authPage').classList.remove('hidden');
                document.getElementById('loginBox').classList.add('hidden');
                document.getElementById('updatePasswordBox').classList.remove('hidden');
                this.ui.showAlert('يرجى تعيين كلمة المرور الجديدة', 'info');
            },

            handleSession: async function () {
                if (this.state.isRecoveryMode) {
                    this.handlePasswordRecovery();
                    document.getElementById('authLoader').classList.remove('active');
                    return;
                }
                try {
                    const { data: { user } } = await this.client.auth.getUser();
                    if (!user) { this.ui.showAuth(); return; }
                    const { data: student, error } = await this.client.from('students').select('*').eq('user_id', user.id).maybeSingle();
                    if (error) { this.ui.showAlert('خطأ في جلب بيانات الملف الشخصي', 'error'); return; }
                    if (!student || student.role === 'banned') {
                        if (student?.role === 'banned') await this.client.auth.signOut();
                        this.ui.showAlert('عفواً.. هذا الحساب محظور من دخول المنصة', 'error');
                        this.ui.showAuth();
                        return;
                    }
                    if (student.role === 'pending_teacher') {
                        await this.client.auth.signOut();
                        this.ui.showAlert('طلب تسجيلك كمدرس لا يزال قيد المراجعة من قبل إدارة المنصة.', 'warning');
                        this.ui.showAuth();
                        return;
                    }
                    if (student.role === 'teacher') {
                        window.location.href = 'Teache.html';
                        return;
                    }
                    this.state.currentUser = student;
                    // 🆕 لو الصفحة اتعمللها reload من غير لوجين جديد، خد الـ session
                    // الحالية المسجلة في الداتابيز كخط أساس بدل ما تفضل فاضية
                    if (!this.state.mySessionId) { try { this.state.mySessionId = localStorage.getItem('leader_sid') || null; } catch (_) { } }
                    if (!this.state.mySessionId) {
                        try { const { data: sess } = await this.client.rpc('register_login_session'); if (sess?.success) { this.state.mySessionId = sess.session_id; try { localStorage.setItem('leader_sid', sess.session_id); } catch (_) { } this.state._justLoggedIn = true; } } catch (_) { }
                    } else if (student.active_session_id && student.active_session_id !== this.state.mySessionId) {
                        // الجهاز ده اتسحبت منه الجلسة (حد دخل بنفس الحساب من جهاز تاني)
                        try { localStorage.removeItem('leader_sid'); } catch (_) { }
                        await this.client.auth.signOut();
                        this.ui.showAlert('تم تسجيل الدخول بحسابك من جهاز آخر', 'error');
                        this.ui.showAuth();
                        return;
                    }
                    try { localStorage.setItem('studentData', JSON.stringify({ id: student.id, name: student.name, grade: student.grade, role: student.role })); } catch (_) { }
                    localStorage.setItem('leader_user', student.name);
                    if (!student.grade) this.ui.showGradeSelector();
                    else { localStorage.setItem('leader_grade', student.grade); await this.ui.showDashboard(); }
                } finally {
                    document.getElementById('authLoader').classList.remove('active');
                }
            },

            ui: {
                hideAll: function () {
                    document.getElementById('authPage').classList.add('hidden');
                    document.getElementById('gradeBox').classList.add('hidden');
                    document.getElementById('avatarPickerBox').classList.add('hidden');
                    document.getElementById('dashboard').classList.remove('active');
                    document.getElementById('profileContainer').classList.remove('visible');
                },

                showAuth: function () {
                    this.hideAll();
                    document.getElementById('authPage').classList.remove('hidden');
                    document.getElementById('loginBox').classList.remove('hidden');
                    document.getElementById('registerBox').classList.add('hidden');
                },

                showGradeSelector: function () {
                    this.hideAll();
                    document.getElementById('gradeBox').classList.remove('hidden');
                },

                showDashboard: async function () {
                    this.hideAll();
                    document.getElementById('dashboard').classList.add('active');
                    document.getElementById('profileContainer').classList.add('visible');
                    const student = StudentApp.state.currentUser;
                    updateProfileInfo(student.name, student.grade, student.balance);
                    // ⚡ الداشبورد يظهر فورًا بهيكل تحميل، والداتا بتيجي في الخلفية
                    StudentApp.ui.switchTab('courses');
                    // cleanup أولاً عشان لو الطالب غير صفه والـ realtime يشتغل صح
                    StudentApp.realtime.cleanup();
                    StudentApp.realtime.setup(student.id);
                    GlobalSearch.buildIndex();
                },

                // كل الرسائل بقت بنفس المربع الزجاجي (PayHUD) بدل التنبيه اللي كان بيظهر فوق
                showAlert: (msg, type = 'info') => {
                    const t = (type === 'success' || type === 'error' || type === 'warning') ? type : 'info';
                    PayHUD.notify(t, String(msg == null ? '' : msg).trim());
                },

                switchTab: async function (tabName) {
                    document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
                    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                    document.getElementById('playlistFullView')?.classList.add('hidden');
                    document.getElementById('teacherProfileView')?.classList.add('hidden');
                    document.getElementById(tabName + 'Tab').classList.remove('hidden');
                    const activeBtn = document.querySelector(`.tab-btn[onclick*="${tabName}"]`);
                    if (activeBtn) activeBtn.classList.add('active');
                    //  تحديث نص صندوق البحث حسب التبويب، ومسح أي نتائج بحث قديمة
                    const searchInput = document.getElementById('globalSearch');
                    if (searchInput) {
                        searchInput.placeholder = tabName === 'teachers'
                            ? 'ابحث باسم المدرس...'
                            : 'ابحث عن أي كورس أو مذكرة...';
                    }
                    if (typeof clearGlobalSearch === 'function') clearGlobalSearch(true);
                    // ⚡ تحميل سريع: كل الطلبات بتتبعت مع بعض، وبنعرض هيكل تحميل (Skeleton) بدل الشاشة الفاضية
                    const ui = StudentApp.ui;
                    const st = StudentApp.state;
                    const grade = (st.currentUser?.grade || '').trim();
                    if (st._renderedGrade !== grade) { ui.resetLists(); st._renderedGrade = grade; }
                    const listIds = { courses: 'coursesList', notes: 'notesList', playlists: 'playlistsList', purchases: 'purchasesList', teachers: 'teachersList' };
                    const container = document.getElementById(listIds[tabName]);
                    if (container && !container.childElementCount) ui.showSkeleton(container);
                    ui.progress.start();
                    try {
                        const initP = StudentApp.data.loadInitialData();
                        if (tabName === 'courses') await StudentApp.data.loadCourses(initP);
                        else if (tabName === 'notes') await StudentApp.data.loadNotes(initP);
                        else if (tabName === 'playlists') await StudentApp.data.loadPlaylists(initP);
                        else if (tabName === 'purchases') { await initP; await StudentApp.data.loadPurchases(); }
                        else if (tabName === 'teachers') await Promise.all([StudentApp.data.loadTeachers(), initP]);
                        else if (tabName === 'more') { /* قسم ثابت: مفيش داتا تتحمل */ }
                        else await initP;
                    } catch (err) {
                        console.error('[switchTab] error:', err);
                        if (container && container.querySelector('.sk-card')) {
                            container.__lgHTML = null;
                            container.innerHTML = `<div class="empty-state"><i class="fas fa-wifi"></i><p>تعذّر تحميل البيانات</p><button type="button" class="empty-action-btn" onclick="switchTab('${tabName}')"><i class="fas fa-rotate-right"></i> إعادة المحاولة</button></div>`;
                        }
                    } finally {
                        ui.progress.done();
                    }
                },

                resetLists: function () {
                    ['coursesList', 'notesList', 'playlistsList', 'purchasesList', 'teachersList'].forEach(id => {
                        const el = document.getElementById(id);
                        if (el) { el.innerHTML = ''; el.__lgHTML = null; }
                    });
                },

                showSkeleton: function (el, n = 6) {
                    el.__lgHTML = null;
                    const card = '<div class="sk-card"><div class="sk-block sk-thumb"></div><div class="sk-block sk-line" style="width:72%"></div><div class="sk-block sk-line" style="width:45%"></div><div class="sk-block sk-btn"></div></div>';
                    el.innerHTML = card.repeat(n);
                },

                progress: {
                    _n: 0,
                    _el: function () {
                        let el = document.getElementById('topProgress');
                        if (!el) { el = document.createElement('div'); el.id = 'topProgress'; el.className = 'top-progress'; document.body.appendChild(el); }
                        return el;
                    },
                    start: function () { this._n++; this._el().classList.add('active'); },
                    done: function () { this._n = Math.max(0, this._n - 1); if (!this._n) this._el().classList.remove('active'); }
                },

                createCourseCard: (course, isSubscribed = false, isPending = false) => {
                    if (!course || !course.id) return '';
                    const _safeImg = (u) => { u = String(u || '').trim(); return /^\s*(javascript:|vbscript:|data:(?!image\/))/i.test(u) ? '' : u; };
                    const thumbnail = _safeImg(course.thumbnail_url) || window.__PH;
                    const badge = course.price ? '<span class="course-badge paid">مدفوع</span>' : '<span class="course-badge">مجاني</span>';
                    const courseTitle = course.title || 'بدون عنوان';
                    const courseDesc = course.description || '';
                    const courseType = course.type || 'video';
                    const coursePrice = course.price || 0;
                    const isFree = course.is_free === true;
                    const instructor = course.instructor || '';
                    const originalPrice = course.original_price || null;
                    const hasDiscount = originalPrice && parseFloat(originalPrice) > parseFloat(coursePrice);
                    let buttonContent = '', buttonClass = 'course-button', buttonDisabled = false;
                    if (isSubscribed) {
                        if (courseType === 'video') buttonContent = '<i class="fas fa-play"></i> شاهد الدرس';
                        else if (courseType === 'pdf') buttonContent = '<i class="fas fa-book-open"></i> قراءة الملف';
                        else if (courseType === 'playlist') buttonContent = '<i class="fas fa-folder-open"></i> تصفح القائمة';
                    } else if (isPending) {
                        buttonContent = ' الطلب قيد المراجعة';
                        buttonClass += ' completed';
                        buttonDisabled = true;
                    } else {
                        if (isFree) buttonContent = courseType === 'playlist' ? '<i class="fas fa-folder-open"></i> تصفح القائمة' : ' ابدأ التعلم';
                        else buttonContent = ' اشترك الآن';
                    }
                    // كل القيم اللي جاية من الداتابيز بتتعمل لها escape قبل ما تدخل الـ HTML
                    const safeTitle = escH(courseTitle);
                    const safeInstructor = escH(instructor);
                    const instructorHtml = instructor ? `<div class="course-instructor"><i class="fas fa-chalkboard-teacher"></i> ${safeInstructor}</div>` : '';
                    const _pr = escH(coursePrice), _op = escH(originalPrice);
                    const priceHtml = isFree ? '<span class="course-price free-price">مجاني</span>'
                        : hasDiscount ? `<div class="price-wrap"><span class="course-price">${_pr} ج.م</span><span class="original-price">${_op} ج.م</span><span class="discount-badge">${Math.round((1 - coursePrice / originalPrice) * 100)}% خصم</span></div>`
                            : `<span class="course-price">${_pr} ج.م</span>`;
                    return `<div class="course-card animate" data-course-id="${escH(course.id)}" data-course-type="${escH(courseType)}" data-title="${safeTitle}" data-instructor="${safeInstructor}" data-price="${_pr}" data-is-free="${isFree}"><div class="course-thumbnail"><img src="${escH(thumbnail)}" alt="${safeTitle}" loading="lazy" onerror="this.onerror=null;this.src=window.__PH"><div class="course-chips"><span class="cc-type">${courseType === 'video' ? 'فيديو' : (courseType === 'pdf' ? 'PDF' : 'قائمة')}</span>${badge}</div>${isFree ? '' : '<div class="cc-price">' + priceHtml + '</div>'}</div><div class="course-info"><div class="course-title">${safeTitle}</div>${instructorHtml}<div class="course-desc">${escH(courseDesc)}</div><div class="course-meta"><span>${courseType === 'video' ? ' فيديو' : (courseType === 'pdf' ? ' PDF' : ' قائمة')}</span>${badge}</div><div style="display:flex;justify-content:space-between;align-items:center;">${priceHtml}</div></div><button class="${buttonClass}" ${buttonDisabled ? 'disabled' : ''}>${buttonContent}</button></div>`;
                },

                //  تطبيع اسم المدرس: إزالة المسافات الزائدة من الطرفين، ضغط المسافات المتكررة،
                // وإزالة المحارف الخفية (zero-width) اللي بتيجي أحياناً من اللصق ومتخلي المطابقة الدقيقة تفشل
                // 👁 شارة المشاهدات المتبقية على كروت الكورسات المشترك فيها (بتتحدّث لوحدها بعد كل فتح)
                
                normalizeTeacherName: (name) => {
                    return (name || '').toString()
                        .replace(/[\u200b\u200c\u200d\u200e\u200f\u202a-\u202e\ufeff\u064b-\u065f\u0640]/g, '')
                        .replace(/[أإآ]/g, 'ا')
                        .replace(/ى/g, 'ي')
                        .trim()
                        .replace(/\s+/g, ' ');
                },

                teacherInitials: (name) => {
                    const words = StudentApp.ui.normalizeTeacherName(name).split(' ').filter(Boolean);
                    const letters = words.slice(0, 2).map(w => Array.from(w)[0]);
                    return letters.join('\u200c') || '؟';
                },

                teacherTone: (name) => {
                    const key = StudentApp.ui.normalizeTeacherName(name);
                    let h = 0;
                    for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
                    return h % 6;
                },

                createTeacherCard: (teacher) => {
                    const name = (teacher.name || 'مدرس').toString();
                    const safeName = escH(name);
                    const ui = StudentApp.ui;
                    const countLabel = teacher.count === 1 ? 'محتوى واحد' : `${teacher.count} محتوى`;
                    const subjectsHtml = teacher.typesLabel
                        ? `<div class="teacher-subjects">${escH(teacher.typesLabel)}</div>` : '';
                    return `<div class="teacher-card animate" role="button" tabindex="0" data-teacher-name="${safeName}">
                        <div class="teacher-avatar" data-tone="${ui.teacherTone(name)}">${escH(ui.teacherInitials(name))}</div>
                        <div class="teacher-name">${safeName}</div>
                        <div class="teacher-count">${countLabel}</div>
                        ${subjectsHtml}
                    </div>`;
                },

                bindTeacherCardEvents: function () {
                    const container = document.getElementById('teachersList');
                    if (!container || container._leaderBound) return;
                    container._leaderBound = true;
                    container.addEventListener('click', (e) => {
                        const card = e.target.closest('.teacher-card');
                        if (!card) return;
                        StudentApp.actions.openTeacherProfile(card.dataset.teacherName);
                    });
                    container.addEventListener('keydown', (e) => {
                        if (e.key !== 'Enter' && e.key !== ' ') return;
                        const card = e.target.closest('.teacher-card');
                        if (!card) return;
                        e.preventDefault();
                        StudentApp.actions.openTeacherProfile(card.dataset.teacherName);
                    });
                },

                closeTeacherView: function () {
                    document.getElementById('teacherProfileView').classList.add('hidden');
                    this.switchTab('teachers');
                },

                bindCardEvents: function (containerId) {
                    const container = document.getElementById(containerId);
                    if (!container || container._leaderBound) return;
                    container._leaderBound = true;
                    container.addEventListener('click', async (e) => {
                        const card = e.target.closest('.course-card');
                        if (!card) return;
                        const button = e.target.closest('button');
                        if (!button || button.disabled) return;
                        const { courseId, courseType, title, price, isFree } = card.dataset;
                        const insidePlaylist = containerId === 'playlistItemsContainer';
                        const courseIsFree = isFree === 'true' || parseFloat(price) === 0;
                        const openPlaylistId = StudentApp.state.openPlaylistId;
                        // لو جوه playlist والـ playlist مشترك فيها → كل الكورسات تتفتح مباشرة
                        const playlistOwned = insidePlaylist && openPlaylistId && StudentApp.state.purchasedIds.includes(openPlaylistId);
                        const isSubscribed = StudentApp.state.purchasedIds.includes(courseId) || courseIsFree || playlistOwned;
                        const isPending = !isSubscribed && StudentApp.state.pendingIds.includes(courseId);
                        if (isSubscribed) {
                            if (courseType === 'video') {
                                let videoUrl = ''; // دايمًا من السيرفر عشان المشاهدة تتحسب
                                // 🔒 video_url محمي — نجيبه بـ RPC
                                if (!videoUrl) {
                                    try {
                                        const { data: content, error: contentErr } = await StudentApp.actions.rpcContent(courseId);
                                        if (contentErr || !content?.success) {
                                            throw new Error(content?.error || contentErr?.message);
                                        }
                                        videoUrl = content.video_url;
                                    } catch (fetchErr) {
                                        StudentApp.ui.showAlert(fetchErr.message || 'عذراً، تعذر تحميل الفيديو', 'error');
                                        return;
                                    }
                                }
                                if (!videoUrl) { StudentApp.ui.showAlert('عذراً، لا يوجد فيديو متاح لهذا الدرس.', 'error'); return; }
                                watchVideo(courseId, title, videoUrl);
                            }
                            else if (courseType === 'pdf') {
                                try {
                                    const { data: content, error: contentErr } = await StudentApp.actions.rpcContent(courseId);
                                    if (contentErr || !content?.success) throw new Error(content?.error || contentErr?.message);
                                    StudentApp.actions.downloadPDF(content.pdf_url, courseId, title);
                                } catch (fetchErr) {
                                    StudentApp.ui.showAlert(fetchErr.message || 'عذراً، تعذر تحميل الملف', 'error');
                                }
                            }
                            else if (courseType === 'playlist') StudentApp.actions.openPlaylist(courseId, title, null);
                        } else if (!isPending) {
                            StudentApp.actions.handleCourseAction(courseId, title, parseFloat(price), courseType, isFree === 'true');
                        }
                    });
                },

                closePaymentModal: function () {
                    document.getElementById('paymentModal').classList.remove('active');
                    //  FIX #3 — reset الـ flag عند إغلاق الـ modal
                    StudentApp.state._isSubmitting = false;
                    StudentApp.state.selectedPaymentMethod = null;
                    StudentApp.state.currentCourse = null;
                    document.getElementById('studentNameInput').value = '';
                    document.getElementById('courseNameInput').value = '';
                    document.getElementById('amountInput').value = '';
                    document.getElementById('phoneNumber').value = '';
                    document.getElementById('transferImage').value = '';
                    document.getElementById('fileLabel').textContent = 'اضغط لرفع صورة الإيصال';
                    // إعادة تعيين أيقونة الملف
                    const fileIcon = document.querySelector('.pm-file-icon');
                    if (fileIcon) fileIcon.innerHTML = '<i class="fas fa-cloud-upload-alt"></i>';
                    const fileUploadBox = document.querySelector('.pm-file-upload');
                    if (fileUploadBox) { fileUploadBox.style.borderColor = ''; fileUploadBox.style.background = ''; }
                    // إعادة الزرار
                    const submitBtn = document.getElementById('submitPaymentBtn');
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> <span>إرسال طلب الشراء</span> <div class="pm-submit-arrow"><i class="fas fa-arrow-left"></i></div>';
                    }
                    document.querySelectorAll('.payment-method').forEach(btn => btn.classList.remove('selected'));
                    document.getElementById('paymentForm').style.display = 'none';
                    // reset code
                    const codeField = document.getElementById('pmCodeField');
                    if (codeField) codeField.value = '';
                    const codeWrap = document.getElementById('pmCodeInputWrap');
                    if (codeWrap) codeWrap.classList.remove('active');
                },

                closePlaylistView: function () {
                    StudentApp.state.openPlaylistId = null;
                    document.getElementById('playlistFullView').classList.add('hidden');
                    const returnTeacher = StudentApp.state._playlistReturnTeacher;
                    StudentApp.state._playlistReturnTeacher = null;
                    if (returnTeacher) StudentApp.actions.openTeacherProfile(returnTeacher);
                    else this.switchTab('playlists');
                },

                closeConfirm: () => document.getElementById('confirmDialog').classList.remove('active'),
            },

            data: {
                loadInitialData: async function () {
                    if (!StudentApp.state.currentUser?.id) return;
                    const _ck = 'pi:' + StudentApp.state.currentUser.id;
                    const _hit = DataCache.get('p', _ck);
                    if (_hit) {
                        StudentApp.state.directPurchasedIds = _hit.d.slice();
                        StudentApp.state.purchasedIds = _hit.p.slice();
                        StudentApp.state.playlistChildIds = _hit.c.slice();
                        StudentApp.state.pendingIds = _hit.n.slice();
                        return;
                    }
                    //  نجيب فقط course_id و status من purchases
                    const { data: purchases, error } = await StudentApp.client
                        .from('purchases')
                          .select('course_id, status')
                        .eq('student_id', StudentApp.state.currentUser.id);
                    if (error) { console.error('[data] loadInitialData error:', error); return; }
                    if (purchases) {
                        const approved = purchases.filter(p => p.status === 'approved');
                        const directIds = approved.map(p => p.course_id);
                        StudentApp.state.directPurchasedIds = directIds;
                        // جيب كورسات الـ playlists المشتراة من جدول courses (فيه video_url)
                        let fromPlaylists = [];
                        if (directIds.length > 0) {
                            const { data: playlistCourses } = await StudentApp.client
                                .rpc('get_playlist_children', { p_ids: directIds });
                            if (playlistCourses) {
                                playlistCourses.forEach(p => {
                                    if (p.video_url) {
                                        try { const ids = JSON.parse(p.video_url); if (Array.isArray(ids)) fromPlaylists.push(...ids); }
                                        catch (e) { /* playlist JSON غير صالح — نتجاهله */ }
                                    }
                                });
                            }
                        }
                        // purchasedIds = المشتريات المباشرة + كورسات الـ playlists المشتراة
                        // (كورسات الـ playlist تتفتح في كل التابس لأن الطالب اشترى القائمة كاملة)
                        StudentApp.state.purchasedIds = Array.from(new Set([...directIds, ...fromPlaylists]));
                        StudentApp.state.playlistChildIds = Array.from(new Set([...fromPlaylists]));
                        StudentApp.state.pendingIds = purchases.filter(p => p.status === 'pending').map(p => p.course_id);
                        const _S = StudentApp.state;
                        DataCache.set('p', _ck, { d: _S.directPurchasedIds.slice(), p: _S.purchasedIds.slice(), c: _S.playlistChildIds.slice(), n: _S.pendingIds.slice() });
                    }
                },

                loadCourses: async function (initP) { await this.renderContent('coursesList', 'video', initP); },
                loadNotes: async function (initP) { await this.renderContent('notesList', 'pdf', initP); },
                loadPlaylists: async function (initP) { await this.renderContent('playlistsList', 'playlist', initP); },

                loadTeachers: async function () {
                    const container = document.getElementById('teachersList');
                    if (!container) return;
                    const grade = (StudentApp.state.currentUser.grade || '').trim();
                    let query = StudentApp.client
                        .from('courses_public')
                        .select('instructor, type')
                        .not('instructor', 'is', null);
                    if (grade) query = query.eq('grade', grade);
                    const { data, error } = await DataCache.q('c', 't:' + grade, () => query);
                    if (error) console.error('[loadTeachers] error:', error);
                    if (error || !data) {
                        __lgSet(container, '<div class="empty-state"><i class="fas fa-chalkboard-teacher"></i><p>لا يوجد مدرسين متاحين حالياً</p></div>');
                        return;
                    }
                    const typeLabels = { video: 'كورسات', pdf: 'مذكرات', playlist: 'قوائم تشغيل' };
                    const teachersMap = {};
                    data.forEach(item => {
                        //  نجمع بالاسم بعد التطبيع عشان أي اختلاف بسيط في المسافات ما يفصلش نفس المدرس لكارتين
                        const key = StudentApp.ui.normalizeTeacherName(item.instructor);
                        if (!key) return;
                        if (!teachersMap[key]) teachersMap[key] = { name: (item.instructor || '').trim(), count: 0, types: new Set() };
                        teachersMap[key].count += 1;
                        if (item.type) teachersMap[key].types.add(typeLabels[item.type] || item.type);
                    });
                    const teachers = Object.values(teachersMap)
                        .map(t => ({ ...t, typesLabel: Array.from(t.types).join(' · ') }))
                        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'ar'));
                    if (!teachers.length) {
                        __lgSet(container, '<div class="empty-state"><i class="fas fa-chalkboard-teacher"></i><p>لا يوجد مدرسين متاحين حالياً</p></div>');
                        return;
                    }
                    __lgSet(container, teachers.map(t => StudentApp.ui.createTeacherCard(t)).join(''));
                    StudentApp.ui.bindTeacherCardEvents();
                },

                loadPurchases: async function () {
                    const container = document.getElementById('purchasesList');
                    const _pk = 'pc:' + StudentApp.state.currentUser.id;
                    let courses = DataCache.get('p', _pk);
                    if (courses === undefined) {
                        //  نجيب الكورسات المشترك فيها (approved)
                        const { data: purchases, error } = await StudentApp.client
                            .from('purchases')  .select('course_id, status').eq('student_id', StudentApp.state.currentUser.id).eq('status', 'approved');
                        if (error || !purchases || purchases.length === 0) {
                            if (!error) DataCache.set('p', _pk, []);
                            __lgSet(container, '<div class="empty-state"><i class="fas fa-shopping-cart"></i><p>لا توجد اشتراكات نشطة</p></div>');
                            return;
                        }
                        const courseIds = purchases.map(p => p.course_id);
                        // 🔒 video_url/pdf_url محميين — بنحدد الأعمدة المسموحة بس
                        const { data: cdata, error: cErr } = await StudentApp.client
                            .from('courses').select('id, title, description, type, grade, instructor, thumbnail_url, is_free, price, original_price, is_published, sort_order, created_at, updated_at').in('id', courseIds);
                        if (cErr || !cdata) {
                            __lgSet(container, '<div class="empty-state"><i class="fas fa-shopping-cart"></i><p>لا توجد اشتراكات نشطة</p></div>');
                            return;
                        }
                        courses = cdata;
                        DataCache.set('p', _pk, courses);
                    }
                    if (!courses.length) {
                        __lgSet(container, '<div class="empty-state"><i class="fas fa-shopping-cart"></i><p>لا توجد اشتراكات نشطة</p></div>');
                        return;
                    }
                    //  إصلاح 1: فلترة اشتراكاتي بالـ grade الحالي
                    const currentGrade = (StudentApp.state.currentUser?.grade || '').trim();
                    const filteredPurchases = currentGrade
                        ? courses.filter(c => !c.grade || c.grade === currentGrade)
                        : courses;
                    __lgSet(container, filteredPurchases.map(c => {
                        return StudentApp.ui.createCourseCard(c, true, false);
                    }).join(''));
                },

                renderContent: async function (containerId, type, initP) {
                    const container = document.getElementById(containerId);
                    const grade = (StudentApp.state.currentUser.grade || '').trim();
                    let query = StudentApp.client
                        .from('courses_public')
                        .select('*')
                        .eq('type', type);
                    if (grade) query = query.eq('grade', grade);
                    // الكورسات + المشتريات بيتجابوا في نفس الوقت (أسرع من ورا بعض)
                    const [{ data, error }] = await Promise.all([
                        DataCache.q('c', 'rc:' + type + ':' + grade, () => query.order('sort_order', { ascending: true }).order('created_at', { ascending: false })),
                        initP
                    ]);
                    if (error) { console.error('[renderContent] error:', error); }
                    if (error || !data || data.length === 0) {
                        const msgs = { video: 'لا توجد كورسات متاحة حالياً', pdf: 'لا توجد مذكرات متاحة حالياً', playlist: 'لا توجد قوائم تشغيل متاحة حالياً' };
                        __lgSet(container, `<div class="empty-state"><i class="fas fa-inbox"></i><p>${msgs[type]}</p></div>`);
                        return;
                    }
                    // 🔒 video_url/pdf_url بقوا محميين على مستوى الداتابيز ومش بيتجابوا
                    // إلا وقت الفتح الفعلي عن طريق get_course_content — مفيش داعي
                    // نجيب رابط الفيديو لكل الكورسات المعروضة (حتى الغير مشترك فيها)
                    __lgSet(container, data.map(item => {
                        const isSubscribed = StudentApp.state.purchasedIds.includes(item.id);
                        const isPending = StudentApp.state.pendingIds.includes(item.id);
                        return StudentApp.ui.createCourseCard(item, isSubscribed, isPending);
                    }).join(''));
                },
            },

            // ═══════════════════════════════════════════════════════════
            //  REALTIME MODULE
            // ═══════════════════════════════════════════════════════════
            realtime: {
                _channels: [],
                _setupDone: false,
                _reconnectTimers: {},

                _channelName: (tag, studentId) => `${tag}:student=${studentId}`,

                setStatus: function (status) {
                    const statusMap = {
                        connected: { cls: '', text: 'متصل' },
                        connecting: { cls: 'connecting', text: 'جاري الاتصال...' },
                        disconnected: { cls: 'disconnected', text: 'غير متصل' },
                    };
                    const s = statusMap[status] || statusMap.connecting;
                    ['realtimeStatus', 'realtimeStatusHeader'].forEach(id => {
                        const el = document.getElementById(id);
                        if (!el) return;
                        el.className = `rt-status ${s.cls}`.trim();
                    });
                    ['realtimeStatusText', 'realtimeStatusHeaderText'].forEach(id => {
                        const el = document.getElementById(id);
                        if (el) el.textContent = s.text;
                    });
                },

                _reconnect: function (channelFn, tag, delay = 5000) {
                    if (this._reconnectTimers[tag]) return;
                    this._reconnectTimers[tag] = setTimeout(() => {
                        delete this._reconnectTimers[tag];
                        channelFn();
                    }, delay);
                },

                cleanup: function () {
                    this._stopSync();
                    this._channels.forEach(ch => {
                        try { StudentApp.client.removeChannel(ch); } catch (e) { }
                    });
                    this._channels = [];
                    this._setupDone = false;
                    Object.values(this._reconnectTimers).forEach(t => clearTimeout(t));
                    this._reconnectTimers = {};
                },

                // ═══════════════════════════════════════════════════════
                // ⚡ نظام المزامنة الخفيف (بديل Realtime + الـ polling)
                // طلب واحد صغير كل 45–60 ثانية (ويقف لما التبويب مخفي) بدل
                // 8 قنوات realtime + polling كل 5 ثواني + فحص جلسة كل 45 ثانية.
                // السيرفر بيرجّع حالة الطالب كلها (حظر/جلسة/رصيد/اشتراكات/نسخة الكورسات)
                // والواجهة بتحمّل البيانات الكاملة بس لو فعلاً حصل تغيير.
                // ═══════════════════════════════════════════════════════
                _sync: null,

                _stopSync: function () {
                    const st = this._sync;
                    if (!st) return;
                    st.dead = true;
                    if (st.timer) clearTimeout(st.timer);
                    try { document.removeEventListener('visibilitychange', st.onVis); } catch (_) { }
                    try { window.removeEventListener('online', st.onOnline); } catch (_) { }
                    this._sync = null;
                },

                syncNow: function () { const st = this._sync; return st && st.run ? st.run(true) : Promise.resolve(); },

                _startSync: function (studentId) {
                    const self = this;
                    self._stopSync();
                    const st = { dead: false, busy: false, last: 0, timer: null, courses_v: null, purch: null, profileSig: null };
                    self._sync = st;
                    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

                    const reloadActiveTab = async () => {
                        const activeTab = document.querySelector('.tab-btn.active')?.getAttribute('onclick')?.match(/switchTab\('(\w+)'\)/)?.[1];
                        if (activeTab) await StudentApp.data[`load${activeTab.charAt(0).toUpperCase()}${activeTab.slice(1)}`]?.();
                        StudentApp.data.loadPurchases();
                    };

                    const run = async (force) => {
                        if (st.dead || st.busy) return;
                        if (!StudentApp.state.currentUser?.id) return;
                        if (!force && (document.hidden || Date.now() - st.last < 30000)) return;
                        st.busy = true; st.last = Date.now();
                        try {
                            const { data, error } = await StudentApp.client.rpc('student_sync', { p_session: StudentApp.state.mySessionId || null });
                            if (st.dead) return;
                            if (error || !data) { self.setStatus('disconnected'); return; }
                            self.setStatus('connected');
                            if (data.ok === false) return;

                            // 1) حظر أو حذف الحساب
                            if (data.deleted || data.banned) {
                                st.dead = true;
                                StudentApp.ui.showAlert(' تم حظر حسابك، يرجى التواصل مع الدعم', 'error');
                                setTimeout(() => StudentApp.actions.finalLogout(), 2500);
                                return;
                            }
                            // 2) تسجيل دخول من جهاز آخر
                            if (data.session_ok === false) {
                                st.dead = true;
                                StudentApp.ui.showAlert(' تم تسجيل الدخول بحسابك من جهاز آخر — سيتم تسجيل خروجك من هنا', 'error');
                                setTimeout(() => StudentApp.actions.finalLogout(), 2500);
                                return;
                            }

                            // كاش: تحديث التوكنز (لو اتغيّرت عن آخر زيارة نعتبره تغيير ونحمّل من جديد)
                            const _cTok = DataCache.setToken('c', data.courses_v);
                            const _pSig = JSON.stringify((data.purchases || []).map(r => [r[0], r[1]]).sort());
                            const _pTok = DataCache.setToken('p', _pSig);

                            let gradeChanged = false;
                            // 3) بيانات الملف الشخصي (الصف / الاسم / الرصيد)
                            const p = data.profile;
                            if (p) {
                                const sig = JSON.stringify([p.name, p.grade, p.balance]);
                                if (sig !== st.profileSig) {
                                    st.profileSig = sig;
                                    const cu = StudentApp.state.currentUser;
                                    if (p.grade && p.grade !== cu?.grade) {
                                        cu.grade = p.grade; gradeChanged = true; try { GlobalSearch.invalidate(); } catch (_) { }
                                        try { localStorage.setItem('leader_grade', p.grade); } catch (_) { }
                                    }
                                    if (p.balance !== undefined && p.balance !== null) {
                                        cu.balance = p.balance;
                                        const balEl = document.getElementById('profileBalanceVal');
                                        if (balEl) balEl.textContent = parseFloat(p.balance).toFixed(2);
                                    }
                                    try { updateProfileInfo(p.name, p.grade, p.balance); } catch (_) { }
                                }
                            }

                            // 4) الاشتراكات (موافقة / رفض / حذف)
                            const cur = new Map((data.purchases || []).map(r => [r[0], r[1]]));
                            let purchasesChanged = false;
                            if (st.purch === null) {
                                st.purch = cur;               // أول مرة: نحفظ الحالة الحالية
                                if (_pTok) purchasesChanged = true;   // الاشتراكات اتغيّرت من آخر زيارة → الكاش باطل
                            } else {
                                const prev = st.purch;
                                const removedApproved = [];
                                prev.forEach((status, id) => {
                                    if (!cur.has(id)) { purchasesChanged = true; if (status === 'approved') removedApproved.push(id); }
                                });
                                cur.forEach((status, id) => {
                                    const old = prev.get(id);
                                    if (old === status) return;
                                    purchasesChanged = true;
                                    if (old === 'pending' && status === 'approved') StudentApp.ui.showAlert(' مبروك! تم تفعيل اشتراكك بنجاح، يمكنك البدء الآن', 'success');
                                    else if (status === 'rejected' && old !== undefined) StudentApp.ui.showAlert(' تم رفض طلب الاشتراك، يرجى مراجعة الدعم', 'error');
                                    else if (status === 'approved' && old !== undefined && old !== 'pending') StudentApp.ui.showAlert(' تم تفعيل اشتراك جديد', 'success');
                                });
                                st.purch = cur;
                                removedApproved.forEach(id => { try { self._onPurchaseDeleted(id); } catch (_) { } });
                            }

                            // 5) نسخة الكورسات (نشر / إخفاء / تعديل / حذف من لوحة التحكم)
                            let coursesChanged = gradeChanged;
                            if (st.courses_v === null) { st.courses_v = data.courses_v; if (_cTok) coursesChanged = true; }
                            else if (data.courses_v !== st.courses_v) { st.courses_v = data.courses_v; coursesChanged = true; }

                            if (purchasesChanged) {
                                await StudentApp.data.loadInitialData();
                                await reloadActiveTab();
                            }
                            if (coursesChanged) {
                                // تأخير عشوائي بسيط عشان لو آلاف الطلاب شافوا التغيير مع بعض ما يحملوش في نفس الثانية
                                if (!force) await sleep(Math.random() * 8000);
                                if (st.dead) return;
                                StudentApp.data.loadCourses();
                                StudentApp.data.loadNotes();
                                StudentApp.data.loadPlaylists();
                            }
                        } catch (e) {
                        } finally {
                            st.busy = false;
                        }
                    };
                    st.run = run;

                    const schedule = () => {
                        if (st.dead) return;
                        st.timer = setTimeout(async () => { await run(false); schedule(); }, 45000 + Math.random() * 15000);
                    };
                    st.onVis = () => { if (!document.hidden) run(false); };
                    st.onOnline = () => run(true);
                    document.addEventListener('visibilitychange', st.onVis);
                    window.addEventListener('online', st.onOnline);

                    run(true).then(schedule);
                },

                setup: function (studentId) {
                    if (this._setupDone) return;
                    this._setupDone = true;
                    this.setStatus('connecting');
                    this._startSync(studentId);
                },

                // طرد الجهاز ده لو الحساب اتفتح من جهاز تاني (بيتنادى من rpcContent)
                // الفحص الدوري نفسه بيتعمل في student_sync كل 45–60 ثانية — مفيش polling تاني.
                kick: (function () {
                    let done = false;
                    return function () {
                        if (done) return;
                        done = true;
                        StudentApp.ui.showAlert('تم تسجيل الدخول بحسابك من جهاز آخر — سيتم تسجيل خروجك من هنا', 'error');
                        try { StudentApp.player && StudentApp.player.close && StudentApp.player.close(); } catch (_) { }
                        setTimeout(() => StudentApp.actions.finalLogout(), 800);
                    };
                })(),

                _onPurchaseDeleted: function (deletedCourseId) {
                    StudentApp.state.purchasedIds = StudentApp.state.purchasedIds.filter(id => id !== deletedCourseId);
                    StudentApp.state.pendingIds = StudentApp.state.pendingIds.filter(id => id !== deletedCourseId);
                    if (StudentApp.state.directPurchasedIds) {
                        StudentApp.state.directPurchasedIds = StudentApp.state.directPurchasedIds.filter(id => id !== deletedCourseId);
                    }
                    // إعادة بناء playlistChildIds وpurchasedIds من الـ playlists المتبقية
                    (async () => {
                        const remainingPlaylistIds = (StudentApp.state.directPurchasedIds || []);
                        if (remainingPlaylistIds.length > 0) {
                            const { data: pls } = await StudentApp.client
                                .rpc('get_playlist_children', { p_ids: remainingPlaylistIds });
                            let childIds = [];
                            if (pls) pls.forEach(p => {
                                try { const ids = JSON.parse(p.video_url || '[]'); if (Array.isArray(ids)) childIds.push(...ids); } catch (_) { }
                            });
                            StudentApp.state.playlistChildIds = Array.from(new Set(childIds));
                            StudentApp.state.purchasedIds = Array.from(new Set([...remainingPlaylistIds, ...childIds]));
                        } else {
                            StudentApp.state.playlistChildIds = [];
                            StudentApp.state.purchasedIds = [];
                        }
                    })();
                    const purchaseCard = document.querySelector(`#purchasesList [data-course-id="${deletedCourseId}"]`);
                    if (purchaseCard) {
                        purchaseCard.style.transition = 'opacity 0.3s, transform 0.3s';
                        purchaseCard.style.opacity = '0';
                        purchaseCard.style.transform = 'scale(0.95)';
                        setTimeout(() => {
                            purchaseCard.remove();
                            const list = document.getElementById('purchasesList');
                            if (list && !list.querySelector('.course-card')) {
                                list.innerHTML = '<div class="empty-state"><i class="fas fa-shopping-cart"></i><p>لا توجد اشتراكات نشطة</p></div>';
                            }
                        }, 300);
                    }
                    ['coursesList', 'notesList', 'playlistsList'].forEach(listId => {
                        const card = document.querySelector(`#${listId} [data-course-id="${deletedCourseId}"]`);
                        if (card) {
                            const btn = card.querySelector('button');
                            if (btn) {
                                btn.disabled = false;
                                btn.className = 'course-button';
                                const price = parseFloat(card.dataset.price) || 0;
                                const isFree = card.dataset.isFree === 'true';
                                btn.innerHTML = price > 0 && !isFree ? ' اشترك الآن' : ' ابدأ التعلم';
                            }
                        }
                    });
                    StudentApp.ui.showAlert(' تم إلغاء اشتراكك في هذا المحتوى', 'error');
                },
            },

            // ═══════════════════════════════════════════════════════════
            //  🎬 المشغّل المدمج — الرابط الحقيقي بيتحط في iframe/video جوه
            //  الصفحة نفسها بـ JS، وميظهرش في location.href أو الـ history
            //  أبدًا. الحماية الحقيقية هي get_course_content على السيرفر
            //  (بيتحقق من الاشتراك قبل ما يرجّع الرابط أصلاً) — مش أي تلاعب
            //  في أحداث المتصفح، لأن ده بيتلف عليه في ثواني ومش بيوقف حد.
            // ═══════════════════════════════════════════════════════════
            player: {
                _watermarkTimer: null,
                _currentCourseId: null,

                _extractYouTubeId: function (url) {
                    let id = '';
                    if (url.includes('youtu.be/')) id = url.split('youtu.be/')[1].split('?')[0].split('&')[0];
                    else if (url.includes('/shorts/')) id = url.split('/shorts/')[1].split('?')[0].split('&')[0];
                    else if (url.includes('v=')) id = url.split('v=')[1].split('&')[0];
                    else if (url.includes('/embed/')) id = url.split('/embed/')[1].split('?')[0];
                    return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
                },

                _detectType: function (url) {
                    const u = (url || '').toLowerCase();
                    if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube';
                    if (u.includes('drive.google.com')) return 'gdrive';
                    if (u.includes('vimeo.com')) return 'vimeo';
                    return 'direct';
                },

                _startWatermark: function (name, phone) {
                    const el = document.getElementById('vpWatermark');
                    if (!el) return;
                    el.textContent = `${name || ''}  ${phone || ''}`.trim();
                    const move = () => {
                        const top = 6 + Math.random() * 78;   // %
                        const left = 4 + Math.random() * 70;  // %
                        el.style.top = top + '%';
                        el.style.left = left + '%';
                    };
                    move();
                    if (this._watermarkTimer) clearInterval(this._watermarkTimer);
                    // بتتحرك كل شوية — تصعّب قص العلامة المائية من أي تسجيل للشاشة
                    this._watermarkTimer = setInterval(move, 7000);
                },

                open: async function (courseId, title, url, pdfMode) {
                    if (!url) { StudentApp.ui.showAlert('عذراً، لا يوجد محتوى متاح لهذا الدرس', 'error'); return; }
                    this._currentCourseId = courseId;
                    document.getElementById('vpTitle').textContent = title || '';
                    const wrap = document.getElementById('vpFrameWrap');
                    const controls = document.getElementById('vpControls');
                    wrap.querySelectorAll('iframe, video').forEach(n => n.remove());
                    controls.innerHTML = '';

                    if (pdfMode) {
                        // PDF بيتفتح في القارئ المدمج
                        StudentApp.actions.downloadPDF(url, courseId, title);
                        return;
                    }

                    const type = this._detectType(url);
                    let el;
                    if (type === 'youtube') {
                        const vid = this._extractYouTubeId(url);
                        if (!vid) { StudentApp.ui.showAlert('رابط يوتيوب غير صحيح', 'error'); return; }
                        // 🔒 دروس يوتيوب بتتفتح في المشغّل المخصص (video-player.html): من غير أي واجهة أو رابط ليوتيوب،
                        // والرابط بيتشال من شريط العنوان فور فتح الصفحة
                        try {
                            const masked = btoa(unescape(encodeURIComponent('https://youtu.be/' + vid))).split('').reverse().join('');
                            const qs = new URLSearchParams({ courseId: String(courseId || ''), title: title || '', url: masked, t: String(Date.now()), ...StudentApp.actions._viewParams(courseId) });
                            window.location.href = 'video-player.html?' + qs.toString();
                            return;
                        } catch (_) { }
                        el = document.createElement('iframe');
                        el.src = `https://www.youtube.com/embed/${vid}?rel=0&modestbranding=1&playsinline=1`;
                        el.setAttribute('allow', 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture');
                        el.setAttribute('allowfullscreen', 'true');
                    } else if (type === 'gdrive') {
                        const m = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
                        const fid = m ? m[1] : '';
                        el = document.createElement('iframe');
                        el.src = `https://drive.google.com/file/d/${fid}/preview`;
                        el.setAttribute('allow', 'autoplay');
                        el.setAttribute('allowfullscreen', 'true');
                    } else if (type === 'vimeo') {
                        const m = url.match(/vimeo\.com\/(\d+)/);
                        const vid = m ? m[1] : '';
                        el = document.createElement('iframe');
                        el.src = `https://player.vimeo.com/video/${vid}?title=0&byline=0&portrait=0`;
                        el.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture');
                        el.setAttribute('allowfullscreen', 'true');
                    } else {
                        el = document.createElement('video');
                        el.src = url; el.controls = true; el.controlsList = 'nodownload';
                        // تحكم بالسرعة للفيديو المباشر بس (يوتيوب/درايف/فيميو مش بيسمحوا بده من برا الـ iframe)
                        const speedSel = document.createElement('select');
                        [0.5, 0.75, 1, 1.25, 1.5, 2].forEach(r => {
                            const opt = document.createElement('option'); opt.value = r; opt.textContent = r + 'x';
                            if (r === 1) opt.selected = true;
                            speedSel.appendChild(opt);
                        });
                        speedSel.onchange = () => { el.playbackRate = parseFloat(speedSel.value); };
                        controls.appendChild(speedSel);
                    }
                    wrap.insertBefore(el, document.getElementById('vpWatermark'));

                    const student = StudentApp.state.currentUser;
                    this._startWatermark(student?.name, student?.phone);

                    // ملاحظات محفوظة محليًا لكل درس
                    const notesArea = document.getElementById('vpNotes');
                    notesArea.value = localStorage.getItem('notes_' + courseId) || '';
                    notesArea.oninput = () => localStorage.setItem('notes_' + courseId, notesArea.value);

                    document.getElementById('vpOverlay').classList.add('active');
                },

                close: function () {
                    if (this._watermarkTimer) { clearInterval(this._watermarkTimer); this._watermarkTimer = null; }
                    const wrap = document.getElementById('vpFrameWrap');
                    wrap.querySelectorAll('iframe, video').forEach(n => { try { n.src = ''; } catch (_) { } n.remove(); });
                    document.getElementById('vpOverlay').classList.remove('active');
                },
            },

            // ═══════════════════════════════════════════════════════════
            //  ACTIONS
            // ═══════════════════════════════════════════════════════════
            actions: {
                register: async function (e) {
                    e.preventDefault();
                    const authLoader = document.getElementById('authLoader');
                    const authLoaderText = document.getElementById('authLoaderText');
                    try {
                        const name = document.getElementById('regName').value.trim();
                        const phone = PhoneAuth.digits(document.getElementById('regPhone').value);
                        const password = document.getElementById('regPass').value.trim();
                        const selectedRole = document.getElementById('regRole').value;
                        const governorate = document.getElementById('regGovernorate').value;
                        const isTeacher = selectedRole === 'teacher';
                        if (password.length < 6 || !/^01[0125][0-9]{8}$/.test(phone)) throw new Error('يرجى التأكد من صحة البيانات (كلمة المرور 6+ أحرف، رقم الهاتف 11 رقم يبدأ بـ 01)');
                        if (!governorate) throw new Error('اختر المحافظة');
                        const payload = { name, phone, password, governorate, role: selectedRole };
                        if (isTeacher) {
                            payload.vodafone_cash_number = document.getElementById('regVodafone').value.trim();
                            payload.instapay_number = document.getElementById('regInstapay').value.trim();
                            if (!payload.vodafone_cash_number && !payload.instapay_number) throw new Error('المدرس لازم يدخل رقم فودافون كاش أو حساب انستا باي');
                        } else {
                            payload.father_phone = PhoneAuth.digits(document.getElementById('regFatherPhone').value);
                            payload.mother_phone = PhoneAuth.digits(document.getElementById('regMotherPhone').value);
                        }
                        authLoader.classList.add('active');
                        const flow = PhoneAuth.flows.reg;
                        // الخطوة 1: نطلب كود التحقق ونفتح لوحة واتساب
                        if (!flow.ref) {
                            authLoaderText.textContent = 'جاري تجهيز كود التحقق...';
                            const r = await PhoneAuth.begin('reg', phone, 'signup');
                            if (!r.ok) throw new Error(r.error);
                                                        return;
                        }
                        // الخطوة 2: تأكيد الكود وإنشاء الحساب
                        const code = PhoneAuth.digits(document.getElementById('regCode').value);
                        if (code.length !== 6) { PhoneAuth.show('reg'); return; }
                        authLoaderText.textContent = 'جاري التحقق وإنشاء حسابك...';
                        const res = await PhoneAuth.call({ action: 'register', ...payload, ref: flow.ref, code });
                        if (!res.ok) throw new Error(res.error);
                        PhoneAuth.reset('reg');
                        if (res.pending_teacher) {
                            StudentApp.ui.showAlert('✅ تم تسجيل طلبك كمدرس بنجاح! سيتم مراجعة طلبك من قبل إدارة المنصة وإبلاغك بالنتيجة.', 'success');
                            return;
                        }
                        authLoaderText.textContent = 'جاري تسجيل دخولك...';
                        const { data: loginData, error: loginError } = await StudentApp.client.auth.signInWithPassword({ email: res.login_id, password });
                        if (loginError) throw new Error('تم إنشاء حسابك بنجاح، سجّل الدخول برقم هاتفك وكلمة المرور');
                        try {
                            const { data: sess } = await StudentApp.client.rpc('register_login_session');
                            if (sess?.success) { StudentApp.state.mySessionId = sess.session_id; StudentApp.state._justLoggedIn = true; try { localStorage.setItem('leader_sid', sess.session_id); } catch (_) { } }
                        } catch (_) { }
                        const { data: studentData } = await StudentApp.client.from('students').select('*').eq('user_id', loginData.user.id).maybeSingle();
                        StudentApp.state.currentUser = studentData;
                        StudentApp.ui.showAlert(' تم التسجيل والدخول بنجاح!', 'success');
                        setTimeout(() => StudentApp.ui.showGradeSelector(), 500);
                    } catch (err) {
                        StudentApp.ui.showAlert(err.message || 'حدث خطأ غير متوقع', 'error');
                    } finally {
                        authLoader.classList.remove('active');
                    }
                },

                login: async function (e) {
                    e.preventDefault();
                    const authLoader = document.getElementById('authLoader');
                    const authLoaderText = document.getElementById('authLoaderText');
                    try {
                        authLoader.classList.add('active');
                        authLoaderText.textContent = 'جاري التحقق...';
                        const email = PhoneAuth.loginId(document.getElementById('loginEmail').value);
                        const password = document.getElementById('loginPass').value.trim();
                        const { data: authData, error } = await StudentApp.client.auth.signInWithPassword({ email, password });
                        if (error) throw new Error('بيانات الدخول غير صحيحة');
                        const { data: student } = await StudentApp.client.from('students').select('role').eq('user_id', authData.user.id).maybeSingle();
                        if (student?.role === 'banned') {
                            await StudentApp.client.auth.signOut();
                            throw new Error('عفواً.. هذا الحساب محظور من دخول المنصة');
                        }
                        if (student?.role === 'pending_teacher') {
                            await StudentApp.client.auth.signOut();
                            throw new Error('طلب تسجيلك كمدرس لا يزال قيد المراجعة من قبل إدارة المنصة. سيتم إبلاغك عند الموافقة.');
                        }
                        if (student?.role === 'teacher') {
                            // المدرس يتحول للوحة التحكم بتاعته
                            window.location.href = 'Teache.html';
                            return;
                        }
                        // 🆕 تسجيل جلسة دخول جديدة — بيبطل أي جلسة/توكينز محتوى قديمة
                        // شغالة على جهاز تاني بنفس الحساب، وهيبعت إشارة طرد فورية
                        // للجهاز التاني بعد ما نتصل بقناة session-lock (تحت)
                        try {
                            const { data: sess } = await StudentApp.client.rpc('register_login_session');
                            if (sess?.success) { StudentApp.state.mySessionId = sess.session_id; StudentApp.state._justLoggedIn = true; try { localStorage.setItem('leader_sid', sess.session_id); } catch (_) { } }
                        } catch (_) { }
                        authLoaderText.textContent = 'مرحباً بك مجدداً.. جاري التحميل';
                        StudentApp.ui.showAlert(' تم الدخول بنجاح!', 'success');
                        StudentApp.handleSession();
                    } catch (err) {
                        StudentApp.ui.showAlert(err.message, 'error');
                        authLoader.classList.remove('active');
                    }
                },

                requestPasswordReset: async function (e) {
                    e.preventDefault();
                    const authLoader = document.getElementById('authLoader');
                    try {
                        const phone = PhoneAuth.digits(document.getElementById('resetPhone').value);
                        if (!/^01[0125][0-9]{8}$/.test(phone)) throw new Error('رقم الهاتف غير صحيح (11 رقم يبدأ بـ 01)');
                        authLoader.classList.add('active');
                        const flow = PhoneAuth.flows.rst;
                        if (!flow.ref) {
                            const r = await PhoneAuth.begin('rst', phone, 'reset');
                            if (!r.ok) throw new Error(r.error);
                                                        return;
                        }
                        const code = PhoneAuth.digits(document.getElementById('rstCode').value);
                        const newPass = document.getElementById('rstNewPass').value.trim();
                        if (code.length !== 6) { PhoneAuth.show('rst'); return; }
                        if (newPass.length < 6) throw new Error('كلمة المرور الجديدة لازم تكون 6 أحرف على الأقل');
                        const res = await PhoneAuth.call({ action: 'reset', phone, ref: flow.ref, code, new_password: newPass });
                        if (!res.ok) throw new Error(res.error);
                        PhoneAuth.reset('rst');
                        document.getElementById('rstNewPass').value = '';
                        StudentApp.ui.showAlert(' تم تغيير كلمة المرور بنجاح، سجّل الدخول الآن', 'success');
                        setTimeout(() => toggleForgotForm(), 1200);
                    } catch (err) {
                        StudentApp.ui.showAlert(err.message || 'حدث خطأ غير متوقع', 'error');
                    } finally {
                        authLoader.classList.remove('active');
                    }
                },

                updatePassword: async function (e) {
                    e.preventDefault();
                    const newPassword = document.getElementById('newPassword').value.trim();
                    if (newPassword.length < 6) { StudentApp.ui.showAlert('كلمة المرور قصيرة جداً', 'error'); return; }
                    const { error } = await StudentApp.client.auth.updateUser({ password: newPassword });
                    if (error) StudentApp.ui.showAlert('خطأ: ' + error.message, 'error');
                    else { StudentApp.ui.showAlert(' تم تغيير كلمة المرور بنجاح!', 'success'); setTimeout(() => window.location.href = window.location.pathname, 2000); }
                },

                selectGrade: async function (grade) {
                    const gBtns = Array.from(document.querySelectorAll('#gradeBox .btn-action'));
                    if (gBtns.some(b => b.disabled)) return;
                    const gOld = gBtns.map(b => b.innerHTML);
                    const clicked = gBtns.find(b => (b.getAttribute('onclick') || '').includes("'" + grade + "'"));
                    gBtns.forEach(b => { b.disabled = true; b.style.opacity = '.7'; });
                    if (clicked) clicked.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التحميل...';
                    const restoreGradeBtns = () => gBtns.forEach((b, i) => { b.disabled = false; b.style.opacity = ''; b.innerHTML = gOld[i]; });
                    const { data: rpcResult, error } = await StudentApp.client.rpc('update_my_profile', { p_grade: grade });
                    if (error || !rpcResult?.success) { restoreGradeBtns(); StudentApp.ui.showAlert(rpcResult?.error || 'خطأ في حفظ الصف', 'error'); return; }
                    StudentApp.state.currentUser.grade = grade;
                    localStorage.setItem('leader_grade', grade);
                    GlobalSearch.invalidate(); // أعد بناء الـ index للصف الجديد
                    GlobalSearch.buildIndex();
                    StudentApp.ui.showAlert(`تم تحديث الصف إلى: ${({ grade_1: '1 بكالوريا', grade_2: '2 بكالوريا' })[grade] || grade}`, 'success');
                    // لو مفيش avatar — اعرض شاشة اختيار الصورة
                    if (!StudentApp.state.currentUser.avatar_url) {
                        StudentApp.ui.hideAll();
                        document.getElementById('avatarPickerBox').classList.remove('hidden');
                    } else {
                        await StudentApp.ui.showDashboard();
                    }
                    restoreGradeBtns();
                },

                changeGrade: () => StudentApp.ui.showGradeSelector(),
                askLogout: () => {
                    // إغلاق البروفايل أولاً
                    document.getElementById('profileDropdown').classList.remove('active');
                    // ثم فتح الـ dialog
                    document.getElementById('confirmDialog').classList.add('active');
                },

                finalLogout: async () => {
                    // إغلاق البروفايل أولاً
                    const profileDropdown = document.getElementById('profileDropdown');
                    if (profileDropdown) {
                        profileDropdown.classList.remove('active');
                    }

                    StudentApp.realtime.cleanup();
                    try { await StudentApp.client.auth.signOut({ scope: 'local' }); } catch (_) { }
                    StudentApp.state.currentUser = null;
                    clearAppStorage();
                    sessionStorage.clear();
                    setTimeout(() => window.location.href = 'index.html', 300);
                },

                handleCourseAction: async function (courseId, title, price, type, isFree) {
                    if (!StudentApp.state.currentUser) { StudentApp.ui.showAlert('يرجى تسجيل الدخول أولاً', 'error'); return; }
                    if (price > 0 && !isFree) {
                        StudentApp.state.currentCourse = { id: courseId, title, price };
                        document.getElementById('courseNameInput').value = title;
                        document.getElementById('amountInput').value = `${price} ج.م`;
                        document.getElementById('studentNameInput').value = StudentApp.state.currentUser.name;
                        // ── تحديث رصيد الطالب في زرار الرصيد ──
                        const bal = parseFloat(StudentApp.state.currentUser.balance) || 0;
                        const balEl = document.getElementById('pmBalanceAmount');
                        if (balEl) balEl.textContent = bal.toFixed(2);
                        const balBtn = document.getElementById('pmBalanceBtn');
                        if (balBtn) {
                            if (bal < price) {
                                balBtn.style.opacity = '0.5';
                                balBtn.title = 'رصيدك غير كافٍ';
                            } else {
                                balBtn.style.opacity = '1';
                                balBtn.title = '';
                            }
                        }
                        // ── reset الـ modal لأول حالة كل مرة يتفتح ──
                        document.querySelectorAll('.payment-method').forEach(btn => btn.classList.remove('selected'));
                        document.getElementById('paymentForm').style.display = 'none';
                        document.getElementById('pmCodeInputWrap').classList.remove('active');
                        document.getElementById('pmBalanceConfirmWrap').style.display = 'none';
                        const codeField = document.getElementById('pmCodeField');
                        if (codeField) codeField.value = '';
                        StudentApp.state.selectedPaymentMethod = null;
                        document.getElementById('paymentModal').classList.add('active');
                    } else {
                        // 🔒 المحتوى محمي على مستوى الداتابيز — بنجيبه بـ RPC آمن وقت الفتح بس
                        let videoUrl = '';
                        let pdfUrl = '';
                        if (type === 'playlist') {
                            if (!videoUrl) {
                                try {
                                    const { data: pls } = await StudentApp.client.rpc('get_playlist_children', { p_ids: [courseId] });
                                    videoUrl = pls?.[0]?.video_url || '';
                                } catch (_) { }
                            }
                            StudentApp.actions.openPlaylist(courseId, title, videoUrl);
                        } else {
                            try {
                                const { data: content, error: contentErr } = await StudentApp.actions.rpcContent(courseId);
                                if (contentErr || !content?.success) {
                                    throw new Error(content?.error || contentErr?.message);
                                }
                                videoUrl = content.video_url || videoUrl;
                                pdfUrl = content.pdf_url || pdfUrl;
                            } catch (fetchErr) {
                                StudentApp.ui.showAlert(fetchErr.message || 'عذراً، تعذر تحميل المحتوى', 'error');
                                return;
                            }
                            if (type === 'pdf') StudentApp.actions.downloadPDF(pdfUrl, courseId, title);
                            else watchVideo(courseId, title, videoUrl);
                        }
                    }
                },

                selectPaymentMethod: (method, e) => {
                    StudentApp.state.selectedPaymentMethod = method;
                    document.querySelectorAll('.payment-method').forEach(btn => btn.classList.remove('selected'));
                    const clicked = e?.target?.closest('.payment-method');
                    if (clicked) clicked.classList.add('selected');
                    // إخفاء كل حاجة الأول
                    document.getElementById('paymentForm').style.display = 'none';
                    document.getElementById('pmCodeInputWrap').classList.remove('active');
                    document.getElementById('pmBalanceConfirmWrap').style.display = 'none';

                    if (method === 'code') {
                        document.getElementById('pmCodeInputWrap').classList.add('active');
                        setTimeout(() => document.getElementById('pmCodeField')?.focus(), 100);
                    } else if (method === 'balance') {
                        // ── ملي بيانات شاشة تأكيد الرصيد ──
                        const { currentCourse, currentUser } = StudentApp.state;
                        const price = currentCourse?.price || 0;
                        const bal = parseFloat(currentUser?.balance) || 0;
                        const afterBal = bal - price;
                        document.getElementById('pmBalCourseName').textContent = currentCourse?.title || '—';
                        document.getElementById('pmBalPrice').textContent = price + ' ج.م';
                        document.getElementById('pmBalCurrent').textContent = bal.toFixed(2) + ' ج.م';
                        document.getElementById('pmBalAfter').textContent = afterBal.toFixed(2) + ' ج.م';
                        const insufficientMsg = document.getElementById('pmBalInsufficientMsg');
                        const payBtn = document.getElementById('pmBalancePayBtn');
                        if (bal < price) {
                            insufficientMsg.style.display = 'block';
                            payBtn.disabled = true;
                            payBtn.style.opacity = '0.5';
                        } else {
                            insufficientMsg.style.display = 'none';
                            payBtn.disabled = false;
                            payBtn.style.opacity = '1';
                        }
                        document.getElementById('pmBalanceConfirmWrap').style.display = 'block';
                    } else {
                        document.getElementById('paymentForm').style.display = 'block';
                    }
                },

                payWithBalance: async function () {
                    const { currentUser, currentCourse } = StudentApp.state;
                    if (!currentUser || !currentCourse) { StudentApp.ui.showAlert('خطأ في البيانات', 'error'); return; }

                    const price = parseFloat(currentCourse.price) || 0;
                    const bal = parseFloat(currentUser.balance) || 0;

                    if (bal < price) {
                        StudentApp.ui.showAlert('رصيدك غير كافٍ لإتمام هذه العملية', 'error');
                        return;
                    }

                    const btn = document.getElementById('pmBalancePayBtn');
                    btn.disabled = true;
                    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>جاري التفعيل...</span>';
                    PayHUD.show('جاري تأكيد الدفع...');

                    try {
                        //  استدعاء RPC server-side — الخصم والـ purchase يتعملوا في DB بأمان
                        const { data: result, error: rpcErr } = await StudentApp.client
                            .rpc('buy_with_balance', { p_course_id: currentCourse.id });

                        if (rpcErr) throw rpcErr;
                        if (!result?.success) throw new Error(result?.error || 'فشل الشراء');
                        DataCache.bump('p');

                        const newBalance = parseFloat(result.new_balance ?? (bal - price)).toFixed(2);

                        // تحديث الـ state فوراً
                        currentUser.balance = newBalance;
                        StudentApp.state.currentUser.balance = parseFloat(newBalance);
                        if (!StudentApp.state.purchasedIds.includes(currentCourse.id))
                            StudentApp.state.purchasedIds.push(currentCourse.id);
                        if (!StudentApp.state.directPurchasedIds?.includes(currentCourse.id))
                            StudentApp.state.directPurchasedIds?.push(currentCourse.id);
                        StudentApp.state.pendingIds = StudentApp.state.pendingIds.filter(id => id !== currentCourse.id);
                        // لو الكورس playlist → أضف كورساتها لـ purchasedIds فوراً
                        if (currentCourse.type === 'playlist') {
                            try {
                                const { data: plChildren } = await StudentApp.client.rpc('get_playlist_children', { p_ids: [currentCourse.id] });
                                const childIds = JSON.parse(plChildren?.[0]?.video_url || '[]');
                                if (Array.isArray(childIds)) {
                                    childIds.forEach(cid => {
                                        if (!StudentApp.state.playlistChildIds.includes(cid)) StudentApp.state.playlistChildIds.push(cid);
                                        if (!StudentApp.state.purchasedIds.includes(cid)) StudentApp.state.purchasedIds.push(cid);
                                    });
                                }
                            } catch (_) { }
                        }

                        // تحديث عرض الرصيد في الـ UI فوراً
                        const balEl = document.getElementById('profileBalanceVal');
                        if (balEl) balEl.textContent = parseFloat(newBalance).toFixed(2);
                        document.querySelectorAll('.balance-val, #balanceVal, .user-balance').forEach(el => {
                            el.textContent = parseFloat(newBalance).toFixed(2);
                        });

                        // تحديث زرار الكارد فوراً
                        ['coursesList', 'notesList', 'playlistsList'].forEach(listId => {
                            const card = document.querySelector(`#${listId} [data-course-id="${currentCourse.id}"]`);
                            if (card) {
                                const btn2 = card.querySelector('button');
                                if (btn2) {
                                    btn2.disabled = false;
                                    btn2.className = 'course-button';
                                    const ct = card.dataset.courseType;
                                    btn2.innerHTML = ct === 'pdf' ? '<i class="fas fa-book-open"></i> قراءة الملف'
                                        : ct === 'playlist' ? '<i class="fas fa-folder-open"></i> تصفح القائمة'
                                            : '<i class="fas fa-play"></i> شاهد الدرس';
                                }
                            }
                        });

                        await PayHUD.success('تم الدفع بنجاح');
                        setTimeout(() => { StudentApp.ui.closePaymentModal(); PayHUD.hide(); }, 4500);

                    } catch (err) {
                        console.error('[payWithBalance] ', err);
                        PayHUD.error(err.message || 'حاول مرة أخرى');
                        btn.disabled = false;
                        btn.innerHTML = '<i class="fas fa-bolt"></i> <span>تأكيد الدفع وتفعيل الكورس فوراً</span><div class="pm-submit-arrow"><i class="fas fa-arrow-left"></i></div>';
                    }
                },

                activateCode: async function () {
                    const code = document.getElementById('pmCodeField')?.value?.trim().toUpperCase();
                    if (!code) { StudentApp.ui.showAlert('أدخل الكود أولاً', 'error'); return; }
                    const { currentUser, currentCourse } = StudentApp.state;
                    if (!currentUser || !currentCourse) { StudentApp.ui.showAlert('خطأ في البيانات', 'error'); return; }

                    const btn = document.getElementById('pmCodeActivateBtn');
                    btn.disabled = true;
                    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التحقق...';
                    PayHUD.show('جاري التحقق من الكود...');

                    try {
                        //  استخدام RPC use_payment_code — لأن الطالب مش مسموحله يقرأ payment_codes مباشرة (RLS)
                        const { data: result, error: rpcErr } = await StudentApp.client
                            .rpc('use_payment_code', {
                                p_code: code,
                                p_course_id: currentCourse.id,
                                p_ip: null
                            });

                        if (rpcErr) throw rpcErr;

                        if (!result?.success) {
                            PayHUD.error(result?.error || 'الكود غير صحيح أو منتهي الصلاحية');
                            return;
                        }

                        DataCache.bump('p');
                        // حدّث الـ state فوراً
                        if (!StudentApp.state.purchasedIds.includes(currentCourse.id)) {
                            StudentApp.state.purchasedIds.push(currentCourse.id);
                        }
                        if (!StudentApp.state.directPurchasedIds.includes(currentCourse.id)) {
                            StudentApp.state.directPurchasedIds.push(currentCourse.id);
                        }
                        // أزله من pendingIds لو كان فيها
                        StudentApp.state.pendingIds = StudentApp.state.pendingIds.filter(id => id !== currentCourse.id);
                        // لو الكورس playlist → أضف كورساتها لـ purchasedIds فوراً
                        if (currentCourse.type === 'playlist') {
                            try {
                                const { data: plChildren } = await StudentApp.client.rpc('get_playlist_children', { p_ids: [currentCourse.id] });
                                const childIds = JSON.parse(plChildren?.[0]?.video_url || '[]');
                                if (Array.isArray(childIds)) {
                                    childIds.forEach(cid => {
                                        if (!StudentApp.state.playlistChildIds.includes(cid)) StudentApp.state.playlistChildIds.push(cid);
                                        if (!StudentApp.state.purchasedIds.includes(cid)) StudentApp.state.purchasedIds.push(cid);
                                    });
                                }
                            } catch (_) { }
                        }

                        //  حدّث زرار الكارد فوراً
                        ['coursesList', 'notesList', 'playlistsList'].forEach(listId => {
                            const card = document.querySelector(`#${listId} [data-course-id="${currentCourse.id}"]`);
                            if (card) {
                                const btn2 = card.querySelector('button');
                                if (btn2) {
                                    btn2.disabled = false;
                                    btn2.className = 'course-button';
                                    const ct = card.dataset.courseType;
                                    btn2.innerHTML = ct === 'pdf' ? '<i class="fas fa-book-open"></i> قراءة الملف'
                                        : ct === 'playlist' ? '<i class="fas fa-folder-open"></i> تصفح القائمة'
                                            : '<i class="fas fa-play"></i> شاهد الدرس';
                                }
                            }
                        });

                        await PayHUD.success('تم الدفع بنجاح');
                        setTimeout(() => { StudentApp.ui.closePaymentModal(); PayHUD.hide(); }, 4500);

                    } catch (err) {
                        PayHUD.error(err.message || 'حاول مرة أخرى');
                    } finally {
                        btn.disabled = false;
                        btn.innerHTML = '<i class="fas fa-bolt"></i> تفعيل فوري';
                    }
                },

                // ═══════════════════════════════════════════════════════
                //  ALL 6 FIXES APPLIED HERE
                // ═══════════════════════════════════════════════════════
                submitPayment: async function (e) {
                    //  FIX #2 — preventDefault أول حاجة على طول
                    e.preventDefault();
                    e.stopPropagation();

                    //  FIX #3 + FIX #5 — منع الإرسال المتكرر فوراً قبل أي حاجة
                    if (StudentApp.state._isSubmitting) {
                        return;
                    }
                    StudentApp.state._isSubmitting = true;

                    const submitBtn = document.getElementById('submitPaymentBtn');
                    const originalBtnHTML = submitBtn.innerHTML;
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>جاري إرسال الطلب...</span>';

                    const { currentUser, currentCourse, selectedPaymentMethod } = StudentApp.state;

                    try {
                        //  FIX #2 — التحقق من الجلسة
                        const { data: { session } } = await StudentApp.client.auth.getSession();
                        if (!session) {
                            StudentApp.ui.showAlert('انتهت الجلسة، يرجى تسجيل الدخول مرة أخرى', 'error');
                            StudentApp.ui.showAuth();
                            return;
                        }

                        const phoneNumber = document.getElementById('phoneNumber').value?.trim();
                        const transferImage = document.getElementById('transferImage').files[0];

                        if (!currentUser || !currentCourse || !selectedPaymentMethod || !phoneNumber || !transferImage) {
                            StudentApp.ui.showAlert('يرجى ملء جميع البيانات المطلوبة', 'error');
                            return;
                        }
                        if (!/^01[0-9]{9}$/.test(phoneNumber)) {
                            StudentApp.ui.showAlert('رقم الهاتف يجب أن يكون 11 رقم ويبدأ بـ 01', 'error');
                            return;
                        }

                        PayHUD.show('جاري الموافقة على طلبك...');

                        //  FIX FINAL: تخزين الإيصال كـ base64 مباشرة في الداتابيز
                        // بدل رفعه على storage (كان بيطلع Failed to fetch بسبب RLS/CORS)
                        const imageBase64 = await new Promise((resolve, reject) => {
                            const img = new Image();
                            const reader = new FileReader();
                            reader.onload = (e) => {
                                img.onload = () => {
                                    const canvas = document.createElement('canvas');
                                    const MAX = 800;
                                    let w = img.width, h = img.height;
                                    if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; }
                                    if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; }
                                    canvas.width = w; canvas.height = h;
                                    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                                    resolve(canvas.toDataURL('image/jpeg', 0.75));
                                };
                                img.onerror = reject;
                                img.src = e.target.result;
                            };
                            reader.onerror = reject;
                            reader.readAsDataURL(transferImage);
                        });
                        const publicData = { publicUrl: imageBase64 };

                        // 🔒 كل إدخال/تعديل مباشر على purchases بقى ممنوع على مستوى
                        // الداتابيز — لازم يعدي عن طريق submit_purchase_request RPC
                        // (كانت الطريقة القديمة قابلة للتلاعب بالـ status عن طريق
                        // تعديل الطلب من الشبكة مباشرة)
                        const { data: submitResult, error: submitError } = await StudentApp.client
                            .rpc('submit_purchase_request', {
                                p_course_id: currentCourse.id,
                                p_payment_method: selectedPaymentMethod,
                                p_sender_info: phoneNumber,
                                p_payment_image: publicData?.publicUrl,
                                p_notes: ''
                            });

                        if (submitError) throw submitError;
                        if (!submitResult?.success) {
                            PayHUD.error(submitResult?.error || 'تعذر إرسال الطلب');
                            return;
                        }

                        PayHUD.pending('تم إرسال طلبك\nبانتظار الموافقة');

                        //  تحديث الـ pendingIds فوراً في الـ state
                        if (currentCourse?.id && !StudentApp.state.pendingIds.includes(currentCourse.id)) {
                            StudentApp.state.pendingIds.push(currentCourse.id);
                        }

                        //  تغيير الزرار فوراً في الـ UI بدون reload
                        ['coursesList', 'notesList', 'playlistsList'].forEach(listId => {
                            const card = document.querySelector(`#${listId} [data-course-id="${currentCourse?.id}"]`);
                            if (card) {
                                const btn = card.querySelector('button');
                                if (btn) {
                                    btn.disabled = true;
                                    btn.className = 'course-button completed';
                                    btn.innerHTML = ' الطلب قيد المراجعة';
                                }
                            }
                        });

                        DataCache.bump('p');
                        await StudentApp.data.loadInitialData();
                        setTimeout(() => { StudentApp.ui.closePaymentModal(); PayHUD.hide(); }, 4500);

                    } catch (error) {
                        console.error('[payment]  خطأ:', error);

                        //  FIX #4 — رسائل واضحة حسب نوع الخطأ
                        if (error.code === '23505') {
                            PayHUD.hide();
                            StudentApp.ui.showAlert('طلبك مسجل بالفعل وقيد المراجعة ', 'info');
                            setTimeout(() => StudentApp.ui.closePaymentModal(), 1500);
                        } else {
                            PayHUD.error(error.message || 'حدث خطأ غير متوقع، حاول مرة أخرى');
                            // إعادة تفعيل الزرار فقط لو في خطأ حقيقي
                            StudentApp.state._isSubmitting = false;
                            submitBtn.disabled = false;
                            submitBtn.innerHTML = originalBtnHTML;
                        }
                    }
                },

                // 🔐 المدخل الوحيد لفتح أي محتوى: بيخصم المشاهدة على السيرفر، بيتحقق من الجلسة، وبيحتفظ برقم المشاهدة للمشغّل/القارئ
                rpcContent: async (courseId) => {
                    const r = await StudentApp.client.rpc('get_course_content', { p_course_id: courseId, p_session: StudentApp.state.mySessionId || null });
                    const d = r && r.data;
                    if (d && d.success === false) {
                        if (d.code === 'session') { try { StudentApp.realtime.kick && StudentApp.realtime.kick(); } catch (_) { } }
                        else if (d.code === 'banned') { setTimeout(() => StudentApp.actions.finalLogout(), 1500); }
                    } else if (d && d.success) {
                        StudentApp.state._view = { courseId: String(courseId), id: d.view_id || '', left: d.views_left == null ? '' : d.views_left, t: Date.now() };
                    }
                    return r;
                },
                _viewParams: (courseId) => {
                    const v = StudentApp.state._view;
                    return (v && v.courseId === String(courseId) && v.id && Date.now() - v.t < 90000) ? { vid: String(v.id), vl: String(v.left) } : {};
                },

                downloadPDF: (pdfUrl, courseId, title) => {
                    if (!pdfUrl) { StudentApp.ui.showAlert('رابط الملف غير متوفر', 'error'); return; }
                    // 📖 الملف بيتفتح في القارئ المدمج (render.html) — الرابط متشفّر ومبيظهرش في شريط العنوان
                    try {
                        const masked = btoa(unescape(encodeURIComponent(String(pdfUrl)))).split('').reverse().join('');
                        const qs = new URLSearchParams({ courseId: String(courseId || ''), title: title || '', url: masked, t: String(Date.now()), ...StudentApp.actions._viewParams(courseId) });
                        window.location.href = 'render.html?' + qs.toString();
                    } catch (_) {
                        window.open(pdfUrl, '_blank');
                    }
                },

                openPlaylist: async (playlistId, title, contentData) => {
                    const teacherViewOpen = !document.getElementById('teacherProfileView')?.classList.contains('hidden');
                    StudentApp.state._playlistReturnTeacher = teacherViewOpen
                        ? document.getElementById('teacherViewTitle')?.innerText : null;
                    document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
                    document.getElementById('teacherProfileView')?.classList.add('hidden');
                    const view = document.getElementById('playlistFullView');
                    const container = document.getElementById('playlistItemsContainer');
                    document.getElementById('playlistViewTitle').innerText = title;
                    const _plSub = document.getElementById('playlistViewSub'); if (_plSub) _plSub.textContent = 'محتويات القائمة التعليمية';
                    const plFilters = document.getElementById('playlistFilters');
                    if (plFilters) { plFilters.hidden = true; plFilters.innerHTML = ''; plFilters.onclick = null; }
                    container.innerHTML = '<div class="empty-state"><i class="fas fa-spinner fa-spin"></i><p>جاري التحميل...</p></div>';
                    view.classList.remove('hidden');
                    window.scrollTo(0, 0);
                    StudentApp.state.openPlaylistId = playlistId;
                    try {
                        // بنية القائمة (IDs الكورسات الفرعية) عن طريق RPC آمن
                        let rawVideoUrl = contentData || '';
                        if (!rawVideoUrl) {
                            const { data: pls } = await StudentApp.client.rpc('get_playlist_children', { p_ids: [playlistId] });
                            rawVideoUrl = pls?.[0]?.video_url || '';
                        }
                        let courseIds = [];
                        try { courseIds = JSON.parse(rawVideoUrl); } catch (e) {
                            container.innerHTML = '<div class="empty-state"><p>عذراً، تنسيق هذه القائمة قديم أو غير صالح.</p></div>';
                            return;
                        }
                        if (!Array.isArray(courseIds) || courseIds.length === 0) {
                            container.innerHTML = '<div class="empty-state"><p>هذه القائمة فارغة.</p></div>';
                            return;
                        }
                        // جيب بيانات الكورسات من courses_public (فيديو/بي دي إف كل عنصر
                        // بيتجاب لحظة الفتح الفعلي عن طريق get_course_content — مش هنا)
                        const { data: pubCourses, error: pubErr } = await DataCache.q('c', 'pp:' + courseIds.join(','), () => StudentApp.client
                            .from('courses_public').select('*').in('id', courseIds));
                        if (pubErr) throw pubErr;
                        const ordered = courseIds.map(id => {
                            const pub = pubCourses ? pubCourses.find(c => c.id === id) : null;
                            return pub || null;
                        }).filter(Boolean);
                        if (!ordered.length) {
                            container.innerHTML = '<div class="empty-state"><p>لا توجد محتويات في هذه القائمة.</p></div>';
                            return;
                        }
                        const renderPl = (f) => { const list = f === 'all' ? ordered : ordered.filter(c => (c.type || 'video') === f); container.innerHTML = list.map(c => {
                            const cIsFree = c.is_free === true || !c.price || c.price == 0;
                            //  FIX: نتحقق من اشتراك الـ playlist وقت الرسم مباشرة
                            const playlistSubscribed = StudentApp.state.purchasedIds.includes(playlistId);
                            const cSubscribed = cIsFree || playlistSubscribed || StudentApp.state.purchasedIds.includes(c.id);
                            const cPending = !cSubscribed && StudentApp.state.pendingIds.includes(c.id);
                            return StudentApp.ui.createCourseCard(c, cSubscribed, cPending);
                        }).join(''); };
                        renderPl('all');
                        const plCounts = { video: 0, pdf: 0, playlist: 0 };
                        ordered.forEach(c => { plCounts[plCounts[c.type] !== undefined ? c.type : 'video']++; });
                        const plAvail = [['video', 'كورسات'], ['pdf', 'مذكرات'], ['playlist', 'قوائم تشغيل']].filter(([k]) => plCounts[k] > 0);
                        if (plFilters && plAvail.length > 1) {
                            const chips = [['all', 'الكل', ordered.length]].concat(plAvail.map(([k, l]) => [k, l, plCounts[k]]));
                            plFilters.innerHTML = chips.map(([k, l, n], i) => `<button type="button" class="tp-chip${i === 0 ? ' on' : ''}" data-f="${k}" role="tab" aria-selected="${i === 0}">${l}<b>${n}</b></button>`).join('');
                            plFilters.hidden = false;
                            plFilters.onclick = (e) => {
                                const b = e.target.closest('.tp-chip');
                                if (!b) return;
                                plFilters.querySelectorAll('.tp-chip').forEach(c => { const on = c === b; c.classList.toggle('on', on); c.setAttribute('aria-selected', on); });
                                renderPl(b.dataset.f);
                            };
                        }
                        if (_plSub) _plSub.textContent = ordered.length === 1 ? 'محتوى واحد' : ordered.length + ' محتويات';
                        // ربط أحداث الكارد بعد الرسم
                        //  FIX: نمسح _leaderBound عشان يعيد ربط الأحداث بعد إعادة رسم الـ container
                        const pc = document.getElementById('playlistItemsContainer');
                        if (pc) pc._leaderBound = false;
                        StudentApp.ui.bindCardEvents('playlistItemsContainer');
                    } catch (err) {
                        console.error(err);
                        container.innerHTML = `<div class="empty-state"><p>حدث خطأ: ${escH(err.message)}</p></div>`;
                    }
                },

                openTeacherProfile: async (teacherName) => {
                    if (!teacherName) return;
                    document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
                    document.getElementById('playlistFullView')?.classList.add('hidden');
                    const ui = StudentApp.ui;
                    const view = document.getElementById('teacherProfileView');
                    const container = document.getElementById('teacherItemsContainer');
                    const filters = document.getElementById('teacherFilters');
                    const sub = document.getElementById('teacherViewSubtitle');
                    const avatar = document.getElementById('teacherViewAvatar');
                    document.getElementById('teacherViewTitle').innerText = teacherName;
                    if (avatar) { avatar.textContent = ui.teacherInitials(teacherName); avatar.dataset.tone = ui.teacherTone(teacherName); }
                    if (sub) sub.textContent = 'جاري التحميل...';
                    if (filters) { filters.hidden = true; filters.innerHTML = ''; filters.onclick = null; }
                    container.innerHTML = '<div class="empty-state"><i class="fas fa-spinner fa-spin"></i><p>جاري التحميل...</p></div>';
                    view.classList.remove('hidden');
                    window.scrollTo(0, 0);
                    try {
                        const grade = (StudentApp.state.currentUser.grade || '').trim();
                        let query = StudentApp.client
                            .from('courses_public')
                            .select('*')
                            .not('instructor', 'is', null);
                        if (grade) query = query.eq('grade', grade);
                        const { data: allData, error } = await DataCache.q('c', 'tp:' + grade, () => query
                            .order('sort_order', { ascending: true })
                            .order('created_at', { ascending: false }));
                        if (error) throw error;
                        const target = ui.normalizeTeacherName(teacherName);
                        const data = (allData || []).filter(row => ui.normalizeTeacherName(row.instructor) === target);
                        if (!data.length) {
                            if (sub) sub.textContent = 'لا يوجد محتوى حالياً';
                            container.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><p>لا يوجد محتوى متاح لهذا المدرس حالياً.</p></div>';
                            return;
                        }
                        const typeMeta = [['video', 'كورسات'], ['pdf', 'مذكرات'], ['playlist', 'قوائم تشغيل']];
                        const counts = { video: 0, pdf: 0, playlist: 0 };
                        data.forEach(r => { counts[counts[r.type] !== undefined ? r.type : 'video']++; });
                        const freeCount = data.filter(r => r.is_free === true || !r.price || r.price == 0).length;
                        if (sub) {
                            const total = data.length === 1 ? 'محتوى واحد' : data.length + ' محتوى';
                            sub.textContent = freeCount ? total + ' · ' + (freeCount === 1 ? 'مجاني واحد' : freeCount + ' مجاني') : total;
                        }
                        const render = (f) => {
                            const list = f === 'all' ? data : data.filter(r => (r.type || 'video') === f);
                            container.innerHTML = list.map(item => {
                                const isSubscribed = StudentApp.state.purchasedIds.includes(item.id);
                                const isPending = StudentApp.state.pendingIds.includes(item.id);
                                return ui.createCourseCard(item, isSubscribed, isPending);
                            }).join('');
                        };
                        render('all');
                        ui.bindCardEvents('teacherItemsContainer');
                        const avail = typeMeta.filter(([k]) => counts[k] > 0);
                        if (filters && avail.length > 1) {
                            const chips = [['all', 'الكل', data.length]].concat(avail.map(([k, l]) => [k, l, counts[k]]));
                            filters.innerHTML = chips.map(([k, l, n], i) =>
                                `<button type="button" class="tp-chip${i === 0 ? ' on' : ''}" data-f="${k}" role="tab" aria-selected="${i === 0}">${l}<b>${n}</b></button>`).join('');
                            filters.hidden = false;
                            filters.onclick = (e) => {
                                const b = e.target.closest('.tp-chip');
                                if (!b) return;
                                filters.querySelectorAll('.tp-chip').forEach(c => {
                                    const on = c === b;
                                    c.classList.toggle('on', on);
                                    c.setAttribute('aria-selected', on);
                                });
                                render(b.dataset.f);
                            };
                        }
                    } catch (err) {
                        console.error('[openTeacherProfile] error:', err);
                        if (sub) sub.textContent = '';
                        container.innerHTML = `<div class="empty-state"><p>حدث خطأ: ${escH(err.message)}</p></div>`;
                    }
                },
            },
        };

        // ─── BOOT (نقطة تشغيل واحدة) ─────────────────────────
        document.addEventListener('DOMContentLoaded', () => {
            GlobalSearch.init();
            StudentApp.init();
            StudentApp.ui.bindCardEvents('coursesList');
            StudentApp.ui.bindCardEvents('notesList');
            StudentApp.ui.bindCardEvents('playlistsList');
            StudentApp.ui.bindCardEvents('purchasesList');
            StudentApp.ui.bindCardEvents('playlistItemsContainer');
            StudentApp.ui.bindCardEvents('teacherItemsContainer');
        });
    

/* ===== script ===== */
        // ─── Global helper functions ───────────────────────

        function togglePassword(inputId) {
            const input = document.getElementById(inputId);
            if (!input) return;
            const icon = input.parentElement.querySelector('.password-toggle i');
            const btn = input.parentElement.querySelector('.password-toggle');
            if (input.type === 'password') {
                input.type = 'text';
                icon?.classList.replace('fa-eye', 'fa-eye-slash');
                btn?.classList.add('visible');
            } else {
                input.type = 'password';
                icon?.classList.replace('fa-eye-slash', 'fa-eye');
                btn?.classList.remove('visible');
            }
        }

        // ═══════════════════════════════════════════════════════
        //  PhoneAuth: التسجيل واستعادة كلمة المرور بالهاتف + كود تليجرام (صالح دقيقة)
        // ═══════════════════════════════════════════════════════
        const PhoneAuth = {
            domain: 'phone.sonleader.app', // لازم يطابق PHONE_EMAIL_DOMAIN في Edge Function
            flows: { reg: { ref: null }, rst: { ref: null } },
            cur: null,
            digits(v) { return String(v || '').replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/\D/g, ''); },
            // رقم هاتف -> الهوية الداخلية للدخول. أي قيمة فيها @ (حسابات الإدارة/القديمة) بتتبعت زي ما هي
            loginId(v) {
                const raw = String(v || '').trim();
                if (raw.includes('@')) return raw;
                const d = this.digits(raw);
                return /^01[0125][0-9]{8}$/.test(d) ? d + '@' + this.domain : raw;
            },
            async call(body) {
                const { data, error } = await StudentApp.client.functions.invoke('auth-phone', { body });
                if (error) {
                    let msg = 'تعذّر الاتصال بالخادم، حاول مرة أخرى';
                    try { const j = await error.context.json(); if (j && j.error) msg = j.error; } catch (_) { }
                    return { ok: false, error: msg };
                }
                return data || { ok: false, error: 'استجابة غير صالحة من الخادم' };
            },
            _phone(p) { return this.digits(document.getElementById(p === 'reg' ? 'regPhone' : 'resetPhone').value); },
            _m() { return document.getElementById('otpModal'); },
            _q(id) { return document.getElementById(id); },
            _field(p) { return document.getElementById(p === 'reg' ? 'regCode' : 'rstCode'); },
            // رابط البوت من غير رمز الطلب (للرجوع للمحادثة وقراءة الكود)
            _botLink(f) { return f && f.tg ? String(f.tg).split('?')[0] : '#'; },

            // بداية الطلب: لو الرقم مربوط بتليجرام الكود بيتبعت تلقائي (auto_sent) والنافذة بتفتح على مرحلة الكود مباشرة
            // هل الرقم ده عليه حساب؟ (بيتنادى قبل ما نطلب كود في استعادة كلمة المرور)
            async accountExists(phone) {
                try {
                    const { data, error } = await StudentApp.client.rpc('phone_has_account', { p_phone: phone });
                    if (error) return null; // الدالة مش موجودة/خطأ شبكة -> منقفلش على الطالب
                    return data === true;
                } catch (_) { return null; }
            },
            async begin(p, phone, purpose) {
                this.stop(p);
                if (purpose === 'reset') {
                    const exists = await this.accountExists(phone);
                    if (exists === false) return { ok: false, error: 'الرقم ده مش مسجّل عندنا. تأكد من الرقم أو أنشئ حساب جديد' };
                }
                const r = await this.call({ action: 'start', phone, purpose });
                if (!r.ok) return r;
                const f = this.flows[p];
                Object.assign(f, { ref: r.ref, tg: r.tg_link || null, auto: !!r.auto_sent, expiresAt: null, total: 60, deadline: Date.now() + 10 * 60 * 1000, resendAt: Date.now() + 30000 });
                if (!f.tg) return { ok: false, error: 'التحقق عبر تليجرام غير مفعّل حالياً، تواصل مع الدعم' };
                this._field(p).value = '';
                if (f.auto) {
                    const st = await this.call({ action: 'status', ref: f.ref });
                    if (st.ok && st.sent) this._arm(p, st.seconds_left); else f.auto = false;
                }
                this.show(p);
                if (f.expiresAt == null) this._poll(p, f.ref);
                return r;
            },
            // تسجيل وقت انتهاء الكود (بتوقيت الجهاز) — العدّاد بيتحسب منه فمبيتأثرش لو النافذة اتقفلت واتفتحت
            _arm(p, secs) {
                const f = this.flows[p];
                if (f.poll) { clearInterval(f.poll); f.poll = null; }
                f.total = 60;
                f.expiresAt = Date.now() + Math.max(0, secs | 0) * 1000;
            },
            // أول مرة: استنى الطالب يخلّص Start + مشاركة الرقم في تليجرام
            _poll(p, ref) {
                const f = this.flows[p];
                f.poll = setInterval(async () => {
                    const st = await this.call({ action: 'status', ref });
                    if (!st.ok || f.ref !== ref) return;
                    if (st.sent) { this._arm(p, st.seconds_left); }
                    else if (st.request_expired || Date.now() > f.deadline) {
                        clearInterval(f.poll); f.poll = null;
                        if (this.cur === p) this._status('err', 'انتهت مهلة الطلب. اطلب كود جديد');
                    }
                }, 2000);
            },

            _status(kind, text) {
                const el = this._q('otpStatus'), t = this._q('otpStatusTxt'); if (!el || !t) return;
                const cls = 'lg-status ' + kind;
                if (el.className !== cls) el.className = cls;
                if (t.textContent !== text) t.textContent = text;
            },
            // رسالة خطأ مؤقتة + اهتزاز (بتفضل ظاهرة ~3 ثواني قبل ما العدّاد يرجّع الرسالة العادية)
            _flash(text) {
                this._status('err', text);
                this._hold = Date.now() + 3200;
                const o = this._q('otpCells'); if (o) { o.classList.remove('shake'); void o.offsetWidth; o.classList.add('shake'); }
                try { navigator.vibrate && navigator.vibrate(30); } catch (_) { }
            },
            _phase(ph) {
                const m = this._m(), f = this.cur ? this.flows[this.cur] : {};
                m.dataset.phase = ph;
                this._q('otpTitle').textContent = ph === 'link' ? 'اربط تليجرام (مرة واحدة)' : 'أدخل كود التحقق';
                this._q('otpSub').textContent = ph === 'link' ? 'عشان نبعتلك كود التحقق على:' : (f.auto ? 'وصلك الكود تلقائياً على تليجرام للرقم:' : 'اتبعت الكود على تليجرام للرقم:');
                this._q('otpBot').hidden = ph === 'link'; // في مرحلة الربط الزر الأزرق الكبير بيفتح البوت أصلاً
            },
            _ring(left, total) {
                const m = this._m(), C = 282.74;
                const fg = this._q('otpRingFg'); if (fg) fg.style.strokeDashoffset = String(C * (1 - Math.min(1, left / (total || 60))));
                const s = this._q('otpSecs'); if (s) s.textContent = Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0');
                m.classList.toggle('warn', left > 0 && left <= 10);
                m.classList.toggle('expired', left === 0);
            },
            // خانات الكود الستة + حالة زر التأكيد
            _cells() {
                const m = this._m(); if (!m) return;
                const v = this.digits(this._q('otpCode').value).slice(0, 6);
                m.querySelectorAll('.lg-cell').forEach((c, i) => {
                    const d = v[i] || '';
                    if (c.textContent !== d) c.textContent = d;
                    c.classList.toggle('f', i < v.length);
                    c.classList.toggle('on', i === Math.min(v.length, 5));
                });
                const pw = this._q('rstNewPass');
                const ok = v.length === 6 && !m.classList.contains('expired') && (this.cur !== 'rst' || ((pw && pw.value) || '').length >= 6);
                m.classList.toggle('complete', v.length === 6 && !m.classList.contains('expired'));
                this._q('otpConfirm').disabled = !ok;
            },
            onInput() {
                const c = this._q('otpCode'); c.value = this.digits(c.value).slice(0, 6);
                this._cells();
                if (c.value.length === 6 && this.cur === 'rst') { const pw = this._q('rstNewPass'); if (pw && !pw.value) pw.focus(); }
            },
            togglePass(btn) {
                const i = this._q('rstNewPass'); if (!i) return;
                const show = i.type === 'password'; i.type = show ? 'text' : 'password';
                btn.innerHTML = '<i class="lgi ' + (show ? 'lgi-eye-off' : 'lgi-eye') + '"></i>';
            },
            // نبضة النافذة (كل نص ثانية): العدّاد + عدّاد إعادة الإرسال + الانتقال التلقائي لمرحلة الكود
            _frame() {
                const p = this.cur; if (!p) return;
                const f = this.flows[p], m = this._m();
                const rb = this._q('otpResend');
                if (rb) {
                    const w = Math.ceil(((f.resendAt || 0) - Date.now()) / 1000);
                    const txt = w > 0 ? 'إعادة الإرسال بعد ' + w + ' ث' : 'لم يصلك الكود؟ اطلب كود جديد';
                    rb.disabled = w > 0; if (rb.textContent !== txt) rb.textContent = txt;
                }
                if (f.expiresAt == null) return;
                if (m.dataset.phase !== 'code') {
                    this._phase('code');
                    try { navigator.vibrate && navigator.vibrate(18); } catch (_) { }
                    const c = this._q('otpCode'); if (c) c.focus();
                }
                const left = Math.max(0, Math.ceil((f.expiresAt - Date.now()) / 1000));
                this._ring(left, f.total || 60);
                if (Date.now() >= (this._hold || 0)) {
                    if (left > 0) this._status('ok', f.auto ? 'وصلك الكود تلقائياً على تليجرام ✓' : 'وصلك الكود على تليجرام ✓');
                    else this._status('err', 'انتهت صلاحية الكود. اطلب كود جديد');
                }
                this._cells();
            },
            // فتح النافذة
            show(p) {
                const f = this.flows[p]; if (!f || !f.ref) return;
                this.cur = p;
                const m = this._m();
                this._q('otpPhone').textContent = this._phone(p);
                this._q('otpTg').href = f.tg || '#';
                this._q('otpBot').href = this._botLink(f);
                this._q('otpCode').value = '';
                const pw = this._q('rstNewPass'); if (pw) pw.type = 'password'; // كلمة المرور الجديدة بتفضل محفوظة لو الطالب بيعيد المحاولة
                this._q('otpPassRow').hidden = p !== 'rst';
                this._q('otpConfirm').querySelector('span').textContent = p === 'reg' ? 'تأكيد وإنشاء الحساب' : 'تأكيد وتغيير كلمة المرور';
                m.classList.remove('expired', 'warn');
                this._hold = 0;
                const armed = f.expiresAt != null;
                this._phase(armed ? 'code' : 'link');
                if (!armed) this._status('wait', 'في انتظار تأكيد رقمك على تليجرام…');
                this._cells();
                m.classList.add('open');
                document.body.classList.add('otp-lock');
                clearInterval(this._loop); this._loop = setInterval(() => this._frame(), 500); this._frame();
                if (!this._esc) this._esc = e => { if (e.key === 'Escape') this.hide(); };
                document.addEventListener('keydown', this._esc);
                setTimeout(() => { if (m.dataset.phase === 'code') { const c = this._q('otpCode'); if (c) c.focus(); } }, 280);
            },
            hide() {
                const m = this._m(); if (m) m.classList.remove('open');
                document.body.classList.remove('otp-lock');
                clearInterval(this._loop); this._loop = null;
                if (this._esc) document.removeEventListener('keydown', this._esc);
            },
            // زر "تأكيد" داخل النافذة
            confirm() {
                const p = this.cur; if (!p) return;
                const f = this.flows[p];
                const code = this.digits(this._q('otpCode').value);
                if (f.expiresAt != null && Date.now() >= f.expiresAt) { this._flash('انتهت صلاحية الكود. اطلب كود جديد'); return; }
                if (code.length !== 6) { this._flash('اكتب الكود المكوّن من 6 أرقام'); return; }
                if (p === 'rst') {
                    const np = this._q('rstNewPass').value.trim();
                    if (np.length < 6) { this._flash('كلمة المرور الجديدة لازم تكون 6 أحرف على الأقل'); return; }
                }
                const fld = this._field(p);
                fld.value = code;
                this.hide();
                document.getElementById(p === 'reg' ? 'registerForm' : 'forgotPasswordForm').requestSubmit();
                fld.value = '';
            },
            stop(p) { const f = this.flows[p]; if (f && f.poll) clearInterval(f.poll); if (f) f.poll = null; },
            reset(p) {
                const f = this.flows[p];
                if (!f || !f.ref) return;
                this.stop(p); f.ref = null; f.expiresAt = null; f.tg = null; f.auto = false;
                if (this.cur === p) this.hide();
                const c = this._field(p); if (c) c.value = '';
                if (p === 'rst') { const pw = this._q('rstNewPass'); if (pw) pw.value = ''; }
            },
            async resend() {
                const p = this.cur; if (!p) return;
                const loader = document.getElementById('authLoader');
                try {
                    loader.classList.add('active');
                    const r = await this.begin(p, this._phone(p), p === 'reg' ? 'signup' : 'reset');
                    if (!r.ok) throw new Error(r.error);
                } catch (err) { StudentApp.ui.showAlert(err.message, 'error'); }
                finally { loader.classList.remove('active'); }
            }
        };

        function toggleAuthForms() {
            document.getElementById('loginBox').classList.toggle('hidden');
            document.getElementById('registerBox').classList.toggle('hidden');
        }

        function switchRegRole(role) {
            document.getElementById('regRole').value = role;
            document.getElementById('roleBtnStudent').classList.toggle('active', role === 'student');
            document.getElementById('roleBtnTeacher').classList.toggle('active', role === 'teacher');
            const sf = document.getElementById('studentFields');
            const tf = document.getElementById('teacherFields');
            if (role === 'teacher') {
                sf.style.display = 'none';
                tf.style.display = 'block';
                sf.querySelectorAll('input').forEach(i => i.removeAttribute('required'));
            } else {
                sf.style.display = 'block';
                tf.style.display = 'none';
                sf.querySelectorAll('input').forEach(i => i.setAttribute('required', ''));
            }
        }

        function toggleForgotForm() {
            document.getElementById('loginBox').classList.toggle('hidden');
            document.getElementById('forgotPasswordBox').classList.toggle('hidden');
        }

        function switchTab(tabName) { StudentApp?.ui?.switchTab(tabName); }

        function toggleProfileDropdown() {
            document.getElementById('profileDropdown').classList.toggle('active');
        }

        document.addEventListener('click', (e) => {
            const container = document.getElementById('profileContainer');
            if (container && !container.contains(e.target)) {
                document.getElementById('profileDropdown').classList.remove('active');
            }
        });

        // تحويل قيمة ENUM للصف إلى نص عربي مقروء
        function gradeLabel(grade) {
            const map = { grade_1: '1 بكالوريا', grade_2: '2 بكالوريا', grade_3: '3 بكالوريا' };
            return map[grade] || grade || 'لم يتم تحديد صف';
        }

        function updateProfileInfo(name, grade, balance) {
            const displayName = (name || 'طالب').split(' ')[0];
            document.getElementById('profileUserName').innerText = displayName;
            document.getElementById('profileUserGrade').innerText = gradeLabel(grade);
            // update balance display
            const bal = (balance !== undefined && balance !== null) ? parseFloat(balance) : (StudentApp?.state?.currentUser?.balance || 0);
            const balEl = document.getElementById('profileBalanceVal');
            if (balEl) balEl.textContent = bal.toFixed(2);
            // load avatar
            loadAvatarUI();
        }

        // ─── Avatar helpers ───────────────────────────────────
        function getAvatarUrl() {
            const student = StudentApp?.state?.currentUser;
            if (!student) return null;
            // check cached URL
            const cached = localStorage.getItem('avatar_url_' + student.id);
            return cached || student.avatar_url || null;
        }

        function setAvatarUI(url) {
            const box = document.getElementById('userAvatarBox');
            const icon = document.getElementById('avatarIcon');
            const navBtn = document.querySelector('.profile-btn');

            if (!box) return;

            if (url) {
                // dropdown avatar
                icon.style.display = 'none';
                let img = box.querySelector('img');
                if (!img) {
                    img = document.createElement('img');
                    box.insertBefore(img, box.firstChild);
                }
                img.src = url;
                img.className = '';

                // navbar button mini-avatar
                if (navBtn) {
                    navBtn.innerHTML = '';
                    const navImg = document.createElement('img');
                    navImg.src = url;
                    navImg.className = 'nav-avatar-img';
                    navImg.onerror = () => { navBtn.innerHTML = '<i class="fas fa-user-circle"></i>'; };
                    navBtn.appendChild(navImg);
                }
            } else {
                icon.style.display = '';
                const img = box.querySelector('img');
                if (img) img.remove();
                if (navBtn) navBtn.innerHTML = '<i class="fas fa-user-circle"></i>';
            }
        }

        async function loadAvatarUI() {
            const student = StudentApp?.state?.currentUser;
            if (!student) return;

            // try DB field first, then localStorage cache
            const url = student.avatar_url || localStorage.getItem('avatar_url_' + student.id) || null;
            setAvatarUI(url);

            // if no DB field yet, try fetching from storage
            if (!url) {
                try {
                    //  FIX: استخدم user_id (= auth.uid) مش student.id عشان path الـ storage صح
                    const authUid = student.user_id || (await StudentApp.client.auth.getUser()).data?.user?.id;
                    const { data } = StudentApp.client.storage
                        .from('avatars')
                        .getPublicUrl(`${authUid}/avatar`);
                    if (data?.publicUrl) {
                        // ping to check if file actually exists
                        const res = await fetch(data.publicUrl, { method: 'HEAD' });
                        if (res.ok) {
                            setAvatarUI(data.publicUrl);
                            localStorage.setItem('avatar_url_' + student.id, data.publicUrl);
                        }
                    }
                } catch (_) { }
            }
        }

        async function handleAvatarUpload(input) {
            const file = input.files?.[0];
            if (!file) return;

            const student = StudentApp?.state?.currentUser;
            if (!student) { StudentApp.ui.showAlert('يرجى تسجيل الدخول أولاً', 'error'); return; }

            // validate size (max 3MB)
            if (file.size > 3 * 1024 * 1024) {
                StudentApp.ui.showAlert('الصورة أكبر من الحد المسموح (3 ميجا)', 'error');
                input.value = '';
                return;
            }

            const box = document.getElementById('userAvatarBox');
            box.classList.add('avatar-uploading');
            StudentApp.ui.showAlert('جاري ضغط وتحميل الصورة...', 'info');

            try {
                // 1. compress
                const compressed = await compressImage(file, 400, 0.82);

                // 2. upload — upsert:true يستبدل الملف القديم تلقائياً
                //  FIX: استخدم user_id (= auth.uid) مش student.id عشان الـ RLS policy تقبل الرفع
                const authUid = student.user_id || (await StudentApp.client.auth.getUser()).data?.user?.id;
                const filePath = `${authUid}/avatar`;
                const { data: upData, error: upErr } = await StudentApp.client.storage
                    .from('avatars')
                    .upload(filePath, compressed, {
                        cacheControl: '3600',
                        upsert: true,
                        contentType: 'image/jpeg'
                    });

                if (upErr) {
                    console.error('[Avatar] upload error:', upErr);
                    // رسالة خطأ واضحة حسب السبب
                    if (upErr.statusCode === '403' || upErr.message?.includes('policy')) {
                        StudentApp.ui.showAlert('خطأ في الصلاحيات — تأكد إن الـ SQL اتشغّل صح في Supabase', 'error');
                    } else if (upErr.statusCode === '413' || upErr.message?.includes('size')) {
                        StudentApp.ui.showAlert('الصورة كبيرة جداً حتى بعد الضغط', 'error');
                    } else {
                        StudentApp.ui.showAlert('خطأ في الرفع: ' + (upErr.message || upErr.error || 'حاول مرة أخرى'), 'error');
                    }
                    return;
                }

                // 3. get public URL + cache-bust
                const { data: urlData } = StudentApp.client.storage
                    .from('avatars')
                    .getPublicUrl(filePath);

                const finalUrl = urlData.publicUrl + '?t=' + Date.now();

                // 4. save URL to DB — match by user_id
                const { error: dbErr } = await StudentApp.client
                    .from('students')
                    .update({ avatar_url: urlData.publicUrl })
                    .eq('user_id', authUid);

                if (dbErr) {
                    console.error('[Avatar] db update error:', dbErr);
                    // الصورة اترفعت بس مش محفوظة في DB — نحدّث UI على الأقل
                    StudentApp.ui.showAlert('الصورة اترفعت بس مش محفوظة في الداتابيز: ' + dbErr.message, 'warning');
                }

                // 5. update local state & UI
                student.avatar_url = urlData.publicUrl;
                localStorage.setItem('avatar_url_' + student.id, finalUrl);
                setAvatarUI(finalUrl);
                StudentApp.ui.showAlert('تم تحديث صورة البروفايل بنجاح ', 'success');

            } catch (err) {
                console.error('[Avatar] unexpected error:', err);
                StudentApp.ui.showAlert('خطأ غير متوقع: ' + (err.message || err), 'error');
            } finally {
                box.classList.remove('avatar-uploading');
                input.value = '';
            }
        }

        // compress image via canvas
        function compressImage(file, maxPx, quality) {
            return new Promise((resolve, reject) => {
                const img = new Image();
                const url = URL.createObjectURL(file);
                img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('فشل تحميل الصورة')); };
                img.onload = () => {
                    URL.revokeObjectURL(url);
                    let { width, height } = img;
                    const ratio = Math.min(maxPx / width, maxPx / height, 1);
                    width = Math.round(width * ratio);
                    height = Math.round(height * ratio);
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    canvas.getContext('2d').drawImage(img, 0, 0, width, height);
                    canvas.toBlob(blob => {
                        if (!blob) { reject(new Error('فشل ضغط الصورة')); return; }
                        resolve(blob);
                    }, 'image/jpeg', quality);
                };
                img.src = url;
            });
        }

        function closeConfirm() {
            document.getElementById('profileDropdown').classList.remove('active');
            document.getElementById('confirmDialog').classList.remove('active');
        }

        // 🎬 نفس اسم الدالة القديمة عشان أي كود تاني بينادي عليها يفضل شغال —
        // لكن دلوقتي بتفتح مودال جوه الصفحة بدل ما تعمل تنقل لصفحة تانية
        // ورابط الفيديو ظاهر في شريط العنوان
        function watchVideo(courseId, title, videoUrl) {
            StudentApp.player.open(courseId, title, videoUrl, false);
        }
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') { const ov = document.getElementById('vpOverlay'); if (ov?.classList.contains('active')) StudentApp.player.close(); }
        });
        document.getElementById('vpOverlay')?.addEventListener('click', (e) => {
            if (e.target.id === 'vpOverlay') StudentApp.player.close();
        });

        async function finalLogout() {
            try { localStorage.removeItem('leader_sid'); } catch (_) { }
            // إغلاق البروفايل أولاً
            const profileDropdown = document.getElementById('profileDropdown');
            if (profileDropdown) {
                profileDropdown.classList.remove('active');
            }

            if (StudentApp?.client) {
                try {
                    StudentApp.realtime.cleanup();
                    try { await StudentApp.client.auth.signOut({ scope: 'local' }); } catch (_) { }
                    StudentApp.state.currentUser = null;
                    clearAppStorage();
                    sessionStorage.clear();
                    setTimeout(() => window.location.href = 'index.html', 300);
                } catch (err) {
                    console.error('خطأ في الخروج:', err);
                    window.location.href = 'index.html';
                }
            } else {
                window.location.href = 'index.html';
            }
        }

        function changeGrade() {
            document.getElementById('profileDropdown').classList.remove('active');
            StudentApp?.ui?.showGradeSelector();
        }

        function selectGrade(grade) { StudentApp?.actions?.selectGrade(grade); }
        function closePaymentModal() { StudentApp?.ui?.closePaymentModal(); }

        // ====== AVATAR PICKER FUNCTIONS ======
        let _pickerBlob = null;

        async function handlePickerAvatar(input) {
            const file = input.files?.[0];
            if (!file) return;
            if (file.size > 3 * 1024 * 1024) {
                document.getElementById('avatarPickerStatus').textContent = ' الصورة أكبر من 3 ميجا';
                return;
            }
            document.getElementById('avatarPickerStatus').textContent = 'جاري معالجة الصورة...';
            try {
                _pickerBlob = await compressImage(file, 400, 0.82);
                const previewUrl = URL.createObjectURL(_pickerBlob);
                const circle = document.getElementById('avatarPickerCircle');
                const icon = document.getElementById('avatarPickerIcon');
                icon.style.display = 'none';
                let img = circle.querySelector('img');
                if (!img) { img = document.createElement('img'); circle.insertBefore(img, circle.firstChild); }
                img.src = previewUrl;
                document.getElementById('avatarPickerStatus').textContent = ' الصورة جاهزة للحفظ';
                document.getElementById('avatarPickerSaveBtn').style.display = 'flex';
            } catch (e) {
                document.getElementById('avatarPickerStatus').textContent = ' فشل تحميل الصورة';
            }
        }

        async function finishAvatarPicker() {
            const btn = document.getElementById('avatarPickerSaveBtn');
            if (!_pickerBlob) { skipAvatarPicker(); return; }
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الرفع...';
            const student = StudentApp.state.currentUser;
            try {
                //  FIX: استخدم user_id (= auth.uid) مش student.id عشان الـ RLS policy تقبل الرفع
                const authUid = student.user_id || (await StudentApp.client.auth.getUser()).data?.user?.id;
                const filePath = `${authUid}/avatar`;
                const { error: upErr } = await StudentApp.client.storage.from('avatars').upload(filePath, _pickerBlob, { cacheControl: '3600', upsert: true, contentType: 'image/jpeg' });
                if (upErr) throw upErr;
                const { data: urlData } = StudentApp.client.storage.from('avatars').getPublicUrl(filePath);
                const finalUrl = urlData.publicUrl + '?t=' + Date.now();
                await StudentApp.client.rpc('update_my_profile', { p_avatar_url: urlData.publicUrl });
                student.avatar_url = urlData.publicUrl;
                localStorage.setItem('avatar_url_' + student.id, finalUrl);
            } catch (e) {
            }
            _pickerBlob = null;
            document.getElementById('avatarPickerBox').classList.add('hidden');
            await StudentApp.ui.showDashboard();
        }

        async function skipAvatarPicker() {
            _pickerBlob = null;
            document.getElementById('avatarPickerBox').classList.add('hidden');
            await StudentApp.ui.showDashboard();
        }

        //  FIX #1 — حذف submitPayment و selectPaymentMethod من هنا
        // لأن الـ form submit بيتعالج من setupEventListeners فقط
        // و selectPaymentMethod محتاج يفضل كـ global لأنه بيتنادى من onclick في الـ HTML
        function selectPaymentMethod(method, e) { StudentApp?.actions?.selectPaymentMethod(method, e); }
        function activateCode() { StudentApp?.actions?.activateCode(); }

        function updateFileLabel(input) {
            if (!input.files?.[0]) return;
            document.getElementById('fileLabel').textContent = input.files[0].name;
            const box = input.closest('.pm-file-upload');
            if (box) {
                box.style.borderColor = 'rgba(37,99,235,0.6)';
                box.style.background = 'rgba(37,99,235,0.06)';
                box.querySelector('.pm-file-icon').innerHTML = '<i class="fas fa-check-circle" style="color:var(--success);"></i>';
            }
        }
    

/* ===== script ===== */
        // ====== QR GENERATOR ======
        function generateQRonCanvas(text, canvas) {
            return new Promise((resolve) => {
                const size = 320;
                const encoded = encodeURIComponent(text);
                const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}&format=png&ecc=H&margin=1`;
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => {
                    canvas.width = size; canvas.height = size;
                    const ctx = canvas.getContext('2d');
                    ctx.clearRect(0, 0, size, size);
                    ctx.drawImage(img, 0, 0, size, size);
                    resolve(true);
                };
                img.onerror = () => {
                    const ctx = canvas.getContext('2d');
                    canvas.width = size; canvas.height = size;
                    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, size, size);
                    ctx.fillStyle = '#8e8e93'; ctx.font = '600 18px Arial';
                    ctx.textAlign = 'center'; ctx.fillText('تعذّر تحميل QR', size / 2, size / 2);
                    resolve(false);
                };
                img.src = url;
            });
        }

        async function showStudentQR() {
            const student = StudentApp?.state?.currentUser;
            if (!student) return;

            // Close profile dropdown
            document.getElementById('profileDropdown').classList.remove('active');

            // Build QR data — keep compact for better scan
            const qrData = JSON.stringify({
                id: student.id,
                name: student.full_name || student.name || 'طالب',
                grade: gradeLabel(student.grade),
                phone: student.phone || '',
                joined: student.created_at ? new Date(student.created_at).toLocaleDateString('ar-EG') : '',
                platform: 'ابن القائد'
            });

            // Show modal
            document.getElementById('qrModalOverlay').classList.add('active');

            // Generate QR on canvas
            const canvas = document.getElementById('qrCanvas');
            // Show loading state
            canvas.width = 320; canvas.height = 320;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#f2f2f7';
            ctx.fillRect(0, 0, 320, 320);
            ctx.fillStyle = '#aeaeb2';
            ctx.font = '600 18px -apple-system, "SF Arabic", "IBM Plex Sans Arabic", Arial';
            ctx.textAlign = 'center';
            ctx.fillText('جاري التحميل...', 160, 166);

            await generateQRonCanvas(qrData, canvas);
        }

        function hideStudentQR() {
            document.getElementById('qrModalOverlay').classList.remove('active');
        }

        function handleQROverlayClick(e) {
            if (e.target === e.currentTarget) hideStudentQR();
        }

        async function shareStudentQR() {
            const student = StudentApp?.state?.currentUser;
            if (!student) return;

            const btn = document.getElementById('qrShareBtn');
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التحضير...';

            try {
                const dc = document.createElement('canvas');
                dc.width = 420; dc.height = 560;
                const ctx = dc.getContext('2d');

                const grad = ctx.createLinearGradient(0, 0, 0, 560);
                grad.addColorStop(0, '#0f1a2e');
                grad.addColorStop(1, '#080e1c');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, 420, 560);

                ctx.strokeStyle = 'rgba(37,99,235,0.7)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.roundRect(12, 12, 396, 536, 22);
                ctx.stroke();

                ctx.fillStyle = 'rgba(37,99,235,0.5)';
                ctx.fillRect(80, 12, 260, 2);

                ctx.fillStyle = '#2563eb';
                ctx.font = 'bold 20px -apple-system, "SF Arabic", "IBM Plex Sans Arabic", Arial';
                ctx.textAlign = 'center';
                ctx.fillText(' منصة ابن القائد', 210, 52);

                ctx.fillStyle = '#8899bb';
                ctx.font = '13px -apple-system, "SF Arabic", "IBM Plex Sans Arabic", Arial';
                ctx.fillText('البطاقة الرقمية للطالب', 210, 75);

                // QR من الـ canvas الموجود في الـ modal
                const existingCanvas = document.getElementById('qrCanvas');
                if (existingCanvas && existingCanvas.width > 0) {
                    ctx.fillStyle = '#ffffff';
                    ctx.beginPath();
                    ctx.roundRect(100, 90, 220, 220, 12);
                    ctx.fill();
                    ctx.drawImage(existingCanvas, 110, 100, 200, 200);
                }

                ctx.fillStyle = '#f0f4ff';
                ctx.font = 'bold 22px -apple-system, "SF Arabic", "IBM Plex Sans Arabic", Arial';
                ctx.fillText(student.full_name || student.name || 'طالب', 210, 345);

                ctx.fillStyle = '#2563eb';
                ctx.font = 'bold 15px -apple-system, "SF Arabic", "IBM Plex Sans Arabic", Arial';
                ctx.fillText(gradeLabel(student.grade) || '', 210, 372);

                ctx.strokeStyle = 'rgba(255,255,255,0.08)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(40, 390); ctx.lineTo(380, 390);
                ctx.stroke();

                const info = [
                    ['رقم الهاتف', student.phone || '—'],
                    ['تاريخ الانضمام', student.created_at ? new Date(student.created_at).toLocaleDateString('ar-EG') : '—'],
                    ['المعرّف', (student.id || '').toString().slice(0, 8).toUpperCase()]
                ];
                info.forEach(([label, val], i) => {
                    const x = i === 0 ? 310 : i === 1 ? 110 : 210;
                    const y = i < 2 ? 420 : 480;
                    ctx.fillStyle = 'rgba(255,255,255,0.05)';
                    ctx.beginPath();
                    ctx.roundRect(x - 90, y - 22, 180, 48, 8);
                    ctx.fill();
                    ctx.fillStyle = '#8899bb';
                    ctx.font = '11px -apple-system, "SF Arabic", "IBM Plex Sans Arabic", Arial';
                    ctx.fillText(label, x, y);
                    ctx.fillStyle = '#f0f4ff';
                    ctx.font = 'bold 13px -apple-system, "SF Arabic", "IBM Plex Sans Arabic", Arial';
                    ctx.fillText(val, x, y + 20);
                });

                ctx.fillStyle = '#4a5a7a';
                ctx.font = '11px -apple-system, "SF Arabic", "IBM Plex Sans Arabic", Arial';
                ctx.fillText('the-son-of-the-leader-edu.vercel.app', 210, 530);

                const blob = await new Promise(r => dc.toBlob(r, 'image/png'));
                const fileName = `بطاقة-${student.full_name || 'طالب'}.png`;
                const file = new File([blob], fileName, { type: 'image/png' });

                if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        title: 'بطاقتي من منصة ابن القائد',
                        text: `بطاقة الطالب: ${student.full_name || student.name || 'طالب'} `,
                        files: [file]
                    });
                } else if (navigator.share) {
                    await navigator.share({
                        title: 'منصة ابن القائد',
                        text: `بطاقة الطالب: ${student.full_name || student.name || 'طالب'} `,
                        url: 'https://the-son-of-the-leader-edu.vercel.app/'
                    });
                } else {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url; a.download = fileName; a.click();
                    URL.revokeObjectURL(url);
                }
            } catch (err) {
                if (err.name !== 'AbortError') console.error('Share error:', err);
            }

            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-share-alt"></i> مشاركة البطاقة';
        }
    

/* ===== script ===== */
        // ─── Theme Toggle ───────────────────────────────────
        const THEME_KEY = 'son-leader-theme';

        function applyTheme(theme) {
            const pill = document.getElementById('themePill');
            const rowIcon = document.getElementById('themeRowIcon');
            const rowTitle = document.getElementById('themeRowTitle');
            const rowSub = document.getElementById('themeRowSub');
            const toggleIcon = document.getElementById('themeToggleIcon');
            const authToggleIcon = document.getElementById('authThemeToggleIcon');

            if (theme === 'light') {
                document.body.classList.add('light-mode');
                if (pill) { pill.classList.add('light-on'); }
                if (rowIcon) { rowIcon.innerHTML = '<i class="fas fa-sun"></i>'; rowIcon.style.color = '#2563eb'; }
                if (rowTitle) { rowTitle.textContent = 'الوضع النهاري'; }
                if (rowSub) { rowSub.textContent = 'مُفعَّل'; }
                                            } else {
                document.body.classList.remove('light-mode');
                if (pill) { pill.classList.remove('light-on'); }
                if (rowIcon) { rowIcon.innerHTML = '<i class="fas fa-moon"></i>'; rowIcon.style.color = ''; }
                if (rowTitle) { rowTitle.textContent = 'الوضع الليلي'; }
                if (rowSub) { rowSub.textContent = 'مُفعَّل'; }
                                            }
        }

        function syncThemeSwitch(theme) {
            document.querySelectorAll('.theme-toggle-btn').forEach(function (b) { b.setAttribute('aria-checked', theme === 'light' ? 'true' : 'false'); });
        }

        function toggleTheme() {
            const isLight = document.body.classList.contains('light-mode');
            const next = isLight ? 'dark' : 'light';
            localStorage.setItem(THEME_KEY, next);
            applyTheme(next);
            syncThemeSwitch(next);
        }

        // تطبيق الثيم المحفوظ عند التحميل
        (function () {
            const saved = localStorage.getItem(THEME_KEY) || 'dark';
            applyTheme(saved);
            syncThemeSwitch(saved);
        })();
    

/* ===== liquid-glass-js ===== */
        // تحديث صامت: بنستبدل المحتوى بس لو اتغير فعلًا (من غير وميض ولا إعادة حركة)
        window.__lgSet = function (el, html) {
            if (!el) return;
            if (el.__lgHTML === html && (html === '' || el.childElementCount > 0)) return;
            el.__lgHTML = html;
            el.innerHTML = html;
        };
    

/* ===== sync-search-width ===== */
        // بيخلي عرض شريط البحث = عرض شريط الأقسام (.tabs) تلقائيًا
        (function () {
            var tabs = document.querySelector('.tabs');
            if (!tabs) return;
            function sync() {
                var w = tabs.getBoundingClientRect().width;
                if (w > 0) document.documentElement.style.setProperty('--tabs-w', Math.round(w) + 'px');
            }
            if (window.ResizeObserver) new ResizeObserver(sync).observe(tabs);
            window.addEventListener('resize', sync);
            sync();
        })();
    

/* ===== install-app ===== */
        // ── تحميل المنصة كتطبيق (PWA) ──
        (function () {
            var deferred = null;
            var standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
            var isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

            if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
                navigator.serviceWorker.register('./sw.js').catch(function () { });
            }

            window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferred = e; });
            window.addEventListener('appinstalled', function () {
                deferred = null;
                var t = document.getElementById('installAppText'); if (t) t.textContent = 'تم تثبيت التطبيق ✓';
            });

            function hint(msg) {
                var h = document.getElementById('installHint');
                if (h) { h.textContent = msg; h.style.display = 'block'; }
            }

            window.installApp = async function () {
                if (standalone) { StudentApp.ui.showAlert('التطبيق مثبّت بالفعل على جهازك', 'success'); return; }
                if (deferred) {
                    deferred.prompt();
                    try { await deferred.userChoice; } catch (_) { }
                    deferred = null;
                    return;
                }
                if (isIOS) hint('في سفاري: اضغط زر المشاركة، ثم اختر "إضافة إلى الشاشة الرئيسية".');
                else hint('من قائمة المتصفح (⋮) اختر "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية". لو مش ظاهرة، افتح الموقع من رابطه على الإنترنت.');
            };

            if (standalone) {
                var t = document.getElementById('installAppText'); if (t) t.textContent = 'التطبيق مثبّت';
            }
        })();
    

/* ===== app-sheet-js ===== */
(function () {
    window.APP_APK_URL = './app.apk';
    window.APP_DESKTOP_URL = './app.exe';
    var root = document.getElementById('appSheet');
    var android = document.getElementById('asAndroid');
    var desktop = document.getElementById('asDesktop');
    var opener = null;
    function trap(e) {
        if (e.key === 'Escape') { closeAppSheet(); return; }
        if (e.key !== 'Tab') return;
        var f = root.querySelectorAll('a[href],button');
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    window.openAppSheet = function () {
        opener = document.activeElement;
        android.setAttribute('href', window.APP_APK_URL);
        desktop.setAttribute('href', window.APP_DESKTOP_URL);
        root.hidden = false;
        requestAnimationFrame(function () { root.classList.add('open'); android.focus(); });
        document.addEventListener('keydown', trap);
    };
    window.closeAppSheet = function () {
        root.classList.remove('open');
        document.removeEventListener('keydown', trap);
        setTimeout(function () { root.hidden = true; }, 280);
        if (opener && opener.focus) opener.focus();
    };
    android.addEventListener('click', function () { setTimeout(closeAppSheet, 400); });
    desktop.addEventListener('click', function () { setTimeout(closeAppSheet, 400); });
})();
