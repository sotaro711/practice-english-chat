"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "./Sidebar";

interface GlobalLayoutProps {
  children: React.ReactNode;
}

export default function GlobalLayout({ children }: GlobalLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { isAuthenticated, loading, user } = useAuth();

  // デバッグ情報をログ出力（詳細表示）
  console.log("🎛️ GlobalLayout render:");
  console.log("  - Loading:", loading);
  console.log("  - IsAuthenticated:", isAuthenticated);
  console.log("  - HasUser:", !!user);
  console.log("  - UserEmail:", user?.email);
  console.log("  - UserID:", user?.id);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  // ローディング中は何も変更せずそのまま表示
  if (loading) {
    console.log("🎛️ Showing loading layout");
    return <>{children}</>;
  }

  // 未認証の場合はサイドバーなしで表示
  if (!isAuthenticated) {
    console.log("🎛️ Showing unauthenticated layout");
    return <>{children}</>;
  }

  // 認証済みの場合はサイドバー付きレイアウトで表示
  console.log("🎛️ Showing authenticated layout with sidebar");
  return (
    <div className="h-screen bg-gray-50">
      {/* PC版レイアウト: サイドバー + メインコンテンツ */}
      <div className="hidden lg:flex h-full">
        {/* PC版固定サイドバー */}
        <div className="w-[250px] flex-shrink-0">
          <Sidebar isOpen={true} onClose={closeSidebar} />
        </div>

        {/* PC版メインコンテンツ */}
        <div className="flex-1 overflow-hidden">
          <main className="h-full overflow-y-auto max-w-4xl mx-auto">
            {children}
          </main>
        </div>
      </div>

      {/* モバイル版レイアウト */}
      <div className="lg:hidden h-full flex flex-col">
        {/* モバイル用ヘッダー */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              <span className="sr-only">サイドバーを開く</span>
              <span className="text-xl">≡</span>
            </button>
            <h1 className="text-lg font-medium text-gray-900 truncate">
              AIチャット英語学習システム
            </h1>
            <div className="w-10" /> {/* スペーサー */}
          </div>
        </header>

        {/* モバイル版メインコンテンツ */}
        <main className="flex-1 overflow-y-auto">{children}</main>

        {/* モバイル版サイドバー（オーバーレイ） */}
        <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      </div>
    </div>
  );
}
