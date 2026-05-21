/**
 * naver-datalab.js
 * 네이버 DataLab 검색어 트렌드 API를 통해 글로벌 트렌드 키워드의 한국 검색 수요를 교차 검증합니다.
 *
 * API 문서: https://developers.naver.com/docs/serviceapi/datalab/search/v1/ko
 * - POST https://openapi.naver.com/v1/datalab/search
 * - 무료 / 일 1,000회 제한
 * - 응답: 최근 N개월간 키워드 검색량 상대 지수 (0~100)
 */

const axios = require('axios');

const DATALAB_URL = 'https://openapi.naver.com/v1/datalab/search';

// 글로벌 트렌드 키워드 → 한국어 검색어 매핑 테이블
// 영어 키워드를 그대로 보내면 한국 검색량이 0인 경우가 많으므로 한국어 대응어를 함께 묶음
const KEYWORD_MAP = [
    { group: 'AI 서비스',     keywords: ['AI 서비스', '인공지능 서비스', 'AI 앱'] },
    { group: 'SaaS',          keywords: ['SaaS', '소프트웨어 서비스', '클라우드 솔루션'] },
    { group: '자동화',         keywords: ['자동화', '업무 자동화', 'RPA'] },
    { group: '노코드',         keywords: ['노코드', '로코드', 'no-code'] },
    { group: '1인 창업',       keywords: ['1인 창업', '소자본 창업', '온라인 창업'] },
    { group: 'AI 코딩',        keywords: ['AI 코딩', 'vibe coding', 'AI 개발'] },
    { group: '수익화',         keywords: ['수익화', '부업', '사이드프로젝트 수익'] },
    { group: '챗봇',           keywords: ['챗봇', 'AI 챗봇', 'ChatGPT 활용'] },
    { group: '스타트업',        keywords: ['스타트업', '초기 스타트업', '린 스타트업'] },
    { group: '프리랜서',        keywords: ['프리랜서', '재택 부업', '온라인 프리랜서'] },
];

/**
 * 키워드 그룹 배열의 한국 검색량 트렌드 지수를 가져옵니다.
 * @param {Array} keywordGroups - KEYWORD_MAP 형식의 배열 (최대 5개 그룹)
 * @param {string} clientId - 네이버 클라이언트 ID
 * @param {string} clientSecret - 네이버 클라이언트 시크릿
 * @returns {Object} { groupName: { ratio: number, growth: number } }
 */
async function fetchDatalabTrend(keywordGroups, clientId, clientSecret) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 3); // 최근 3개월

    const formatDate = (d) => d.toISOString().split('T')[0];

    const body = {
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        timeUnit: 'month',
        keywordGroups: keywordGroups.map(g => ({
            groupName: g.group,
            keywords: g.keywords,
        })),
    };

    try {
        const response = await axios.post(DATALAB_URL, body, {
            headers: {
                'X-Naver-Client-Id': clientId,
                'X-Naver-Client-Secret': clientSecret,
                'Content-Type': 'application/json',
            },
            timeout: 10000,
        });

        const result = {};
        for (const item of response.data.results) {
            const ratios = item.data.map(d => d.ratio);
            const latest = ratios[ratios.length - 1] ?? 0;
            const prev = ratios[ratios.length - 2] ?? latest;
            const growth = prev > 0 ? Math.round(((latest - prev) / prev) * 100) : 0;

            result[item.title] = {
                ratio: Math.round(latest),   // 최신 월 검색 지수 (0~100)
                growth,                       // 전월 대비 성장률 (%)
                period: `${formatDate(startDate)} ~ ${formatDate(endDate)}`,
            };
        }
        return result;
    } catch (err) {
        if (err.response?.status === 401) {
            console.warn('⚠️  Naver DataLab: 인증 실패 — NAVER_CLIENT_ID / NAVER_CLIENT_SECRET을 확인하세요.');
        } else if (err.response?.status === 429) {
            console.warn('⚠️  Naver DataLab: 일일 호출 한도 초과 (1,000회/일)');
        } else {
            console.warn(`⚠️  Naver DataLab 오류: ${err.message}`);
        }
        return null;
    }
}

/**
 * 글로벌 트렌드 제목에서 핵심 키워드를 추출하여
 * 가장 관련성 높은 한국어 그룹의 DataLab 지수를 반환합니다.
 * @param {string} title - RSS 아이템 제목
 * @param {string} clientId
 * @param {string} clientSecret
 * @returns {Object|null} { group, ratio, growth, period } 또는 null
 */
async function getKoreanDemandSignal(title, clientId, clientSecret) {
    const lowerTitle = title.toLowerCase();

    // 제목에서 관련 키워드 그룹 찾기
    const matchedGroups = KEYWORD_MAP.filter(g =>
        g.keywords.some(k => lowerTitle.includes(k.toLowerCase())) ||
        g.group.toLowerCase().split(' ').some(w => lowerTitle.includes(w))
    );

    // 매칭된 그룹이 없으면 상위 3개 기본 그룹으로 시도
    const groupsToQuery = matchedGroups.length > 0
        ? matchedGroups.slice(0, 5)
        : KEYWORD_MAP.slice(0, 3);

    const trends = await fetchDatalabTrend(groupsToQuery, clientId, clientSecret);
    if (!trends) return null;

    // 가장 검색 지수가 높은 그룹 반환
    const best = Object.entries(trends).sort((a, b) => b[1].ratio - a[1].ratio)[0];
    if (!best) return null;

    return {
        group: best[0],
        ratio: best[1].ratio,
        growth: best[1].growth,
        period: best[1].period,
    };
}

/**
 * 전체 KEYWORD_MAP을 배치로 조회하여 현재 한국 시장 트렌드 스냅샷을 반환합니다.
 * (5개씩 묶어서 API 호출 — DataLab은 요청당 최대 5개 그룹)
 */
async function getFullKoreanTrendSnapshot(clientId, clientSecret) {
    const snapshot = {};
    const chunkSize = 5;

    for (let i = 0; i < KEYWORD_MAP.length; i += chunkSize) {
        const chunk = KEYWORD_MAP.slice(i, i + chunkSize);
        const trends = await fetchDatalabTrend(chunk, clientId, clientSecret);
        if (trends) Object.assign(snapshot, trends);

        // API Rate limit 보호: 배치 간 500ms 대기
        if (i + chunkSize < KEYWORD_MAP.length) {
            await new Promise(r => setTimeout(r, 500));
        }
    }

    return snapshot;
}

module.exports = { getKoreanDemandSignal, getFullKoreanTrendSnapshot, KEYWORD_MAP };
