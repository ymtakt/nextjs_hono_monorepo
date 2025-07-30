// components/base/TodoForm.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { todoFormSchema, TodoFormData } from "@/logic/data/todo";
import { useToast } from "@/logic/hooks/useToast";
import { getErrorMessage } from "@/utils/error-handler";

interface TodoFormProps {
    mode: 'create' | 'edit';
    defaultValues?: Partial<TodoFormData>;
    onSubmit: (data: TodoFormData) => Promise<void>;
}

export function TodoForm({ mode, defaultValues, onSubmit }: TodoFormProps) {
    const toast = useToast();
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<TodoFormData>({
        resolver: zodResolver(todoFormSchema),
        defaultValues: {
            title: defaultValues?.title || "",
            description: defaultValues?.description || "",
        },
    });

    const handleFormSubmit = async (data: TodoFormData) => {
        // zodResolverでバリデーション失敗 → handleFormSubmitは呼ばれない
        // const result = todoFormSchema.safeParse(data);
        // if (!result.success) {
        //     // バリデーションエラーをToastで表示
        //     toast.error(errors.title?.message || errors.description?.message || "");
        //     return;
        // }

        try {
            await onSubmit(data);
        } catch (error) {
            // API エラーもToastで表示
            const message = getErrorMessage(error);
            toast.error(message);
        }
    };


    return (
        <div className="mt-10">
            <h1 className="text-3xl font-bold text-center">
                {mode === 'create' ? 'Register New Todo' : 'Edit'}
            </h1>
            <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-2 max-w-[600px] mx-auto mt-10">
                {/* タイトルフィールド */}
                <label htmlFor="title" className="text-sm font-medium">
                    Title
                </label>
                <input
                    {...register("title")}
                    type="text"
                    className="border-2 border-gray-300 rounded-md p-2"
                />
                {errors.title && (
                    <p className="text-red-500 text-sm">{errors.title.message}</p>
                )}

                {/* 説明フィールド */}
                <label htmlFor="description" className="text-sm font-medium">
                    Description
                </label>
                <input
                    {...register("description")}
                    type="text"
                    className="border-2 border-gray-300 rounded-md p-2"
                />
                {errors.description && (
                    <p className="text-red-500 text-sm">{errors.description.message}</p>
                )}

                <button
                    disabled={isSubmitting}
                    type="submit"
                    className="bg-blue-500 text-white p-2 rounded-md disabled:bg-gray-400"
                >
                    {isSubmitting ? "Submitting..." : "Submit"}
                </button>
            </form>
        </div>
    );
}