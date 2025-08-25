"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Supabase設定のデバッグ情報
    console.log("🔧 Supabase Configuration:");
    console.log("  - URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log(
      "  - Has Anon Key:",
      !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    console.log("  - Supabase instance:", !!supabase);

    // 現在のセッションを確認
    const checkSession = async () => {
      console.log("🔍 Checking session...");
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        console.log("📊 Session check result:");
        console.log("  - Has session:", !!session);
        console.log("  - Has user:", !!session?.user);
        console.log("  - User email:", session?.user?.email);
        console.log("  - User ID:", session?.user?.id);
        console.log("  - Error:", error);

        if (session) {
          console.log("  - Session expires at:", session.expires_at);
          console.log("  - Access token exists:", !!session.access_token);
        }

        setUser(session?.user ?? null);
        setLoading(false);
      } catch (error) {
        console.error("❌ Error checking session:", error);
        setLoading(false);
      }
    };

    checkSession();

    // 認証状態の変更を監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔄 Auth state changed:");
      console.log("  - Event:", event);
      console.log("  - Has session:", !!session);
      console.log("  - Has user:", !!session?.user);
      console.log("  - User email:", session?.user?.email);

      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return {
    user,
    loading,
    signOut,
    isAuthenticated: !!user,
  };
}
