'use client'

import React, { createContext, useState, useCallback, useContext } from 'react'

/** トーストの種類を定義する型 */
type ToastType = 'success' | 'error'

/** トーストオブジェクトの型定義 */
type Toast = {
    /** 一意識別子 */
    id: string
    /** 表示メッセージ */
    message: string
    /** トーストの種類 */
    type: ToastType
}

/** トーストコンテキストで提供される機能の型定義 */
type ToastContextType = {
    /** 成功メッセージを表示する関数 */
    success: (message: string) => void
    /** エラーメッセージを表示する関数 */
    error: (message: string) => void
}

/** トーストコンテキストの作成 */
const ToastContext = createContext<ToastContextType | undefined>(undefined)

/**
 * トースト通知機能を提供するプロバイダコンポーネント。
 * 子コンポーネントにトースト表示機能を提供し、画面右上にトーストを描画する。
 * 
 * @param props - コンポーネントのプロパティ
 * @param props.children - 子要素
 * @returns トースト機能付きのプロバイダコンポーネント
 * 
 * @example
 * ```tsx
 * <ToastProvider>
 *   <App />
 * </ToastProvider>
 * ```
 */
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    // 現在表示中のトースト一覧を管理
    const [toasts, setToasts] = useState<Toast[]>([])

    /**
     * 新しいトーストを追加し、3秒後に自動削除する内部関数。
     * 
     * @param message - 表示するメッセージ
     * @param type - トーストの種類
     */
    const addToast = useCallback((message: string, type: ToastType) => {
        // 現在時刻を使用してユニークなIDを生成
        const id = Date.now().toString()
        // 新しいトーストを追加
        setToasts(prev => [...prev, { id, message, type }])

        // 3秒後に自動削除のタイマーを設定
        setTimeout(() => {
            setToasts(prev => prev.filter(toast => toast.id !== id))
        }, 3000)
    }, [])

    /**
     * 成功メッセージのトーストを表示する関数。
     */
    const success = useCallback((message: string) => {
        addToast(message, 'success')
    }, [addToast])

    /**
     * エラーメッセージのトーストを表示する関数。
     */
    const error = useCallback((message: string) => {
        addToast(message, 'error')
    }, [addToast])

    return (
        <ToastContext.Provider value={{ success, error }}>
            {children}

            {/* Toast表示エリア - 画面右上に固定配置 */}
            <div className="fixed top-4 right-4 z-50 space-y-2">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`px-4 py-3 rounded-lg shadow-lg text-white max-w-sm ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
                            }`}
                    >
                        {toast.message}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    )
}

/**
 * トースト通知機能を使用するためのカスタムフック。
 * ToastProvider内でのみ使用可能。
 * 
 * @returns トースト表示用の関数群
 * @throws ToastProvider外で使用した場合にエラーをthrow
 * 
 * @example
 * ```typescript
 * const toast = useToast();
 * 
 * // 成功メッセージ
 * toast.success("保存しました");
 * 
 * // エラーメッセージ
 * toast.error("エラーが発生しました");
 * ```
 */
export const useToast = () => {
    const context = useContext(ToastContext)
    // プロバイダ外での使用チェック
    if (!context) {
        throw new Error('useToast must be used within ToastProvider')
    }
    return context
}