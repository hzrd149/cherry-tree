import { useCallback, useState } from "react";

export default function useErrorRecord() {
  const [errors, setErrors] = useState<Record<string, Record<string, Error>>>({});

  const setError = useCallback(
    (hash: string, server: string, error: Error) => {
      setErrors((dir) => ({ ...dir, [hash]: { ...(dir[hash] ?? {}), [server]: error } }));
    },
    [setErrors],
  );
  const reset = useCallback(() => {
    setErrors({});
  }, [setErrors]);

  return [errors, setError, reset] as const;
}
