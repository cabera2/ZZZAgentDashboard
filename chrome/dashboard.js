const ZZZ_RESOURCE = {
    BASE: {
        NAV: "https://act.hoyolab.com/app/zzz-game-record/images/",
        SKILL: "https://act.hoyoverse.com/gt-ui/assets/icons/"
    },
    NAV_FRAME: {
        UNSELECTED: "card-bg.0e12ef65.png",
        SELECTED: "card-selected-bg.1059d6ea.png"
    },
    SKILLS: {
        BASIC:   "1f66bafcc1f069c2.png", // 일반 공격
        DODGE:   "b15382e2428392f2.png", // 회피
        SPECIAL: "38b9cdcdee285da4.png", // 특수 공격
        CHAIN:   "11ee8bd83f94a1eb.png", // 콤보/궁극기
        CORE:    "25a4b80fcfd80526.png", // 핵심 스킬
        ASSIST:  "40791617886f6731.png"  // 지원 공격
    }
};

let globalAgents = [];

document.getElementById('fetchBtn').addEventListener('click', () => {
    const resultDiv = document.getElementById('result');
    const selectedLang = document.getElementById('langSelect').value;
    resultDiv.innerHTML = `<b>[1/3]</b> 계정 정보 가져오는 중 (언어: ${selectedLang})...`;

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

        const basicUrl = `https://sg-public-api.hoyolab.com/event/game_record_zzz/api/zzz/avatar/basic?role_id=${roleId}&server=${region}&lang=${selectedLang}`;

        chrome.runtime.sendMessage({type: 'FETCH_HOYOLAB', url: basicUrl}, async (basicRes) => {
            if (!basicRes.success || basicRes.data.retcode !== 0) return resultDiv.innerHTML = `❌ 실패: ${basicRes.data?.message}`;

            const avatarIds = basicRes.data.data.avatar_list.map(a => a.id);
            resultDiv.innerHTML = `✅ 에이전트 ${avatarIds.length}명. <br><b>[3/3]</b> 상세 데이터 로드 중...`;

            const detailPromises = avatarIds.map(id => {
                return new Promise((resolve) => {
                    const detailUrl = `https://sg-public-api.hoyolab.com/event/game_record_zzz/api/zzz/avatar/info?role_id=${roleId}&server=${region}&id_list[]=${id}&lang=${selectedLang}`;
                    chrome.runtime.sendMessage({type: 'FETCH_HOYOLAB', url: detailUrl}, (res) => resolve(res));
                });
            });

            const results = await Promise.all(detailPromises);
            globalAgents = results
                .filter(r => r.success && r.data.retcode === 0)
                .map(r => r.data.data.avatar_list[0]);

            if (globalAgents.length > 0) {
                resultDiv.innerHTML = `🎉 <b>성공!</b> ${globalAgents.length}명의 데이터를 로드했습니다.`;
                renderAgentNav(globalAgents);
                renderAgentDetail(globalAgents[0]);
            } else {
                resultDiv.innerHTML = `❌ 상세 데이터 로드 실패`;
            }
        });
    });
});

function renderAgentNav(agents) {
    const nav = document.getElementById('agent-nav');
    nav.innerHTML = '';
    nav.classList.remove('hidden');

    agents.forEach((agent, index) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'agent-icon-wrapper';
        if (index === 0) wrapper.classList.add('active');

        wrapper.innerHTML = `
            <img src="${agent.hollow_icon_path}" class="icon-char">
            <img src="${ZZZ_RESOURCE.BASE.NAV}${ZZZ_RESOURCE.NAV_FRAME.UNSELECTED}" class="icon-frame unselected-frame">
            <img src="${ZZZ_RESOURCE.BASE.NAV}${ZZZ_RESOURCE.NAV_FRAME.SELECTED}" class="icon-selected-frame selected-frame">
        `;

        wrapper.addEventListener('click', () => {
            document.querySelectorAll('.agent-icon-wrapper').forEach(el => el.classList.remove('active'));
            wrapper.classList.add('active');
            renderAgentDetail(agent);
        });

        nav.appendChild(wrapper);
    });
}

function renderAgentDetail(agent) {
    document.getElementById('main-content').classList.remove('hidden');
    document.getElementById('agent-portrait').src = agent.role_vertical_painting_url || agent.hollow_icon_path;
    document.getElementById('agent-name').innerText = agent.name_mi18n;
    document.getElementById('agent-level').innerText = `Lv. ${agent.level}`;

    renderStats(agent.properties);
    renderWeapon(agent.weapon);
    renderDisks(agent.equip);
    renderSkills(agent.skills);
}

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

// [수정됨] 내부 content 영역만 채움
function renderWeapon(weapon) {
    const contentBox = document.getElementById('weapon-content');
    if (!contentBox) return;

    if (weapon) {
        const mainPropsHtml = (weapon.main_properties || []).map(p => `
            <div class="weapon-stat-row main-stat">
                <span class="stat-label">${p.property_name}</span>
                <span class="stat-value">${p.base}</span>
            </div>
        `).join('');

        const subPropsHtml = (weapon.properties || []).map(p => `
            <div class="weapon-stat-row sub-stat">
                <span class="stat-label">${p.property_name}</span>
                <span class="stat-value">${p.base}</span>
            </div>
        `).join('');

        contentBox.innerHTML = `
            <div class="weapon-container">
                <img src="${weapon.icon}" class="weapon-icon" alt="${weapon.name}">
                <div class="weapon-detail">
                    <div class="weapon-name-row">
                        <span class="weapon-name">${weapon.name}</span>
                        <span class="weapon-meta">Lv.${weapon.level} | 돌파 ${weapon.star}</span>
                    </div>
                    <div class="weapon-stats-list">
                        ${mainPropsHtml}
                        ${subPropsHtml}
                    </div>
                </div>
            </div>
        `;
    } else {
        contentBox.innerHTML = `<div class="empty-msg">장착된 W-엔진이 없습니다.</div>`;
    }
}

// [수정됨] 내부 content 영역만 채움
function renderSkills(skillsArray) {
    const contentBox = document.getElementById('skills-content');
    if (!contentBox || !skillsArray) return;

    const skillKeys = ['BASIC', 'DODGE', 'SPECIAL', 'CHAIN', 'CORE', 'ASSIST'];

    contentBox.innerHTML = skillsArray.map((skill, index) => {
        const skillKey = skillKeys[index] || 'BASIC';
        const iconUrl = `${ZZZ_RESOURCE.BASE.SKILL}${ZZZ_RESOURCE.SKILLS[skillKey]}`;

        return `
            <div class="skill-item">
                <div class="skill-icon-wrapper">
                    <img src="${iconUrl}" class="skill-icon">
                    <span class="skill-level">${skill.level || 1}</span>
                </div>
            </div>
        `;
    }).join('');
}

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
            const mainName = mainProp ? mainProp.property_name : '---';
            const mainValue = mainProp ? mainProp.base : '';

            const subPropsHtml = (disk.properties || []).map(sub => {
                const boxBgColor = sub.valid ? '#ffeb3b' : '#a9b1d6';
                const upgradeBoxHtml = sub.add > 0
                    ? `<span class="upgrade-box" style="background-color: ${boxBgColor};">+${sub.add}</span>`
                    : '';

                return `
                    <li class="sub-item ${sub.valid ? 'valid' : ''}">
                        <div class="sub-name-group">
                            <span class="sub-name">${sub.property_name}</span>
                            ${upgradeBoxHtml}
                        </div>
                        <span class="sub-val">+${sub.base}</span>
                    </li>
                `;
            }).join('');

            diskSlotDiv.innerHTML = `
                <div class="disk-main-info">
                    <div class="disk-name-main">
                        <span class="disk-name-text">${disk.name.split('[')[0]}</span>
                        <div class="disk-level">Lv.${disk.level || 15}</div> </div>
                    <img src="${disk.icon}" class="disk-icon"> </div>
                <ul class="disk-sub-list">
                    <li class="sub-item main-stat-row">
                        <span class="sub-name">${mainName}</span>
                        <span class="sub-val">${mainValue}</span>
                    </li>
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