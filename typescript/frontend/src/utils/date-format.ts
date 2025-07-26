export const formatDateToJapanese = (dateString: string): string => {
  try {
    const date = new Date(dateString);

    // 無効な日付をチェック
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date: ${dateString}`);
    }

    return date.toLocaleDateString("ja-JP");
  } catch (error) {
    console.error("Date formatting error:", error);
    return "日付不明";
  }
};
