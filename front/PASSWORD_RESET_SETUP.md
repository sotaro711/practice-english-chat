# パスワードリセット機能セットアップガイド

## 📋 概要

このドキュメントでは、パスワードリセット機能の設定と運用について説明します。

## 🔧 開発環境での設定

### 1. 環境変数の設定

`.env.local`ファイルを作成し、以下の設定を行ってください：

```env
# 開発環境用URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 2. Supabase の設定確認

`supabase/config.toml`で以下が正しく設定されていることを確認：

```toml
[auth]
site_url = "http://localhost:3000"
additional_redirect_urls = ["http://localhost:3000"]
enable_signup = true

[auth.email]
enable_signup = true
enable_confirmations = true
secure_password_change = false
max_frequency = "1s"
otp_expiry = 3600
```

### 3. 開発環境でのメールテスト

開発環境では、実際のメールは送信されません。代わりに Inbucket を使用：

1. `yarn dev`でアプリケーションを起動
2. `http://localhost:54324`で Inbucket（メールテスト画面）にアクセス
3. パスワードリセットを実行
4. Inbucket でメール内容を確認
5. メール内のリンクをクリックして動作テスト

## 🚀 本番環境での設定

### 1. 環境変数（本番環境）

```env
# 本番環境用URL
NEXT_PUBLIC_SITE_URL=https://yourdomain.com

# Vercel環境の場合は自動設定
NEXT_PUBLIC_VERCEL_URL=your-app.vercel.app

# メール送信用（SendGrid例）
SENDGRID_API_KEY=your_sendgrid_api_key
```

### 2. SMTP 設定（本番環境）

`supabase/config.toml`に SMTP 設定を追加：

```toml
[auth.email.smtp]
enabled = true
host = "smtp.sendgrid.net"
port = 587
user = "apikey"
pass = "env(SENDGRID_API_KEY)"
admin_email = "noreply@yourdomain.com"
sender_name = "AI チャット英語学習システム"
```

### 3. DNS 設定

メールの到達率向上のため、以下の DNS 設定を行ってください：

- **SPF**: TXT レコードに`v=spf1 include:sendgrid.net ~all`
- **DKIM**: SendGrid から提供される DKIM キーを設定
- **DMARC**: TXT レコードに`v=DMARC1; p=quarantine; rua=mailto:admin@yourdomain.com`

## 🔄 フロー解説

### パスワードリセットフロー

1. **メール送信**: `/auth/reset-password`でメールアドレス入力
2. **メール受信**: ユーザーがリセットメールを受信
3. **リンククリック**: メール内のリンクをクリック
4. **コールバック処理**: `/auth/password-reset-callback`で認証
5. **パスワード更新**: `/auth/update-password`で新しいパスワード設定

### セキュリティ機能

- ✅ メールアドレス形式検証
- ✅ レート制限（1 時間に 2 通まで）
- ✅ トークン有効期限（1 時間）
- ✅ セッション検証
- ✅ パスワード強度チェック
- ✅ 詳細なログ記録

## 🐛 トラブルシューティング

### よくある問題

#### メールが届かない

- スパムフォルダを確認
- メールプロバイダーの制限を確認
- SMTP 設定と DNS 設定を確認

#### リンクが無効

- トークンの有効期限（1 時間）を確認
- リダイレクト URL の設定を確認
- ブラウザのキャッシュをクリア

#### 環境変数エラー

- `.env.local`ファイルの存在と内容を確認
- `NEXT_PUBLIC_SITE_URL`の設定を確認

### デバッグ方法

1. **ログ確認**: ブラウザの開発者ツールでコンソールログを確認
2. **Inbucket**: 開発環境でメール内容を確認
3. **Supabase Dashboard**: 認証ログとユーザー状態を確認

```bash
# ログ確認コマンド例
yarn dev
# 別ターミナルで
curl -X POST http://localhost:3000/api/debug/auth
```

## 📚 関連ファイル

- `lib/auth-actions.ts`: サーバーアクション
- `app/auth/reset-password/page.tsx`: リセットページ
- `app/auth/password-reset-callback/`: コールバック処理
- `app/auth/update-password/page.tsx`: パスワード更新ページ
- `supabase/config.toml`: Supabase 設定

## ⚡ 最適化のヒント

1. **メール到達率向上**

   - 信頼できる SMTP プロバイダーを使用
   - DNS 設定を適切に行う
   - メール内容を最適化

2. **ユーザビリティ向上**

   - 明確なエラーメッセージ
   - 適切なローディング状態
   - セキュリティガイダンス

3. **セキュリティ強化**
   - レート制限の調整
   - トークン有効期限の最適化
   - ログ監視の実装

## 📞 サポート

問題が発生した場合は、以下を確認してください：

1. 環境変数の設定
2. Supabase 設定
3. ログファイル
4. ネットワーク接続

それでも解決しない場合は、デバッグ情報と共にお問い合わせください。
