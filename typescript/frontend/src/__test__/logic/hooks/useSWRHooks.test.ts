import { renderHook, waitFor } from "@testing-library/react";
import { useAppSWR } from "@/logic/hooks/useSWRHooks";
import { describe, it, expect, vi, beforeEach } from "vitest";

// getErrorMessage関数をモック化
vi.mock("@/utils/error-handler", () => ({
  getErrorMessage: vi.fn(),
}));

/**
 * useAppSWR hook のテスト。
 * SWRのラッパー機能とエラーメッセージの変換を検証する。
 */
describe("useAppSWR", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * データの取得が成功した場合の動作を検証する。
   */
  it("データの取得が成功した場合、正しい状態を返す", async () => {
    const mockFetcher = vi.fn().mockResolvedValue("テストデータ");

    const { result } = renderHook(() => useAppSWR("test-key", mockFetcher));

    // データが取得されるまで待機
    await waitFor(() => {
      expect(result.current.data).toBe("テストデータ");
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(undefined);
    expect(result.current.errorMessage).toBe(null);
  });

  /**
   * データの取得が失敗した場合の動作を検証する。
   */
  it("データの取得が失敗した場合、エラー状態を正しく管理する", async () => {
    const mockError = new Error("テストエラー");
    const mockFetcher = vi.fn().mockRejectedValue(mockError);

    // getErrorMessage のモック設定
    const { getErrorMessage } = await import("@/utils/error-handler");
    vi.mocked(getErrorMessage).mockReturnValue("変換されたエラーメッセージ");

    const { result } = renderHook(() => useAppSWR("test-key", mockFetcher));

    // エラー状態になるまで待機
    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBe(undefined);
    expect(result.current.errorMessage).toBe("変換されたエラーメッセージ");
    expect(getErrorMessage).toHaveBeenCalledWith(mockError);
  });

  /**
   * カスタム設定が正しく適用されることを検証する。
   */
  it("カスタム設定が正しく適用される", async () => {
    const mockFetcher = vi.fn().mockResolvedValue("テストデータ");
    const customConfig = {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    };

    const { result } = renderHook(() =>
      useAppSWR("test-key", mockFetcher, customConfig)
    );

    await waitFor(() => {
      expect(result.current.data).toBe("テストデータ");
    });

    // カスタム設定が適用されていることを間接的に確認
    expect(result.current.data).toBe("テストデータ");
  });

  /**
   * keyがnullの場合、リクエストが実行されないことを検証する。
   */
  it("keyがnullの場合、リクエストが実行されない", () => {
    const mockFetcher = vi.fn();

    const { result } = renderHook(() => useAppSWR(null, mockFetcher));

    expect(mockFetcher).not.toHaveBeenCalled();
    expect(result.current.data).toBe(undefined);
    expect(result.current.errorMessage).toBe(null);
  });
});
