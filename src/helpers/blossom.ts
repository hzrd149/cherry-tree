import { EventTemplate, NostrEvent } from "nostr-tools";

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
