const Parser = require('rss-parser');
const parser = new Parser();

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
