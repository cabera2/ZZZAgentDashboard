// ==UserScript==
// @name         Hoyolab Layout Tweaker 2
// @namespace    http://tampermonkey.net/
// @version      0.4
// @description  Hoyolab Tools 영역을 살짝 축소해 세로 가시 영역 확장
// @match        https://act.hoyolab.com/sr/event/cultivation-tool/index.html*
// @run-at       document-end
// @grant        GM_addStyle
// ==/UserScript==

(() => {
  'use strict';

  // ---------- 기본 설정 ----------
  const TARGET_WIDTH = 1200; // 원하시는 가로폭(px)
  GM_addStyle(`
    div[class*="flexible-layout-to-body"] {
      height: 100vh !important;
      inset: 0 !important;
      overflow: visible !important;
    }

    .app-bg {
      min-height: 100vh !important;
      background-size: cover !important;
      background-repeat: no-repeat !important;
      background-position: center top !important;
    }
  `);

  // ---------- 배율 적용 함수 ----------
  const applyScale = () => {
    const layout = document.querySelector('.tools-layout');
    const scroller = document.querySelector('.main.gt-hsr-scrollbar--dark');
    if (!layout || !scroller) return;

    const scale = Math.min(TARGET_WIDTH, window.innerWidth) / layout.offsetWidth;
    layout.style.cssText = `
      transform: scale(${scale});
      transform-origin: top center;
      position: relative;
      display: block;
    `;
    const newHeight = `${100 / scale - 10}vh`;
    scroller.style.height = newHeight;
  };

  // ---------- 페이지 로드, 변화 감시 ----------
  const observer = new MutationObserver(() => {
    if (document.querySelector('.tools-layout')) {
      applyScale();
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // ---------- 창 리사이즈 시 재적용 ----------
  let timer;
  window.addEventListener('resize', () => {
    clearTimeout(timer);
    timer = setTimeout(applyScale, 150);
  });
})();