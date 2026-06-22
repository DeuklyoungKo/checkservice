/**
 * hn-collector.js
 * Hacker News 공식 검색 API(Algolia HN Search)를 통해 SaaS/AI/사이드프로젝트 관련
 * 인기 스토리를 수집한다. 기존 hnrss(비공식 RSS)를 공식 API로 승격.
 *
 * API 문서: https://hn.algolia.com/api  (HN 공식 인프라, 인증 불필요, 검색 지원)
 * - GET https://hn.algolia.com/api/v1/search?query=&tags=story  (인기순 정렬)
 * - 응답: hits[].{ objectID, title, url, points, num_comments, story_text, created_at }
 * - NOTE: points/num_comments는 numericFilters 미지원 → 응답에서 클라이언트 필터링
 *
 * Stats-Only 원칙: 본문(story_text)은 AI 분석에만 전달하고 DB엔 저장하지 않는다.
 * points/num_comments 같은 참여 수치(engagement)만 stats_data에 남긴다.
 */

const axios = require('axios');

const ALGOLIA_SEARCH = 'https://hn.algolia.com/api/v1/search';

// 서비스 니치(수익형 사이드 프로젝트)에 맞춘 검색어. 쿼리 기반이라 관련성이 보장됨.
// 품질 역전(권장 2): 쿼리·수집량 확대로 HN을 카탈로그 백본화.
const HN_QUERIES = [
    'SaaS', 'micro saas', 'AI tool', 'AI agent', 'automation', 'no-code',
    'indie hacker', 'side project', 'developer tool', 'chrome extension', 'API',
];

/**
 * HN 인기 스토리를 정규화된 item 배열로 반환한다.
 * 반환 item 형태는 rss-parser item과 호환: { title, content, link, guid, _stats }
 * @param {Object} opts - { minPoints, perQuery }
 * @returns {Promise<Array>}
 */
async function fetchHackerNewsItems({ minPoints = 20, perQuery = 50 } = {}) {
    const seen = new Set();
    const items = [];

    for (const query of HN_QUERIES) {
        try {
            const res = await axios.get(ALGOLIA_SEARCH, {
                params: {
                    query,
                    tags: 'story',
                    hitsPerPage: perQuery,
                },
                timeout: 10000,
                headers: { 'User-Agent': 'TrendScouterBot/1.0 (+https://trend.gonsuit.com; trend@gonsuit.com)' },
            });

            for (const hit of res.data?.hits || []) {
                if (!hit.title || seen.has(hit.objectID)) continue;
                if ((hit.points ?? 0) < minPoints) continue;   // points 클라이언트 필터
                seen.add(hit.objectID);
                items.push({
                    title: hit.title,
                    content: hit.story_text || '',                 // AI 분석용 (DB 미저장)
                    link: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
                    guid: `hn-${hit.objectID}`,
                    _stats: { points: hit.points ?? 0, comments: hit.num_comments ?? 0 },
                });
            }

            // Algolia rate-limit 보호 (쿼리 간 300ms)
            await new Promise(r => setTimeout(r, 300));
        } catch (err) {
            console.warn(`⚠️  HN Algolia query "${query}" failed: ${err.message}`);
        }
    }

    return items;
}

module.exports = { fetchHackerNewsItems, HN_QUERIES };

// 독립 실행 시 DB 없이 수집 결과만 출력 (검증용): node scripts/hn-collector.js
if (require.main === module) {
    fetchHackerNewsItems().then(items => {
        console.log(`✅ HN fetched: ${items.length} items`);
        items.slice(0, 5).forEach(i => console.log(`  - [${i._stats.points}pts/${i._stats.comments}c] ${i.title.substring(0, 60)}`));
        process.exit(0);
    }).catch(e => { console.error('🔥', e.message); process.exit(1); });
}
