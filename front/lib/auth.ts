import { supabase } from "./supabase";
import { AuthError, User } from "@supabase/supabase-js";

export interface AuthResponse {
  user: User | null;
  error: AuthError | null;
}

// サインアップ
export async function signUp(
  email: string,
  password: string
): Promise<AuthResponse> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  return {
    user: data.user,
    error,
  };
}

// サインイン
export async function signIn(
  email: string,
  password: string
): Promise<AuthResponse> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return {
    user: data.user,
    error,
  };
}

// Googleサインイン
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/chat`,
    },
  });

  return { data, error };
}

// サインアウト
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

// パスワードリセット
export async function resetPassword(email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  return { data, error };
}

// 現在のユーザー取得
export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  return { user, error };
}

// セッション取得
export async function getSession() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  return { session, error };
}
