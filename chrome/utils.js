import {ZZZ_RESOURCE, UI_SETTING} from "./constants.js";
let skillIconMap;
export function getStatIconHtml(statId, iconColor = '#ffffff') {
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
// Hex(#RRGGBB)를 RGBA로 변환
export function hexToRgba(hex, opacity) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

// 랭크에 따른 그라데이션 스타일 문자열 생성
export function getDiskScoreGradient(rank) {
    const baseColor = UI_SETTING.RANK_COLORS[rank] || UI_SETTING.RANK_COLORS["ER_B"];
    const colorStart = hexToRgba(baseColor, 0.14);
    const colorEnd = hexToRgba(baseColor, 0);

    return `linear-gradient(226deg, ${colorStart} 4.82%, ${colorEnd} 29.32%), #1b1b1b`;
}
export function setSkillIconMap(data){
    skillIconMap = data
    console.log(skillIconMap)
}
export function formatGameText(text) {
    if (!text) return '';

    let formatted = text;

    // 1. 호요랩 원본 특수 태그 치환 (공백 처리)
    formatted = formatted.replace(/\{SPACE\}/g, " ").replace(/\{NON_BREAK_SPACE\}/g, "&nbsp;");

    // 2. 아이콘 태그 치환 (<IconMap:ID> -> <img>)
    formatted = formatted.replace(/<IconMap:[^>]+>/g, (match) => {
        const iconUrl = skillIconMap ? skillIconMap[match] : null;
        if (iconUrl) {
            return `<img src="${iconUrl}" class="skill-inline-icon" alt="icon" style="height: 1.4em; vertical-align: bottom;">`;
        }
        return match.replace('<', '&lt;').replace('>', '&gt;');
    });

    // 3. 컬러 및 스타일 태그 치환
    // 컬러 태그 (<color=#HEX>...</color>)
    formatted = formatted.replace(/<color=#?([a-fA-F0-9]{6,8})>(.*?)<\/color>/gs, (match, color, content) => {
        return `<span style="color:#${color}">${content}</span>`;
    });
    // 기울임 및 굵게 (<i>, <b>)
    formatted = formatted.replace(/<i>(.*?)<\/i>/g, "<span style='font-style: italic;'>$1</span>");
    formatted = formatted.replace(/<b>(.*?)<\/b>/g, "<span style='font-weight: 700;'>$1</span>");

    // 4. 조건부 레이아웃 및 성별 분기 처리 (원본 로직 이식)
    formatted = formatted.replace(/\{F#(.+?)\}/g, ""); // 여성형 무시
    formatted = formatted.replace(/\{M#(.+?)\}/g, "$1"); // 남성형 출력
    formatted = formatted.replace(/\{LAYOUT_CONSOLECONTROLLER#[^}]*\}/g, ""); // 콘솔 태그 제거
    formatted = formatted.replace(/\{LAYOUT_FALLBACK#([^}]*)\}/g, "$1"); // 폴백 태그의 텍스트만 남김
    formatted = formatted.replace(/\{LAYOUT_MOBILE(.*?)\}/g, ""); // 모바일 태그 제거
    formatted = formatted.replace(/\{LAYOUT_CONTROLLER(.*?)\}/g, ""); // 컨트롤러 태그 제거
    formatted = formatted.replace(/\{LAYOUT_KEYBOARD(.*?)\}/g, ""); // 키보드 태그 제거
    formatted = formatted.replace(/\{LAYOUT_XBOXCONTROLLER(.*?)\}/g, ""); // 엑박 태그 제거

    // 5. 줄바꿈 기호 변환
    formatted = formatted.replace(/\\n/g, '<br>').replace(/\n/g, '<br>');

    return `<p class="skill-description" style="margin: 0">${formatted}</p>`;
}
export function getRegionByUid(uid){
    const regionNum = String(uid).slice(0, 2);
    switch (regionNum) {
        case "10":
            return "prod_gf_us"
        case "13":
            return "prod_gf_jp"
        case "15":
            return "prod_gf_eu"
        case "17":
            return "prod_gf_sg"
        default:
            return null
    }
}
export async function getNickname(uid){
    let url = "";
    const mode = 0;
    switch (mode) {
        case 0:
            url = `https://sg-act-public-api.hoyolab.com/event/game_record_zzz/api/zzz/hadal_info_v2?server=${getRegionByUid(uid)}&role_id=${uid}&schedule_type=1&without_v2_detail=true`;
            console.log(url);
            return new Promise((resolve, reject) => {
                chrome.runtime.sendMessage({type: 'FETCH_HOYOLAB', url: url}, (res) => {
                    if (res.success && res.data.retcode === 0) {
                        const nickname = res.data.data.nick_name;
                        const avatar = res.data.data.icon;
                        console.log("nick success", nickname, avatar);
                        resolve({nickname, avatar});
                    }
                    else{
                        console.log("nick fail");
                        resolve(null);
                    }
                });
            })
        case 1:
            url = `https://enka.network/api/zzz/uid/${uid}`;
            console.log(url);
            return new Promise((resolve, reject) => {
                chrome.runtime.sendMessage({type: 'FETCH_ENKA', url: url}, (res) => {
                    console.log("test", res);
                    if (res.ok) {
                        console.log("nick success", res);
                        resolve({nickname, avatar});
                    }
                    else{
                        console.log("nick fail");
                        resolve(null);
                    }
                });
            })
    }
    
}