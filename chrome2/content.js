(function() {
    // 1. 모바일 환경 위장
    Object.defineProperty(navigator, 'userAgent', { get: () => 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1' });

    // 2. 메인 작업 함수
    const initIframeDashboard = () => {
        const oldBox = document.getElementById('zzz-pc-dashboard');
        if (oldBox) oldBox.remove();

        const iframe = document.createElement('iframe');
        iframe.id = 'zzz-pc-dashboard';
        iframe.style.cssText = `
            position: fixed; top: 20px; left: 20px; 
            width: 400px; height: 350px; 
            border: 5px solid lime; border-radius: 15px;
            z-index: 100000; background: #1b1b1b;
        `;
        document.body.appendChild(iframe);

        const idoc = iframe.contentDocument || iframe.contentWindow.document;

        // 스타일 복사
        const styles = document.querySelectorAll('style, link[rel="stylesheet"]');
        styles.forEach(s => idoc.head.appendChild(s.cloneNode(true)));

        const customStyle = idoc.createElement('style');
        customStyle.textContent = `
            body { padding: 15px; margin: 0; background: #121212; overflow: hidden; } 
            .info-card { display: block !important; width: 100% !important; margin: 0 !important; }
        `;
        idoc.head.appendChild(customStyle);

        // [핵심 수정] 스킬 영역 복제 (구조적 선택자 적용)
        const cloneSkillToIframe = () => {
            if (idoc.body.querySelector('.info-card')) return;

            // 텍스트 검색 대신 .role-extra-infos의 3번째 섹션을 직접 찾습니다.
            const skillSection = document.querySelector('.role-extra-infos section:nth-of-type(3)');

            if (skillSection) {
                const targetCard = skillSection.querySelector('.info-card') || skillSection;

                // 아이콘 로드 여부 확인 후 복제
                if (targetCard.querySelector('img, .skill-icon')) {
                    idoc.body.appendChild(targetCard.cloneNode(true));
                    console.log("🛡️ iframe A버전: 구조적 선택자로 복제 완료!");
                }
            }
        };

        setInterval(cloneSkillToIframe, 1000);
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initIframeDashboard);
    } else {
        initIframeDashboard();
    }
})();