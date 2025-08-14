'use client'

import Link from 'next/link'

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
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
