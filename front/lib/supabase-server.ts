import { createClient } from "@supabase/supabase-js";
import { Database } from "./database.types";

// サーバーサイド専用のSupabaseクライアント
// SERVICE_ROLEキーを使用してサーバー側で安全に認証操作を実行
export const createServerClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase環境変数（サーバー用）が設定されていません");
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};
