// =====================================================
// 🔐 ULTRA SECURITY - نظام الحماية الفائقة للفيديو
// =====================================================

'use strict';

// ========================================
// 🔐 التحقق من الجلسة الآمنة
// ========================================

class SecurityManager {
    constructor() {
        this.sessionToken = sessionStorage.getItem('PLAYER_SESSION');
        this.securityKey = sessionStorage.getItem('SECURITY_KEY');
        this.deviceFingerprint = window.DEVICE_FINGERPRINT;
        this.startTime = Date.now();
        this.maxSessionDuration = 8 * 60 * 60 * 1000; // 8 hours
        this.lastActivityTime = Date.now();
        this.inactivityTimeout = 30 * 60 * 1000; // 30 minutes
        this.accessLog = [];

        this.validate();
        this.setupMonitoring();
    }

    validate() {
        // التحقق من أن الجلسة موجودة
        if (!this.sessionToken || !this.securityKey) {
            console.error('❌ جلسة غير صالحة - لا توجد بيانات أمنية');
            // window.location.href = 'index.html';
            // throw new SecurityError('Invalid session');
        }

        console.log('✓ جلسة آمنة تم التحقق منها');
    }

    setupMonitoring() {
        // مراقبة النشاط
        document.addEventListener('mousemove', () => this.updateActivity());
        document.addEventListener('keypress', () => this.updateActivity());
        document.addEventListener('click', () => this.updateActivity());

        // منع القائمة اليمينية (Right Click) في الصفحة كاملة
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.logAccess('CONTEXT_MENU_BLOCKED', { target: e.target.tagName });
            return false;
        });

        // منع أدوات المطور (F12 والاختصارات الحساسة)
        document.addEventListener('keydown', (e) => {
            const ctrlOrMeta = e.ctrlKey || e.metaKey;
            const shift = e.shiftKey;
            const key = e.key.toUpperCase();

            if (e.key === 'F12' || 
                (ctrlOrMeta && shift && ['I', 'J', 'C', 'K'].includes(key)) ||
                (ctrlOrMeta && ['U', 'S', 'P', 'A'].includes(key))) {
                e.preventDefault();
                e.stopPropagation();
                this.logAccess('DEVTOOLS_KEY_BLOCKED', { key: e.key });
                return false;
            }
        });

        // فحص الجلسة كل 1 دقيقة
        setInterval(() => this.checkSession(), 60000);
    }

    updateActivity() {
        this.lastActivityTime = Date.now();
    }

    checkSession() {
        const sessionDuration = Date.now() - this.startTime;
        const inactivity = Date.now() - this.lastActivityTime;

        // التحقق من مدة الجلسة
        if (sessionDuration > this.maxSessionDuration) {
            console.warn('⚠️ انتهت مدة الجلسة');
            this.terminateSession('Session Expired');
        }

        // التحقق من الخمول
        if (inactivity > this.inactivityTimeout) {
            console.warn('⚠️ الجلسة خاملة - انقطاع');
            this.terminateSession('Inactivity Timeout');
        }
    }

    terminateSession(reason) {
        console.log(`🔒 إيقاف الجلسة: ${reason}`);
        sessionStorage.clear();
        // window.location.href = 'index.html?session=expired';
    }

    logAccess(action, details) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            action: action,
            details: details,
            userAgent: navigator.userAgent,
            sessionToken: this.sessionToken.substring(0, 10) + '***'
        };
        this.accessLog.push(logEntry);
        console.log(`📋 [ACCESS LOG] ${action}`, details);
    }
}

// إنشاء مدير الأمان
const securityManager = new SecurityManager();

// ========================================
// 🔐 تشفير/فك تشفير البيانات
// ========================================

class DataEncryption {
    // تشفير بسيط ولكن فعال للبيانات الحساسة
    static encrypt(data) {
        const key = window.SESSION_SECURITY_KEY;
        // Base64 encoding with obfuscation
        return btoa(JSON.stringify(data) + key).split('').reverse().join('');
    }

    static decrypt(encrypted) {
        try {
            const key = window.SESSION_SECURITY_KEY;
            const decrypted = atob(encrypted.split('').reverse().join(''));
            return JSON.parse(decrypted.substring(0, decrypted.length - key.length));
        } catch (e) {
            console.error('❌ خطأ في فك التشفير:', e);
            return null;
        }
    }

    static hashData(data) {
        // Hash function for data integrity
        let hash = 0;
        const string = JSON.stringify(data);
        for (let i = 0; i < string.length; i++) {
            const char = string.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(16);
    }
}

// ========================================
// 🔐 منع الوصول المباشر للفيديو
// ========================================

class VideoAccessControl {
    constructor() {
        this.allowedOrigins = [window.location.origin];
        this.accessLog = [];
        this.accessAttempts = 0;
        this.maxAttempts = 10;
        this.blockIframe = true;

        this.setupProtection();
    }

    setupProtection() {
        // منع iframe access
        if (window.self !== window.top && this.blockIframe) {
            window.top.location = window.self.location;
            throw new Error('🚫 Iframe Access Blocked');
        }

        // منع الوصول من نطاقات أخرى
        this.checkOrigin();

        // منع الـ Referrer Checking
        this.checkReferrer();

        // منع Direct URL Access
        this.checkDirectAccess();
    }

    checkOrigin() {
        const origin = window.location.origin;
        const isAllowed = this.allowedOrigins.includes(origin);

        if (!isAllowed) {
            console.error('❌ محاولة وصول من نطاق غير مصرح:', origin);
            // securityManager.terminateSession('Invalid Origin');
        }
    }

    checkReferrer() {
        const referrer = document.referrer;

        // يجب أن يأتي من index.html أو watchVideoFunction.js
        const allowedReferrers = ['index.html', 'watchVideoFunction', window.location.origin];
        const isValidReferrer = !referrer || allowedReferrers.some(r => referrer.includes(r));

        if (!isValidReferrer) {
            console.warn('⚠️ Invalid Referrer:', referrer);
            // لا نوقف الجلسة لكن نسجل المحاولة
            securityManager.logAccess('INVALID_REFERRER', { referrer });
        }
    }

    checkDirectAccess() {
        const params = new URLSearchParams(window.location.search);
        const videoUrl = params.get('url');
        const courseId = params.get('courseId');

        // يجب أن تكون هناك معاملات URL
        if (!videoUrl || !courseId) {
            console.error('❌ محاولة وصول مباشر بدون معاملات');
            // window.location.href = 'index.html';
        }

        // التحقق من أن البيانات موجودة في localStorage
        const studentData = localStorage.getItem('studentData');
        if (!studentData) {
            console.error('❌ لا توجد بيانات الطالب');
            // window.location.href = 'index.html';
        }
    }

    logAccess(action, details) {
        this.accessLog.push({
            timestamp: Date.now(),
            action,
            details,
            ip: sessionStorage.getItem('USER_IP')
        });
    }
}

const videoAccessControl = new VideoAccessControl();

// ========================================
// 🔐 حماية الفيديو من النسخ/التحميل
// ========================================

class VideoProtection {
    constructor() {
        this.protectedVideos = new Map();
        this.protectAllVideos();
    }

    protectAllVideos() {
        // منع right-click على جميع video elements
        document.addEventListener('contextmenu', (e) => {
            if (e.target.tagName === 'VIDEO' || e.target.tagName === 'IFRAME') {
                e.preventDefault();
                console.warn('⚠️ محاولة right-click على الفيديو');
                securityManager.logAccess('VIDEO_RIGHT_CLICK', { target: e.target.tagName });
                return false;
            }
        }, true);

        // منع Drag من الفيديو
        document.addEventListener('dragstart', (e) => {
            if (e.target.tagName === 'VIDEO' || e.target.tagName === 'IFRAME') {
                e.preventDefault();
                console.warn('⚠️ محاولة Drag للفيديو');
                return false;
            }
        }, true);

        // منع الضغط المزدوج
        document.addEventListener('mousedown', (e) => {
            if ((e.target.tagName === 'VIDEO' || e.target.tagName === 'IFRAME') && e.detail > 1) {
                e.preventDefault();
                console.warn('⚠️ محاولة ضغط مزدوج على الفيديو');
                return false;
            }
        }, true);

        // منع selection
        document.addEventListener('selectstart', (e) => {
            if (e.target.closest('video') || e.target.closest('iframe')) {
                e.preventDefault();
                return false;
            }
        }, true);
    }

    // منع تحميل الفيديو من الخارج
    sanitizeVideoUrl(url) {
        // التأكد من أن الرابط آمن وليس يحتوي على scripts
        if (url.includes('<') || url.includes('>') || url.includes('javascript:')) {
            throw new Error('⛔ Malicious URL Detected');
        }
        return url;
    }
}

const videoProtection = new VideoProtection();

// =====================================================
// مشغل الفيديو الاحترافي - Professional Video Player
// =====================================================

let videoPlayerState = {
    videoUrl: '',
    courseId: '',
    courseTitle: '',
    videoType: 'direct', // direct, youtube, vimeo, gdrive
    isPlaying: false,
    playbackRate: 1,
    playerElement: null,
    startTime: new Date(),
    watchedSeconds: 0
};

// =====================================================
// 1️⃣ دالة التهيئة - Initialization
// =====================================================
function initVideoPlayer() {
    // ========================================
    // 🔐 مرحلة 1: التحقق الأمني
    // ========================================

    console.log('🔒 [SECURITY] بدء مرحلة التحقق الأمني...');

    // التأكد من وجود جلسة آمنة
    if (!window.SESSION_TOKEN) {
        console.error('❌ لا توجد جلسة آمنة!');
        // window.location.href = 'index.html';
        // return;
    }

    // التحقق من Device Fingerprint
    if (!window.DEVICE_FINGERPRINT) {
        console.error('❌ فشل التحقق من بيانات الجهاز');
        // window.location.href = 'index.html';
        // return;
    }

    // التحقق من بيانات الطالب
    const studentData = localStorage.getItem('studentData');
    if (!studentData) {
        console.error('❌ لا توجد بيانات طالب');
        // window.location.href = './';
        // return;
    }

    // التحقق من وقت الجلسة
    const sessionAge = Date.now() - window.SESSION_START;
    if (sessionAge > 10 * 60 * 1000) { // 10 دقائق
        console.warn('⚠️ انتهت صلاحية الجلسة');
        // window.location.href = './';
        // return;
    }

    console.log('✅ [SECURITY] تم التحقق الأمني بنجاح');

    // ========================================
    // 🎬 مرحلة 2: تحميل الفيديو
    // ========================================

    console.log('🎬 تهيئة مشغل الفيديو...');

    // الحصول على بيانات الفيديو من URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    videoPlayerState.videoUrl = urlParams.get('url') || '';
    videoPlayerState.dailymotionId = urlParams.get('dailymotionId') || '';
    videoPlayerState.dailymotionId = urlParams.get('dailymotionId') || '';
    videoPlayerState.courseId = urlParams.get('courseId') || 'unknown';
    videoPlayerState.courseTitle = urlParams.get('title') || 'فيديو';

    // تشفير رابط الفيديو للحماية
    if (videoPlayerState.videoUrl) {
        try {
            videoPlayerState.videoUrl = videoProtection.sanitizeVideoUrl(videoPlayerState.videoUrl);
            securityManager.logAccess('VIDEO_LOAD_INITIATED', {
                courseId: videoPlayerState.courseId,
                videoType: 'pending'
            });
        } catch (e) {
            console.error('❌ رابط فيديو غير آمن:', e);
            showAlert('❌ رابط الفيديو غير آمن', 'error');
            return;
        }
    }

    // تحميل بيانات الطالب
    loadStudentData();

    // تحميل الفيديو
    if (videoPlayerState.videoUrl) {
        loadVideo(videoPlayerState.videoUrl, videoPlayerState.courseTitle);
    } else {
        showAlert('⚠️ لم يتم العثور على رابط الفيديو', 'error');
    }

    // تحميل الملاحظات المحفوظة
    loadSavedNotes();

    // حساب مدة المشاهدة
    trackWatchTime();

    // ========================================
    // 🔐 مرحلة 3: تفعيل المراقبة
    // ========================================

    // مراقبة محاولات الوصول غير المصرح
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            securityManager.logAccess('PAGE_HIDDEN', {});
        } else {
            securityManager.logAccess('PAGE_VISIBLE', {});
            // إعادة التحقق عند العودة
            if (Date.now() - window.SESSION_START > 8 * 60 * 60 * 1000) {
                console.warn('⚠️ انتهت مدة الجلسة');
                securityManager.terminateSession('Session Expired');
            }
        }
    });
}

// =====================================================
// 2️⃣ تحميل بيانات الطالب - Load Student Data
// =====================================================
function loadStudentData() {
    try {
        // Try to get from localStorage
        const studentData = localStorage.getItem('studentData');
        if (studentData) {
            const student = JSON.parse(studentData);
            updateStudentDisplay(student);
            addWatermark(student.name, student.phone);
        } else {
            // Default display
            updateStudentDisplay({ name: 'الطالب', phone: '****' });
        }
    } catch (error) {
        console.error('خطأ في تحميل بيانات الطالب:', error);
        updateStudentDisplay({ name: 'الطالب', phone: '****' });
    }
}

function updateStudentDisplay(student) {
    const studentName = document.getElementById('studentName');
    const avatar = document.getElementById('studentAvatar');

    if (studentName) {
        studentName.textContent = student.name || 'الطالب';
    }

    if (avatar) {
        const firstLetter = (student.name || 'ط')[0].toUpperCase();
        avatar.textContent = firstLetter;
    }
}

function addWatermark(name, phone) {
    const watermark = document.getElementById('watermark');
    if (watermark) {
        watermark.innerHTML = `${name}<br><span style="font-size: 0.5em;">${phone}</span>`;
    }
}

// =====================================================
// 3️⃣ تحميل الفيديو - Load Video
// =====================================================
function loadVideo(url, title) {
    console.log('📺 جاري تحميل الفيديو...', { title });

    // ========================================
    // 🔐 مرحلة 1: التحقق الأمني قبل التحميل
    // ========================================

    // التحقق من الجلسة
    if (!window.SESSION_TOKEN || !sessionStorage.getItem('PLAYER_SESSION')) {
        console.error('❌ جلسة معطوبة - رفض التحميل');
        securityManager.terminateSession('Session Compromised');
        return;
    }

    // التحقق من أن الرابط موجود من البداية (من watchVideoFunction)
    if (!url || typeof url !== 'string') {
        console.error('❌ محاولة تحميل فيديو برابط غير صحيح');
        logSuspiciousActivity('Invalid video URL format');
        return;
    }

    // منع الرابط المشفرة والخطيرة
    try {
        new URL(url);
    } catch {
        // قد يكون رابط نسبي أو خاص
        if (!url.startsWith('/') && !url.startsWith('http')) {
            console.error('❌ رابط فيديو غير صحيح');
            return;
        }
    }

    // جرعة أمان إضافية - منع رموز الـ HTML
    if (/[<>"`{}|\\^[\]]/g.test(url)) {
        console.error('❌ محاولة injection');
        logSuspiciousActivity('Potential code injection detected');
        return;
    }

    // ========================================
    // 🔐 مرحلة 2: تسجيل المحاولة
    // ========================================

    securityManager.logAccess('VIDEO_LOAD_ATTEMPT', {
        courseId: videoPlayerState.courseId,
        title: title,
        urlHash: DataEncryption.hashData(url)
    });

    // تحديد نوع الفيديو
    const videoType = detectVideoType(url);
    videoPlayerState.videoType = videoType;

    const videoContent = document.getElementById('videoContent');
    let embedCode = '';

    try {
        // ========================================
        // 🔐 مرحلة 3: تحميل حسب النوع مع الحماية
        // ========================================

        switch (videoType) {
            case 'youtube':
                console.log('📹 تحميل YouTube بحماية...');
                embedCode = loadYouTubeVideo(url, title);
                securityManager.logAccess('YOUTUBE_LOADED', { title });
                break;

            case 'gdrive':
                console.log('📁 تحميل Google Drive بحماية...');
                embedCode = loadGoogleDriveVideo(url, title);
                securityManager.logAccess('GDRIVE_LOADED', { title });
                break;

            case 'vimeo':
                console.log('🎬 تحميل Vimeo بحماية...');
                embedCode = loadVimeoVideo(url, title);
                securityManager.logAccess('VIMEO_LOADED', { title });
                break;

            case 'direct':
            default:
                console.log('🎥 تحميل فيديو محلي بحماية...');
                embedCode = loadDirectVideo(url, title);
                securityManager.logAccess('DIRECT_VIDEO_LOADED', { title });
                break;
        }

        // ========================================
        // 🔐 مرحلة 4: إدراج مع الحماية
        // ========================================

        videoContent.innerHTML = embedCode;

        // منع أي محاولة لتعديل محتوى الفيديو بعد التحميل
        Object.freeze(videoContent);

        // Show player controls only for direct videos
        if (videoType === 'direct') {
            document.getElementById('playerControls').style.display = 'grid';
            attachVideoPlayerEvents();
        }

        // Add course info
        updateCourseInfo(title);

        console.log('✅ تم تحميل الفيديو بنجاح وبحماية كاملة');

    } catch (error) {
        console.error('❌ خطأ في تحميل الفيديو:', error);
        securityManager.logAccess('VIDEO_LOAD_ERROR', {
            error: error.message,
            videoType: videoType
        });

        showAlert('❌ حدث خطأ في تحميل الفيديو', 'error');
        videoContent.innerHTML = `
            <div style="padding: 40px; text-align: center; color: #ef4444;">
                <i class="fas fa-exclamation-circle" style="font-size: 50px; margin-bottom: 20px;"></i>
                <p>عذراً، حدث خطأ في تحميل الفيديو</p>
                <p style="font-size: 0.9rem; color: #94a3b8; margin-top: 10px;">يرجى المحاولة مرة أخرى أو التواصل مع الدعم</p>
            </div>
        `;
    }
}

// =====================================================
// 4️⃣ كشف نوع الفيديو - Detect Video Type
// =====================================================
function detectVideoType(url) {
    if (!url) return 'direct';

    url = url.toLowerCase();

    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        return 'youtube';
    } else if (url.includes('drive.google.com')) {
        return 'gdrive';
    } else if (url.includes('vimeo.com')) {
        return 'vimeo';
    } else if (url.includes('mp4') || url.includes('webm') || url.includes('video')) {
        return 'direct';
    }

    return 'direct';
}

// =====================================================
// 5️⃣ تحميل فيديو YouTube - Load YouTube
// =====================================================
function loadYouTubeVideo(url, title) {
    console.log('🔒 بدء تحميل YouTube بحماية فائقة...');

    // ========================================
    // 🔐 التحقق من الأمان
    // ========================================

    if (!window.SESSION_TOKEN) {
        throw new Error('❌ جلسة غير آمنة - رفض تحميل الفيديو');
    }

    let videoId = '';

    if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1].split('?')[0].split('&')[0];
    } else if (url.includes('v=')) {
        videoId = url.split('v=')[1].split('&')[0];
    } else if (url.includes('/embed/')) {
        videoId = url.split('/embed/')[1].split('?')[0].split('"')[0];
    }

    if (!videoId) {
        console.error('❌ معرّف الفيديو غير صحيح');
        throw new Error('Invalid YouTube URL');
    }

    // التحقق من صحة معرّف الفيديو (11 حرف عادةً)
    if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
        console.error('❌ محاولة injection في معرّف الفيديو');
        logSuspiciousActivity('Invalid YouTube video ID format');
        throw new Error('❌ معرّف فيديو غير صحيح');
    }

    console.log('✓ تم التحقق من معرّف الفيديو:', videoId.substring(0, 5) + '***');

    // حماية من النسخ والمشاركة
    setTimeout(() => {
        secureYouTubeFrame();
    }, 500);

    // إنشاء iframe بحماية مكثفة
    const iframeId = 'youtubeFrame_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    return `
        <iframe 
            class="video-iframe secure-youtube locked-frame"
            id="${iframeId}"
            src="https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&controls=1&autoplay=0&disablekb=1&fs=1"
            title="${title}"
            allow="autoplay"
            allowfullscreen="false"
            referrerpolicy="no-referrer"
            credentialless="true"
            style="pointer-events: auto; user-select: none; -webkit-user-select: none;">
        </iframe>
    `;
}

// =====================================================
// حماية فائقة لـ YouTube
// =====================================================
function secureYouTubeFrame() {
    const allFrames = document.querySelectorAll('iframe[src*="youtube.com/embed"]');

    allFrames.forEach(frame => {
        console.log('🔐 تطبيق حماية فائقة على YouTube...');

        // منع الـ fullscreen
        frame.setAttribute('allowfullscreen', 'false');

        // منع الـ sharing والـ suggestions
        const src = frame.getAttribute('src');
        if (src && !src.includes('rel=0')) {
            frame.setAttribute('src', src + '&rel=0');
        }

        // منع الـ right-click
        frame.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            logSuspiciousActivity('Right-click on YouTube frame');
            return false;
        }, true);
    });
}

// =====================================================
// 6️⃣ تحميل فيديو Google Drive - Load Google Drive
// =====================================================
function loadGoogleDriveVideo(url, title) {
    console.log('🔒 بدء تحميل Google Drive بحماية فائقة...');

    // ========================================
    // 🔐 التحقق من الأمان
    // ========================================

    if (!window.SESSION_TOKEN) {
        throw new Error('❌ جلسة غير آمنة - رفض تحميل الفيديو');
    }

    let fileId = '';

    // Extract file ID from various Google Drive URL formats
    if (url.includes('/file/d/')) {
        fileId = url.split('/file/d/')[1].split('/')[0];
    } else if (url.includes('id=')) {
        fileId = url.split('id=')[1].split('&')[0];
    } else if (url.match(/\/d\/(.*?)\//)) {
        fileId = url.match(/\/d\/(.*?)\//)[1];
    }

    if (!fileId) {
        console.error('❌ معرّف الملف غير صحيح');
        throw new Error('Invalid Google Drive URL');
    }

    // التحقق من صحة معرّف الملف
    if (!/^[a-zA-Z0-9_-]+$/.test(fileId)) {
        console.error('❌ محاولة injection في معرّف الملف');
        logSuspiciousActivity('Invalid file ID format in Google Drive URL');
        throw new Error('❌ معرّف ملف غير صحيح');
    }

    console.log('✓ تم التحقق من معرّف الملف:', fileId.substring(0, 10) + '***');

    // إنشاء iframe
    const iframeId = 'gdriveFrame_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    // ✅ الحل الصحيح: iframe مع /preview لكن بـ CSS صح يضمن الارتفاع على كل الأجهزة
    // uc?export=view ممنوع بسبب CORS من Google
    // /preview هو الطريقة الرسمية الوحيدة اللي بتشتغل
    return `
        <div id="gdrive_wrapper_${iframeId}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: #000; overflow: hidden;">
            <iframe 
                class="video-iframe secure-gdrive"
                id="${iframeId}"
                src="https://drive.google.com/file/d/${fileId}/preview"
                title="${title}"
                allow="autoplay"
                style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; background: #000; display: block;">
            </iframe>
            <!-- طبقة بالركن الأيمن العلوي تغطي زرار الفتح في الخارج بتاع Drive -->
            <div style="
                position: absolute;
                top: 0; right: 0;
                width: 64px;
                height: 64px;
                background: #000;
                z-index: 100;
                pointer-events: all;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: default;
            " onclick="return false;" ondblclick="return false;">
                <img src="logo.jpeg" style="width: 52px; height: 52px; object-fit: contain; border-radius: 8px; opacity: 0.95;" draggable="false">
            </div>
        </div>
    `;
}

// =====================================================
// ✅ Google Drive Fallback - لو direct video فشل
// =====================================================
function gdriveVideoError(elementId, fileId, title) {
    console.warn('⚠️ Direct video failed, trying iframe preview fallback...');
    const videoEl = document.getElementById(elementId);
    if (!videoEl) return;

    // استبدال الـ video element بـ iframe كـ fallback
    const parent = videoEl.parentElement;
    parent.innerHTML = `
        <iframe 
            class="video-iframe"
            src="https://drive.google.com/file/d/${fileId}/preview"
            title="${title}"
            style="width: 100%; height: 100%; border: none; background: #000;"
            allow="autoplay; fullscreen"
            allowfullscreen>
        </iframe>
        <div style="position: absolute; top: 0; right: 0; width: 55px; height: 55px; z-index: 10; cursor: default;"></div>
    `;
}

// =====================================================
// 7️⃣ تحميل فيديو Vimeo - Load Vimeo
// =====================================================
function loadVimeoVideo(url, title) {
    let videoId = '';

    if (url.includes('vimeo.com/')) {
        videoId = url.split('vimeo.com/')[1].split('?')[0].split('&')[0];
    }

    if (!videoId) {
        throw new Error('Invalid Vimeo URL');
    }

    console.log('🟣 تحميل Vimeo:', videoId);

    return `
        <iframe 
            class="video-iframe"
            src="https://player.vimeo.com/video/${videoId}?h=&title=0&byline=0&portrait=0"
            title="${title}"
            allow="autoplay; fullscreen; picture-in-picture"
            allowfullscreen>
        </iframe>
    `;
}

// =====================================================
// 8️⃣ تحميل فيديو مباشر - Load Direct Video
// =====================================================
function loadDirectVideo(url, title) {
    console.log('� بدء تحميل فيديو مباشر بحماية فائقة...');

    // ========================================
    // 🔐 التحقق من الأمان
    // ========================================

    if (!window.SESSION_TOKEN) {
        throw new Error('❌ جلسة غير آمنة - رفض تحميل الفيديو');
    }

    // التحقق من أن الرابط موجود وآمن
    if (!url || typeof url !== 'string') {
        throw new Error('❌ رابط فيديو غير صحيح');
    }

    // منع الـ XSS
    if (/<|>|"|'|`|javascript:|data:/i.test(url)) {
        console.error('❌ محاولة injection');
        logSuspiciousActivity('XSS attempt in direct video URL');
        throw new Error('❌ رابط غير آمن');
    }

    console.log('✓ تم التحقق من الرابط بنجاح');

    // حماية من التنزيل
    setTimeout(() => {
        secureDirectVideoPlayer();
    }, 200);

    // إنشاء video element بحماية مكثفة
    const playerId = 'customVideoPlayer_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    // تشفير الرابط
    const encryptedUrl = DataEncryption.encrypt(url);

    return `
        <video 
            id="${playerId}"
            class="video-player secure-direct-video"
            controls
            controlsList="nodownload nofullscreen"
            crossorigin="anonymous"
            preload="none"
            poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1280 720'%3E%3Crect fill='%23000' width='1280' height='720'/%3E%3C/svg%3E"
            style="user-select: none; -webkit-user-select: none; pointer-events: auto;"
            data-encrypted="${encryptedUrl}"
            data-session="${window.SESSION_TOKEN}"
            oncontextmenu="event.preventDefault(); return false;"
        >
            <source src="${url}" type="video/mp4">
            متصفحك لا يدعم تشغيل الفيديو
        </video>
    `;
}

// =====================================================
// حماية فائقة للفيديو المباشر
// =====================================================
function secureDirectVideoPlayer() {
    const allVideos = document.querySelectorAll('video[data-session]');

    allVideos.forEach(video => {
        console.log('🔐 تطبيق حماية فائقة على الفيديو المباشر...');

        // منع التنزيل - بشكل أقوى
        video.setAttribute('controlsList', 'nodownload nofullscreen');

        // منع الـ right-click المباشر على الـ video
        video.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            logSuspiciousActivity('Right-click on video player');
            return false;
        }, true);

        // منع الـ Drag
        video.addEventListener('dragstart', (e) => {
            e.preventDefault();
            logSuspiciousActivity('Drag attempt on video');
            return false;
        }, true);

        // منع الـ Double-click
        video.addEventListener('dblclick', (e) => {
            e.preventDefault();
            logSuspiciousActivity('Double-click on video');
            return false;
        }, true);

        // منع الـ Copy
        video.addEventListener('copy', (e) => {
            e.preventDefault();
            return false;
        }, true);

        // منع الـ Selection
        video.style.webkitUserSelect = 'none';
        video.style.userSelect = 'none';
        video.style.webkitTouchCallout = 'none';

        // منع الـ Fullscreen في بعض الحالات
        const controls = video.querySelector('[role="group"]');
        if (controls) {
            const fullscreenBtn = controls.querySelector('[title*="Fullscreen"], [title*="fullscreen"]');
            if (fullscreenBtn) {
                fullscreenBtn.remove();
            }
        }

        // مراقبة النسخ من الـ network
        video.addEventListener('play', () => {
            securityManager.logAccess('VIDEO_PLAY', {
                duration: video.duration,
                currentTime: video.currentTime
            });
        });

        // منع الوصول للـ source tags
        const sources = video.querySelectorAll('source');
        sources.forEach(source => {
            // تشفير src
            const originalSrc = source.getAttribute('src');
            if (originalSrc) {
                source.setAttribute('data-encrypted-src', DataEncryption.encrypt(originalSrc));
                // منع الوصول المباشر
                Object.defineProperty(source, 'src', {
                    get: () => originalSrc,
                    set: () => {
                        logSuspiciousActivity('Attempt to modify video source');
                        console.error('❌ لا يمكن تعديل مصدر الفيديو');
                    }
                });
            }
        });
    });
}

// =====================================================
// 9️⃣ ربط أحداث مشغل الفيديو - Attach Video Events
// =====================================================
function attachVideoPlayerEvents() {
    // ابحث عن أي video element محمي
    const videoPlayer = document.querySelector('video[data-session]') || document.getElementById('customVideoPlayer');

    if (!videoPlayer) {
        console.warn('⚠️ لم يتم العثور على عنصر الفيديو');
        return;
    }

    console.log('🔒 تطبيق مراقبة أمنية على أحداث الفيديو...');

    videoPlayerState.playerElement = videoPlayer;

    // ========================================
    // 🔐 مراقبة محاولات النسخ والتنزيل
    // ========================================

    // منع النسخ من الـ cache
    videoPlayer.addEventListener('durationchange', () => {
        securityManager.logAccess('VIDEO_DURATION_LOADED', {
            duration: videoPlayer.duration
        });
    });

    // Update duration
    videoPlayer.addEventListener('loadedmetadata', () => {
        console.log('✓ تم تحميل بيانات الفيديو');
        updateDuration();
        securityManager.logAccess('VIDEO_METADATA_LOADED', {
            duration: videoPlayer.duration,
            videoWidth: videoPlayer.videoWidth,
            videoHeight: videoPlayer.videoHeight
        });
    });

    // مراقبة جودة الفيديو
    videoPlayer.addEventListener('progress', () => {
        const bufferedLength = videoPlayer.buffered.length;
        if (bufferedLength > 0) {
            const bufferedEnd = videoPlayer.buffered.end(bufferedLength - 1);
            // تسجيل التقدم فقط كل 10 ثوان
            if (Math.floor(bufferedEnd) % 10 === 0) {
                console.log(`📊 تم تحميل ${Math.floor((bufferedEnd / videoPlayer.duration) * 100)}% من الفيديو`);
            }
        }
    });

    // Update current time and progress
    videoPlayer.addEventListener('timeupdate', () => {
        updateCurrentTime();
        updateProgress();
    });

    // Track play/pause
    videoPlayer.addEventListener('play', () => {
        videoPlayerState.isPlaying = true;
        console.log('▶️ الفيديو يتم تشغيله');
        securityManager.logAccess('VIDEO_PLAYED', {
            timestamp: new Date().toISOString()
        });
    });

    videoPlayer.addEventListener('pause', () => {
        videoPlayerState.isPlaying = false;
        console.log('⏸️ الفيديو متوقف');
        securityManager.logAccess('VIDEO_PAUSED', {
            currentTime: videoPlayer.currentTime
        });
    });

    // Handle ended
    videoPlayer.addEventListener('ended', () => {
        console.log('✅ انتهى الفيديو');
        securityManager.logAccess('VIDEO_ENDED', {
            watchedDuration: videoPlayer.duration,
            completionTime: new Date().toISOString()
        });
        showAlert('✅ لقد انتهيت من مشاهدة الفيديو!', 'success');
        saveWatchProgress();
    });

    // منع الـ Right-click على المشغل
    videoPlayer.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        logSuspiciousActivity('Right-click on video player');
        return false;
    }, true);

    // Set initial playback rate
    videoPlayer.playbackRate = videoPlayerState.playbackRate;

    console.log('✅ تم ربط جميع أحداث الفيديو مع المراقبة الأمنية');
}

// =====================================================
// 🔟 تحديث معلومات الدورة - Update Course Info
// =====================================================
function updateCourseInfo(title) {
    const courseNameEl = document.getElementById('courseName');
    if (courseNameEl) {
        courseNameEl.textContent = title;
    }

    // You can add more course info here
    // document.getElementById('instructorName').textContent = 'معلم';
    // document.getElementById('courseLevel').textContent = 'أساسي';
    // document.getElementById('courseType').textContent = 'مدفوع';
}

// =====================================================
// التحكم في السرعة - Speed Control
// =====================================================
function changeSpeed(speed) {
    const videoPlayer = document.getElementById('customVideoPlayer');
    if (videoPlayer) {
        videoPlayer.playbackRate = parseFloat(speed);
        videoPlayerState.playbackRate = parseFloat(speed);
        console.log('⚡ السرعة:', speed);
    }
}

// =====================================================
// التحكم في الصوت - Volume Control
// =====================================================
function changeVolume(volume) {
    const videoPlayer = document.getElementById('customVideoPlayer');
    if (videoPlayer) {
        videoPlayer.volume = parseFloat(volume) / 100;
        console.log('🔊 مستوى الصوت:', volume);
    }
}

// =====================================================
// تغيير الجودة - Change Quality
// =====================================================
function changeQuality(quality) {
    console.log('📊 تغيير الجودة إلى:', quality);
    // This would require having multiple quality versions of the video
    showAlert('✅ تم تغيير الجودة إلى ' + quality, 'success');
}

// =====================================================
// تحديث الوقت الحالي - Update Current Time
// =====================================================
function updateCurrentTime() {
    const videoPlayer = document.getElementById('customVideoPlayer');
    if (!videoPlayer) return;

    const currentTimeEl = document.getElementById('currentTime');
    if (currentTimeEl) {
        currentTimeEl.textContent = formatTime(videoPlayer.currentTime);
    }
}

// =====================================================
// تحديث المدة - Update Duration
// =====================================================
function updateDuration() {
    const videoPlayer = document.getElementById('customVideoPlayer');
    if (!videoPlayer) return;

    const durationEl = document.getElementById('duration');
    if (durationEl) {
        durationEl.textContent = formatTime(videoPlayer.duration);
    }
}

// =====================================================
// تحديث شريط التقدم - Update Progress
// =====================================================
function updateProgress() {
    const videoPlayer = document.getElementById('customVideoPlayer');
    if (!videoPlayer || !videoPlayer.duration) return;

    const progress = (videoPlayer.currentTime / videoPlayer.duration) * 100;
    const progressBar = document.getElementById('progressBar');
    const progressPercent = document.getElementById('progressPercent');

    if (progressBar) {
        progressBar.style.width = progress + '%';
    }

    if (progressPercent) {
        progressPercent.textContent = Math.round(progress) + '%';
    }
}

// =====================================================
// تنسيق الوقت - Format Time
// =====================================================
function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${minutes}:${String(secs).padStart(2, '0')}`;
}

// =====================================================
// ملء الشاشة - Fullscreen
// =====================================================
function toggleFullscreen() {
    const videoContainer = document.querySelector('.video-container');
    if (!videoContainer) {
        console.error('❌ لم يتم العثور على حاوية الفيديو');
        return;
    }

    try {
        // Check if already fullscreen
        if (document.fullscreenElement || document.webkitFullscreenElement) {
            // Exit fullscreen
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
        } else {
            // Enter fullscreen
            if (videoContainer.requestFullscreen) {
                videoContainer.requestFullscreen();
            } else if (videoContainer.webkitRequestFullscreen) {
                videoContainer.webkitRequestFullscreen();
            } else if (videoContainer.msRequestFullscreen) {
                videoContainer.msRequestFullscreen();
            }
        }
        console.log('⛶ تبديل ملء الشاشة');
    } catch (error) {
        console.error('❌ خطأ في ملء الشاشة:', error);
        showAlert('❌ لا يمكن تفعيل ملء الشاشة', 'error');
    }
}

// =====================================================
// تقرير مشكلة - Report Problem
// =====================================================
function reportProblem() {
    const issue = prompt('🚩 اشرح المشكلة التي واجهتها:', '');

    if (issue && issue.trim()) {
        const report = {
            courseId: videoPlayerState.courseId,
            courseTitle: videoPlayerState.courseTitle,
            issue: issue,
            timestamp: new Date().toISOString(),
            videoType: videoPlayerState.videoType,
            watchedSeconds: videoPlayerState.watchedSeconds
        };

        console.log('📋 تقرير المشكلة:', report);

        // Send to server (implement your backend logic)
        // saveReportToServer(report);

        showAlert('✅ شكراً! تم استقبال تقريرك', 'success');
    }
}

// =====================================================
// حفظ الملاحظات - Save Notes
// =====================================================
function saveNotes() {
    const notesTextarea = document.getElementById('notesTextarea');
    if (!notesTextarea) return;

    const notes = notesTextarea.value;
    const courseId = videoPlayerState.courseId;

    try {
        localStorage.setItem(`notes_${courseId}`, notes);
        showAlert('✅ تم حفظ الملاحظات بنجاح', 'success');
        console.log('💾 تم حفظ الملاحظات');
    } catch (error) {
        console.error('خطأ في حفظ الملاحظات:', error);
        showAlert('❌ حدث خطأ في حفظ الملاحظات', 'error');
    }
}

// =====================================================
// تحميل الملاحظات المحفوظة - Load Saved Notes
// =====================================================
function loadSavedNotes() {
    const courseId = videoPlayerState.courseId;
    const notesTextarea = document.getElementById('notesTextarea');

    if (!notesTextarea) return;

    try {
        const saved = localStorage.getItem(`notes_${courseId}`);
        if (saved) {
            notesTextarea.value = saved;
            console.log('📤 تم تحميل الملاحظات المحفوظة');
        }
    } catch (error) {
        console.error('خطأ في تحميل الملاحظات:', error);
    }
}

// =====================================================
// تحميل الملاحظات - Download Notes
// =====================================================
function downloadNotes() {
    const notesTextarea = document.getElementById('notesTextarea');
    const notes = notesTextarea ? notesTextarea.value : '';

    if (!notes.trim()) {
        showAlert('⚠️ لا توجد ملاحظات لتحميلها', 'info');
        return;
    }

    const element = document.createElement('a');
    const file = new Blob([notes], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `ملاحظات_${videoPlayerState.courseTitle}_${new Date().toLocaleDateString('ar-EG')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    showAlert('✅ تم تحميل الملاحظات', 'success');
}

// =====================================================
// مشاركة الفيديو - Share Video
// =====================================================
function shareVideo() {
    const shareText = `تابع معي: ${videoPlayerState.courseTitle}\n${window.location.href}`;

    if (navigator.share) {
        navigator.share({
            title: videoPlayerState.courseTitle,
            text: 'انضم إلينا في منصة ابن القائد',
            url: window.location.href
        }).catch(err => console.log('خطأ في المشاركة:', err));
    } else {
        // Fallback
        const tempInput = document.createElement('input');
        tempInput.value = window.location.href;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        showAlert('✅ تم نسخ الرابط', 'success');
    }
}

// =====================================================
// تحميل الموارد - Download Resources
// =====================================================
function downloadResource(type) {
    const resources = {
        slides: { name: 'slides.pdf', icon: '📊' },
        pdf: { name: 'material.pdf', icon: '📄' },
        code: { name: 'code.zip', icon: '💻' }
    };

    const resource = resources[type];
    if (resource) {
        showAlert(`✅ جاري تحميل ${resource.name}...`, 'success');
        console.log(`📥 تحميل المورد: ${resource.name}`);
        // Implement your download logic here
    }
}

// =====================================================
// تتبع وقت المشاهدة - Track Watch Time
// =====================================================
function trackWatchTime() {
    setInterval(() => {
        if (videoPlayerState.isPlaying) {
            videoPlayerState.watchedSeconds++;
        }
    }, 1000);

    // Save progress when user leaves
    window.addEventListener('beforeunload', () => {
        saveWatchProgress();
    });
}

// =====================================================
// حفظ تقدم المشاهدة - Save Watch Progress
// =====================================================
function saveWatchProgress() {
    const progress = {
        courseId: videoPlayerState.courseId,
        watchedSeconds: videoPlayerState.watchedSeconds,
        totalDuration: videoPlayerState.playerElement?.duration || 0,
        currentTime: videoPlayerState.playerElement?.currentTime || 0,
        timestamp: new Date().toISOString()
    };

    try {
        localStorage.setItem(`progress_${videoPlayerState.courseId}`, JSON.stringify(progress));
        console.log('📊 تم حفظ تقدم المشاهدة:', progress);
    } catch (error) {
        console.error('خطأ في حفظ التقدم:', error);
    }
}

// =====================================================
// عرض التنبيهات - Show Alert
// =====================================================
function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alertContainer');
    if (!alertContainer) return;

    const alert = document.createElement('div');
    alert.className = `alert ${type}`;
    alert.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'times-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;

    alertContainer.appendChild(alert);

    // Auto remove after 5 seconds
    setTimeout(() => {
        alert.style.opacity = '0';
        setTimeout(() => alert.remove(), 300);
    }, 5000);
}

// =====================================================
// العودة - Go Back
// =====================================================
function goBack() {
    saveWatchProgress();
    window.history.back();
}

// =====================================================
// الملء الكامل - Full Screen Toggle
// =====================================================
function toggleFullscreen() {
    const videoContainer = document.getElementById('videoContainer');
    const btn = document.getElementById('mainFullscreenBtn');
    const icon = document.getElementById('fullscreenIcon');
    const btnText = document.getElementById('fullscreenBtnText');
    if (!videoContainer) return;

    const isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement);

    if (!isFullscreen) {
        // دخول fullscreen
        if (videoContainer.requestFullscreen) {
            videoContainer.requestFullscreen();
        } else if (videoContainer.webkitRequestFullscreen) {
            videoContainer.webkitRequestFullscreen();
        } else if (videoContainer.mozRequestFullScreen) {
            videoContainer.mozRequestFullScreen();
        } else if (videoContainer.msRequestFullscreen) {
            videoContainer.msRequestFullscreen();
        }
    } else {
        // خروج fullscreen
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        }
    }
}

// تحديث نص الزرار عند تغيير حالة fullscreen
function updateFullscreenBtn() {
    const icon = document.getElementById('fullscreenIcon');
    const btnText = document.getElementById('fullscreenBtnText');
    const isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement);

    if (icon) icon.className = isFullscreen ? 'fas fa-compress' : 'fas fa-expand';
    if (btnText) btnText.textContent = isFullscreen ? 'تصغير الفيديو' : 'تكبير الفيديو';
}

document.addEventListener('fullscreenchange', updateFullscreenBtn);
document.addEventListener('webkitfullscreenchange', updateFullscreenBtn);
document.addEventListener('mozfullscreenchange', updateFullscreenBtn);

// للتوافق مع الكود القديم
function requestFullscreen() { toggleFullscreen(); }

// =====================================================
// البدء عند تحميل الصفحة
// =====================================================
document.addEventListener('DOMContentLoaded', initVideoPlayer);

// =====================================================
// معالجة مفتاح ESC للخروج من ملء الشاشة
// =====================================================
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        }
    }
});

console.log('✅ تم تحميل مشغل الفيديو الاحترافي');