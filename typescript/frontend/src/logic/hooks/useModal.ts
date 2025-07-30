import { useState } from "react";

/**
 * モーダルの開閉状態とデータを管理するカスタムフック。
 *
 * @template T - モーダルに渡すデータの型
 * @param initialOpen - モーダルの初期開閉状態（デフォルト: false）
 * @returns モーダル制御用のオブジェクト
 *
 * @example
 * ```typescript
 * const modal = useModal<{ id: number; name: string }>();
 *
 * // モーダルを開く（データ付き）
 * modal.openModal({ id: 1, name: "テスト" });
 *
 * // モーダルを閉じる
 * modal.closeModal();
 * ```
 */
// TODO: any型を適切な型に置き換える検討が必要
export const useModal = <T = any>(initialOpen: boolean = false) => {
  // モーダルの開閉状態を管理
  const [isOpen, setIsOpen] = useState(initialOpen);
  // モーダルに渡すデータを管理
  const [data, setData] = useState<T | null>(null);

  /**
   * モーダルを開く関数。
   *
   * @param modalData - モーダルに渡すデータ（オプション）
   */
  const openModal = (modalData?: T) => {
    // データを設定（未指定の場合はnull）
    setData(modalData || null);
    // モーダルを開く
    setIsOpen(true);
  };

  /**
   * モーダルを閉じる関数。
   * 状態とデータの両方をリセットする。
   */
  const closeModal = () => {
    // モーダルを閉じる
    setIsOpen(false);
    // データをリセット
    setData(null);
  };

  return {
    /** モーダルの開閉状態 */
    isOpen,
    /** モーdalに渡されたデータ */
    data,
    /** モーダルを開く関数 */
    openModal,
    /** モーダルを閉じる関数 */
    closeModal,
  };
};
