-- Sample data for development
-- Note: In production, users are created via Supabase Auth

-- Insert test user (in local dev, this works; in production, use auth.users)
INSERT INTO users (id, email, name, avatar_url) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'test@example.com', 'Test User', 'https://via.placeholder.com/150');

-- Insert profile
INSERT INTO profiles (user_id, name, headline, narrative, skills, timeline, strengths, voice_samples) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'Test User', 'Software Engineer', 'I am a passionate software engineer with experience in web development.', '["JavaScript", "React", "Node.js"]', '[{"role": "Software Engineer", "company": "Tech Corp", "start_date": "2020-01-01", "end_date": "2023-01-01", "highlights": ["Built web apps", "Led team"]}]', '["Problem solving", "Team collaboration"]', '[{"text": "I am excited to bring my skills to your team."}, {"text": "Thank you for considering my application."}]');

-- Insert industries
INSERT INTO industries (id, user_id, name, emoji, display_order, is_open) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'Tech Companies', '🚀', 1, true),
  ('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'Finance', '💰', 2, false);

-- Insert companies
INSERT INTO companies (id, industry_id, user_id, name, role, location, salary, status, applied_at, jd_text, next_action, next_action_due) VALUES
  ('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'Google', 'Software Engineer', 'Mountain View, CA', '$150k', 'applied', '2023-10-01', 'We are looking for a software engineer...', 'Follow up on application', '2023-10-15'),
  ('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'Microsoft', 'Senior Engineer', 'Seattle, WA', '$180k', 'interviewing', '2023-09-01', 'Senior software engineer position...', 'Prepare for round 2 interview', '2023-10-20'),
  ('550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'Goldman Sachs', 'Quantitative Analyst', 'New York, NY', '$200k', 'draft', null, 'Quantitative analyst role...', null, null);

-- Insert emails
INSERT INTO emails (company_id, user_id, direction, email_type, subject, body, to_address, from_address, authenticity_score, sent_at) VALUES
  ('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', 'sent', 'cover_letter', 'Application for Software Engineer', 'Dear Hiring Manager, I am excited to apply...', 'hr@google.com', 'test@example.com', 85, '2023-10-01'),
  ('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440000', 'received', 'response', 'Interview Invitation', 'We would like to invite you for an interview...', 'test@example.com', 'recruiter@microsoft.com', null, '2023-09-15');

-- Insert notes
INSERT INTO notes (company_id, user_id, content) VALUES
  ('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', 'Spoke with recruiter, they mentioned the team is growing.');

-- Insert contacts
INSERT INTO contacts (company_id, user_id, name, role, email, initials) VALUES
  ('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', 'Jane Doe', 'Recruiter', 'jane@google.com', 'JD');

-- Insert interview prep
INSERT INTO interview_prep (company_id, user_id, questions, talking_points, research_notes) VALUES
  ('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440000', '["Tell me about yourself", "Why Microsoft?"]', '["Led team of 5 developers", "Passionate about cloud computing"]', 'Microsoft Azure is their main cloud platform...');

-- Insert activity log
INSERT INTO activity_log (company_id, user_id, action, metadata) VALUES
  ('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', 'Applied', '{"status": "applied"}'),
  ('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440000', 'Status changed to interviewing', '{"status": "interviewing"}');