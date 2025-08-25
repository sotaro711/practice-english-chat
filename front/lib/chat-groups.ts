import { supabase } from "./supabase";
import { Database } from "./database.types";
import { getOrCreateUserProfile } from "./profiles";

type ChatGroup = Database["public"]["Tables"]["chat_groups"]["Row"];
type ChatGroupInsert = Database["public"]["Tables"]["chat_groups"]["Insert"];
type ChatGroupUpdate = Database["public"]["Tables"]["chat_groups"]["Update"];

type Conversation = Database["public"]["Tables"]["conversations"]["Row"];
type ConversationInsert =
  Database["public"]["Tables"]["conversations"]["Insert"];

type Message = Database["public"]["Tables"]["messages"]["Row"];
type MessageInsert = Database["public"]["Tables"]["messages"]["Insert"];

/**
 * ユーザーのプロファイルIDを取得する（存在しない場合は作成）
 */
export async function getUserProfileId(userId: string): Promise<string | null> {
  console.log("getUserProfileId: 開始", { userId });

  try {
    // ユーザー情報を取得
    const { data: userInfo } = await supabase.auth.getUser();
    const email = userInfo?.user?.email;

    // プロファイルを取得または作成
    const profile = await getOrCreateUserProfile(userId, email);

    if (profile) {
      console.log("getUserProfileId: プロファイル取得/作成成功", {
        profileId: profile.id,
        userId,
      });
      return profile.id;
    } else {
      console.error("getUserProfileId: プロファイル取得/作成失敗", { userId });
      return null;
    }
  } catch (error) {
    console.error("getUserProfileId: エラー", { error, userId });
    return null;
  }
}

/**
 * デバッグ用：データベーステーブルの状態確認
 */
export async function debugDatabaseStatus(userId: string) {
  console.log("=== データベース状態デバッグ開始 ===");

  try {
    // 1. 認証状態確認
    const { data: sessionData } = await supabase.auth.getSession();
    console.log("1. 認証状態:", {
      hasSession: !!sessionData.session,
      userId: sessionData.session?.user?.id,
      email: sessionData.session?.user?.email,
    });

    // 2. 通常のクライアントでプロファイル確認
    const { data: normalProfile, error: normalError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId);

    console.log("2. 通常クライアントでのプロファイル確認:", {
      normalProfile,
      error: normalError,
      errorCode: normalError?.code,
      errorMessage: normalError?.message,
      userId,
    });

    // 3. プロファイル直接確認
    const profile = await getOrCreateUserProfile(
      userId,
      sessionData.session?.user?.email
    );
    console.log("3. プロファイル取得結果:", {
      profile: profile ? { id: profile.id, username: profile.username } : null,
      userId,
    });
  } catch (error) {
    console.error("データベース状態確認エラー:", error);
  }

  console.log("=== データベース状態デバッグ終了 ===");
}

/**
 * ユーザーのチャットグループ一覧を取得する
 */
export async function getChatGroups(userId: string): Promise<ChatGroup[]> {
  console.log("getChatGroups: 開始", { userId });

  const profileId = await getUserProfileId(userId);
  console.log("getChatGroups: プロファイルID取得結果", { profileId, userId });

  if (!profileId) {
    console.error("getChatGroups: プロファイルIDが取得できませんでした", {
      userId,
    });
    return [];
  }

  const { data, error } = await supabase
    .from("chat_groups")
    .select("*")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });

  console.log("getChatGroups: Supabaseレスポンス", { data, error, profileId });

  if (error) {
    console.error("チャットグループ取得エラー:", {
      error,
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
      userId,
      profileId,
    });
    return [];
  }

  console.log("getChatGroups: 成功", {
    groupsCount: data?.length || 0,
    groups: data,
    userId,
  });
  return data || [];
}

/**
 * 新しいチャットグループを作成する
 */
export async function createChatGroup(
  userId: string,
  title?: string,
  description?: string
): Promise<ChatGroup | null> {
  console.log("createChatGroup: 開始", { userId, title, description });

  const profileId = await getUserProfileId(userId);
  console.log("createChatGroup: プロファイルID取得結果", { profileId, userId });

  if (!profileId) {
    console.error("createChatGroup: プロファイルIDが取得できませんでした", {
      userId,
    });
    return null;
  }

  const chatGroupData: ChatGroupInsert = {
    profile_id: profileId,
    title: title || "New Chat Group",
    description: description,
  };

  console.log("createChatGroup: 挿入データ", chatGroupData);

  const { data, error } = await supabase
    .from("chat_groups")
    .insert([chatGroupData])
    .select()
    .single();

  console.log("createChatGroup: Supabaseレスポンス", { data, error });

  if (error) {
    console.error("チャットグループ作成エラー:", {
      error,
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
      userId,
      profileId,
      chatGroupData,
    });
    return null;
  }

  console.log("createChatGroup: 成功", { groupId: data.id, userId });
  return data;
}

/**
 * チャットグループを更新する
 */
export async function updateChatGroup(
  chatGroupId: string,
  updates: ChatGroupUpdate
): Promise<ChatGroup | null> {
  const { data, error } = await supabase
    .from("chat_groups")
    .update(updates)
    .eq("id", chatGroupId)
    .select()
    .single();

  if (error) {
    console.error("チャットグループ更新エラー:", error);
    return null;
  }

  return data;
}

/**
 * チャットグループを削除する
 */
export async function deleteChatGroup(chatGroupId: string): Promise<boolean> {
  const { error } = await supabase
    .from("chat_groups")
    .delete()
    .eq("id", chatGroupId);

  if (error) {
    console.error("チャットグループ削除エラー:", error);
    return false;
  }

  return true;
}

/**
 * チャットグループ内の会話一覧を取得する
 */
export async function getConversations(
  chatGroupId: string
): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("chat_group_id", chatGroupId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("会話取得エラー:", error);
    return [];
  }

  return data || [];
}

/**
 * 新しい会話を作成する
 */
export async function createConversation(
  chatGroupId: string,
  title?: string
): Promise<Conversation | null> {
  const conversationData: ConversationInsert = {
    chat_group_id: chatGroupId,
    title: title || "New Conversation",
  };

  const { data, error } = await supabase
    .from("conversations")
    .insert([conversationData])
    .select()
    .single();

  if (error) {
    console.error("会話作成エラー:", error);
    return null;
  }

  return data;
}

/**
 * 会話のメッセージ一覧を取得する
 */
export async function getMessages(conversationId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("メッセージ取得エラー:", error);
    return [];
  }

  return data || [];
}

/**
 * 新しいメッセージを追加する
 */
export async function addMessage(
  conversationId: string,
  role: "user" | "assistant",
  content: string
): Promise<Message | null> {
  const messageData: MessageInsert = {
    conversation_id: conversationId,
    role,
    content,
  };

  const { data, error } = await supabase
    .from("messages")
    .insert([messageData])
    .select()
    .single();

  if (error) {
    console.error("メッセージ追加エラー:", error);
    return null;
  }

  return data;
}

/**
 * デフォルトのチャットグループを取得または作成する
 */
export async function getOrCreateDefaultChatGroup(
  userId: string
): Promise<ChatGroup | null> {
  console.log("getOrCreateDefaultChatGroup: 開始", { userId });

  try {
    const chatGroups = await getChatGroups(userId);
    console.log("getOrCreateDefaultChatGroup: チャットグループ取得結果", {
      chatGroupsCount: chatGroups.length,
      userId,
    });

    // 既存のチャットグループがある場合は最初のものを返す
    if (chatGroups.length > 0) {
      console.log("getOrCreateDefaultChatGroup: 既存グループ見つかり", {
        groupId: chatGroups[0].id,
        userId,
      });
      return chatGroups[0];
    }

    // ない場合はデフォルトのチャットグループを作成
    console.log("getOrCreateDefaultChatGroup: デフォルトグループ作成中", {
      userId,
    });
    const newGroup = await createChatGroup(
      userId,
      "Default Group",
      "Default chat group for conversations"
    );

    console.log("getOrCreateDefaultChatGroup: 結果", {
      newGroup,
      success: !!newGroup,
      userId,
    });

    return newGroup;
  } catch (error) {
    console.error("getOrCreateDefaultChatGroup: 例外発生", { error, userId });
    return null;
  }
}
