import { useState, useEffect } from "react";
import { BehaviorSubject, type Observable } from "rxjs";

export function useObservable<T extends unknown>(observable?: BehaviorSubject<T>): T;
export function useObservable<T extends unknown>(observable?: Observable<T>): T | undefined;
export function useObservable<T extends unknown>(observable?: Observable<T>): T | undefined {
  const [_count, update] = useState(0);
  const [value, setValue] = useState<T>(observable instanceof BehaviorSubject ? observable.value : undefined);

  useEffect(() => {
    const sub = observable?.subscribe((v) => {
      setValue(v);
      update((c) => c + 1);
    });

    return () => sub?.unsubscribe();
  }, [observable]);

  return value;
}
