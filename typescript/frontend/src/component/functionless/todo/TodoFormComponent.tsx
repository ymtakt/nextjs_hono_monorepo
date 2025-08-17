'use client';

import { InputText, InputTextArea, SubmitButton } from '@/component/functionless/general';

/**
 * 共通のフォームプロパティ
 */
type BaseTodoFormProps = {
  formActionMethod?: (payload: FormData) => void;
  titleValue?: string;
  descriptionValue?: string;
  completedValue?: boolean;
  titleErrorMessage?: string;
  descriptionErrorMessage?: string;
  completedErrorMessage?: string;
  isPending?: boolean;
};

/**
 * 作成モード用のプロパティ
 * idValueは存在してはいけない
 */
type CreateTodoFormProps = BaseTodoFormProps & {
  mode: 'create';
  idValue?: never;
};

/**
 * 更新モード用のプロパティ
 * idValueは必須
 */
type UpdateTodoFormProps = BaseTodoFormProps & {
  mode: 'update';
  idValue: string;
};

/**
 * 判別共用体による型定義
 * modeの値によってidValueの有無が決まる
 */
type TodoFormComponentProps = CreateTodoFormProps | UpdateTodoFormProps;

/**
 * Todo作成・更新用のフォームコンポーネント
 */
export function TodoFormComponent(props: TodoFormComponentProps) {
  const {
    mode,
    formActionMethod,
    titleValue,
    descriptionValue,
    completedValue,
    titleErrorMessage,
    descriptionErrorMessage,
    completedErrorMessage,
    isPending,
  } = props;
  const title = mode === 'create' ? '新規作成' : '編集画面';

  return (
    <div className="p-8 bg-background">
      <h1 className="text-3xl font-bold text-foreground text-center">{title}</h1>

      <form
        key={JSON.stringify({ titleValue, descriptionValue, completedValue })}
        action={formActionMethod}
        className="flex flex-col space-y-4 max-w-[600px] mx-auto mt-8"
      >
        {/* 
          条件分岐内でprops.idValueにアクセス
          TypeScriptがmode === 'update'の場合にidValueが存在することを保証
        */}
        {mode === 'update' && <input type="hidden" name="todoId" value={props.idValue} />}

        <InputText
          label="Title"
          name="title"
          placeholder="Enter title"
          defaultValue={titleValue}
          errorMessage={titleErrorMessage}
        />

        <InputTextArea
          label="Description"
          name="description"
          placeholder="Enter description"
          defaultValue={descriptionValue}
          errorMessage={descriptionErrorMessage}
        />

        <div className="flex items-center gap-2">
          <label htmlFor="completed" className="text-sm font-medium text-foreground">
            Completed
          </label>
          <input
            type="checkbox"
            name="completed"
            defaultChecked={completedValue}
            className="h-4 w-4 text-primary border-gray-500 rounded"
          />
          {completedErrorMessage && <p className="text-sm text-error">{completedErrorMessage}</p>}
        </div>

        <div className="space-y-2">
          <SubmitButton size="lg" variant="primary" />
          {isPending && (
            <div className="flex items-center justify-center gap-2 text-foreground">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <span className="text-sm">処理中...</span>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
