-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create status enum
CREATE TYPE job_status AS ENUM ('draft', 'applied', 'interviewing', 'offer', 'rejected');

-- Create email_direction enum
CREATE TYPE email_direction AS ENUM ('sent', 'received');

-- Create email_type enum
CREATE TYPE email_type AS ENUM ('cover_letter', 'follow_up', 'thank_you', 'response', 'other');

-- users table (Supabase Auth managed, but we'll create it for schema completeness)
-- Note: In production, this is auth.users, but for local dev we create it
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT,
  headline TEXT,
  narrative TEXT,
  skills JSONB DEFAULT '[]'::jsonb,
  timeline JSONB DEFAULT '[]'::jsonb,
  strengths JSONB DEFAULT '[]'::jsonb,
  resume_url TEXT,
  resume_parsed_at TIMESTAMP WITH TIME ZONE,
  voice_samples JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- industries table
CREATE TABLE industries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_open BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- companies table
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  industry_id UUID NOT NULL REFERENCES industries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT,
  location TEXT,
  salary TEXT,
  logo_url TEXT,
  status job_status NOT NULL DEFAULT 'draft',
  applied_at TIMESTAMP WITH TIME ZONE,
  status_changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  jd_text TEXT,
  jd_url TEXT,
  interview_round INTEGER,
  next_action TEXT,
  next_action_due TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- emails table
CREATE TABLE emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  direction email_direction NOT NULL,
  email_type email_type,
  subject TEXT,
  body TEXT,
  tone TEXT,
  to_address TEXT,
  from_address TEXT,
  authenticity_score INTEGER CHECK (authenticity_score >= 0 AND authenticity_score <= 100),
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- notes table
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- contacts table
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT,
  email TEXT,
  phone TEXT,
  initials TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- interview_prep table
CREATE TABLE interview_prep (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  questions JSONB DEFAULT '[]'::jsonb,
  talking_points JSONB DEFAULT '[]'::jsonb,
  research_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- activity_log table
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_industries_user_id ON industries(user_id);
CREATE INDEX idx_industries_display_order ON industries(user_id, display_order);
CREATE INDEX idx_companies_industry_id ON companies(industry_id);
CREATE INDEX idx_companies_user_id ON companies(user_id);
CREATE INDEX idx_companies_status ON companies(user_id, status);
CREATE INDEX idx_emails_company_id ON emails(company_id);
CREATE INDEX idx_notes_company_id ON notes(company_id);
CREATE INDEX idx_contacts_company_id ON contacts(company_id);
CREATE INDEX idx_interview_prep_company_id ON interview_prep(company_id);
CREATE INDEX idx_activity_log_company_id ON activity_log(company_id);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own profiles" ON profiles
  FOR ALL USING (auth.uid() = user_id);

ALTER TABLE industries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own industries" ON industries
  FOR ALL USING (auth.uid() = user_id);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own companies" ON companies
  FOR ALL USING (auth.uid() = user_id);

ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own emails" ON emails
  FOR ALL USING (auth.uid() = user_id);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own notes" ON notes
  FOR ALL USING (auth.uid() = user_id);

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own contacts" ON contacts
  FOR ALL USING (auth.uid() = user_id);

ALTER TABLE interview_prep ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own interview prep" ON interview_prep
  FOR ALL USING (auth.uid() = user_id);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own activity log" ON activity_log
  FOR ALL USING (auth.uid() = user_id);