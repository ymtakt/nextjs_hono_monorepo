"use client";

import { useState, useEffect, useCallback } from "react";

type UseAsyncDataOptions = {
  immediate?: boolean;
  dependencies?: unknown[];
};

export const useAsyncData = <T>(
  asyncFunction: () => Promise<T>,
  options: UseAsyncDataOptions = {},
) => {
  const { immediate = true } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await asyncFunction();
      setData(result);
      return result;
    } catch (err) {
      setError(err as string);
      throw err;
    } finally {
      setLoading(false);
    }
    // TODO: 依存配列の設定が必要かも
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return {
    data,
    loading,
    error,
    execute,
    refetch: execute,
  };
};
