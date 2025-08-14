import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useModal } from '@/utils/hooks/useModal'

/**
 * useModal hook のテスト。
 * モーダルの開閉状態とデータの管理を検証する。
 */
describe('useModal', () => {
  /**
   * 初期状態が正しく設定されることを検証する。
   */
  it('初期状態が正しく設定される', () => {
    const { result } = renderHook(() => useModal())

    // 初期状態の検証
    expect(result.current.isOpen).toBe(false)
    expect(result.current.data).toBe(null)
  })

  /**
   * initialOpenパラメータが正しく動作することを検証する。
   */
  it('initialOpenパラメータで初期状態を設定できる', () => {
    const { result } = renderHook(() => useModal<string>(true))

    expect(result.current.isOpen).toBe(true)
    expect(result.current.data).toBe(null)
  })

  /**
   * openModal関数がデータなしで正しく動作することを検証する。
   */
  it('openModal関数でモーダルを開くことができる', () => {
    const { result } = renderHook(() => useModal<string>())

    act(() => {
      result.current.openModal()
    })

    expect(result.current.isOpen).toBe(true)
    expect(result.current.data).toBe(null)
  })

  /**
   * openModal関数がデータ付きで正しく動作することを検証する。
   */
  it('openModal関数でデータ付きでモーダルを開くことができる', () => {
    const { result } = renderHook(() => useModal<{ id: number; name: string }>())

    const testData = { id: 1, name: 'テストデータ' }

    act(() => {
      result.current.openModal(testData)
    })

    expect(result.current.isOpen).toBe(true)
    expect(result.current.data).toEqual(testData)
  })

  /**
   * closeModal関数が正しく動作することを検証する。
   */
  it('closeModal関数でモーダルを閉じることができる', () => {
    const { result } = renderHook(() => useModal<string>())

    // モーダルを開く
    act(() => {
      result.current.openModal('テストデータ')
    })

    expect(result.current.isOpen).toBe(true)
    expect(result.current.data).toBe('テストデータ')

    // モーダルを閉じる
    act(() => {
      result.current.closeModal()
    })

    expect(result.current.isOpen).toBe(false)
    expect(result.current.data).toBe(null)
  })

  /**
   * 複数回のopen/closeサイクルが正しく動作することを検証する。
   */
  it('複数回のopen/closeサイクルが正しく動作する', () => {
    const { result } = renderHook(() => useModal<number>())

    // 1回目のopen/close
    act(() => {
      result.current.openModal(123)
    })
    expect(result.current.isOpen).toBe(true)
    expect(result.current.data).toBe(123)

    act(() => {
      result.current.closeModal()
    })
    expect(result.current.isOpen).toBe(false)
    expect(result.current.data).toBe(null)

    // 2回目のopen/close
    act(() => {
      result.current.openModal(456)
    })
    expect(result.current.isOpen).toBe(true)
    expect(result.current.data).toBe(456)
  })
})
