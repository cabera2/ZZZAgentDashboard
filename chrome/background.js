// 1. 확장 프로그램 아이콘 클릭 시 대시보드 페이지(dashboard.html)를 새 탭으로 엽니다.
chrome.action.onClicked.addListener(() => {
    chrome.tabs.create({ url: 'dashboard.html' });
});

// 2. hoyolab.com과 mihoyo.com의 쿠키를 모두 수집하여 하나로 합칩니다.
async function getHoyoverseData() {
    const domains = ["https://www.hoyolab.com", "https://os.mihoyo.com"];
    let allCookies = [];

    for (const url of domains) {
        const cookies = await chrome.cookies.getAll({ url });
        allCookies = allCookies.concat(cookies);
    }

    const cookieMap = new Map();
    allCookies.forEach(c => cookieMap.set(c.name, c.value));

    // 쿠키에서 호요랩 UID(ltuid)를 추출합니다.
    const ltuid = cookieMap.get('ltuid_v2') || cookieMap.get('ltuid');

    const cookieString = Array.from(cookieMap.entries())
        .map(([name, value]) => `${name}=${value}`)
        .join('; ');

    return { cookieString, ltuid };
}

// 3. 대시보드 페이지로부터의 요청을 받아 호요버스 API와 통신합니다.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'FETCH_HOYOLAB') {
        (async () => {
            try {
                const { cookieString, ltuid } = await getHoyoverseData();

                let targetUrl = message.url;
                // 계정 정보 요청(getGameRecordCard)인데 UID가 없을 경우 쿠키에서 찾은 ltuid를 붙여줍니다.
                if (targetUrl.includes('getGameRecordCard') && !targetUrl.includes('uid=') && ltuid) {
                    targetUrl += `?uid=${ltuid}`;
                }

                const response = await fetch(targetUrl, {
                    method: 'GET',
                    headers: {
                        'Cookie': cookieString,
                        'x-rpc-client_type': '5',
                        'Origin': 'https://act.hoyolab.com',
                        'Referer': 'https://act.hoyolab.com/'
                    }
                });

                const data = await response.json();
                sendResponse({ success: true, data, ltuid });
            } catch (err) {
                sendResponse({ success: false, error: err.message });
            }
        })();
        return true; // 비동기 응답을 위해 true 반환
    }
});