"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const { user, signOut, isAuthenticated, loading } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [speechRate, setSpeechRate] = useState(1);
  const [speechLang, setSpeechLang] = useState("en-US");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    if (user) {
      // プロフィール情報を読み込み（モック）
      setDisplayName(user.email?.split("@")[0] || "");
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

  const handleSaveProfile = async () => {
    setSaving(true);
    // 実際の実装では Supabase のプロフィールテーブルを更新
    setTimeout(() => {
      setSaving(false);
      // 成功メッセージを表示（簡単なアラート）
      alert("プロフィールを更新しました");
    }, 1000);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const handleChangePassword = () => {
    router.push("/auth/update-password");
  };

  const handleDeleteAccount = async () => {
    // 実際の実装ではアカウント削除処理
    console.log("アカウント削除");
    setShowDeleteModal(false);
  };

  const testSpeech = () => {
    const utterance = new SpeechSynthesisUtterance("Hello, this is a test.");
    utterance.lang = speechLang;
    utterance.rate = speechRate;
    speechSynthesis.speak(utterance);
  };

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">設定</h1>
          <p className="text-gray-600">プロフィールと音声設定を管理できます</p>
        </div>

        <div className="space-y-8">
          {/* プロフィール設定 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              プロフィール
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  表示名
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="表示名を入力"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  メールアドレス
                </label>
                <input
                  type="email"
                  value={user.email || ""}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  メールアドレスは変更できません
                </p>
              </div>
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {saving ? "保存中..." : "プロフィールを保存"}
              </button>
            </div>
          </div>

          {/* 音声設定 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">音声設定</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  音声速度: {speechRate}x
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={speechRate}
                  onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>遅い (0.5x)</span>
                  <span>普通 (1x)</span>
                  <span>速い (2x)</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  音声言語
                </label>
                <select
                  value={speechLang}
                  onChange={(e) => setSpeechLang(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="en-US">English (US)</option>
                  <option value="en-GB">English (UK)</option>
                  <option value="en-AU">English (AU)</option>
                </select>
              </div>
              <button
                onClick={testSpeech}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                音声をテスト
              </button>
            </div>
          </div>

          {/* アカウント設定 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              アカウント
            </h2>
            <div className="space-y-3">
              <button
                onClick={handleChangePassword}
                className="w-full text-left px-4 py-3 text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors"
              >
                <span className="font-medium">パスワード変更</span>
                <p className="text-sm text-gray-500">
                  現在のパスワードを変更します
                </p>
              </button>
              <button
                onClick={handleSignOut}
                className="w-full text-left px-4 py-3 text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors"
              >
                <span className="font-medium">ログアウト</span>
                <p className="text-sm text-gray-500">
                  現在のセッションからログアウトします
                </p>
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="w-full text-left px-4 py-3 text-red-700 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
              >
                <span className="font-medium">アカウント削除</span>
                <p className="text-sm text-red-600">
                  アカウントとすべてのデータを完全に削除します
                </p>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* アカウント削除確認モーダル */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              アカウント削除の確認
            </h3>
            <p className="text-gray-600 mb-6">
              アカウントを削除しますか？
              <br />
              この操作は取り消せません。
              <br />
              すべてのデータが完全に削除されます。
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleDeleteAccount}
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
