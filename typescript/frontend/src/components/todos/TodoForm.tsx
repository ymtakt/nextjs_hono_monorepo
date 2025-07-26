'use client'

import { useActionState, useState } from "react"
import { apiClient } from "@/lib/apiClient"
import { useRouter } from "next/navigation"

export default function TodoForm({ id, prevTitle, prevDescription }: { id: string, prevTitle: string, prevDescription: string }) {
  const [title, setTitle] = useState(prevTitle)
  const [description, setDescription] = useState(prevDescription)

  const router = useRouter()

  const formAction = async (prevError: string | null, formData: FormData) => {
    const title = formData.get('title') as string
    const description = formData.get('description') as string

    // @ts-expect-error - Hono RPC client type issue  
    const res = await apiClient.api.todos[":id"].$put({
      param: { id },
      json: { title, description },
    }, {
      headers: {
        Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI0IiwiZW1haWwiOiJ5bXRha3QuMTIyOUBnbWFpbC5jb20ifQ.4lMQ2JrpL7PrChQVrDNPfsHuhEPQoJg9lQfwVN8Q488`
      }
    })
    if (!res.ok) {
      const error = await res.text()
      return error
    }
    // 成功時は一覧ページにリダイレクト
    router.push('/')
    return null
  }
  const [error, submitAction, isPending] = useActionState(formAction, null)

  return (
    <div className="mt-10">
      <h1 className="text-3xl font-bold text-center">Edit</h1>
      <form action={submitAction} className="flex flex-col gap-2 max-w-[600px] mx-auto mt-10">
        <label htmlFor="title" className="text-sm font-medium">Title</label>
        <input type="text" name="title" className="border-2 border-gray-300 rounded-md p-2" value={title} onChange={(e) => setTitle(e.target.value)} />
        <label htmlFor="description" className="text-sm font-medium">Description</label>
        <input type="text" name="description" className="border-2 border-gray-300 rounded-md p-2" value={description} onChange={(e) => setDescription(e.target.value)} />
        <button disabled={isPending} type="submit" className="bg-blue-500 text-white p-2 rounded-md">Submit</button>
        {error && <p className="text-red-500">{error}</p>}
      </form>
    </div>
  );
}