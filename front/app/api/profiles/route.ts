import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/lib/database.types";

// サーバーサイド用の管理者クライアント
function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY が設定されていません");
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const { userId, email } = await request.json();

    console.log("プロファイル作成API: 開始", { userId, email });

    if (!userId) {
      return NextResponse.json(
        { error: "ユーザーIDが必要です" },
        { status: 400 }
      );
    }

    // 認証確認のため、通常のサーバークライアントも使用
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("プロファイル作成API: 認証エラー", { authError });
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    if (user.id !== userId) {
      console.error("プロファイル作成API: ユーザーID不一致", {
        requestUserId: userId,
        authUserId: user.id,
      });
      return NextResponse.json(
        { error: "ユーザーIDが一致しません" },
        { status: 403 }
      );
    }

    // 管理者クライアントでプロファイル作成
    const adminClient = getAdminClient();

    // まず既存のプロファイルを確認
    const { data: existingProfile, error: checkError } = await adminClient
      .from("profiles")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (existingProfile && !checkError) {
      console.log("プロファイル作成API: 既存プロファイル見つかり", {
        profileId: existingProfile.id,
      });
      return NextResponse.json({
        profileId: existingProfile.id,
        message: "既存のプロファイルを返しました",
      });
    }

    // 新しいプロファイルを作成
    const profileData = {
      user_id: userId,
      username: email?.split("@")[0] || "user",
      display_name: email || "Unknown User",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log("プロファイル作成API: プロファイル作成中", profileData);

    const { data: newProfile, error: createError } = await adminClient
      .from("profiles")
      .insert([profileData])
      .select("id")
      .single();

    if (createError) {
      console.error("プロファイル作成API: 作成エラー", {
        error: createError,
        message: createError.message,
        details: createError.details,
        hint: createError.hint,
        code: createError.code,
      });
      return NextResponse.json(
        {
          error: "プロファイル作成に失敗しました",
          details: createError.message,
        },
        { status: 500 }
      );
    }

    console.log("プロファイル作成API: 成功", { profileId: newProfile.id });

    return NextResponse.json({
      profileId: newProfile.id,
      message: "プロファイルを作成しました",
    });
  } catch (error) {
    console.error("プロファイル作成API: 例外エラー", error);
    return NextResponse.json(
      {
        error: "サーバーエラーが発生しました",
        details: error instanceof Error ? error.message : "不明なエラー",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "ユーザーIDが必要です" },
        { status: 400 }
      );
    }

    // 認証確認
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || user.id !== userId) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    // 管理者クライアントでプロファイル取得
    const adminClient = getAdminClient();
    const { data: profile, error } = await adminClient
      .from("profiles")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("プロファイル取得API: エラー", error);
      return NextResponse.json(
        { error: "プロファイル取得に失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      profileId: profile?.id || null,
      exists: !!profile,
    });
  } catch (error) {
    console.error("プロファイル取得API: 例外エラー", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
