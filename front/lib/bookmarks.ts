import { supabase } from "./supabase";

export interface Bookmark {
  id: string;
  user_id: string;
  english_text: string;
  japanese_text: string;
  created_at: string;
}

// ブックマーク追加
export async function addBookmark(englishText: string, japaneseText: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("ユーザーがログインしていません");
  }

  const { data, error } = await supabase
    .from("bookmarks")
    .insert({
      user_id: user.id,
      english_text: englishText,
      japanese_text: japaneseText,
    })
    .select()
    .single();

  return { data, error };
}

// ブックマーク一覧取得
export async function getBookmarks() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("ユーザーがログインしていません");
  }

  const { data, error } = await supabase
    .from("bookmarks")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return { data, error };
}

// ブックマーク削除
export async function deleteBookmark(bookmarkId: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("ユーザーがログインしていません");
  }

  const { error } = await supabase
    .from("bookmarks")
    .delete()
    .eq("id", bookmarkId)
    .eq("user_id", user.id);

  return { error };
}
