-- Minimal profile auto-creation migration
-- 最小限のユーザープロファイル自動作成機能

-- 1. プロファイルテーブルが存在しない場合のみ作成
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

-- 2. ユニーク制約を安全に追加
DO $$
BEGIN
  -- user_idのユニーク制約を確認・追加
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'profiles' 
    AND c.contype = 'u'
    AND EXISTS (
      SELECT 1 FROM pg_attribute a 
      WHERE a.attrelid = t.oid 
      AND a.attnum = ANY(c.conkey) 
      AND a.attname = 'user_id'
    )
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);
  END IF;
END $$;

-- 3. インデックス作成
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- 4. RLS設定
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 5. RLSポリシー作成（既存があれば削除して再作成）
DROP POLICY IF EXISTS "Users can view and edit their own profile" ON profiles;
CREATE POLICY "Users can view and edit their own profile" ON profiles
  FOR ALL USING (auth.uid() = user_id);

-- 6. 新規ユーザー用プロファイル自動作成関数
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  username_value TEXT;
  display_name_value TEXT;
  avatar_url_value TEXT;
BEGIN
  -- 既存プロファイルをチェック
  IF EXISTS (SELECT 1 FROM profiles WHERE user_id = NEW.id) THEN
    RETURN NEW;
  END IF;
  
  -- メタデータから情報を抽出
  username_value := COALESCE(
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'user_name',
    NEW.raw_user_meta_data->>'preferred_username',
    split_part(NEW.email, '@', 1)
  );
  
  display_name_value := COALESCE(
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    username_value
  );
  
  avatar_url_value := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture'
  );
  
  -- プロファイル作成
  INSERT INTO profiles (
    user_id,
    username,
    display_name,
    avatar_url,
    learning_preferences,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    username_value,
    display_name_value,
    avatar_url_value,
    '{"language_level": "beginner", "preferred_topics": [], "study_goals": []}',
    NOW(),
    NOW()
  );
  
  RETURN NEW;
  
EXCEPTION
  WHEN OTHERS THEN
    -- エラーが発生してもユーザー作成は継続
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. 既存トリガーを削除してから新規作成
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 8. 既存ユーザーにプロファイルを作成（重複チェック付き）
INSERT INTO profiles (user_id, username, display_name, learning_preferences, created_at, updated_at)
SELECT 
  u.id,
  COALESCE(
    u.raw_user_meta_data->>'username',
    u.raw_user_meta_data->>'user_name',
    u.raw_user_meta_data->>'preferred_username',
    split_part(u.email, '@', 1)
  ),
  COALESCE(
    u.raw_user_meta_data->>'display_name',
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'name',
    split_part(u.email, '@', 1)
  ),
  '{"language_level": "beginner", "preferred_topics": [], "study_goals": []}',
  NOW(),
  NOW()
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = u.id);

-- 9. 関数にコメント追加（auth.usersのトリガーはコメント不可）
COMMENT ON FUNCTION handle_new_user() IS 'ユーザー登録時に自動でプロファイルを作成する関数';
COMMENT ON TABLE profiles IS 'ユーザープロファイル情報テーブル';
