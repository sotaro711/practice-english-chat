This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Supabase 認証設定

このプロジェクトでは Supabase を使用した認証機能が実装されています。

### 環境変数の設定

1. `env.example` ファイルを `.env.local` にコピーしてください：

```bash
cp env.example .env.local
```

2. `.env.local` ファイルを編集し、Supabase の設定値を入力してください：

```env
# Supabaseプロジェクトの設定値を入力
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### セキュリティについて

- `NEXT_PUBLIC_*` で始まる環境変数はクライアントサイドに露出されます
- `SUPABASE_SERVICE_ROLE_KEY` はサーバーサイドでのみ使用され、ブラウザには露出されません
- 新規登録はサーバーアクションを使用して安全に実行されます

### 認証機能

- **新規登録**: `/auth/signup` - メール認証付きの新規アカウント作成
- **認証コールバック**: `/auth/callback` - メール確認後の処理

## Getting Started

First, run the development server:

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
