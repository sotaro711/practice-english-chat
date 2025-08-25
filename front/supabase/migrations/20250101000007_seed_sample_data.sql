-- Seed sample data for development environment
-- This migration adds sample data for testing and development purposes
-- Do NOT run this in production environment

-- Note: Since profiles are automatically created via trigger when auth.users are created,
-- we cannot directly insert into profiles table without corresponding auth.users records.
-- The following data assumes that test users have been created through the auth system.

-- Sample conversations data
-- These conversations will be associated with test users created through Supabase Auth
INSERT INTO conversations (id, user_id, title, created_at, updated_at) VALUES
-- Note: Replace these UUIDs with actual user_ids from your auth.users table
-- For now, using placeholder UUIDs that should be updated when real users exist
('550e8400-e29b-41d4-a716-446655440001', 'auth-user-id-placeholder-1', '英語学習：日常会話', '2024-01-01 10:00:00+00', '2024-01-01 10:30:00+00'),
('550e8400-e29b-41d4-a716-446655440002', 'auth-user-id-placeholder-1', 'ビジネス英語：プレゼンテーション', '2024-01-02 14:00:00+00', '2024-01-02 14:45:00+00'),
('550e8400-e29b-41d4-a716-446655440003', 'auth-user-id-placeholder-2', '旅行英語：ホテル予約', '2024-01-03 09:00:00+00', '2024-01-03 09:25:00+00'),
('550e8400-e29b-41d4-a716-446655440004', 'auth-user-id-placeholder-2', '文法練習：時制について', '2024-01-04 16:00:00+00', '2024-01-04 16:20:00+00');

-- Sample messages data
INSERT INTO messages (id, conversation_id, role, content, created_at) VALUES
-- Conversation 1: 日常会話
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'user', 'Hello! I want to practice daily conversation in English.', '2024-01-01 10:00:00+00'),
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'assistant', 'Hello! I''d be happy to help you practice daily conversation. Let''s start with a common scenario. Imagine you''re at a coffee shop. What would you like to order?', '2024-01-01 10:01:00+00'),
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'user', 'I would like a medium latte with oat milk, please.', '2024-01-01 10:02:00+00'),
('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', 'assistant', 'Perfect! That''s a great order. The barista might ask: "Would you like that for here or to go?" How would you respond if you want to drink it in the cafe?', '2024-01-01 10:03:00+00'),
('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440001', 'user', 'For here, please.', '2024-01-01 10:04:00+00'),
('660e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440001', 'assistant', 'Excellent! You''re doing great. Your pronunciation and grammar are very natural. Let''s try another scenario. How would you ask about the weather in a casual conversation?', '2024-01-01 10:05:00+00'),

-- Conversation 2: ビジネス英語
('660e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440002', 'user', 'I need to practice giving presentations in English. Can you help me?', '2024-01-02 14:00:00+00'),
('660e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440002', 'assistant', 'Absolutely! Let''s work on presentation skills. First, let''s practice opening statements. Try introducing yourself and your presentation topic as if you''re presenting to a business audience.', '2024-01-02 14:01:00+00'),
('660e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440002', 'user', 'Good morning everyone. My name is John and today I will be presenting our quarterly sales results.', '2024-01-02 14:02:00+00'),
('660e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440002', 'assistant', 'Great start! Your introduction is clear and professional. To make it even more engaging, you could add: "Good morning everyone. My name is John, and I''m excited to share our quarterly sales results with you today." The word "excited" adds enthusiasm. Now, how would you transition to your first main point?', '2024-01-02 14:03:00+00'),

-- Conversation 3: 旅行英語
('660e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440003', 'user', 'I''m planning a trip to New York. Can you help me practice hotel booking conversations?', '2024-01-03 09:00:00+00'),
('660e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440003', 'assistant', 'Of course! Let''s practice hotel booking. I''ll be the hotel receptionist. Try calling to make a reservation for your New York trip. Start with a greeting and state your purpose.', '2024-01-03 09:01:00+00'),
('660e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440003', 'user', 'Hello, I would like to make a reservation for two nights in March.', '2024-01-03 09:02:00+00'),
('660e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440003', 'assistant', 'Hello! I''d be happy to help you with a reservation. For which dates in March would you like to stay, and how many guests will be in the room?', '2024-01-03 09:03:00+00'),

-- Conversation 4: 文法練習
('660e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440004', 'user', 'I''m confused about English tenses. Can you help me understand when to use past perfect?', '2024-01-04 16:00:00+00'),
('660e8400-e29b-41d4-a716-446655440016', '550e8400-e29b-41d4-a716-446655440004', 'assistant', 'I''d be happy to help with past perfect! We use past perfect (had + past participle) to show that one action happened before another action in the past. For example: "I had finished my homework before I went to bed." Can you try making a sentence using past perfect?', '2024-01-04 16:01:00+00'),
('660e8400-e29b-41d4-a716-446655440017', '550e8400-e29b-41d4-a716-446655440004', 'user', 'She had eaten dinner when I arrived.', '2024-01-04 16:02:00+00'),
('660e8400-e29b-41d4-a716-446655440018', '550e8400-e29b-41d4-a716-446655440004', 'assistant', 'Perfect! That''s exactly right. "She had eaten dinner" happened first, and "I arrived" happened second. Both are in the past, but the eating happened earlier. Let''s try another one. How would you say that you had studied English before you moved to America?', '2024-01-04 16:03:00+00');

-- Sample bookmarks data
-- These represent messages that users have bookmarked for later review
INSERT INTO bookmarks (id, user_id, message_id, created_at) VALUES
('770e8400-e29b-41d4-a716-446655440001', 'auth-user-id-placeholder-1', '660e8400-e29b-41d4-a716-446655440004', '2024-01-01 10:10:00+00'),
('770e8400-e29b-41d4-a716-446655440002', 'auth-user-id-placeholder-1', '660e8400-e29b-41d4-a716-446655440010', '2024-01-02 14:10:00+00'),
('770e8400-e29b-41d4-a716-446655440003', 'auth-user-id-placeholder-2', '660e8400-e29b-41d4-a716-446655440014', '2024-01-03 09:10:00+00'),
('770e8400-e29b-41d4-a716-446655440004', 'auth-user-id-placeholder-2', '660e8400-e29b-41d4-a716-446655440016', '2024-01-04 16:10:00+00');

-- Update sample profile learning preferences
-- This assumes profiles have been created via the auth trigger
UPDATE profiles 
SET learning_preferences = '{
  "level": "intermediate",
  "interests": ["business", "travel", "daily_conversation"],
  "goals": ["improve_speaking", "expand_vocabulary"],
  "preferred_topics": ["technology", "culture", "food"]
}'::jsonb,
display_name = 'サンプルユーザー1',
username = 'sample_user_1'
WHERE user_id = 'auth-user-id-placeholder-1';

UPDATE profiles 
SET learning_preferences = '{
  "level": "beginner",
  "interests": ["grammar", "basic_conversation"],
  "goals": ["learn_basics", "improve_pronunciation"],
  "preferred_topics": ["everyday_life", "hobbies", "family"]
}'::jsonb,
display_name = 'サンプルユーザー2',
username = 'sample_user_2'
WHERE user_id = 'auth-user-id-placeholder-2';

-- Add comments for data explanation
COMMENT ON TABLE conversations IS 'サンプル会話データ - 英語学習の様々なシナリオを含む';
COMMENT ON TABLE messages IS 'サンプルメッセージデータ - ユーザーとAIアシスタントの対話例';
COMMENT ON TABLE bookmarks IS 'サンプルブックマークデータ - 学習者が保存した重要なメッセージ';

-- Note: In a real environment, you would:
-- 1. Create actual test users through Supabase Auth
-- 2. Replace 'auth-user-id-placeholder-*' with real user IDs
-- 3. Ensure this seed data is only run in development/test environments
-- 4. Consider using environment variables or migration conditions to prevent 
--    accidental execution in production
