import TodoEditForm from "@/components/todos/TodoEditForm";

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <TodoEditForm id={Number(id)} />
    </div>
  );
}
