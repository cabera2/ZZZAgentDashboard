// 1. 확장 프로그램 아이콘 클릭 시 대시보드 페이지(dashboard.html)를 새 탭으로 엽니다.
chrome.action.onClicked.addListener(() => {
    chrome.tabs.create({url: 'dashboard.html'});
});

// 2. hoyolab.com과 mihoyo.com의 쿠키를 모두 수집하여 하나로 합칩니다.
async function getHoyoverseData() {
    const domains = ["https://www.hoyolab.com", "https://os.mihoyo.com"];
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
            urlFilter: '*://*.hoyolab.com/*',
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
                const {cookieString, ltuid, cookieMap} = await getHoyoverseData();

                let targetUrl = message.url;
                if (targetUrl.includes('getGameRecordCard') && !targetUrl.includes('uid=') && ltuid) {
                    targetUrl += `?uid=${ltuid}`;
                }

                const deviceId = cookieMap.get('_HYVUUID') || '';
                const lang = message.lang || 'ko-kr';
                const serverRegion = message.region || 'prod_gf_jp';
                const avatarId = message.body?.avatar_id || "1311";
                const pagePath = `v2.7.2_#/zzz/roles/${avatarId}/detail`;

                // fetch 시에는 기본 헤더만 설정 (Origin/Referer는 NetRequestRule이 처리)
                const headers = {
                    'Accept': 'application/json, text/plain, */*',
                    'Accept-Language': 'ko,ja;q=0.9,en-US;q=0.8,en;q=0.7',
                    'Cookie': cookieString,
                    'Content-Type': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Mobile Safari/537.36',
                    'sec-ch-ua': '"Chromium";v="146", "Not-A.Brand";v="24", "Google Chrome";v="146"',
                    'sec-ch-ua-mobile': '?1',
                    'sec-ch-ua-platform': '"Android"',
                    'x-rpc-device_fp': '00000000000',
                    'x-rpc-device_id': deviceId,
                    'x-rpc-geetest_ext': JSON.stringify({
                        "viewUid": String(ltuid),
                        "server": serverRegion,
                        "gameId": 8,
                        "page": pagePath,
                        "isHost": 1,
                        "viewSource": 1,
                        "actionSource": 127
                    }),
                    'x-rpc-lang': lang,
                    'x-rpc-language': lang,
                    'x-rpc-lrsag': '',
                    'x-rpc-page': pagePath,
                    'x-rpc-platform': '5'
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
});