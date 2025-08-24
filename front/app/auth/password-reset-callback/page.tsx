import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import PasswordResetProcessor from "./password-reset-processor";

interface PasswordResetCallbackPageProps {
  searchParams: {
    code?: string;
    error?: string;
  };
}

export default function PasswordResetCallbackPage({
  searchParams,
}: PasswordResetCallbackPageProps) {
  // クライアントサイドコンポーネントで処理
  return <PasswordResetProcessor />;
}
