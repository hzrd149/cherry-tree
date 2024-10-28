export type StatusHandlers = Record<number, (headers: Headers) => Promise<Response>>;
export async function fetchWithHandlers(url: URL, init: RequestInit, handlers: StatusHandlers) {
  const res = await fetch(url, init);
  if (handlers[res.status]) {
    return await handlers[res.status](res.headers);
  }
  return res;
}
