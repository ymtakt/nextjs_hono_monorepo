'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <>
      <p>Not Found</p>
      <Link href="/">
        <button type="button">トップページへ戻る</button>
      </Link>
    </>
  );
}
