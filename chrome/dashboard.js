import {UI_SETTING, ZZZ_RESOURCE, ZZZ_FONT, CONTENT_FONT} from './constants.js';
import {getDiskScoreGradient, getStatIconHtml} from './utils.js';

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

document.getElementById('fetchBtn').addEventListener('click', () => {
    const resultDiv = document.getElementById('result');
    const selectedLang = document.getElementById('langSelect').value;

    // 폰트 준비
    const font = CONTENT_FONT[selectedLang] || CONTENT_FONT["default"];
    document.body.style.fontFamily = font;
    console.log(`title font: ${ZZZ_FONT[selectedLang]}`);
    document.documentElement.style.setProperty('--zzz-font', ZZZ_FONT[selectedLang] || font);
    
    resultDiv.innerHTML = `<b>[0/4]</b> UI 언어 팩 로드 중...`;

    // 1. UI 다국어 데이터(i18n) 가져오기
    const i18nUrl = `https://fastcdn.hoyoverse.com/mi18n/nap_global/m20240410hy38foxb7k/m20240410hy38foxb7k-${selectedLang}.json`;

    chrome.runtime.sendMessage({type: 'FETCH_HOYOLAB', url: i18nUrl}, (i18nRes) => {
        if (i18nRes.success) {
            window.i18nData = i18nRes.data;
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
            console.log("Fetched User Data:", zzzGame);

            const {game_role_id: roleId, region, nickname, region_name} = zzzGame;
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
                    resultDiv.innerHTML = `${nickname} / Server: ${region_name} / uid: ${roleId}`;
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

/**
 * 에이전트 상세 정보 렌더링
 */
function renderAgentDetail(agent) {
    if (!agent) return;

    // 메인 컨텐츠 표시
    document.getElementById('main-content').classList.remove('hidden');

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

    const baseImages = ZZZ_RESOURCE.BASE.IMAGES;
    const baseIcons = ZZZ_RESOURCE.BASE.ICONS;

    // 1. 배경색 설정
    const themeColor = agent.vertical_painting_color || '#24283b';
    document.body.style.background = `linear-gradient(to bottom, ${themeColor}, #000000)`;
    document.body.style.backgroundAttachment = 'fixed';
    const portraitBgEl = document.getElementById('portrait-bg-color');
    if (portraitBgEl) {
        portraitBgEl.style.background = themeColor;
    }
    const spans = document.querySelectorAll('span.marquee-text');
    spans.forEach(span => {
        span.innerText = agent.us_full_name.toUpperCase();
    });

    // 2. 캐릭터 이미지 및 텍스트
    document.getElementById('agent-portrait').src = agent.role_vertical_painting_url || agent.hollow_icon_path;
    document.getElementById('agent-name').innerText = agent.name_mi18n;
    document.getElementById('agent-level').innerText = `Lv. ${agent.level}`;

    // 3. 랭크 아이콘 (S/A/B)
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

    // 4. 속성 아이콘 (element_type / sub_element_type)
    const elementEl = document.getElementById('agent-element_type');
    if (elementEl) {
        let fileName = ZZZ_RESOURCE.SUB_ELEMENT_ICONS[agent.sub_element_type];
        if (!fileName) {
            fileName = ZZZ_RESOURCE.ELEMENT_ICONS[agent.element_type];
        }
        if (fileName) {
            elementEl.src = ZZZ_RESOURCE.BASE.IMAGES + fileName;
            elementEl.style.display = 'block';
        } else {
            elementEl.style.display = 'none';
        }
    }

    // 5. 특성 아이콘 (avatar_profession)
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

    // 6. 진영 아이콘
    const groupIconEl = document.getElementById('agent-group-icon');
    if (groupIconEl) {
        groupIconEl.src = agent.group_icon_path || "";
        groupIconEl.style.display = agent.group_icon_path ? 'block' : 'none';
        groupIconEl.title = agent.camp_name_mi18n || "";
    }

    // 7. 형상 시네마
    for (let i = 1; i <= 6; i++) {
        const cinemaEl = document.getElementById(`cinema${i}`);
        if (cinemaEl) {
            if (i <= agent.rank) {
                cinemaEl.style.backgroundColor = UI_SETTING.FONT_COLORS.CINEMA_ACTIVE
            } else {
                cinemaEl.style.backgroundColor = UI_SETTING.FONT_COLORS.CINEMA_INACTIVE
            }
        }
    }
    document.documentElement.style.setProperty('--awaken-enable', agent.skill_awaken.has_awaken_system ? 'block' : 'none');
    document.getElementById(`awaken-level`).innerText = agent.skill_awaken.awaken_level;
    document.getElementById(`awaken-max-level`).innerText = agent.skill_awaken.awaken_max_level;
}

function renderStats(propsArray) {
    const statsContent = document.getElementById('stats-content');
    if (!statsContent || !propsArray) return;

    statsContent.innerHTML = propsArray.map(s => {
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

        contentBox.innerHTML = `
            <div class="weapon-container">
                <img src="${weapon.icon}" class="weapon-icon" alt="${weapon.name}">
                <div class="weapon-detail">
                    <div class="weapon-name-row">
                        <span class="weapon-name">${weapon.name}</span> 
                        <span class="weapon-meta"
                        style="background-color: #9d9d9d; 
                        color: #000;
                        border-radius: 5px;
                        padding: 5px">Lv.${weapon.level}</span>
                        <img src="./assets/WEngineStar${weapon.star}.png" style="height: 25px">
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

function renderSkills(skillsArray) {
    const contentBox = document.getElementById('skills-content');
    if (!contentBox || !skillsArray) return;

    skillsArray.forEach(skill => {
        const iconEl = document.getElementById(`skillType${skill.skill_type}`);
        if (iconEl) iconEl.textContent = skill.level;
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
            diskSlotDiv.innerHTML = `
                <div class="disk-main-info">
                    <div class="disk-name-main">
                        <span class="disk-name-text">${disk.name}</span>
                        <div class="disk-level">
                            ${rankIconHtml}Lv.${disk.level ?? "null"}
                        </div> 
                    </div>
                    <img src="${disk.icon}" class="disk-icon"> 
                </div>
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

function updateDiskScore(planInfo) {
    const scoreContainer = document.getElementById('disk-score-container');
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
    if(window.i18nData){
        if (window.i18nData.roles_random_attributes_hit_num) {
            titleText = window.i18nData.roles_random_attributes_hit_num;
        }
        const highlightedScore = `<span style="color: ${UI_SETTING.FONT_COLORS.HIGHLIGHT}; font-weight: bold;">${score}</span>`;
        titleText = titleText.replace('{num}', highlightedScore);

        // 스탯 방안 정보
        let planSourceContext;
        switch (planInfo.type) {
            default:
            case 1:
                planSourceContext = window.i18nData.roles_game_default_source//게임 내 기본 추천 스탯
                break;
            case 2:
                planSourceContext = window.i18nData.roles_guide_plan_source//육성 가이드 방안
                break;
            case 3:
                planSourceContext = window.i18nData.roles_custom_source//유효한 사용자 정의 서브 스탯
                break;
        }

        if (window.i18nData.roles_plan_source){
            planSourceLabel = window.i18nData.roles_plan_source.replace('{source}', planSourceContext);
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
    document.getElementById("score-title").innerHTML = titleText;
    document.getElementById("plan-source").innerText = planSourceLabel;
    document.getElementById("score-target-stats-wrapper").innerHTML = validStatsHtml;
    document.getElementById("score-rank-side").innerHTML = 
        `${rankIconUrl ? `<img src="${rankIconUrl}" class="score-rank-img" alt="${rank}">` : ''}`
}