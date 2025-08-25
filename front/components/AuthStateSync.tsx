"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface AuthStateSyncProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

export default function AuthStateSync({
  children,
  requireAuth = false,
  redirectTo = "/auth/login",
}: AuthStateSyncProps) {
  const router = useRouter();

  useEffect(() => {
    const syncAuthState = async () => {
      try {
        // セッション情報を強制的に取得
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        console.log("🔄 AuthStateSync - Session check:");
        console.log("  - Has session:", !!session);
        console.log("  - Error:", error);
        console.log("  - Require auth:", requireAuth);

        if (requireAuth && !session) {
          console.log("🔄 AuthStateSync - Redirecting to:", redirectTo);
          router.push(redirectTo);
          return;
        }

        // セッションが存在する場合、認証状態を更新するイベントを発火
        if (session) {
          console.log(
            "✅ AuthStateSync - Valid session found, refreshing auth state"
          );
          // 少し遅延させてから状態を更新
          setTimeout(() => {
            window.dispatchEvent(
              new CustomEvent("auth-state-changed", {
                detail: { session, user: session.user },
              })
            );
          }, 100);
        }
      } catch (error) {
        console.error("❌ AuthStateSync error:", error);
        if (requireAuth) {
          router.push(redirectTo);
        }
      }
    };

    syncAuthState();

    // 認証状態の変更を監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("🔄 AuthStateSync - Auth change event:", event);

      if (requireAuth && !session && event !== "INITIAL_SESSION") {
        console.log("🔄 AuthStateSync - Auth lost, redirecting");
        router.push(redirectTo);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [requireAuth, redirectTo, router]);

  return <>{children}</>;
}
