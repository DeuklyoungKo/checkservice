-- Trend Intelligence Database Schema

-- 1. Trends Table: Stores aggregated statistics and impact metrics (Strict Stats-Only)
CREATE TABLE public.trends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source TEXT NOT NULL, -- 'product-hunt', 'reddit', 'indie-hackers', 'hacker-news', etc.
    external_id TEXT NOT NULL, -- Original ID/Link Hash
    impact_score INTEGER DEFAULT 0, -- Calculated index based on engagement/keywords
    stats_data JSONB, -- Aggregated metrics like keyword frequencies, upvotes, etc.
    url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(source, external_id)
);

-- 2. Analysis Table: Stores AI-generated analysis and business headers
CREATE TABLE public.analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trend_id UUID REFERENCES public.trends(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    is_unlocked BOOLEAN DEFAULT FALSE,
    headline TEXT, -- AI-generated business-focused title (Replacing original title)
    -- PUFE Framework (Each 0-25, Total 100)
    pufe_p INTEGER CHECK (pufe_p BETWEEN 0 AND 25), -- Pain
    pufe_u INTEGER CHECK (pufe_u BETWEEN 0 AND 25), -- Urgency
    pufe_f INTEGER CHECK (pufe_f BETWEEN 0 AND 25), -- Frequency
    pufe_e INTEGER CHECK (pufe_e BETWEEN 0 AND 25), -- Existing Solution
    pufe_total INTEGER CHECK (pufe_total BETWEEN 0 AND 100),
    
    pain_category TEXT, -- 'Functional', 'Financial', 'Emotional'
    summary TEXT,
    business_model TEXT,
    gtm_strategy TEXT, -- Go-to-Market strategy
    tech_stack_suggestion TEXT,
    korea_localization_tips TEXT,
    solution_wizard JSONB, -- AI-generated solution steps/checklists
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

-- 5. Newsletter Subscribers Table
CREATE TABLE public.newsletter_subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS (Row Level Security) - Basic Setup
ALTER TABLE public.trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public read trends" ON public.trends FOR SELECT USING (true);
CREATE POLICY "Public read analysis" ON public.analysis FOR SELECT USING (true);
CREATE POLICY "Users can view own profile" ON public.user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Public can subscribe to newsletter" ON public.newsletter_subscribers FOR INSERT WITH CHECK (true);

-- 6. Payment Requests Table (Manual Confirmation)
CREATE TABLE public.payment_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    contact_info TEXT NOT NULL,
    amount INTEGER NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can create payment requests" ON public.payment_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own payment requests" ON public.payment_requests FOR SELECT USING (auth.uid() = user_id);

-- 7. Contacts / Inquiries Table
CREATE TABLE public.contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    category TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous inserts" ON public.contacts FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow authenticated read access" ON public.contacts FOR SELECT TO authenticated USING (true);
