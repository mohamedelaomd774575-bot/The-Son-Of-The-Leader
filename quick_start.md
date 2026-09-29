# 🎬 دليل سريع لمشغل الفيديو | Quick Reference

## تفعيل المشغّل الاحترافي

### الطريقة الأساسية:
```javascript
watchVideo(courseId, courseTitle, videoUrl);
```

---

## 📺 صيغ الروابط | URL Formats Quick Reference

| المصدر | الصيغة | مثال |
|--------|-------|------|
| **YouTube** | `https://youtube.com/watch?v=ID` | `https://www.youtube.com/watch?v=dQw4w9WgXcQ` |
| **YouTube Short** | `https://youtu.be/ID` | `https://youtu.be/dQw4w9WgXcQ` |
| **Google Drive** | `https://drive.google.com/file/d/ID/view` | `https://drive.google.com/file/d/1-3XYZ/view` |
| **Vimeo** | `https://vimeo.com/ID` | `https://vimeo.com/123456789` |
| **MP4 مباشر** | `https://domain.com/file.mp4` | `https://example.com/video.mp4` |

---

## 🎯 المميزات الرئيسية

| المميزة | الشرح |
|--------|------|
| 📱 **متجاوب** | يعمل على جميع الأجهزة |
| 🎨 **نفس التصميم** | متطابق لون المنصة |
| ⚡ **تحكم السرعة** | 0.5x إلى 2x |
| 🔊 **مستوى الصوت** | تحكم كامل |
| 🪟 **ملء الشاشة** | دعم كامل |
| 📝 **ملاحظات** | حفظ تلقائي |
| 📊 **تقدم** | تتبع تلقائي |
| 🔒 **أمان** | علامات مائية + حماية |
| 🚩 **إبلاغ** | نظام تقارير |

---

## 🚀 أمثلة استخدام سريعة

### HTML
```html
<!-- زر مباشر -->
<button onclick="watchVideo('course_1', 'Python للمبتدئين', 'https://youtu.be/xyz')">
    👁️ شاهد الفيديو
</button>

<!-- من ديناميكي -->
<a href="#" onclick="playLesson(lesson)">مشاهدة</a>
```

### JavaScript
```javascript
function playLesson(lesson) {
    watchVideo(lesson.id, lesson.title, lesson.video_url);
}
```

---

## 📱 الاستجابة | Responsive Breakpoints

| الحجم | المتصفحات | الميزات |
|------|----------|--------|
| **500px+** | Mobile | الفيديو كامل |
| **768px+** | Tablet | Sidebar بجانب |
| **1200px+** | Desktop | تخطيط كامل |

---

## 💾 البيانات المحفوظة

```javascript
// يتم حفظ تلقائياً في localStorage:
localStorage.getItem('studentData')          // بيانات الطالب
localStorage.getItem('notes_courseId')       // الملاحظات
localStorage.getItem('progress_courseId')    // التقدم
```

---

## 🔒 الأمان المدمج

✅ **تلقائياً محمي:**
- علامات مائية باسم الطالب
- منع التحميل من القائمة
- حماية الكونسول
- تتبع محاولات الاختراق

---

## ⚙️ التخصيص السريع

### تغيير لون العنصر الرئيسي:
```css
/* في video-player.html */
--primary: #fbbf24;  /* غيّر اللون هنا */
```

### إضافة معلومات الدورة:
```javascript
// في video-player.js
updateCourseInfo('اسم الدورة');
document.getElementById('instructorName').textContent = 'اسم المدرس';
```

---

## 🐛 حل المشاكل السريعة

| المشكلة | الحل |
|--------|------|
| لا يعرض الفيديو | تأكد من الرابط صحيح |
| صوت منخفض | استخدم شريط الصوت |
| بطاء | اختبر الإنترنت |
| لا يحفظ الملاحظات | فعّل localStorage |

---

## 📞 الملفات المطلوبة

```
✅ video-player.html    (صفحة المشغّل)
✅ video-player.js      (المنطق والتحكم)
✅ watchVideoFunction.js (دالة الاتصال)
```

---

## 🎓 الإحصائيات المتاحة

```javascript
videoPlayerState.watchedSeconds    // ثواني المشاهدة
videoPlayerState.videoType         // نوع الفيديو
videoPlayerState.isPlaying         // حالة التشغيل
videoPlayerState.playbackRate      // السرعة الحالية
```

---

**مشغّل احترافي جاهز للاستخدام الفوري! 🎬✨**
