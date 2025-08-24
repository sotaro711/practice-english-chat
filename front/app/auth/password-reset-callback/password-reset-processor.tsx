"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function PasswordResetProcessor() {
  const [status, setStatus] = useState<"processing" | "success" | "error">(
    "processing"
  );
  const [errorMessage, setErrorMessage] = useState<string>("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const isProcessedRef = useRef(false); // 処理済みフラグ

  useEffect(() => {
    // Supabaseの認証状態変更を監視
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session?.user?.email);

        if (
          event === "PASSWORD_RECOVERY" ||
          (event === "SIGNED_IN" && session)
        ) {
          console.log("Password reset session detected via auth state change");
          isProcessedRef.current = true; // 処理済みとしてマーク
          setStatus("success");
          setTimeout(() => {
            router.push("/auth/update-password");
          }, 1500);
          return;
        }
      }
    );

    // 認証状態変更を待つためのタイムアウト（2秒後に手動処理を試す）
    const timeoutId = setTimeout(() => {
      if (!isProcessedRef.current) {
        console.log("No auth state change detected, trying manual processing");
        processPasswordReset();
      }
    }, 2000);

    const processPasswordReset = async () => {
      // 既に処理済みの場合はスキップ
      if (isProcessedRef.current) {
        console.log(
          "Already processed by auth state change, skipping manual processing"
        );
        return;
      }

      const error = searchParams.get("error");

      console.log("Manual password reset processing:", {
        error,
        currentURL: window.location.href,
        hash: window.location.hash,
      });

      // エラーがある場合
      if (error) {
        setStatus("error");
        setErrorMessage(error);
        setTimeout(() => {
          router.push(
            `/auth/reset-password?error=${encodeURIComponent(error)}`
          );
        }, 3000);
        return;
      }

      // 既存セッションを確認（exchangeCodeForSessionを使わずに）
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session) {
          console.log(
            "Found existing session:",
            sessionData.session.user?.email
          );
          isProcessedRef.current = true;
          setStatus("success");
          setTimeout(() => {
            router.push("/auth/update-password");
          }, 1500);
          return;
        }
      } catch (error) {
        console.error("Session check error:", error);
      }

      // セッションが見つからない場合
      setStatus("error");
      setErrorMessage("パスワードリセットセッションが見つかりません。");
      setTimeout(() => {
        router.push(
          "/auth/reset-password?error=" +
            encodeURIComponent(
              "セッションが見つかりません。もう一度パスワードリセットを行ってください。"
            )
        );
      }, 3000);
    };

    // クリーンアップ
    return () => {
      clearTimeout(timeoutId);
      authListener?.subscription?.unsubscribe();
    };
  }, [searchParams, router]);

  if (status === "processing") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 text-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              AI チャット英語学習システム
            </h1>
            <h2 className="text-xl font-semibold text-gray-700 mb-6">
              パスワードリセット処理中
            </h2>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
            <p className="mt-4 text-sm text-gray-600">
              認証情報を確認しています...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 text-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              AI チャット英語学習システム
            </h1>
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-green-100 p-3">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
              </div>
            </div>
            <h2 className="text-xl font-semibold text-green-700 mb-4">
              認証完了
            </h2>
            <p className="text-sm text-gray-600">
              まもなくパスワード設定画面に移動します...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 text-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              AI チャット英語学習システム
            </h1>
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-red-100 p-3">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              </div>
            </div>
            <h2 className="text-xl font-semibold text-red-700 mb-4">
              エラーが発生しました
            </h2>
            <p className="text-sm text-gray-600 mb-4">{errorMessage}</p>
            <p className="text-xs text-gray-500">
              まもなくパスワードリセット画面に戻ります...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
