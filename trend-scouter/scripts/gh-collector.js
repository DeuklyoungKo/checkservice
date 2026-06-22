/**
 * gh-collector.js
 * GitHub Search API로 니치(수익형 사이드 프로젝트)에서 최근 인기 급상승 레포를 수집한다.
 * "사람들이 지금 만들고 있는 것" = 강력한 사이드 프로젝트/제품 기회 신호.
 *
 * API 문서: https://docs.github.com/rest/search/search#search-repositories
 * - GET /search/repositories?q=<kw> stars:>N created:>DATE&sort=stars
 * - 응답: items[].{ id, name, full_name, description, html_url, stargazers_count, language, topics }
 *
 * 인증: 선택. GITHUB_TOKEN 있으면 사용(레이트리밋 상향), 없으면 비인증(검색 10req/분).
 * Stats-Only: repo 메타데이터(설명·스타·언어 = 사실 데이터)만. 원문 링크아웃 유지.
 */

const axios = require('axios');

const GH_SEARCH = 'https://api.github.com/search/repositories';

// 서비스 니치 검색어. created 한정으로 "최근 만들어진" 레포만 → 트렌드성 확보.
const GH_QUERIES = ['saas', 'ai agent', 'automation tool', 'no-code', 'indie hacker', 'side project'];

/**
 * 최근 인기 레포를 정규화된 item 배열로 반환한다.
 * @param {Object} opts - { minStars, perQuery, monthsBack }
 * @returns {Promise<Array>} rss-parser 호환 item ( _stats 포함 )
 */
async function fetchGithubItems({ minStars = 100, perQuery = 15, monthsBack = 6 } = {}) {
    const since = new Date(Date.now() - monthsBack * 30 * 24 * 3600 * 1000).toISOString().split('T')[0];
    const token = process.env.GITHUB_TOKEN;
    const headers = {
        'User-Agent': 'TrendScouterBot/1.0 (+https://trend.gonsuit.com; trend@gonsuit.com)',
        'Accept': 'application/vnd.github+json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const seen = new Set();
    const items = [];

    for (const kw of GH_QUERIES) {
        try {
            const res = await axios.get(GH_SEARCH, {
                params: {
                    q: `${kw} stars:>${minStars} created:>${since}`,
                    sort: 'stars',
                    order: 'desc',
                    per_page: perQuery,
                },
                timeout: 10000,
                headers,
            });

            for (const repo of res.data?.items || []) {
                if (seen.has(repo.id)) continue;
                seen.add(repo.id);
                const desc = (repo.description || '').trim();
                items.push({
                    title: desc ? `${repo.name}: ${desc}`.substring(0, 200) : repo.full_name,
                    content: [desc, (repo.topics || []).join(', ')].filter(Boolean).join(' | '),
                    link: repo.html_url,
                    guid: `gh-${repo.id}`,
                    _stats: { stars: repo.stargazers_count ?? 0, language: repo.language || null },
                });
            }

            // 비인증 검색 레이트리밋(10req/분) 보호
            await new Promise(r => setTimeout(r, token ? 400 : 1200));
        } catch (err) {
            console.warn(`⚠️  GitHub query "${kw}" failed: ${err.response?.status || ''} ${err.message}`);
        }
    }

    return items;
}

module.exports = { fetchGithubItems, GH_QUERIES };

// 독립 실행 검증: node scripts/gh-collector.js
if (require.main === module) {
    fetchGithubItems().then(items => {
        console.log(`✅ GitHub fetched: ${items.length} items`);
        items.slice(0, 5).forEach(i => console.log(`  - [${i._stats.stars}★/${i._stats.language}] ${i.title.substring(0, 60)}`));
        process.exit(0);
    }).catch(e => { console.error('🔥', e.message); process.exit(1); });
}
