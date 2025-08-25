import { createClient } from "@/lib/supabase";
import { Database } from "@/lib/database.types";
import { getUserProfileId } from "./chat-groups";

type Bookmark = Database["public"]["Tables"]["bookmarks"]["Row"];
type BookmarkInsert = Database["public"]["Tables"]["bookmarks"]["Insert"];
type BookmarkUpdate = Database["public"]["Tables"]["bookmarks"]["Update"];
type UserBookmarkView =
  Database["public"]["Views"]["user_bookmarks_view"]["Row"];

/**
 * ブックマークを作成する
 */
export async function createBookmark(
  chatMessageId: string,
  notes?: string
): Promise<Bookmark | null> {
  console.log("createBookmark: 開始", { chatMessageId, notes });

  const supabase = createClient();

  // 現在のユーザーを取得
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    console.error("createBookmark: ユーザーがログインしていません");
    throw new Error("ユーザーがログインしていません");
  }

  // プロファイルIDを取得
  const profileId = await getUserProfileId(user.id);
  if (!profileId) {
    console.error("createBookmark: プロファイルIDが取得できませんでした", {
      userId: user.id,
    });
    throw new Error("プロファイルIDが取得できませんでした");
  }

  const { data, error } = await supabase
    .from("bookmarks")
    .insert({
      profile_id: profileId,
      chat_message_id: chatMessageId,
      notes,
    })
    .select()
    .single();

  if (error) {
    console.error("ブックマーク作成エラー:", {
      error,
      message: error.message,
      chatMessageId,
      profileId,
    });

    if (error.code === "23505") {
      throw new Error("このメッセージは既にブックマークされています");
    }
    throw new Error("ブックマークの作成に失敗しました");
  }

  console.log("createBookmark: 成功", { bookmark: data });
  return data;
}

/**
 * ユーザーのブックマーク一覧を取得する（ビューを使用）
 */
export async function getUserBookmarks(): Promise<UserBookmarkView[]> {
  console.log("getUserBookmarks: 開始");

  const supabase = createClient();

  // 現在のユーザーを取得
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    console.error("getUserBookmarks: ユーザーがログインしていません");
    throw new Error("ユーザーがログインしていません");
  }

  // プロファイルIDを取得
  const profileId = await getUserProfileId(user.id);
  if (!profileId) {
    console.error("getUserBookmarks: プロファイルIDが取得できませんでした", {
      userId: user.id,
    });
    return [];
  }

  const { data, error } = await supabase
    .from("user_bookmarks_view")
    .select("*")
    .eq("profile_id", profileId);

  if (error) {
    console.error("ブックマーク取得エラー:", {
      error,
      message: error.message,
      profileId,
    });
    throw new Error("ブックマークの取得に失敗しました");
  }

  console.log("getUserBookmarks: 成功", { bookmarksCount: data?.length || 0 });
  return data || [];
}

/**
 * 特定のチャットグループのブックマークを取得する
 */
export async function getChatGroupBookmarks(
  chatGroupId: string
): Promise<UserBookmarkView[]> {
  console.log("getChatGroupBookmarks: 開始", { chatGroupId });

  const supabase = createClient();

  // 現在のユーザーを取得
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    console.error("getChatGroupBookmarks: ユーザーがログインしていません");
    throw new Error("ユーザーがログインしていません");
  }

  // プロファイルIDを取得
  const profileId = await getUserProfileId(user.id);
  if (!profileId) {
    console.error(
      "getChatGroupBookmarks: プロファイルIDが取得できませんでした",
      { userId: user.id }
    );
    return [];
  }

  const { data, error } = await supabase
    .from("user_bookmarks_view")
    .select("*")
    .eq("profile_id", profileId)
    .eq("chat_group_id", chatGroupId);

  if (error) {
    console.error("チャットグループブックマーク取得エラー:", {
      error,
      message: error.message,
      chatGroupId,
      profileId,
    });
    throw new Error("チャットグループのブックマーク取得に失敗しました");
  }

  console.log("getChatGroupBookmarks: 成功", {
    bookmarksCount: data?.length || 0,
    chatGroupId,
  });
  return data || [];
}

/**
 * ブックマークを更新する（主にメモの更新）
 */
export async function updateBookmark(
  bookmarkId: string,
  updates: BookmarkUpdate
): Promise<Bookmark | null> {
  console.log("updateBookmark: 開始", { bookmarkId, updates });

  const supabase = createClient();
  const { data, error } = await supabase
    .from("bookmarks")
    .update(updates)
    .eq("id", bookmarkId)
    .select()
    .single();

  if (error) {
    console.error("ブックマーク更新エラー:", {
      error,
      message: error.message,
      bookmarkId,
      updates,
    });
    throw new Error("ブックマークの更新に失敗しました");
  }

  console.log("updateBookmark: 成功", { bookmark: data });
  return data;
}

/**
 * ブックマークのメモを更新する
 */
export async function updateBookmarkNotes(
  bookmarkId: string,
  notes: string
): Promise<Bookmark | null> {
  return updateBookmark(bookmarkId, { notes });
}

/**
 * ブックマークを削除する
 */
export async function deleteBookmark(bookmarkId: string): Promise<boolean> {
  console.log("deleteBookmark: 開始", { bookmarkId });

  const supabase = createClient();
  const { error } = await supabase
    .from("bookmarks")
    .delete()
    .eq("id", bookmarkId);

  if (error) {
    console.error("ブックマーク削除エラー:", {
      error,
      message: error.message,
      bookmarkId,
    });
    throw new Error("ブックマークの削除に失敗しました");
  }

  console.log("deleteBookmark: 成功", { bookmarkId });
  return true;
}

/**
 * 特定のメッセージがブックマークされているかチェックする
 */
export async function isMessageBookmarked(
  chatMessageId: string
): Promise<boolean> {
  console.log("isMessageBookmarked: 開始", { chatMessageId });

  const supabase = createClient();

  // 現在のユーザーを取得
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    console.error("isMessageBookmarked: ユーザーがログインしていません");
    return false;
  }

  // プロファイルIDを取得
  const profileId = await getUserProfileId(user.id);
  if (!profileId) {
    console.error("isMessageBookmarked: プロファイルIDが取得できませんでした", {
      userId: user.id,
    });
    return false;
  }

  const { data, error } = await supabase
    .from("bookmarks")
    .select("id")
    .eq("profile_id", profileId)
    .eq("chat_message_id", chatMessageId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // レコードが見つからない場合
      console.log("isMessageBookmarked: ブックマークされていません", {
        chatMessageId,
      });
      return false;
    }
    console.error("ブックマーク確認エラー:", {
      error,
      message: error.message,
      chatMessageId,
      profileId,
    });
    return false;
  }

  console.log("isMessageBookmarked: ブックマークされています", {
    chatMessageId,
  });
  return !!data;
}

/**
 * メッセージのブックマークを取得する
 */
export async function getMessageBookmark(
  chatMessageId: string
): Promise<Bookmark | null> {
  console.log("getMessageBookmark: 開始", { chatMessageId });

  const supabase = createClient();

  // 現在のユーザーを取得
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    console.error("getMessageBookmark: ユーザーがログインしていません");
    return null;
  }

  // プロファイルIDを取得
  const profileId = await getUserProfileId(user.id);
  if (!profileId) {
    console.error("getMessageBookmark: プロファイルIDが取得できませんでした", {
      userId: user.id,
    });
    return null;
  }

  const { data, error } = await supabase
    .from("bookmarks")
    .select("*")
    .eq("profile_id", profileId)
    .eq("chat_message_id", chatMessageId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // レコードが見つからない場合
      console.log("getMessageBookmark: ブックマークが見つかりません", {
        chatMessageId,
      });
      return null;
    }
    console.error("ブックマーク取得エラー:", {
      error,
      message: error.message,
      chatMessageId,
      profileId,
    });
    return null;
  }

  console.log("getMessageBookmark: 成功", { bookmark: data });
  return data;
}

/**
 * ブックマークの切り替え（追加/削除）
 */
export async function toggleBookmark(
  chatMessageId: string,
  notes?: string
): Promise<{ isBookmarked: boolean; bookmark?: Bookmark }> {
  console.log("toggleBookmark: 開始", { chatMessageId, notes });

  const existingBookmark = await getMessageBookmark(chatMessageId);

  if (existingBookmark) {
    // 既存のブックマークを削除
    await deleteBookmark(existingBookmark.id);
    console.log("toggleBookmark: ブックマーク削除完了", { chatMessageId });
    return { isBookmarked: false };
  } else {
    // 新しいブックマークを作成
    const bookmark = await createBookmark(chatMessageId, notes);
    console.log("toggleBookmark: ブックマーク作成完了", {
      chatMessageId,
      bookmark,
    });
    return { isBookmarked: true, bookmark: bookmark || undefined };
  }
}
