"use client";

import Image from "next/image";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Home() {
  const { user, loading, signOut, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // ログイン済みの場合は自動でダッシュボードに遷移
    if (!loading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="font-sans min-h-screen bg-gradient-to-br from-indigo-50 to-white">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Image
                className="dark:invert"
                src="/next.svg"
                alt="Next.js logo"
                width={120}
                height={25}
                priority
              />
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <span className="text-sm text-gray-700">{user.email}</span>
                  <Link
                    href="/dashboard"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    ダッシュボード
                  </Link>
                  <button
                    onClick={signOut}
                    className="text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
                  >
                    ログアウト
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/signup"
                    className="text-indigo-600 hover:text-indigo-700 text-sm font-medium transition-colors"
                  >
                    新規登録
                  </Link>
                  <Link
                    href="/auth/login"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    ログイン
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-8 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">ようこそ！</h1>

          {user ? (
            <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                こんにちは、{user.email}さん！
              </h2>
              <p className="text-green-600 font-medium mb-4">
                ✅ ログイン成功！認証が正常に完了しています。
              </p>

              {/* ユーザー詳細情報 */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                <h3 className="text-lg font-medium text-gray-800 mb-3">
                  ユーザー情報:
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">メールアドレス:</span>
                    <span className="font-medium">{user.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">ユーザーID:</span>
                    <span className="font-mono text-xs">{user.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">登録日時:</span>
                    <span className="text-xs">
                      {new Date(user.created_at).toLocaleString("ja-JP")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">最終ログイン:</span>
                    <span className="text-xs">
                      {user.last_sign_in_at
                        ? new Date(user.last_sign_in_at).toLocaleString("ja-JP")
                        : "不明"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">認証プロバイダー:</span>
                    <span className="text-xs">
                      {user.app_metadata?.provider || "email"}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-gray-600 mb-6">
                ダッシュボードでアプリケーションの機能をご利用ください。
              </p>
              <Link
                href="/dashboard"
                className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-md font-medium transition-colors"
              >
                ダッシュボードへ
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
              <p className="text-xl text-gray-600 mb-8">
                アプリケーションを利用するには、まずアカウントを作成してください。
              </p>
              <div className="flex gap-4 justify-center">
                <Link
                  href="/auth/signup"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-md font-medium transition-colors"
                >
                  新規登録
                </Link>
                <Link
                  href="/auth/login"
                  className="border border-indigo-600 text-indigo-600 hover:bg-indigo-50 px-8 py-3 rounded-md font-medium transition-colors"
                >
                  ログイン
                </Link>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="text-center">
              <div className="bg-indigo-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔐</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                安全な認証
              </h3>
              <p className="text-gray-600">
                メール認証による安全なアカウント管理
              </p>
            </div>
            <div className="text-center">
              <div className="bg-indigo-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                高速動作
              </h3>
              <p className="text-gray-600">Next.jsとSupabaseによる快適な体験</p>
            </div>
            <div className="text-center">
              <div className="bg-indigo-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎨</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                モダンUI
              </h3>
              <p className="text-gray-600">
                直感的で美しいユーザーインターフェース
              </p>
            </div>
          </div>
        </div>
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
}
