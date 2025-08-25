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
          fixed lg:static inset-y-0 left-0 z-50
          flex flex-col bg-white shadow-lg border-r border-gray-200
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0
        `}
        style={{ width: "250px" }}
      >
        {/* ヘッダー部分 */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="lg:hidden p-1 rounded-md hover:bg-gray-100"
            >
              <span className="text-xl">≡</span>
            </button>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-900 truncate">
                {user?.email?.split("@")[0] || "ユーザー"}
              </span>
              <span className="text-xs text-gray-500">オンライン</span>
            </div>
          </div>
        </div>

        {/* ナビゲーション部分 */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          <div className="space-y-1">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  router.push(item.href);
                  onClose();
                }}
                className={`
                  w-full flex items-center px-3 py-2 text-sm font-medium rounded-md
                  transition-colors duration-200
                  ${
                    isActive(item.href)
                      ? "bg-blue-50 text-blue-700 border-r-4 border-blue-600"
                      : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                  }
                `}
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>

          <hr className="my-6 border-gray-200" />

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
                  w-full flex items-center px-3 py-2 text-sm font-medium rounded-md
                  transition-colors duration-200
                  ${
                    item.href && isActive(item.href)
                      ? "bg-blue-50 text-blue-700 border-r-4 border-blue-600"
                      : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                  }
                  ${
                    item.id === "logout"
                      ? "hover:bg-red-50 hover:text-red-700"
                      : ""
                  }
                `}
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        </nav>

        {/* フッター部分 */}
        <div className="px-4 py-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            AIチャット英語学習システム
          </div>
        </div>
      </div>
    </>
  );
}
