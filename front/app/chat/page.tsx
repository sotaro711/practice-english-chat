"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { createBookmark } from "@/lib/bookmarks";

interface AIResponse {
  id: string;
  text: string;
  translation: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function ChatPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [bookmarkingIds, setBookmarkingIds] = useState<Set<string>>(new Set());
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isSubmitting) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: chatInput,
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = chatInput;
    setChatInput("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let assistantMessage = "";

        // ストリーミングレスポンスを読み取り
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          assistantMessage += chunk;
        }

        // アシスタントメッセージを追加
        const newAssistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: assistantMessage,
        };

        setMessages((prev) => [...prev, newAssistantMessage]);
      }
    } catch (error) {
      console.error("メッセージ送信エラー:", error);
      alert(
        `メッセージの送信に失敗しました: ${
          error instanceof Error ? error.message : "不明なエラー"
        }`
      );

      // エラー時にユーザーメッセージも削除
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsSubmitting(false);
    }
  };

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

  // 英語フレーズと翻訳を抽出する関数
  const parseAIResponse = (content: string): AIResponse[] => {
    const responses: AIResponse[] = [];
    // 番号付きリストとして整理された回答を解析
    const lines = content.split("\n").filter((line) => line.trim());

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // "1. "などの番号から始まる行を探す
      const numberMatch = line.match(/^\d+\.\s*"([^"]+)"\s*\(([^)]+)\)/);
      if (numberMatch) {
        responses.push({
          id: `response-${responses.length + 1}`,
          text: numberMatch[1],
          translation: numberMatch[2],
        });
      }
    }

    return responses;
  };

  const handleBookmark = async (response: AIResponse) => {
    try {
      setBookmarkingIds((prev) => new Set(prev).add(response.id));

      // 注意: createBookmarkはchatMessageIdが必要ですが、
      // このページではAIレスポンスをブックマークしようとしています
      // 一時的にresponse.idをchatMessageIdとして使用しますが、
      // 本来はchat_messagesテーブルにレコードを作成してからそのIDを使用すべきです
      const notes = `英語: "${response.text}" 日本語: "${response.translation}"`;
      const bookmark = await createBookmark(response.id, notes);

      if (bookmark) {
        alert("ブックマークに追加しました！");
      } else {
        alert("ブックマークの追加に失敗しました");
      }
    } catch (error) {
      console.error("ブックマーク追加エラー:", error);
      if (error instanceof Error) {
        alert(`ブックマークの追加に失敗しました: ${error.message}`);
      } else {
        alert("ブックマークの追加に失敗しました");
      }
    } finally {
      setBookmarkingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(response.id);
        return newSet;
      });
    }
  };

  const playAudio = (text: string) => {
    try {
      // Web Speech APIを使用した音声再生
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 0.8; // 少しゆっくり
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      speechSynthesis.speak(utterance);
    } catch (error) {
      console.error("音声再生エラー:", error);
      alert("音声の再生に失敗しました");
    }
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

        {/* メッセージ履歴 */}
        {messages.map((message) => (
          <div key={message.id}>
            {message.role === "user" && (
              <div className="flex items-start space-x-3 justify-end mb-4">
                <div className="flex-1 max-w-md">
                  <div className="bg-blue-500 text-white rounded-lg shadow-sm p-4">
                    <p>{message.content}</p>
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

            {message.role === "assistant" && (
              <div className="space-y-4 mb-4">
                {parseAIResponse(message.content).map((response, index) => (
                  <div key={response.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          AI
                        </span>
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
                              disabled={bookmarkingIds.has(response.id)}
                              className="p-1 text-gray-400 hover:text-yellow-500 transition-colors disabled:opacity-50"
                              title="ブックマーク"
                            >
                              {bookmarkingIds.has(response.id) ? "⏳" : "⭐"}
                            </button>
                          </div>
                        </div>
                        <p className="text-lg font-medium text-gray-900 mb-1">
                          &ldquo;{response.text}&rdquo;
                        </p>
                        <p className="text-gray-600">
                          「{response.translation}」
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

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
        <form onSubmit={handleChatSubmit} className="flex space-x-3">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="学びたい英語のシチュエーションを入力してください..."
            className="flex-1 min-w-0 px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-400 placeholder-gray-500"
            disabled={isSubmitting}
          />
          <button
            type="submit"
            disabled={!chatInput.trim() || isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            送信
          </button>
        </form>
      </div>
    </div>
  );
}
