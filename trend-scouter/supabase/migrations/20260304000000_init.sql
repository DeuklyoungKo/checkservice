-- Trend Scouter Database Schema

-- 1. Trends Table: Stores raw and basic info of gathered trends
CREATE TABLE public.trends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source TEXT NOT NULL, -- 'product-hunt', 'reddit', 'indie-hackers'
    external_id TEXT NOT NULL, -- Original ID from the source
    title TEXT NOT NULL,
    description TEXT,
    url TEXT,
    thumbnail_url TEXT,
    upvotes INTEGER DEFAULT 0,
    raw_data JSONB, -- Store full response for backup
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(source, external_id)
);

-- 2. Analysis Table: Stores AI-generated analysis for each trend
CREATE TABLE public.analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trend_id UUID REFERENCES public.trends(id) ON DELETE CASCADE,
    score_revenue INTEGER CHECK (score_revenue BETWEEN 0 AND 100),
    score_difficulty INTEGER CHECK (score_difficulty BETWEEN 0 AND 100),
    score_korea_potential INTEGER CHECK (score_korea_potential BETWEEN 0 AND 100),
    summary TEXT,
    business_model TEXT,
    gtm_strategy TEXT, -- Go-to-Market strategy
    tech_stack_suggestion TEXT,
    korea_localization_tips TEXT,
    ai_model TEXT, -- Which model performed the analysis
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Users Table (Extended from auth.users)
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    is_premium BOOLEAN DEFAULT FALSE,
    subscription_status TEXT, -- 'active', 'canceled', 'none'
    stripe_customer_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Subscriptions/Payments Table
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    stripe_payment_id TEXT UNIQUE,
    amount INTEGER NOT NULL,
    currency TEXT DEFAULT 'usd',
    status TEXT, -- 'succeeded', 'pending', 'failed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS (Row Level Security) - Basic Setup
ALTER TABLE public.trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public read trends" ON public.trends FOR SELECT USING (true);
CREATE POLICY "Public read analysis" ON public.analysis FOR SELECT USING (true);
CREATE POLICY "Users can view own profile" ON public.user_profiles FOR SELECT USING (auth.uid() = id);
