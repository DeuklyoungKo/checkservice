## next.js 실행
    cd trend-scouter
    npm run dev
    ngrok http 3000
    // 외부 접속용 사이트
    https://nanometer-monoxide-bucked.ngrok-free.dev
    // polar 관리자
    https://sandbox.polar.sh/dashboard/gonsuit

    //test card
    #카드번호: 4242 4242 4242 4242
    #만료일: 미래 날짜 아무거나 (예: 12/30)
    #CVC: 아무 3자리 (예: 123)
    #이름: 아무 값

## 수집실행
    cd trend-scouter
    node scripts/rss-collector.js



# 기타
## 유료회원 등록 방법
    -- 1. 기존 프로필이 있다면 프리미엄으로 업데이트
    UPDATE public.user_profiles
    SET is_premium = true, subscription_status = 'active'
    WHERE email = 'lunaman1@naver.com';

    -- 2. 만약 프로필이 아직 생성되지 않았다면, auth.users에서 정보를 가져와 생성
    INSERT INTO public.user_profiles (id, email, is_premium, subscription_status)
    SELECT id, email, true, 'active'
    FROM auth.users
    WHERE email = 'lunaman1@naver.com'
    ON CONFLICT (id) DO UPDATE 
    SET is_premium = true, subscription_status = 'active';

