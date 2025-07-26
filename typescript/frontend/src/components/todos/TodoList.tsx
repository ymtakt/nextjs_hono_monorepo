"use client";

import Link from "next/link";
import { formatDateToJapanese } from "@/utils/date-format";
import { useTodos } from "@/logic/hooks/todos/useTodos";
import { useModal } from "@/logic/hooks/useModal";
import { Modal } from "../base/Modal";
import { deleteTodo } from "@/core/services/todo.service";


export function TodoList() {
  const { todos, loading, error, refetch } = useTodos();
  const deleteModal = useModal<{ id: number; title: string }>();

  // 削除処理
  const handleDelete = async () => {
    if (!deleteModal.data) return;

    try {
      await deleteTodo(deleteModal.data.id);
      deleteModal.closeModal();
      refetch(); // リストを再取得
    } catch (error) {
      console.error('削除に失敗しました:', error);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[200px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-red-500 text-lg">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Todo リスト</h1>
        <Link
          href="/register"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          新規作成
        </Link>
      </div>

      {/* Todoリスト */}
      {todos.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-gray-500 text-lg mb-4">まだTodoがありません</p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
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
                      <div className={`w-3 h-3 rounded-full ${todo.isCompleted ? "bg-green-500" : "bg-gray-300"}`}></div>
                      <h3 className={`text-lg font-semibold ${todo.isCompleted ? "line-through text-gray-500" : "text-gray-900"}`}>
                        {todo.title}
                      </h3>
                    </div>
                    {todo.description && (
                      <p className={`text-gray-600 mb-3 ${todo.isCompleted ? "line-through" : ""}`}>
                        {todo.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
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
                      <button onClick={() => deleteModal.openModal({ id: todo.id, title: todo.title })}>
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
      {/* モーダルは1つだけ */}
      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.closeModal}>
        <div>
          <h3 className="text-lg font-semibold mb-4">削除確認</h3>
          <p className="mb-4">
            「{deleteModal.data?.title}」を削除しますか？
          </p>
          <div className="flex gap-2 justify-end">
            <button
              onClick={deleteModal.closeModal}
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            >
              キャンセル
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              削除
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}