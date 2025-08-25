-- Enhanced user profile auto-creation migration
-- ユーザー登録時に自動でprofileテーブルにデータを作成する機能を強化

-- 既存のトリガーとファンクションをドロップ（もし存在すれば）
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- 改善されたユーザープロファイル自動作成関数
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  username_value TEXT;
  display_name_value TEXT;
  avatar_url_value TEXT;
BEGIN
  -- ログ出力（デバッグ用）
  RAISE LOG 'Creating profile for new user: %', NEW.id;
  
  -- メタデータからユーザー情報を抽出
  username_value := COALESCE(
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'user_name',
    NEW.raw_user_meta_data->>'preferred_username',
    split_part(NEW.email, '@', 1) -- メールアドレスの@より前の部分をデフォルトユーザー名とする
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
  WHEN OTHERS THEN
    -- エラーログを出力
    RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
    -- エラーが発生してもユーザー作成は継続する
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 新しいトリガーを作成
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ユニーク制約を追加（重複を防ぐため）
-- 既存の制約がある場合は無視
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_user_id' 
    AND conrelid = 'profiles'::regclass
  ) THEN
    ALTER TABLE profiles 
    ADD CONSTRAINT unique_user_id UNIQUE (user_id);
  END IF;
END $$;

-- 既存のユーザーで profiles がないものに対してもプロファイルを作成
INSERT INTO profiles (user_id, username, display_name, learning_preferences)
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
  '{"language_level": "beginner", "preferred_topics": [], "study_goals": []}'
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.user_id
WHERE p.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- デフォルトのチャットグループを自動作成する関数
CREATE OR REPLACE FUNCTION create_default_chat_group_for_user()
RETURNS TRIGGER AS $$
BEGIN
  -- デフォルトのチャットグループを作成
  INSERT INTO chat_groups (
    profile_id,
    name,
    description,
    is_active,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    '最初のチャット',
    'AI との英語学習を始めましょう！',
    true,
    NOW(),
    NOW()
  );
  
  RAISE LOG 'Default chat group created for profile: %', NEW.id;
  
  RETURN NEW;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error creating default chat group for profile %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- プロファイル作成時にデフォルトチャットグループを作成するトリガー
CREATE TRIGGER on_profile_created
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION create_default_chat_group_for_user();

-- コメント追加（auth.usersテーブルは権限がないためコメント不可）
COMMENT ON FUNCTION handle_new_user() IS 'ユーザー登録時に自動でプロファイルを作成する関数';
COMMENT ON FUNCTION create_default_chat_group_for_user() IS 'プロファイル作成時にデフォルトのチャットグループを作成する関数';
-- COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 'ユーザー登録時にプロファイルを自動作成するトリガー'; -- 権限エラーのためコメント化
COMMENT ON TRIGGER on_profile_created ON profiles IS 'プロファイル作成時にデフォルトチャットグループを自動作成するトリガー';
