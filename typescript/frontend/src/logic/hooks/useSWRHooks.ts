import { getErrorMessage } from "@/utils/error-handler";
import useSWR, { type SWRConfiguration, type SWRResponse } from "swr";

/** SWRで使用するエラー型の定義 */
type FetcherError = Error & { status?: number };

/**
 * useSWRのラッパーフック。
 * アプリケーション全体で共通化したい設定とエラーメッセージ変換機能を提供する。
 *
 * @template T - 取得するデータの型
 * @param key - SWRキャッシュのキー（nullの場合はリクエストを実行しない）
 * @param fetcher - データを取得する非同期関数
 * @param config - SWRの設定オプション
 * @returns SWRの戻り値に加えて、変換済みエラーメッセージを含むオブジェクト
 *
 * @example
 * ```typescript
 * const { data, error, errorMessage, isLoading } = useAppSWR(
 *   "todos",
 *   () => fetchTodos()
 * );
 *
 * if (errorMessage) {
 *   toast.error(errorMessage); // ユーザー向けメッセージを表示
 * }
 * ```
 */
export const useAppSWR = <T>(
  key: string | null,
  fetcher: () => Promise<T>,
  config: SWRConfiguration = {}
): SWRResponse<T, FetcherError> & { errorMessage: string | null } => {
  // アプリケーション全体で共通化する設定をマージ
  const mergedConfig = {
    // フォーカス時の再検証を無効化
    revalidateOnFocus: false,
    // ネットワーク再接続時の再検証を無効化
    revalidateOnReconnect: false,
    // エラー時の自動リトライを無効化
    shouldRetryOnError: false,
    // ユーザー指定の設定で上書き
    ...config,
  } satisfies SWRConfiguration;

  // 元のuseSWRを実行
  const swrResult = useSWR<T, FetcherError>(key, () => fetcher(), mergedConfig);

  return {
    // 元のSWR結果をそのまま展開
    ...swrResult,
    // アプリケーション用に変換されたエラーメッセージを追加
    errorMessage: swrResult.error ? getErrorMessage(swrResult.error) : null,
  };
};
