"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

interface AIResponse {
  id: string;
  text: string;
  translation: string;
}

export default function ChatPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const [message, setMessage] = useState("");
  const [aiResponses, setAiResponses] = useState<AIResponse[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSubmitting) return;

    setIsSubmitting(true);

    // モックのAI応答
    const mockResponses: AIResponse[] = [
      {
        id: "1",
        text: "Let's get started",
        translation: "始めましょう",
      },
      {
        id: "2",
        text: "I'd like to add some suggestions",
        translation: "いくつかの提案を追加したいと思います",
      },
      {
        id: "3",
        text: "What do you think about this?",
        translation: "これについてどう思いますか？",
      },
    ];

    // 実際のAI処理の代わりにモックデータを使用
    setTimeout(() => {
      setAiResponses(mockResponses);
      setMessage("");
      setIsSubmitting(false);
    }, 1000);
  };

  const handleBookmark = async (response: AIResponse) => {
    // ブックマーク機能は後で実装
    console.log("ブックマーク:", response);
  };

  const playAudio = (text: string) => {
    // Web Speech APIを使用した音声再生
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    speechSynthesis.speak(utterance);
  };

  return (
    <div className="flex flex-col h-full">
      {/* チャットエリア */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* AI初期メッセージ */}
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-sm">AI</span>
            </div>
          </div>
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <p className="text-gray-800">
                こんにちは！今日はどんな英語を学びたいですか？
              </p>
            </div>
          </div>
        </div>

        {/* ユーザーメッセージ（送信後に表示される） */}
        {aiResponses.length > 0 && (
          <div className="flex items-start space-x-3 justify-end">
            <div className="flex-1 max-w-md">
              <div className="bg-blue-500 text-white rounded-lg shadow-sm p-4">
                <p>会議で使えるフレーズ</p>
              </div>
            </div>
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-gray-600 font-medium text-sm">
                  {user.email?.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* AI応答リスト */}
        {aiResponses.length > 0 && (
          <div className="space-y-4">
            {aiResponses.map((response, index) => (
              <div key={response.id} className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-sm">AI</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-500">
                        提案 {index + 1}
                      </span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => playAudio(response.text)}
                          className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                          title="音声再生"
                        >
                          ♪
                        </button>
                        <button
                          onClick={() => handleBookmark(response)}
                          className="p-1 text-gray-400 hover:text-yellow-500 transition-colors"
                          title="ブックマーク"
                        >
                          ⭐
                        </button>
                      </div>
                    </div>
                    <p className="text-lg font-medium text-gray-900 mb-1">
                      &ldquo;{response.text}&rdquo;
                    </p>
                    <p className="text-gray-600">「{response.translation}」</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ロード中 */}
        {isSubmitting && (
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">AI</span>
              </div>
            </div>
            <div className="flex-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-gray-600">考え中...</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 入力エリア */}
      <div className="border-t border-gray-200 bg-white p-4">
        <form onSubmit={handleSubmit} className="flex space-x-3">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="メッセージを入力してください..."
            className="flex-1 min-w-0 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isSubmitting}
          />
          <button
            type="submit"
            disabled={!message.trim() || isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            送信
          </button>
        </form>
      </div>
    </div>
  );
}
