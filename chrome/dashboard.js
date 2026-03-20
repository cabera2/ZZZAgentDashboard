const UI_SETTING = {
    FONT_COLORS: {
        DEFAULT: '#afafaf',
        HIGHLIGHT: '#f1ad3d'
    }
};
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

    // 강화형 속성 아이콘 (sub_element_type 기준)
    SUB_ELEMENT_ICONS: {
        1: "attribute-frost-icon.8de86b8f.png",    // 서리 (얼음 강화)
        2: "attribute-auricink-icon.bb80b050.png", // 현묵 (에테르 강화)
        4: "attribute-honededge-icon.5c0ed0be.png" // 서슬 (물리 강화)
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
    
    // 디스크 점수 등급 아이콘
    DISK_RANK_ICONS: {
        "ER_B": "b.6428930f.png",
        "ER_A": "a.94d50077.png",
        "ER_S": "s.1b99e936.png",
        "ER_S_Plus": "s_plus.8426d3ac.png",
        "ER_SS": "ss.9aefb415.png",
        "ER_SS_Plus": "ss_plus.6a01e298.png",
        "ER_SSS": "sss.c792a8a7.png",
        "ER_SSS_Plus": "sss_plus.6a303d10.png",
        "ER_SSS_Plus_Crown": "sss_plus_crown.e0a88067.png"
    },

    // 디스크 레어도
    RARITY_ICONS: {
        'S': "rarity-s.57a8823c.png",
        'A': "rarity-a.2e7c7c47.png",
        'B': "rarity-b.7e53884c.png"
    },

    STAT_ICONS: {
        // 에이전트 상세 속성 (단축 ID)
        1: "317ce2a47d66fd3e.svg",   // HP
        2: "4883b409fd524b6d.svg",   // 공격력
        3: "f2a930b4deba8528.svg",   // 방어력
        4: "ae8b5440f710fad8.svg",   // 충격력
        5: "09bfc76f660dd0d1.svg",   // 치명타 확률
        6: "80d52f918714bed4.svg",   // 치명타 피해
        7: "2d4c15cee5a66ebe.svg",   // 이상 장악력
        8: "c44eb009da6c398b.svg",   // 이상 마스터리
        9: "1b15470e75018348.svg",   // 관통률
        11: "f26955cea8f29f4f.svg",  // 에너지 자동 회복
        19: "b765786bd239a9a8.svg",  // 관입력
        20: "2079bc3eeededc26.svg",  // 기운 자동 누적
        232: "b5cae085c3f59de9.svg", // 관통 수치
        315: "2bc246d1451fa4ce.png", // 물리 피해
        316: "a4040e05ea38849b.png", // 불 속성 피해
        317: "d2c575830f549349.png", // 얼음 속성 피해
        318: "2baf620986a19284.png", // 전기 속성 피해
        319: "544076112a8f3460.png", // 에테르 피해

        // 디스크 보조 속성 (5자리 ID)
        11102: "317ce2a47d66fd3e.svg", 11103: "317ce2a47d66fd3e.svg", // HP
        12102: "4883b409fd524b6d.svg", 12103: "4883b409fd524b6d.svg", // 공격력
        13102: "f2a930b4deba8528.svg", 13103: "f2a930b4deba8528.svg", // 방어력
        20103: "09bfc76f660dd0d1.svg", // 치명타 확률
        21103: "80d52f918714bed4.svg", // 치명타 피해
        23203: "b5cae085c3f59de9.svg", // 관통 수치
        31203: "c44eb009da6c398b.svg"  // 이상 마스터리
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
        // 1. 강화 속성(sub_element_type)이 있는지 먼저 확인
        let fileName = ZZZ_RESOURCE.SUB_ELEMENT_ICONS[agent.sub_element_type];

        // 2. 강화 속성이 없으면(undefined) 일반 속성(element_type)에서 가져옴
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
        groupIconEl.src = agent.group_icon_path || "";
        groupIconEl.style.display = agent.group_icon_path ? 'block' : 'none';
    }
    // ========================================

    renderStats(agent.properties);
    renderWeapon(agent.weapon);
    renderDisks(agent.equip);
    renderSkills(agent.skills);
    updateDiskScore(agent)
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
                            ${rankIconHtml}Lv.${disk.level || "null"}
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

function updateDiskScore(agent) {
    const scoreContainer = document.getElementById('disk-score-container');
    if (!scoreContainer) return;

    const planInfo = agent.equip_plan_info;
    // 데이터가 없거나 유효성 정보가 없으면 숨김
    if (!planInfo || planInfo.valid_property_cnt === undefined) {
        scoreContainer.classList.add('hidden');
        return;
    }

    scoreContainer.classList.remove('hidden');

    const score = planInfo.valid_property_cnt;
    const rank = planInfo.equip_rating || 'ER_Default';

    /**
     * 유효 속성 소스 결정
     * 현재는 '기본 추천(game_default)'을 사용합니다.
     * 향후 다른 패턴(plan_effective_property_list, custom_info) 확장이 필요할 경우
     * 이 변수에 할당되는 객체만 변경하면 됩니다.
     */
    const activePlanSource = planInfo.game_default;
    const recommendProps = (activePlanSource && activePlanSource.property_list)
        ? activePlanSource.property_list
        : [];

    // 추천 스탯 태그 HTML 생성
    const validStatsHtml = recommendProps.map(prop => {
        // ZZZ_RESOURCE.STAT_ICONS의 키값(12103 등)과 일치하는 prop.id를 사용합니다.
        const iconHtml = getStatIconHtml(prop.id, UI_SETTING.FONT_COLORS.DEFAULT);
        return `<span class="stat-tag">${iconHtml}${prop.name}</span>`;
    }).join('');

    // 다국어 제목 처리
    let titleText = "디스크에 유효한 서브 스탯 명중 횟수: {num}회";
    if (window.i18nData && window.i18nData.roles_random_attributes_hit_num) {
        titleText = window.i18nData.roles_random_attributes_hit_num;
    }
    const highlightedScore = `<span style="color: ${UI_SETTING.FONT_COLORS.HIGHLIGHT}; font-weight: bold;">${score}</span>`;
    const localizedTitle = titleText.replace('{num}', highlightedScore);

    // 랭크 이미지 설정
    let rankIconUrl = '';
    if (rank !== 'ER_Default' && ZZZ_RESOURCE.DISK_RANK_ICONS[rank]) {
        rankIconUrl = `${ZZZ_RESOURCE.BASE.IMAGES}${ZZZ_RESOURCE.DISK_RANK_ICONS[rank]}`;
    }

    // HTML 최종 렌더링
    scoreContainer.innerHTML = `
        <div class="score-info-side">
            <div class="score-title">${localizedTitle}</div>
            <div class="score-target-stats-wrapper">
                ${validStatsHtml}
            </div>
        </div>
        <div class="score-rank-side">
            ${rankIconUrl ? `<img src="${rankIconUrl}" class="score-rank-img" alt="${rank}">` : ''}
        </div>
    `;
}

function getStatIconHtml(statId, iconColor = '#ffffff') {
    const fileName = ZZZ_RESOURCE.STAT_ICONS[statId];
    if (!fileName) return "";

    const fullUrl = `${ZZZ_RESOURCE.BASE.ICONS}${fileName}`;
    const isSvg = fileName.toLowerCase().endsWith('.svg');

    if (isSvg) {
        // SVG인 경우: 마스크 방식을 사용하여 색상을 입힘
        return `
            <span class="stat-icon-base stat-icon-mask" 
                  style="-webkit-mask-image: url('${fullUrl}'); 
                         mask-image: url('${fullUrl}'); 
                         background-color: ${iconColor};">
            </span>`;
    } else {
        // PNG 등 일반 이미지인 경우: img 태그를 사용하여 원본 색상을 유지
        // 필요에 따라 class로 크기만 조절 (stat-icon-base 활용)
        return `
            <img src="${fullUrl}" 
                 class="stat-icon-base" 
                 alt="stat-icon" 
                 style="vertical-align: middle;">`;
    }
}