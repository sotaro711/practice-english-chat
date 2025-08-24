"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "./Sidebar";

interface GlobalLayoutProps {
  children: React.ReactNode;
}

export default function GlobalLayout({ children }: GlobalLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { isAuthenticated, loading } = useAuth();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  // ローディング中は何も変更せずそのまま表示
  if (loading) {
    return <>{children}</>;
  }

  // 未認証の場合はサイドバーなしで表示
  if (!isAuthenticated) {
    return <>{children}</>;
  }

  // 認証済みの場合はサイドバー付きレイアウトで表示
  return (
    <div className="flex h-screen bg-gray-50">
      {/* サイドバー */}
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

      {/* メインコンテンツエリア */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* モバイル用ヘッダー */}
        <header className="bg-white shadow-sm border-b border-gray-200 lg:hidden">
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

        {/* メインコンテンツ */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
