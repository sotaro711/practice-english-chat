-- Safe profile creation migration
-- ONL CONFLICTエラーを回避するための安全なプロファイル作成

-- まず既存のプロファイルテーブル構造を確認・修正
DO $$
BEGIN
  -- profilesテーブルが存在するか確認
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles') THEN
    
    -- user_idのユニーク制約が存在するか確認
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint c
      JOIN pg_class t ON c.conrelid = t.oid
      WHERE t.relname = 'profiles' 
      AND c.contype = 'u'
      AND c.conname LIKE '%user_id%'
    ) THEN
      -- ユニーク制約を追加
      ALTER TABLE profiles ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);
      RAISE NOTICE 'Added unique constraint to profiles.user_id';
    END IF;
    
  ELSE
    -- profilesテーブルが存在しない場合は作成
    CREATE TABLE profiles (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
      username TEXT,
      display_name TEXT,
      avatar_url TEXT,
      learning_preferences JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- インデックス作成
    CREATE INDEX idx_profiles_username ON profiles(username);
    CREATE INDEX idx_profiles_user_id ON profiles(user_id);
    
    RAISE NOTICE 'Created profiles table with unique constraint';
  END IF;
END $$;

-- 既存ユーザーへの安全なプロファイル作成
-- ON CONFLICTを使わずに、EXISTS句で重複チェック
INSERT INTO profiles (user_id, username, display_name, learning_preferences, created_at, updated_at)
SELECT 
  u.id,
  COALESCE(
    u.raw_user_meta_data->>'username',
    u.raw_user_meta_data->>'user_name',
    u.raw_user_meta_data->>'preferred_username',
    split_part(u.email, '@', 1)
  ) as username,
  COALESCE(
    u.raw_user_meta_data->>'display_name',
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'name',
    split_part(u.email, '@', 1)
  ) as display_name,
  '{"language_level": "beginner", "preferred_topics": [], "study_goals": []}',
  NOW(),
  NOW()
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM profiles p WHERE p.user_id = u.id
);

-- 改善されたユーザープロファイル自動作成関数
CREATE OR REPLACE FUNCTION handle_new_user_safe()
RETURNS TRIGGER AS $$
DECLARE
  username_value TEXT;
  display_name_value TEXT;
  avatar_url_value TEXT;
BEGIN
  -- ログ出力（デバッグ用）
  RAISE LOG 'Creating profile for new user: %', NEW.id;
  
  -- 既にプロファイルが存在するかチェック
  IF EXISTS (SELECT 1 FROM profiles WHERE user_id = NEW.id) THEN
    RAISE LOG 'Profile already exists for user: %', NEW.id;
    RETURN NEW;
  END IF;
  
  -- メタデータからユーザー情報を抽出
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
  
  -- プロファイルを作成
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
  
  RAISE LOG 'Profile created successfully for user: %', NEW.id;
  
  RETURN NEW;
  
EXCEPTION
  WHEN unique_violation THEN
    -- ユニーク制約違反の場合は既存プロファイルがあることを示す
    RAISE LOG 'Profile already exists for user %', NEW.id;
    RETURN NEW;
  WHEN OTHERS THEN
    -- その他のエラーログを出力
    RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
    -- エラーが発生してもユーザー作成は継続する
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 既存のトリガーを削除してから新しいトリガーを作成
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_safe();

-- RLS設定（既存のポリシーが無い場合のみ）
DO $$
BEGIN
  -- RLSが有効でない場合は有効化
  IF NOT EXISTS (
    SELECT 1 FROM pg_class 
    WHERE relname = 'profiles' AND relrowsecurity = true
  ) THEN
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
  END IF;
  
  -- ポリシーが存在しない場合は作成
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Users can view and edit their own profile'
  ) THEN
    CREATE POLICY "Users can view and edit their own profile" ON profiles
      FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- コメント追加（auth.usersテーブルは権限がないためトリガーコメント不可）
COMMENT ON FUNCTION handle_new_user_safe() IS '安全なユーザープロファイル自動作成関数（重複チェック付き）';
-- COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 'ユーザー登録時にプロファイルを安全に自動作成するトリガー'; -- 権限エラーのためコメント化
