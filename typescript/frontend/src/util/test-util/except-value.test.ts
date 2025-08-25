import { err, ok } from 'neverthrow';
import { describe, expect, it } from 'vitest';
import { expectErrValue, expectOkValue } from '@/util/test-util/except-value';

describe('expectOkValue', () => {
  // 前提：Result型のOkバリアントが渡される
  // 期待値：Okバリアントに含まれる値が返される
  it('Okバリアントの場合、値が正常に取得される', () => {
    // Arrange: 準備
    const testValue = { id: 1, name: 'Test User' };
    const okResult = ok(testValue);

    // Act: 呼び出し
    const actualValue = expectOkValue(okResult);

    // Assert: 検証
    expect(actualValue).toEqual({
      id: 1,
      name: 'Test User',
    });
  });

  // 前提：Result型のErrバリアントが渡される
  // 期待値：エラーがthrowされる
  it('Errバリアントの場合、エラーがthrowされる', () => {
    // Arrange: 準備
    const testError = 'TEST_ERROR';
    const errResult = err(testError);

    // Act & Assert: 呼び出しと検証
    expect(() => expectOkValue(errResult)).toThrow(
      'Expected Ok result, but got Error: {"error":"TEST_ERROR"}',
    );
  });
});

describe('expectErrValue', () => {
  // 前提：Result型のErrバリアントが渡される
  // 期待値：Errバリアントに含まれるエラーが返される
  it('Errバリアントの場合、エラーが正常に取得される', () => {
    // Arrange: 準備
    const testError = 'USER_NOT_FOUND';
    const errResult = err(testError);

    // Act: 呼び出し
    const actualError = expectErrValue(errResult);

    // Assert: 検証
    expect(actualError).toEqual('USER_NOT_FOUND');
  });

  // 前提：Result型のOkバリアントが渡される
  // 期待値：エラーがthrowされる
  it('Okバリアントの場合、エラーがthrowされる', () => {
    // Arrange: 準備
    const testValue = { id: 1, name: 'Test User' };
    const okResult = ok(testValue);

    // Act & Assert: 呼び出しと検証
    expect(() => expectErrValue(okResult)).toThrow(
      'Expected Err result, but got Ok: {"value":{"id":1,"name":"Test User"}}',
    );
  });
});
