import { notFound } from 'next/navigation';
import { TodoListClientPage } from '@/component/client-page/todo';
import { fetchTodos } from '@/domain/logic/ssr/todo/fetch-todos';

interface PageProps {
  searchParams: Promise<{
    search?: string;
  }>;
}

export default async function Home({ searchParams }: PageProps) {
  const { search } = await searchParams;

  const result = await fetchTodos(search);

  if (result.isErr()) {
    notFound();
  }

  const todos = result.value;

  return (
    <div className="min-h-screen bg-gray-50">
      <TodoListClientPage todos={todos} />
    </div>
  );
}
