"use client";

export default function DebugPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">デバッグ情報</h1>

      <div className="bg-gray-100 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">環境変数</h2>
        <div className="space-y-2 text-sm">
          <div>
            <strong>NEXT_PUBLIC_SUPABASE_URL:</strong>{" "}
            {process.env.NEXT_PUBLIC_SUPABASE_URL || "未設定"}
          </div>
          <div>
            <strong>NEXT_PUBLIC_SUPABASE_ANON_KEY存在:</strong>{" "}
            {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "あり" : "なし"}
          </div>
          <div>
            <strong>NEXT_PUBLIC_SITE_URL:</strong>{" "}
            {process.env.NEXT_PUBLIC_SITE_URL || "未設定"}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <button
          onClick={() => {
            console.log("🔧 Full env check:");
            console.log("URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
            console.log(
              "Key exists:",
              !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
            );
            console.log("Site URL:", process.env.NEXT_PUBLIC_SITE_URL);
          }}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          コンソールに環境変数を出力
        </button>
      </div>
    </div>
  );
}
