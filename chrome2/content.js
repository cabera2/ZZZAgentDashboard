(function() {
    // 1. 기기 위장 (최우선 실행)
    Object.defineProperty(navigator, 'userAgent', { get: () => 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1' });
    Object.defineProperty(navigator, 'maxTouchPoints', { get: () => 5 });

    // 2. 배율 및 레이아웃 설정
    const FIXED_WIDTH = 390; // 모바일 기준 폭 (고정)
    const FIXED_SCALE = 1.5;  // 화면에 보일 배율 (1.5배)

    const applyFix = () => {
        const layout = document.querySelector('.zzz-record-main');
        if (!layout) return;

        // 스타레일 방식: 화면 너비에 맞춰 배율 결정 (하지만 최대 FIXED_SCALE까지만)
        const scale = Math.min(FIXED_SCALE, window.innerWidth / FIXED_WIDTH);

        layout.style.width = FIXED_WIDTH + 'px';
        layout.style.transform = `scale(${scale})`;
        layout.style.transformOrigin = 'top center';
        layout.style.margin = '0 auto';
        layout.style.position = 'relative';

        // 페이지 전체 높이 보정 (스크롤 잘림 방지)
        document.body.style.minHeight = (layout.offsetHeight * scale) + 'px';
        document.body.style.backgroundColor = '#1a1a1a'; // 여백 배경색
    };

    // 3. 안전한 실행 (MutationObserver 오류 방지)
    const startObserver = () => {
        const observer = new MutationObserver(() => {
            if (document.querySelector('.zzz-record-main')) {
                applyFix();
            }
        });

        // body가 있으면 body를, 없으면 documentElement(html)를 관찰
        const targetNode = document.body || document.documentElement;
        observer.observe(targetNode, { childList: true, subtree: true });

        window.addEventListener('resize', applyFix);
    };

    // DOM이 어느 정도 로드된 후 실행되도록 보장
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startObserver);
    } else {
        startObserver();
    }

    // 4. 캐릭터 리스트 드래그 스크롤 (기존 성공 로직)
    let isDown = false, startX, scrollLeft;
    document.addEventListener('mousedown', (e) => {
        const slider = e.target.closest('.role-swiper') || e.target.closest('[class*="role-swiper"]');
        if (!slider) return;
        isDown = true;
        startX = e.pageX - slider.offsetLeft;
        scrollLeft = slider.scrollLeft;
    }, true);
    document.addEventListener('mouseup', () => { isDown = false; }, true);
    document.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        const slider = e.target.closest('.role-swiper') || e.target.closest('[class*="role-swiper"]');
        if (!slider) return;
        const x = e.pageX - slider.offsetLeft;
        const walk = (x - startX) * 2;
        slider.scrollLeft = scrollLeft - walk;
    }, true);
})();