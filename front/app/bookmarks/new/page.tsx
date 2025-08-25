"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import {
  getUserBookmarks,
  updateBookmarkNotes,
  deleteBookmark,
} from "@/lib/bookmarks";
import { Database } from "@/lib/database.types";

type UserBookmarkView =
  Database["public"]["Views"]["user_bookmarks_view"]["Row"];

export default function NewBookmarksPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  const [bookmarks, setBookmarks] = useState<UserBookmarkView[]>([]);
  const [loadingBookmarks, setLoadingBookmarks] = useState(true);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [noteValue, setNoteValue] = useState("");
  const [updatingNote, setUpdatingNote] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, loading, router]);

  // Load bookmarks on mount
  useEffect(() => {
    if (user?.id) {
      loadBookmarks();
    }
  }, [user?.id]);

  const loadBookmarks = async () => {
    try {
      setLoadingBookmarks(true);
      const userBookmarks = await getUserBookmarks();
      setBookmarks(userBookmarks);
    } catch (error) {
      console.error("ブックマーク読み込みエラー:", error);
      alert("ブックマークの読み込みに失敗しました");
    } finally {
      setLoadingBookmarks(false);
    }
  };

  const handleEditNotes = (bookmarkId: string, currentNotes: string | null) => {
    setEditingNotes(bookmarkId);
    setNoteValue(currentNotes || "");
  };

  const handleSaveNotes = async (bookmarkId: string) => {
    try {
      setUpdatingNote(true);
      await updateBookmarkNotes(bookmarkId, noteValue);

      // Update local state
      setBookmarks((prev) =>
        prev.map((bookmark) =>
          bookmark.bookmark_id === bookmarkId
            ? { ...bookmark, notes: noteValue }
            : bookmark
        )
      );

      setEditingNotes(null);
      setNoteValue("");
    } catch (error) {
      console.error("メモ更新エラー:", error);
      alert("メモの更新に失敗しました");
    } finally {
      setUpdatingNote(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingNotes(null);
    setNoteValue("");
  };

  const handleDeleteBookmark = async (bookmarkId: string) => {
    if (!confirm("このブックマークを削除しますか？")) {
      return;
    }

    try {
      setDeletingId(bookmarkId);
      await deleteBookmark(bookmarkId);

      // Remove from local state
      setBookmarks((prev) =>
        prev.filter((bookmark) => bookmark.bookmark_id !== bookmarkId)
      );
    } catch (error) {
      console.error("ブックマーク削除エラー:", error);
      alert("ブックマークの削除に失敗しました");
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">読み込み中...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            ブックマーク
          </h1>
          <p className="text-gray-600">
            保存したメッセージを確認・管理できます
          </p>
        </div>

        {loadingBookmarks ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-lg text-gray-500">
              ブックマークを読み込み中...
            </div>
          </div>
        ) : bookmarks.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📌</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              ブックマークがありません
            </h2>
            <p className="text-gray-600 mb-6">
              チャットでメッセージをブックマークすると、ここに表示されます
            </p>
            <button
              onClick={() => router.push("/chat/new")}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              チャットを始める
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {bookmarks.map((bookmark) => (
              <div
                key={bookmark.bookmark_id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-sm font-medium text-blue-600">
                        {bookmark.chat_group_name}
                      </span>
                      <span className="text-sm text-gray-500">
                        {bookmark.message_role === "user"
                          ? "👤 あなた"
                          : "🤖 AI"}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">
                      {formatDate(bookmark.bookmarked_at)}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteBookmark(bookmark.bookmark_id)}
                    disabled={deletingId === bookmark.bookmark_id}
                    className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                    title="ブックマークを削除"
                  >
                    {deletingId === bookmark.bookmark_id ? "削除中..." : "🗑️"}
                  </button>
                </div>

                {/* Message content */}
                <div className="mb-4">
                  <div
                    className={`p-4 rounded-lg ${
                      bookmark.message_role === "user"
                        ? "bg-blue-50 border-l-4 border-blue-500"
                        : "bg-gray-50 border-l-4 border-gray-500"
                    }`}
                  >
                    <div className="whitespace-pre-wrap break-words text-gray-800">
                      {bookmark.message_content}
                    </div>
                  </div>
                </div>

                {/* Notes section */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      メモ
                    </label>
                    {editingNotes !== bookmark.bookmark_id && (
                      <button
                        onClick={() =>
                          handleEditNotes(bookmark.bookmark_id, bookmark.notes)
                        }
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        {bookmark.notes ? "編集" : "追加"}
                      </button>
                    )}
                  </div>

                  {editingNotes === bookmark.bookmark_id ? (
                    <div className="space-y-2">
                      <textarea
                        value={noteValue}
                        onChange={(e) => setNoteValue(e.target.value)}
                        placeholder="このブックマークについてのメモを入力..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                      />
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={handleCancelEdit}
                          disabled={updatingNote}
                          className="px-3 py-1 text-sm text-gray-600 hover:text-gray-700 disabled:opacity-50"
                        >
                          キャンセル
                        </button>
                        <button
                          onClick={() => handleSaveNotes(bookmark.bookmark_id)}
                          disabled={updatingNote}
                          className="px-4 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
                        >
                          {updatingNote ? "保存中..." : "保存"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600">
                      {bookmark.notes || (
                        <span className="italic text-gray-400">
                          メモはありません
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Metadata */}
                {bookmark.message_metadata &&
                  typeof bookmark.message_metadata === "object" &&
                  Object.keys(bookmark.message_metadata).length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="text-xs text-gray-400">
                        <span className="font-medium">メタデータ:</span>
                        <pre className="mt-1 text-xs bg-gray-50 p-2 rounded">
                          {JSON.stringify(bookmark.message_metadata, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
