# AI チャット英語学習システム - フロントエンド

Next.js 15 と Supabase を使用した AI 英語学習アプリケーションです。

## 🚀 セットアップ

### 1. 依存関係のインストール

```bash
yarn install
```

### 2. 環境変数の設定

`.env.local`ファイルを作成し、以下の環境変数を設定してください：

```bash
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# アプリケーション設定
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**環境変数の取得方法：**

1. [Supabase](https://supabase.com)でプロジェクトを作成
2. プロジェクト設定 → API 設定から以下を取得：
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon/public` キー → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` キー → `SUPABASE_SERVICE_ROLE_KEY`（秘密キー）

### 3. Supabase の設定

#### 認証設定

1. Supabase ダッシュボード → Authentication → Settings
2. **Site URL**: `http://localhost:3000`（開発環境）
3. **Redirect URLs**:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/dashboard`

#### メール設定

1. Authentication → Settings → SMTP Settings
2. メール確認を有効にする場合は、SMTP を設定してください

### 4. 開発サーバーの起動

```bash
yarn dev
```

アプリケーションは [http://localhost:3000](http://localhost:3000) で起動します。

## 🏗️ 実装済み機能

### 認証機能

- ✅ 新規登録（メール/パスワード）
- ✅ ログイン（メール/パスワード）
- ✅ パスワードリセット
- ✅ エラーハンドリング
- 🔄 Google ログイン（準備中）

### 画面構成

- ✅ `/auth/signup` - 新規登録画面
- ✅ `/auth/login` - ログイン画面
- ✅ `/auth/reset-password` - パスワードリセット画面
- ✅ `/auth/error` - エラー画面
- ✅ `/auth/callback` - 認証コールバック
- ✅ `/dashboard` - ダッシュボード

## 📁 プロジェクト構成

```
front/
├── app/
│   ├── auth/
│   │   ├── login/page.tsx      # ログイン画面
│   │   ├── signup/page.tsx     # 新規登録画面
│   │   ├── reset-password/page.tsx # パスワードリセット画面
│   │   ├── error/page.tsx      # エラー画面
│   │   └── callback/page.tsx   # 認証コールバック
│   ├── dashboard/page.tsx      # ダッシュボード
│   ├── layout.tsx             # ルートレイアウト
│   └── page.tsx               # ホームページ
├── lib/
│   ├── auth-actions.ts        # サーバーアクション
│   ├── auth.ts               # 認証関数
│   ├── supabase.ts           # クライアントサイドSupabase
│   ├── supabase-server.ts    # サーバーサイドSupabase
│   └── database.types.ts     # データベース型定義
└── ...
```

## 🛠️ 技術スタック

- **フレームワーク**: Next.js 15（App Router）
- **認証**: Supabase Auth
- **データベース**: Supabase PostgreSQL
- **UI**: Tailwind CSS
- **言語**: TypeScript
- **パッケージマネージャー**: Yarn

## 🔧 開発ガイド

### Server Actions の使用

このプロジェクトでは、Next.js 15 の Server Actions を使用して認証処理を実装しています：

```typescript
// lib/auth-actions.ts
export async function signIn(formData: FormData) {
  // サーバーサイドでの認証処理
}
```

### エラーハンドリング

認証エラーは適切に日本語化され、ユーザーフレンドリーなメッセージが表示されます：

- 無効な認証情報
- メール確認未完了
- レート制限エラー
- サーバーエラー

### セキュリティ

- サーバーサイドでのバリデーション
- CSRF 保護
- 環境変数による機密情報の管理
- Supabase RLS（Row Level Security）

## 📝 今後の実装予定

- [ ] Google ログイン機能
- [ ] チャット機能
- [ ] ブックマーク機能
- [ ] 設定画面
- [ ] 音声再生機能
- [ ] PWA 対応

## 🚀 デプロイ

### Vercel へのデプロイ

1. Vercel アカウントでプロジェクトをインポート
2. 環境変数を設定：

   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SITE_URL` (本番環境の URL)

3. ビルドコマンド: `yarn build`
4. デプロイ

### Supabase の本番環境設定

1. 本番環境のサイト URL を追加
2. Redirect URLs を更新
3. メール設定の確認

## 🐛 トラブルシューティング

### よくある問題

1. **認証エラー**: 環境変数が正しく設定されているか確認
2. **リダイレクトエラー**: Supabase の認証設定で Redirect URLs を確認
3. **メール送信**: SMTP 設定または Supabase のメール制限を確認

### デバッグ

開発環境でのデバッグログは、ブラウザのコンソールとサーバーログで確認できます。

## 📞 サポート

問題が発生した場合は、以下を確認してください：

1. 環境変数の設定
2. Supabase プロジェクトの状態
3. ネットワーク接続
4. ブラウザのコンソールエラー
