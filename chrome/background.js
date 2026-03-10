async function getAllHoyoverseCookies() {
    // 두 도메인의 쿠키를 모두 수집합니다.
    const domains = ["https://www.hoyolab.com", "https://os.mihoyo.com"];
    let allCookies = [];

    for (const url of domains) {
        const cookies = await chrome.cookies.getAll({ url });
        allCookies = allCookies.concat(cookies);
    }

    // 중복 제거 후 문자열 생성
    const cookieMap = new Map();
    allCookies.forEach(c => cookieMap.set(c.name, c.value));

    return Array.from(cookieMap.entries())
        .map(([name, value]) => `${name}=${value}`)
        .join('; ');
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'FETCH_HOYOLAB') {
        (async () => {
            try {
                const cookieString = await getAllHoyoverseCookies();
                const response = await fetch(message.url, {
                    method: 'GET',
                    headers: {
                        'Cookie': cookieString,
                        'x-rpc-client_type': '5',
                        'Origin': 'https://act.hoyolab.com',
                        'Referer': 'https://act.hoyolab.com/' // 리퍼러 설정 중요
                    }
                });

                const data = await response.json();
                sendResponse({ success: true, data, cookieCount: cookieString.split(';').length });
            } catch (err) {
                sendResponse({ success: false, error: err.message });
            }
        })();
        return true;
    }
});