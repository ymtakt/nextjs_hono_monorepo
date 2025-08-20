/**
 * 日付文字列を日本語形式にフォーマットする関数。
 *
 * @param dateString - フォーマット対象の日付文字列
 * @returns 日本語ロケールでフォーマットされた日付文字列、またはnull
 *
 * @example
 * ```typescript
 * formatDateToJapanese("2024-01-15T00:00:00Z") // "2024/1/15"
 * formatDateToJapanese("invalid") // null
 * ```
 */
export const formatDateToJapanese = (dateString: string): string | null => {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleDateString('ja-JP');
};
