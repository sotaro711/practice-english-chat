"use client";

import { signIn } from "@/lib/auth-actions";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
  }, [searchParams]);

  // フォーム送信処理（サーバーアクション + クライアントサイドフォールバック）
  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);
    setError(null);

    try {
      // まずサーバーアクションを試行
      console.log("🔄 Attempting server action login...");
      await signIn(formData);

      // サーバーアクションが成功すればリダイレクトされるのでここには到達しない
    } catch (serverError) {
      console.warn(
        "⚠️ Server action failed, attempting client-side fallback:",
        serverError
      );

      // サーバーアクション失敗時はクライアントサイド認証を試行
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;

      try {
        console.log("🔄 Attempting client-side login fallback...");
        const { data, error: clientError } =
          await supabase.auth.signInWithPassword({
            email,
            password,
          });

        if (clientError) {
          console.error("❌ Client-side login error:", clientError);

          let errorMessage =
            "ログインに失敗しました。メールアドレスとパスワードをご確認ください。";

          if (clientError.message.includes("Invalid login credentials")) {
            errorMessage = "メールアドレスまたはパスワードが正しくありません";
          } else if (clientError.message.includes("Email not confirmed")) {
            errorMessage =
              "メール確認が完了していません。確認メールをご確認ください。";
          } else if (clientError.message.includes("Too many requests")) {
            errorMessage =
              "ログイン試行回数が多すぎます。しばらく時間をおいてから再度お試しください。";
          }

          setError(errorMessage);
          return;
        }

        if (data.user && data.session) {
          console.log("✅ Client-side login successful:", {
            userId: data.user.id,
            email: data.user.email,
          });

          // チャットページにリダイレクト
          router.push("/chat");
          return;
        }

        setError("ログイン処理で予期しないエラーが発生しました");
      } catch (clientError) {
        console.error("❌ Client-side login failed:", clientError);
        setError(
          "ネットワークエラーが発生しました。しばらく時間をおいてから再度お試しください。"
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* ヘッダー */}
        <div>
          <h1 className="text-center text-2xl font-bold text-gray-900 mb-2">
            AI チャット英語学習システム
          </h1>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            ログイン
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            アカウントをお持ちでない方{" "}
            <Link
              href="/auth/signup"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              新規登録はこちら
            </Link>
          </p>
        </div>

        {/* ログインフォーム */}
        <form className="mt-8 space-y-6" action={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                メールアドレス
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-400 text-black bg-white rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="メールアドレス"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                パスワード
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-400 text-black bg-white rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="パスワード"
              />
            </div>
          </div>

          {/* エラーメッセージ */}
          {error && (
            <div className="rounded-md p-4 bg-red-50 text-red-700 border border-red-200">
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* ログインボタン */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ログイン中...
                </>
              ) : (
                "ログイン"
              )}
            </button>
          </div>

          {/* パスワードを忘れた方はこちら */}
          <div className="text-center">
            <Link
              href="/auth/reset-password"
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              パスワードを忘れた方はこちら
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
