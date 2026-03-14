(function() {
    // 1. 모바일 위장
    Object.defineProperty(navigator, 'userAgent', { get: () => 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1' });

    // 2. iframe 대시보드 생성
    const iframe = document.createElement('iframe');
    iframe.id = 'zzz-pc-dashboard';
    iframe.style.cssText = `
        width: 900px; min-height: 500px;
        background: rgba(0, 50, 0, 0.8);
        border: 5px solid lime;
        position: fixed; top: 10px; left: 10px; z-index: 100000;
    `;
    document.body ? document.body.appendChild(iframe) : document.documentElement.appendChild(iframe);

    const idoc = iframe.contentDocument || iframe.contentWindow.document;

    // 3. [최소 수정] iframe 내부에 필수 스타일 직접 주입
    // 원본 스타일 복사 + 깨짐 방지를 위한 최소한의 레이아웃 강제 선언
    const injectStyles = () => {
        const styles = document.querySelectorAll('style, link[rel="stylesheet"]');
        styles.forEach(s => idoc.head.appendChild(s.cloneNode(true)));

        const layoutFix = idoc.createElement('style');
        layoutFix.textContent = `
            body { margin: 0; padding: 20px; color: white; background: transparent; }
            /* 아이콘들이 세로로 나열되는 것을 막기 위한 최소한의 설정 */
            .info-card { display: block !important; background: #1b1b1b !important; border-radius: 12px; margin-bottom: 20px; padding: 15px; }
            .info-card div { display: flex; flex-wrap: wrap; } /* 가로 배열 유도 */
            #target-slot img { display: inline-block; } 
        `;
        idoc.head.appendChild(layoutFix);
    };
    injectStyles();

    idoc.body.innerHTML = '<div id="target-slot"></div>';

    // 4. 스킬 영역 복제 함수
    const cloneSkill = () => {
        const slot = idoc.getElementById('target-slot');
        if (slot.children.length > 0) return;

        const skillSection = document.querySelector('.role-extra-infos section:nth-of-type(3)');

        if (skillSection) {
            const skillCard = skillSection.querySelector('.info-card') || skillSection;

            if (skillCard.querySelector('img, .skill-icon')) {
                const clone = skillCard.cloneNode(true);
                slot.appendChild(clone);
                console.log("💎 스타일 보정 후 iframe 복제 완료");
            }
        }
    };

    // 5. 실행 및 감시
    setTimeout(() => {
        const observer = new MutationObserver(cloneSkill);
        observer.observe(document.body, { childList: true, subtree: true });
        cloneSkill();
    }, 3000);

})();