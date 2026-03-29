export const UI_SETTING = {
    FONT_COLORS: {
        DEFAULT: '#afafaf',
        HIGHLIGHT: '#f1ad3d',
        CINEMA_INACTIVE: '#606060',
        CINEMA_ACTIVE: '#fff060'
    },
    RANK_COLORS:{
        "ER_B": '#0A72FB',
        "ER_A": '#FB0ACB',
        "ER_S": '#FB650A',
        "ER_S_Plus": '#FB650A',
        "ER_SS": '#FB650A',
        "ER_SS_Plus": '#FB650A',
        "ER_SSS": '#FB650A',
        "ER_SSS_Plus": '#FB650A',
        "ER_SSS_Plus_Crown": '#FF799F'
    }
};
export const ZZZ_RESOURCE = {
    BASE: {
        IMAGES: "https://act.hoyolab.com/app/zzz-game-record/images/",
        ICONS: "https://act.hoyoverse.com/gt-ui/assets/icons/"
    },
    UI: {
        ICON_STAR: "https://act.hoyolab.com/app/zzz-game-record/images/icon-star.acd293ed.png"
    },
    NAV_FRAME: {
        UNSELECTED: "card-bg.0e12ef65.png",
        SELECTED: "card-selected-bg.1059d6ea.png"
    },
    RANK_ICONS: {
        'S': '23b9017829c0ac2d.png',
        'A': '6828e55edc3aa085.png'
    },
    // 속성 아이콘 (파일명만 저장)
    ELEMENT_ICONS: {
        200: "attribute-physical-icon.a657c07a.png",//물리
        201: "attribute-fire-icon.aeddecee.png",//불
        202: "attribute-ice-icon.5c85742d.png",//얼음
        203: "attribute-electric-icon.ad4c441f.png",//전기
        205: "attribute-ether-icon.9a1e42a1.png"//에테르
    },

    // 강화형 속성 아이콘 (sub_element_type 기준)
    SUB_ELEMENT_ICONS: {
        1: "attribute-frost-icon.8de86b8f.png",    // 서리 (얼음 강화)
        2: "attribute-auricink-icon.bb80b050.png", // 현묵 (에테르 강화)
        4: "attribute-honededge-icon.5c0ed0be.png" // 서슬 (물리 강화)
    },

    // 특성 아이콘 (파일명만 저장)
    PROFESSION_ICONS: {
        1: "profession-attack-icon.3c2a053f.png",//강공
        2: "profession-breakthrough-icon.84a7f20a.png",//격파
        3: "profession-anomaly-icon.cd1b1573.png",//이상
        4: "profession-support-icon.9cf39df7.png",//지원
        5: "profession-defensive-icon.9bd60af4.png",//방어
        6: "profession-rupture-icon.4668f112.png"//명파
    },
    SKILL_TYPE_ICONS:{
        0: "https://act.hoyoverse.com/gt-ui/assets/icons/1f66bafcc1f069c2.png",
        1: "https://act.hoyoverse.com/gt-ui/assets/icons/11ee8bd83f94a1eb.png",
        2: "https://act.hoyoverse.com/gt-ui/assets/icons/b15382e2428392f2.png",
        3: "https://act.hoyoverse.com/gt-ui/assets/icons/25a4b80fcfd80526.png",
        5: "https://act.hoyoverse.com/gt-ui/assets/icons/40791617886f6731.png",
        6: "https://act.hoyoverse.com/gt-ui/assets/icons/38b9cdcdee285da4.png"
    },
    
    SKILL_TYPE_NAMES:{
        0: "roles_skill_normal",
        1: "roles_skill_special",
        2: "roles_skill_dodge",
        3: "roles_skill_linkage",
        5: "roles_skill_core",
        6: "roles_skill_support"
    },

    // 디스크 점수 등급 아이콘
    DISK_RANK_ICONS: {
        "ER_B": "b.6428930f.png",
        "ER_A": "a.94d50077.png",
        "ER_S": "s.1b99e936.png",
        "ER_S_Plus": "s_plus.8426d3ac.png",
        "ER_SS": "ss.9aefb415.png",
        "ER_SS_Plus": "ss_plus.6a01e298.png",
        "ER_SSS": "sss.c792a8a7.png",
        "ER_SSS_Plus": "sss_plus.6a303d10.png",
        "ER_SSS_Plus_Crown": "sss_plus_crown.e0a88067.png"
    },

    // 디스크 레어도
    RARITY_ICONS: {
        'S': "rarity-s.57a8823c.png",
        'A': "rarity-a.2e7c7c47.png",
        'B': "rarity-b.7e53884c.png"
    },

    STAT_ICONS: {
        // 에이전트 상세 속성 (단축 ID)
        1: "317ce2a47d66fd3e.svg",   // HP
        2: "4883b409fd524b6d.svg",   // 공격력
        3: "f2a930b4deba8528.svg",   // 방어력
        4: "ae8b5440f710fad8.svg",   // 충격력
        5: "09bfc76f660dd0d1.svg",   // 치명타 확률
        6: "80d52f918714bed4.svg",   // 치명타 피해
        7: "2d4c15cee5a66ebe.svg",   // 이상 장악력
        8: "c44eb009da6c398b.svg",   // 이상 마스터리
        9: "1b15470e75018348.svg",   // 관통률
        11: "f26955cea8f29f4f.svg",  // 에너지 자동 회복
        19: "b765786bd239a9a8.svg",  // 관입력
        20: "2079bc3eeededc26.svg",  // 기운 자동 누적
        232: "b5cae085c3f59de9.svg", // 관통 수치
        315: "2bc246d1451fa4ce.png", // 물리 피해
        316: "a4040e05ea38849b.png", // 불 속성 피해
        317: "d2c575830f549349.png", // 얼음 속성 피해
        318: "2baf620986a19284.png", // 전기 속성 피해
        319: "544076112a8f3460.png", // 에테르 피해

        // 디스크 보조 속성 (5자리 ID)
        11102: "317ce2a47d66fd3e.svg", 11103: "317ce2a47d66fd3e.svg", // HP
        12102: "4883b409fd524b6d.svg", 12103: "4883b409fd524b6d.svg", // 공격력
        13102: "f2a930b4deba8528.svg", 13103: "f2a930b4deba8528.svg", // 방어력
        20103: "09bfc76f660dd0d1.svg", // 치명타 확률
        21103: "80d52f918714bed4.svg", // 치명타 피해
        23203: "b5cae085c3f59de9.svg", // 관통 수치
        31203: "c44eb009da6c398b.svg"  // 이상 마스터리
    }
};
export const ZZZ_FONT = {
    "ko-kr": 'Escoredream, sans-serif',
    "de-de": '"Tilt Warp", sans-serif',
    "th-th": '"Kanit", sans-serif'
}
export const CONTENT_FONT = {
    "zh-cn": '"Helvetica neue","PingFang SC","Hiragino Sans GB","Microsoft YaHei UI","Microsoft YaHei","Arial","sans-serif"',
    "zh-tw": '"Helvetica neue","PingFang TC","Hiragino Sans TC","Microsoft JhengHei UI","Microsoft JhengHei","Arial","sans-serif"',
    "ko-kr": '"nanum gothic","나눔 고딕","Malgun Gothic","맑은 고딕","돋움",sans-serif',
    "es-es": 'Helvetica,Arial,sans-serif',
    "th-th": 'kanit,Tahoma,Helvetica,Arial,Geneva,sans-serif',
    "ru-ru": '"Adelle Cyrillic","Dctz38",Arial,Helvetica,sans-serif',
    "ja-jp": '"YuGothic", "Meiryo", sans-serif',
    "de-de": '"Calibri","Arial"',
    "default": '"Helvetica neue","PingFang TC","Hiragino Sans TC","Microsoft JhengHei UI","Microsoft JhengHei","Arial","sans-serif"'
};