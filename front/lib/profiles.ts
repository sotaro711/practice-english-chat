import { supabase } from "./supabase";
import { Database } from "./database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

/**
 * ユーザーIDでプロファイルデータを取得
 * @param userId ユーザーID
 * @returns プロファイルデータまたはnull
 */
export async function getUserProfile(userId: string): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("プロファイル取得エラー:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("プロファイル取得例外:", error);
    return null;
  }
}

/**
 * すべてのプロファイルデータを取得（管理者用）
 * @returns プロファイルデータの配列
 */
export async function getAllProfiles(): Promise<Profile[]> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("全プロファイル取得エラー:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("全プロファイル取得例外:", error);
    return [];
  }
}

/**
 * プロファイルを作成
 * @param profileData プロファイルデータ
 * @returns 作成されたプロファイルまたはnull
 */
export async function createProfile(
  profileData: ProfileInsert
): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .insert(profileData)
      .select()
      .single();

    if (error) {
      console.error("プロファイル作成エラー:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("プロファイル作成例外:", error);
    return null;
  }
}

/**
 * プロファイルを更新
 * @param id プロファイルID
 * @param updateData 更新データ
 * @returns 更新されたプロファイルまたはnull
 */
export async function updateProfile(
  id: string,
  updateData: ProfileUpdate
): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("プロファイル更新エラー:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("プロファイル更新例外:", error);
    return null;
  }
}

/**
 * 現在ログイン中のユーザーのプロファイルを取得
 * @returns プロファイルデータまたはnull
 */
export async function getCurrentUserProfile(): Promise<Profile | null> {
  try {
    // 現在のユーザーを取得
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("ユーザー取得エラー:", userError);
      return null;
    }

    // ユーザーのプロファイルを取得
    return await getUserProfile(user.id);
  } catch (error) {
    console.error("現在ユーザープロファイル取得例外:", error);
    return null;
  }
}

/**
 * ユーザーのプロファイルを取得または作成する
 * @param userId ユーザーID
 * @param email ユーザーのメールアドレス（省略可能）
 * @returns プロファイルデータまたはnull
 */
export async function getOrCreateUserProfile(
  userId: string,
  email?: string
): Promise<Profile | null> {
  try {
    console.log("getOrCreateUserProfile: 開始", { userId, email });

    // まず既存のプロファイルを取得を試行
    let profile = await getUserProfile(userId);
    
    if (profile) {
      console.log("getOrCreateUserProfile: 既存プロファイル取得成功", { profileId: profile.id, userId });
      return profile;
    }

    // プロファイルが存在しない場合は作成
    console.log("getOrCreateUserProfile: プロファイルが存在しないため作成します", { userId, email });
    
    // emailが提供されていない場合は現在のユーザー情報から取得
    let userEmail = email;
    if (!userEmail) {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user?.email) {
        console.error("getOrCreateUserProfile: ユーザー情報取得エラー", { userError, userId });
        return null;
      }
      userEmail = userData.user.email;
    }

    const profileData: ProfileInsert = {
      user_id: userId,
      email: userEmail,
      display_name: userEmail.split('@')[0], // メールアドレスの@より前をデフォルトの表示名とする
    };

    profile = await createProfile(profileData);
    
    if (profile) {
      console.log("getOrCreateUserProfile: プロファイル作成成功", { profileId: profile.id, userId });
    } else {
      console.error("getOrCreateUserProfile: プロファイル作成失敗", { userId, email });
    }

    return profile;
  } catch (error) {
    console.error("getOrCreateUserProfile: 例外", { error, userId, email });
    return null;
  }
}

/**
 * プロファイル統計情報を取得
 * @returns 統計情報
 */
export async function getProfileStats() {
  try {
    // セキュアな関数を使用してプロファイル数を取得
    const { data, error } = await supabase.rpc("get_profile_count");

    if (error) {
      console.error("プロファイル統計取得エラー:", error);
      return { totalProfiles: 0 };
    }

    return {
      totalProfiles: data || 0,
    };
  } catch (error) {
    console.error("プロファイル統計取得例外:", error);
    return { totalProfiles: 0 };
  }
}
