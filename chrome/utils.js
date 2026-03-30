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

    // 1. 아이콘 태그 치환 (<IconMap:ID> -> <img>)
    // window.skillIconMap에 해당 태그 전체를 키로 하는 URL이 들어있어야 합니다.
    formatted = formatted.replace(/<IconMap:[^>]+>/g, (match) => {
        const iconUrl = skillIconMap ? skillIconMap[match] : null;
        if (iconUrl) {
            return `<img src="${iconUrl}" class="skill-inline-icon" alt="icon" style="height: 1.4em;">`;
        }
        // 매핑된 아이콘이 없으면 태그를 텍스트로 그대로 보여줍니다 (브라우저가 무시하지 않도록 & 처리)
        return match.replace('<', '&lt;').replace('>', '&gt;');
    });

    // 2. 컬러 태그 치환 (<color=#HEX>...</color> -> <span style="color:#HEX">...</span>)
    // 콜백 함수를 사용하여 Rider의 $1 경고를 해결합니다.
    formatted = formatted.replace(/<color=(#[a-fA-F0-9]+)>(.*?)<\/color>/gs, (match, color, content) => {
        return `<span style="color:${color}">${content}</span>`;
    });

    // 3. 줄바꿈 기호 변환
    formatted = formatted.replace(/\\n/g, '<br>').replace(/\n/g, '<br>');

    return `<p class="skill-description" style="margin: 0">${formatted}</p>`;
}