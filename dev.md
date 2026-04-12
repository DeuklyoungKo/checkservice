## next.js 실행
    cd trend-scouter
    npm run dev

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

