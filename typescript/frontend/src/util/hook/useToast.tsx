'use client';

import { createContext, type PropsWithChildren, useCallback, useContext, useState } from 'react';

/** トーストの種類を定義する型 */
type ToastType = 'success' | 'error';

/** トーストオブジェクトの型定義 */
type Toast = {
  id: string;
  message: string;
  type: ToastType;
};

/** トーストコンテキストで提供される機能の型定義 */
type ToastContextType = {
  success: (message: string) => void;
  error: (message: string) => void;
};

/**
 * トーストコンテキストの作成
 *
 * アプリケーション全体でトースト機能を共有するためのコンテキスト
 * success と error 関数を子コンポーネントに提供
 *
 * */
const ToastContext = createContext<ToastContextType | undefined>(undefined);

/**
 * トースト通知機能を提供するプロバイダコンポーネント。
 * 子コンポーネントにトースト表示機能を提供し、画面右上にトーストを描画する。
 *
 * @param props - コンポーネントのプロパティ
 * @param props.children - 子要素
 * @returns トースト機能付きのプロバイダコンポーネント
 *
 */
export const ToastProvider = ({ children }: PropsWithChildren) => {
  // 現在表示中のトースト一覧を管理
  const [toasts, setToasts] = useState<Toast[]>([]);

  /**
   * 新しいトーストを追加し、3秒後に自動削除する内部関数。
   *
   * @param message - 表示するメッセージ
   * @param type - トーストの種類
   */
  const addToast = useCallback((message: string, type: ToastType) => {
    // 現在時刻を使用してユニークなIDを生成
    const id = Date.now().toString();
    // 新しいトーストを追加
    setToasts((prev) => [...prev, { id, message, type }]);

    // 3秒後に自動削除のタイマーを設定
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3000);
  }, []);

  /**
   * 成功メッセージのトーストを表示する関数。
   *
   * useCallback を使用して、addToast 関数をメモ化
   * メモ化することで、同じメッセージが連続して表示されるのを防ぐ
   */
  const success = useCallback(
    (message: string) => {
      addToast(message, 'success');
    },
    [addToast],
  );

  /**
   * エラーメッセージのトーストを表示する関数。
   *
   * useCallback を使用して、addToast 関数をメモ化
   * メモ化することで、同じメッセージが連続して表示されるのを防ぐ
   */
  const error = useCallback(
    (message: string) => {
      addToast(message, 'error');
    },
    [addToast],
  );

  return (
    <ToastContext.Provider value={{ success, error }}>
      {children}

      {/* Toast表示エリア - 画面右上に固定配置 */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-lg shadow-lg text-white max-w-sm ${
              toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

/**
 * トースト通知機能を使用するためのカスタムフック。
 * ToastProvider内でのみ使用可能。
 *
 * @returns トースト表示用の関数群
 * @throws ToastProvider外で使用した場合にエラーをthrow
 *
 */
export const useToast = () => {
  // contextを使用して、ToastProvider内で提供される関数を取得
  const context = useContext(ToastContext);
  // プロバイダ外での使用チェック
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};
