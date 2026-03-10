document.getElementById('fetchBtn').addEventListener('click', () => {
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = "<b>[1/2]</b> 계정 정보 불러오는 중...";

    // 기존의 mihoyo.com 대신 bbs-api-os.hoyolab.com 사용
    const accountUrl = 'https://bbs-api-os.hoyolab.com/game_record/card/wapi/getGameRecordCard';

    chrome.runtime.sendMessage({ type: 'FETCH_HOYOLAB', url: accountUrl }, (response) => {
        if (!response.success || response.data.retcode !== 0) {
            resultDiv.innerHTML = `❌ 실패 (retcode: ${response.data?.retcode}): ${response.data?.message || '로그인 상태를 확인하세요.'}`;
            return;
        }

        // 젠레스 존 제로(ZZZ)의 게임 ID는 8입니다.
        const zzzGame = response.data.data.list.find(game => game.game_id === 8);

        if (!zzzGame) {
            resultDiv.innerHTML = "❌ 계정에 ZZZ 게임 기록이 없습니다.";
            return;
        }

        const { game_role_id: roleId, region, nickname } = zzzGame;
        resultDiv.innerHTML = `✅ <b>${nickname}</b>님 확인. 상세 데이터 로드 중...`;

        // 에이전트 상세 정보 요청
        const detailUrl = `https://sg-public-api.hoyolab.com/event/game_record_zzz/api/zzz/avatar/info?role_id=${roleId}&server=${region}&need_wiki=true`;

        chrome.runtime.sendMessage({ type: 'FETCH_HOYOLAB', url: detailUrl }, (detailRes) => {
            if (detailRes.success && detailRes.data.retcode === 0) {
                const agents = detailRes.data.data.avatar_list;
                resultDiv.innerHTML = `🎉 <b>성공!</b> 총 ${agents.length}명의 에이전트 정보를 가져왔습니다.`;
                console.log("🔥 최종 데이터:", agents);
            } else {
                resultDiv.innerHTML = `❌ 상세 정보 로드 실패: ${detailRes.data?.message}`;
            }
        });
    });
});