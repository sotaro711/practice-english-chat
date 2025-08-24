export default function PasswordResetCallbackLoading() {
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
