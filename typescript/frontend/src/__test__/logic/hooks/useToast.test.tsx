import { renderHook, act } from "@testing-library/react";
import { ToastProvider, useToast } from "@/logic/hooks/useToast";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";

/**
 * useToast hook のunit テスト。
 * hook の状態管理機能のみを検証する。
 */
describe("useToast", () => {
    beforeEach(() => {
        // タイマーをモック化
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    /**
     * ToastProvider外でuseToastを使用した場合にエラーが発生することを検証する。
     */
    it("ToastProvider外でuseToastを使用するとエラーが発生する", () => {
        expect(() => {
            renderHook(() => useToast());
        }).toThrow("useToast must be used within ToastProvider");
    });

    /**
     * ToastProvider内でuseToastが正しく初期化されることを検証する。
     */
    it("ToastProvider内でuseToastが正しく初期化される", () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <ToastProvider>{children}</ToastProvider>
        );

        const { result } = renderHook(() => useToast(), { wrapper });

        // 関数が正しく提供されることを確認
        expect(typeof result.current.success).toBe("function");
        expect(typeof result.current.error).toBe("function");
    });

    /**
     * success関数が正しく呼び出せることを検証する。
     */
    it("success関数が正しく呼び出せる", () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <ToastProvider>{children}</ToastProvider>
        );

        const { result } = renderHook(() => useToast(), { wrapper });

        // success関数を呼び出してもエラーが発生しないことを確認
        act(() => {
            result.current.success("成功メッセージ");
        });

        // 関数が正常に実行されることを確認（エラーが発生しない）
        expect(result.current.success).toBeDefined();
    });

    /**
     * error関数が正しく呼び出せることを検証する。
     */
    it("error関数が正しく呼び出せる", () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <ToastProvider>{children}</ToastProvider>
        );

        const { result } = renderHook(() => useToast(), { wrapper });

        // error関数を呼び出してもエラーが発生しないことを確認
        act(() => {
            result.current.error("エラーメッセージ");
        });

        // 関数が正常に実行されることを確認（エラーが発生しない）
        expect(result.current.error).toBeDefined();
    });

    /**
     * 複数回の関数呼び出しが正しく動作することを検証する。
     */
    it("複数回の関数呼び出しが正しく動作する", () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <ToastProvider>{children}</ToastProvider>
        );

        const { result } = renderHook(() => useToast(), { wrapper });

        // 複数回呼び出してもエラーが発生しないことを確認
        act(() => {
            result.current.success("成功1");
            result.current.error("エラー1");
            result.current.success("成功2");
        });

        // タイマーを進めても関数が正常に動作することを確認
        act(() => {
            vi.advanceTimersByTime(3000);
        });

        expect(result.current.success).toBeDefined();
        expect(result.current.error).toBeDefined();
    });
});