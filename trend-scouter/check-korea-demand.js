const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkKoreaDemandInDB() {
    console.log('📡 Supabase DB에서 korea_demand 수집 데이터 상태를 확인합니다...\n');

    try {
        // 1. 전체 trends 개수 및 korea_demand가 있는 트렌드 개수 확인
        const { data: allTrends, error: allErr } = await supabase
            .from('trends')
            .select('stats_data');

        if (allErr) throw allErr;

        let totalCount = allTrends.length;
        let withDemandCount = 0;
        let sampleData = [];

        allTrends.forEach(t => {
            if (t.stats_data && t.stats_data.korea_demand) {
                withDemandCount++;
                if (sampleData.length < 5) {
                    sampleData.push(t.stats_data);
                }
            }
        });

        console.log(`📊 DB 분석 결과:`);
        console.log(`- 전체 수집된 트렌드: ${totalCount}개`);
        console.log(`- 한국 검색 수요(korea_demand)가 수집된 트렌드: ${withDemandCount}개`);

        if (withDemandCount > 0) {
            console.log('\n🔍 korea_demand 저장 샘플 데이터 (최대 5개):');
            sampleData.forEach((data, index) => {
                console.log(`\n[샘플 ${index + 1}] 제목: ${data.original_title || '제목 없음'}`);
                console.log(`- 매칭 그룹: ${data.korea_demand.group}`);
                console.log(`- 최신 검색 지수 (ratio): ${data.korea_demand.ratio}/100`);
                console.log(`- 성장률 (growth): ${data.korea_demand.growth}%`);
                console.log(`- 조회 기간 (period): ${data.korea_demand.period}`);
            });
        } else {
            console.log('\n⚠️ 현재 DB에 korea_demand 정보가 포함된 트렌드가 존재하지 않습니다.');
            console.log('💡 아직 Naver DataLab API를 활성화한 상태에서 수집기(collector)가 새로 실행되지 않았거나, 매칭 조건에 해당하는 키워드가 없었을 수 있습니다.');
        }

    } catch (error) {
        console.error('❌ DB 조회 실패:', error.message);
    }
}

checkKoreaDemandInDB();
