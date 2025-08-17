/**
 * 日付文字列を日本語形式にフォーマットする関数。
 *
 * @param dateString - フォーマット対象の日付文字列
 * @returns 日本語ロケールでフォーマットされた日付文字列、または「日付不明」
 *
 * @example
 * ```typescript
 * formatDateToJapanese("2024-01-15T00:00:00Z") // "2024/1/15"
 * formatDateToJapanese("invalid") // "日付不明"
 * ```
 */
export const formatDateToJapanese = (dateString: string): string => {
  try {
    // 入力文字列からDateオブジェクトを生成
    const date = new Date(dateString);

    // 無効な日付をチェック
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date: ${dateString}`);
    }

    // 日本語ロケールで日付をフォーマット
    return date.toLocaleDateString('ja-JP');
  } catch (error) {
    // エラーログを出力
    console.error('Date formatting error:', error);
    // フォールバック文字列を返す
    return '日付不明';
  }
};
