-- 사용자별 단건 잠금 해제 테이블
-- 결함 수정: 기존 analysis.is_unlocked는 전역 플래그라 한 명이 결제하면
-- 해당 리포트가 전 세계에 영구 무료가 됨(무임승차). 결제 유저에게만 권한을 부여하기 위해
-- (user_id, trend_id) 단위의 unlock 행을 사용한다.

CREATE TABLE IF NOT EXISTS public.unlocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    trend_id UUID NOT NULL REFERENCES public.trends(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, trend_id)
);

ALTER TABLE public.unlocks ENABLE ROW LEVEL SECURITY;

-- 본인 unlock 행만 조회 가능. INSERT는 서비스 롤(웹훅 admin 클라이언트)만 수행하므로
-- 사용자용 INSERT 정책은 두지 않는다(자가 잠금 해제 방지).
CREATE POLICY "Users can view own unlocks" ON public.unlocks
    FOR SELECT USING (auth.uid() = user_id);
