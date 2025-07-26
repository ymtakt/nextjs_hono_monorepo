import { formatDateToJapanese } from "@/utils/date-format";
import { describe, beforeEach, afterEach, it, expect, vi } from "vitest";

describe("formatDateToJapanese", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe("正常なケース", () => {
    it("ISO形式の日付文字列を日本語形式にフォーマットする", () => {
      // タイムゾーンに依存しない日付のみの形式を使用
      const result = formatDateToJapanese("2024-01-15");
      expect(result).toBe("2024/1/15");
    });
  });

  describe("エラーケース", () => {
    it('無効な日付文字列の場合は"日付不明"を返す', () => {
      const result = formatDateToJapanese("invalid-date");
      expect(result).toBe("日付不明");
    });
  });

  describe("エラーハンドリング", () => {
    it("エラーが発生した場合はconsole.errorが呼ばれる", () => {
      formatDateToJapanese("invalid-date");
      expect(consoleErrorSpy).toHaveBeenCalledWith("Date formatting error:", expect.any(Error));
    });
  });
});
