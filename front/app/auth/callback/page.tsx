import { handleAuthCallback } from "@/lib/auth-actions";
import { redirect } from "next/navigation";

interface CallbackPageProps {
  searchParams: {
    code?: string;
    error?: string;
  };
}

export default async function CallbackPage({
  searchParams,
}: CallbackPageProps) {
  const { code, error } = searchParams;

  // エラーがある場合は登録ページにリダイレクト
  if (error) {
    redirect("/auth/signup?error=" + encodeURIComponent(error));
  }

  // コードがある場合は認証処理を実行
  if (code) {
    const result = await handleAuthCallback(code);

    if (result?.error) {
      redirect("/auth/signup?error=" + encodeURIComponent(result.error));
    }

    // 成功した場合は自動的にリダイレクトされます（handleAuthCallback内で）
  }

  // コードもエラーもない場合はホームページにリダイレクト
  redirect("/");
}
