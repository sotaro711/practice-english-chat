"use server";

import { createServerClient } from "./supabase-server";
import { redirect } from "next/navigation";

// 新規登録用のフォームデータ型
export interface SignUpFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

// 新規登録のサーバーアクション
export async function signUp(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  // バリデーション
  if (!email || !password || !confirmPassword) {
    return {
      error: "すべてのフィールドを入力してください",
    };
  }

  if (password !== confirmPassword) {
    return {
      error: "パスワードが一致しません",
    };
  }

  if (password.length < 6) {
    return {
      error: "パスワードは6文字以上で入力してください",
    };
  }

  // メールアドレスの基本的なバリデーション
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      error: "有効なメールアドレスを入力してください",
    };
  }

  try {
    const supabase = createServerClient();

    // Supabaseで新規ユーザー作成
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // メール確認を有効にする場合
        emailRedirectTo: `${
          process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
        }/auth/callback`,
      },
    });

    if (error) {
      console.error("新規登録エラー:", error);

      // よくあるエラーを日本語に翻訳
      if (error.message.includes("User already registered")) {
        return {
          error: "このメールアドレスは既に登録されています",
        };
      }

      if (error.message.includes("Password should be at least")) {
        return {
          error: "パスワードは6文字以上で入力してください",
        };
      }

      return {
        error: "新規登録に失敗しました。もう一度お試しください。",
      };
    }

    if (data.user) {
      // 登録成功時のメッセージ
      return {
        success: true,
        message:
          "登録が完了しました。確認メールをお送りしましたので、メールに記載されているリンクをクリックしてアカウントを有効化してください。",
        user: data.user,
      };
    }

    return {
      error: "登録処理で予期しないエラーが発生しました",
    };
  } catch (error) {
    console.error("サーバーアクションエラー:", error);
    return {
      error: `サーバーエラー: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
}

// メール確認後のコールバック処理
export async function handleAuthCallback(code: string) {
  if (!code) {
    return {
      error: "確認コードが無効です",
    };
  }

  try {
    const supabase = createServerClient();

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("認証コールバックエラー:", error);
      return {
        error: "メール確認に失敗しました",
      };
    }

    if (data.session) {
      // 認証成功後、ダッシュボードにリダイレクト
      redirect("/dashboard");
    }

    return {
      error: "セッションの作成に失敗しました",
    };
  } catch (error) {
    console.error("コールバック処理エラー:", error);
    return {
      error: "認証処理でエラーが発生しました",
    };
  }
}

// ログアウト用のサーバーアクション
export async function signOut() {
  try {
    const supabase = createServerClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("ログアウトエラー:", error);
      return {
        error: "ログアウトに失敗しました",
      };
    }

    // ログアウト成功後、ホームページにリダイレクト
    redirect("/");
  } catch (error) {
    console.error("ログアウト処理エラー:", error);
    return {
      error: "ログアウト処理でエラーが発生しました",
    };
  }
}
