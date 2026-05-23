const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });
const { getFullKoreanTrendSnapshot, getKoreanDemandSignal } = require('./scripts/naver-datalab');

async function testDataLab() {
    const clientId = process.env.NAVER_CLIENT_ID;
    const clientSecret = process.env.NAVER_CLIENT_SECRET;

    console.log('🔑 NAVER_CLIENT_ID:', clientId ? `Loaded (${clientId.substring(0, 4)}...)` : '❌ NOT FOUND');
    console.log('🔑 NAVER_CLIENT_SECRET:', clientSecret ? `Loaded` : '❌ NOT FOUND');

    if (!clientId || !clientSecret) {
        console.error('❌ 네이버 API 키가 .env.local에 설정되어 있지 않습니다.');
        return;
    }

    console.log('\n1. 📊 전체 한국 검색 트렌드 스냅샷 조회 테스트...');
    try {
        const snapshot = await getFullKoreanTrendSnapshot(clientId, clientSecret);
        if (snapshot && Object.keys(snapshot).length > 0) {
            console.log('✅ 스냅샷 조회 성공!');
            console.log('결과 스냅샷:', JSON.stringify(snapshot, null, 2));
        } else {
            console.warn('⚠️ 스냅샷 결과가 비어있거나 실패했습니다.');
        }
    } catch (e) {
        console.error('❌ 스냅샷 조회 중 예외 발생:', e.message);
    }

    console.log('\n2. 🔍 개별 키워드 수요 신호 추출 테스트 ("AI Coding tool for side projects")...');
    try {
        const signal = await getKoreanDemandSignal("AI Coding tool for side projects", clientId, clientSecret);
        if (signal) {
            console.log('✅ 개별 키워드 수요 추출 성공!');
            console.log('추출된 신호:', JSON.stringify(signal, null, 2));
        } else {
            console.warn('⚠️ 개별 키워드에 대한 수요 신호가 없습니다.');
        }
    } catch (e) {
        console.error('❌ 개별 키워드 조회 중 예외 발생:', e.message);
    }
}

testDataLab().catch(console.error);
