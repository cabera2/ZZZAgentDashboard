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

        const basicUrl = `https://sg-public-api.hoyolab.com/event/game_record_zzz/api/zzz/avatar/basic?role_id=${roleId}&server=${region}`;

        chrome.runtime.sendMessage({type: 'FETCH_HOYOLAB', url: basicUrl}, async (basicRes) => {
            if (!basicRes.success || basicRes.data.retcode !== 0) return resultDiv.innerHTML = `❌ 실패: ${basicRes.data?.message}`;

            const avatarIds = basicRes.data.data.avatar_list.map(a => a.id);
            resultDiv.innerHTML = `✅ 에이전트 ${avatarIds.length}명. <br><b>[3/3]</b> 상세 데이터 로드 중...`;

            const detailPromises = avatarIds.map(id => {
                return new Promise((resolve) => {
                    const detailUrl = `https://sg-public-api.hoyolab.com/event/game_record_zzz/api/zzz/avatar/info?role_id=${roleId}&server=${region}&id_list[]=${id}`;
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

// 선택된 캐릭터 상세 정보 화면 렌더링
function renderAgentDetail(agent) {
    // 1. 메인 컨텐츠 표시
    document.getElementById('main-content').classList.remove('hidden');

    // 2. 캐릭터 기본 정보 (이미지, 이름, 레벨)
    document.getElementById('agent-portrait').src = agent.role_vertical_painting_url || agent.hollow_icon_path;
    document.getElementById('agent-name').innerText = agent.name_mi18n;
    document.getElementById('agent-level').innerText = `Lv. ${agent.level}`;

    // 3. 캐릭터 상세 스탯 (루트의 properties 필드 사용)
    // Soldier0Anby.txt에서 확인된 루트 properties 배열 전달
    renderStats(agent.properties);

    // 4. W-엔진 정보 렌더링
    const weaponBox = document.getElementById('weapon-info');
    if (agent.weapon) {
        weaponBox.innerHTML = `
            <div class="weapon-display" style="display:flex; gap:15px; align-items:center;">
                <img src="${agent.weapon.icon}" width="50" style="border: 2px solid #a68d73; border-radius:4px;">
                <div>
                    <div style="font-weight:bold; color:#fff;">${agent.weapon.name}</div>
                    <div style="font-size:12px; color:#aaa;">Lv. ${agent.weapon.level} | 돌파 ${agent.weapon.star}</div>
                </div>
            </div>
        `;
    } else {
        weaponBox.innerHTML = `<div style="color:#666;">장착된 W-엔진이 없습니다.</div>`;
    }

    // 5. 디스크 정보 렌더링 (3*2 Grid)
    const disksContainer = document.getElementById('disks-container');
    disksContainer.innerHTML = '';
    disksContainer.style.display = 'grid';
    disksContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';
    disksContainer.style.gap = '10px';

    for (let i = 1; i <= 6; i++) {
        // equipment_type 기준으로 디스크 찾기
        const disk = agent.equip && agent.equip.find(e => e.equipment_type === i);
        const diskSlotDiv = document.createElement('div');
        diskSlotDiv.className = 'disk-card';

        if (disk) {
            // 디스크 메인 옵션
            const mainProp = disk.main_properties && disk.main_properties[0];
            // 디스크 부가 옵션 (li 형식)
            const subPropsHtml = (disk.sub_properties || []).map(sub =>
                `<li style="display:flex; justify-content:space-between; font-size:10px;">
                    <span>${sub.name}</span>
                    <span style="color:#fff;">+${sub.value}</span>
                </li>`
            ).join('');

            diskSlotDiv.innerHTML = `
                <div style="display:flex; flex-direction:column; gap:5px;">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <img src="${disk.icon}" width="35">
                        <div style="font-size:11px; color:#7aa2f7; font-weight:bold;">${disk.name.split('[')[0]}</div>
                    </div>
                    <div style="padding-top:4px; border-top:1px solid #333;">
                        <div style="font-size:10px; color:#f7768e; font-weight:bold;">
                            ${mainProp ? `${mainProp.name} ${mainProp.value}` : ''}
                        </div>
                        <ul style="list-style:none; padding:0; margin:0; color:#a9b1d6;">
                            ${subPropsHtml}
                        </ul>
                    </div>
                </div>
            `;
        } else {
            diskSlotDiv.innerHTML = `<div style="height:80px; display:flex; align-items:center; justify-content:center; border:1px dashed #444; color:#444; font-size:11px;">${i}번 비어있음</div>`;
        }
        disksContainer.appendChild(diskSlotDiv);
    }
}

// 캐릭터 상세 스탯 전용 렌더링 함수
function renderStats(propsArray) {
    let statsBox = document.getElementById('stats-summary');
    if (!statsBox) {
        statsBox = document.createElement('div');
        statsBox.id = 'stats-summary';
        statsBox.className = 'section-box';
        const rightPanel = document.getElementById('right-panel');
        if (rightPanel) rightPanel.prepend(statsBox);
    }

    if (!propsArray || !Array.isArray(propsArray)) return;

    // 공식 페이지 느낌의 레이아웃 설정
    let html = `<h3>상세 스탯</h3><div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px 24px; background: rgba(0,0,0,0.2); padding: 15px; border-radius: 8px;">`;

    propsArray.forEach(s => {
        const name = s.property_name || "스탯";
        const base = s.base || "0";
        const add = s.add || "0";
        const finalVal = s.final || "0";

        // 추가 수치(add)가 유효한지 체크
        const hasAdd = (add !== "0" && add !== "0%" && add !== "0.0%" && add !== "");

        html += `
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid rgba(255,255,255,0.05); padding: 4px 0;">
                <span style="font-size:12px; color:#a9b1d6; flex-shrink: 0;">${name}</span>
                
                <div style="display:flex; align-items:center; justify-content:flex-end; gap: 10px; flex-grow: 1;">
                    ${hasAdd ? `
                        <div style="display:flex; flex-direction:column; align-items:flex-end; font-size:10px; line-height:1.2; font-family:'Courier New', monospace;">
                            <span style="color:#888;">${base}</span>
                            <span style="color:#9ece6a;">+${add}</span>
                        </div>
                    ` : ''}
                    
                    <span style="font-size:14px; font-weight:bold; color:#fff; font-family:'Courier New', monospace; text-align:right; min-width:45px;">
                        ${finalVal}
                    </span>
                </div>
            </div>
        `;
    });

    html += `</div>`;
    statsBox.innerHTML = html;
}