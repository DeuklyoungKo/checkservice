const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });

const PH_API_URL = 'https://api.producthunt.com/v2/api/graphql';
const PH_API_KEY = process.env.PH_API_KEY;

if (!PH_API_KEY) {
  console.warn('⚠️  PH_API_KEY is not set in .env.local. Skipping Product Hunt scraper.');
}

const query = `
{
  posts(first: 10, order: VOTES) {
    edges {
      node {
        id
        name
        tagline
        description
        url
        votesCount
        thumbnail {
          url
        }
        createdAt
      }
    }
  }
}
`;

async function fetchProductHuntTrends() {
  if (!PH_API_KEY) return [];
  try {
    const response = await axios.post(
      PH_API_URL,
      { query },
      {
        headers: {
          Authorization: `Bearer ${PH_API_KEY}`,
        },
      }
    );

    const posts = response.data.data.posts.edges.map(edge => ({
      source: 'product-hunt',
      external_id: edge.node.id,
      title: edge.node.name,
      description: edge.node.tagline + ' - ' + edge.node.description,
      url: edge.node.url,
      thumbnail_url: edge.node.thumbnail?.url,
      upvotes: edge.node.votesCount,
      raw_data: edge.node,
      created_at: edge.node.createdAt,
    }));

    return posts;
  } catch (error) {
    console.error('❌ Error fetching Product Hunt trends:', error.message);
    return [];
  }
}

module.exports = { fetchProductHuntTrends };

if (require.main === module) {
  fetchProductHuntTrends().then(trends => {
    console.log(`✅ Fetched ${trends.length} trends from Product Hunt.`);
    console.log(JSON.stringify(trends, null, 2));
  });
}
