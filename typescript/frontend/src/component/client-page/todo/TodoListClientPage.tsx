'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useActionState, useState, useTransition } from 'react';
import z from 'zod';
import type { DeleteTodoActionState } from '@/component/client-page/todo/action';
import { deleteTodoAction } from '@/component/client-page/todo/action';
import { ClientComponentLoading, Modal } from '@/component/functionless/general';
import { SearchBox } from '@/component/functionless/general/SearchBox';
import type { TodoEntity } from '@/domain/data/todo.data';
import { formatDateToJapanese } from '@/util/date-format';
import { createInitialFormActionState } from '@/util/form-action-state';
import { useModal } from '@/util/hook/useModal';
import { useToast } from '@/util/hook/useToast';
import { extractZodErrorMessage, withServerActionHandling } from '@/util/server-actions';

// 検索バリデーションの識別子とメッセージ
const SEARCH_VALIDATION_ERRORS = {
  SYMBOL_NOT_ALLOWED: 'SYMBOL_NOT_ALLOWED',
} as const;

const SEARCH_ERROR_MESSAGES = {
  SYMBOL_NOT_ALLOWED: '検索に記号は使用できません',
} as const;

type SearchValidationError = keyof typeof SEARCH_VALIDATION_ERRORS;

/**
 * Todo検索用のバリデーションスキーマ
 */
const searchTodoFormSchema = z.object({
  search: z.string().regex(/^[a-zA-Z0-9]*$/, SEARCH_VALIDATION_ERRORS.SYMBOL_NOT_ALLOWED),
});

type TodoListProps = {
  todos: TodoEntity[];
};

export function TodoListClientPage(props: TodoListProps) {
  const { todos } = props;
  const router = useRouter();
  const { error } = useToast();
  const [isLoading, startTransition] = useTransition();
  // URLクエリパラメータと連動するステート
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  // 検索用のローカル状態
  const [search, setSearch] = useState(initialSearch);

  const deleteModal = useModal<{ id: number; title: string }>();

  // 初期状態を作成
  const initialDeleteState: DeleteTodoActionState = createInitialFormActionState();
  // Server Actionをラップ
  const wrappedDeleteAction = withServerActionHandling(deleteTodoAction, {
    onSuccess: ({ success }) => {
      deleteModal.closeModal();
      success('削除しました');
    },
    initialState: initialDeleteState,
  });

  const [_, deleteAction, isPendingDelete] = useActionState(
    wrappedDeleteAction,
    initialDeleteState,
  );

  const handleSearch = (formData: FormData) => {
    startTransition(() => {
      const searchValue = formData.get('search') as string;
      const validationResult = searchTodoFormSchema.safeParse({ search: searchValue });

      if (!validationResult.success) {
        const errorCode = extractZodErrorMessage(validationResult.error) as SearchValidationError;
        const errorMessage = SEARCH_ERROR_MESSAGES[errorCode] || '検索でエラーが発生しました';
        error(errorMessage);
        return;
      }
      const params = new URLSearchParams(validationResult.data.search);
      if (searchValue) {
        params.set('search', searchValue);
      }
      router.replace(`/?search=${searchValue}`);
    });
  };

  return (
    <>
      {isLoading && <ClientComponentLoading />}
      <div className="max-w-4xl mx-auto p-6">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-8">
          <SearchBox search={search} setSearch={setSearch} handleSearch={handleSearch} />
          <h1 className="text-3xl font-bold text-gray-900">Todo リスト</h1>
          <Link
            href="/register"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            新規作成
          </Link>
        </div>

        {/* Todoリスト */}
        {todos.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg
                className="w-16 h-16 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <p className="text-gray-500 text-lg mb-4">Todoが見つかりません</p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              最初のTodoを作成
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {todos.map((todo) => (
              <div key={todo.id}>
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className={`w-3 h-3 rounded-full ${todo.isCompleted ? 'bg-green-500' : 'bg-gray-300'}`}
                        ></div>
                        <h3
                          className={`text-lg font-semibold ${todo.isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}
                        >
                          {todo.title}
                        </h3>
                      </div>
                      {todo.description && (
                        <p
                          className={`text-gray-600 mb-3 ${todo.isCompleted ? 'line-through' : ''}`}
                        >
                          {todo.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        {formatDateToJapanese(todo.createdDate)}
                      </div>
                    </div>

                    <div className="">
                      <div className="flex items-center gap-2 ml-4">
                        <Link
                          href={`/detail/${todo.id}`}
                          className="text-blue-600 hover:text-blue-800 px-3 py-1 rounded-md hover:bg-blue-50 transition-colors duration-200"
                        >
                          詳細
                        </Link>
                        <Link
                          href={`/edit/${todo.id}`}
                          className="text-green-600 hover:text-green-800 px-3 py-1 rounded-md hover:bg-green-50 transition-colors duration-200"
                        >
                          編集
                        </Link>
                      </div>

                      <div className="">
                        <button
                          type="button"
                          onClick={() => deleteModal.openModal({ id: todo.id, title: todo.title })}
                        >
                          削除
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.closeModal}>
          <div>
            <form action={deleteAction}>
              <input type="hidden" name="todoId" value={deleteModal.data?.id} />
              <h3 className="text-lg font-semibold mb-4">削除確認</h3>
              <p className="mb-4">「{deleteModal.data?.title}」を削除しますか？</p>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={deleteModal.closeModal}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  {isPendingDelete ? '削除中...' : '削除'}
                </button>
              </div>
            </form>
          </div>
        </Modal>
      </div>
    </>
  );
}
