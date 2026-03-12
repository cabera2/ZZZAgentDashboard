document.getElementById('fetchBtn').addEventListener('click', () => {
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = "<b>[1/3]</b> 계정 정보 확인 중...";

    // 1단계: 계정 정보 로드 (getGameRecordCard.ts 참고)
    const accountUrl = 'https://bbs-api-os.hoyolab.com/game_record/card/wapi/getGameRecordCard';

    chrome.runtime.sendMessage({ type: 'FETCH_HOYOLAB', url: accountUrl }, (response) => {
        if (!response || !response.success || response.data.retcode !== 0) {
            resultDiv.innerHTML = `❌ 계정 확인 실패: ${response?.data?.message}`;
            return;
        }

        const zzzGame = response.data.data.list.find(game => game.game_id === 8);
        const { game_role_id: roleId, region, nickname } = zzzGame;
        resultDiv.innerHTML = `✅ <b>${nickname}</b>님 확인. <br><b>[2/3]</b> 에이전트 목록 가져오는 중...`;

        // 2단계: 기본 목록 로드 (getZZZScrap.ts의 getZZZCharacters 참고)
        const basicUrl = `https://sg-public-api.hoyolab.com/event/game_record_zzz/api/zzz/avatar/basic?role_id=${roleId}&server=${region}`;

        chrome.runtime.sendMessage({ type: 'FETCH_HOYOLAB', url: basicUrl }, async (basicRes) => {
            if (!basicRes.success || basicRes.data.retcode !== 0) {
                resultDiv.innerHTML = `❌ 목록 로드 실패: ${basicRes.data?.message}`;
                return;
            }

            const avatarIds = basicRes.data.data.avatar_list.map(a => a.id);
            resultDiv.innerHTML = `✅ 에이전트 ${avatarIds.length}명 감지. <br><b>[3/3]</b> 상세 데이터 로드 중...`;

            // 3단계: 개별 캐릭터 상세 정보 로드 (소스 코드의 map/Promise.all 방식 적용)
            const detailPromises = avatarIds.map(id => {
                return new Promise((resolve) => {
                    const detailUrl = `https://sg-public-api.hoyolab.com/event/game_record_zzz/api/zzz/avatar/info?role_id=${roleId}&server=${region}&id_list[]=${id}`;
                    chrome.runtime.sendMessage({ type: 'FETCH_HOYOLAB', url: detailUrl }, (res) => resolve(res));
                });
            });

            const results = await Promise.all(detailPromises);
            const allAgents = results
                .filter(r => r.success && r.data.retcode === 0)
                .map(r => r.data.data.avatar_list[0]); // 각 응답의 첫 번째 캐릭터 데이터 추출

            if (allAgents.length > 0) {
                resultDiv.innerHTML = `🎉 <b>성공!</b> ${allAgents.length}명의 에이전트 데이터를 로드했습니다.`;
                console.log("🔥 [최종 데이터 확인]:", allAgents);
            } else {
                resultDiv.innerHTML = `❌ 상세 데이터 로드 실패 (Parameter Error 가능성)`;
                console.log("실패한 응답들:", results);
            }
        });
    });
});