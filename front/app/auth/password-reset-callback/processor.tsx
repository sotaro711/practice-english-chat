"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface PasswordResetCallbackProcessorProps {
  searchParams: {
    code?: string;
    error?: string;
  };
}

export default function PasswordResetCallbackProcessor({
  searchParams,
}: PasswordResetCallbackProcessorProps) {
  const [status, setStatus] = useState<"processing" | "success" | "error">(
    "processing"
  );
  const [errorMessage, setErrorMessage] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    let authSubscription: { unsubscribe?: () => void } | null = null;
    let timeoutId: NodeJS.Timeout | null = null;

    const processPasswordReset = async () => {
      const { code, error } = searchParams;

      console.log("🔄 パスワードリセットコールバック処理開始:", {
        hasCode: !!code,
        hasError: !!error,
        error,
        currentUrl: window.location.href,
      });

      // URLにエラーパラメータがある場合
      if (error) {
        console.log("❌ エラーパラメータ検出:", error);
        setStatus("error");
        setErrorMessage(
          `パスワードリセット処理でエラーが発生しました: ${error}`
        );
        timeoutId = setTimeout(() => {
          router.push(
            `/auth/reset-password?error=${encodeURIComponent(
              `パスワードリセット処理でエラーが発生しました: ${error}`
            )}`
          );
        }, 3000);
        return;
      }

      // コードパラメータがない場合
      if (!code) {
        console.log("❌ コードパラメータが見つかりません");
        setStatus("error");
        setErrorMessage("パスワードリセットリンクが無効です。");
        timeoutId = setTimeout(() => {
          router.push(
            `/auth/reset-password?error=${encodeURIComponent(
              "パスワードリセットリンクが無効です。新しいリセットリンクを発行してください。"
            )}`
          );
        }, 3000);
        return;
      }

      try {
        // 認証状態変更を監視して、PKCE問題を回避
        console.log("🔄 認証状態変更を監視中...");

        authSubscription = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log("🔄 認証状態変更検出:", {
              event,
              hasSession: !!session,
              userEmail: session?.user?.email,
            });

            if (event === "PASSWORD_RECOVERY" && session) {
              console.log("✅ パスワードリセットセッション検出 - 処理完了");
              setStatus("success");
              if (timeoutId) clearTimeout(timeoutId);
              timeoutId = setTimeout(() => {
                router.push("/auth/update-password");
              }, 1500);
              return;
            }

            if (event === "SIGNED_IN" && session) {
              console.log(
                "✅ サインイン検出 - パスワードリセットセッション確認中"
              );
              setStatus("success");
              if (timeoutId) clearTimeout(timeoutId);
              timeoutId = setTimeout(() => {
                router.push("/auth/update-password");
              }, 1500);
              return;
            }
          }
        );

        // URLにアクセストークンまたはフラグメントが含まれている場合の処理
        const currentUrl = window.location.href;
        if (
          currentUrl.includes("#") &&
          (currentUrl.includes("access_token=") ||
            currentUrl.includes("type=recovery"))
        ) {
          console.log(
            "✅ URLにトークンまたはrecoveryタイプが見つかりました - セッション確認中"
          );

          // 少し待ってからセッションを確認（認証状態変更の完了を待つ）
          await new Promise((resolve) => setTimeout(resolve, 2000));

          const { data: sessionData, error: sessionError } =
            await supabase.auth.getSession();

          if (!sessionError && sessionData.session) {
            console.log("✅ パスワードリセットセッション確認成功:", {
              userId: sessionData.session.user?.id,
              email: sessionData.session.user?.email,
            });

            setStatus("success");
            if (timeoutId) clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
              router.push("/auth/update-password");
            }, 1500);
            return;
          }
        }

        // PKCEコード交換は最後の手段として試行（通常は失敗する）
        console.log("🔄 直接セッション確認を試行中...");

        // まず既存のセッションを確認
        const { data: existingSession } = await supabase.auth.getSession();
        if (existingSession.session) {
          console.log("✅ 既存セッション確認成功 - パスワード更新ページへ");
          setStatus("success");
          if (timeoutId) clearTimeout(timeoutId);
          timeoutId = setTimeout(() => {
            router.push("/auth/update-password");
          }, 1500);
          return;
        }

        // 5秒後にタイムアウト処理
        timeoutId = setTimeout(() => {
          console.log("⏰ パスワードリセット処理タイムアウト");

          // 最後にもう一度セッションを確認
          supabase.auth.getSession().then(({ data: sessionData }) => {
            if (sessionData.session) {
              console.log("✅ タイムアウト後にセッション確認成功");
              setStatus("success");
              setTimeout(() => {
                router.push("/auth/update-password");
              }, 500);
            } else {
              console.log("❌ タイムアウト - セッションが見つかりません");
              setStatus("error");
              setErrorMessage(
                "認証処理がタイムアウトしました。リンクをもう一度クリックするか、新しいパスワードリセットを行ってください。"
              );
              setTimeout(() => {
                router.push(
                  `/auth/reset-password?error=${encodeURIComponent(
                    "認証処理がタイムアウトしました。もう一度パスワードリセットを行ってください。"
                  )}`
                );
              }, 3000);
            }
          });
        }, 5000);
      } catch (error) {
        console.error("❌ パスワードリセット処理エラー:", error);

        let errorMsg = "パスワードリセット処理でエラーが発生しました";

        if (error instanceof Error) {
          if (error.message.includes("Token has expired")) {
            errorMsg =
              "パスワードリセットリンクの有効期限が切れています。新しいパスワードリセットメールを送信してください。";
          } else if (error.message.includes("Invalid token")) {
            errorMsg =
              "パスワードリセットリンクが無効です。正しいリンクをクリックしてください。";
          } else if (
            error.message.includes("code challenge") ||
            error.message.includes("code verifier")
          ) {
            errorMsg =
              "認証エラーが発生しました。ブラウザのキャッシュをクリアして、再度パスワードリセットを行ってください。";
          }
        }

        setStatus("error");
        setErrorMessage(errorMsg);

        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          router.push(
            `/auth/reset-password?error=${encodeURIComponent(errorMsg)}`
          );
        }, 3000);
      }
    };

    processPasswordReset();

    // クリーンアップ関数
    return () => {
      if (authSubscription?.unsubscribe) {
        authSubscription.unsubscribe();
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
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
            <p className="mt-2 text-xs text-gray-500">
              処理に時間がかかる場合があります
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
