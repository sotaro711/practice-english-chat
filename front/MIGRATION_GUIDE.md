# DB 構造移行ガイド

## 概要

このガイドでは、既存の `conversations` + `messages` 構造から新しい `chat_groups` + `chat_messages` 構造への移行手順を説明します。

## 新しい構造の特徴

- **profiles**: ユーザープロファイル（変更なし）
- **chat_groups**: チャットグループ（conversations の後継）
- **chat_messages**: チャットメッセージ（messages の後継）
- **bookmarks**: ブックマーク（chat_messages を参照するよう変更）

## 移行手順

### 1. マイグレーション実行

```bash
cd front
npx supabase migration up --local
```

または本番環境の場合：

```bash
npx supabase db push
```

### 2. 型定義の確認

`front/lib/database.types.ts` が新しい構造に対応していることを確認してください。

### 3. 新しいライブラリの使用

#### 3.1 チャットグループ操作

```typescript
import {
  getChatGroups,
  createChatGroup,
  getChatGroupsSummary,
} from "@/lib/chat-groups";

// チャットグループ一覧取得
const groups = await getChatGroups(userId);

// 新しいチャットグループ作成
const newGroup = await createChatGroup(
  userId,
  "学習用グループ",
  "英語学習専用"
);

// チャットグループ概要取得（メッセージ数、最新メッセージ等）
const summaries = await getChatGroupsSummary(userId);
```

#### 3.2 チャットメッセージ操作

```typescript
import {
  getChatMessages,
  createChatMessage,
  getChatMessagesPaginated,
} from "@/lib/chat-messages";

// メッセージ一覧取得
const messages = await getChatMessages(chatGroupId);

// 新しいメッセージ作成
const newMessage = await createChatMessage({
  chat_group_id: chatGroupId,
  role: "user",
  content: "こんにちは",
  metadata: { model: "gemini-2.0-flash-exp" },
});

// ページネーション付きメッセージ取得
const { data, count, hasMore } = await getChatMessagesPaginated(
  chatGroupId,
  0,
  50
);
```

#### 3.3 ブックマーク操作

```typescript
import {
  getUserBookmarks,
  createBookmark,
  toggleBookmark,
  updateBookmarkNotes,
} from "@/lib/bookmarks";

// ブックマーク一覧取得
const bookmarks = await getUserBookmarks();

// ブックマーク作成
const bookmark = await createBookmark(chatMessageId, "重要なフレーズ");

// ブックマーク切り替え
const { isBookmarked } = await toggleBookmark(chatMessageId);

// ブックマークメモ更新
await updateBookmarkNotes(bookmarkId, "更新されたメモ");
```

### 4. 新しいページの使用

#### 4.1 チャットページ

新しいチャットページ: `/chat/new`

特徴：

- チャットグループの作成・選択
- グループ別メッセージ管理
- リアルタイムブックマーク機能

#### 4.2 ブックマークページ

新しいブックマークページ: `/bookmarks/new`

特徴：

- ビューベースの効率的なデータ取得
- メモ機能付きブックマーク
- チャットグループ別表示

## 主な変更点

### データベース

1. **chat_groups テーブル**

   - `profile_id` を参照（`user_id` ではない）
   - `name` フィールドが必須
   - `is_active` フラグの追加
   - `description` フィールドの追加

2. **chat_messages テーブル**

   - `chat_group_id` を参照
   - `metadata` JSONB フィールドの追加

3. **bookmarks テーブル**
   - `profile_id` + `chat_message_id` の参照
   - `notes` フィールドの追加

### ビュー

1. **user_bookmarks_view**

   - チャットグループ情報を含む包括的なブックマーク表示

2. **chat_group_summary_view**
   - メッセージ数、最新メッセージ等の概要情報

## トラブルシューティング

### マイグレーション失敗時

1. Supabase コンソールでテーブル状態を確認
2. 手動で RLS ポリシーとビューを確認
3. 必要に応じて手動で修正

### データ整合性の確認

```sql
-- プロファイルとチャットグループの関係確認
SELECT p.user_id, p.id as profile_id, COUNT(cg.id) as group_count
FROM profiles p
LEFT JOIN chat_groups cg ON p.id = cg.profile_id
GROUP BY p.user_id, p.id;

-- チャットグループとメッセージの関係確認
SELECT cg.name, COUNT(cm.id) as message_count
FROM chat_groups cg
LEFT JOIN chat_messages cm ON cg.id = cm.chat_group_id
GROUP BY cg.id, cg.name;
```

## パフォーマンス最適化

### インデックス

新しい構造では以下のインデックスが設定されています：

- `chat_groups`: `profile_id`, `created_at`, `is_active`
- `chat_messages`: `chat_group_id`, `created_at`, `role`
- `bookmarks`: `profile_id`, `chat_message_id`, `created_at`

### クエリ最適化のヒント

1. チャットグループ概要には `chat_group_summary_view` を使用
2. ブックマーク表示には `user_bookmarks_view` を使用
3. メッセージのページネーションを活用
4. 不要なメタデータは避ける

## 注意事項

1. **プロファイル依存**: 全ての操作は `profiles` テーブルのレコード存在が前提
2. **RLS ポリシー**: 新しいポリシーによりプロファイルベースのアクセス制御
3. **型安全性**: TypeScript 定義を活用した型安全な実装
4. **エラーハンドリング**: 各ライブラリ関数は適切なエラーハンドリングを実装

## 今後の拡張

この新しい構造により、以下の機能が容易に実装可能：

- チャットグループの共有
- グループ別の学習統計
- AI モデル別の分析
- 高度なブックマーク分類
- メッセージの検索・フィルタリング

---

更新日: 2025 年 1 月 2 日
