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
 * components/functionless/general/InputText.tsx
 *
 *  - テキスト入力フォーム（conform対応）
 */

type InputTextProps = {
  label: string;
  name: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  defaultValue?: string;
  errorMessage?: string;
};

export function InputText(props: InputTextProps) {
  const { label, placeholder, errorMessage, name, value, onChange, defaultValue } = props;

  return (
    <div className="space-y-2">
      <label htmlFor={name} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <input
        name={name}
        value={value}
        onChange={onChange}
        defaultValue={defaultValue}
        type="text"
        className="w-full p-2 border border-gray-500 rounded-lg bg-background text-foreground"
        placeholder={placeholder}
      />
      {errorMessage && <p className="text-sm text-error">{errorMessage}</p>}
    </div>
  );
}
