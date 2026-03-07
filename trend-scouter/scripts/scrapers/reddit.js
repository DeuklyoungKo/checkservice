const Parser = require('rss-parser');
const parser = new Parser({
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml;q=0.9, */*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
    }
});

async function fetchRedditTrends() {
    try {
        const feed = await parser.parseURL('https://www.reddit.com/r/sideproject/.rss');
        const posts = feed.items.map(item => ({
            source: 'reddit',
            external_id: item.id,
            title: item.title,
            description: item.contentSnippet || item.content,
            url: item.link,
            thumbnail_url: null,
            upvotes: 0, // RSS doesn't give upvotes easily
            raw_data: item,
            created_at: item.pubDate,
        }));

        return posts;
    } catch (error) {
        console.error('❌ Error fetching Reddit trends:', error.message);
        return [];
    }
}

module.exports = { fetchRedditTrends };

if (require.main === module) {
    fetchRedditTrends().then(trends => {
        console.log(`✅ Fetched ${trends.length} trends from Reddit (r/sideproject).`);
        console.log(JSON.stringify(trends, null, 2));
    });
}
