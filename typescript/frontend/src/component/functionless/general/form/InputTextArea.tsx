/**
 * components/functionless/xx/xx.tsx
 *
 * 純粋な表示コンポーネント（React Hook Form を知らない）
 *
 *  - Functional Component or Pageから呼び出される
 *  - Reactは出てこない
 *  - 表示内容や振る舞いのみを担う
 *  - 実際の処理やステート管理はFunctional Component or Pageに任せる
 *
 */

/**
 * components/functionless/general/InputTextArea.tsx
 *
 *  - テキストエリア入力フォーム（conform対応）
 */

type InputTextAreaProps = {
  label: string;
  name: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  defaultValue?: string;
  errorMessage?: string;
};

export function InputTextArea(props: InputTextAreaProps) {
  const { label, placeholder, errorMessage, name, value, onChange, defaultValue } = props;

  return (
    <div className="space-y-2">
      <label htmlFor={name} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        defaultValue={defaultValue}
        className="w-full p-2 border border-gray-500 rounded-lg bg-background text-foreground resize-y min-h-[100px]"
        placeholder={placeholder}
        rows={4}
      />
      {errorMessage && <p className="text-sm text-error">{errorMessage}</p>}
    </div>
  );
}
