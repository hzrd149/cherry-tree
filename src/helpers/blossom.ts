import { EventTemplate, NostrEvent } from "nostr-tools";
import { Chunk } from "./blob";
import { getEncodedTokenV4, Token } from "@cashu/cashu-ts";
import { fetchWithHandlers } from "./fetch";

export type PaymentRequest = {
  amount: number;
  unit: string;
  mints: string[];
  pubkey: string;
};
export type BlossomOptions = {
  signal?: AbortSignal;
  onPayment?: (server: string, blob: Chunk | string, request: PaymentRequest) => Promise<Token>;
  onAuth?: (server: string, blob: Chunk | string) => Promise<NostrEvent>;
};

export function getPaymentRequestFromHeaders(headers: Headers) {
  const header = headers.get("X-Cashu");
  if (!header) throw new Error("Missing cashu header");
  return JSON.parse(atob(header)) as PaymentRequest;
}

export async function uploadBlob(server: string | URL, blob: Chunk, opts?: BlossomOptions): Promise<any> {
  const url = new URL("/upload", server);
  const serverURL = new URL("/", server).toString();

  const res = await fetchWithHandlers(
    url,
    {
      method: "HEAD",
      signal: opts?.signal,
      headers: {
        "X-SHA-256": blob.hash,
        "X-Content-Length": String(blob.size),
        "X-Content-Type": blob.type,
      },
    },
    {
      402: async (headers) => {
        if (!opts?.onPayment) throw new Error("Missing payment handler");
        const request = getPaymentRequestFromHeaders(headers);

        const token = await opts.onPayment(serverURL, blob, request);
        const payment = getEncodedTokenV4(token);

        return fetch(url, {
          signal: opts?.signal,
          method: "PUT",
          body: blob,
          headers: { "X-Cashu": payment },
        });
      },
      403: async (_headers) => {
        if (!opts?.onAuth) throw new Error("Missing auth handler");

        const auth = await opts.onAuth(serverURL, blob);
        const authorization = "Nostr " + btoa(JSON.stringify(auth));

        return fetch(url, {
          signal: opts?.signal,
          method: "PUT",
          body: blob,
          headers: { Authorization: authorization },
        });
      },
    },
  );

  if (res.ok) {
    return (
      await fetch(url, {
        signal: opts?.signal,
        method: "PUT",
        body: blob,
      })
    ).json();
  } else throw new Error(res.headers.get("X-Reason") || (await res.text()));
}

export async function downloadBlob(server: string | URL, hash: string, opts?: BlossomOptions) {
  const url = new URL(hash, server);
  const serverURL = new URL("/", server).toString();

  const res = await fetchWithHandlers(
    url,
    { signal: opts?.signal },
    {
      402: async (headers) => {
        if (!opts?.onPayment) throw new Error("Missing payment handler");
        const request = getPaymentRequestFromHeaders(headers);

        const token = await opts.onPayment(serverURL, hash, request);
        const payment = getEncodedTokenV4(token);

        return fetch(url, { signal: opts?.signal, headers: { "X-Cashu": payment } });
      },
      403: async (_headers) => {
        if (!opts?.onAuth) throw new Error("Missing auth handler");

        const auth = await opts.onAuth(serverURL, hash);
        const authorization = "Nostr " + btoa(JSON.stringify(auth));

        return fetch(url, { signal: opts?.signal, headers: { Authorization: authorization } });
      },
    },
  );

  // throw if request failed
  if (!res.ok) throw new Error(res.headers.get("X-Reason") || (await res.text()));

  return res.blob();
}

export async function createUploadAuth(
  sha256: string,
  signer: (draft: EventTemplate) => Promise<NostrEvent>,
  message = "Upload Blob",
  expiration = Math.round(Date.now()) + 60_000,
) {
  const draft: EventTemplate = {
    kind: 24242,
    content: message,
    created_at: Math.round(Date.now() / 1000),
    tags: [
      ["t", "upload"],
      ["expiration", String(expiration)],
    ],
  };

  draft.tags.push(["x", sha256]);

  return await signer(draft);
}
