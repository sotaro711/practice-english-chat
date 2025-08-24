"use server";

import { createServerClient } from "./supabase-server";

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

// メール確認後のコールバック処理（通常のメール確認用）
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
      console.log("Email verification session created:", {
        user: data.user?.id,
        email: data.user?.email,
        session: !!data.session,
      });

      // 通常のメール確認の場合はダッシュボードにリダイレクト
      return {
        success: true,
        message: "メール確認が完了しました",
        redirectTo: "/dashboard",
      };
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

// ログイン用のサーバーアクション
export async function signIn(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // バリデーション
  if (!email || !password) {
    return {
      error: "メールアドレスとパスワードを入力してください",
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

    // Supabaseでログイン
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("ログインエラー:", error);

      // よくあるエラーを日本語に翻訳
      if (error.message.includes("Invalid login credentials")) {
        return {
          error: "メールアドレスまたはパスワードが正しくありません",
        };
      }

      if (error.message.includes("Email not confirmed")) {
        return {
          error: "メール確認が完了していません。確認メールをご確認ください。",
        };
      }

      if (error.message.includes("Too many requests")) {
        return {
          error:
            "ログイン試行回数が多すぎます。しばらく時間をおいてから再度お試しください。",
        };
      }

      return {
        error:
          "ログインに失敗しました。メールアドレスとパスワードをご確認ください。",
      };
    }

    if (data.user && data.session) {
      // ログイン成功時のレスポンス
      return {
        success: true,
        message: "ログインに成功しました",
        user: data.user,
        redirectTo: "/dashboard",
      };
    }

    return {
      error: "ログイン処理で予期しないエラーが発生しました",
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

// パスワードリセット用のサーバーアクション
export async function resetPassword(formData: FormData) {
  const email = formData.get("email") as string;

  // バリデーション
  if (!email) {
    return {
      error: "メールアドレスを入力してください",
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

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${
        process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
      }/auth/password-reset-callback`,
    });

    if (error) {
      console.error("パスワードリセットエラー:", error);
      return {
        error:
          "パスワードリセットメールの送信に失敗しました。メールアドレスをご確認ください。",
      };
    }

    return {
      success: true,
      message:
        "パスワードリセット用のメールを送信しました。メールをご確認ください。",
    };
  } catch (error) {
    console.error("パスワードリセット処理エラー:", error);
    return {
      error: "パスワードリセット処理でエラーが発生しました",
    };
  }
}

// パスワード更新用のサーバーアクション（リセット後の新しいパスワード設定）
export async function updatePassword(formData: FormData) {
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  // バリデーション
  if (!password || !confirmPassword) {
    return {
      error: "パスワードと確認パスワードを入力してください",
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

  try {
    const supabase = createServerClient();

    // パスワードを更新（セッション確認を削除）
    // パスワードリセットフローでは、既にメール認証が完了しているため
    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      console.error("パスワード更新エラー:", error);

      // よくあるエラーを日本語に翻訳
      if (error.message.includes("Password should be at least")) {
        return {
          error: "パスワードは6文字以上で入力してください",
        };
      }

      if (error.message.includes("New password should be different")) {
        return {
          error: "新しいパスワードは現在のパスワードと異なる必要があります",
        };
      }

      return {
        error: "パスワードの更新に失敗しました。もう一度お試しください。",
      };
    }

    return {
      success: true,
      message: "パスワードが正常に更新されました",
      redirectTo: "/dashboard",
    };
  } catch (error) {
    console.error("パスワード更新処理エラー:", error);
    return {
      error: `パスワード更新エラー: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
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

    // ログアウト成功時のレスポンス
    return {
      success: true,
      message: "ログアウトしました",
      redirectTo: "/",
    };
  } catch (error) {
    console.error("ログアウト処理エラー:", error);
    return {
      error: "ログアウト処理でエラーが発生しました",
    };
  }
}
