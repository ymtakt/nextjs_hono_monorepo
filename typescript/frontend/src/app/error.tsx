'use client'

import Link from 'next/link'

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  // アプリケーションのエラーの場合

  // if (error instanceof ApplicationError) {
  console.log(error.name)
  if (error.name.startsWith('ApplicationError')) {
    return (
      <>
        <p>{error.message}</p>
        <button type="button" onClick={reset}>
          再読み込み
        </button>
        <Link href="/">
          <button type="button">トップページへ戻る</button>
        </Link>
      </>
    )
  }

  // それ以外の良きせぬエラーの場合
  return (
    <>
      <h1> 予期しないエラーが発生しました</h1>
      <button type="button" onClick={reset}>
        再読み込み
      </button>
      <Link href="/">
        <button type="button">トップページへ戻る</button>
      </Link>
    </>
  )
}
