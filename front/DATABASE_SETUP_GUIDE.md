# データベースセットアップガイド

## 問題の概要

`Could not find the table 'public.profiles' in the schema cache` エラーが発生している場合、プロファイルテーブルが Supabase データベースに正しく作成されていません。

## 解決方法

### 手順 1: Supabase 管理画面にアクセス

1. [Supabase Dashboard](https://supabase.com/dashboard) にアクセス
2. プロジェクト `sqebedvlhtopzptisgbh` を選択
3. 左サイドバーの「SQL Editor」をクリック

### 手順 2: データベースセットアップスクリプトの実行

1. SQL Editor で新しいクエリを作成
2. `front/database-setup.sql` の内容をコピー＆ペースト
3. 「Run」ボタンをクリックして実行

### 手順 3: 実行結果の確認

スクリプトが正常に実行されると、以下が作成されます：

- ✅ `profiles` テーブル
- ✅ 必要なインデックス
- ✅ Row Level Security (RLS) ポリシー
- ✅ 自動更新トリガー
- ✅ 新規ユーザー作成時の自動プロファイル作成トリガー
- ✅ 既存ユーザーのプロファイル作成

### 手順 4: 動作確認

1. アプリケーションを再読み込み
2. ログインページで「プロファイル情報を表示」ボタンをクリック
3. エラーが表示されなくなり、プロファイル情報が正常に表示される

## 作成されるプロファイルテーブルの構造

```sql
profiles (
  id                    UUID PRIMARY KEY     -- プロファイルID
  user_id               UUID NOT NULL        -- ユーザーID (auth.users.id)
  username              TEXT                 -- ユーザー名
  display_name          TEXT                 -- 表示名
  avatar_url            TEXT                 -- アバター画像URL
  learning_preferences  JSONB                -- 学習設定 (JSON形式)
  created_at            TIMESTAMP            -- 作成日時
  updated_at            TIMESTAMP            -- 更新日時
)
```

## トラブルシューティング

### エラーが継続する場合

1. **権限エラー**: Supabase プロジェクトの管理者権限を確認
2. **RLS エラー**: ポリシーが正しく設定されているか確認
3. **接続エラー**: `.env.local` ファイルの環境変数を確認

### ログの確認方法

1. ブラウザの Developer Tools (F12) を開く
2. Console タブでエラーメッセージを確認
3. Network タブでリクエストの詳細を確認

## セキュリティ設定

- **Row Level Security (RLS)**: 有効化済み
- **ポリシー**: ユーザーは自分のプロファイルのみアクセス可能
- **外部キー制約**: `auth.users` との連携確保

## 追加機能

### 自動プロファイル作成

新規ユーザー登録時に自動的にプロファイルが作成されます：

```sql
-- トリガー関数により自動実行
INSERT INTO profiles (user_id, username, display_name)
VALUES (NEW.id, metadata->'username', metadata->'display_name');
```

### 自動更新日時

プロファイル更新時に `updated_at` が自動更新されます。

## サポート

問題が解決しない場合は、以下の情報とともにお問い合わせください：

1. エラーメッセージの詳細
2. ブラウザのコンソールログ
3. 実行した SQL クエリの結果
4. Supabase プロジェクトの設定状況
