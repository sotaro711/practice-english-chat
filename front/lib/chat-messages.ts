import { createClient } from "@/lib/supabase";
import { Database } from "@/lib/database.types";

type ChatMessage = Database["public"]["Tables"]["chat_messages"]["Row"];
type ChatMessageInsert =
  Database["public"]["Tables"]["chat_messages"]["Insert"];
type ChatMessageUpdate =
  Database["public"]["Tables"]["chat_messages"]["Update"];

/**
 * チャットメッセージを取得する
 */
export async function getChatMessages(chatGroupId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("chat_group_id", chatGroupId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching chat messages:", error);
    throw new Error("チャットメッセージの取得に失敗しました");
  }

  return data as ChatMessage[];
}

/**
 * チャットメッセージを作成する
 */
export async function createChatMessage(message: ChatMessageInsert) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("chat_messages")
    .insert(message)
    .select()
    .single();

  if (error) {
    console.error("Error creating chat message:", error);
    throw new Error("チャットメッセージの作成に失敗しました");
  }

  return data as ChatMessage;
}

/**
 * 複数のチャットメッセージを一括作成する
 */
export async function createChatMessages(messages: ChatMessageInsert[]) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("chat_messages")
    .insert(messages)
    .select();

  if (error) {
    console.error("Error creating chat messages:", error);
    throw new Error("チャットメッセージの一括作成に失敗しました");
  }

  return data as ChatMessage[];
}

/**
 * チャットメッセージを更新する
 */
export async function updateChatMessage(
  id: string,
  updates: ChatMessageUpdate
) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("chat_messages")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating chat message:", error);
    throw new Error("チャットメッセージの更新に失敗しました");
  }

  return data as ChatMessage;
}

/**
 * チャットメッセージを削除する
 */
export async function deleteChatMessage(id: string) {
  const supabase = createClient();

  const { error } = await supabase.from("chat_messages").delete().eq("id", id);

  if (error) {
    console.error("Error deleting chat message:", error);
    throw new Error("チャットメッセージの削除に失敗しました");
  }
}

/**
 * チャットグループの最新メッセージを取得する
 */
export async function getLatestChatMessage(chatGroupId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("chat_group_id", chatGroupId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // メッセージが存在しない場合
      return null;
    }
    console.error("Error fetching latest chat message:", error);
    throw new Error("最新メッセージの取得に失敗しました");
  }

  return data as ChatMessage;
}

/**
 * チャットグループのメッセージ数を取得する
 */
export async function getChatMessageCount(chatGroupId: string) {
  const supabase = createClient();

  const { count, error } = await supabase
    .from("chat_messages")
    .select("*", { count: "exact", head: true })
    .eq("chat_group_id", chatGroupId);

  if (error) {
    console.error("Error fetching chat message count:", error);
    throw new Error("メッセージ数の取得に失敗しました");
  }

  return count || 0;
}

/**
 * 指定された日付範囲のチャットメッセージを取得する
 */
export async function getChatMessagesByDateRange(
  chatGroupId: string,
  startDate: string,
  endDate: string
) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("chat_group_id", chatGroupId)
    .gte("created_at", startDate)
    .lte("created_at", endDate)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching chat messages by date range:", error);
    throw new Error("指定期間のメッセージ取得に失敗しました");
  }

  return data as ChatMessage[];
}

/**
 * チャットメッセージをページネーションで取得する
 */
export async function getChatMessagesPaginated(
  chatGroupId: string,
  page: number = 0,
  pageSize: number = 50
) {
  const supabase = createClient();

  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from("chat_messages")
    .select("*", { count: "exact" })
    .eq("chat_group_id", chatGroupId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("Error fetching paginated chat messages:", error);
    throw new Error("ページネーションメッセージの取得に失敗しました");
  }

  return {
    data: (data as ChatMessage[]).reverse(), // 時系列順に並び替え
    count: count || 0,
    hasMore: (count || 0) > to + 1,
  };
}

/**
 * チャットメッセージ内を検索する
 */
export async function searchChatMessages(
  chatGroupId: string,
  searchTerm: string
) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("chat_group_id", chatGroupId)
    .textSearch("content", searchTerm)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error searching chat messages:", error);
    throw new Error("メッセージ検索に失敗しました");
  }

  return data as ChatMessage[];
}
