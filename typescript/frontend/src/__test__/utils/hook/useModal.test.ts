import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useModal } from '@/util/hook/useModal';

describe('useModal', () => {
  // 前提：デフォルト引数でフックが呼び出される
  // 期待値：初期状態（閉じている、データなし）が返される
  it('初期状態は閉じた状態でデータはnull', () => {
    const { result } = renderHook(() => useModal<{ id: number }>());

    expect(result.current.isOpen).toBe(false);
    expect(result.current.data).toBe(null);
  });

  // 前提：openModal関数がデータ付きで呼び出される
  // 期待値：モーダルが開き、データが設定される
  it('openModalでモーダルが開きデータが設定される', () => {
    const { result } = renderHook(() => useModal<{ id: number }>());

    act(() => {
      result.current.openModal({ id: 1 });
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.data).toEqual({ id: 1 });
  });

  // 前提：モーダルが開いた状態でcloseModal関数が呼び出される
  // 期待値：モーダルが閉じ、データがリセットされる
  it('closeModalでモーダルが閉じデータがリセットされる', () => {
    const { result } = renderHook(() => useModal<{ id: number }>());

    // まず開く
    act(() => {
      result.current.openModal({ id: 1 });
    });

    // 閉じる
    act(() => {
      result.current.closeModal();
    });

    expect(result.current.isOpen).toBe(false);
    expect(result.current.data).toBe(null);
  });
});
