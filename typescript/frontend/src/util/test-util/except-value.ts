import type { Result } from 'neverthrow';

/**
 * Result型のOkバリアントから値を安全に取得するテスト用ヘルパー関数
 *
 * Result型がErrの場合はエラーをthrowするため、テストが確実に失敗する
 *
 * @template T - Result型のOkバリアントの値の型
 * @template E - Result型のErrバリアントのエラーの型
 * @param result - 検証対象のResult型インスタンス
 * @returns Result型のOkバリアントに含まれる値
 * @throws {Error} Result型がErrバリアントの場合
 *
 * @example
 * ```typescript
 * const result = await fetchUser(1);
 * const user = expectOkValue(result); // UserEntity型として安全に取得
 * expect(user.name).toBe('John Doe');
 * ```
 */

export const expectOkValue = <T, E>(result: Result<T, E>): T => {
  if (!result.isOk()) {
    throw new Error(`Expected Ok result, but got Error: ${JSON.stringify(result)}`);
  }
  return result.match(
    (value) => value,
    (error) => {
      throw new Error(`Unexpected error: ${error}`);
    },
  );
};

/**
 * Result型のErrバリアントからエラーを安全に取得するテスト用ヘルパー関数
 *
 * Result型がOkの場合はエラーをthrowするため、テストが確実に失敗する
 *
 * @template T - Result型のOkバリアントの値の型
 * @template E - Result型のErrバリアントのエラーの型
 * @param result - 検証対象のResult型インスタンス
 * @returns Result型のErrバリアントに含まれるエラー
 * @throws {Error} Result型がOkバリアントの場合
 *
 * @example
 * ```typescript
 * const result = await fetchUser(999);
 * const error = expectErrValue(result); // エラー型として安全に取得
 * expect(error).toBe('USER_NOT_FOUND');
 * ```
 */
export const expectErrValue = <T, E>(result: Result<T, E>): E => {
  if (!result.isErr()) {
    throw new Error(`Expected Err result, but got Ok: ${JSON.stringify(result)}`);
  }
  return result.match(
    (value) => {
      throw new Error(`Unexpected success: ${value}`);
    },
    (error) => error,
  );
};
