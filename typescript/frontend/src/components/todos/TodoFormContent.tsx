import { useRouter } from "next/navigation"
import { useState, useActionState } from "react"
import { TodoEntity } from "@/logic/data/todo"
import { apiClient } from "@/lib/apiClient"


// 実際のフォーム部分を分離
export default function TodoFormContent({ todo, id }: { todo: TodoEntity, id: number }) {
    const [title, setTitle] = useState(todo.title)
    const [description, setDescription] = useState(todo.description || '')
    const router = useRouter()

    const formAction = async (prevError: string | null, formData: FormData) => {
        const title = formData.get('title') as string
        const description = formData.get('description') as string

        const res = await apiClient.api.todos[":todoId"].$put({
            param: { todoId: id.toString() },
            json: { title, description, completed: false },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any)
        if (!res.ok) {
            const error = await res.text()
            return error
        }
        router.push('/')
        return null
    }

    const [error, submitAction, isPending] = useActionState(formAction, null)

    return (
        <div className="mt-10">
            <h1 className="text-3xl font-bold text-center">Edit</h1>
            <form action={submitAction} className="flex flex-col gap-2 max-w-[600px] mx-auto mt-10">
                <label htmlFor="title" className="text-sm font-medium">Title</label>
                <input
                    type="text"
                    name="title"
                    className="border-2 border-gray-300 rounded-md p-2"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
                <label htmlFor="description" className="text-sm font-medium">Description</label>
                <input
                    type="text"
                    name="description"
                    className="border-2 border-gray-300 rounded-md p-2"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
                <button disabled={isPending} type="submit" className="bg-blue-500 text-white p-2 rounded-md">
                    Submit
                </button>
                {error && <p className="text-red-500">{error}</p>}
            </form>
        </div>
    );
}