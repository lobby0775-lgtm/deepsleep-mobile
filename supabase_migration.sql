-- Supabase Migration for DeepSleep Mobile App
-- Run this SQL in your Supabase SQL Editor

-- Enable Row Level Security
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sleep_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.onboarding_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sleep_windows ENABLE ROW LEVEL SECURITY;

-- 1. Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies for profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- 2. Sleep Entries table
CREATE TABLE IF NOT EXISTS public.sleep_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    sleep_quality INTEGER CHECK (sleep_quality >= 1 AND sleep_quality <= 10),
    sleep_duration DECIMAL(3,1) CHECK (sleep_duration >= 0 AND sleep_duration <= 24),
    wake_up_refreshed BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies for sleep_entries
DROP POLICY IF EXISTS "Users can view own sleep entries" ON public.sleep_entries;
CREATE POLICY "Users can view own sleep entries" ON public.sleep_entries
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own sleep entries" ON public.sleep_entries;
CREATE POLICY "Users can insert own sleep entries" ON public.sleep_entries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own sleep entries" ON public.sleep_entries;
CREATE POLICY "Users can update own sleep entries" ON public.sleep_entries
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own sleep entries" ON public.sleep_entries;
CREATE POLICY "Users can delete own sleep entries" ON public.sleep_entries
    FOR DELETE USING (auth.uid() = user_id);

-- 3. Assessments table
CREATE TABLE IF NOT EXISTS public.assessments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    assessment_type TEXT NOT NULL,
    total_score INTEGER,
    responses JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies for assessments
DROP POLICY IF EXISTS "Users can view own assessments" ON public.assessments;
CREATE POLICY "Users can view own assessments" ON public.assessments
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own assessments" ON public.assessments;
CREATE POLICY "Users can insert own assessments" ON public.assessments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Onboarding Data table
CREATE TABLE IF NOT EXISTS public.onboarding_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    country_code TEXT,
    isi_scores INTEGER[],
    phq9_scores INTEGER[],
    gad7_scores INTEGER[],
    medications JSONB,
    caffeine_time TEXT,
    alcohol_frequency TEXT,
    insomnia_duration TEXT,
    shift_worker BOOLEAN DEFAULT false,
    prior_treatments TEXT[],
    medical_conditions TEXT[],
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies for onboarding_data
DROP POLICY IF EXISTS "Users can view own onboarding data" ON public.onboarding_data;
CREATE POLICY "Users can view own onboarding data" ON public.onboarding_data
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own onboarding data" ON public.onboarding_data;
CREATE POLICY "Users can insert own onboarding data" ON public.onboarding_data
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. Sleep Windows table
CREATE TABLE IF NOT EXISTS public.sleep_windows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    effective_date DATE NOT NULL,
    bedtime TIME,
    rise_time TIME,
    prescribed_tst_minutes INTEGER,
    source TEXT,
    clinician_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, effective_date)
);

-- RLS Policies for sleep_windows
DROP POLICY IF EXISTS "Users can view own sleep windows" ON public.sleep_windows;
CREATE POLICY "Users can view own sleep windows" ON public.sleep_windows
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own sleep windows" ON public.sleep_windows;
CREATE POLICY "Users can insert own sleep windows" ON public.sleep_windows
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own sleep windows" ON public.sleep_windows;
CREATE POLICY "Users can update own sleep windows" ON public.sleep_windows
    FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sleep_entries_user_id ON public.sleep_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_sleep_entries_created_at ON public.sleep_entries(created_at);
CREATE INDEX IF NOT EXISTS idx_assessments_user_id ON public.assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_data_user_id ON public.onboarding_data(user_id);
CREATE INDEX IF NOT EXISTS idx_sleep_windows_user_id ON public.sleep_windows(user_id);
CREATE INDEX IF NOT EXISTS idx_sleep_windows_effective_date ON public.sleep_windows(effective_date);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sleep_entries_updated_at ON public.sleep_entries;
CREATE TRIGGER update_sleep_entries_updated_at
    BEFORE UPDATE ON public.sleep_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime for tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.sleep_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.assessments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sleep_windows;