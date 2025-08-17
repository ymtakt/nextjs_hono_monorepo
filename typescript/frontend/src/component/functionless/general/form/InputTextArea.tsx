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
  placeholder?: string;
  errorMessage?: string;
  // ✅ conform用のpropsを受け取る
  [key: string]: any; // getTextareaPropsの結果を受け取る
};

export function InputTextArea(props: InputTextAreaProps) {
  const { label, placeholder, errorMessage, ...textareaProps } = props;

  return (
    <div>
      <label htmlFor={textareaProps.id} className="text-sm font-medium">
        {label}
      </label>
      <textarea
        {...textareaProps} // ✅ conformのpropsをそのまま適用
        className="border-2 border-gray-300 rounded-md p-2 w-full"
        placeholder={placeholder}
        rows={4}
      />
      {errorMessage && <p className="text-red-500 text-sm">{errorMessage}</p>}
    </div>
  );
}
