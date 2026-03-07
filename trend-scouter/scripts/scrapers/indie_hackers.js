const axios = require('axios');

/**
 * Indie Hackers 스크래퍼
 * Algolia API를 직접 호출하여 최신 비즈니스 트렌드 및 토론 데이터를 수집합니다.
 */
async function fetchIndieHackersTrends() {
    const ALGOLIA_APP_ID = 'N86T1R3OWZ';
    const ALGOLIA_API_KEY = '5140dac5e87f47346abbda1a34ee70c3';
    const INDEX_NAME = 'discussions_createdTimestamp_desc';
    const API_URL = `https://${ALGOLIA_APP_ID}-dsn.algolia.net/1/indexes/*/queries`;

    try {
        const response = await axios.post(
            API_URL,
            {
                requests: [
                    {
                        indexName: INDEX_NAME,
                        params: "query=&page=0&hitsPerPage=15"
                    }
                ]
            },
            {
                headers: {
                    'X-Algolia-Application-Id': ALGOLIA_APP_ID,
                    'X-Algolia-API-Key': ALGOLIA_API_KEY
                }
            }
        );

        if (!response.data.results || response.data.results.length === 0) {
            console.warn('⚠️ No results from Indie Hackers Algolia API.');
            return [];
        }

        const hits = response.data.results[0].hits;

        const posts = hits.map(item => ({
            source: 'indie-hackers',
            external_id: item.objectID,
            title: item.title,
            description: item.description || item.text || "상세 내용 없음",
            url: `https://www.indiehackers.com/post/${item.slug || item.objectID}`,
            thumbnail_url: item.image || null,
            upvotes: item.upvoteCount || 0,
            raw_data: item,
            created_at: new Date(item.createdTimestamp).toISOString(),
        }));

        return posts;
    } catch (error) {
        console.error('❌ Error fetching Indie Hackers trends:', error.message);
        return [];
    }
}

module.exports = { fetchIndieHackersTrends };

if (require.main === module) {
    fetchIndieHackersTrends().then(trends => {
        console.log(`✅ Fetched ${trends.length} trends from Indie Hackers.`);
        if (trends.length > 0) {
            console.log('Sample Trend:', JSON.stringify(trends[0], null, 2));
        }
    });
}
