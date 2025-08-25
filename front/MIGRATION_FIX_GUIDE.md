# マイグレーション依存関係修正ガイド

## 問題の概要

`profiles`テーブルが存在しない状態で、それを参照するテーブル（bookmarks）を作成しようとしてエラーが発生しています。

## 解決方法

### 方法 1: Supabase ダッシュボードから手動実行

1. Supabase ダッシュボードにアクセス
2. SQL エディタで以下のマイグレーションを順番に実行：

#### ステップ 1: 基本設定

```sql
-- 拡張機能の有効化
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 更新日時関数の作成
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

#### ステップ 2: プロファイルテーブル作成

```sql
-- profilesテーブルの作成
CREATE TABLE IF NOT EXISTS profiles (
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
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

-- トリガー作成
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS設定
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view and edit their own profile" ON profiles
  FOR ALL USING (auth.uid() = user_id);
```

#### ステップ 3: その他のテーブル作成

作成された `20250103000002_fix_migration_dependencies.sql` の内容を実行

### 方法 2: ローカル Supabase CLI 使用

```bash
# Supabase CLIのインストール（必要な場合）
npm install -g supabase

# プロジェクトディレクトリで
cd front

# データベースリセット
supabase db reset

# マイグレーション適用
supabase db push
```

### 方法 3: 古いマイグレーションファイルの削除

問題のあるマイグレーションファイルを削除して、新しいファイルのみを使用：

1. `20250102000005_complete_migration.sql` を削除またはリネーム
2. `20250103000002_fix_migration_dependencies.sql` を実行

## 確認事項

マイグレーション後、以下のテーブルが正しく作成されていることを確認：

1. `profiles` - ユーザープロファイル
2. `chat_groups` - チャットグループ
3. `chat_messages` - チャットメッセージ
4. `bookmarks` - ブックマーク

## トラブルシューティング

### エラーが続く場合

1. 既存のテーブルをすべて削除
2. 新しいマイグレーションファイルのみを使用して再作成
3. RLS（Row Level Security）が正しく設定されているか確認

### Supabase CLI が利用できない場合

Supabase ダッシュボードから手動で SQL を実行することをお勧めします。
