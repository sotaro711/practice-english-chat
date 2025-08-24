"use client";

import { supabase } from "@/lib/supabase";
import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function UpdatePasswordPage() {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isSessionValid, setIsSessionValid] = useState<boolean | null>(null);
  const router = useRouter();

  // セッションの有効性を確認
  useEffect(() => {
    const checkSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error || !session) {
          setIsSessionValid(false);
          setMessage({
            type: "error",
            text: "認証セッションが無効です。もう一度パスワードリセットを行ってください。",
          });
        } else {
          setIsSessionValid(true);
        }
      } catch (error) {
        console.error("セッション確認エラー:", error);
        setIsSessionValid(false);
        setMessage({
          type: "error",
          text: "認証状態の確認に失敗しました。もう一度パスワードリセットを行ってください。",
        });
      }
    };

    checkSession();
  }, []);

  // パスワード更新フォームの処理（クライアントサイド）
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // セッションが無効な場合は処理をスキップ
    if (!isSessionValid) {
      setMessage({
        type: "error",
        text: "認証セッションが無効です。もう一度パスワードリセットを行ってください。",
      });
      return;
    }

    const formData = new FormData(event.currentTarget);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    startTransition(async () => {
      setMessage(null);

      // バリデーション
      if (!password || !confirmPassword) {
        setMessage({
          type: "error",
          text: "パスワードと確認パスワードを入力してください",
        });
        return;
      }

      if (password !== confirmPassword) {
        setMessage({
          type: "error",
          text: "パスワードが一致しません",
        });
        return;
      }

      if (password.length < 6) {
        setMessage({
          type: "error",
          text: "パスワードは6文字以上で入力してください",
        });
        return;
      }

      try {
        // クライアントサイドでパスワード更新
        const { error } = await supabase.auth.updateUser({
          password: password,
        });

        if (error) {
          console.error("パスワード更新エラー:", error);

          // よくあるエラーを日本語に翻訳
          if (error.message.includes("Password should be at least")) {
            setMessage({
              type: "error",
              text: "パスワードは6文字以上で入力してください",
            });
          } else if (
            error.message.includes("New password should be different")
          ) {
            setMessage({
              type: "error",
              text: "新しいパスワードは現在のパスワードと異なる必要があります",
            });
          } else if (error.message.includes("Auth session missing")) {
            setMessage({
              type: "error",
              text: "認証セッションが見つかりません。もう一度パスワードリセットを行ってください。",
            });
          } else {
            setMessage({
              type: "error",
              text: "パスワードの更新に失敗しました。もう一度お試しください。",
            });
          }
          return;
        }

        // 成功時の処理
        setMessage({
          type: "success",
          text: "パスワードが正常に更新されました",
        });

        // 2秒後にダッシュボードにリダイレクト
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      } catch (error) {
        console.error("パスワード更新処理エラー:", error);
        setMessage({
          type: "error",
          text: "パスワード更新処理でエラーが発生しました",
        });
      }
    });
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
            新しいパスワードの設定
          </h2>
          <p className="mt-4 text-center text-sm text-gray-600 leading-relaxed">
            新しいパスワードを入力してください。
            <br />
            パスワードは6文字以上で設定してください。
          </p>
        </div>

        {/* パスワード更新フォーム */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* 新しいパスワード */}
            <div>
              <label htmlFor="password" className="sr-only">
                新しいパスワード
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-400 text-black bg-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="新しいパスワード（6文字以上）"
                disabled={isPending || !isSessionValid}
                minLength={6}
              />
            </div>

            {/* パスワード確認 */}
            <div>
              <label htmlFor="confirmPassword" className="sr-only">
                パスワード確認
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-400 text-black bg-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="パスワード確認"
                disabled={isPending || !isSessionValid}
                minLength={6}
              />
            </div>
          </div>

          {/* エラー・成功メッセージ */}
          {message && (
            <div
              className={`rounded-md p-4 ${
                message.type === "error"
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : "bg-green-50 text-green-700 border border-green-200"
              }`}
            >
              <p className="text-sm font-medium">{message.text}</p>
              {message.type === "success" && (
                <p className="text-xs mt-2 text-green-600">
                  まもなくダッシュボードにリダイレクトします...
                </p>
              )}
            </div>
          )}

          {/* 更新ボタン */}
          <div>
            <button
              type="submit"
              disabled={isPending || !isSessionValid}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  更新中...
                </span>
              ) : (
                "パスワードを更新"
              )}
            </button>
          </div>

          {/* セキュリティに関する注意事項 */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-blue-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-blue-800">
                  セキュリティについて
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>パスワードは6文字以上で設定してください</li>
                    <li>他のサービスと同じパスワードは使用しないでください</li>
                    <li>大文字・小文字・数字を組み合わせることを推奨します</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* ログイン画面に戻る */}
          <div className="text-center">
            <Link
              href="/auth/login"
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              ログイン画面に戻る
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
