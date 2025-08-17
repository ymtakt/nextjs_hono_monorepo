import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useToast, ToastProvider } from '@/util/hook/useToast';
import type { PropsWithChildren } from 'react';

// 例えば、以下のような場合はテストを書かなくても良い
// 理由：
// useToast は 「複雑な状態変更や条件分岐を含む」 フックではなく単純なuseContextラッパーであるため

// テスト用のWrapper
const createWrapper =
  () =>
  ({ children }: PropsWithChildren) => <ToastProvider>{children}</ToastProvider>;

describe('useToast', () => {
  // 前提：ToastProvider外でuseToastが使用される
  // 期待値：適切なエラーメッセージでエラーがthrowされる
  it('Provider外で使用するとエラーが発生する', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useToast());
    }).toThrow('useToast must be used within ToastProvider');

    consoleSpy.mockRestore();
  });

  // 前提：ToastProvider内でuseToastが使用される
  // 期待値：success関数とerror関数が提供される
  it('Provider内では正常に動作し、関数が提供される', () => {
    const { result } = renderHook(() => useToast(), {
      wrapper: createWrapper(),
    });

    expect(typeof result.current.success).toBe('function');
    expect(typeof result.current.error).toBe('function');
  });

  // 前提：success関数とerror関数が呼び出される
  // 期待値：エラーが発生しない
  it('success関数とerror関数が正常に動作する', () => {
    const { result } = renderHook(() => useToast(), {
      wrapper: createWrapper(),
    });

    expect(() => {
      act(() => {
        result.current.success('成功メッセージ');
        result.current.error('エラーメッセージ');
      });
    }).not.toThrow();
  });
});
