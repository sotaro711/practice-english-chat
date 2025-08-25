"use client";

import { useState } from "react";

// モックデータ - APIとの接続後に削除予定
const mockBookmarks = [
  {
    id: 1,
    english: "Let's get started",
    japanese: "始めましょう",
    createdAt: "2024-01-15T10:30:00Z",
  },
  {
    id: 2,
    english: "I'd like to add something to the agenda",
    japanese: "議題に何か追加したいと思います",
    createdAt: "2024-01-15T11:45:00Z",
  },
  {
    id: 3,
    english: "What do you think?",
    japanese: "いかがでしょうか？",
    createdAt: "2024-01-15T14:20:00Z",
  },
  {
    id: 4,
    english: "Could you please clarify that?",
    japanese: "それを明確にしていただけますか？",
    createdAt: "2024-01-15T15:10:00Z",
  },
  {
    id: 5,
    english: "I'm looking forward to working with you",
    japanese: "一緒に働けることを楽しみにしています",
    createdAt: "2024-01-15T16:30:00Z",
  },
];

interface Bookmark {
  id: number;
  english: string;
  japanese: string;
  createdAt: string;
}

interface DeleteModalProps {
  bookmark: Bookmark | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

function DeleteModal({
  bookmark,
  isOpen,
  onClose,
  onConfirm,
}: DeleteModalProps) {
  if (!isOpen || !bookmark) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          ブックマークを削除
        </h3>
        <p className="text-gray-600 mb-6">
          「{bookmark.english}」を削除しますか？
          <br />
          この操作は取り消せません。
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            いいえ
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            はい
          </button>
        </div>
      </div>
    </div>
  );
}

interface BookmarkCardProps {
  bookmark: Bookmark;
  onPlay: (text: string) => void;
  onDelete: (bookmark: Bookmark) => void;
}

function BookmarkCard({ bookmark, onPlay, onDelete }: BookmarkCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-lg font-medium text-gray-900 mb-2 break-words">
            {bookmark.english}
          </div>
          <div className="text-gray-600 break-words">{bookmark.japanese}</div>
          <div className="text-xs text-gray-400 mt-2">
            {new Date(bookmark.createdAt).toLocaleDateString("ja-JP", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => onPlay(bookmark.english)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            title="音声再生"
          >
            ♪
          </button>
          <button
            onClick={() => onDelete(bookmark)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
            title="削除"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(mockBookmarks);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    bookmark: Bookmark | null;
  }>({
    isOpen: false,
    bookmark: null,
  });

  // 音声再生機能（モック）
  const handlePlay = (text: string) => {
    console.log("音声再生:", text);
    // TODO: Web Speech API での音声再生実装
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      speechSynthesis.speak(utterance);
    } else {
      alert("お使いのブラウザは音声再生に対応していません");
    }
  };

  // 削除機能
  const handleDelete = (bookmark: Bookmark) => {
    setDeleteModal({
      isOpen: true,
      bookmark,
    });
  };

  const confirmDelete = () => {
    if (deleteModal.bookmark) {
      setBookmarks((prev) =>
        prev.filter((b) => b.id !== deleteModal.bookmark!.id)
      );
      setDeleteModal({ isOpen: false, bookmark: null });
    }
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, bookmark: null });
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      {/* ヘッダー */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          📚 ブックマーク
        </h1>
        <p className="text-gray-600">保存した英文を確認・復習しましょう</p>
      </div>

      {/* ブックマーク一覧 */}
      <div className="space-y-4">
        {bookmarks.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">📝</div>
            <p className="text-gray-500 mb-4">まだブックマークがありません</p>
            <p className="text-sm text-gray-400">
              チャット画面で⭐アイコンをクリックして英文を保存しましょう
            </p>
          </div>
        ) : (
          <>
            <div className="text-sm text-gray-500 mb-4">
              {bookmarks.length}件のブックマーク
            </div>
            {bookmarks.map((bookmark) => (
              <BookmarkCard
                key={bookmark.id}
                bookmark={bookmark}
                onPlay={handlePlay}
                onDelete={handleDelete}
              />
            ))}
          </>
        )}
      </div>

      {/* 削除確認モーダル */}
      <DeleteModal
        bookmark={deleteModal.bookmark}
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
