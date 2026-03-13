(function() {
    // 1. 모바일 환경 위장 (페이지 로드 전 가장 먼저 실행되어야 함!)
    Object.defineProperty(navigator, 'userAgent', { get: () => 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1' });

    // 2. 실제 요소를 다루는 메인 작업 함수
    const initIframeDashboard = () => {
        // 이제 document.body가 확실히 존재합니다!
        const oldBox = document.getElementById('zzz-pc-dashboard');
        if (oldBox) oldBox.remove();

        const iframe = document.createElement('iframe');
        iframe.id = 'zzz-pc-dashboard';
        iframe.style.cssText = `
            position: fixed; top: 20px; left: 20px; 
            width: 400px; height: 350px; /* 창 크기 영구 고정 */
            border: 5px solid lime; border-radius: 15px;
            z-index: 100000; background: #1b1b1b;
        `;
        document.body.appendChild(iframe);

        const idoc = iframe.contentDocument || iframe.contentWindow.document;

        // 메인 페이지의 스타일 복사
        const styles = document.querySelectorAll('style, link[rel="stylesheet"]');
        styles.forEach(s => idoc.head.appendChild(s.cloneNode(true)));

        const customStyle = idoc.createElement('style');
        customStyle.textContent = `
            body { padding: 15px; margin: 0; background: #121212; overflow: hidden; } 
            .info-card { display: block !important; width: 100% !important; margin: 0 !important; }
        `;
        idoc.head.appendChild(customStyle);

        // 스킬 영역 복제
        const cloneSkillToIframe = () => {
            if (idoc.body.querySelector('.info-card')) return;

            const cards = document.querySelectorAll('.info-card');
            let skillCard = null;

            cards.forEach(card => {
                if (card.textContent.includes('Skills') && card.querySelector('img')) {
                    skillCard = card;
                }
            });

            if (skillCard) {
                idoc.body.appendChild(skillCard.cloneNode(true));
                console.log("🛡️ iframe 내부로 복제 완료! 이제 vw는 절대 변하지 않습니다.");
            }
        };

        setInterval(cloneSkillToIframe, 1000);
    };

    // 3. 브라우저가 body 태그를 다 그릴 때까지 기다렸다가 실행
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initIframeDashboard);
    } else {
        // 이미 로드된 상태라면 즉시 실행
        initIframeDashboard();
    }
})();