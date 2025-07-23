import TodoForm from "@/components/todos/TodoForm"
import { client } from "@/lib/client"
import { notFound } from "next/navigation"


export default async function EditPage({params}: {params: {id: string}}) {
  
  const id = params.id
  
  console.log("====LOG", id)
  // @ts-expect-error - Hono RPC client type issue  
  const res = await client.api.todos[':id'].$get(
    {
      param: {
        id,
      }
    },
    {
      headers: {
        Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI0IiwiZW1haWwiOiJ5bXRha3QuMTIyOUBnbWFpbC5jb20ifQ.4lMQ2JrpL7PrChQVrDNPfsHuhEPQoJg9lQfwVN8Q488`
      }
    }
  )

  if (!res.ok) {
    notFound()
  }
  
  const data = await res.json()
  const todo = data.todo

  if (!todo) {
    notFound()
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* ヘッダー */}
      <TodoForm id={id} prevTitle={todo.title as string} prevDescription={todo.description as string} />
    </div>
  );
}