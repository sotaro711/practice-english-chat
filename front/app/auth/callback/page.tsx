import { handleAuthCallback } from "@/lib/auth-actions";
import { redirect } from "next/navigation";

interface CallbackPageProps {
  searchParams: {
    code?: string;
    error?: string;
    type?: string;
    flow?: string;
  };
}

export default async function CallbackPage({
  searchParams,
}: CallbackPageProps) {
  const { code, error } = searchParams;

  console.log("Callback received parameters:", {
    code: !!code,
    error,
    allParams: searchParams,
  });

  // エラーがある場合は登録ページにリダイレクト
  if (error) {
    redirect("/auth/signup?error=" + encodeURIComponent(error));
  }

  // コードがある場合は認証処理を実行（通常のメール確認のみ）
  if (code) {
    console.log("Processing email verification callback");

    const result = await handleAuthCallback(code);

    if (result?.error) {
      redirect("/auth/signup?error=" + encodeURIComponent(result.error));
    }

    // 成功した場合は指定されたページにリダイレクト
    if (result?.success && result?.redirectTo) {
      console.log("Redirecting to:", result.redirectTo);
      redirect(result.redirectTo);
    }
  }

  // コードもエラーもない場合はホームページにリダイレクト
  redirect("/");
}
