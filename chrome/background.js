// 1. 확장 프로그램 아이콘 클릭 시 대시보드 페이지(dashboard.html)를 새 탭으로 엽니다.
chrome.action.onClicked.addListener(() => {
    chrome.tabs.create({url: 'dashboard.html'});
});

// 2. hoyolab.com과 mihoyo.com의 쿠키를 모두 수집하여 하나로 합칩니다.
async function getHoyoverseData() {
    const domains = ["https://www.hoyolab.com"];
    let allCookies = [];

    for (const url of domains) {
        const cookies = await chrome.cookies.getAll({url});
        allCookies = allCookies.concat(cookies);
    }

    const cookieMap = new Map();
    allCookies.forEach(c => cookieMap.set(c.name, c.value));

    // 쿠키에서 호요랩 UID(ltuid)를 추출합니다.
    const ltuid = cookieMap.get('ltuid_v2') || cookieMap.get('ltuid');

    const cookieString = Array.from(cookieMap.entries())
        .map(([name, value]) => `${name}=${value}`)
        .join('; ');

    return {cookieString, ltuid, cookieMap};
}

// 3. declarativeNetRequest를 사용하여 Origin 및 Referer 헤더를 강제로 변조합니다.
const HOYOLAB_ORIGIN = 'https://act.hoyolab.com';
const RULE_ID = 1;

async function updateNetRequestRules() {
    const rule = {
        id: RULE_ID,
        priority: 1,
        action: {
            type: 'modifyHeaders',
            requestHeaders: [
                { header: 'Origin', operation: 'set', value: HOYOLAB_ORIGIN },
                { header: 'Referer', operation: 'set', value: HOYOLAB_ORIGIN + '/' }
            ]
        },
        condition: {
            urlFilter: 'https://sg-act-public-api.hoyolab.com/event/game_record_zzz/api/zzz/equip_assessment',
            resourceTypes: ['xmlhttprequest']
        }
    };

    await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [RULE_ID],
        addRules: [rule]
    });
}

// 서비스 워커 시작 시 규칙 적용
chrome.runtime.onInstalled.addListener(updateNetRequestRules);
chrome.runtime.onStartup.addListener(updateNetRequestRules);

// 4. 대시보드 페이지로부터의 요청을 받아 호요버스 API와 통신합니다.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {    
    if (message.type === 'FETCH_HOYOLAB') {
        (async () => {
            try {
                const {cookieString, ltuid} = await getHoyoverseData();

                let targetUrl = message.url;
                if (targetUrl.includes('getGameRecordCard') && !targetUrl.includes('uid=') && ltuid) {
                    targetUrl += `?uid=${ltuid}`;
                }

                const headers = {
                    'Content-Type': 'application/json', // 명시적으로 지정
                    'Cookie': cookieString,             // 인증을 위해 필수
                    'x-rpc-client_type': '5',           // 호요랩 API 구분자
                    'Origin': 'https://act.hoyolab.com',
                    'Referer': 'https://act.hoyolab.com/'
                };

                const fetchOptions = {
                    method: message.method || 'GET',
                    headers: headers,
                    body: message.body ? JSON.stringify(message.body) : null
                };

                const response = await fetch(targetUrl, fetchOptions);
                const data = await response.json();
                sendResponse({success: true, data, ltuid});
            } catch (err) {
                sendResponse({success: false, error: err.message});
            }
        })();
        return true;
    }
    if(message.type === 'FETCH_ENKA'){
        (async () => {
            try {
                const response = await fetch(message.url, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'User-Agent': 'ZZZAgentDashboard/1.0'
                    }
                });
                const data = await response.json();
                sendResponse({success: true, data});
            } catch (err) {
                sendResponse({success: false, error: err.message});
            }
        })();
        return true;
    }
});