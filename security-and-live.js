/**
 * نظام الأمان + Live Updates
 * منع التسريب + تحديثات فورية بدون Refresh
 */

// ==================== 1️⃣ منع تسجيل الشاشة ====================

const ScreenRecordingProtection = {
    init() {
        // منع الوصول إلى MediaDevices
        this.blockScreenCapture();
        this.blockRecordingAPIs();
        this.preventDevTools();
        this.preventDataExport();
    },

    blockScreenCapture() {
        // فترة المجال برمجياً
        if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
            navigator.mediaDevices.getDisplayMedia = async () => {
                throw new Error('تسجيل الشاشة غير مسموح');
            };
        }

        // منع Electron capture
        if (window.electronAPI) {
            delete window.electronAPI;
        }
    },

    blockRecordingAPIs() {
        // MediaRecorder API
        if (window.MediaRecorder) {
            const OriginalMediaRecorder = window.MediaRecorder;
            window.MediaRecorder = function (...args) {
                // السماح فقط للتطبيق الداخلي
                if (!this._isInternal) {
                    console.warn('منع تسجيل الوسائط');
                    return null;
                }
                return new OriginalMediaRecorder(...args);
            };
        }

        // منع canvas capture
        HTMLCanvasElement.prototype.captureStream = function () {
            console.warn('لا يمكن التقاط من Canvas');
            return null;
        };
    },

    preventDevTools() {
        // منع فتح DevTools
        document.addEventListener('keydown', (e) => {
            const ctrlOrMeta = e.ctrlKey || e.metaKey;
            const shift = e.shiftKey;
            const key = e.key.toUpperCase();

            // F12 or Ctrl+Shift+I/J/C/K or Ctrl+U/S/P
            if (
                e.key === 'F12' || 
                (ctrlOrMeta && shift && ['I', 'J', 'C', 'K'].includes(key)) ||
                (ctrlOrMeta && ['U', 'S', 'P', 'A'].includes(key))
            ) {
                e.preventDefault();
                e.stopPropagation();
                this.showProtectionAlert('هذا الإجراء غير مسموح به لحماية المحتوى');
                return false;
            }
        });

        // منع فتح Context Menu
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showProtectionAlert('تم تعطيل القائمة اليمينية');
            return false;
        });
    },

    preventDataExport() {
        // منع Copy
        document.addEventListener('copy', (e) => {
            e.preventDefault();
            console.warn('النسخ معطل');
        });

        // منع حفظ الصورة
        document.addEventListener('dragstart', (e) => {
            if (e.target.tagName === 'IMG') {
                e.preventDefault();
                console.warn('لا يمكن حفظ الصور');
            }
        });

        // منع Drag & Drop للصور
        document.addEventListener('drop', (e) => {
            if (e.dataTransfer.types.includes('Files')) {
                e.preventDefault();
                console.warn('لا يمكن سحب الملفات');
            }
        });
    },

    showProtectionAlert(message) {
        const alert = document.createElement('div');
        alert.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #ef4444, #dc2626);
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            z-index: 9999;
            font-weight: bold;
            font-family: Cairo, sans-serif;
            box-shadow: 0 10px 25px rgba(0,0,0,0.3);
            animation: slideDown 0.3s ease;
        `;
        alert.innerHTML = `⚠️ ${message}`;
        document.body.appendChild(alert);
        setTimeout(() => alert.remove(), 3000);
    }
};

// ==================== 2️⃣ منع الـ Screenshots ====================

const ScreenshotProtection = {
    init() {
        this.preventPrintScreen();
        this.preventAltPrintScreen();
        this.blockScreenshotTools();
        this.monitorFocus();
    },

    preventPrintScreen() {
        document.addEventListener('keyup', (e) => {
            if (e.key === 'PrintScreen') {
                e.preventDefault();
                this.clearClipboard();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'PrintScreen') {
                e.preventDefault();
            }
        });
    },

    preventAltPrintScreen() {
        document.addEventListener('keydown', (e) => {
            // Alt + Print Screen
            if (e.altKey && e.key === 'PrintScreen') {
                e.preventDefault();
                this.clearClipboard();
            }
        });
    },

    blockScreenshotTools() {
        // منع الوصول إلى clipboard API
        if (navigator.clipboard) {
            const originalWrite = navigator.clipboard.write;
            navigator.clipboard.write = async (...args) => {
                console.warn('الوصول إلى Clipboard مقيد');
                return Promise.resolve();
            };
        }

        // مراقبة الـ Paste
        document.addEventListener('paste', (e) => {
            // السماح فقط في حقول الإدخال
            if (!['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
                e.preventDefault();
            }
        });
    },

    clearClipboard() {
        // محاولة تنظيف الـ Clipboard
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText('').catch(() => { });
        }
    },

    monitorFocus() {
        // تنبيه عند محاولة تسجيل الشاشة بتطبيق آخر
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                console.warn('تم الخروج من الصفحة');
                // يمكن إيقاف الفيديو مؤقتاً
            }
        });

        window.addEventListener('blur', () => {
            console.log('⚠️ نافذة المتصفح فقدت التركيز');
        });

        window.addEventListener('focus', () => {
            console.log('✅ نافذة المتصفح استعادت التركيز');
        });
    }
};

// ==================== 3️⃣ نظام Live Updates بدون Refresh ====================

class LiveUpdatesManager {
    constructor() {
        this.subscribers = new Map();
        this.updateInterval = 1000; // 1 ثانية
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
    }

    subscribe(channel, callback) {
        if (!this.subscribers.has(channel)) {
            this.subscribers.set(channel, []);
        }
        this.subscribers.get(channel).push(callback);
        console.log(`✅ تم الاشتراك في: ${channel}`);
    }

    unsubscribe(channel, callback) {
        if (this.subscribers.has(channel)) {
            const callbacks = this.subscribers.get(channel);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    async publish(channel, data) {
        if (this.subscribers.has(channel)) {
            const callbacks = this.subscribers.get(channel);
            callbacks.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`خطأ في تنفيذ callback: ${error}`);
                }
            });
        }
    }

    // ==================== Realtime مع Supabase ====================

    async initRealtimeConnection() {
        if (!window.supabaseClient) return;

        this.isConnected = true;
        console.log('🔵 تم الاتصال بـ Realtime');

        // الاشتراك في تحديثات الكورسات
        this.subscribeToCoursesUpdates();
        this.subscribeToStudentUpdates();
        this.subscribeToAdminUpdates();
    }

    subscribeToCoursesUpdates() {
        if (!window.supabaseClient) return;

        const subscription = window.supabaseClient
            .channel('public:courses')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'courses' },
                (payload) => {
                    console.log('📚 تحديث في الكورسات:', payload);
                    this.publish('courses_updated', payload);
                    this.publish('dashboard_refresh', { type: 'courses' });
                }
            )
            .subscribe();
    }

    subscribeToStudentUpdates() {
        if (!window.supabaseClient || !window.currentStudent) return;

        const studentId = window.currentStudent.id;

        const subscription = window.supabaseClient
            .channel(`student:${studentId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'purchase_requests',
                    filter: `student_id=eq.${studentId}`
                },
                (payload) => {
                    console.log('💳 تحديث في الاشتراكات:', payload);
                    this.publish('subscriptions_updated', payload);
                    this.publish('student_data_refresh', { type: 'purchases' });
                }
            )
            .subscribe();
    }

    subscribeToAdminUpdates() {
        if (!window.supabaseClient || !window.isAdmin) return;

        // تحديثات الطلبات المعلقة
        const subscription = window.supabaseClient
            .channel('public:purchase_requests')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'purchase_requests' },
                (payload) => {
                    console.log('📋 تحديث في الطلبات:', payload);
                    this.publish('pending_requests_updated', payload);
                    this.publish('admin_dashboard_refresh', { type: 'requests' });
                }
            )
            .subscribe();

        // تحديثات الطلاب
        const studentsSubscription = window.supabaseClient
            .channel('public:students')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'students' },
                (payload) => {
                    console.log('👥 تحديث في الطلاب:', payload);
                    this.publish('students_updated', payload);
                    this.publish('admin_dashboard_refresh', { type: 'students' });
                }
            )
            .subscribe();
    }

    // ==================== Polling كبديل للـ WebSocket ====================

    async startPolling() {
        // التحقق من أن supabaseClient موجودة
        if (!window.supabaseClient) {
            console.warn('⚠️ Supabase not loaded yet, polling disabled');
            return;
        }

        setInterval(async () => {
            if (!window.currentStudent || !window.supabaseClient) return;

            try {
                // تحديث الكورسات
                const { data: courses } = await window.supabaseClient
                    .from('courses')
                    .select('*')
                    .limit(10);

                if (courses) {
                    this.publish('courses_polled', courses);
                }

                // تحديث الاشتراكات
                const { data: subscriptions } = await window.supabaseClient
                    .from('purchase_requests')
                    .select('*')
                    .eq('student_id', window.currentStudent.id);

                if (subscriptions) {
                    this.publish('subscriptions_polled', subscriptions);
                }
            } catch (error) {
                console.error('خطأ في الـ polling:', error);
            }
        }, this.updateInterval);
    }

    // ==================== تحديث العناصر تلقائياً ====================

    watchElement(selector, callback) {
        const element = document.querySelector(selector);
        if (!element) return;

        const observer = new MutationObserver((mutations) => {
            callback(mutations);
        });

        observer.observe(element, {
            childList: true,
            subtree: true,
            attributes: true,
            characterData: true
        });
    }

    // تحديث القائمة تلقائياً
    autoRefreshList(containerId, fetchFunction, debounceMs = 500) {
        let debounceTimer;

        this.subscribe('data_changed', async (event) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(async () => {
                const container = document.getElementById(containerId);
                if (!container) return;

                try {
                    const newData = await fetchFunction();
                    // تحديث DOM هنا
                    console.log('♻️ تم تحديث القائمة', newData);
                    this.publish('dom_updated', { container: containerId });
                } catch (error) {
                    console.error('Error refreshing:', error);
                }
            }, debounceMs);
        });
    }
}

// ==================== الأنماط والرسوم المتحركة ====================

const AnimationStyles = `
<style>
    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
    }

    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
    }

    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }

    .live-update {
        animation: pulse 0.5s ease;
    }

    .loading-spinner {
        animation: spin 1s linear infinite;
    }

    .protection-badge {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: rgba(34, 197, 94, 0.9);
        color: white;
        padding: 10px 15px;
        border-radius: 20px;
        font-size: 0.85rem;
        font-weight: bold;
        z-index: 1000;
        font-family: Cairo, sans-serif;
        display: flex;
        align-items: center;
        gap: 8px;
        backdrop-filter: blur(10px);
    }

    .protection-badge::before {
        content: '✓';
        font-size: 1rem;
    }

    /* Responsive Design */
    @media (max-width: 1200px) {
        .container { padding: 15px; }
        .grid { grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); }
    }

    @media (max-width: 768px) {
        .container { padding: 10px; }
        .sidebar { display: none; }
        .main-content { width: 100%; }
        .grid { grid-template-columns: 1fr; }
        .modal { width: 95vw ! important; }
    }

    @media (max-width: 480px) {
        body { font-size: 14px; }
        .btn { padding: 10px 15px; }
        h1 { font-size: 1.5rem; }
        h2 { font-size: 1.2rem; }
    }

    /* التكيف مع الشاشات العالية الدقة */
    @media (min-width: 2560px) {
        body { font-size: 18px; }
        .container { max-width: 2000px; }
    }
</style>
`;

// ==================== التهيئة ====================

window.addEventListener('DOMContentLoaded', () => {
    // تفعيل الأنظمة
    ScreenRecordingProtection.init();
    ScreenshotProtection.init();

    // تهيئة نظام Live Updates
    window.liveUpdates = new LiveUpdatesManager();
    window.liveUpdates.initRealtimeConnection();
    window.liveUpdates.startPolling();

    // إضافة الأنماط
    document.head.insertAdjacentHTML('beforeend', AnimationStyles);

    // عرض شارة النظام (محجوبة)
    // const badge = document.createElement('div');
    // badge.className = 'protection-badge';
    // badge.textContent = '';
    // document.body.appendChild(badge);

    console.log('✅ تم تفعيل جميع الأنظمة والـ Live Updates');
});
window.SecurityAndLiveSystem = {
    ScreenRecordingProtection,
    ScreenshotProtection,
    LiveUpdatesManager,
    startProtection: () => ScreenRecordingProtection.init(),
    addLiveListener: (channel, callback) => window.liveUpdates.subscribe(channel, callback),
    removeLiveListener: (channel, callback) => window.liveUpdates.unsubscribe(channel, callback),
    broadcastUpdate: (channel, data) => window.liveUpdates.publish(channel, data)
};
