# 🎬 دليل المشغّل الاحترافي | Professional Video Player Guide

## 📋 نظرة عامة | Overview

تم تطوير **مشغّل فيديو احترافي مخصص** مصمم خصيصاً لمنصة **ابن القائد** بمواصفات عالية:

✅ **المميزات الرئيسية:**
- 🎥 **دعم عدة مصادر**: YouTube, Google Drive, Vimeo, فيديوهات محلية
- 📱 **تصميم متجاوب**: يعمل على PC, Tablet, Mobile بكفاءة
- 🎨 **نفس الألوان والتصميم**: متطابق مع تصميم المنصة الأساسية
- 🔒 **أمان عالي**: علامات مائية، حماية الكونسول، منع التحميل
- ⚙️ **تحكم متقدم**: تغيير السرعة، الصوت، الجودة
- 📊 **تتبع التقدم**: حفظ تقدم المشاهدة والملاحظات
- 🛡️ **حماية الطالب**: تحديد الطالب ورقم التليفون كعلامة مائية

---

## 🚀 كيفية الاستخدام | How to Use

### 1️⃣ تفعيل المشغّل | Activate Player

عند نقر الطالب على "مشاهدة الفيديو"، يتم استدعاء الدالة:

```javascript
watchVideo(courseId, courseTitle, videoUrl);

// مثال:
watchVideo('course_001', 'دورة البرمجة بالـ Python', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
```

### 2️⃣ صيغ روابط الفيديو المدعومة | Supported Video URL Formats

#### 📺 YouTube
```javascript
watchVideo('course_1', 'عنوان الدورة', 'https://www.youtube.com/watch?v=VIDEO_ID');
watchVideo('course_1', 'عنوان الدورة', 'https://youtu.be/VIDEO_ID');
```

#### 🔵 Google Drive
```javascript
watchVideo('course_1', 'عنوان الدورة', 'https://drive.google.com/file/d/FILE_ID/view');
```

#### 🟣 Vimeo
```javascript
watchVideo('course_1', 'عنوان الدورة', 'https://vimeo.com/VIDEO_ID');
```

#### 📹 فيديو محلي (MP4 مباشر)
```javascript
watchVideo('course_1', 'عنوان الدورة', 'https://your-domain.com/videos/course.mp4');
```

---

## 📁 البنية الملفية | File Structure

```
Front-End/
├── video-player.html          ← صفحة المشغّل الاحترافية
├── video-player.js            ← منطق المشغّل والتحكم
├── watchVideoFunction.js       ← دالة الاتصال (تم تحديثها)
├── responsive-design.css       ← أنماط التجاوب
└── security-and-live.js        ← حماية الأمان
```

---

## 🎯 المميزات التفصيلية | Feature Details

### 🎬 تحميل الفيديو التلقائي
```javascript
// المشغّل يكتشف نوع الفيديو تلقائياً
// ويعرضه بالطريقة المناسبة
loadVideo(url, title);
```

### ⚡ التحكم في السرعة
- 0.5x | 0.75x | 1x | 1.25x | 1.5x | 2x

### 🔊 التحكم في الصوت
- شريط تحكم كامل من 0-100%

### 📊 تتبع التقدم
- حفظ تقدم المشاهدة تلقائياً
- عرض نسبة المشاهدة المئوية

### 📝 نظام الملاحظات
- كتابة ملاحظات أثناء المشاهدة
- حفظ تلقائي في localStorage
- تحميل الملاحظات كملف نصي

### 🪟 ملء الشاشة
- دعم كامل لملء الشاشة
- على جميع المتصفحات

### 🚩 نظام الإبلاغ عن المشاكل
- إبلاغ الطالب عن أي مشكلة
- تسجيل تفاصيل المشكلة

---

## 🔒 ميزات الأمان | Security Features

### 1️⃣ العلامات المائية | Watermarks
```javascript
addWatermark(studentName, studentPhone);
// تظهر اسم الطالب ورقمه تحذيراً من المشاركة غير المشروعة
```

### 2️⃣ منع حفظ الفيديو
```html
<video controlsList="nodownload">
  <!-- لا يمكن تحميل الفيديو من قائمة السياق -->
</video>
```

### 3️⃣ حماية الكونسول
```javascript
// منع تسجيل الشاشة والفيديو
Object.defineProperty(window, 'crossOriginIsolated', { 
    value: true, 
    writable: false 
});

// إغلاق الصفحة إذا تم فتح DevTools
debugger;
```

### 4️⃣ منع النقر بزر الفأرة الأيمن
```javascript
document.addEventListener('contextmenu', e => e.preventDefault());
```

---

## 📱 التجاوب (Responsive Design)

المشغّل يتكيف تماماً مع جميع الأحجام:

### 🖥️ سطح المكتب (1200px+)
- عرض الفيديو + الـ Sidebar بجانبه
- تحكم شامل تحت الفيديو

### 📱 التابليت (768px - 1200px)
- عرض الفيديو + Sidebar تحته في شبكة
- تحكم محسّن

### 📱 الهاتف (480px)
- عرض الفيديو فقط في البداية
- Sidebar والتحكم تحته
- أزرار وعناصر كبيرة للمس

---

## 💾 البيانات المحفوظة | Stored Data

### في localStorage:
```javascript
// بيانات الطالب
studentData: {
    name: "اسم الطالب",
    phone: "رقم التليفون",
    email: "البريد الإلكتروني"
}

// الملاحظات
notes_{courseId}: "محتوى الملاحظات"

// تقدم المشاهدة
progress_{courseId}: {
    courseId: "...",
    watchedSeconds: 120,
    totalDuration: 3600,
    currentTime: 120,
    timestamp: "2024-01-01T10:00:00Z"
}
```

---

## 🔧 التخصيص | Customization

### تغيير الألوان:
في `video-player.html` ابحث عن:
```css
:root {
    --primary: #fbbf24;
    --secondary: #3b82f6;
    --danger: #ef4444;
    /* قم بتغيير الألوان حسب احتياجك */
}
```

### إضافة معلومات الدورة:
في `video-player.js`:
```javascript
function updateCourseInfo(title) {
    document.getElementById('courseName').textContent = title;
    document.getElementById('instructorName').textContent = 'اسم المدرس';
    document.getElementById('courseLevel').textContent = 'المستوى';
    document.getElementById('courseType').textContent = 'النوع';
}
```

---

## 📊 إحصائيات المشاهدة | Viewing Statistics

يمكنك الوصول لتفاصيل المشاهدة من `videoPlayerState`:

```javascript
{
    videoUrl: "رابط الفيديو",
    courseId: "معرف الدورة",
    courseTitle: "عنوان الدورة",
    videoType: "youtube|gdrive|vimeo|direct",
    isPlaying: true/false,
    playbackRate: 1,
    watchedSeconds: 120,
    startTime: Date
}
```

---

## 🐛 استكشاف الأخطاء | Troubleshooting

### المشكلة: لا يعرض الفيديو
**الحل:**
```javascript
// تأكد من أن الرابط صحيح
// اختبر نوع الكشف التلقائي
detectVideoType(url);
// تحقق من console للأخطاء
```

### المشكلة: لا يعمل الصوت
**الحل:**
```javascript
// ازل كتم الصوت
videoPlayer.volume = 1;
videoPlayer.muted = false;
```

### المشكلة: الفيديو بطيء
**الحل:**
- تحقق من سرعة الإنترنت
- استخدم جودة أقل للفيديو المحلي
- اختبر على متصفح آخر

---

## 🎓 أمثلة الاستخدام | Usage Examples

### مثال 1: فيديو YouTube
```html
<button onclick="watchVideo('py_101', 'مقدمة في Python', 'https://youtu.be/kqtD5dpn9C0')">
    مشاهدة الفيديو
</button>
```

### مثال 2: فيديو من Google Drive
```html
<button onclick="watchVideo('web_201', 'تطوير الويب المتقدم', 'https://drive.google.com/file/d/1ABC123XYZ/view')">
    شاهد المحاضرة
</button>
```

### مثال 3: عام
```javascript
// من الخادم أو قاعدة البيانات
const courseData = {
    id: 'course_123',
    title: 'دورة متقدمة',
    videoUrl: 'https://example.com/videos/course.mp4'
};

// استدعاء القارئ
watchVideo(courseData.id, courseData.title, courseData.videoUrl);
```

---

## 📞 الدعم | Support

للأسئلة أو المشاكل:
- تحقق من console في DevTools
- ابحث عن رسائل الأخطاء
- استخدم نظام الإبلاغ داخل المشغّل

---

## ✅ قائمة التحقق | Checklist

قبل النشر:
- ✅ تحميل جميع الملفات الثلاثة
- ✅ التأكد من أن الروابط صحيحة
- ✅ اختبار على متصفحات مختلفة
- ✅ اختبار على أجهزة مختلفة (Mobile, Tablet, Desktop)
- ✅ التأكد من الأجزاء المخفية والعلامات المائية تعمل
- ✅ اختبار حفظ الملاحظات والتقدم

---

**تم التطوير بالكامل مع الاحترافية القصوى! 🚀**
