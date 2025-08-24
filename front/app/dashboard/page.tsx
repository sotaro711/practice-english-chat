"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Dashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            AIチャット英語学習システム
          </h2>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* ウェルカムカード */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {user.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    ようこそ！
                  </h3>
                  <p className="text-sm text-gray-500">
                    認証が正常に完了しました
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* アカウント情報カード */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                アカウント情報
              </h3>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    メールアドレス
                  </dt>
                  <dd className="text-sm text-gray-900">{user.email}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    ユーザーID
                  </dt>
                  <dd className="text-sm text-gray-900 font-mono">
                    {user.id.substring(0, 8)}...
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    登録日時
                  </dt>
                  <dd className="text-sm text-gray-900">
                    {new Date(user.created_at).toLocaleDateString("ja-JP")}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* 機能カード */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                利用可能な機能
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => router.push("/chat")}
                  className="w-full text-left px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                >
                  🏠 AIチャット
                </button>
                <button
                  onClick={() => router.push("/bookmarks")}
                  className="w-full text-left px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                >
                  📚 ブックマーク
                </button>
                <button
                  onClick={() => router.push("/settings")}
                  className="w-full text-left px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                >
                  ⚙️ 設定
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 追加コンテンツエリア */}
        <div className="mt-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                AIチャット英語学習を始めよう
              </h3>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                AIと対話しながら実践的な英語を学びましょう。以下の機能をご利用いただけます。
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                  AI との自然な英語対話
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                  音声読み上げ機能
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                  フレーズのブックマーク保存
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                  個人設定のカスタマイズ
                </li>
              </ul>
              <div className="mt-6">
                <button
                  onClick={() => router.push("/chat")}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <span className="mr-2">🏠</span>
                  チャットを開始
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
