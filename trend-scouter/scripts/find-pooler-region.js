const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const regions = [
    'ap-northeast-2',
    'ap-northeast-1',
    'ap-southeast-1',
    'us-east-1',
    'us-west-2',
    'eu-central-1',
    'eu-west-1'
];

async function findRegion() {
    const dbPassword = process.env.SUPABASE_DB_PASSWORD;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const projectRef = supabaseUrl.replace('https://', '').split('.')[0];
    const user = `postgres.${projectRef}`;

    console.log(`🔍 Testing regions for project: ${projectRef}...`);

    for (const region of regions) {
        const host = `aws-0-${region}.pooler.supabase.com`;
        console.log(`⚡ Testing ${region} (${host})...`);

        const client = new Client({
            host: host,
            port: 6543,
            user: user,
            password: dbPassword,
            database: 'postgres',
            ssl: { rejectUnauthorized: false },
            connectionTimeoutMillis: 5000 // 5 seconds timeout
        });

        try {
            await client.connect();
            console.log(`🎉 SUCCESS! Connected to ${region} pooler!`);
            await client.end();
            process.exit(0);
        } catch (err) {
            console.log(`❌ Failed for ${region}: ${err.message}`);
        }
    }

    console.log('😢 All regions failed.');
}

findRegion();
