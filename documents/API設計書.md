API 設計書：AI チャット英語学習システム

## 1. 概要

本ドキュメントは、AI チャット英語学習システムの API 設計について定義するものです。
システムは以下の主要機能を提供します：

- チャット機能（AI との対話）
- ブックマーク機能（学習内容の保存・管理）
- 音声合成機能（TTS）
- ユーザー認証機能

## 2. 技術仕様

### 2.1. API 仕様

- **プロトコル**: HTTPS
- **データ形式**: JSON
- **認証方式**: Bearer Token (Supabase Auth)
- **ベース URL**: `https://[project-id].supabase.co`

### 2.2. 共通レスポンス形式

#### 成功レスポンス

```json
{
  "success": true,
  "data": {
    // レスポンスデータ
  },
  "message": "Success"
}
```

#### エラーレスポンス

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "エラーメッセージ",
    "details": {}
  }
}
```

### 2.3. 認証ヘッダー

```
Authorization: Bearer {access_token}
Content-Type: application/json
```

## 3. エンドポイント設計

### 3.1. 認証関連 API

#### 3.1.1. ユーザー登録

```
POST /auth/v1/signup
```

**リクエストボディ:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**レスポンス:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "created_at": "2024-01-01T00:00:00Z"
    },
    "session": {
      "access_token": "jwt_token",
      "refresh_token": "refresh_token",
      "expires_at": "2024-01-01T01:00:00Z"
    }
  }
}
```

#### 3.1.2. ログイン

```
POST /auth/v1/token?grant_type=password
```

**リクエストボディ:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**レスポンス:**

```json
{
  "access_token": "jwt_token",
  "refresh_token": "refresh_token",
  "expires_in": 3600,
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

#### 3.1.3. ログアウト

```
POST /auth/v1/logout
```

**ヘッダー:**

```
Authorization: Bearer {access_token}
```

**レスポンス:**

```json
{
  "success": true,
  "message": "ログアウトしました"
}
```

### 3.2. チャット関連 API

#### 3.2.1. 会話一覧取得

```
GET /rest/v1/conversations?user_id=eq.{user_id}&order=created_at.desc
```

**ヘッダー:**

```
Authorization: Bearer {access_token}
apikey: {supabase_anon_key}
```

**レスポンス:**

```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "title": "会議で使える英語フレーズ",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:30:00Z"
  }
]
```

#### 3.2.2. 特定の会話のメッセージ取得

```
GET /rest/v1/messages?conversation_id=eq.{conversation_id}&order=created_at.asc
```

**ヘッダー:**

```
Authorization: Bearer {access_token}
apikey: {supabase_anon_key}
```

**レスポンス:**

```json
[
  {
    "id": "uuid",
    "conversation_id": "uuid",
    "role": "user",
    "content": "会議で使えるフレーズを教えて",
    "created_at": "2024-01-01T00:00:00Z"
  },
  {
    "id": "uuid",
    "conversation_id": "uuid",
    "role": "assistant",
    "content": "会議で使える英語フレーズをご紹介します！",
    "created_at": "2024-01-01T00:00:30Z"
  }
]
```

#### 3.2.3. メッセージ送信（AI 応答生成）

```
POST /api/v1/chat/message
```

**リクエストボディ:**

```json
{
  "conversation_id": "uuid",
  "message": "会議で使えるフレーズを教えて"
}
```

**レスポンス:**

```json
{
  "success": true,
  "data": {
    "user_message": {
      "id": "uuid",
      "conversation_id": "uuid",
      "role": "user",
      "content": "会議で使えるフレーズを教えて",
      "created_at": "2024-01-01T00:00:00Z"
    },
    "ai_response": {
      "id": "uuid",
      "conversation_id": "uuid",
      "role": "assistant",
      "content": "会議で使える英語フレーズをご紹介します！",
      "created_at": "2024-01-01T00:00:30Z"
    },
    "suggestions": [
      {
        "id": "uuid",
        "message_id": "uuid",
        "english_text": "Let's get started with today's agenda.",
        "japanese_translation": "今日のアジェンダを始めましょう。",
        "suggestion_order": 1,
        "created_at": "2024-01-01T00:00:30Z"
      },
      {
        "id": "uuid",
        "message_id": "uuid",
        "english_text": "Could you please clarify your point?",
        "japanese_translation": "あなたの要点を明確にしていただけますか？",
        "suggestion_order": 2,
        "created_at": "2024-01-01T00:00:30Z"
      },
      {
        "id": "uuid",
        "message_id": "uuid",
        "english_text": "I'd like to add something to that.",
        "japanese_translation": "それに付け加えたいことがあります。",
        "suggestion_order": 3,
        "created_at": "2024-01-01T00:00:30Z"
      }
    ]
  }
}
```

#### 3.2.4. 新しい会話作成

```
POST /rest/v1/conversations
```

**ヘッダー:**

```
Authorization: Bearer {access_token}
apikey: {supabase_anon_key}
Content-Type: application/json
```

**リクエストボディ:**

```json
{
  "title": "会議で使える英語フレーズ"
}
```

**レスポンス:**

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "title": "会議で使える英語フレーズ",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

#### 3.2.5. AI 提案メッセージ取得

```
GET /rest/v1/ai_suggestions?message_id=eq.{message_id}&order=suggestion_order.asc
```

**ヘッダー:**

```
Authorization: Bearer {access_token}
apikey: {supabase_anon_key}
```

**レスポンス:**

```json
[
  {
    "id": "uuid",
    "message_id": "uuid",
    "english_text": "Let's get started with today's agenda.",
    "japanese_translation": "今日のアジェンダを始めましょう。",
    "suggestion_order": 1,
    "created_at": "2024-01-01T00:00:30Z"
  },
  {
    "id": "uuid",
    "message_id": "uuid",
    "english_text": "Could you please clarify your point?",
    "japanese_translation": "あなたの要点を明確にしていただけますか？",
    "suggestion_order": 2,
    "created_at": "2024-01-01T00:00:30Z"
  },
  {
    "id": "uuid",
    "message_id": "uuid",
    "english_text": "I'd like to add something to that.",
    "japanese_translation": "それに付け加えたいことがあります。",
    "suggestion_order": 3,
    "created_at": "2024-01-01T00:00:30Z"
  }
]
```

### 3.3. ブックマーク関連 API

#### 3.3.1. ブックマーク一覧取得（ビュー使用）

```
GET /rest/v1/user_bookmarks_view?user_id=eq.{user_id}&order=bookmarked_at.desc
```

**ヘッダー:**

```
Authorization: Bearer {access_token}
apikey: {supabase_anon_key}
```

**レスポンス:**

```json
[
  {
    "bookmark_id": "uuid",
    "user_id": "uuid",
    "bookmarked_at": "2024-01-01T00:00:00Z",
    "suggestion_id": "uuid",
    "english_text": "Let's get started with today's agenda.",
    "japanese_translation": "今日のアジェンダを始めましょう。",
    "suggestion_order": 1,
    "message_id": "uuid",
    "conversation_id": "uuid",
    "conversation_title": "会議で使える英語フレーズ"
  }
]
```

#### 3.3.2. ブックマーク追加

```
POST /rest/v1/bookmarks
```

**ヘッダー:**

```
Authorization: Bearer {access_token}
apikey: {supabase_anon_key}
Content-Type: application/json
```

**リクエストボディ:**

```json
{
  "ai_suggestion_id": "uuid"
}
```

**レスポンス:**

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "ai_suggestion_id": "uuid",
  "created_at": "2024-01-01T00:00:00Z"
}
```

#### 3.3.3. ブックマーク削除

```
DELETE /rest/v1/bookmarks?id=eq.{bookmark_id}
```

**ヘッダー:**

```
Authorization: Bearer {access_token}
apikey: {supabase_anon_key}
```

**レスポンス:**
204 No Content（正常削除時）

#### 3.3.4. ブックマーク状態確認

```
GET /rest/v1/bookmarks?ai_suggestion_id=eq.{ai_suggestion_id}&select=id
```

**ヘッダー:**

```
Authorization: Bearer {access_token}
apikey: {supabase_anon_key}
```

**レスポンス:**

```json
[
  {
    "id": "uuid"
  }
]
```

または空配列 `[]` （ブックマークされていない場合）

### 3.4. 音声合成（TTS）関連 API

#### 3.4.1. 音声生成

```
POST /api/v1/tts/generate
```

**リクエストボディ:**

```json
{
  "text": "Let's get started with today's agenda.",
  "language": "en-US",
  "voice": "default"
}
```

**レスポンス:**

```json
{
  "success": true,
  "data": {
    "audio_url": "https://storage.supabase.co/audio/uuid.mp3",
    "duration": 3.5,
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

#### 3.4.2. 音声ファイル取得

```
GET /storage/v1/object/audio/{file_id}.mp3
```

**レスポンス:**
音声ファイル（バイナリデータ）

## 4. データベーススキーマ連携

### 4.1. Supabase テーブル操作

#### 4.1.1. RLS（Row Level Security）ポリシー

各テーブルには以下の RLS ポリシーを適用：

- **profiles**: ユーザーは自分のプロファイルのみアクセス可能
- **conversations**: ユーザーは自分の会話のみアクセス可能
- **messages**: ユーザーは自分の会話内のメッセージのみアクセス可能
- **ai_suggestions**: ユーザーは自分の会話内の提案のみアクセス可能
- **bookmarks**: ユーザーは自分のブックマークのみアクセス可能

#### 4.1.2. リアルタイム機能

```javascript
// チャットメッセージのリアルタイム購読
supabase
  .channel("chat_messages")
  .on(
    "postgres_changes",
    {
      event: "INSERT",
      schema: "public",
      table: "messages",
      filter: `conversation_id=eq.${conversationId}`,
    },
    (payload) => {
      // 新しいメッセージの処理
    }
  )
  .subscribe();

// AI提案のリアルタイム購読
supabase
  .channel("ai_suggestions")
  .on(
    "postgres_changes",
    {
      event: "INSERT",
      schema: "public",
      table: "ai_suggestions",
      filter: `message_id=eq.${messageId}`,
    },
    (payload) => {
      // 新しい提案の処理
    }
  )
  .subscribe();
```

## 5. エラーハンドリング

### 5.1. HTTP ステータスコード

| ステータスコード | 説明                  | 使用場面                   |
| ---------------- | --------------------- | -------------------------- |
| 200              | OK                    | 正常な処理                 |
| 201              | Created               | リソース作成成功           |
| 400              | Bad Request           | リクエストパラメータエラー |
| 401              | Unauthorized          | 認証エラー                 |
| 403              | Forbidden             | 権限エラー                 |
| 404              | Not Found             | リソースが見つからない     |
| 429              | Too Many Requests     | レート制限                 |
| 500              | Internal Server Error | サーバーエラー             |

### 5.2. エラーコード一覧

| エラーコード     | メッセージ                       | 説明                   |
| ---------------- | -------------------------------- | ---------------------- |
| AUTH_001         | 認証に失敗しました               | 無効なトークン         |
| AUTH_002         | ログインが必要です               | 未認証状態             |
| CONVERSATION_001 | 会話の作成に失敗しました         | 会話作成エラー         |
| CONVERSATION_002 | 会話が見つかりません             | 存在しない会話         |
| MESSAGE_001      | メッセージの送信に失敗しました   | メッセージ機能エラー   |
| MESSAGE_002      | AI 応答の生成に失敗しました      | AI 連携エラー          |
| SUGGESTION_001   | 提案の取得に失敗しました         | AI 提案取得エラー      |
| BOOKMARK_001     | ブックマークの追加に失敗しました | ブックマーク機能エラー |
| BOOKMARK_002     | ブックマークが見つかりません     | 存在しないブックマーク |
| BOOKMARK_003     | 既にブックマーク済みです         | 重複ブックマークエラー |
| TTS_001          | 音声生成に失敗しました           | TTS 機能エラー         |
| RATE_001         | リクエスト回数が上限を超えました | レート制限             |

## 6. セキュリティ要件

### 6.1. 認証・認可

- JWT Bearer Token による認証
- Supabase RLS によるデータアクセス制御
- セッション有効期限の管理

### 6.2. データ保護

- HTTPS 通信の強制
- SQL Injection の防御
- XSS 攻撃の防御
- CSRF 攻撃の防御

### 6.3. レート制限

- API 呼び出し回数制限：ユーザーあたり 100 回/分
- AI 応答生成：ユーザーあたり 20 回/分
- 音声生成：ユーザーあたり 50 回/分

## 7. パフォーマンス要件

### 7.1. レスポンス時間

- 会話一覧取得：200ms 以内
- メッセージ取得：300ms 以内
- メッセージ送信：500ms 以内
- AI 応答生成：5 秒以内
- AI 提案取得：200ms 以内
- ブックマーク操作：200ms 以内
- 音声生成：2 秒以内

### 7.2. 可用性

- システム稼働率：99.5%以上
- ダウンタイム：月間 3.6 時間以内

## 8. 監視・ログ

### 8.1. ログ出力項目

- API リクエスト/レスポンス
- エラー情報
- パフォーマンスメトリクス
- セキュリティイベント

### 8.2. 監視指標

- レスポンス時間
- エラー率
- API 呼び出し回数
- ユーザーアクティビティ

## 9. 運用・保守

### 9.1. デプロイメント

- Vercel による自動デプロイ
- 環境変数の管理
- データベースマイグレーション

### 9.2. バックアップ

- Supabase による自動バックアップ
- 日次バックアップの実行
- ポイントインタイムリカバリ

## 10. 今後の拡張計画

### 10.1. 機能拡張

- 多言語対応（英語以外の言語学習）
- 学習進捗の分析機能
- カスタム音声の選択機能
- プロファイル設定の拡張

### 10.2. API 拡張

- GraphQL API の追加
- WebSocket によるリアルタイム通信
- 外部サービス連携 API
- 学習統計レポート API

---

**文書バージョン**: 1.0  
**作成日**: 2024 年  
**最終更新日**: 2024 年
