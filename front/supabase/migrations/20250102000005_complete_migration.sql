-- Complete migration to create all required tables in correct order
-- This migration creates everything from scratch

-- Ensure required functions exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  display_name TEXT,
  avatar_url TEXT,
  learning_preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

-- Add updated_at trigger for profiles
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_updated_at') THEN
        CREATE TRIGGER update_profiles_updated_at 
          BEFORE UPDATE ON profiles 
          FOR EACH ROW 
          EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for profiles
DROP POLICY IF EXISTS "Users can view and edit their own profile" ON profiles;
CREATE POLICY "Users can view and edit their own profile" ON profiles
  FOR ALL USING (auth.uid() = user_id);

-- Create handle_new_user function and trigger
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (user_id, username, display_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'display_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auto profile creation
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
        CREATE TRIGGER on_auth_user_created
          AFTER INSERT ON auth.users
          FOR EACH ROW EXECUTE FUNCTION handle_new_user();
    END IF;
END $$;

-- 2. Create chat_groups table
CREATE TABLE IF NOT EXISTS chat_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for chat_groups
CREATE INDEX IF NOT EXISTS idx_chat_groups_profile_id ON chat_groups(profile_id);
CREATE INDEX IF NOT EXISTS idx_chat_groups_created_at ON chat_groups(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_groups_is_active ON chat_groups(is_active);

-- Add updated_at trigger for chat_groups
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_chat_groups_updated_at') THEN
        CREATE TRIGGER update_chat_groups_updated_at 
          BEFORE UPDATE ON chat_groups 
          FOR EACH ROW 
          EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Enable RLS on chat_groups
ALTER TABLE chat_groups ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for chat_groups
DROP POLICY IF EXISTS "Users can access their own chat groups" ON chat_groups;
CREATE POLICY "Users can access their own chat groups" ON chat_groups
  FOR ALL USING (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- 3. Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_group_id UUID NOT NULL REFERENCES chat_groups(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for chat_messages
CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_group_id ON chat_messages(chat_group_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_role ON chat_messages(role);

-- Enable RLS on chat_messages
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for chat_messages
DROP POLICY IF EXISTS "Users can access messages in their chat groups" ON chat_messages;
CREATE POLICY "Users can access messages in their chat groups" ON chat_messages
  FOR ALL USING (
    chat_group_id IN (
      SELECT cg.id FROM chat_groups cg
      JOIN profiles p ON cg.profile_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

-- 4. Handle bookmarks table migration
-- First drop any existing views that depend on bookmarks
DROP VIEW IF EXISTS user_bookmarks_view;

-- Check if old bookmarks table exists and migrate it
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'bookmarks') THEN
        -- Check if it has old structure (user_id column)
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'bookmarks' AND column_name = 'user_id') THEN
            -- Create new bookmarks table with new structure
            CREATE TABLE bookmarks_new (
              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
              profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
              chat_message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
              notes TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              UNIQUE(profile_id, chat_message_id)
            );

            -- Try to migrate existing data (only if profiles and chat_messages exist)
            INSERT INTO bookmarks_new (id, profile_id, chat_message_id, notes, created_at)
            SELECT 
              b.id,
              p.id as profile_id,
              b.message_id as chat_message_id,
              NULL as notes,
              b.created_at
            FROM bookmarks b
            JOIN profiles p ON b.user_id = p.user_id
            WHERE EXISTS (SELECT 1 FROM chat_messages cm WHERE cm.id = b.message_id);

            -- Drop old table and rename new one
            DROP TABLE bookmarks CASCADE;
            ALTER TABLE bookmarks_new RENAME TO bookmarks;
        END IF;
    ELSE
        -- Create new bookmarks table from scratch
        CREATE TABLE bookmarks (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
          chat_message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(profile_id, chat_message_id)
        );
    END IF;
END $$;

-- Create indexes for bookmarks
CREATE INDEX IF NOT EXISTS idx_bookmarks_profile_id ON bookmarks(profile_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_chat_message_id ON bookmarks(chat_message_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_created_at ON bookmarks(created_at);

-- Enable RLS on bookmarks
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for bookmarks
DROP POLICY IF EXISTS "Users can access their own bookmarks" ON bookmarks;
CREATE POLICY "Users can access their own bookmarks" ON bookmarks
  FOR ALL USING (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- 5. Create views
-- Create user_bookmarks_view
CREATE OR REPLACE VIEW user_bookmarks_view AS
SELECT
  b.id as bookmark_id,
  b.profile_id,
  b.notes,
  b.created_at as bookmarked_at,
  cm.id as chat_message_id,
  cm.content as message_content,
  cm.role as message_role,
  cm.metadata as message_metadata,
  cg.id as chat_group_id,
  cg.name as chat_group_name,
  cg.description as chat_group_description
FROM bookmarks b
JOIN chat_messages cm ON b.chat_message_id = cm.id
JOIN chat_groups cg ON cm.chat_group_id = cg.id
ORDER BY b.created_at DESC;

-- Create chat_group_summary_view
CREATE OR REPLACE VIEW chat_group_summary_view AS
SELECT
  cg.id as chat_group_id,
  cg.profile_id,
  cg.name as chat_group_name,
  cg.description,
  cg.is_active,
  cg.created_at as group_created_at,
  cg.updated_at as group_updated_at,
  COUNT(cm.id) as message_count,
  MAX(cm.created_at) as last_message_at,
  COALESCE(
    (SELECT cm2.content
     FROM chat_messages cm2
     WHERE cm2.chat_group_id = cg.id
     ORDER BY cm2.created_at DESC
     LIMIT 1),
    ''
  ) as last_message_content
FROM chat_groups cg
LEFT JOIN chat_messages cm ON cg.id = cm.chat_group_id
GROUP BY cg.id, cg.profile_id, cg.name, cg.description, cg.is_active, cg.created_at, cg.updated_at
ORDER BY MAX(cm.created_at) DESC NULLS LAST;
