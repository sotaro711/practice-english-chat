"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import {
  getChatGroups,
  createChatGroup,
  getChatGroupsSummary,
} from "@/lib/chat-groups";
import {
  getChatMessages,
  createChatMessage,
  getChatMessagesPaginated,
} from "@/lib/chat-messages";
import { toggleBookmark } from "@/lib/bookmarks";
import { Database } from "@/lib/database.types";

type ChatGroup = Database["public"]["Tables"]["chat_groups"]["Row"];
type ChatMessage = Database["public"]["Tables"]["chat_messages"]["Row"];
type ChatGroupSummary =
  Database["public"]["Views"]["chat_group_summary_view"]["Row"];

export default function NewChatPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  // State for chat groups
  const [chatGroups, setChatGroups] = useState<ChatGroupSummary[]>([]);
  const [selectedChatGroup, setSelectedChatGroup] = useState<ChatGroup | null>(
    null
  );
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");

  // State for messages
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookmarkingIds, setBookmarkingIds] = useState<Set<string>>(new Set());

  // State for loading
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, loading, router]);

  // Load chat groups on mount
  useEffect(() => {
    if (user?.id) {
      loadChatGroups();
    }
  }, [user?.id]);

  // Load messages when chat group is selected
  useEffect(() => {
    if (selectedChatGroup) {
      loadMessages(selectedChatGroup.id);
    }
  }, [selectedChatGroup]);

  const loadChatGroups = async () => {
    if (!user?.id) return;

    try {
      setLoadingGroups(true);
      const groups = await getChatGroupsSummary(user.id);
      setChatGroups(groups);

      // Auto-select first group if available
      if (groups.length > 0 && !selectedChatGroup) {
        const firstGroup = await getChatGroups(user.id);
        if (firstGroup.length > 0) {
          setSelectedChatGroup(firstGroup[0]);
        }
      }
    } catch (error) {
      console.error("チャットグループの読み込みエラー:", error);
    } finally {
      setLoadingGroups(false);
    }
  };

  const loadMessages = async (chatGroupId: string) => {
    try {
      setLoadingMessages(true);
      const chatMessages = await getChatMessages(chatGroupId);
      setMessages(chatMessages);
    } catch (error) {
      console.error("メッセージの読み込みエラー:", error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !newGroupName.trim()) return;

    try {
      setIsCreatingGroup(true);
      const newGroup = await createChatGroup(
        user.id,
        newGroupName.trim(),
        newGroupDescription.trim() || undefined
      );

      if (newGroup) {
        setNewGroupName("");
        setNewGroupDescription("");
        await loadChatGroups();
        setSelectedChatGroup(newGroup);
      }
    } catch (error) {
      console.error("チャットグループ作成エラー:", error);
      alert("チャットグループの作成に失敗しました");
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isSubmitting || !selectedChatGroup) return;

    try {
      setIsSubmitting(true);

      // Add user message
      const userMessage = await createChatMessage({
        chat_group_id: selectedChatGroup.id,
        role: "user",
        content: chatInput.trim(),
      });

      // Clear input
      const currentInput = chatInput;
      setChatInput("");

      // Get AI response
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: currentInput }],
        }),
      });

      if (!response.ok) {
        throw new Error("AI応答の取得に失敗しました");
      }

      const aiResponse = await response.json();

      // Add AI message
      await createChatMessage({
        chat_group_id: selectedChatGroup.id,
        role: "assistant",
        content: aiResponse.content,
        metadata: { model: "gemini-2.0-flash-exp" },
      });

      // Reload messages
      await loadMessages(selectedChatGroup.id);
      await loadChatGroups(); // Update last message info
    } catch (error) {
      console.error("チャット送信エラー:", error);
      alert("メッセージの送信に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBookmark = async (messageId: string) => {
    try {
      setBookmarkingIds((prev) => new Set(prev).add(messageId));
      await toggleBookmark(messageId);
      // Optionally show success message
    } catch (error) {
      console.error("ブックマークエラー:", error);
      alert("ブックマークの操作に失敗しました");
    } finally {
      setBookmarkingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(messageId);
        return newSet;
      });
    }
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
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar - Chat Groups */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            チャットグループ
          </h2>
        </div>

        {/* Create new group form */}
        <div className="p-4 border-b border-gray-200">
          <form onSubmit={handleCreateGroup} className="space-y-2">
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="新しいグループ名"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isCreatingGroup}
            />
            <input
              type="text"
              value={newGroupDescription}
              onChange={(e) => setNewGroupDescription(e.target.value)}
              placeholder="説明（任意）"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isCreatingGroup}
            />
            <button
              type="submit"
              disabled={!newGroupName.trim() || isCreatingGroup}
              className="w-full px-3 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isCreatingGroup ? "作成中..." : "グループ作成"}
            </button>
          </form>
        </div>

        {/* Chat groups list */}
        <div className="flex-1 overflow-y-auto">
          {loadingGroups ? (
            <div className="p-4 text-center text-gray-500">読み込み中...</div>
          ) : chatGroups.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              まだチャットグループがありません
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {chatGroups.map((group) => (
                <div
                  key={group.chat_group_id}
                  onClick={() =>
                    setSelectedChatGroup({
                      id: group.chat_group_id,
                      profile_id: group.profile_id,
                      name: group.chat_group_name,
                      description: group.description,
                      is_active: group.is_active,
                      created_at: group.group_created_at,
                      updated_at: group.group_updated_at,
                    })
                  }
                  className={`p-4 cursor-pointer hover:bg-gray-50 ${
                    selectedChatGroup?.id === group.chat_group_id
                      ? "bg-blue-50 border-r-2 border-blue-500"
                      : ""
                  }`}
                >
                  <div className="flex flex-col">
                    <div className="font-medium text-gray-800 truncate">
                      {group.chat_group_name}
                    </div>
                    {group.description && (
                      <div className="text-xs text-gray-500 truncate mt-1">
                        {group.description}
                      </div>
                    )}
                    <div className="text-xs text-gray-400 mt-2">
                      {group.message_count}件のメッセージ
                    </div>
                    {group.last_message_content && (
                      <div className="text-xs text-gray-500 mt-1 truncate">
                        {group.last_message_content}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {selectedChatGroup ? (
          <>
            {/* Chat header */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <h1 className="text-xl font-semibold text-gray-800">
                {selectedChatGroup.name}
              </h1>
              {selectedChatGroup.description && (
                <p className="text-sm text-gray-600 mt-1">
                  {selectedChatGroup.description}
                </p>
              )}
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loadingMessages ? (
                <div className="text-center text-gray-500">
                  メッセージを読み込み中...
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-500">
                  まだメッセージがありません。最初のメッセージを送信してみましょう！
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.role === "user"
                          ? "bg-blue-500 text-white"
                          : "bg-white border border-gray-200"
                      }`}
                    >
                      <div className="whitespace-pre-wrap break-words">
                        {message.content}
                      </div>

                      {message.role === "assistant" && (
                        <div className="mt-2 flex justify-end">
                          <button
                            onClick={() => handleBookmark(message.id)}
                            disabled={bookmarkingIds.has(message.id)}
                            className="text-xs text-gray-500 hover:text-gray-700 disabled:opacity-50"
                          >
                            {bookmarkingIds.has(message.id)
                              ? "処理中..."
                              : "📌 ブックマーク"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Chat input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <form onSubmit={handleChatSubmit} className="flex space-x-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="メッセージを入力..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSubmitting}
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || isSubmitting}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "送信中..." : "送信"}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="text-xl mb-2">💬</div>
              <div>チャットグループを選択してください</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
