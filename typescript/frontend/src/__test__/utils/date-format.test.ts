import { describe, expect, it } from 'vitest';
import { formatDateToJapanese } from '@/util/date-format';

describe('formatDateToJapanese関数のテスト', () => {
  // 前提：有効なISO形式の日付文字列が渡される
  // 期待値：日本語ロケールでフォーマットされた日付文字列が返される
  it('有効なISO日付文字列が正しくフォーマットされる', () => {
    const dateString = '2024-01-15T00:00:00Z';

    // テスト対象の関数を実行
    const result = formatDateToJapanese(dateString);

    // 日本語形式の日付文字列に変換されているかどうか
    expect(result).toBe('2024/1/15');
  });

  // 前提：yyyy-mm-dd形式の日付文字列が渡される
  // 期待値：正しく日本語形式（yyyy/m/d）に変換される
  it('yyyy-mm-dd形式の日付文字列が正しくフォーマットされる', () => {
    const dateString = '2024-12-25';

    // テスト対象の関数を実行
    const result = formatDateToJapanese(dateString);

    // 日本語形式の日付文字列に変換されているかどうか
    expect(result).toBe('2024/12/25');
  });

  // 前提：無効な日付文字列が渡される
  // 期待値：「日付不明」が返される
  it('無効な日付文字列が渡される', () => {
    const dateString = 'invalid';

    // テスト対象の関数を実行
    const result = formatDateToJapanese(dateString);

    // エラー時のフォールバック文字列が返されているかどうか
    expect(result).toBe('日付不明');
  });
});
