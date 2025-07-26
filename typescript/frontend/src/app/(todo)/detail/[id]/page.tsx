import TodoDetail from "@/components/todos/TodoDetail";

export default async function DetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <TodoDetail id={Number(id)} />;
}
