const ZZZ_RESOURCE = {
    BASE: {
        IMAGES: "https://act.hoyolab.com/app/zzz-game-record/images/",
        ICONS: "https://act.hoyoverse.com/gt-ui/assets/icons/"
    },
    NAV_FRAME: {
        UNSELECTED: "card-bg.0e12ef65.png",
        SELECTED: "card-selected-bg.1059d6ea.png"
    },
    RANK_ICONS: {
        'S': '23b9017829c0ac2d.png',
        'A': '6828e55edc3aa085.png'
    },
    SKILLS: {
        BASIC:   "1f66bafcc1f069c2.png",
        DODGE:   "b15382e2428392f2.png",
        SPECIAL: "38b9cdcdee285da4.png",
        CHAIN:   "11ee8bd83f94a1eb.png",
        CORE:    "25a4b80fcfd80526.png",
        ASSIST:  "40791617886f6731.png"
    },
    // 속성 아이콘 (파일명만 저장)
    ELEMENT_ICONS: {
        200: "attribute-physical-icon.a657c07a.png",//물리
        201: "attribute-fire-icon.aeddecee.png",//불
        202: "attribute-ice-icon.5c85742d.png",//얼음
        203: "attribute-electric-icon.ad4c441f.png",//전기
        205: "attribute-ether-icon.9a1e42a1.png"//에테르
    },

    // 특성 아이콘 (파일명만 저장)
    PROFESSION_ICONS: {
        1: "profession-attack-icon.3c2a053f.png",//강공
        2: "profession-breakthrough-icon.84a7f20a.png",//격파
        3: "profession-anomaly-icon.cd1b1573.png",//이상
        4: "profession-support-icon.9cf39df7.png",//지원
        5: "profession-defensive-icon.9bd60af4.png",//방어
        6: "profession-rupture-icon.4668f112.png"//명파
    },

    // 랭크/희귀도 아이콘 (디스크 랭크 등 공용)
    RARITY_ICONS: {
        'S': "rarity-s.57a8823c.png",
        'A': "rarity-a.2e7c7c47.png",
        'B': "rarity-b.7e53884c.png"
    }
};

const nav = document.getElementById('agent-nav');
let isDown = false;
let startX;
let scrollLeft;

// 관성 구현을 위한 변수들
let velX = 0;          // 현재 속도
let lastX = 0;         // 직전 마우스 위치
let rafID = null;      // 애니메이션 프레임 ID
const friction = 0.95; // 마찰력 (1에 가까울수록 오래 미끄러짐)

// 관성 애니메이션 함수
const beginMomentum = () => {
    // 속도가 아주 작아질 때까지 반복
    if (Math.abs(velX) > 0.5) {
        nav.scrollLeft -= velX;
        velX *= friction; // 매 프레임마다 속도 감소
        rafID = requestAnimationFrame(beginMomentum);
    } else {
        cancelAnimationFrame(rafID);
    }
};

//내비게이션 제어
nav.addEventListener('mousedown', (e) => {
    isDown = true;
    nav.classList.add('active');

    // 클릭 시 진행 중이던 관성 애니메이션 중단
    cancelAnimationFrame(rafID);

    startX = e.pageX - nav.offsetLeft;
    scrollLeft = nav.scrollLeft;
    lastX = e.pageX;
    velX = 0;

    nav.style.cursor = 'grabbing';
});

window.addEventListener('mouseup', () => {
    if (!isDown) return;
    isDown = false;
    nav.classList.remove('active');
    nav.style.cursor = 'grab';

    // 마우스를 떼는 순간 미끄러짐 시작
    beginMomentum();
});

window.addEventListener('mousemove', (e) => {
    if (!isDown) return;

    e.preventDefault();
    const x = e.pageX - nav.offsetLeft;

    // 현재 프레임에서의 속도 계산 (현재 위치 - 직전 위치)
    velX = e.pageX - lastX;
    lastX = e.pageX;

    const walk = (x - startX) * 2;
    nav.scrollLeft = scrollLeft - walk;
});

let globalAgents = [];

// [추가] 다국어 데이터를 적용하는 함수
function applyI18nLabels(i18nData) {
    const mapping = {
        'ui-title-weapon': 'roles_weapon',             // W-엔진
        'ui-title-skills': 'roles_detail_skill_title', // 스킬
        'ui-title-stats': 'roles_detail_props_title',  // 에이전트 속성
        'ui-title-disks': 'roles_equipment'            // 디스크
    };

    for (const [id, key] of Object.entries(mapping)) {
        const element = document.getElementById(id);
        if (element && i18nData[key]) {
            element.textContent = i18nData[key];
        }
    }
}

document.getElementById('fetchBtn').addEventListener('click', () => {
    const resultDiv = document.getElementById('result');
    const selectedLang = document.getElementById('langSelect').value;

    resultDiv.innerHTML = `<b>[0/4]</b> UI 언어 팩 로드 중...`;

    // 1. UI 다국어 데이터(i18n) 가져오기
    const i18nUrl = `https://fastcdn.hoyoverse.com/mi18n/nap_global/m20240410hy38foxb7k/m20240410hy38foxb7k-${selectedLang}.json`;

    chrome.runtime.sendMessage({type: 'FETCH_HOYOLAB', url: i18nUrl}, (i18nRes) => {
        if (i18nRes.success) {
            applyI18nLabels(i18nRes.data);
        }

        resultDiv.innerHTML = `<b>[1/4]</b> 계정 정보 가져오는 중...`;

        // 2. 계정 기본 정보 가져오기
        const accountUrl = 'https://bbs-api-os.hoyolab.com/game_record/card/wapi/getGameRecordCard';
        chrome.runtime.sendMessage({type: 'FETCH_HOYOLAB', url: accountUrl}, (response) => {
            if (!response || !response.success || response.data.retcode !== 0) {
                resultDiv.innerHTML = `❌ 실패: ${response?.data?.message || "로그인 필요"}`;
                return;
            }

            const zzzGame = response.data.data.list.find(game => game.game_id === 8);
            if (!zzzGame) return resultDiv.innerHTML = "❌ ZZZ 프로필을 찾을 수 없습니다.";

            const {game_role_id: roleId, region, nickname} = zzzGame;
            resultDiv.innerHTML = `✅ <b>${nickname}</b>님. <br><b>[2/4]</b> 목록 가져오는 중...`;

            // 3. 에이전트 리스트 가져오기
            const basicUrl = `https://sg-public-api.hoyolab.com/event/game_record_zzz/api/zzz/avatar/basic?role_id=${roleId}&server=${region}&lang=${selectedLang}`;

            chrome.runtime.sendMessage({type: 'FETCH_HOYOLAB', url: basicUrl}, async (basicRes) => {
                if (!basicRes.success || basicRes.data.retcode !== 0) return resultDiv.innerHTML = `❌ 실패: ${basicRes.data?.message}`;

                const avatarIds = basicRes.data.data.avatar_list.map(a => a.id);
                resultDiv.innerHTML = `✅ 에이전트 ${avatarIds.length}명. <br><b>[3/4]</b> 상세 데이터 로드 중...`;

                // 4. 에이전트별 상세 정보 가져오기
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

                // 데이터 확인용
                console.log("Fetched Agents Data:", globalAgents);
                
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
            <img src="${agent.hollow_icon_path}" class="icon-char" draggable="false">
            <img src="${ZZZ_RESOURCE.BASE.IMAGES}${ZZZ_RESOURCE.NAV_FRAME.UNSELECTED}" class="icon-frame unselected-frame" draggable="false">
            <img src="${ZZZ_RESOURCE.BASE.IMAGES}${ZZZ_RESOURCE.NAV_FRAME.SELECTED}" class="icon-selected-frame selected-frame" draggable="false">
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
    if (!agent) return;

    const themeColor = agent.vertical_painting_color || '#24283b';
    document.body.style.background = `linear-gradient(to bottom, ${themeColor}, #000000)`;
    document.body.style.backgroundAttachment = 'fixed';

    document.getElementById('main-content').classList.remove('hidden');
    document.getElementById('agent-portrait').src = agent.role_vertical_painting_url || agent.hollow_icon_path;
    document.getElementById('agent-name').innerText = agent.name_mi18n;
    document.getElementById('agent-level').innerText = `Lv. ${agent.level}`;

    const baseImages = ZZZ_RESOURCE.BASE.IMAGES;
    const baseIcons = ZZZ_RESOURCE.BASE.ICONS;
    
    // 2. 랭크 아이콘 (S/A/B)
    const rankIconEl = document.getElementById('agent-rank-icon');
    if (rankIconEl) {
        const fileName = ZZZ_RESOURCE.RANK_ICONS[agent.rarity];
        if (fileName) {
            rankIconEl.src = baseIcons + fileName;
            rankIconEl.style.display = 'block';
        } else {
            rankIconEl.style.display = 'none';
        }
    }

    // 3. 속성 아이콘 (element_type)
    const elementEl = document.getElementById('agent-element_type');
    if (elementEl) {
        const fileName = ZZZ_RESOURCE.ELEMENT_ICONS[agent.element_type];
        if (fileName) {
            elementEl.src = baseImages + fileName;
            elementEl.style.display = 'block';
        } else {
            elementEl.style.display = 'none';
        }
    }

    // 4. 특성 아이콘 (avatar_profession)
    const professionEl = document.getElementById('agent-profession');
    if (professionEl) {
        const fileName = ZZZ_RESOURCE.PROFESSION_ICONS[agent.avatar_profession];
        if (fileName) {
            professionEl.src = baseImages + fileName;
            professionEl.style.display = 'block';
        } else {
            professionEl.style.display = 'none';
        }
    }

    // 5. 진영 아이콘 (기존 로직 유지 - 얘는 이미 전체 URL일 가능성이 큼)
    const groupIconEl = document.getElementById('agent-group-icon');
    if (groupIconEl) {
        groupIconEl.src = agent.camp_icon || "";
        groupIconEl.style.display = agent.camp_icon ? 'block' : 'none';
    }
    // ========================================

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
        const iconUrl = `${ZZZ_RESOURCE.BASE.ICONS}${ZZZ_RESOURCE.SKILLS[skillKey]}`;

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
                        <span class="disk-name-text">${disk.name}</span>
                        <div class="disk-level">Lv.${disk.level || "null"}</div> </div>
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