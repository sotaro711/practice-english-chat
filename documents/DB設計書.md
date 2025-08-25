DB 設計書：AI チャット英語学習システム

## 1. 概要

本ドキュメントは、AI チャット英語学習システムのデータベース設計を定義するものです。
Supabase Postgres を使用し、ユーザー認証には Supabase Auth を利用します。

### Supabase Auth との連携について

Supabase Auth を使用する場合、ユーザー情報は `auth.users` テーブルに自動管理されますが、セキュリティ上の理由から直接アクセスは推奨されません。代わりに、`public.profiles` テーブルを作成してユーザープロファイル情報を管理し、`auth.users.id` への外部キー参照を通じて連携します。

## 2. データベース構成

### 2.1. 技術仕様

- **データベース**: Supabase Postgres
- **認証**: Supabase Auth (auth.users テーブルは自動生成)
- **ORM/クエリビルダー**: Supabase Client
- **言語**: TypeScript

### 2.2. 設計方針

- 拡張性を考慮し、将来的に他言語学習にも対応可能な設計
- Supabase Auth との連携を前提とした設計
- チャットグループ中心の設計で、ユーザーが複数のテーマやプロジェクト別にチャットを整理可能
- パフォーマンスを考慮したインデックス設計
- データの整合性を保つための外部キー制約

### 2.3. 主要な関係性

- **profiles**: ユーザープロファイル情報（auth.users と 1:1）
- **chat_groups**: チャットグループ（profiles と 1:多）
- **chat_messages**: チャットメッセージ（chat_groups と 1:多）
- **bookmarks**: ブックマーク（profiles と chat_messages の多:多関係）

## 3. テーブル設計

### 3.1. profiles（ユーザープロファイルテーブル）

Supabase Auth との連携で推奨されるユーザープロファイル管理テーブル

```sql
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

-- インデックス
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_user_id ON profiles(user_id);

-- RLS ポリシー
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view and edit their own profile" ON profiles
  FOR ALL USING (auth.uid() = user_id);

-- 新規ユーザー作成時の自動プロファイル作成トリガー
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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

| カラム名             | データ型  | 制約          | 説明                                   |
| -------------------- | --------- | ------------- | -------------------------------------- |
| id                   | UUID      | PRIMARY KEY   | プロファイルの一意識別子               |
| user_id              | UUID      | NOT NULL, FK  | ユーザー ID（auth.users テーブル参照） |
| username             | TEXT      |               | ユーザー名                             |
| display_name         | TEXT      |               | 表示名                                 |
| avatar_url           | TEXT      |               | アバター画像 URL                       |
| learning_preferences | JSONB     | DEFAULT {}    | 学習設定（言語レベル、興味分野等）     |
| created_at           | TIMESTAMP | DEFAULT NOW() | 作成日時                               |
| updated_at           | TIMESTAMP | DEFAULT NOW() | 更新日時                               |

### 3.2. chat_groups（チャットグループテーブル）

ユーザーのチャットグループを管理するテーブル。各プロファイルが複数のチャットグループを持つことができます。

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

-- インデックス
CREATE INDEX idx_chat_groups_profile_id ON chat_groups(profile_id);
CREATE INDEX idx_chat_groups_created_at ON chat_groups(created_at);
CREATE INDEX idx_chat_groups_is_active ON chat_groups(is_active);
```

| カラム名    | データ型     | 制約          | 説明                                     |
| ----------- | ------------ | ------------- | ---------------------------------------- |
| id          | UUID         | PRIMARY KEY   | チャットグループの一意識別子             |
| profile_id  | UUID         | NOT NULL, FK  | プロファイル ID（profiles テーブル参照） |
| name        | VARCHAR(255) | NOT NULL      | チャットグループ名                       |
| description | TEXT         |               | チャットグループの説明                   |
| is_active   | BOOLEAN      | DEFAULT true  | アクティブ状態フラグ                     |
| created_at  | TIMESTAMP    | DEFAULT NOW() | 作成日時                                 |
| updated_at  | TIMESTAMP    | DEFAULT NOW() | 更新日時                                 |

### 3.3. chat_messages（チャットメッセージテーブル）

チャットグループ内の個別メッセージを管理するテーブル

```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_group_id UUID NOT NULL REFERENCES chat_groups(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_chat_messages_chat_group_id ON chat_messages(chat_group_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX idx_chat_messages_role ON chat_messages(role);
```

| カラム名      | データ型    | 制約            | 説明                                            |
| ------------- | ----------- | --------------- | ----------------------------------------------- |
| id            | UUID        | PRIMARY KEY     | メッセージの一意識別子                          |
| chat_group_id | UUID        | NOT NULL, FK    | チャットグループ ID                             |
| role          | VARCHAR(20) | NOT NULL, CHECK | メッセージの送信者（'user' または 'assistant'） |
| content       | TEXT        | NOT NULL        | メッセージ内容                                  |
| metadata      | JSONB       | DEFAULT {}      | メッセージの追加情報（AI モデル情報等）         |
| created_at    | TIMESTAMP   | DEFAULT NOW()   | 作成日時                                        |

### 3.4. bookmarks（ブックマークテーブル）

ユーザーが保存した学習コンテンツを管理するテーブル

```sql
CREATE TABLE bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  chat_message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(profile_id, chat_message_id)
);

-- インデックス
CREATE INDEX idx_bookmarks_profile_id ON bookmarks(profile_id);
CREATE INDEX idx_bookmarks_chat_message_id ON bookmarks(chat_message_id);
CREATE INDEX idx_bookmarks_created_at ON bookmarks(created_at);
```

| カラム名        | データ型  | 制約          | 説明                                    |
| --------------- | --------- | ------------- | --------------------------------------- |
| id              | UUID      | PRIMARY KEY   | ブックマークの一意識別子                |
| profile_id      | UUID      | NOT NULL, FK  | プロファイル ID                         |
| chat_message_id | UUID      | NOT NULL, FK  | ブックマークされたチャットメッセージ ID |
| notes           | TEXT      |               | ブックマークのメモ                      |
| created_at      | TIMESTAMP | DEFAULT NOW() | ブックマーク作成日時                    |

## 4. Row Level Security (RLS) ポリシー

Supabase のセキュリティ機能を活用したアクセス制御

### 4.1. profiles テーブル

```sql
-- 上記で既に設定済み
```

### 4.2. chat_groups テーブル

```sql
-- RLSを有効化
ALTER TABLE chat_groups ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のプロファイルのチャットグループのみアクセス可能
CREATE POLICY "Users can access their own chat groups" ON chat_groups
  FOR ALL USING (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );
```

### 4.3. chat_messages テーブル

```sql
-- RLSを有効化
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のチャットグループのメッセージのみアクセス可能
CREATE POLICY "Users can access messages in their chat groups" ON chat_messages
  FOR ALL USING (
    chat_group_id IN (
      SELECT cg.id FROM chat_groups cg
      JOIN profiles p ON cg.profile_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );
```

### 4.4. bookmarks テーブル

```sql
-- RLSを有効化
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のプロファイルのブックマークのみアクセス可能
CREATE POLICY "Users can access their own bookmarks" ON bookmarks
  FOR ALL USING (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );
```

## 5. ビュー定義

### 5.1. user_bookmarks_view

ブックマーク一覧表示用のビュー

```sql
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
```

### 5.2. chat_group_summary_view

チャットグループの概要表示用のビュー

```sql
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

## 6. 初期化スクリプト

```sql
-- 拡張機能の有効化
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- テーブル作成（上記の順序で実行）
-- 1. profiles (Supabase Authと連携)
-- 2. chat_groups
-- 3. chat_messages
-- 4. bookmarks

-- RLSポリシーの設定
-- ビューの作成

-- サンプルデータ（開発環境用）
-- 本番環境では実行しない

-- テーブル作成順序例:
-- CREATE TABLE profiles (...);
-- CREATE TABLE chat_groups (...);
-- CREATE TABLE chat_messages (...);
-- CREATE TABLE bookmarks (...);

-- RLSポリシー設定
-- ALTER TABLE chat_groups ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- ビュー作成
-- CREATE OR REPLACE VIEW user_bookmarks_view AS ...;
-- CREATE OR REPLACE VIEW chat_group_summary_view AS ...;
```

## 7. パフォーマンス考慮事項

### 7.1. インデックス戦略

- 外部キーにはインデックスを設定
- 検索で使用される日時カラムにもインデックスを設定
- 複合インデックスは必要に応じて追加

### 7.2. データ保持ポリシー

- 古い会話データのアーカイブ戦略を検討
- ブックマークは長期保持が前提

## 8. 拡張性

### 8.1. 多言語対応

- `language` カラムを追加することで他言語学習に対応可能
- 翻訳テーブルの追加も検討

### 8.2. 学習進捗管理

- 将来的に学習統計テーブルの追加を検討
- 学習レベルや進捗管理機能の拡張

## 9. データ型とサイズ制限

| テーブル      | カラム      | 制限     | 理由                             |
| ------------- | ----------- | -------- | -------------------------------- |
| chat_groups   | name        | 255 文字 | 一般的なチャットグループ名の長さ |
| chat_groups   | description | TEXT     | 詳細な説明に対応                 |
| chat_messages | content     | TEXT     | 長文メッセージに対応             |
| bookmarks     | notes       | TEXT     | 詳細なメモに対応                 |

## 10. 運用考慮事項

### 10.1. バックアップ

- Supabase の自動バックアップ機能を活用
- 重要なユーザーデータの定期バックアップ

### 10.2. モニタリング

- チャットグループ数、メッセージ数、ブックマーク数の監視
- パフォーマンスメトリクスの追跡
- アクティブなチャットグループの使用状況監視

---

本設計書は、システムの成長に応じて継続的に更新される予定です。
