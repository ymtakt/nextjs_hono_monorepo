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
    <div>
      <label htmlFor={name} className="text-sm font-medium">
        {label}
      </label>
      <input
        name={name}
        value={value}
        onChange={onChange}
        defaultValue={defaultValue}
        type="text"
        className="border-2 border-gray-300 rounded-md p-2 w-full"
        placeholder={placeholder}
      />
      {errorMessage && <p className="text-red-500 text-sm">{errorMessage}</p>}
    </div>
  );
}
