import {ZZZ_RESOURCE, UI_SETTING} from "./constants.js";

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