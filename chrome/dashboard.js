import {UI_SETTING, ZZZ_RESOURCE, ZZZ_FONT, CONTENT_FONT} from './constants.js';
import {getDiskScoreGradient, getStatIconHtml, formatGameText, setSkillIconMap} from './utils.js';

const EL = {
    fetchBtn: document.getElementById('fetchBtn'),
    nav: document.getElementById('agent-nav'),
    resultDiv: document.getElementById('result'),
    langSelect: document.getElementById('langSelect'),
    mainContent: document.getElementById('main-content'),
    statsContent: document.getElementById('stats-content'),
    portraitSection:{
        portraitBgEl: document.getElementById('portrait-bg-color'),
        agentPortrait: document.getElementById('agent-portrait'),
        agentName: document.getElementById('agent-name'),
        agentLevel: document.getElementById('agent-level'),
        levelContainer: document.getElementById('level-container'),
        agentRankIcon: document.getElementById('agent-rank-icon'),
        agentElementType: document.getElementById('agent-element-type'),
        agentProfession: document.getElementById('agent-profession'),
        agentGroupIcon: document.getElementById('agent-group-icon'),
        awakenLevel: document.getElementById('awaken-level'),
        awakenMaxLevel: document.getElementById('awaken-max-level'),
    },
    skillSection: {
        skillsContent: document.getElementById('skills-content'),
        skillIcons:{
            0: document.getElementById('skillIconType0'),
            1: document.getElementById('skillIconType1'),
            2: document.getElementById('skillIconType2'),
            3: document.getElementById('skillIconType3'),
            5: document.getElementById('skillIconType5'),
            6: document.getElementById('skillIconType6'),
        },
        skillLevels:{
            0: document.getElementById('skillLevelType0'),
            1: document.getElementById('skillLevelType1'),
            2: document.getElementById('skillLevelType2'),
            3: document.getElementById('skillLevelType3'),
            5: document.getElementById('skillLevelType5'),
            6: document.getElementById('skillLevelType6'),
        },
    },
    weaponSection:{
        weaponContainer: document.getElementById('weapon-container'),
        weaponEmpty: document.getElementById('weapon-empty'),
        weaponIcon: document.getElementById('weapon-icon'),
        weaponRarity: document.getElementById('weapon-rarity'),
        weaponName: document.getElementById('weapon-name'),
        weaponLevel: document.getElementById('weapon-level'),
        weaponStar: document.getElementById('weapon-star'),
        weaponStatsList: document.getElementById('weapon-stats-list'),
    },
    discSection: {
        scoreContainer: document.getElementById('disk-score-container'),
        scoreTitle: document.getElementById('score-title'),
        planSource: document.getElementById('plan-source'),
        scoreTargetStatsWrapper: document.getElementById('score-target-stats-wrapper'),
        scoreRankSide: document.getElementById('score-rank-side'),
        discItemTemplate: document.getElementById('disk-item-template'),
    },
    modal: {
        modalOverlay: document.getElementById('modal-overlay'),
        modalTitle: document.getElementById('ui-title-modal'),
        modalCloseBtn: document.getElementById('modal-close-btn'),
        modalBody: document.getElementById('modal-body'),
    }
}

let i18nData;

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
        EL.nav.scrollLeft -= velX;
        velX *= friction; // 매 프레임마다 속도 감소
        rafID = requestAnimationFrame(beginMomentum);
    } else {
        cancelAnimationFrame(rafID);
    }
};

//내비게이션 제어
EL.nav.addEventListener('mousedown', (e) => {
    isDown = true;
    EL.nav.classList.add('active');

    // 클릭 시 진행 중이던 관성 애니메이션 중단
    cancelAnimationFrame(rafID);

    startX = e.pageX - EL.nav.offsetLeft;
    scrollLeft = EL.nav.scrollLeft;
    lastX = e.pageX;
    velX = 0;

    EL.nav.style.cursor = 'grabbing';
});

window.addEventListener('mouseup', () => {
    if (!isDown) return;
    isDown = false;
    EL.nav.classList.remove('active');
    EL.nav.style.cursor = 'grab';

    // 마우스를 떼는 순간 미끄러짐 시작
    beginMomentum();
});

window.addEventListener('mousemove', (e) => {
    if (!isDown) return;

    e.preventDefault();
    const x = e.pageX - EL.nav.offsetLeft;

    // 현재 프레임에서의 속도 계산 (현재 위치 - 직전 위치)
    velX = e.pageX - lastX;
    lastX = e.pageX;

    const walk = (x - startX) * 2;
    EL.nav.scrollLeft = scrollLeft - walk;
});

let globalAgents = [];
let currentAgentIndex = -1;

function applyI18nLabels(i18nData) {
    const mapping = {
        'ui-title-weapon': 'roles_weapon',             // W-엔진
        'ui-title-skills': 'roles_detail_skill_title', // 스킬
        'ui-title-stats': 'roles_detail_props_title',  // 에이전트 속성
        'ui-title-disks': 'roles_equipment',            // 디스크
    };

    for (const [id, key] of Object.entries(mapping)) {
        const element = document.getElementById(id);
        if (element && i18nData[key]) {
            element.textContent = i18nData[key];
        }
    }
}

EL.fetchBtn.addEventListener('click', () => {
    const selectedLang = EL.langSelect.value;

    // 폰트 준비
    const font = CONTENT_FONT[selectedLang] || CONTENT_FONT["default"];
    document.body.style.fontFamily = font;
    console.log(`title font: ${ZZZ_FONT[selectedLang]}`);
    document.documentElement.style.setProperty('--zzz-font', ZZZ_FONT[selectedLang] || font);

    EL.resultDiv.innerHTML = `<b>[0/4]</b> UI 언어 팩 로드 중...`;

    // 1. UI 다국어 데이터(i18n) 가져오기
    const i18nUrl = `https://fastcdn.hoyoverse.com/mi18n/nap_global/m20240410hy38foxb7k/m20240410hy38foxb7k-${selectedLang}.json`;

    chrome.runtime.sendMessage({type: 'FETCH_HOYOLAB', url: i18nUrl}, (i18nRes) => {
        if (i18nRes.success) {
            i18nData = i18nRes.data;
            applyI18nLabels(i18nRes.data);
            setSkillIconMap(JSON.parse(i18nData.role_skill_rich_text_icons));
        }

        EL.resultDiv.innerHTML = `<b>[1/4]</b> 계정 정보 가져오는 중...`;

        // 2. 계정 기본 정보 가져오기
        const accountUrl = 'https://bbs-api-os.hoyolab.com/game_record/card/wapi/getGameRecordCard';
        chrome.runtime.sendMessage({type: 'FETCH_HOYOLAB', url: accountUrl}, (response) => {
            if (!response || !response.success || response.data.retcode !== 0) {
                EL.resultDiv.innerHTML = `❌ 실패: ${response?.data?.message || "로그인 필요"}`;
                return;
            }

            const zzzGame = response.data.data.list.find(game => game.game_id === 8);
            if (!zzzGame) return EL.resultDiv.innerHTML = "❌ ZZZ 프로필을 찾을 수 없습니다.";
            console.log("Fetched User Data:", zzzGame);

            const {game_role_id: roleId, region, nickname, region_name} = zzzGame;
            EL.resultDiv.innerHTML = `✅ <b>${nickname}</b>님. <br><b>[2/4]</b> 목록 가져오는 중...`;

            // 3. 에이전트 리스트 가져오기
            const basicUrl = `https://sg-public-api.hoyolab.com/event/game_record_zzz/api/zzz/avatar/basic?role_id=${roleId}&server=${region}&lang=${selectedLang}`;

            chrome.runtime.sendMessage({type: 'FETCH_HOYOLAB', url: basicUrl}, async (basicRes) => {
                if (!basicRes.success || basicRes.data.retcode !== 0) return resultDiv.innerHTML = `❌ 실패: ${basicRes.data?.message}`;

                const avatarIds = basicRes.data.data.avatar_list.map(a => a.id);
                EL.resultDiv.innerHTML = `✅ 에이전트 ${avatarIds.length}명. <br><b>[3/4]</b> 상세 데이터 로드 중...`;

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
                    EL.resultDiv.innerHTML = `${nickname} / Server: ${region_name} / uid: ${roleId}`;
                    renderAgentNav(globalAgents);
                    currentAgentIndex = 0;
                    renderAgentDetail(globalAgents[0]);
                } else {
                    EL.resultDiv.innerHTML = `❌ 상세 데이터 로드 실패`;
                }
            });
        });
    });
});

setButtonFunctions();
function setButtonFunctions(){
    EL.portraitSection.levelContainer.addEventListener('click', handleCinemaClick);
    EL.portraitSection.levelContainer.addEventListener('click', handleAwakenClick);
    EL.weaponSection.weaponIcon.addEventListener('click', openWeaponDetail );
    EL.skillSection.skillsContent.addEventListener('click', handleSkillClick);

    EL.modal.modalCloseBtn.addEventListener('click', () => {
        EL.modal.modalOverlay.classList.remove('active');
    })
    EL.modal.modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            EL.modal.modalOverlay.classList.remove('active');
        }
    })
}
function handleCinemaClick(e) {
    // 1. 이벤트 위임의 핵심: 클릭된 위치에서 가장 가까운 시네마 아이콘 찾기
    const indicator = e.target.closest('.cinema-indicator');
    if (!indicator) return; // 시네마 아이콘이 아닌 빈 배경 등을 클릭했으면 무시

    // 2. 현재 선택된 캐릭터가 있는지 안전 검사
    if (currentAgentIndex === -1) return;

    // 💡 나중에 데이터를 매핑할 때, 사용자가 몇 번을 클릭했는지 알고 싶다면
    // const clickedCinemaNum = indicator.dataset.cinema; 
    // 이런 식으로 가져올 수 있습니다.

    const header = i18nData.roles_detail_rank_popup_title || 'Cinema Detail';

    let content = ``;
    const ranks = globalAgents[currentAgentIndex].ranks;

    ranks.forEach((item, index) => {
        const isLast = index === ranks.length - 1;
        const iconVar = `var(--url-cinema${item.id})`;
        const iconColor = item.is_unlocked
            ? UI_SETTING.FONT_COLORS.CINEMA_ACTIVE
            : UI_SETTING.FONT_COLORS.CINEMA_INACTIVE;

        content += `
    <div class="rank-item" style="padding: 10px 0;">
        <div style="display: flex; align-items: center">
            <span style="
                width: 64px; height: 64px; flex-shrink: 0;
                -webkit-mask-image: ${iconVar}; mask-image: ${iconVar};
                background-color: ${iconColor}"></span>
            <div>
                <h2 style="margin: 5px">${item.name}</h2>
                <p style="margin: 5px; color: #888;">${i18nData.roles_rank}${item.id}</p>
            </div>
        </div>
        <div style="margin-top: 5px;">${formatGameText(item.desc)}</div>
    </div>`;

        // 마지막 항목이 아닐 때만 하단에 구분선 추가
        if (!isLast) {
            content += `<i class="rank-divider" style="display: block; height: 1px; background: #2a2c2b; margin: 10px 0;"></i>`;
        }
    });

    openModal(header, content);
}
function handleAwakenClick(e){
    const indicator = e.target.closest('.awaken-ui');
    if (!indicator) return;
    if (currentAgentIndex === -1) return;
    const header = i18nData.potential_trigger_detail || 'AwakenDetail';
    let content = ``;
    const skillAwaken = globalAgents[currentAgentIndex].skill_awaken;
    const skillAwakenItems = skillAwaken.skill_awaken_items;
    //각성 단계별 루프
    skillAwakenItems.forEach(skillAwakenItem => {
        const iconVar = `var(--url-cinema${skillAwakenItem.awaken_level})`;
        const iconColor = skillAwakenItem.awaken_level <= skillAwaken.awaken_level
            ? UI_SETTING.FONT_COLORS.CINEMA_ACTIVE
            : UI_SETTING.FONT_COLORS.CINEMA_INACTIVE;
        content += `
        <div style="display: flex; align-items: center">
            <span style="
                width: 64px; height: 64px; flex-shrink: 0;
                -webkit-mask-image: ${iconVar}; mask-image: ${iconVar};
                background-color: ${iconColor}"></span>
            <div>
                <h2 style="margin: 5px">${skillAwakenItem.level_show_name}</h2>
                <p style="margin: 5px; color: #888;">${i18nData.potential_active}${skillAwakenItem.awaken_level}</p>
            </div>
        </div>
        `
        //단계 내 스킬별 루프
        skillAwakenItem.awaken_skill_items.forEach(awakenSkillItem => {
            let smallContent = ``;
            awakenSkillItem.skill_items.forEach((skill_item) => {
                smallContent += `<p>${skill_item.title}</p>${formatGameText(skill_item.text)}`
            })
            content += `
                
            <div style="background-color: #2a2c2b; border-radius: 12px; padding: 10px; margin: 5px 0">
                <details>
                <summary>${awakenSkillItem.awaken_simple_info}</summary>
                ${smallContent}
                </details>
            </div>`


        })
    })
    openModal(header, content);
}
function openWeaponDetail(){
    const header = i18nData.roles_detail_weapon_popup_title ?? 'W-Engine Detail'
    const title = globalAgents[currentAgentIndex].weapon.talent_title;
    const content = globalAgents[currentAgentIndex].weapon.talent_content;
    const weaponTest = `<h3>${title}</h3><span>${content}</span>`;
    openModal(header, weaponTest);
}
function handleSkillClick(e) {
    // 1. 클릭된 위치에서 가장 가까운 래퍼 찾기 (위임의 핵심)
    const wrapper = e.target.closest('.skill-icon-wrapper');
    if (!wrapper) return; // 래퍼가 아니면 무시

    // 2. 현재 선택된 캐릭터가 있는지 안전 검사
    if (currentAgentIndex === -1) return;

    // 3. HTML에 심어둔 data-skill-type 숫자 가져오기
    const type = parseInt(wrapper.dataset.skillType, 10);

    // 4. 전역 배열에서 현재 캐릭터와 스킬 데이터 찾기
    const agent = globalAgents[currentAgentIndex];
    const skillInfo = agent.skills.find(s => s.skill_type === type);
    
    // 5. 데이터가 존재하면 모달 열기
    if (skillInfo) {
        const header = i18nData.roles_detail_skill_popup_title ?? 'Skill Detail';
        const skillTypeNameKey = ZZZ_RESOURCE.SKILL_TYPE_NAMES[type];
        const skillTypeName = i18nData[skillTypeNameKey] ?? skillTypeNameKey;
        
        let modalContent = ``;

        modalContent += `
        <div style="display: flex; align-items: center">
            <img src=${ZZZ_RESOURCE.SKILL_TYPE_ICONS[type]} alt="${skillTypeName}">
            <div>
                <h2 style="margin: 5px">${skillTypeName}</h2>
                <p style="margin: 5px ">Lv.${skillInfo.level}</p>
            </div>
        </div>
        `
        skillInfo.items.forEach((item) => {
            modalContent += `<h3 style="margin-block-end: 0.5em;">${item.title || ''}</h3>`;
            modalContent += formatGameText(item.text);
        })
        openModal(header, modalContent);
    }
}

function renderAgentNav(agents) {
    EL.nav.innerHTML = '';
    EL.nav.classList.remove('hidden');

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
            currentAgentIndex = index;
            console.log(`selectedAgentIndex: ${currentAgentIndex}`);
            renderAgentDetail(agent);
        });

        EL.nav.appendChild(wrapper);
    });
}

/**
 * 에이전트 상세 정보 렌더링
 */
function renderAgentDetail(agent) {
    if (!agent) return;

    // 메인 컨텐츠 표시
    EL.mainContent.classList.remove('hidden');

    // [함수 분리] 포트레이트 영역 처리 호출
    updatePortrait(agent);

    // 나머지 섹션 렌더링 (기존 로직 유지)
    renderStats(agent.properties);
    renderWeapon(agent.weapon);
    renderDisks(agent.equip);
    renderSkills(agent.skills);
    updateDiskScore(agent.equip_plan_info);
}

/**
 * 포트레이트 섹션 렌더링 전담 함수
 */
function updatePortrait(agent) {
    if (!agent) return;
    const section = EL.portraitSection;
    const baseImages = ZZZ_RESOURCE.BASE.IMAGES;
    const baseIcons = ZZZ_RESOURCE.BASE.ICONS;

    // 1. 배경색 설정
    const themeColor = agent.vertical_painting_color || '#24283b';
    document.body.style.background = `linear-gradient(to bottom, ${themeColor}, #000000)`;
    document.body.style.backgroundAttachment = 'fixed';
    if (section.portraitBgEl) {
        section.portraitBgEl.style.background = themeColor;
    }
    const spans = document.querySelectorAll('span.marquee-text');
    spans.forEach(span => {
        span.innerText = agent.us_full_name.toUpperCase();
    });

    // 2. 캐릭터 이미지 및 텍스트
    section.agentPortrait.src = agent.role_vertical_painting_url || agent.hollow_icon_path;
    section.agentName.innerText = agent.name_mi18n;
    section.agentLevel.innerText = `Lv. ${agent.level}`;

    // 3. 랭크 아이콘 (S/A/B)
    if (section.agentRankIcon) {
        const fileName = ZZZ_RESOURCE.RANK_ICONS[agent.rarity];
        if (fileName) {
            section.agentRankIcon.src = baseIcons + fileName;
            section.agentRankIcon.style.display = 'block';
        } else {
            section.agentRankIcon.style.display = 'none';
        }
    }

    // 4. 속성 아이콘 (element_type / sub_element_type)
    if (section.agentElementType) {
        let fileName = ZZZ_RESOURCE.SUB_ELEMENT_ICONS[agent.sub_element_type];
        if (!fileName) {
            fileName = ZZZ_RESOURCE.ELEMENT_ICONS[agent.element_type];
        }
        if (fileName) {
            section.agentElementType.src = ZZZ_RESOURCE.BASE.IMAGES + fileName;
            section.agentElementType.style.display = 'block';
        } else {
            section.agentElementType.style.display = 'none';
        }
    }

    // 5. 특성 아이콘 (avatar_profession)
    if (section.agentProfession) {
        const fileName = ZZZ_RESOURCE.PROFESSION_ICONS[agent.avatar_profession];
        if (fileName) {
            section.agentProfession.src = baseImages + fileName;
            section.agentProfession.style.display = 'block';
        } else {
            section.agentProfession.style.display = 'none';
        }
    }

    // 6. 진영 아이콘
    if (section.agentGroupIcon) {
        section.agentGroupIcon.src = agent.group_icon_path || "";
        section.agentGroupIcon.style.display = agent.group_icon_path ? 'block' : 'none';
        section.agentGroupIcon.title = agent.camp_name_mi18n || "";
    }

    // 7. 형상 시네마    
    for (let i = 1; i <= 6; i++) {
        // id="cinema1" 대신 [data-cinema="1"] 속성으로 엘리먼트를 찾습니다.
        const cinemaEl = document.querySelector(`[data-cinema="${i}"]`);

        if (cinemaEl) {
            // i가 캐릭터의 돌파 단계(rank)보다 작거나 같으면 활성 색상, 아니면 비활성 색상을 적용합니다.
            const isActive = i <= agent.rank;
            cinemaEl.style.backgroundColor = isActive
                ? UI_SETTING.FONT_COLORS.CINEMA_ACTIVE
                : UI_SETTING.FONT_COLORS.CINEMA_INACTIVE;
        }
    }
    document.documentElement.style.setProperty('--awaken-enable', agent.skill_awaken.has_awaken_system ? 'block' : 'none');
    section.awakenLevel.innerText = agent.skill_awaken.awaken_level;
    section.awakenMaxLevel.innerText = agent.skill_awaken.awaken_max_level;
}

function renderStats(propsArray) {
    if (!EL.statsContent || !propsArray) return;

    EL.statsContent.innerHTML = propsArray.map(s => {
        const hasAdd = (s.add !== "0" && s.add !== "0%" && s.add !== "0.0%" && s.add !== "");
        const iconHtml = getStatIconHtml(s.property_id);

        return `
            <div class="stat-row">
                <span class="stat-name">${iconHtml}${s.property_name || "스탯"}</span> 
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

function renderWeapon(weapon) {
    const contentBox = document.getElementById('weapon-content');
    if (!contentBox) return;

    if (weapon) {
        EL.weaponSection.weaponContainer.style.display = 'flex';
        EL.weaponSection.weaponEmpty.style.display = 'none';
        const mainPropsHtml = (weapon.main_properties || []).map(p => `
            <div class="weapon-stat-row main-stat">
                <div>
                    <img class="stat-label" src = "${ZZZ_RESOURCE.UI.ICON_STAR}">
                    <span>${p.property_name}</span>
                </div>
                <span class="stat-value">${p.base}</span>
            </div>
        `).join('');

        const subPropsHtml = (weapon.properties || []).map(p => `
            <div class="weapon-stat-row sub-stat">
                <div>
                    <img class="stat-label" src = "${ZZZ_RESOURCE.UI.ICON_STAR}">
                    <span>${p.property_name}</span>
                </div>
                <span class="stat-value">${p.base}</span>
            </div>
        `).join('');
        
        EL.weaponSection.weaponIcon.src = weapon.icon;
        EL.weaponSection.weaponIcon.alt = weapon.name;
        const rankFileName = ZZZ_RESOURCE.RARITY_ICONS[weapon.rarity];
        EL.weaponSection.weaponRarity.src = `${ZZZ_RESOURCE.BASE.IMAGES}${rankFileName}`;
        EL.weaponSection.weaponName.innerText = weapon.name;
        EL.weaponSection.weaponLevel.innerText = `Lv.${weapon.level}`;
        EL.weaponSection.weaponStar.src = `./assets/WEngineStar${weapon.star}.png`
        EL.weaponSection.weaponStatsList.innerHTML = `${mainPropsHtml}${subPropsHtml}`
    } else {
        EL.weaponSection.weaponContainer.style.display = 'none';
        EL.weaponSection.weaponEmpty.style.display = 'flex';
    }
}

function renderSkills(skillsArray) {
    if (!skillsArray) return;

    skillsArray.forEach(skill => {
        const wrapper = document.querySelector(`.skill-icon-wrapper[data-skill-type="${skill.skill_type}"]`);
        if (wrapper) {
            const levelEl = wrapper.querySelector('.skill-level');
            if (levelEl) levelEl.textContent = skill.level;
        }
    });
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
            // 주 속성(main_properties)에는 아이콘을 붙이지 않습니다.
            const mainProp = disk.main_properties?.[0];
            const mainName = mainProp ? mainProp.property_name : '---';
            const mainValue = mainProp ? mainProp.base : '';

            // 1. 랭크 아이콘 생성 (문자열 그대로 사용)
            const rankFileName = ZZZ_RESOURCE.RARITY_ICONS[disk.rarity];
            const rankIconHtml = rankFileName
                ? `<img src="${ZZZ_RESOURCE.BASE.IMAGES}${rankFileName}" style="width: 16px; height: 16px; vertical-align: middle; margin-right: 4px;">`
                : '';

            // 보조 속성(properties) 렌더링 루프
            const subPropsHtml = (disk.properties || []).map(sub => {
                const color = sub.valid ? UI_SETTING.FONT_COLORS.HIGHLIGHT : UI_SETTING.FONT_COLORS.DEFAULT;
                const upgradeBoxHtml = sub.add > 0
                    ? `<span class="upgrade-box" style="background-color: ${color};">+${sub.add}</span>`
                    : '';

                // [추가] 헬퍼 함수로 보조 속성의 아이콘 태그를 가져옵니다.
                const iconHtml = getStatIconHtml(sub.property_id, color);

                return `
                    <li class="sub-item" style="color: ${color};">
                        <div class="sub-name-group">
                            <span class="sub-name" style="color: ${color};">${iconHtml}${sub.property_name}</span>
                            ${upgradeBoxHtml}
                        </div>
                        <span class="sub-val">+${sub.base}</span>
                    </li>
                `;
            }).join('');

            // 2. 레이아웃 렌더링
            const clone = EL.discSection.discItemTemplate.content.cloneNode(true);
            clone.querySelector('.disk-name-text').innerText = disk.name;
            clone.querySelector('.disk-level').innerHTML = `${rankIconHtml}Lv.${disk.level ?? "null"}`;
            clone.querySelector('.disk-icon').src = `${disk.icon}`;
            clone.querySelector('.sub-item').innerHTML = `
            <span class="sub-name">${mainName}</span>
            <span class="sub-val">${mainValue}</span>`
            clone.querySelector('.disk-sub-list').insertAdjacentHTML('beforeend', subPropsHtml);
            diskSlotDiv.appendChild(clone);
            
        } else {
            diskSlotDiv.className = 'disk-card empty-slot';
            diskSlotDiv.innerHTML = `<div class="empty-disk-msg">${i}번 슬롯 비어있음</div>`;
        }
        disksContainer.appendChild(diskSlotDiv);
    }
}

function updateDiskScore(planInfo) {
    const scoreContainer = EL.discSection.scoreContainer;
    if (!scoreContainer) return;

    // 데이터가 없거나 유효성 정보가 없으면 숨김
    if (!planInfo || planInfo.valid_property_cnt === undefined) {
        scoreContainer.classList.add('hidden');
        return;
    }

    scoreContainer.classList.remove('hidden');

    const score = planInfo.valid_property_cnt;
    const rank = planInfo.equip_rating || 'ER_Default';

    /**
     * 유효 속성 소스
     */
    //const activePlanSource = planInfo.game_default;
    const recommendProps = planInfo.plan_effective_property_list || [];

    // 추천 스탯 태그 HTML 생성
    const validStatsHtml = recommendProps.map(prop => {
        // ZZZ_RESOURCE.STAT_ICONS의 키값(12103 등)과 일치하는 prop.id를 사용합니다.
        const iconHtml = getStatIconHtml(prop.id, UI_SETTING.FONT_COLORS.DEFAULT);
        return `<span class="stat-tag">${iconHtml}${prop.name}</span>`;
    }).join('');

    // 다국어 제목 처리
    let titleText = "디스크에 유효한 서브 스탯 명중 횟수: {num}회";
    let planSourceLabel = "스탯 추천 방안 출처: {source}"
    if(i18nData){
        if (i18nData.roles_random_attributes_hit_num) {
            titleText = i18nData.roles_random_attributes_hit_num;
        }
        const highlightedScore = `<span style="color: ${UI_SETTING.FONT_COLORS.HIGHLIGHT}; font-weight: bold;">${score}</span>`;
        titleText = titleText.replace('{num}', highlightedScore);

        // 스탯 방안 정보
        let planSourceContext;
        switch (planInfo.type) {
            default:
            case 1:
                planSourceContext = i18nData.roles_game_default_source//게임 내 기본 추천 스탯
                break;
            case 2:
                planSourceContext = i18nData.roles_guide_plan_source//육성 가이드 방안
                break;
            case 3:
                planSourceContext = i18nData.roles_custom_source//유효한 사용자 정의 서브 스탯
                break;
        }

        if (i18nData.roles_plan_source){
            planSourceLabel = i18nData.roles_plan_source.replace('{source}', planSourceContext);
        }
    }

    // 랭크 이미지 설정
    let rankIconUrl = '';
    let bgColor = '#1b1b1b';
    if (rank !== 'ER_Default' && ZZZ_RESOURCE.DISK_RANK_ICONS[rank]) {
        rankIconUrl = `${ZZZ_RESOURCE.BASE.IMAGES}${ZZZ_RESOURCE.DISK_RANK_ICONS[rank]}`;
        bgColor = getDiskScoreGradient(rank)
    }

    // HTML 최종 렌더링
    scoreContainer.style.background = bgColor;
    EL.discSection.scoreTitle.innerHTML = titleText;
    EL.discSection.planSource.innerText = planSourceLabel;
    EL.discSection.scoreTargetStatsWrapper.innerHTML = validStatsHtml;
    EL.discSection.scoreRankSide.innerHTML = 
        `${rankIconUrl ? `<img src="${rankIconUrl}" class="score-rank-img" alt="${rank}">` : ''}`
}
function openModal(header, content){
    EL.modal.modalTitle.innerText = header;
    EL.modal.modalBody.innerHTML = content;
    EL.modal.modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}