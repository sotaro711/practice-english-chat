"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

interface Bookmark {
  id: string;
  english_text: string;
  japanese_text: string;
  created_at: string;
}

export default function BookmarksPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    if (user) {
      loadBookmarks();
    }
  }, [user]);

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

  const loadBookmarks = async () => {
    // モックデータ（実際の実装では Supabase から取得）
    const mockBookmarks: Bookmark[] = [
      {
        id: "1",
        english_text: "Let's get started",
        japanese_text: "始めましょう",
        created_at: new Date().toISOString(),
      },
      {
        id: "2",
        english_text: "I'd like to add some suggestions",
        japanese_text: "いくつかの提案を追加したいと思います",
        created_at: new Date().toISOString(),
      },
      {
        id: "3",
        english_text: "What do you think about this?",
        japanese_text: "これについてどう思いますか？",
        created_at: new Date().toISOString(),
      },
    ];

    setBookmarks(mockBookmarks);
  };

  const playAudio = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    speechSynthesis.speak(utterance);
  };

  const handleDelete = async (bookmarkId: string) => {
    // 実際の実装では Supabase から削除
    setBookmarks(bookmarks.filter((bookmark) => bookmark.id !== bookmarkId));
    setShowDeleteModal(null);
  };

  const confirmDelete = (bookmarkId: string) => {
    setShowDeleteModal(bookmarkId);
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            ブックマーク一覧
          </h1>
          <p className="text-gray-600">
            保存した英語フレーズを確認・復習できます
          </p>
        </div>

        {/* ブックマークリスト */}
        {bookmarks.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              ブックマークがありません
            </h3>
            <p className="text-gray-600 mb-6">
              チャット画面で気に入ったフレーズを保存してみましょう
            </p>
            <button
              onClick={() => router.push("/chat")}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <span className="mr-2">🏠</span>
              チャットに戻る
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {bookmarks.map((bookmark) => (
              <div
                key={bookmark.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-lg font-medium text-gray-900 mb-2">
                      &ldquo;{bookmark.english_text}&rdquo;
                    </p>
                    <p className="text-gray-600 mb-3">
                      「{bookmark.japanese_text}」
                    </p>
                    <p className="text-xs text-gray-400">
                      保存日時:{" "}
                      {new Date(bookmark.created_at).toLocaleDateString(
                        "ja-JP"
                      )}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => playAudio(bookmark.english_text)}
                      className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                      title="音声再生"
                    >
                      <span className="text-lg">♪</span>
                    </button>
                    <button
                      onClick={() => confirmDelete(bookmark.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="削除"
                    >
                      <span className="text-lg">✕</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 削除確認モーダル */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              ブックマークを削除
            </h3>
            <p className="text-gray-600 mb-6">
              このブックマークを削除しますか？
              <br />
              この操作は取り消せません。
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={() => handleDelete(showDeleteModal)}
                className="flex-1 px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
              >
                削除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
