const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const PH_API_KEY = process.env.PH_API_KEY;

async function testPH() {
    console.log('🧪 Testing Product Hunt API...');

    if (!PH_API_KEY) {
        console.error('❌ PH_API_KEY is missing in .env.local');
        return;
    }

    console.log(`ℹ️ Token length: ${PH_API_KEY.length}`);
    console.log(`ℹ️ Token starts with: ${PH_API_KEY.substring(0, 4)}... ends with: ...${PH_API_KEY.substring(PH_API_KEY.length - 4)}`);

    const query = `
    {
      posts(first: 5) {
        edges {
          node {
            id
            name
            tagline
            votesCount
          }
        }
      }
    }
    `;

    try {
        const response = await fetch('https://api.producthunt.com/v2/api/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${PH_API_KEY}`
            },
            body: JSON.stringify({ query })
        });

        const data = await response.json();

        if (data.errors) {
            console.error('❌ API Error:', data.errors);
        } else {
            console.log('✅ Success! Latest products from Product Hunt:');
            data.data.posts.edges.forEach(({ node }) => {
                console.log(`- [${node.votesCount}🔺] ${node.name}: ${node.tagline}`);
            });
        }
    } catch (error) {
        console.error('❌ Network Error:', error.message);
    }
}

testPH();
