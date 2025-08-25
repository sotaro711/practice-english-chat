import { createServerClient as createSupabaseServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Database } from "./database.types";

// サーバーサイド専用のSupabaseクライアント
// cookiesを使用してサーバー側で安全に認証操作を実行
export const createServerClient = async () => {
  const cookieStore = await cookies();

  return createSupabaseServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Server Components内でset()メソッドが呼ばれた場合は無視
            // これはServer Actions内でのみ機能します
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch (error) {
            // Server Components内でremove()メソッドが呼ばれた場合は無視
            // これはServer Actions内でのみ機能します
          }
        },
      },
    }
  );
};
