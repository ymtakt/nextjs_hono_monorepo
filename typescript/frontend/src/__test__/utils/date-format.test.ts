import { formatDateToJapanese } from "@/utils/date-format";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * formatDateToJapanese関数のテスト。
 * 日付文字列の日本語フォーマット変換を検証する。
 */
describe("formatDateToJapanese", () => {
  beforeEach(() => {
    // console.errorをモック化
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * 有効なISO日付文字列が正しくフォーマットされることを検証する。
   */
  it("有効なISO日付文字列が正しくフォーマットされる", () => {
    const dateString = "2024-01-15T00:00:00Z";
    const result = formatDateToJapanese(dateString);

    // 日本語ロケールでフォーマットされることを確認
    expect(result).toMatch(/\d{4}\/\d{1,2}\/\d{1,2}/);
  });

  /**
   * 日付のみの文字列が正しくフォーマットされることを検証する。
   */
  it("日付のみの文字列が正しくフォーマットされる", () => {
    const dateString = "2024-12-25";
    const result = formatDateToJapanese(dateString);

    expect(result).toMatch(/\d{4}\/\d{1,2}\/\d{1,2}/);
  });

  /**
   * 無効な日付文字列の場合にエラーメッセージが返されることを検証する。
   */
  it("無効な日付文字列の場合にエラーメッセージが返される", () => {
    const invalidDateString = "無効な日付";
    const result = formatDateToJapanese(invalidDateString);

    expect(result).toBe("日付不明");
    expect(console.error).toHaveBeenCalledWith(
      "Date formatting error:",
      expect.any(Error)
    );
  });

  /**
   * 空文字列の場合にエラーメッセージが返されることを検証する。
   */
  it("空文字列の場合にエラーメッセージが返される", () => {
    const result = formatDateToJapanese("");

    expect(result).toBe("日付不明");
    expect(console.error).toHaveBeenCalled();
  });

  /**
   * null値の場合にエラーメッセージが返されることを検証する。
   */
  it("null値の場合にエラーメッセージが返される", () => {
    const result = formatDateToJapanese(null as any);

    expect(result).toBe("日付不明");
    expect(console.error).toHaveBeenCalled();
  });

  /**
   * undefined値の場合にエラーメッセージが返されることを検証する。
   */
  it("undefined値の場合にエラーメッセージが返される", () => {
    const result = formatDateToJapanese(undefined as any);

    expect(result).toBe("日付不明");
    expect(console.error).toHaveBeenCalled();
  });

  /**
   * 特殊な日付形式が正しく処理されることを検証する。
   */
  it("特殊な日付形式が正しく処理される", () => {
    const dateString = "Mon Jan 15 2024 00:00:00 GMT+0900";
    const result = formatDateToJapanese(dateString);

    expect(result).toMatch(/\d{4}\/\d{1,2}\/\d{1,2}/);
  });
});
