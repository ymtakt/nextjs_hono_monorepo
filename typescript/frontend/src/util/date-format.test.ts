import { describe, expect, it } from 'vitest';
import { formatDateToJapanese } from '@/util/date-format';

describe('formatDateToJapanese関数のテスト', () => {
  // 前提：有効な日付文字列が渡される
  // 期待値：日本語ロケールでフォーマットされた日付文字列が返される
  it('有効なISO日付文字列が正しくフォーマットされる', () => {
    // Arrange: 有効な日付文字列を準備する
    const result = formatDateToJapanese('2024-03-15');

    // Assert: 日本語ロケールでフォーマットされた日付文字列が返されることを確認する
    expect(result).toBe('2024/3/15');
  });

  // 前提：無効な日付文字列が渡される
  // 期待値：nullが返される
  it('無効な日付文字列が渡される', () => {
    // Arrange: 無効な日付文字列を準備する
    const result = formatDateToJapanese('invalid');

    // Assert: nullが返されることを確認する
    expect(result).toBe(null);
  });
});
