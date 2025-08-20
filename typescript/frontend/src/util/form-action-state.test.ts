
import { describe, expect, it } from 'vitest';
import { createInitialFormActionState } from '@/util/form-action-state';
import { ACTION_STATUS } from '@/util/server-actions';

describe('createInitialFormActionState', () => {
  // 前提：型パラメータを指定せずに関数が呼び出される
  // 期待値：標準的な初期状態が作成される
  it('標準的な初期状態が作成される', () => {
    const result = createInitialFormActionState();

    expect(result.status).toBe(ACTION_STATUS.IDLE);
    expect(result.error).toBe(null);
    expect(result.validationErrors).toBe(null);
  });

}); 