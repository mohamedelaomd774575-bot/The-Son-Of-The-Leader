/**
 * دالة تشغيل الفيديو مع تشفير الرابط
 */
function watchVideo(courseId, courseTitle, videoUrl) {
    if (!videoUrl) {
        alert('عذراً، لا يوجد فيديو متاح لهذا الدرس.');
        return;
    }

    function _mask(u) {
        try {
            // base64 encode ثم reverse — بدون encodeURIComponent عشان URLSearchParams تتعامل معاه صح
            const encoded = btoa(unescape(encodeURIComponent(u)));
            return encoded.split('').reverse().join('');
        } catch (e) { return u; }
    }

    // URLSearchParams بتعمل encode تلقائي لكل الـ values — ده يضمن سلامة الـ base64
    const params = new URLSearchParams();
    params.append('courseId', courseId);
    params.append('title', courseTitle);
    params.append('url', _mask(videoUrl));
    params.append('t', Date.now());

    window.location.href = `video-player.html?${params.toString()}`;
}