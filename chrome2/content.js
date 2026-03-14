(function() {
    // 1. 모바일 위장
    Object.defineProperty(navigator, 'userAgent', { get: () => 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1' });

    // 2. 스타일 주입
    const style = document.createElement('style');
    style.textContent = `
        #zzz-pc-dashboard {
            width: 900px !important; min-height: 500px !important;
            background: rgba(0, 50, 0, 0.8) !important;
            border: 5px solid lime !important;
            position: fixed; top: 10px; left: 10px; z-index: 100000;
            padding: 20px; color: white; overflow-y: auto;
        }
        /* 복제된 카드 내의 아이콘들이 깨지지 않도록 강제 스타일 부여 */
        #zzz-pc-dashboard .info-card { 
            display: block !important; 
            background: #1b1b1b !important;
            margin-top: 20px;
        }
    `;
    document.documentElement.appendChild(style);

    // 3. 대시보드 생성
    const box = document.createElement('div');
    box.id = 'zzz-pc-dashboard';
    box.innerHTML = '<h1>ONLY SKILL TEST (CLONE MODE)</h1><div id="target-slot"></div>';
    document.body ? document.body.appendChild(box) : document.documentElement.appendChild(box);

    // 4. 스킬 영역 복제 함수
    const cloneSkill = () => {
        const slot = document.getElementById('target-slot');
        // 이미 복제본이 들어있다면 중단
        if (slot.children.length > 0) return;

        // [수정된 부분] 텍스트 매칭 대신 구조적 위치(.role-extra-infos의 3번째 섹션)로 타겟을 찾습니다.
        const skillSection = document.querySelector('.role-extra-infos section:nth-of-type(3)');

        if (skillSection) {
            const skillCard = skillSection.querySelector('.info-card') || skillSection;

            // 001.js의 기존 조건 유지: 아이콘(img 등)이 로드되었을 때만 복제 시도
            if (skillCard.querySelector('img, .skill-icon')) {
                const clone = skillCard.cloneNode(true);
                slot.appendChild(clone);
                console.log("💎 구조적 선택자 기반 복제 성공!");
            }
        }
    };

    // 데이터 로딩 시간을 고려해 3초 뒤부터 감시 시작
    setTimeout(() => {
        const observer = new MutationObserver(cloneSkill);
        observer.observe(document.body, { childList: true, subtree: true });
        cloneSkill(); // 초기 실행
    }, 3000);

})();