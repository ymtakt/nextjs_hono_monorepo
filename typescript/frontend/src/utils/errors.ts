/**
 * API外部エラーコード定義。
 *
 * 外部APIから返されるエラーコードとアプリケーション内部で使用するエラーコードのマッピングを定義する。
 * 主にuse-case層で外部APIのレスポンスエラーを内部エラーに変換する際に使用される。
 */
const API_EXTERNAL_ERROR_CODES = {
  /**
   * 基本的なエラーコード。
   * ネットワークエラーやサーバーエラーなど、アプリケーション全体で共通するエラーを定義する。
   */
  BASE: {
    /** ネットワーク接続エラー。 */
    NETWORK_ERROR: 'NETWORK_ERROR',
    /** サーバー内部エラー。 */
    SERVER_ERROR: 'SERVER_ERROR',
  },
  /**
   * Todo関連のAPI外部エラーコード。
   * 外部APIから返されるTodo関連のエラーレスポンスを内部エラーコードに変換するために使用される。
   */
  API_TODO: {
    /** Todoが見つからない場合のエラー。 */
    NOT_FOUND: 'TODO_NOT_FOUND',
    /** Todoの取得に失敗した場合のエラー。 */
    FETCH_FAILED: 'TODO_FETCH_FAILED',
    /** Todoの作成に失敗した場合のエラー。 */
    CREATE_FAILED: 'TODO_CREATE_FAILED',
    /** Todoの更新に失敗した場合のエラー。 */
    UPDATE_FAILED: 'TODO_UPDATE_FAILED',
    /** Todoの削除に失敗した場合のエラー。 */
    DELETE_FAILED: 'TODO_DELETE_FAILED',
  },
} as const

/**
 * Server Action固有のエラーコード定義。
 *
 * Server Action層で発生する固有のエラーを定義する。
 * フォーム処理やServer Action特有の処理で発生するエラーを含む。
 */
const SERVER_ACTION_ERROR_CODES = {
  /**
   * Todo関連のServer Actionエラーコード。
   * Server Action実行時に発生するTodo関連のエラーを定義する。
   */
  ACTION_TODO: {
    /** Todo IDが見つからない場合のエラー。 */
    ID_NOT_FOUND: 'TODO_ID_NOT_FOUND',
    /** フォームデータが無効な場合のエラー。 */
    FORM_DATA_INVALID: 'FORM_DATA_INVALID',
    /** 一般的な作成失敗エラー。 */
    GENERAL_CREATE_FAILED: 'GENERAL_CREATE_FAILED',
    /** 一般的な更新失敗エラー。 */
    GENERAL_UPDATE_FAILED: 'GENERAL_UPDATE_FAILED',
    /** 一般的な削除失敗エラー。 */
    GENERAL_DELETE_FAILED: 'GENERAL_DELETE_FAILED',
  },
} as const

/**
 * システム全体のエラーコード定義。
 *
 * API外部エラーコードとServer Actionエラーコードを統合したエラーコード定義。
 * アプリケーション全体で使用されるすべてのエラーコードを含む。
 */
export const ERROR_CODES = {
  ...API_EXTERNAL_ERROR_CODES,
  ...SERVER_ACTION_ERROR_CODES,
} as const

/**
 * エラーコードからユーザー向けメッセージへの変換マップ。
 *
 * 各エラーコードに対応するユーザーに表示するエラーメッセージを定義する。
 * メッセージは日本語で記述され、エンドユーザーにとって理解しやすい内容とする。
 */
const ERROR_MESSAGES: Record<AppErrorCode, string> = {
  // API External Error
  [ERROR_CODES.BASE.NETWORK_ERROR]: 'ネットワークエラーが発生しました',
  [ERROR_CODES.BASE.SERVER_ERROR]: 'サーバーエラーが発生しました',

  // TODOのAPI External Error
  [ERROR_CODES.API_TODO.NOT_FOUND]: 'Todoが見つかりませんでした',
  [ERROR_CODES.API_TODO.FETCH_FAILED]: 'Todoの取得に失敗しました',
  [ERROR_CODES.API_TODO.CREATE_FAILED]: 'Todoの作成に失敗しました',
  [ERROR_CODES.API_TODO.UPDATE_FAILED]: 'Todoの更新に失敗しました',
  [ERROR_CODES.API_TODO.DELETE_FAILED]: 'Todoの削除に失敗しました',

  // TODOのServer Action Error
  [ERROR_CODES.ACTION_TODO.ID_NOT_FOUND]: 'TodoIDが見つかりません',
  [ERROR_CODES.ACTION_TODO.FORM_DATA_INVALID]: 'フォームデータが無効です',
  [ERROR_CODES.ACTION_TODO.GENERAL_CREATE_FAILED]: 'Todoの作成に失敗しました',
  [ERROR_CODES.ACTION_TODO.GENERAL_UPDATE_FAILED]: 'Todoの更新に失敗しました',
  [ERROR_CODES.ACTION_TODO.GENERAL_DELETE_FAILED]: 'Todoの削除に失敗しました',
}

/**
 * ネストされたオブジェクトから全ての値の型を抽出するヘルパー型。
 *
 * オブジェクトの階層構造を平坦化し、最終的な値の型のみを抽出する。
 * ERROR_CODESのような階層構造を持つオブジェクトから、実際のエラーコード文字列の型を取得するために使用される。
 *
 * @template T - 抽出対象のオブジェクト型
 */
type ExtractNestedValues<T> = T extends Record<string, unknown>
  ? {
      [K in keyof T]: T[K] extends Record<string, unknown> ? T[K][keyof T[K]] : T[K]
    }[keyof T]
  : never

/**
 * アプリケーションエラーコード型。
 *
 * システム全体で使用されるエラーコードの型定義。
 * ERROR_CODESから抽出された実際のエラーコード文字列のリテラル型である。
 */
export type AppErrorCode = ExtractNestedValues<typeof ERROR_CODES>

/**
 * アプリケーション内で使用する統一エラークラス。
 *
 * 外部APIエラーを変換した後の、ユーザー向けメッセージを持つエラーである。
 * Server ComponentとClient Component間のシリアライゼーションに対応するため、
 * エラーコードをnameプロパティに含めて識別可能にしている。
 */
export class ApplicationError extends Error {
  /**
   * ApplicationErrorのコンストラクタ。
   *
   * @param code - エラーコード。AppErrorCode型の値を指定する
   * @param originalError - 元のエラーオブジェクト。デバッグ用に保持される
   */
  constructor(
    code: AppErrorCode,
    public readonly originalError?: unknown,
  ) {
    // エラーコードに対応するユーザー向けメッセージを設定
    super(ERROR_MESSAGES[code])
    this.name = 'ApplicationError'
  }
}

/**
 * サーバーアクションエラーを処理するヘルパー関数。
 *
 * サーバーアクション実行時に発生したエラーを、アプリケーションエラーに変換する。
 * エラーコードに対応するユーザー向けメッセージを取得し、エラー状態を返す。
 *
 * @param error - エラーオブジェクト。ApplicationErrorのインスタンスを指定する
 * @param defaultCode - デフォルトのエラーコード。デフォルトのエラーメッセージを設定する
 * @returns エラー状態を含むオブジェクト。ユーザー向けメッセージとエラーコードを含む
 */
export function handleServerActionError(error: unknown, defaultCode: AppErrorCode): string {
  if (error instanceof ApplicationError) {
    return error.message
  }
  return ERROR_MESSAGES[defaultCode]
}
