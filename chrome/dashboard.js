import {UI_SETTING, ZZZ_RESOURCE, ZZZ_FONT, CONTENT_FONT} from './constants.js';
import {
    getDiskScoreGradient,
    getStatIconHtml,
    formatGameText,
    setSkillIconMap,
    getNickname,
    getRegionByUid
} from './utils.js';

const EL = {
    loadingImg: document.getElementById('loading-img'),
    app: document.getElementById('app'),
    nav: document.getElementById('agent-nav'),
    langSelect: document.getElementById('langSelect'),
    mainContent: document.getElementById('main-content'),
    statsContent: document.getElementById('stats-content'),
    headerSection:{
        profilePic: document.getElementById('profile-pic'),
        nickname: document.getElementById('nickname'),
        playerLevel: document.getElementById('player-level'),
        serverInfo: document.getElementById('server-info'),
        fetchBtn: document.getElementById('fetchBtn'),
        resultDiv: document.getElementById('result'),
    },
    portraitSection:{
        portraitBgEl: document.getElementById('portrait-bg-color'),
        agentPortrait: document.getElementById('agent-portrait'),
        clothesBtn: document.getElementById('clothes-btn'),
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
        header: document.getElementById('ui-title-skills'),
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
        header: document.getElementById('ui-title-weapon'),
        weaponContainer: document.getElementById('weapon-container'),
        weaponEmpty: document.getElementById('weapon-empty'),
        weaponIcon: document.getElementById('weapon-icon'),
        weaponRarity: document.getElementById('weapon-rarity'),
        weaponName: document.getElementById('weapon-name'),
        weaponLevel: document.getElementById('weapon-level'),
        weaponStar: document.getElementById('weapon-star'),
        weaponStatsList: document.getElementById('weapon-stats-list'),
    },
    statSection:{
        header: document.getElementById('ui-title-stats'),
    },
    discSection: {
        header: document.getElementById('ui-title-disks'),
        scoreContainer: document.getElementById('disk-score-container'),
        scoreTitle: document.getElementById('score-title'),
        planSource: document.getElementById('plan-source'),
        scoreTargetStatsWrapper: document.getElementById('score-target-stats-wrapper'),
        scoreRankSide: document.getElementById('score-rank-side'),
        disksContainer: document.getElementById('disks-container'),
        discItemTemplate: document.getElementById('disk-item-template'),
        planSelectBtn: document.getElementById('plan-select-btn')
    },
    modal: {
        modalOverlay: document.getElementById('modal-overlay'),
        modalBackBtn: document.getElementById('modal-back-btn'),
        modalTitleCommon: document.getElementById('ui-title-modal-common'),
        modalTitleCustom: document.getElementById('ui-title-modal-custom'),
        modalContentCommon: document.getElementById('modal-content-common'),
        modalContentCustom: document.getElementById('modal-content-custom'),
        modalBodyCommon: document.getElementById('modal-body-common'),
        modalBodyCustom: document.getElementById('modal-body-custom'),
        subStatClearAll: document.getElementById('sub-stat-clear-all'),
        subStatSaveAll: document.getElementById('sub-stat-save-all'),
        wikiBtn: document.getElementById('wiki-btn'),
        wikiBtnLabel: document.getElementById('wiki-btn-label'),
    },
    userList: {
        panel: document.getElementById('user-list-panel'),
        label: document.getElementById('user-list-label'),
        itemsList: document.getElementById('user-items-list'),
        uidInput: document.getElementById('new-user-uid'),
        addBtn: document.getElementById('add-user-btn'),
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

let globalAgents = [];
let currentAgentFullData = null;
let currentAgentDetail = null;
let currentAgentIndex = -1;
let currentUserInfo = {}; // 전역 사용자 정보 추가
let userListData = {};
loadSaveData(()=>{
    fetchDataAndReload();});
setNavScrollEvent();
setButtonFunctions();
function loadSaveData(callback){
    chrome.storage.sync.get('selectedLanguage', function(data) {
        if (data.selectedLanguage) {
            console.log("Save data exist:", data.selectedLanguage);
            EL.langSelect.value = data.selectedLanguage;
        } else {
            console.log("Save data not exist:", navigator.language);
            const browserLang = navigator.language.toLowerCase();
            const options = Array.from(EL.langSelect.options);
            let matched = options.find(opt => opt.value.startsWith(browserLang));
            if(!matched){
                matched = options.find(opt => opt.value.startsWith(browserLang.split('-')[0]));
            }
            if (matched) {
                EL.langSelect.value = matched.value;
            }
        }
        if (callback) callback();
    });
}
function setNavScrollEvent(){
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
}
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
function setButtonFunctions(){
    EL.headerSection.fetchBtn.addEventListener('click', fetchDataAndReload);
    EL.portraitSection.levelContainer.addEventListener('click', handleCinemaClick);
    EL.portraitSection.levelContainer.addEventListener('click', handleAwakenClick);
    EL.portraitSection.clothesBtn.addEventListener('click', openClothes);
    EL.weaponSection.weaponIcon.addEventListener('click', openWeaponDetail );
    EL.skillSection.skillsContent.addEventListener('click', handleSkillClick);
    EL.discSection.disksContainer.addEventListener('click', handleDiskClick);
    EL.discSection.planSelectBtn.addEventListener('click', openPlanSelect);
    
    const closeButtons = document.querySelectorAll('.modal-close-btn');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            closeModal();
        });
    });
    //모달 뒤로 버튼
    EL.modal.modalBackBtn.addEventListener('click', () => {
        EL.modal.modalContentCommon.classList.add('active');
        EL.modal.modalContentCustom.classList.remove('active')
    })
    EL.modal.modalOverlay.addEventListener('click', (e) => {
        if (e.target === EL.modal.modalOverlay) {
            closeModal();
        }
    })
    //사용자 정의 보조 속성 전부 지우기
    EL.modal.subStatClearAll.addEventListener('click', () => {
        document.querySelectorAll('input[name="stat-selection"]')
            .forEach(cb => cb.checked = false);
        updateCustomModalStatus(); 
    });
    //사용자 정의 보조 속성 저장
    EL.modal.subStatSaveAll.addEventListener('click', ()=>{
        changePlanRequest(3);
    });

    // 커스텀 속성 선택 변경 감지 (페이지 로드 시 1회만 등록)
    EL.modal.modalBodyCustom.addEventListener('change', (e) => {
        if (e.target.name === 'stat-selection') {
            updateCustomModalStatus();
        }
    });

    // 유저 리스트 패널 토글
    EL.userList.label.addEventListener('click', () => {
        EL.userList.panel.classList.toggle('active');
    });

    // 유저 추가 버튼 테스트 로직
    EL.userList.addBtn.addEventListener('click', async () => {
        const uid = EL.userList.uidInput.value.trim();
        if (uid) {
            const indexData = await fetchIndex(uid);
            if(indexData) {
                const enkaData = await fetchEnka(uid);
                userListData[uid] = {
                    name: enkaData.nickname,
                    avatar: indexData.cur_head_icon_url
                };
                chrome.storage.sync.set({ 'userListData': userListData });
                addUserToList(enkaData.nickname, uid,  indexData.cur_head_icon_url);
                EL.userList.uidInput.value = '';
            }
        }
    });

    // 유저 리스트 내 버튼 이벤트 (위임 방식)
    EL.userList.itemsList.addEventListener('click', async (e) => {
        const li = e.target.closest('.user-list-item');
        if(li){
            e.stopPropagation(); // 부모 클릭 이벤트 방지
            const uid = li.dataset.uid;
            if (e.target.classList.contains('remove-user-btn')) {
                delete userListData[uid];
                chrome.storage.sync.set({'userListData': userListData});
                li.remove();
            } else {
                const indexData = await fetchIndex(uid);
                if (indexData) {
                    const enkaData = await fetchEnka(uid);
                    await renderUser(uid, enkaData, indexData);
                    const avatarElement = li.querySelector('.profile-pic.user-avatar-mini');
                    if (avatarElement) {
                        avatarElement.style.backgroundImage = `url(${indexData.cur_head_icon_url})`;
                    }
                }
            }
        }        
    });
    // 유저 리스트 내 유저 버튼 이벤트
    
}
function addUserToList(nickname, uid, avatar, isMe = false) {
    console.log("add Item", nickname, uid, isMe);
    const li = document.createElement('li');
    li.className = 'user-list-item';
    li.dataset.uid = uid;
    const removeBtnHtml = isMe ? '' : `<span class="remove-user-btn">×</span>`;
    li.innerHTML = `
        <div class="profile-pic user-avatar-mini" style="background-image: url(${avatar})"></div>
        <div class="user-info-container">
            <span class="user-name">${nickname}</span>
            <span class="user-uid">${uid}</span>
        </div>
        ${removeBtnHtml}
    `;
    EL.userList.itemsList.appendChild(li);
}

function openModal(header, content, wikiUrl = null){
    EL.modal.wikiBtn.style.display = wikiUrl ? 'block' : 'none';
    if(wikiUrl){
        EL.modal.wikiBtn.href = wikiUrl;
    }
    EL.modal.modalTitleCommon.innerText = header;
    EL.modal.modalBodyCommon.innerHTML = content;
    EL.modal.modalContentCommon.classList.add('active');
    EL.modal.modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}
function closeModal(){
    EL.modal.modalContentCustom.classList.remove('active');
    EL.modal.modalContentCommon.classList.remove('active');
    EL.modal.modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
}
async function fetchDataAndReload() {
    EL.headerSection.fetchBtn.disabled = true;
    
    // 선택된 언어 불러오기
    const selectedLang = EL.langSelect.value;
    chrome.storage.sync.set({ 'selectedLanguage': EL.langSelect.value }, function() {
        console.log('Language saved: ' + EL.langSelect.value);
    });
    
    // 폰트 준비
    const font = CONTENT_FONT[selectedLang] || CONTENT_FONT["default"];
    document.body.style.fontFamily = font;
    console.log(`title font: ${ZZZ_FONT[selectedLang]}`);
    document.documentElement.style.setProperty('--zzz-font', ZZZ_FONT[selectedLang] || font);

    EL.headerSection.resultDiv.innerHTML = `<b>[0/4]</b> UI 언어 팩 로드 중...`;

    // 1. UI 다국어 데이터(i18n) 가져오기
    const i18nUrl = `https://fastcdn.hoyoverse.com/mi18n/nap_global/m20240410hy38foxb7k/m20240410hy38foxb7k-${selectedLang}.json`;

    console.log('i18nUrl',i18nUrl);
    chrome.runtime.sendMessage({type: 'FETCH_HOYOLAB', url: i18nUrl}, (i18nRes) => {
        if (i18nRes.success) {
            i18nData = i18nRes.data;
            applyI18nLabels(i18nRes.data);
            setSkillIconMap(JSON.parse(i18nData.role_skill_rich_text_icons));
        }
    });

    // 2. 계정 기본 정보 가져오기
    const accountUrl = 'https://bbs-api-os.hoyolab.com/game_record/card/wapi/getGameRecordCard';
    chrome.runtime.sendMessage({type: 'FETCH_HOYOLAB', url: accountUrl}, async (response) => {
        if (!response || !response.success || response.data.retcode !== 0) {
            EL.headerSection.resultDiv.innerHTML = `❌ 실패1: ${response?.data?.message || "로그인 필요"}`;
            EL.headerSection.fetchBtn.disabled = false;
            return;
        }

        const zzzGame = response.data.data.list.find(game => game.game_id === 8);
        if (!zzzGame) {
            EL.headerSection.resultDiv.innerHTML = "❌ ZZZ 프로필을 찾을 수 없습니다.";
            EL.headerSection.fetchBtn.disabled = false;
            return;
        }
        console.log("Fetched User Data5:", zzzGame);

        const {game_role_id: roleId, region} = zzzGame;
        currentUserInfo.uid = String(roleId);
        currentUserInfo.region = region;

        //유저 목록 로드
        //초기화
        EL.userList.itemsList.innerHTML = '';
        EL.userList.uidInput.value = '';
        userListData = {};

        //자신
        const indexData = await fetchIndex(currentUserInfo.uid);
        if(indexData) {
            const enkaData = await fetchEnka(roleId)
            addUserToList(enkaData.nickname, currentUserInfo.uid,  indexData.cur_head_icon_url, true);
            await renderUser(currentUserInfo.uid, enkaData, indexData);
        }
        //나머지
        chrome.storage.sync.get('userListData', (data) => {
            userListData = data.userListData || {};
            Object.entries(userListData).forEach(([uid, user]) => {
                addUserToList(user.name, uid, user.avatar);
            })
        });
    });
}
async function fetchEnka(uid){
    const url = `https://enka.network/api/zzz/uid/${uid}`;
    console.log(url);
    let nickname = uid;
    let level = "?";
    let regionName = getRegionByUid(uid);
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({type: 'FETCH_ENKA', url: url}, (res) => {
            if (res) {
                nickname = res.data.PlayerInfo.SocialDetail.ProfileDetail.Nickname;
                level = res.data.PlayerInfo.SocialDetail.ProfileDetail.Level;
                regionName = res.data.region;
                console.log("nick success", nickname);
            }
            else{
                console.log("nick fail");
            }
            resolve({
                nickname: nickname,
                level: level,
                regionName: regionName
            });
        });
        return true;
    })
}

async function fetchIndex(uid){
    const region = getRegionByUid(uid);
    const selectedLang = EL.langSelect.value;
    EL.headerSection.resultDiv.innerHTML = `Fetching Profile...`;
    const IndexUrl = `https://sg-public-api.hoyolab.com/event/game_record_zzz/api/zzz/index?server=${region}&role_id=${uid}&lang=${selectedLang}`
    console.log("index url:", IndexUrl);
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({type: 'FETCH_HOYOLAB', url: IndexUrl}, (res) => {
            if (res.success && res.data.retcode === 0) {
                console.log("Index Data:", res.data.data);
                resolve(res.data.data);
            }
            else{
                EL.headerSection.resultDiv.innerHTML = `❌ 실패2: ${res.data?.message}`;
                resolve(null);
            }
        });
        return true;
    })
}
async function renderUser(uid, enkaData, indexData){
    EL.headerSection.nickname.innerText = enkaData.nickname;
    //EL.headerSection.playerLevel.innerText = `${profile.stats.world_level_name}`;
    EL.headerSection.playerLevel.innerText = `Lv. ${enkaData.level}`;
    console.log("renderUser", indexData);
    const titleMainColor = `${indexData.game_data_show.title_main_color || 'FFFFFF'}`
    const titleBottomColor = `${indexData.game_data_show.title_bottom_color || titleMainColor}`
    // language=html
    const personal_title = `
        <span style="
            background: linear-gradient(to bottom, #${titleMainColor}, #${titleBottomColor});
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;">${indexData.game_data_show.personal_title}</span>`
    EL.headerSection.serverInfo.innerHTML = `${personal_title} / ${enkaData.regionName} / UID: ${currentUserInfo.uid}`;
    EL.headerSection.profilePic.style.backgroundImage = `url(${indexData.cur_head_icon_url})`;
    fetchAgentList(uid);
}
function fetchAgentList(uid){
    const region = getRegionByUid(uid);
    const selectedLang = EL.langSelect.value;
    const basicUrl = `https://sg-public-api.hoyolab.com/event/game_record_zzz/api/zzz/avatar/basic?role_id=${uid}&server=${region}&lang=${selectedLang}`;
    console.log("basic url:", basicUrl);
    chrome.runtime.sendMessage({type: 'FETCH_HOYOLAB', url: basicUrl}, async (basicRes) => {
        if (!basicRes.success || basicRes.data.retcode !== 0) {
            EL.headerSection.resultDiv.innerHTML = `❌ 실패3: ${basicRes.data?.message}`;
            EL.headerSection.fetchBtn.disabled = false;
            return;
        }

        globalAgents = basicRes.data.data.avatar_list;
        console.log("Fetched Agents List:", globalAgents);

        if (globalAgents.length > 0) {
            renderAgentNav(globalAgents);
            currentAgentIndex = currentAgentIndex < 0 ? 0 : currentAgentIndex;
            fetchAgentDetail(currentAgentIndex);
        } else {
            EL.headerSection.resultDiv.innerHTML = `❌ 로드할 에이전트가 없습니다.`;
            EL.headerSection.fetchBtn.disabled = false;
        }
    });
}
/**
 * 캐릭터 상세 정보 개별 로딩
 */
function fetchAgentDetail(index) {
    if (index < 0 || !globalAgents[index]) return;

    const agent = globalAgents[index];
    const selectedLang = EL.langSelect.value;

    EL.headerSection.fetchBtn.disabled = true;
    EL.headerSection.resultDiv.innerHTML = `<b>[3/4]</b> ${agent.name_mi18n} 데이터 로드 중...`;

    const detailUrl = `https://sg-public-api.hoyolab.com/event/game_record_zzz/api/zzz/avatar/info?role_id=${currentUserInfo.uid}&server=${currentUserInfo.region}&id_list[]=${agent.id}&lang=${selectedLang}&need_wiki=true`;
    console.log("detail url:", detailUrl);
    chrome.runtime.sendMessage({type: 'FETCH_HOYOLAB', url: detailUrl}, (res) => {
        if (res.success && res.data.retcode === 0) {
            currentAgentFullData= res.data.data;
            currentAgentDetail = res.data.data.avatar_list[0];
            console.log("Detail Data:", currentAgentDetail);
            renderAgentDetail(currentAgentDetail);
            EL.headerSection.resultDiv.innerHTML = `Load Success`;
        } else {
            EL.headerSection.resultDiv.innerHTML = `Load Failed: ${res.data?.message || "no response"}`;
        }
        EL.headerSection.fetchBtn.disabled = false;
        EL.loadingImg.style.display = 'none';
    });
}
function applyI18nLabels(i18nData) {
    const mapping = [
        {el: EL.weaponSection.header, key: 'roles_weapon'},             // W-엔진
        {el: EL.skillSection.header, key: 'roles_detail_skill_title'}, // 스킬
        {el: EL.statSection.header, key: 'roles_detail_props_title'},  // 에이전트 속성
        {el: EL.discSection.header, key: 'roles_equipment'},            // 디스크
        {el: EL.discSection.planSelectBtn, key: 'roles_change_plan'},
        {el: EL.modal.subStatClearAll, key: 'roles_clear_all'},
        {el: EL.modal.subStatSaveAll, key: 'roles_save_all'},
        {el: EL.modal.modalTitleCustom, key: 'roles_select_custom_property'},
        {el: EL.modal.wikiBtnLabel, key: 'wiki'},
    ]

    mapping.forEach(({ el, key }) => {
        if (el && i18nData[key]) {
            el.textContent = i18nData[key]??key;
        }
    });
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
    const ranks = currentAgentDetail.ranks;

    ranks.forEach((item, index) => {
        const isLast = index === ranks.length - 1;
        const iconVar = `var(--url-cinema${item.id})`;
        const iconColor = item.is_unlocked
            ? UI_SETTING.FONT_COLORS.CINEMA_ACTIVE
            : UI_SETTING.FONT_COLORS.CINEMA_INACTIVE;

        // language=html
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
            </div>
            `;

        // 마지막 항목이 아닐 때만 하단에 구분선 추가
        if (!isLast) {
            content += `<i class="rank-divider" style="display: block; height: 1px; background: #2a2c2b; margin: 10px 0;"></i>`;
        }
    });
    const wikiUrl = currentAgentFullData.avatar_wiki[currentAgentDetail.id];
    openModal(header, content, wikiUrl);
}
function handleAwakenClick(e){
    const indicator = e.target.closest('.awaken-ui');
    if (!indicator) return;
    if (currentAgentIndex === -1) return;
    const header = i18nData.potential_trigger_detail || 'AwakenDetail';
    let content = ``;
    const skillAwaken = currentAgentDetail.skill_awaken;
    const skillAwakenItems = skillAwaken.skill_awaken_items;
    //각성 단계별 루프
    skillAwakenItems.forEach(skillAwakenItem => {
        const numberIconVar = `var(--url-cinema${skillAwakenItem.awaken_level})`;
        const iconColor = skillAwakenItem.awaken_level <= skillAwaken.awaken_level
            ? UI_SETTING.FONT_COLORS.CINEMA_ACTIVE
            : UI_SETTING.FONT_COLORS.CINEMA_INACTIVE;
        // language=html
        content += `
            <div style="display: flex; align-items: center">
            <span style="
                width: 64px; height: 64px; flex-shrink: 0;
                -webkit-mask-image: ${numberIconVar}; 
                mask-image: ${numberIconVar};
                background-color: ${iconColor}"></span>
                <div>
                    <h2 style="margin: 5px">${skillAwakenItem.level_show_name}</h2>
                    <p style="margin: 5px; color: #888;">${i18nData.potential_active.replace('{n}', skillAwakenItem.awaken_level)}</p>
                </div>
            </div>
        `
        //단계 내 스킬별 루프
        skillAwakenItem.awaken_skill_items.forEach(awakenSkillItem => {
            const skillIconVar = `${ZZZ_RESOURCE.BASE.ICONS}${ZZZ_RESOURCE.SKILL_TYPE_ICONS_SVG[awakenSkillItem.skill_type]}`;
            let smallContent = ``;
            awakenSkillItem.skill_items.forEach((skill_item) => {
                smallContent += `<h3>${skill_item.title}</h3>${formatGameText(skill_item.text)}`
            })
            // language=html
            content += `
                <div style="
                background-color: #2a2c2b; 
                border-radius: 12px; 
                padding: 15px; margin: 10px 0">
                    <details>
                        <summary>
                            <div style="display: flex; align-items: center">
                                <img style="width: 32px; height: 32px;" src="${skillIconVar}">
                                <h2 style="margin: 5px">${awakenSkillItem.awaken_simple_info}</h2>
                            </div>
                        </summary>
                        ${smallContent}
                    </details>
                </div>`
        })
    })
    const wikiUrl = currentAgentFullData.avatar_wiki[currentAgentDetail.id];
    openModal(header, content, wikiUrl);
}
function openClothes(){
    const header = i18nData.clothes_cabinet ?? "clothes_cabinet";
    let content = `<p>${i18nData.roles_clothes_popup_tip}</p>`;
    currentAgentDetail.skin_list.forEach(skin => {
        //language=html
        content +=`<div>
            <img style="background-color: ${skin.skin_vertical_painting_color};
                 border-radius: 15px;
                 height: 356px;
                 background-image: url('https://act.hoyolab.com/app/zzz-game-record/images/page-bg.a60aa991.png')"
                 src=${skin.skin_vertical_painting_url}>
            <h1 class = "zzz-font-display" style="margin-top: 5px;margin-bottom: 25px">${skin.skin_name}</h1>
        </div>`
    })
    openModal(header, content);
}
function openWeaponDetail(){
    const header = i18nData.roles_detail_weapon_popup_title ?? 'W-Engine Detail'
    const weapon = currentAgentDetail.weapon;
    //const title = weapon.talent_title;
    const content = weapon.talent_content;
    //const weaponTest = `<h3>${title}</h3><span>${content}</span>`;        
    const wikiUrl = currentAgentFullData.weapon_wiki[weapon.id];
    openModal(header, content, wikiUrl);
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
    const skillInfo = currentAgentDetail.skills.find(s => s.skill_type === type);
    
    // 5. 데이터가 존재하면 모달 열기
    if (skillInfo) {
        const header = i18nData.roles_detail_skill_popup_title ?? 'Skill Detail';
        const skillTypeNameKey = ZZZ_RESOURCE.SKILL_TYPE_NAMES[type];
        const skillTypeName = i18nData[skillTypeNameKey] ?? skillTypeNameKey;
        
        let content = ``;

        content += `
        <div style="display: flex; align-items: center">
            <img src=${ZZZ_RESOURCE.BASE.ICONS}${ZZZ_RESOURCE.SKILL_TYPE_ICONS[type]} alt="${skillTypeName}">
            <div>
                <h2 style="margin: 5px">${skillTypeName}</h2>
                <p style="margin: 5px ">Lv.${skillInfo.level}</p>
            </div>
        </div>
        `
        skillInfo.items.forEach((item) => {
            content += `<h3 style="margin-block-end: 0.5em;">${item.title || ''}</h3>`;
            content += formatGameText(item.text);
        })
        const wikiUrl = currentAgentFullData.avatar_wiki[currentAgentDetail.id];
        openModal(header, content, wikiUrl);
    }
}
function handleDiskClick(e){
    const clickedDisk = e.target.closest('.disk-icon');
    if(!clickedDisk) return;
    const diskIndex = parseInt(clickedDisk.dataset.diskIndex, 10);
    const disk = currentAgentDetail.equip?.find(e => e.equipment_type === diskIndex);
    const header = i18nData.roles_equip_suit_detail;
    const equipSuit = disk.equip_suit;
    let content = `<h2>${equipSuit.name}</h2>`;
    let color = equipSuit.own >= 2 ? '#B5FF00' : '#ACACAC';
    content += `<h3 style="color: ${color}">${i18nData.roles_suit_effect_unit.replace('{x}', '2')}</h3>`
    content += `<span style="color: ${color}">${equipSuit.desc1}</span>`;
    color = equipSuit.own >= 4 ? '#B5FF00' : '#ACACAC';
    content += `<h3 style="color: ${color}">${i18nData.roles_suit_effect_unit.replace('{x}', '4')}</h3>`
    content += `<span style="color: ${color}">${formatGameText(equipSuit.desc2)}</span>`;
    const wikiUrl = currentAgentFullData.equip_wiki[disk.id];
    openModal(header, content, wikiUrl);
}

function openPlanSelect(){
    const header = i18nData.roles_select_plan_source ?? 'Plan Select';
    const planInfo = currentAgentDetail.equip_plan_info;
    let content = ``;
    
    // language=html
    content +=`
        <label class="modal-selection">
            <div class="plan-selection-header">
                <h2>${i18nData.roles_custom_source??'Custom'}</h2>
                <input type="radio"
                       name="plan-selection"
                       value=3
                       ${planInfo.type === 3 ? 'checked' : ''}
                       style="cursor: pointer;">
            </div>
        </label>
    `;
    if(planInfo.game_default.property_list && planInfo.game_default.property_list.length > 0){
        let subStatsHtml = ``;
        planInfo.game_default.property_list.forEach(item => {
            // language=html
            subStatsHtml += `
                <span style="
                background-color: #1D1F1E; 
                padding: 7px 14px; 
                border-radius: 9999px;
                color: ${UI_SETTING.FONT_COLORS.HIGHLIGHT}">
                    ${item.name}
                </span>`
        })
        // language=html
        content +=`
            <label class="modal-selection">
                <div class="plan-selection-header">
                    <h2>${i18nData.roles_game_default_source??'Default'}</h2>
                    <input type="radio"
                           name="plan-selection"
                           value=1
                           ${planInfo.type === 1 ? 'checked' : ''}
                           style="cursor: pointer;">
                </div>
                <span class="plan-selection-desc">
                    ${i18nData.roles_game_default_source_desc}
                </span>
                <div style="display: flex; gap: 5px">${subStatsHtml}</div>
                
            </label>`
    }
    // language=html
    content +=`
        <label class="modal-selection">
            <div class="plan-selection-header">
                <h2>${i18nData.roles_guide_plan_source??'Guide'}</h2>
                <input type="radio"
                       name="plan-selection"
                       value=2
                       ${planInfo.type === 2 ? 'checked' : ''}
                       style="cursor: pointer;">
            </div>
            <span class="plan-selection-desc">
                ${i18nData.roles_guide_plan_source_label.replace('{plan}', planInfo.cultivate_info.name)??'Source'}
            </span>
        </label>
    `;
    // language=html
    content += `
        <div style="text-align: center">
            <button id="change-plan-confirm" class="modal-button" style="background-color: ${UI_SETTING.FONT_COLORS.SELECTED}">
                ${planInfo.type === 3 ? i18nData.roles_continue : i18nData.confirm}
            </button>
        </div>
`
    openModal(header, content);

    const modalBody = EL.modal.modalBodyCommon;
    const confirmBtn = document.getElementById("change-plan-confirm");

    if (modalBody && confirmBtn) {
        modalBody.addEventListener('change', (e) => {
            if (e.target.name === 'plan-selection') {
                const val = parseInt(e.target.value, 10);
                confirmBtn.innerText = (val === 3) ? i18nData.roles_continue : i18nData.confirm;
            }
        });
    }
    
    if (confirmBtn) {
        confirmBtn.addEventListener('click', changePlan);
    }
}
function changePlan(){
    const selected = document.querySelector('input[name="plan-selection"]:checked');
    if (!selected) return;
    const playType = parseInt(selected.value, 10);
    switch (playType){
        case 1:
        case 2:
            changePlanRequest(playType)
            break;
        case 3:
            EL.modal.modalContentCommon.classList.remove('active');
            EL.modal.modalContentCustom.classList.add('active')
            let content = `<span>${i18nData.roles_select_custom_property_desc||'desc'}</span>`;
            currentAgentDetail.equip_plan_info.custom_info.property_list.forEach(item => {
                // language=html
                content += `
                    <label class="modal-selection" style="flex-direction: row;justify-content: space-between">
                        <div>
                            ${getStatIconHtml(item.id)}
                            ${item.full_name}
                        </div>
                        <input 
                                type="checkbox" 
                                name="stat-selection" 
                                value="${item.id}"
                                ${item.is_select === true ? 'checked' : ''}>
                    </label>
                `
            })
            EL.modal.modalBodyCustom.innerHTML = `${content}`
            
            // [추가] 커스텀 모달이 열린 직후 초기 상태 업데이트
            updateCustomModalStatus();
            break
    }
}

// [추가] 커스텀 모달의 버튼 및 체크박스 상태를 관리하는 함수
function updateCustomModalStatus() {
    const checkboxes = document.querySelectorAll('input[name="stat-selection"]');
    const checkedBoxes = document.querySelectorAll('input[name="stat-selection"]:checked');
    const checkedCount = checkedBoxes.length;

    // 1. 선택된 체크박스가 없을 경우 버튼 비활성화
    const isDisabled = checkedCount === 0;
    EL.modal.subStatClearAll.disabled = isDisabled;
    EL.modal.subStatSaveAll.disabled = isDisabled;

    // 2. 선택된 체크 박스가 4개 이상일 경우, 미선택된 체크 박스 비활성화 및 라벨 스타일 변경
    checkboxes.forEach(cb => {
        const label = cb.closest('.modal-selection');
        if (!cb.checked) {
            cb.disabled = checkedCount >= 4;
            if (label) {
                label.style.opacity = (checkedCount >= 4) ? '0.5' : '1';
                label.style.cursor = (checkedCount >= 4) ? 'not-allowed' : 'pointer';
            }
        } else {
            cb.disabled = false;
            if (label) {
                label.style.opacity = '1';
                label.style.cursor = 'pointer';
            }
        }
    });
}

function changePlanRequest(planType){
    const url = 'https://sg-act-public-api.hoyolab.com/event/game_record_zzz/api/zzz/equip_assessment';
    let body = {
        uid: String(currentUserInfo.uid), // 확실하게 문자열로 변환
        region: currentUserInfo.region,
        avatar_id: Number(currentAgentDetail.id), // 확실하게 숫자로 변환
        type: Number(planType) // 확실하게 숫자로 변환
    };
    switch (planType) {
        default:
        case 1:
            break;
        case 2:
            body.plan_id = Number(currentAgentDetail.equip_plan_info.cultivate_info.plan_id);
            break;
        case 3:
            const selectedValues = [...document.querySelectorAll('input[name="stat-selection"]:checked')]
                .map(cb => cb.value);
            body.property_id_list = selectedValues;
            break;
    }            
    
    console.log("Sending plan change request...", body);
    chrome.runtime.sendMessage({
        type: 'FETCH_HOYOLAB',
        method: 'POST',
        url: url,
        body: body,
        lang: EL.langSelect.value,
        region: currentUserInfo.region
    }, (res) => {
        if (res && res.success && res.data.retcode === 0) {
            console.log("✅ 서버 저장 성공:", res.data);
            fetchAgentDetail(currentAgentIndex); // 단일 캐릭터 새로고침 호출
            closeModal();
        } else {
            console.error("❌ 서버 저장 실패:", res?.data?.message || res?.error || "알 수 없는 오류");
            alert("변경 실패: " + (res?.data?.message || "서버 응답 없음"));
        }
    });
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
            fetchAgentDetail(currentAgentIndex); // 클릭 시 상세 정보 가져오기
        });

        EL.nav.appendChild(wrapper);
    });
}

/**
 * 에이전트 상세 정보 렌더링
 */
function renderAgentDetail(agent) {
    if (!agent || !agent.properties) return; // 상세 정보가 없으면 렌더링 중단

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
    EL.app.style.background = `linear-gradient(to bottom, ${themeColor}, #000000)`;
    //document.body.style.backgroundAttachment = 'fixed';
    if (section.portraitBgEl) {
        section.portraitBgEl.style.background = themeColor;
    }
    // marquee효과
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
    
    // 잠재력 각성
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

    EL.discSection.disksContainer.innerHTML = '';
    
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
            clone.querySelector('.disk-icon').dataset.diskIndex = `${i}`;
            clone.querySelector('.sub-item').innerHTML = `
            <span class="sub-name">${mainName}</span>
            <span class="sub-val">${mainValue}</span>`
            clone.querySelector('.disk-sub-list').insertAdjacentHTML('beforeend', subPropsHtml);
            diskSlotDiv.appendChild(clone);
            
        } else {
            diskSlotDiv.className = 'disk-card empty-slot';
            diskSlotDiv.innerHTML = `<div class="empty-disk-msg">${i}번 슬롯 비어있음</div>`;
        }
        EL.discSection.disksContainer.appendChild(diskSlotDiv);
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

    // 다국어 제목 처리
    let titleText = "디스크에 유효한 서브 스탯 명중 횟수: {num}회";
    let planSourceLabel = '';
    let validStatsHtml = '';
    
    /**
     * 유효 속성 소스
     */
    //const activePlanSource = planInfo.game_default;
    const recommendProps = planInfo.plan_effective_property_list || [];
    if(recommendProps.length === 0){
        titleText = i18nData.roles_not_suitable_development_tip;
    }
    else{
        // 추천 스탯 태그 HTML 생성
        validStatsHtml = recommendProps.map(prop => {
            // ZZZ_RESOURCE.STAT_ICONS의 키값(12103 등)과 일치하는 prop.id를 사용합니다.
            const iconHtml = getStatIconHtml(prop.id, UI_SETTING.FONT_COLORS.DEFAULT);
            return `<span class="stat-tag">${iconHtml}${prop.name}</span>`;
        }).join('');


        titleText = i18nData.roles_random_attributes_hit_num;
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

        planSourceLabel = i18nData.roles_plan_source.replace('{source}', planSourceContext);
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