"use client";

import { resetPassword } from "@/lib/auth-actions";
import { useState, useTransition, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function ResetPasswordContent() {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const searchParams = useSearchParams();

  // URLパラメータからエラーメッセージを取得して表示
  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      setMessage({
        type: "error",
        text: decodeURIComponent(error),
      });
    }
  }, [searchParams]);

  const handleSubmit = async (formData: FormData) => {
    startTransition(async () => {
      setMessage(null);
      const result = await resetPassword(formData);

      if (result.error) {
        setMessage({
          type: "error",
          text: result.error,
        });
      } else if (result.success) {
        setMessage({
          type: "success",
          text: result.message || "パスワードリセットメールを送信しました",
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
            パスワードリセット
          </h2>
          <p className="mt-4 text-center text-sm text-gray-600 leading-relaxed">
            登録済みのメールアドレスを入力してください。
            <br />
            リセット用のリンクをお送りします。
          </p>
        </div>

        {/* パスワードリセットフォーム */}
        <form className="mt-8 space-y-6" action={handleSubmit}>
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
              className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-400 text-black bg-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="メールアドレス"
              disabled={isPending}
            />
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
              <p className="text-sm">{message.text}</p>
            </div>
          )}

          {/* 送信ボタン */}
          <div>
            <button
              type="submit"
              disabled={isPending}
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
                  送信中...
                </span>
              ) : (
                "送信"
              )}
            </button>
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

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              読み込み中...
            </h2>
          </div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
