const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function runMigration() {
    const dbPassword = process.env.SUPABASE_DB_PASSWORD;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!dbPassword || !supabaseUrl) {
        console.error('❌ Missing SUPABASE_DB_PASSWORD or NEXT_PUBLIC_SUPABASE_URL in env');
        process.exit(1);
    }

    const host = '2406:da1c:f42:ae03:4456:2f65:3845:7cbe';
    const user = 'postgres';

    console.log(`📡 Connecting to Supabase PG directly via IPv6 address...`);
    console.log(`Host: ${host}`);
    console.log(`User: ${user}`);
    console.log(`Database: postgres`);

    const client = new Client({
        host: host,
        port: 5432,
        user: user,
        password: dbPassword,
        database: 'postgres',
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        console.log('✅ Connected successfully!');

        console.log('🚧 Altering analysis table to add ai_brief column...');
        await client.query(`
            ALTER TABLE public.analysis 
            ADD COLUMN IF NOT EXISTS ai_brief TEXT;
        `);
        console.log('✅ Column [ai_brief] added (or already existed) successfully!');

    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        process.exit(1);
    } finally {
        await client.end();
        console.log('🔌 Disconnected.');
    }
}

runMigration();
