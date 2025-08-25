-- Seed sample data for development environment
-- This migration creates sample data for testing and development purposes
-- Note: This should NOT be run in production environment

-- Create sample users (these will be created through Supabase Auth UI in development)
-- The profiles will be automatically created via the trigger

-- Sample conversations and messages
-- These will be inserted with placeholder UUIDs that should be replaced with actual user IDs

-- Create sample profiles (for development/testing)
-- Note: In production, these will be created automatically when users sign up
INSERT INTO profiles (id, user_id, username, display_name, learning_preferences, created_at, updated_at)
VALUES 
  (
    uuid_generate_v4(),
    '11111111-1111-1111-1111-111111111111'::uuid, -- Placeholder UUID - replace with actual auth.users.id
    'sample_user1',
    'Sample User 1',
    '{"level": "beginner", "interests": ["daily_conversation", "business_english"]}'::jsonb,
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '7 days'
  ),
  (
    uuid_generate_v4(),
    '22222222-2222-2222-2222-222222222222'::uuid, -- Placeholder UUID - replace with actual auth.users.id
    'sample_user2',
    'Sample User 2',
    '{"level": "intermediate", "interests": ["travel", "academic"]}'::jsonb,
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '5 days'
  )
ON CONFLICT (user_id) DO NOTHING; -- Avoid conflicts if profiles already exist

-- Create sample conversations
INSERT INTO conversations (id, user_id, title, created_at, updated_at)
VALUES 
  (
    uuid_generate_v4(),
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Daily Conversation Practice',
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '1 day'
  ),
  (
    uuid_generate_v4(),
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Business English Discussion',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 hours'
  ),
  (
    uuid_generate_v4(),
    '22222222-2222-2222-2222-222222222222'::uuid,
    'Travel Planning Conversation',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '30 minutes'
  )
ON CONFLICT DO NOTHING;

-- Get conversation IDs for message insertion
-- Note: In a real scenario, you'd use the actual UUIDs or variables

-- Create sample messages
-- Conversation 1: Daily Conversation Practice
WITH conv1 AS (
  SELECT id FROM conversations 
  WHERE user_id = '11111111-1111-1111-1111-111111111111'::uuid 
  AND title = 'Daily Conversation Practice'
  LIMIT 1
)
INSERT INTO messages (id, conversation_id, role, content, created_at)
SELECT 
  uuid_generate_v4(),
  conv1.id,
  'user',
  'Hello! I want to practice daily conversation in English.',
  NOW() - INTERVAL '3 days'
FROM conv1
UNION ALL
SELECT 
  uuid_generate_v4(),
  conv1.id,
  'assistant',
  'Hello! I''d be happy to help you practice daily conversation. What would you like to talk about today? We could discuss your daily routine, hobbies, or anything that interests you.',
  NOW() - INTERVAL '3 days' + INTERVAL '30 seconds'
FROM conv1
UNION ALL
SELECT 
  uuid_generate_v4(),
  conv1.id,
  'user',
  'I''d like to talk about my morning routine. I usually wake up at 7 AM.',
  NOW() - INTERVAL '3 days' + INTERVAL '1 minute'
FROM conv1
UNION ALL
SELECT 
  uuid_generate_v4(),
  conv1.id,
  'assistant',
  'That''s great! Waking up at 7 AM is a good time. What do you usually do after you wake up? Do you have breakfast right away, or do you do something else first?',
  NOW() - INTERVAL '3 days' + INTERVAL '1 minute 30 seconds'
FROM conv1;

-- Conversation 2: Business English Discussion
WITH conv2 AS (
  SELECT id FROM conversations 
  WHERE user_id = '11111111-1111-1111-1111-111111111111'::uuid 
  AND title = 'Business English Discussion'
  LIMIT 1
)
INSERT INTO messages (id, conversation_id, role, content, created_at)
SELECT 
  uuid_generate_v4(),
  conv2.id,
  'user',
  'I need to improve my business English for meetings.',
  NOW() - INTERVAL '2 days'
FROM conv2
UNION ALL
SELECT 
  uuid_generate_v4(),
  conv2.id,
  'assistant',
  'Excellent! Business English is very important for professional success. Let''s practice some common meeting scenarios. Would you like to start with how to introduce yourself in a business meeting?',
  NOW() - INTERVAL '2 days' + INTERVAL '20 seconds'
FROM conv2
UNION ALL
SELECT 
  uuid_generate_v4(),
  conv2.id,
  'user',
  'Yes, that would be helpful. How should I introduce myself professionally?',
  NOW() - INTERVAL '2 days' + INTERVAL '1 minute'
FROM conv2
UNION ALL
SELECT 
  uuid_generate_v4(),
  conv2.id,
  'assistant',
  'Great question! Here''s a professional introduction template: "Good morning/afternoon everyone. My name is [Your Name] and I''m the [Your Position] at [Company Name]. I''ll be leading today''s discussion on [Topic]." You can also add a brief sentence about your role or what you bring to the meeting.',
  NOW() - INTERVAL '2 days' + INTERVAL '1 minute 30 seconds'
FROM conv2;

-- Conversation 3: Travel Planning Conversation
WITH conv3 AS (
  SELECT id FROM conversations 
  WHERE user_id = '22222222-2222-2222-2222-222222222222'::uuid 
  AND title = 'Travel Planning Conversation'
  LIMIT 1
)
INSERT INTO messages (id, conversation_id, role, content, created_at)
SELECT 
  uuid_generate_v4(),
  conv3.id,
  'user',
  'I''m planning a trip to Japan. Can you help me with travel English?',
  NOW() - INTERVAL '1 day'
FROM conv3
UNION ALL
SELECT 
  uuid_generate_v4(),
  conv3.id,
  'assistant',
  'How exciting! Japan is a wonderful destination. I''d be happy to help you with travel English. What specific aspects would you like to practice? For example, asking for directions, ordering food, booking hotels, or talking to locals?',
  NOW() - INTERVAL '1 day' + INTERVAL '25 seconds'
FROM conv3
UNION ALL
SELECT 
  uuid_generate_v4(),
  conv3.id,
  'user',
  'I want to learn how to ask for directions and order food in restaurants.',
  NOW() - INTERVAL '1 day' + INTERVAL '2 minutes'
FROM conv3
UNION ALL
SELECT 
  uuid_generate_v4(),
  conv3.id,
  'assistant',
  'Perfect! Let''s start with asking for directions. Here are some useful phrases: "Excuse me, could you tell me how to get to...?" or "I''m looking for [place name]. Do you know where it is?" For restaurants, you can say "Could I see the menu, please?" and "I''d like to order..." Let''s practice with some specific scenarios!',
  NOW() - INTERVAL '1 day' + INTERVAL '2 minutes 30 seconds'
FROM conv3;

-- Create sample bookmarks
-- Bookmark some useful assistant messages for learning
WITH sample_messages AS (
  SELECT m.id, m.conversation_id, c.user_id
  FROM messages m
  JOIN conversations c ON m.conversation_id = c.id
  WHERE m.role = 'assistant'
  AND m.content LIKE '%template%' OR m.content LIKE '%phrases%'
  LIMIT 3
)
INSERT INTO bookmarks (id, user_id, message_id, created_at)
SELECT 
  uuid_generate_v4(),
  sm.user_id,
  sm.id,
  NOW() - INTERVAL '1 hour'
FROM sample_messages sm;

-- Add comment for clarification
COMMENT ON TABLE profiles IS 'User profiles linked to Supabase Auth users';
COMMENT ON TABLE conversations IS 'Chat sessions between users and AI assistant';
COMMENT ON TABLE messages IS 'Individual messages within conversations';
COMMENT ON TABLE bookmarks IS 'User-saved messages for learning reference';

-- Display summary of seeded data
DO $$
BEGIN
  RAISE NOTICE 'Sample data seeding completed!';
  RAISE NOTICE 'Created: % profiles', (SELECT COUNT(*) FROM profiles);
  RAISE NOTICE 'Created: % conversations', (SELECT COUNT(*) FROM conversations);
  RAISE NOTICE 'Created: % messages', (SELECT COUNT(*) FROM messages);
  RAISE NOTICE 'Created: % bookmarks', (SELECT COUNT(*) FROM bookmarks);
  RAISE NOTICE '';
  RAISE NOTICE 'Note: Replace placeholder UUIDs with actual auth.users.id values in development';
  RAISE NOTICE 'This seed data is for development/testing purposes only';
END $$;
