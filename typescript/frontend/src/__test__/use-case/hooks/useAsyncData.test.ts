import { renderHook, act } from "@testing-library/react";
import { useAsyncData } from "@/logic/hooks/useAsyncData";
import { describe, it, expect, vi } from "vitest";

// React Testing LibraryのrenderHookを使用してテストします：

describe("useAsyncData", () => {
  it("成功時の状態管理を正しく行う", async () => {
    const mockAsyncFunction = vi.fn().mockResolvedValue("test data");

    const { result } = renderHook(() => useAsyncData(mockAsyncFunction, { immediate: false }));

    // 初期状態
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBe(null);
    expect(result.current.error).toBe(null);

    // 実行
    await act(async () => {
      await result.current.execute();
    });

    // 完了後の状態
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBe("test data");
    expect(result.current.error).toBe(null);
  });

  it("エラー時の状態管理を正しく行う", async () => {
    const mockAsyncFunction = vi.fn().mockRejectedValue("error message");

    const { result } = renderHook(() => useAsyncData(mockAsyncFunction, { immediate: false }));

    await act(async () => {
      try {
        await result.current.execute();
      } catch (error) {
        console.error(error);
        // エラーは期待される
      }
    });

    expect(result.current.error).toBe("error message");
    expect(result.current.loading).toBe(false);
  });
});
