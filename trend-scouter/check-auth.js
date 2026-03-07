const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const PROJECT_REF = 'ouuzerabqqbxxfieuine';
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

async function checkAuthConfig() {
    if (!ACCESS_TOKEN) {
        console.error('❌ Error: SUPABASE_ACCESS_TOKEN is missing in .env.local');
        return;
    }

    console.log(`📡 Fetching Auth Config for project: ${PROJECT_REF}...`);

    try {
        const response = await axios.get(`https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`, {
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        const config = response.data;
        console.log('✅ AUTH_CONFIG_START');
        console.log(JSON.stringify({
            external_google_enabled: config.external_google_enabled,
            external_google_client_id: config.external_google_client_id ? 'EXISTS' : 'MISSING',
            site_url: config.site_url,
            additional_redirect_urls: config.uri_allow_list || config.additional_redirect_urls,
            mailer_otp_exp: config.mailer_otp_exp, // 다른 설정들도 확인해봄
        }, null, 2));
        console.log('✅ AUTH_CONFIG_END');
    } catch (error) {
        if (error.response) {
            console.error(`❌ API Error (${error.response.status}):`, error.response.data);
        } else {
            console.error('❌ Error:', error.message);
        }
    }
}

checkAuthConfig();
