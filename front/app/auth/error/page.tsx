"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function AuthErrorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const error = searchParams?.get("error");
    const errorDescription = searchParams?.get("error_description");

    if (error) {
      switch (error) {
        case "access_denied":
          setErrorMessage("アクセスが拒否されました。");
          break;
        case "server_error":
          setErrorMessage("サーバーエラーが発生しました。");
          break;
        case "temporarily_unavailable":
          setErrorMessage("サービスが一時的に利用できません。");
          break;
        case "invalid_request":
          setErrorMessage("無効なリクエストです。");
          break;
        default:
          setErrorMessage(
            errorDescription || "認証処理でエラーが発生しました。"
          );
      }
    } else {
      setErrorMessage("不明なエラーが発生しました。");
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* ヘッダー */}
        <div>
          <h1 className="text-center text-2xl font-bold text-gray-900 mb-2">
            AI チャット英語学習システム
          </h1>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-red-600">
            エラーが発生しました
          </h2>
        </div>

        {/* エラーメッセージ */}
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">認証エラー</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{errorMessage}</p>
              </div>
            </div>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="space-y-4">
          <button
            onClick={() => router.back()}
            className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            戻る
          </button>

          <Link
            href="/auth/login"
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            ログイン画面に移動
          </Link>

          <Link
            href="/"
            className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            ホームに戻る
          </Link>
        </div>

        {/* サポート情報 */}
        <div className="text-center text-sm text-gray-500">
          <p>
            問題が解決しない場合は、
            <a
              href="mailto:support@example.com"
              className="text-blue-600 hover:text-blue-500"
            >
              サポート
            </a>
            までお問い合わせください。
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
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
      <AuthErrorContent />
    </Suspense>
  );
}
