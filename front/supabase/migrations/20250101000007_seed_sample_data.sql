-- Seed sample data for development environment
-- This migration adds sample data for testing and development purposes
-- Do NOT run this in production environment

-- TEMPORARILY DISABLED: All sample data has been commented out due to invalid UUID format
-- This will be re-enabled after proper test users are created in the auth system

-- Note: Since profiles are automatically created via trigger when auth.users are created,
-- we cannot directly insert into profiles table without corresponding auth.users records.
-- The following data assumes that test users have been created through the auth system.

-- Sample conversations data (temporarily disabled due to invalid UUID format)
-- These conversations will be associated with test users created through Supabase Auth
-- INSERT INTO conversations (id, user_id, title, created_at, updated_at) VALUES
-- Note: Replace these UUIDs with actual user_ids from your auth.users table
-- For now, using placeholder UUIDs that should be updated when real users exist
-- ('550e8400-e29b-41d4-a716-446655440001', 'auth-user-id-placeholder-1', '英語学習：日常会話', '2024-01-01 10:00:00+00', '2024-01-01 10:30:00+00'),
-- ('550e8400-e29b-41d4-a716-446655440002', 'auth-user-id-placeholder-1', 'ビジネス英語：プレゼンテーション', '2024-01-02 14:00:00+00', '2024-01-02 14:45:00+00'),
-- ('550e8400-e29b-41d4-a716-446655440003', 'auth-user-id-placeholder-2', '旅行英語：ホテル予約', '2024-01-03 09:00:00+00', '2024-01-03 09:25:00+00'),
-- ('550e8400-e29b-41d4-a716-446655440004', 'auth-user-id-placeholder-2', '文法練習：時制について', '2024-01-04 16:00:00+00', '2024-01-04 16:20:00+00');

-- Sample messages data (temporarily disabled)
-- INSERT INTO messages (id, conversation_id, role, content, created_at) VALUES
-- Conversation 1: 日常会話
-- ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'user', 'Hello! I want to practice daily conversation in English.', '2024-01-01 10:00:00+00'),
-- ('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'assistant', 'Hello! I''d be happy to help you practice daily conversation. Let''s start with a common scenario. Imagine you''re at a coffee shop. What would you like to order?', '2024-01-01 10:01:00+00'),
-- ... (additional message data commented out)

-- Sample bookmarks data (temporarily disabled)
-- INSERT INTO bookmarks (id, user_id, message_id, created_at) VALUES
-- ('770e8400-e29b-41d4-a716-446655440001', 'auth-user-id-placeholder-1', '660e8400-e29b-41d4-a716-446655440004', '2024-01-01 10:10:00+00'),
-- ... (additional bookmark data commented out)

-- Update sample profile learning preferences (temporarily disabled)
-- UPDATE profiles 
-- SET learning_preferences = '{...}'::jsonb,
-- display_name = 'サンプルユーザー1',
-- username = 'sample_user_1'
-- WHERE user_id = 'auth-user-id-placeholder-1';

-- Schema migration completed successfully - no data inserted due to invalid UUIDs
-- To enable sample data, replace placeholder user IDs with actual auth.users UUIDs
SELECT 'Seed migration completed - data insertion skipped due to placeholder UUIDs' as status;