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
- パフォーマンスを考慮したインデックス設計
- データの整合性を保つための外部キー制約

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

### 3.2. conversations（会話テーブル）

ユーザーと AI の会話セッションを管理するテーブル

```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_created_at ON conversations(created_at);
```

| カラム名   | データ型     | 制約          | 説明                                     |
| ---------- | ------------ | ------------- | ---------------------------------------- |
| id         | UUID         | PRIMARY KEY   | 会話の一意識別子                         |
| user_id    | UUID         | NOT NULL, FK  | ユーザー ID（auth.users テーブル参照）   |
| title      | VARCHAR(255) |               | 会話のタイトル（自動生成または手動設定） |
| created_at | TIMESTAMP    | DEFAULT NOW() | 作成日時                                 |
| updated_at | TIMESTAMP    | DEFAULT NOW() | 更新日時                                 |

### 3.3. messages（メッセージテーブル）

チャット内の個別メッセージを管理するテーブル

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
```

| カラム名        | データ型    | 制約            | 説明                                            |
| --------------- | ----------- | --------------- | ----------------------------------------------- |
| id              | UUID        | PRIMARY KEY     | メッセージの一意識別子                          |
| conversation_id | UUID        | NOT NULL, FK    | 会話 ID                                         |
| role            | VARCHAR(20) | NOT NULL, CHECK | メッセージの送信者（'user' または 'assistant'） |
| content         | TEXT        | NOT NULL        | メッセージ内容                                  |
| created_at      | TIMESTAMP   | DEFAULT NOW()   | 作成日時                                        |

### 3.4. ai_suggestions（AI 提案メッセージテーブル）

AI が生成する 3 つの英語表現提案を管理するテーブル

```sql
CREATE TABLE ai_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  english_text TEXT NOT NULL,
  japanese_translation TEXT NOT NULL,
  suggestion_order INTEGER NOT NULL CHECK (suggestion_order BETWEEN 1 AND 3),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, suggestion_order)
);

-- インデックス
CREATE INDEX idx_ai_suggestions_message_id ON ai_suggestions(message_id);
```

| カラム名             | データ型  | 制約            | 説明              |
| -------------------- | --------- | --------------- | ----------------- |
| id                   | UUID      | PRIMARY KEY     | 提案の一意識別子  |
| message_id           | UUID      | NOT NULL, FK    | 親メッセージ ID   |
| english_text         | TEXT      | NOT NULL        | 英語表現          |
| japanese_translation | TEXT      | NOT NULL        | 日本語訳          |
| suggestion_order     | INTEGER   | NOT NULL, CHECK | 提案の順序（1-3） |
| created_at           | TIMESTAMP | DEFAULT NOW()   | 作成日時          |

### 3.5. bookmarks（ブックマークテーブル）

ユーザーが保存した学習コンテンツを管理するテーブル

```sql
CREATE TABLE bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ai_suggestion_id UUID NOT NULL REFERENCES ai_suggestions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, ai_suggestion_id)
);

-- インデックス
CREATE INDEX idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX idx_bookmarks_created_at ON bookmarks(created_at);
```

| カラム名         | データ型  | 制約          | 説明                     |
| ---------------- | --------- | ------------- | ------------------------ |
| id               | UUID      | PRIMARY KEY   | ブックマークの一意識別子 |
| user_id          | UUID      | NOT NULL, FK  | ユーザー ID              |
| ai_suggestion_id | UUID      | NOT NULL, FK  | 提案メッセージ ID        |
| created_at       | TIMESTAMP | DEFAULT NOW() | ブックマーク作成日時     |

## 4. Row Level Security (RLS) ポリシー

Supabase のセキュリティ機能を活用したアクセス制御

### 4.1. profiles テーブル

```sql
-- 上記で既に設定済み
```

### 4.2. conversations テーブル

```sql
-- RLSを有効化
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分の会話のみアクセス可能
CREATE POLICY "Users can access their own conversations" ON conversations
  FOR ALL USING (auth.uid() = user_id);
```

### 4.3. messages テーブル

```sql
-- RLSを有効化
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分の会話のメッセージのみアクセス可能
CREATE POLICY "Users can access messages in their conversations" ON messages
  FOR ALL USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id = auth.uid()
    )
  );
```

### 4.4. ai_suggestions テーブル

```sql
-- RLSを有効化
ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分の会話内の提案のみアクセス可能
CREATE POLICY "Users can access suggestions in their conversations" ON ai_suggestions
  FOR ALL USING (
    message_id IN (
      SELECT m.id FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );
```

### 4.5. bookmarks テーブル

```sql
-- RLSを有効化
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のブックマークのみアクセス可能
CREATE POLICY "Users can access their own bookmarks" ON bookmarks
  FOR ALL USING (auth.uid() = user_id);
```

## 5. ビュー定義

### 5.1. user_bookmarks_view

ブックマーク一覧表示用のビュー

```sql
CREATE OR REPLACE VIEW user_bookmarks_view AS
SELECT
  b.id as bookmark_id,
  b.user_id,
  b.created_at as bookmarked_at,
  s.id as suggestion_id,
  s.english_text,
  s.japanese_translation,
  s.suggestion_order,
  m.id as message_id,
  c.id as conversation_id,
  c.title as conversation_title
FROM bookmarks b
JOIN ai_suggestions s ON b.ai_suggestion_id = s.id
JOIN messages m ON s.message_id = m.id
JOIN conversations c ON m.conversation_id = c.id
ORDER BY b.created_at DESC;
```

## 6. 初期化スクリプト

```sql
-- 拡張機能の有効化
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- テーブル作成（上記の順序で実行）
-- 1. profiles
-- 2. conversations
-- 3. messages
-- 4. ai_suggestions
-- 5. bookmarks

-- RLSポリシーの設定
-- ビューの作成

-- サンプルデータ（開発環境用）
-- 本番環境では実行しない
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

| テーブル       | カラム               | 制限     | 理由                       |
| -------------- | -------------------- | -------- | -------------------------- |
| conversations  | title                | 255 文字 | 一般的な会話タイトルの長さ |
| messages       | content              | TEXT     | 長文メッセージに対応       |
| ai_suggestions | english_text         | TEXT     | 複数文の例文に対応         |
| ai_suggestions | japanese_translation | TEXT     | 詳細な翻訳に対応           |

## 10. 運用考慮事項

### 10.1. バックアップ

- Supabase の自動バックアップ機能を活用
- 重要なユーザーデータの定期バックアップ

### 10.2. モニタリング

- 会話数、メッセージ数、ブックマーク数の監視
- パフォーマンスメトリクスの追跡

---

本設計書は、システムの成長に応じて継続的に更新される予定です。
