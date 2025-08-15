import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useModal } from '@/util/hook/useModal'

describe('useModal', () => {
  // 前提：初期状態でuseModalが呼び出される
  // 期待値：isOpenがfalse、dataがnullで初期化される
  it('初期状態が正しく設定される', () => {
    const { result } = renderHook(() => useModal())

    expect(result.current.isOpen).toBe(false)
    expect(result.current.data).toBe(null)
    expect(typeof result.current.openModal).toBe('function')
    expect(typeof result.current.closeModal).toBe('function')
  })

  // 前提：initialOpenにtrueを指定してuseModalが呼び出される
  // 期待値：isOpenがtrueで初期化される
  it('初期状態をtrueに設定できる', () => {
    const { result } = renderHook(() => useModal(true))

    expect(result.current.isOpen).toBe(true)
    expect(result.current.data).toBe(null)
  })

  // 前提：openModal関数がデータなしで呼び出される
  // 期待値：isOpenがtrueになり、dataがnullのまま
  it('データなしでモーダルを開ける', () => {
    const { result } = renderHook(() => useModal())

    act(() => {
      result.current.openModal()
    })

    expect(result.current.isOpen).toBe(true)
    expect(result.current.data).toBe(null)
  })

  // 前提：openModal関数がデータ付きで呼び出される
  // 期待値：isOpenがtrueになり、渡されたデータが設定される
  it('データ付きでモーダルを開ける', () => {
    const { result } = renderHook(() => useModal<{ id: number; name: string }>())
    const testData = { id: 1, name: 'テスト' }

    act(() => {
      result.current.openModal(testData)
    })

    expect(result.current.isOpen).toBe(true)
    expect(result.current.data).toEqual(testData)
  })

  // 前提：モーダルが開いた状態でcloseModal関数が呼び出される
  // 期待値：isOpenがfalseになり、dataがnullにリセットされる
  it('モーダルを閉じると状態がリセットされる', () => {
    const { result } = renderHook(() => useModal<string>())
    const testData = 'テストデータ'

    // モーダルを開く
    act(() => {
      result.current.openModal(testData)
    })

    // モーダルを閉じる
    act(() => {
      result.current.closeModal()
    })

    expect(result.current.isOpen).toBe(false)
    expect(result.current.data).toBe(null)
  })

  // 前提：openModal関数が複数回連続で呼び出される
  // 期待値：最後に渡されたデータが設定される
  it('複数回開くと最後のデータが保持される', () => {
    const { result } = renderHook(() => useModal<number>())

    act(() => {
      result.current.openModal(1)
    })

    act(() => {
      result.current.openModal(2)
    })

    expect(result.current.isOpen).toBe(true)
    expect(result.current.data).toBe(2)
  })
})
