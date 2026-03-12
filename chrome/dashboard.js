let globalAgents = []; // 가져온 에이전트 데이터를 저장할 전역 변수

document.getElementById('fetchBtn').addEventListener('click', () => {
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = "<b>[1/3]</b> 계정 정보 확인 중...";

    const accountUrl = 'https://bbs-api-os.hoyolab.com/game_record/card/wapi/getGameRecordCard';

    chrome.runtime.sendMessage({type: 'FETCH_HOYOLAB', url: accountUrl}, (response) => {
        if (!response || !response.success || response.data.retcode !== 0) {
            resultDiv.innerHTML = `❌ 실패: ${response?.data?.message || "로그인 필요"}`;
            return;
        }

        const zzzGame = response.data.data.list.find(game => game.game_id === 8);
        if (!zzzGame) return resultDiv.innerHTML = "❌ ZZZ 프로필을 찾을 수 없습니다.";

        const {game_role_id: roleId, region, nickname} = zzzGame;
        resultDiv.innerHTML = `✅ <b>${nickname}</b>님. <br><b>[2/3]</b> 목록 가져오는 중...`;

        const basicUrl = `https://sg-public-api.hoyolab.com/event/game_record_zzz/api/zzz/avatar/basic?role_id=${roleId}&server=${region}&lang=ko-kr`;

        chrome.runtime.sendMessage({type: 'FETCH_HOYOLAB', url: basicUrl}, async (basicRes) => {
            if (!basicRes.success || basicRes.data.retcode !== 0) return resultDiv.innerHTML = `❌ 실패: ${basicRes.data?.message}`;

            const avatarIds = basicRes.data.data.avatar_list.map(a => a.id);
            resultDiv.innerHTML = `✅ 에이전트 ${avatarIds.length}명. <br><b>[3/3]</b> 상세 데이터 로드 중...`;

            const detailPromises = avatarIds.map(id => {
                return new Promise((resolve) => {
                    const detailUrl = `https://sg-public-api.hoyolab.com/event/game_record_zzz/api/zzz/avatar/info?role_id=${roleId}&server=${region}&id_list[]=${id}&lang=ko-kr`;
                    chrome.runtime.sendMessage({type: 'FETCH_HOYOLAB', url: detailUrl}, (res) => resolve(res));
                });
            });

            const results = await Promise.all(detailPromises);
            globalAgents = results
                .filter(r => r.success && r.data.retcode === 0)
                .map(r => r.data.data.avatar_list[0]);

            if (globalAgents.length > 0) {
                resultDiv.innerHTML = `🎉 <b>성공!</b> ${globalAgents.length}명의 데이터를 로드했습니다.`;
                console.log("🔥 [최종 데이터 확인]:", globalAgents); // 콘솔 로그 유지

                // UI 렌더링 시작
                renderAgentNav(globalAgents);
                renderAgentDetail(globalAgents[0]); // 기본으로 첫 번째 에이전트 표시
            } else {
                resultDiv.innerHTML = `❌ 상세 데이터 로드 실패`;
            }
        });
    });
});

// 상단 캐릭터 아이콘 네비게이션 렌더링
function renderAgentNav(agents) {
    const nav = document.getElementById('agent-nav');
    nav.innerHTML = '';
    nav.classList.remove('hidden');

    const BG_URL = "https://act.hoyolab.com/app/zzz-game-record/images/card-bg.0e12ef65.png";
    const SELECTED_BG_URL = "https://act.hoyolab.com/app/zzz-game-record/images/card-selected-bg.1059d6ea.png";

    agents.forEach((agent, index) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'agent-icon-wrapper';
        if (index === 0) wrapper.classList.add('active');

        // 순서 변경: 캐릭터 아이콘이 1층, 프레임들이 그 위(2층)에 올라옴
        wrapper.innerHTML = `
    <img src="${agent.hollow_icon_path}" class="icon-char">
    <img src="https://act.hoyolab.com/app/zzz-game-record/images/card-bg.0e12ef65.png" class="icon-frame unselected-frame">
    <img src="https://act.hoyolab.com/app/zzz-game-record/images/card-selected-bg.1059d6ea.png" class="icon-selected-frame selected-frame">
`;

        wrapper.addEventListener('click', () => {
            document.querySelectorAll('.agent-icon-wrapper').forEach(el => el.classList.remove('active'));
            wrapper.classList.add('active');
            renderAgentDetail(agent);
        });

        nav.appendChild(wrapper);
    });
}

// 선택된 캐릭터 상세 정보 화면 렌더링 (Orchestrator)
function renderAgentDetail(agent) {
    // 1. 메인 컨텐츠 표시
    document.getElementById('main-content').classList.remove('hidden');

    // 2. 캐릭터 기본 정보 (이미지, 이름, 레벨)
    document.getElementById('agent-portrait').src = agent.role_vertical_painting_url || agent.hollow_icon_path;
    document.getElementById('agent-name').innerText = agent.name_mi18n;
    document.getElementById('agent-level').innerText = `Lv. ${agent.level}`;

    // 3. 기능별 함수 호출
    renderStats(agent.properties);    // 상세 스탯 영역
    renderWeapon(agent.weapon);       // W-엔진 영역
    renderDisks(agent.equip);         // 디스크 영역
}

// [분리] 상세 스탯 렌더링 함수
function renderStats(propsArray) {
    const statsContent = document.getElementById('stats-content');
    if (!statsContent || !propsArray) return;

    statsContent.innerHTML = propsArray.map(s => {
        const hasAdd = (s.add !== "0" && s.add !== "0%" && s.add !== "0.0%" && s.add !== "");
        return `
            <div class="stat-row">
                <span class="stat-name">${s.property_name || "스탯"}</span>
                <div class="stat-values-wrapper">
                    ${hasAdd ? `
                        <div class="stat-base-add">
                            <span class="stat-base">${s.base}</span>
                            <span class="stat-add">+${s.add}</span>
                        </div>
                    ` : ''}
                    <span class="stat-final">${s.final || "0"}</span>
                </div>
            </div>
        `;
    }).join('');
}

// [분리] W-엔진 렌더링 함수
function renderWeapon(weapon) {
    const weaponBox = document.getElementById('weapon-info');
    if (!weaponBox) return;

    if (weapon) {
        weaponBox.innerHTML = `
            <div class="weapon-display">
                <img src="${weapon.icon}" class="weapon-icon">
                <div class="weapon-details">
                    <div class="weapon-name">${weapon.name}</div>
                    <div class="weapon-level-star">Lv. ${weapon.level} | 돌파 ${weapon.star}</div>
                </div>
            </div>
        `;
    } else {
        weaponBox.innerHTML = `<div style="color:#666; font-size:12px; text-align:center;">장착된 W-엔진 없음</div>`;
    }
}

// [분리] 디스크 정보 렌더링 함수
function renderDisks(equipArray) {
    const disksContainer = document.getElementById('disks-container');
    if (!disksContainer) return;

    disksContainer.innerHTML = '';

    for (let i = 1; i <= 6; i++) {
        const disk = equipArray?.find(e => e.equipment_type === i);
        const diskSlotDiv = document.createElement('div');

        if (disk) {
            diskSlotDiv.className = 'disk-card';

            const mainProp = disk.main_properties?.[0];

            // 부속성 렌더링
            const subPropsHtml = (disk.properties || []).map(sub => {
                // 강화 횟수 (add 필드가 0보다 클 때만 표시)
                const upgradeHtml = sub.add > 0 ? `<span class="upgrade-count">(+${sub.add})</span>` : '';

                return `
                    <li class="sub-item ${sub.valid ? 'valid' : ''}">
                        <span class="sub-name">${sub.property_name}</span>
                        <div class="sub-val-group">
                            <span class="sub-val">+${sub.base}</span>
                            ${upgradeHtml}
                        </div>
                    </li>
                `;
            }).join('');

            diskSlotDiv.innerHTML = `
                <div class="disk-main-info">
                    <img src="${disk.icon}" class="disk-icon">
                    <div class="disk-name-main">
                        <span class="disk-name-text">${disk.name.split('[')[0]}</span>
                        <div class="disk-main-stat">
                            ${mainProp ? `${mainProp.property_name} ${mainProp.base}` : '---'}
                        </div>
                    </div>
                </div>
                <ul class="disk-sub-list">
                    ${subPropsHtml}
                </ul>
            `;
        } else {
            diskSlotDiv.className = 'disk-card empty-slot';
            diskSlotDiv.innerHTML = `<div class="empty-disk-msg">${i}번 슬롯 비어있음</div>`;
        }

        disksContainer.appendChild(diskSlotDiv);
    }
}