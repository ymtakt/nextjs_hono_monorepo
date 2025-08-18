import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useModal } from '@/util/hook/useModal';

describe('useModal', () => {
  // 前提：初期状態でuseModalが呼び出される
  // 期待値：isOpenがfalse、dataがnullで初期化される
  it('初期状態が正しく設定される', () => {
    const { result } = renderHook(() => useModal());

    // モーダルが閉じた状態で初期化されているかどうか
    expect(result.current.isOpen).toBe(false);
    // データがnullで初期化されているかどうか
    expect(result.current.data).toBe(null);
    // openModal関数が提供されているかどうか
    expect(typeof result.current.openModal).toBe('function');
    // closeModal関数が提供されているかどうか
    expect(typeof result.current.closeModal).toBe('function');
  });

  // 前提：initialOpenにtrueを指定してuseModalが呼び出される
  // 期待値：isOpenがtrueで初期化される
  it('初期状態をtrueに設定できる', () => {
    const { result } = renderHook(() => useModal(true));

    // モーダルが開いた状態で初期化されているかどうか
    expect(result.current.isOpen).toBe(true);
    // データがnullで初期化されているかどうか
    expect(result.current.data).toBe(null);
  });

  // 前提：openModal関数がデータなしで呼び出される
  // 期待値：isOpenがtrueになり、dataがnullのまま
  it('データなしでモーダルを開ける', () => {
    const { result } = renderHook(() => useModal());

    act(() => {
      result.current.openModal();
    });

    // モーダルが開いた状態になっているかどうか
    expect(result.current.isOpen).toBe(true);
    // データがnullのまま保持されているかどうか
    expect(result.current.data).toBe(null);
  });

  // 前提：openModal関数がデータ付きで呼び出される
  // 期待値：isOpenがtrueになり、渡されたデータが設定される
  it('データ付きでモーダルを開ける', () => {
    const { result } = renderHook(() => useModal<{ id: number; name: string }>());
    const testData = { id: 1, name: 'テスト' };

    act(() => {
      result.current.openModal(testData);
    });

    // モーダルが開いた状態になっているかどうか
    expect(result.current.isOpen).toBe(true);
    // 渡されたデータが正しく設定されているかどうか
    expect(result.current.data).toEqual(testData);
  });

  // 前提：モーダルが開いた状態でcloseModal関数が呼び出される
  // 期待値：isOpenがfalseになり、dataがnullにリセットされる
  it('モーダルを閉じると状態がリセットされる', () => {
    const { result } = renderHook(() => useModal<string>());
    const testData = 'テストデータ';

    // モーダルを開く
    act(() => {
      result.current.openModal(testData);
    });

    // モーダルを閉じる
    act(() => {
      result.current.closeModal();
    });

    // モーダルが閉じた状態になっているかどうか
    expect(result.current.isOpen).toBe(false);
    // データがnullにリセットされているかどうか
    expect(result.current.data).toBe(null);
  });

  // 前提：openModal関数が複数回連続で呼び出される
  // 期待値：最後に渡されたデータが設定される
  it('複数回開くと最後のデータが保持される', () => {
    const { result } = renderHook(() => useModal<number>());

    act(() => {
      result.current.openModal(1);
    });

    act(() => {
      result.current.openModal(2);
    });

    // モーダルが開いた状態を保持しているかどうか
    expect(result.current.isOpen).toBe(true);
    // 最後に渡されたデータが保持されているかどうか
    expect(result.current.data).toBe(2);
  });
});
