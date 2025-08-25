# 手動マイグレーション手順

パスワード認証エラーが発生した場合の手動マイグレーション手順です。

## 1. Supabase ダッシュボードでの実行

### ステップ 1: ダッシュボードにアクセス

1. https://supabase.com/dashboard にアクセス
2. プロジェクト `sqebedvlhtopzptisgbh` を選択
3. 左メニューから「SQL Editor」を選択

### ステップ 2: テーブル確認

まず、現在のテーブル状況を確認：

```sql
-- 既存テーブルの確認
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- profilesテーブルの存在確認
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_name = 'profiles'
);
```

### ステップ 3: 段階的実行

#### 3.1 profiles テーブルが存在しない場合

```sql
-- プロファイルテーブル作成
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- RLS有効化
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLSポリシー作成
CREATE POLICY "Users can view and edit their own profile" ON profiles
  FOR ALL USING (auth.uid() = user_id);
```

#### 3.2 chat_groups テーブル作成

```sql
CREATE TABLE chat_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX idx_chat_groups_profile_id ON chat_groups(profile_id);
CREATE INDEX idx_chat_groups_created_at ON chat_groups(created_at);
CREATE INDEX idx_chat_groups_is_active ON chat_groups(is_active);

-- RLS有効化
ALTER TABLE chat_groups ENABLE ROW LEVEL SECURITY;

-- RLSポリシー作成
CREATE POLICY "Users can access their own chat groups" ON chat_groups
  FOR ALL USING (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );
```

#### 3.3 chat_messages テーブル作成

```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_group_id UUID NOT NULL REFERENCES chat_groups(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX idx_chat_messages_chat_group_id ON chat_messages(chat_group_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX idx_chat_messages_role ON chat_messages(role);

-- RLS有効化
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- RLSポリシー作成
CREATE POLICY "Users can access messages in their chat groups" ON chat_messages
  FOR ALL USING (
    chat_group_id IN (
      SELECT cg.id FROM chat_groups cg
      JOIN profiles p ON cg.profile_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );
```

#### 3.4 bookmarks テーブル更新

```sql
-- 新しいbookmarksテーブル作成
CREATE TABLE bookmarks_new (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  chat_message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(profile_id, chat_message_id)
);

-- インデックス作成
CREATE INDEX idx_bookmarks_profile_id ON bookmarks_new(profile_id);
CREATE INDEX idx_bookmarks_chat_message_id ON bookmarks_new(chat_message_id);
CREATE INDEX idx_bookmarks_created_at ON bookmarks_new(created_at);

-- 古いbookmarksテーブルを削除（データが存在する場合は要注意）
-- DROP TABLE IF EXISTS bookmarks;

-- 新しいテーブルをリネーム
-- ALTER TABLE bookmarks_new RENAME TO bookmarks;

-- RLS有効化
ALTER TABLE bookmarks_new ENABLE ROW LEVEL SECURITY;

-- RLSポリシー作成
CREATE POLICY "Users can access their own bookmarks" ON bookmarks_new
  FOR ALL USING (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );
```

#### 3.5 ビュー作成

```sql
-- ブックマーク表示用ビュー
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
FROM bookmarks_new b
JOIN chat_messages cm ON b.chat_message_id = cm.id
JOIN chat_groups cg ON cm.chat_group_id = cg.id
ORDER BY b.created_at DESC;

-- チャットグループ概要ビュー
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
```

## 2. 実行後の確認

```sql
-- テーブル作成の確認
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('profiles', 'chat_groups', 'chat_messages', 'bookmarks_new')
ORDER BY table_name;

-- RLSの確認
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'chat_groups', 'chat_messages', 'bookmarks_new');

-- ビューの確認
SELECT table_name
FROM information_schema.views
WHERE table_schema = 'public'
AND table_name IN ('user_bookmarks_view', 'chat_group_summary_view');
```

## 3. トラブルシューティング

### エラー: relation "profiles" does not exist

- profiles テーブルを先に作成してください

### エラー: foreign key constraint

- 参照先のテーブルが存在することを確認してください
- テーブル作成順序：profiles → chat_groups → chat_messages → bookmarks

### エラー: permission denied

- データベースの管理者権限が必要です
- Supabase ダッシュボードから実行してください

## 4. 完了後の作業

手動でマイグレーションを実行した後は、migration_history テーブルに記録を追加：

```sql
-- マイグレーション履歴の追加（実際のファイル名とチェックサムは調整）
INSERT INTO supabase_migrations.schema_migrations (version, statements)
VALUES ('20250102000002', ARRAY['-- Manual migration completed']);
```
