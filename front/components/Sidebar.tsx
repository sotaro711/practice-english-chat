"use client";

import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const navigationItems = [
    {
      id: "chat",
      label: "チャット",
      icon: "🏠",
      href: "/chat",
    },
    {
      id: "bookmarks",
      label: "ブックマーク",
      icon: "📚",
      href: "/bookmarks",
    },
  ];

  const settingsItems = [
    {
      id: "settings",
      label: "設定",
      icon: "⚙️",
      href: "/settings",
    },
    {
      id: "logout",
      label: "ログアウト",
      icon: "🚪",
      onClick: signOut,
    },
  ];

  const isActive = (href: string) => pathname === href;

  // ユーザー名の表示用関数
  const getUserDisplayName = () => {
    if (!user?.email) return "ユーザー";
    const emailPrefix = user.email.split("@")[0];
    return emailPrefix.length > 10
      ? emailPrefix.substring(0, 10) + "..."
      : emailPrefix;
  };

  return (
    <>
      {/* モバイル用オーバーレイ */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* サイドバー */}
      <div
        className={`
          w-[250px] h-full
          fixed lg:static inset-y-0 left-0 z-50
          flex flex-col bg-white shadow-lg border-r border-gray-200
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0
        `}
      >
        {/* ヘッダー部分 */}
        <div className="h-16 px-4 border-b border-gray-200 bg-blue-50">
          <div className="h-full flex items-center">
            <button
              onClick={onClose}
              className="lg:hidden p-1 rounded-md hover:bg-blue-100 mr-3"
            >
              <span className="text-xl text-gray-600">≡</span>
            </button>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-sm font-semibold text-gray-900 truncate">
                {getUserDisplayName()}
              </span>
              <span className="text-xs text-blue-600 font-medium">
                オンライン
              </span>
            </div>
          </div>
        </div>

        {/* ナビゲーション部分 */}
        <nav className="flex-1 px-3 py-4">
          {/* メイン機能 */}
          <div className="mb-6">
            <div className="space-y-1">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    router.push(item.href);
                    onClose();
                  }}
                  className={`
                    w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg
                    transition-all duration-200 group relative
                    ${
                      isActive(item.href)
                        ? "bg-blue-600 text-white shadow-md"
                        : "text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                    }
                  `}
                >
                  <span className="mr-3 text-lg">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                  {isActive(item.href) && (
                    <div className="absolute right-2 w-2 h-2 bg-white rounded-full"></div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 区切り線 */}
          <div className="border-t border-gray-200 mb-4"></div>

          {/* 設定・アカウント */}
          <div className="space-y-1">
            {settingsItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  if (item.onClick) {
                    item.onClick();
                  } else if (item.href) {
                    router.push(item.href);
                    onClose();
                  }
                }}
                className={`
                  w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg
                  transition-all duration-200 group
                  ${
                    item.href && isActive(item.href)
                      ? "bg-blue-600 text-white shadow-md"
                      : item.id === "logout"
                      ? "text-gray-700 hover:bg-red-50 hover:text-red-700"
                      : "text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                  }
                `}
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
                {item.href && isActive(item.href) && (
                  <div className="absolute right-2 w-2 h-2 bg-white rounded-full"></div>
                )}
              </button>
            ))}
          </div>
        </nav>

        {/* フッター部分 */}
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-500 text-center font-medium">
            AI英語学習システム
          </div>
          <div className="text-xs text-gray-400 text-center mt-1">v1.0.0</div>
        </div>
      </div>
    </>
  );
}
