import { createClient } from "@/lib/supabase";
import { Database } from "@/lib/database.types";
import { getOrCreateUserProfile } from "./profiles";

type ChatGroup = Database["public"]["Tables"]["chat_groups"]["Row"];
type ChatGroupInsert = Database["public"]["Tables"]["chat_groups"]["Insert"];
type ChatGroupUpdate = Database["public"]["Tables"]["chat_groups"]["Update"];
type ChatGroupSummary =
  Database["public"]["Views"]["chat_group_summary_view"]["Row"];

/**
 * ユーザーのプロファイルIDを取得する（存在しない場合は作成）
 */
export async function getUserProfileId(userId: string): Promise<string | null> {
  console.log("getUserProfileId: 開始", { userId });

  try {
    const supabase = createClient();
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

  const supabase = createClient();
  const { data, error } = await supabase
    .from("chat_groups")
    .select("*")
    .eq("profile_id", profileId)
    .order("updated_at", { ascending: false });

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
 * アクティブなチャットグループのみを取得する
 */
export async function getActiveChatGroups(
  userId: string
): Promise<ChatGroup[]> {
  console.log("getActiveChatGroups: 開始", { userId });

  const profileId = await getUserProfileId(userId);
  if (!profileId) {
    console.error("getActiveChatGroups: プロファイルIDが取得できませんでした", {
      userId,
    });
    return [];
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("chat_groups")
    .select("*")
    .eq("profile_id", profileId)
    .eq("is_active", true)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("アクティブチャットグループ取得エラー:", error);
    return [];
  }

  return data || [];
}

/**
 * チャットグループの概要（メッセージ数、最新メッセージ等）を取得する
 */
export async function getChatGroupsSummary(
  userId: string
): Promise<ChatGroupSummary[]> {
  console.log("getChatGroupsSummary: 開始", { userId });

  const profileId = await getUserProfileId(userId);
  if (!profileId) {
    console.error(
      "getChatGroupsSummary: プロファイルIDが取得できませんでした",
      { userId }
    );
    return [];
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("chat_group_summary_view")
    .select("*")
    .eq("profile_id", profileId);

  if (error) {
    console.error("チャットグループ概要取得エラー:", error);
    return [];
  }

  return data || [];
}

/**
 * 新しいチャットグループを作成する
 */
export async function createChatGroup(
  userId: string,
  name: string,
  description?: string
): Promise<ChatGroup | null> {
  console.log("createChatGroup: 開始", { userId, name, description });

  const profileId = await getUserProfileId(userId);
  console.log("createChatGroup: プロファイルID取得結果", { profileId, userId });

  if (!profileId) {
    console.error("createChatGroup: プロファイルIDが取得できませんでした", {
      userId,
    });
    return null;
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("chat_groups")
    .insert({
      profile_id: profileId,
      name,
      description,
      is_active: true,
    })
    .select()
    .single();

  console.log("createChatGroup: Supabaseレスポンス", { data, error });

  if (error) {
    console.error("チャットグループ作成エラー:", {
      error,
      message: error.message,
      details: error.details,
      code: error.code,
      userId,
      profileId,
      name,
    });
    return null;
  }

  console.log("createChatGroup: 成功", { chatGroup: data, userId });
  return data;
}

/**
 * チャットグループを更新する
 */
export async function updateChatGroup(
  chatGroupId: string,
  updates: ChatGroupUpdate
): Promise<ChatGroup | null> {
  console.log("updateChatGroup: 開始", { chatGroupId, updates });

  const supabase = createClient();
  const { data, error } = await supabase
    .from("chat_groups")
    .update(updates)
    .eq("id", chatGroupId)
    .select()
    .single();

  if (error) {
    console.error("チャットグループ更新エラー:", {
      error,
      message: error.message,
      chatGroupId,
      updates,
    });
    return null;
  }

  console.log("updateChatGroup: 成功", { chatGroup: data });
  return data;
}

/**
 * チャットグループをアーカイブする（is_activeをfalseにする）
 */
export async function archiveChatGroup(chatGroupId: string): Promise<boolean> {
  console.log("archiveChatGroup: 開始", { chatGroupId });

  const result = await updateChatGroup(chatGroupId, { is_active: false });

  if (result) {
    console.log("archiveChatGroup: 成功", { chatGroupId });
    return true;
  } else {
    console.error("archiveChatGroup: 失敗", { chatGroupId });
    return false;
  }
}

/**
 * チャットグループを復元する（is_activeをtrueにする）
 */
export async function restoreChatGroup(chatGroupId: string): Promise<boolean> {
  console.log("restoreChatGroup: 開始", { chatGroupId });

  const result = await updateChatGroup(chatGroupId, { is_active: true });

  if (result) {
    console.log("restoreChatGroup: 成功", { chatGroupId });
    return true;
  } else {
    console.error("restoreChatGroup: 失敗", { chatGroupId });
    return false;
  }
}

/**
 * チャットグループを削除する
 */
export async function deleteChatGroup(chatGroupId: string): Promise<boolean> {
  console.log("deleteChatGroup: 開始", { chatGroupId });

  const supabase = createClient();
  const { error } = await supabase
    .from("chat_groups")
    .delete()
    .eq("id", chatGroupId);

  if (error) {
    console.error("チャットグループ削除エラー:", {
      error,
      message: error.message,
      chatGroupId,
    });
    return false;
  }

  console.log("deleteChatGroup: 成功", { chatGroupId });
  return true;
}

/**
 * 特定のチャットグループを取得する
 */
export async function getChatGroup(
  chatGroupId: string
): Promise<ChatGroup | null> {
  console.log("getChatGroup: 開始", { chatGroupId });

  const supabase = createClient();
  const { data, error } = await supabase
    .from("chat_groups")
    .select("*")
    .eq("id", chatGroupId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      console.log("getChatGroup: チャットグループが見つかりません", {
        chatGroupId,
      });
      return null;
    }
    console.error("チャットグループ取得エラー:", {
      error,
      message: error.message,
      chatGroupId,
    });
    return null;
  }

  console.log("getChatGroup: 成功", { chatGroup: data });
  return data;
}

/**
 * チャットグループの最終更新日時を更新する
 */
export async function touchChatGroup(chatGroupId: string): Promise<boolean> {
  console.log("touchChatGroup: 開始", { chatGroupId });

  const result = await updateChatGroup(chatGroupId, {
    updated_at: new Date().toISOString(),
  });

  if (result) {
    console.log("touchChatGroup: 成功", { chatGroupId });
    return true;
  } else {
    console.error("touchChatGroup: 失敗", { chatGroupId });
    return false;
  }
}

/**
 * デバッグ用：データベーステーブルの状態確認
 */
export async function debugDatabaseStatus(userId: string) {
  console.log("=== データベース状態デバッグ開始 ===");

  try {
    const supabase = createClient();

    // 1. 認証状態確認
    const { data: sessionData } = await supabase.auth.getSession();
    console.log("1. 認証状態:", {
      hasSession: !!sessionData.session,
      userId: sessionData.session?.user?.id,
      email: sessionData.session?.user?.email,
    });

    // 2. プロファイル確認
    const { data: normalProfile, error: normalError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId);

    console.log("2. プロファイル確認:", {
      normalProfile,
      error: normalError,
      errorCode: normalError?.code,
      errorMessage: normalError?.message,
      userId,
    });

    // 3. チャットグループ確認
    if (normalProfile && normalProfile.length > 0) {
      const profileId = normalProfile[0].id;
      const { data: chatGroups, error: chatGroupsError } = await supabase
        .from("chat_groups")
        .select("*")
        .eq("profile_id", profileId);

      console.log("3. チャットグループ確認:", {
        chatGroups,
        error: chatGroupsError,
        profileId,
      });
    }
  } catch (error) {
    console.error("データベース状態確認エラー:", error);
  }

  console.log("=== データベース状態デバッグ終了 ===");
}
